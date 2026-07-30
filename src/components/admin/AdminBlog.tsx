'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Search, Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, formatNumber, formatDate, toSlug } from '@/lib/admin-utils';

interface BlogPost {
  id: number; title: string; slug: string; excerpt: string; content: string;
  categoryId: number; coverImage: string | null; readTime: number;
  published: boolean; createdAt: string;
  category: { id: number; name: string; slug: string };
}

interface BlogCat { id: number; name: string; slug: string; }

const emptyForm = { title: '', slug: '', excerpt: '', content: '', categoryId: '', coverImage: '', readTime: '5', published: true };

export function AdminBlog({ token }: { token: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [blogCats, setBlogCats] = useState<BlogCat[]>([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limit = 15;

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit), q });
      const res = await adminFetch(token, `/api/admin/blog?${params}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setPosts(data.posts || []);
      setTotal(data.total || 0);
    } catch { toast.error('خطا'); }
    finally { setLoading(false); }
  }, [token, page, q]);

  const loadCats = useCallback(async () => {
    try {
      const res = await adminFetch(token, '/api/admin/blog-categories');
      const data = await res.json();
      if (data.categories) setBlogCats(data.categories);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadCats(); }, [loadCats]);
  useEffect(() => { loadPosts(); }, [loadPosts]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (p: BlogPost) => {
    setEditing(p);
    setForm({
      title: p.title, slug: p.slug, excerpt: p.excerpt, content: p.content,
      categoryId: String(p.categoryId), coverImage: p.coverImage || '',
      readTime: String(p.readTime), published: p.published,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.categoryId || !form.content) {
      toast.error('عنوان، محتوا و دسته‌بندی الزامی هستند');
      return;
    }
    setSaving(true);
    try {
      const body: any = {
        ...form,
        slug: form.slug || toSlug(form.title),
        categoryId: parseInt(form.categoryId),
        readTime: parseInt(form.readTime) || 5,
      };

      let res;
      if (editing) {
        res = await adminFetch(token, `/api/admin/blog/${editing.id}`, { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await adminFetch(token, '/api/admin/blog', { method: 'POST', body: JSON.stringify(body) });
      }
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(editing ? 'بروزرسانی شد' : 'ایجاد شد');
      setDialogOpen(false);
      loadPosts();
    } catch { toast.error('خطا'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(token, `/api/admin/blog/${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('حذف شد');
      setDeleteTarget(null);
      loadPosts();
    } catch { toast.error('خطا'); }
    finally { setDeleting(false); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="جستجوی مقاله..." value={q} onChange={e => { setQ(e.target.value); setPage(1); }} className="pr-10" />
        </div>
        <Button onClick={openCreate} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> مقاله جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">شناسه</th>
                    <th className="text-right py-3 px-3 font-medium">عنوان</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">دسته‌بندی</th>
                    <th className="text-center py-3 px-3 font-medium">وضعیت</th>
                    <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">تاریخ</th>
                    <th className="text-center py-3 px-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {posts.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">مقاله‌ای یافت نشد</td></tr>
                  )}
                  {posts.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-muted-foreground">#{p.id}</td>
                      <td className="py-2.5 px-3 font-medium max-w-[250px] truncate">{p.title}</td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-gray-600">{p.category.name}</td>
                      <td className="py-2.5 px-3 text-center">
                        {p.published
                          ? <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">منتشر شده</Badge>
                          : <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">پیش‌نویس</Badge>
                        }
                      </td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-muted-foreground text-xs">{formatDate(p.createdAt)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">صفحه {page} از {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش مقاله' : 'مقاله جدید'}</DialogTitle>
            <DialogDescription>محتوای مقاله را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>عنوان *</Label>
              <Input
                value={form.title}
                onChange={e => { setForm(f => ({ ...f, title: e.target.value })); if (!editing) setForm(ff => ({ ...ff, slug: toSlug(e.target.value) })); }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>اسلاگ</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} dir="ltr" />
              </div>
              <div className="space-y-2">
                <Label>زمان مطالعه (دقیقه)</Label>
                <Input type="number" value={form.readTime} onChange={e => setForm(f => ({ ...f, readTime: e.target.value }))} dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>لید (خلاصه)</Label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>دسته‌بندی *</Label>
              <Select value={form.categoryId} onValueChange={v => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                <SelectContent>
                  {blogCats.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تصویر کاور</Label>
              <div className="flex items-start gap-3">
                <div className="w-32 h-20 rounded-lg bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.coverImage ? (
                    <img src={form.coverImage} alt="کاور" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-gray-300" />
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploading(true);
                      try {
                        const fd = new FormData();
                        fd.append('file', file);
                        const res = await fetch('/api/admin/blog/upload', {
                        method: 'POST',
                        body: fd,
                        headers: { 'Authorization': `Bearer ${token}` },
                      });
                        const data = await res.json();
                        if (data.error) { toast.error(data.error); return; }
                        setForm(f => ({ ...f, coverImage: data.url }));
                        toast.success('تصویر کاور آپلود شد');
                      } catch { toast.error('خطا در آپلود'); }
                      finally { setUploading(false); e.target.value = ''; }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? <><Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> در حال آپلود...</> : <><Upload className="w-3.5 h-3.5 ml-1" /> آپلود تصویر</>}
                  </Button>
                  {form.coverImage && (
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, coverImage: '' }))}
                      className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> حذف تصویر
                    </button>
                  )}
                  <p className="text-[11px] text-gray-400">PNG, JPG, WebP — حداکثر ۳ مگابایت</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>محتوا (HTML) *</Label>
              <Textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={12}
                className="font-mono text-sm"
                dir="ltr"
                placeholder="<h2>عنوان</h2><p>متن...</p>"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.published} onCheckedChange={v => setForm(f => ({ ...f, published: v }))} />
              <Label>انتشار</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#16233F] hover:bg-[#1e2d4d]">
              {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editing ? 'بروزرسانی' : 'ایجاد مقاله'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف &laquo;{deleteTarget?.title}&raquo; اطمینان دارید؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />} حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}