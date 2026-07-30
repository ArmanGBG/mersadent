'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Award, Loader2, Upload, X, Eye, EyeOff, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, toSlug } from '@/lib/admin-utils';

interface Brand {
  id: number; name: string; slug: string;
  logo: string | null; visible: boolean;
  _count: { products: number };
}
const emptyForm = { name: '', slug: '' };

export function AdminBrands({ token }: { token: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // brand id being uploaded
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(token, '/api/admin/brands');
      const data = await res.json();
      if (data.brands) setBrands(data.brands);
    } catch { toast.error('خطا در دریافت برندها'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (b: Brand) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('نام الزامی است'); return; }
    setSaving(true);
    try {
      const body: any = { name: form.name, slug: form.slug || toSlug(form.name) };
      let res;
      if (editing) {
        body.id = editing.id;
        body.logo = editing.logo;
        body.visible = editing.visible;
        res = await adminFetch(token, '/api/admin/brands', { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await adminFetch(token, '/api/admin/brands', { method: 'POST', body: JSON.stringify(body) });
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
      const res = await adminFetch(token, `/api/admin/brands?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('حذف شد');
      setDeleteTarget(null);
      load();
    } catch { toast.error('خطا'); }
    finally { setDeleting(false); }
  };

  const toggleVisible = async (b: Brand) => {
    try {
      const res = await adminFetch(token, '/api/admin/brands', {
        method: 'PUT',
        body: JSON.stringify({ id: b.id, name: b.name, visible: !b.visible }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(b.visible ? 'از صفحه برندها مخفی شد' : 'در صفحه برندها نمایش داده می‌شود');
      load();
    } catch { toast.error('خطا'); }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Determine brandId - use editing if dialog is open, or prompt
    const brandId = editing?.id;
    if (!brandId) {
      toast.error('ابتدا برند را ذخیره کنید');
      return;
    }

    setUploading(String(brandId));
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('brandId', String(brandId));
      const res = await fetch('/api/admin/brands/upload', {
        method: 'POST',
        body: fd,
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('لوگو آپلود شد');
      // Update editing brand's logo
      if (editing) {
        setEditing({ ...editing, logo: data.url });
      }
      load();
    } catch { toast.error('خطا در آپلود لوگو'); }
    finally { setUploading(null); e.target.value = ''; }
  };

  const removeLogo = async () => {
    if (!editing) return;
    try {
      const res = await adminFetch(token, '/api/admin/brands', {
        method: 'PUT',
        body: JSON.stringify({ id: editing.id, name: editing.name, logo: null }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setEditing({ ...editing, logo: null });
      toast.success('لوگو حذف شد');
      load();
    } catch { toast.error('خطا'); }
  };

  const visibleCount = brands.filter(b => b.visible).length;
  const hiddenCount = brands.length - visibleCount;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-white rounded-lg border px-4 py-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-gray-600">کل برندها:</span>
          <span className="font-bold">{brands.length}</span>
        </div>
        <div className="bg-white rounded-lg border px-4 py-3 flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-500" />
          <span className="text-sm text-gray-600">نمایش داده شده:</span>
          <span className="font-bold text-emerald-600">{visibleCount}</span>
        </div>
        <div className="bg-white rounded-lg border px-4 py-3 flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600">مخفی:</span>
          <span className="font-bold text-gray-500">{hiddenCount}</span>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={openCreate} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> برند جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">لوگو</th>
                    <th className="text-right py-3 px-3 font-medium">نام برند</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">اسلاگ</th>
                    <th className="text-center py-3 px-3 font-medium">تعداد محصولات</th>
                    <th className="text-center py-3 px-3 font-medium">نمایش</th>
                    <th className="text-center py-3 px-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map(b => (
                    <tr key={b.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${!b.visible ? 'opacity-50' : ''}`}>
                      <td className="py-2.5 px-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                          {b.logo ? (
                            <img src={b.logo} alt={b.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-300" />
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-medium flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        <span>{b.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 text-xs hidden md:table-cell" dir="ltr">{b.slug}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant="secondary" className="text-xs">{b._count.products}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Switch
                          checked={b.visible}
                          onCheckedChange={() => toggleVisible(b)}
                          className="mx-auto"
                        />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(b)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => setDeleteTarget(b)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش برند' : 'برند جدید'}</DialogTitle>
            <DialogDescription>اطلاعات برند را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Logo upload section */}
            {editing && (
              <div className="space-y-2">
                <Label>لوگو برند</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {editing.logo ? (
                      <img src={editing.logo} alt={editing.name} className="w-full h-full object-contain p-1" />
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
                      onChange={handleLogoUpload}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={uploading === String(editing.id)}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploading === String(editing.id) ? (
                        <><Loader2 className="w-3.5 h-3.5 ml-1 animate-spin" /> در حال آپلود...</>
                      ) : (
                        <><Upload className="w-3.5 h-3.5 ml-1" /> آپلود لوگو</>
                      )}
                    </Button>
                    {editing.logo && (
                      <button
                        onClick={removeLogo}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> حذف لوگو
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">فرمت‌های مجاز: PNG, JPG, WebP, SVG — حداکثر ۲ مگابایت</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>نام برند *</Label>
              <Input
                value={form.name}
                onChange={e => {
                  setForm(f => ({ ...f, name: e.target.value }));
                  if (!editing) setForm(ff => ({ ...ff, slug: toSlug(e.target.value) }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>اسلاگ</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} dir="ltr" />
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف برند</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف برند &laquo;{deleteTarget?.name}&raquo; اطمینان دارید؟</AlertDialogDescription>
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