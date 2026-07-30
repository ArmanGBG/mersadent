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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragOverlay, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable, useDroppable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronLeft, FolderOpen, Loader2,
  GripVertical, Eye, EyeOff, ArrowDown, ArrowUp, ListTree, ImagePlus, X,
} from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, toSlug } from '@/lib/admin-utils';

interface CategoryNode {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  visible?: boolean;
  image?: string | null;
  children?: CategoryNode[];
  _count?: { products: number; children: number };
  totalProducts?: number; // aggregated: own + all descendants' products
}

interface FlatCat {
  id: number;
  name: string;
  slug: string;
  parentId: number | null;
  order: number;
  visible?: boolean;
  image?: string | null;
  _count?: { products: number; children: number };
  totalProducts?: number; // aggregated: own + all descendants' products
}

const emptyForm = { name: '', slug: '', parentId: '', visible: true, image: '' as string | null };

export function AdminCategories({ token }: { token: string }) {
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [flat, setFlat] = useState<FlatCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryNode | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CategoryNode | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  // Build a map from flat list for resolving parent names (context banner)
  const nameMap = new Map<number, string>();
  flat.forEach(c => nameMap.set(c.id, c.name));

  const resolveParentName = (parentId: string | number | null | undefined): string | null => {
    if (!parentId) return null;
    return nameMap.get(Number(parentId)) || null;
  };

  const openCreate = (parentId?: number) => {
    setEditing(null);
    setForm({ ...emptyForm, parentId: parentId ? String(parentId) : '' });
    setDialogOpen(true);
  };

  const openEdit = (c: CategoryNode) => {
    setEditing(c);
    setForm({
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ? String(c.parentId) : '',
      visible: c.visible !== false,
      image: c.image || '',
    });
    setDialogOpen(true);
  };

  // ---- Image upload ----
  const handleImageUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۲ مگابایت باشد');
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      if (editing) fd.append('categoryId', String(editing.id));
      const res = await fetch('/api/admin/categories/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setForm(f => ({ ...f, image: data.url }));
      toast.success('تصویر آپلود شد');
    } catch {
      toast.error('خطا در آپلود تصویر');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (editing && form.image) {
      // Persist null to the DB for existing categories
      try {
        await adminFetch(token, '/api/admin/categories', {
          method: 'PUT',
          body: JSON.stringify({ id: editing.id, name: form.name, image: null }),
        });
      } catch {
        // ignore — local state is still cleared
      }
    }
    setForm(f => ({ ...f, image: '' }));
    toast.success('تصویر حذف شد');
  };

  const handleSave = async () => {
    if (!form.name) { toast.error('نام الزامی است'); return; }
    setSaving(true);
    try {
      const body: any = {
        name: form.name,
        slug: form.slug || toSlug(form.name),
        parentId: form.parentId ? parseInt(form.parentId) : null,
        visible: form.visible,
        image: form.image || null,
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

  const expandAll = () => {
    const ids = new Set<number>();
    const collect = (nodes: CategoryNode[]) => {
      nodes.forEach(n => {
        if (n.children && n.children.length > 0) {
          ids.add(n.id);
          collect(n.children);
        }
      });
    };
    collect(categories);
    setExpanded(ids);
  };

  const collapseAll = () => setExpanded(new Set());

  // Expand ONLY the full sub-tree of a single main category (collapses everything else first).
  // Recursively collects all descendant IDs of the chosen root and adds them to `expanded`.
  const expandSubtree = (rootId: number) => {
    const ids = new Set<number>();
    const collect = (node: CategoryNode | undefined | null) => {
      if (!node) return;
      if (node.children && node.children.length > 0) {
        ids.add(node.id);
        node.children.forEach(collect);
      }
    };
    const root = categories.find(c => c.id === rootId);
    collect(root);
    setExpanded(ids);
  };

  // Toggle visibility with cascade handled on the backend
  const toggleVisible = async (c: CategoryNode) => {
    const newVal = !(c.visible !== false);
    // Optimistic local update
    const patchTree = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.map(n => {
        if (n.id === c.id) {
          return { ...n, visible: newVal, children: n.children?.map(ch => ({ ...ch, visible: newVal })) };
        }
        if (n.children) return { ...n, children: patchTree(n.children) };
        return n;
      });
    setCategories(prev => patchTree(prev));
    try {
      const res = await adminFetch(token, '/api/admin/categories', {
        method: 'PUT',
        body: JSON.stringify({ id: c.id, name: c.name, visible: newVal }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        load();
        return;
      }
      toast.success(newVal ? 'نمایش داده شد' : 'از نمایش خارج شد');
      load();
    } catch {
      toast.error('خطا');
      load();
    }
  };

  // ---- Drag & Drop reorder ----
  const persistOrder = async (items: { id: number; order: number; parentId: number | null }[]) => {
    setReordering(true);
    try {
      const res = await adminFetch(token, '/api/admin/categories', {
        method: 'PATCH',
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); load(); return; }
    } catch {
      toast.error('خطا در ذخیره ترتیب');
      load();
    } finally {
      setReordering(false);
    }
  };

  const handleDragStart = (e: DragStartEvent) => {
    setActiveDragId(Number(e.active.id));
  };

  // Reorder among siblings (same parent)
  const handleDragEnd = (e: DragEndEvent, siblings: CategoryNode[], parentId: number | null) => {
    setActiveDragId(null);
    const { active, over } = e;
    if (!over || active.id === over.id) return;

    const oldIndex = siblings.findIndex(c => c.id === active.id);
    const newIndex = siblings.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(siblings, oldIndex, newIndex);

    // Update local state for this level
    const updateLevel = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.map(n => {
        if (n.id === parentId) {
          return { ...n, children: reordered };
        }
        if (n.children) return { ...n, children: updateLevel(n.children) };
        return n;
      });

    if (parentId === null) {
      setCategories(reordered);
    } else {
      setCategories(prev => updateLevel(prev));
    }

    // Persist new order + parentId for all moved siblings
    const payload = reordered.map((c, idx) => ({
      id: c.id,
      order: idx,
      parentId,
    }));
    persistOrder(payload);
  };

  const moveLevel = (c: CategoryNode, direction: 'up' | 'down') => {
    // Find siblings in the tree
    const findSiblings = (nodes: CategoryNode[], parentId: number | null): CategoryNode[] | null => {
      if (parentId === null) return nodes;
      for (const n of nodes) {
        if (n.id === parentId) return n.children || [];
        if (n.children) {
          const found = findSiblings(n.children, parentId);
          if (found) return found;
        }
      }
      return null;
    };
    const siblings = findSiblings(categories, c.parentId);
    if (!siblings) return;
    const idx = siblings.findIndex(s => s.id === c.id);
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= siblings.length) return;
    const reordered = arrayMove(siblings, idx, newIdx);
    const updateLevel = (nodes: CategoryNode[]): CategoryNode[] =>
      nodes.map(n => {
        if (n.id === c.parentId) return { ...n, children: reordered };
        if (n.children) return { ...n, children: updateLevel(n.children) };
        return n;
      });
    if (c.parentId === null) setCategories(reordered);
    else setCategories(prev => updateLevel(prev));
    persistOrder(reordered.map((cc, i) => ({ id: cc.id, order: i, parentId: c.parentId })));
  };

  const parents = flat.filter(c => c.parentId === null);

  // ---- Sortable row ----
  const SortableRow = ({ c, depth }: { c: CategoryNode; depth: number }) => {
    const {
      attributes, listeners, setNodeRef, transform, transition, isDragging,
    } = useSortable({ id: c.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.4 : 1,
    };

    const hasChildren = (c._count?.children || 0) > 0;
    const isVisible = c.visible !== false;

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`flex items-center border-b last:border-0 group ${!isVisible ? 'bg-gray-50/60' : 'hover:bg-gray-50/50'}`}
      >
        <div
          className="flex items-center gap-2 flex-1 py-2.5 px-3 min-w-0"
          style={{ paddingRight: `${12 + depth * 22}px` }}
        >
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none"
            aria-label="جابجایی"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          {hasChildren ? (
            <button onClick={() => toggleExpand(c.id)} className="text-muted-foreground hover:text-foreground">
              {expanded.has(c.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          {c.image ? (
            <img src={c.image} alt={c.name} className="w-6 h-6 rounded-md object-cover flex-shrink-0 border border-gray-200" />
          ) : (
            <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isVisible ? 'text-amber-500' : 'text-gray-300'}`} />
          )}
          <span className={`font-medium truncate ${!isVisible ? 'text-gray-400 line-through' : ''}`}>{c.name}</span>
          {!isVisible && (
            <Badge variant="outline" className="text-[10px] text-gray-400 border-gray-300 bg-gray-50">پنهان</Badge>
          )}
        </div>
        <div className="py-2.5 px-3 text-gray-500 text-xs hidden md:block min-w-[120px]" dir="ltr">{c.slug}</div>
        <div className="py-2.5 px-3 text-center min-w-[60px]">{c.totalProducts ?? c._count?.products ?? 0}</div>
        <div className="py-2.5 px-3 text-center min-w-[60px]">{c._count?.children || 0}</div>
        <div className="py-2.5 px-3 flex items-center justify-center min-w-[60px]">
          <Switch
            checked={isVisible}
            onCheckedChange={() => toggleVisible(c)}
            aria-label="نمایش/پنهان"
          />
        </div>
        <div className="py-2.5 px-3 flex items-center justify-center gap-1 min-w-[150px]">
          <button
            onClick={() => moveLevel(c, 'up')}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="بالا"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => moveLevel(c, 'down')}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600"
            title="پایین"
          >
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
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
      </div>
    );
  };

  // ---- Render a level (siblings) with its own DndContext ----
  const renderLevel = (siblings: CategoryNode[], parentId: number | null, depth: number) => {
    const ids = siblings.map(s => s.id);
    return (
      <DndContext
        key={`level-${parentId ?? 'root'}`}
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={(e) => handleDragEnd(e, siblings, parentId)}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          {siblings.map(c => (
            <div key={c.id}>
              <SortableRow c={c} depth={depth} />
              {expanded.has(c.id) && c.children && c.children.length > 0 && (
                renderLevel(c.children, c.id, depth + 1)
              )}
            </div>
          ))}
        </SortableContext>
      </DndContext>
    );
  };

  // Context banner: parent chain
  const contextName = resolveParentName(form.parentId);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="w-4 h-4 ml-1" /> باز کردن همه
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronLeft className="w-4 h-4 ml-1" /> بستن همه
          </Button>
          {/* Expand only one main category's subtree */}
          <div className="flex items-center gap-1.5">
            <ListTree className="w-4 h-4 text-muted-foreground" />
            <Select
              value=""
              onValueChange={(v) => {
                if (v) expandSubtree(Number(v));
              }}
            >
              <SelectTrigger className="h-8 w-[200px] text-xs" size="sm">
                <SelectValue placeholder="باز کردن فقط یک دسته..." />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {categories.map(c => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {reordering && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> در حال ذخیره ترتیب...
            </span>
          )}
        </div>
        <Button onClick={() => openCreate()} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> دسته‌بندی جدید
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">دسته‌بندی‌ای وجود ندارد</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Header */}
              <div className="flex items-center border-b bg-gray-50 text-muted-foreground">
                <div className="flex-1 py-3 px-3 font-medium text-sm">نام</div>
                <div className="py-3 px-3 font-medium text-sm hidden md:block min-w-[120px]">اسلاگ</div>
                <div className="py-3 px-3 font-medium text-sm text-center min-w-[60px]">محصولات</div>
                <div className="py-3 px-3 font-medium text-sm text-center min-w-[60px]">زیردسته</div>
                <div className="py-3 px-3 font-medium text-sm text-center min-w-[60px]">نمایش</div>
                <div className="py-3 px-3 font-medium text-sm text-center min-w-[150px]">عملیات</div>
              </div>
              {renderLevel(categories, null, 0)}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground leading-6">
        برای تغییر ترتیب، دسته‌بندی‌ها را با grip (دکمه کناری) بکشید و رها کنید، یا از فلش‌های بالا/پایین استفاده کنید.
        با غیرفعال کردن نمایش یک دسته، تمام زیردسته‌های آن نیز از سایت پنهان می‌شوند (اما از دیتابیس حذف نمی‌شوند).
      </p>

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش دسته‌بندی' : 'دسته‌بندی جدید'}</DialogTitle>
            <DialogDescription>{editing ? 'اطلاعات را ویرایش کنید' : 'دسته‌بندی جدید ایجاد کنید'}</DialogDescription>
          </DialogHeader>

          {/* Context banner */}
          {contextName && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-amber-800">
                در حال افزودن زیردسته به: <strong>{contextName}</strong>
              </span>
            </div>
          )}
          {editing && editing.parentId && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="text-blue-800">
                ویرایش زیردسته‌ی: <strong>{resolveParentName(editing.parentId)}</strong>
              </span>
            </div>
          )}
          {!contextName && !editing && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 flex items-center gap-2 text-sm">
              <FolderOpen className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span className="text-emerald-800">
                در حال افزودن <strong>دسته‌بندی اصلی</strong>
              </span>
            </div>
          )}

          <div className="space-y-4 mt-2">
            {/* Category image upload */}
            <div className="space-y-2">
              <Label>تصویر / لوگو دسته‌بندی</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-40 h-40 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {form.image ? (
                    <>
                      <img src={form.image} alt="پیش‌نمایش" className="w-full h-full object-contain p-2" />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 shadow"
                        aria-label="حذف تصویر"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <FolderOpen className="w-12 h-12 text-gray-300" />
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImageUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <><Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> در حال آپلود...</>
                    ) : form.image ? (
                      <><ImagePlus className="w-4 h-4 ml-1.5" /> تغییر تصویر</>
                    ) : (
                      <><ImagePlus className="w-4 h-4 ml-1.5" /> آپلود تصویر</>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    فرمت‌های مجاز: PNG, JPG, WebP, SVG, GIF (حداکثر ۲ مگابایت).
                    {!editing && form.image && ' هنگام ذخیره دسته ثبت می‌شود.'}
                  </p>
                </div>
              </div>
            </div>

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
            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
              <div className="space-y-0.5">
                <Label htmlFor="cat-visible" className="cursor-pointer">نمایش در سایت</Label>
                <p className="text-xs text-muted-foreground">
                  در صورت غیرفعال کردن، این دسته و تمام زیردسته‌هایش از سایت پنهان می‌شوند.
                </p>
              </div>
              <Switch
                id="cat-visible"
                checked={form.visible}
                onCheckedChange={v => setForm(f => ({ ...f, visible: v }))}
              />
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
