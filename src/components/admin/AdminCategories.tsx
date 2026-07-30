'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, ChevronDown, ChevronLeft, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, toSlug } from '@/lib/admin-utils';

interface CategoryNode {
  id: number; name: string; slug: string; parentId: number | null;
  order: number; children?: CategoryNode[];
  _count?: { products: number; children: number };
}

const emptyForm = { name: '', slug: '', parentId: '', order: '0' };

export function AdminCategories({ token }: { token: string }) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [flat, setFlat] = useState<CategoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, flatRes] = await Promise.all([
        adminFetch(token, '/api/admin/categories'),
        adminFetch(token, '/api/admin/categories?flat=true'),
      ]);
      const treeData = await treeRes.json();
      const flatData = await flatRes.json();
      if (treeData.categories) setCategories(treeData.categories);
      if (flatData.categories) setFlat(flatData.categories);
    } catch { toast.error('خطا در دریافت دسته‌بندی‌ها'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const openCreate = (parentId?: number) => {
    setEditing(null);
    setForm({ ...emptyForm, parentId: parentId ? String(parentId) : '' });
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryNode) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, parentId: c.parentId ? String(c.parentId) : '', order: String(c.order) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('نام الزامی است'); return; }
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        slug: form.slug || toSlug(form.name),
        order: parseInt(form.order) || 0,
        parentId: form.parentId ? parseInt(form.parentId) : null,
      };

      let res;
      if (editing) {
        body.id = editing.id;
        res = await adminFetch(token, '/api/admin/categories', { method: 'PUT', body: JSON.stringify(body) });
      } else {
        res = await adminFetch(token, '/api/admin/categories', { method: 'POST', body: JSON.stringify(body) });
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
      const res = await adminFetch(token, `/api/admin/categories?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('حذف شد');
      setDeleteTarget(null);
      load();
    } catch { toast.error('خطا'); }
    finally { setDeleting(false); }
  };

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const parents = flat.filter(c => c.parentId === null);

  const renderRow = (c: CategoryNode, depth: number = 0) => (
    <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50/50">
      <td className="py-2.5 px-3">
        <div className="flex items-center gap-2" style={{ paddingRight: depth * 20 }}>
          {c._count && c._count.children > 0 ? (
            <button onClick={() => toggleExpand(c.id)} className="text-muted-foreground hover:text-foreground">
              {expanded.has(c.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <FolderOpen className="w-4 h-4 text-amber-500" />
          <span className="font-medium">{c.name}</span>
        </div>
      </td>
      <td className="py-2.5 px-3 text-gray-500 text-xs" dir="ltr">{c.slug}</td>
      <td className="py-2.5 px-3 text-center">{c._count?.products || 0}</td>
      <td className="py-2.5 px-3 text-center">{c._count?.children || 0}</td>
      <td className="py-2.5 px-3 text-center">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => openCreate(c.id)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600" title="افزودن زیردسته">
            <Plus className="w-4 h-4" />
          </button>
          <button onClick={() => openEdit(c)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600">
            <Pencil className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-end">
        <Button onClick={() => openCreate()} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">نام</th>
                    <th className="text-right py-3 px-3 font-medium">اسلاگ</th>
                    <th className="text-center py-3 px-3 font-medium">محصولات</th>
                    <th className="text-center py-3 px-3 font-medium">زیردسته</th>
                    <th className="text-center py-3 px-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <>
                      {renderRow(cat)}
                      {expanded.has(cat.id) && cat.children?.map(child => renderRow(child, 1))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
            <DialogDescription>{editing ? 'اطلاعات را ویرایش کنید' : 'دسته‌بندی جدید ایجاد کنید'}</DialogDescription>
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
              <Label>دسته والد</Label>
              <select
                value={form.parentId}
                onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm"
              >
                <option value="">بدون والد (دسته اصلی)</option>
                {parents.filter(p => p.id !== editing?.id).map(p => (
                  <option key={p.id} value={String(p.id)}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>ترتیب نمایش</Label>
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

      {/* Delete */}
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