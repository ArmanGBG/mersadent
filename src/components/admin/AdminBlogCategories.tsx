'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, FolderCog, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, toSlug } from '@/lib/admin-utils';

interface BlogCat { id: number; name: string; slug: string; description: string | null; order: number; _count: { posts: number }; }
const emptyForm = { name: '', slug: '', description: '', order: '0' };

export function AdminBlogCategories({ token }: { token: string }) {
  const [cats, setCats] = useState<BlogCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BlogCat | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BlogCat | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(token, '/api/admin/blog-categories');
      const data = await res.json();
      if (data.categories) setCats(data.categories);
    } catch { toast.error('خطا'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (c: BlogCat) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description || '', order: String(c.order) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('نام الزامی است'); return; }
    setSaving(true);
    try {
      const body: any = { name: form.name, slug: form.slug || toSlug(form.name), description: form.description || null, order: parseInt(form.order) || 0 };
      let res;
      if (editing) {
        body.id = editing.id;
        res = await adminFetch(token, '/api/admin/blog-categories', { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await adminFetch(token, '/api/admin/blog-categories', { method: 'POST', body: JSON.stringify(body) });
      }
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(editing ? 'بروزرسانی شد' : 'ایجاد شد');
      setDialogOpen(false);
      load();
    } catch { toast.error('خطا'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(token, `/api/admin/blog-categories?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('حذف شد');
      setDeleteTarget(null);
      load();
    } catch { toast.error('خطا'); }
    finally { setDeleting(false); }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">شناسه</th>
                    <th className="text-right py-3 px-3 font-medium">نام</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">توضیحات</th>
                    <th className="text-center py-3 px-3 font-medium">مقالات</th>
                    <th className="text-center py-3 px-3 font-medium">ترتیب</th>
                    <th className="text-center py-3 px-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {cats.map(c => (
                    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
                      <td className="py-2.5 px-3 text-muted-foreground">#{c.id}</td>
                      <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                        <FolderCog className="w-4 h-4 text-purple-500" /> {c.name}
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-gray-500 text-xs truncate max-w-[200px]">{c.description}</td>
                      <td className="py-2.5 px-3 text-center">{c._count.posts}</td>
                      <td className="py-2.5 px-3 text-center">{c.order}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
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

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>نام *</Label>
              <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (!editing) setForm(ff => ({ ...ff, slug: toSlug(e.target.value) })); }} />
            </div>
            <div className="space-y-2">
              <Label>اسلاگ</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>توضیحات</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} />
            </div>
            <div className="space-y-2">
              <Label>ترتیب</Label>
              <Input type="number" value={form.order} onChange={e => setForm(f => ({ ...f, order: e.target.value }))} dir="ltr" />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#16233F] hover:bg-[#1e2d4d]">
              {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editing ? 'بروزرسانی' : 'ایجاد'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف &laquo;{deleteTarget?.name}&raquo; اطمینان دارید؟</AlertDialogDescription>
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