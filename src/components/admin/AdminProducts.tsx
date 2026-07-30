'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search, Plus, Pencil, Trash2, Upload, X, ChevronLeft, ChevronRight, ImageIcon, Loader2, Wand2, FileText, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, formatNumber, toSlug } from '@/lib/admin-utils';
import { parseSuperPrompt } from '@/lib/parse-super-prompt';
import { SearchableSelect } from './SearchableSelect';
import { CategoryCascader } from './CategoryCascader';

interface AdminProduct {
  id: number; name: string; slug: string; model: string | null;
  price: number | null; priceType: string; availability: string;
  specs: string | null;
  featured: boolean; visible: boolean; order: number; discountPercent: number;
  description: string | null;
  strengths: string | null;
  weaknesses: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string | null;
  sku: string | null;
  country: string | null;
  warranty: string | null;
  weight: string | null;
  productType: string | null;
  typeFields: string | null;
  customSpecs: string | null;
  category: { id: number; name: string; slug: string };
  brand: { id: number; name: string; slug: string };
  _count: { images: number };
}

interface SimpleCategory { id: number; name: string; slug: string; parentId: number | null; }
interface SimpleBrand { id: number; name: string; slug: string; }
interface SimpleCountry { id: number; name: string; }

// Type-specific field shapes (all optional)
interface DeviceFields { exactModel?: string; keySpecs?: string; autoclavable?: boolean }
interface MaterialFields { packSize?: string; curingType?: string; expiryDate?: string }
interface ToolFields { material?: string; packageContents?: string }
interface ConsumableFields { size?: string; material?: string; perPack?: string }
type TypeFields = DeviceFields & MaterialFields & ToolFields & ConsumableFields

interface CustomSpec { label: string; value: string }

interface ProductForm {
  name: string; slug: string; model: string; price: string; priceType: string;
  availability: string; categoryId: string; brandId: string;
  featured: boolean; visible: boolean; discountPercent: string;
  description: string; strengths: string[]; weaknesses: string[];
  metaTitle: string; metaDescription: string; keywords: string;
  sku: string; country: string; warranty: string; weight: string;
  productType: string; typeFields: TypeFields;
  customSpecs: CustomSpec[];
}

const emptyProduct: ProductForm = {
  name: '', slug: '', model: '', price: '', priceType: 'fixed', availability: 'in_stock',
  categoryId: '', brandId: '', featured: false, visible: true, discountPercent: '0',
  description: '', strengths: [], weaknesses: [], metaTitle: '', metaDescription: '', keywords: '',
  sku: '', country: '', warranty: '', weight: '',
  productType: '', typeFields: {}, customSpecs: [],
};

export function AdminProducts({ token }: { token: string }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const [categories, setCategories] = useState<SimpleCategory[]>([]);
  const [brands, setBrands] = useState<SimpleBrand[]>([]);
  const [countries, setCountries] = useState<SimpleCountry[]>([]);

  // Inline "add country" state
  const [addingCountry, setAddingCountry] = useState(false);
  const [newCountryName, setNewCountryName] = useState('');
  const [savingCountry, setSavingCountry] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductForm>({ ...emptyProduct });
  const [saving, setSaving] = useState(false);

  // Super-prompt state
  const [superPromptText, setSuperPromptText] = useState('');
  const [parsing, setParsing] = useState(false);

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image dialog
  const [imageProduct, setImageProduct] = useState<AdminProduct | null>(null);
  const [images, setImages] = useState<{ id: number; url: string; alt: string | null; order: number }[]>([]);
  const [uploading, setUploading] = useState(false);

  const limit = 20;

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch(token, `/api/admin/products?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setProducts(data.products);
      setTotal(data.total);
    } catch { toast.error('خطا در دریافت محصولات'); }
    finally { setLoading(false); }
  }, [token, page, q]);

  const loadLookups = useCallback(async () => {
    try {
      const [catRes, brandRes, countryRes] = await Promise.all([
        adminFetch(token, '/api/admin/categories?flat=true'),
        adminFetch(token, '/api/admin/brands'),
        adminFetch(token, '/api/admin/countries'),
      ]);
      const catData = await catRes.json();
      const brandData = await brandRes.json();
      const countryData = await countryRes.json();
      if (catData.categories) setCategories(catData.categories);
      if (brandData.brands) setBrands(brandData.brands);
      if (countryData.countries) setCountries(countryData.countries);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => { loadLookups(); }, [loadLookups]);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const handleSearch = (value: string) => {
    setQ(value);
    setPage(1);
    if (searchTimeout) clearTimeout(searchTimeout);
    setSearchTimeout(setTimeout(() => {}, 100));
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyProduct });
    setSuperPromptText('');
    setDialogOpen(true);
  };

  // Inline "add country" — creates a Country row, appends to local list, and selects it
  const handleAddCountry = async () => {
    const name = newCountryName.trim();
    if (!name) { toast.error('نام کشور را وارد کنید'); return; }
    setSavingCountry(true);
    try {
      const res = await adminFetch(token, '/api/admin/countries', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      const created: SimpleCountry = data.country;
      // Avoid duplicate if it already existed
      setCountries(prev => prev.some(c => c.id === created.id) ? prev : [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'fa')));
      setForm(f => ({ ...f, country: created.name }));
      setNewCountryName('');
      setAddingCountry(false);
      toast.success(`کشور «${created.name}» اضافه شد`);
    } catch { toast.error('خطا در افزودن کشور'); }
    finally { setSavingCountry(false); }
  };

  // Update a single type-specific field
  const setTypeField = (key: keyof TypeFields, value: string | boolean) => {
    setForm(f => ({ ...f, typeFields: { ...f.typeFields, [key]: value } }));
  };

  // Custom spec rows
  const addCustomSpec = () => setForm(f => ({ ...f, customSpecs: [...f.customSpecs, { label: '', value: '' }] }));
  const updateCustomSpec = (idx: number, key: 'label' | 'value', value: string) =>
    setForm(f => ({ ...f, customSpecs: f.customSpecs.map((s, i) => i === idx ? { ...s, [key]: value } : s) }));
  const removeCustomSpec = (idx: number) =>
    setForm(f => ({ ...f, customSpecs: f.customSpecs.filter((_, i) => i !== idx) }));

  const openEdit = (p: AdminProduct) => {
    setEditing(p);
    let parsedTypeFields: TypeFields = {};
    try { if (p.typeFields) parsedTypeFields = JSON.parse(p.typeFields); } catch { parsedTypeFields = {}; }
    let parsedCustomSpecs: CustomSpec[] = [];
    try { if (p.customSpecs) parsedCustomSpecs = JSON.parse(p.customSpecs); } catch { parsedCustomSpecs = []; }
    setForm({
      name: p.name,
      slug: p.slug,
      model: p.model || '',
      price: p.price !== null ? String(p.price) : '',
      priceType: p.priceType,
      availability: p.availability,
      categoryId: String(p.category.id),
      brandId: String(p.brand.id),
      featured: p.featured,
      visible: p.visible !== false,
      discountPercent: String(p.discountPercent ?? 0),
      description: p.description || '',
      strengths: p.strengths ? (() => { try { return JSON.parse(p.strengths); } catch { return []; } })() : [],
      weaknesses: p.weaknesses ? (() => { try { return JSON.parse(p.weaknesses); } catch { return []; } })() : [],
      metaTitle: p.metaTitle || '',
      metaDescription: p.metaDescription || '',
      keywords: p.keywords || '',
      sku: p.sku || '',
      country: p.country || '',
      warranty: p.warranty || '',
      weight: p.weight || '',
      productType: p.productType || '',
      typeFields: parsedTypeFields,
      customSpecs: parsedCustomSpecs,
    });
    setSuperPromptText('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.categoryId || !form.brandId) {
      toast.error('نام، دسته‌بندی و برند الزامی هستند');
      return;
    }
    if (!form.productType) {
      toast.error('انتخاب «نوع محصول» الزامی است');
      return;
    }
    setSaving(true);
    try {
      // Strip empty typeFields keys so we don't store empty strings
      const cleanTypeFields: Record<string, string | boolean> = {};
      for (const [k, v] of Object.entries(form.typeFields)) {
        if (v !== undefined && v !== '' && v !== false) cleanTypeFields[k] = v;
      }
      const cleanCustomSpecs = form.customSpecs.filter(s => s.label.trim() || s.value.trim());
      const body: Record<string, unknown> = {
        name: form.name,
        slug: form.slug || toSlug(form.name),
        model: form.model || null,
        price: form.price === '' ? null : Number(form.price),
        discountPercent: Number(form.discountPercent) || 0,
        priceType: form.priceType,
        availability: form.availability,
        categoryId: Number(form.categoryId),
        brandId: Number(form.brandId),
        featured: form.featured,
        visible: form.visible,
        description: form.description || null,
        strengths: form.strengths.length > 0 ? JSON.stringify(form.strengths) : null,
        weaknesses: form.weaknesses.length > 0 ? JSON.stringify(form.weaknesses) : null,
        metaTitle: form.metaTitle || null,
        metaDescription: form.metaDescription || null,
        keywords: form.keywords || null,
        sku: form.sku || null,
        country: form.country || null,
        warranty: form.warranty || null,
        weight: form.weight || null,
        productType: form.productType || null,
        typeFields: Object.keys(cleanTypeFields).length > 0 ? JSON.stringify(cleanTypeFields) : null,
        customSpecs: cleanCustomSpecs.length > 0 ? JSON.stringify(cleanCustomSpecs) : null,
      };

      if (editing) {
        body.id = editing.id;
        const res = await adminFetch(token, '/api/admin/products', { method: 'PUT', body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) { toast.error(data.error); return; }
        toast.success('محصول بروزرسانی شد');
      } else {
        const res = await adminFetch(token, '/api/admin/products', { method: 'POST', body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) { toast.error(data.error); return; }
        toast.success('محصول ایجاد شد');
      }
      setDialogOpen(false);
      loadProducts();
    } catch { toast.error('خطا در ذخیره محصول'); }
    finally { setSaving(false); }
  };

  const handleParseSuperPrompt = () => {
    if (!superPromptText.trim()) {
      toast.error('ابتدا متن خروجی را وارد کنید');
      return;
    }
    setParsing(true);
    // Use setTimeout to allow UI to update before synchronous parse
    setTimeout(() => {
      try {
        const parsed = parseSuperPrompt(superPromptText);
        setForm(f => ({
          ...f,
          description: parsed.description || f.description,
          strengths: parsed.strengths.length > 0 ? parsed.strengths : f.strengths,
          weaknesses: parsed.weaknesses.length > 0 ? parsed.weaknesses : f.weaknesses,
          metaTitle: parsed.metaTitle || f.metaTitle,
          metaDescription: parsed.metaDescription || f.metaDescription,
          keywords: parsed.keywords || f.keywords,
        }));
        const foundCount = [
          parsed.description ? 'توضیحات' : '',
          parsed.strengths.length ? `${parsed.strengths.length} نقطه قوت` : '',
          parsed.weaknesses.length ? `${parsed.weaknesses.length} نقطه ضعف` : '',
        ].filter(Boolean);
        if (foundCount.length > 0) {
          toast.success(`تحلیل موفق: ${foundCount.join('، ')}`);
        } else {
          toast.warning('متن پردازش شد اما بخش مشخصی یافت نشد');
        }
      } catch (e) {
        toast.error('خطا در تحلیل متن');
        console.error('Parse error:', e);
      } finally {
        setParsing(false);
      }
    }, 50);
  };

  const removeStrength = (idx: number) => {
    setForm(f => ({ ...f, strengths: f.strengths.filter((_, i) => i !== idx) }));
  };

  const removeWeakness = (idx: number) => {
    setForm(f => ({ ...f, weaknesses: f.weaknesses.filter((_, i) => i !== idx) }));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminFetch(token, `/api/admin/products?id=${deleteTarget.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('محصول حذف شد');
      setDeleteTarget(null);
      loadProducts();
    } catch { toast.error('خطا در حذف محصول'); }
    finally { setDeleting(false); }
  };

  const openImages = async (p: AdminProduct) => {
    setImageProduct(p);
    try {
      const res = await adminFetch(token, `/api/admin/products/${p.id}/images`);
      const data = await res.json();
      setImages(data.images || []);
    } catch { setImages([]); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imageProduct) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('productId', String(imageProduct.id));
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('تصویر آپلود شد');
      openImages(imageProduct);
    } catch { toast.error('خطا در آپلود'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!imageProduct) return;
    try {
      const res = await adminFetch(token, `/api/admin/products/${imageProduct.id}/images?imageId=${imageId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('تصویر حذف شد');
      setImages(prev => prev.filter(i => i.id !== imageId));
    } catch { toast.error('خطا در حذف تصویر'); }
  };

  const toggleFeatured = async (p: AdminProduct) => {
    try {
      const res = await adminFetch(token, '/api/admin/products', {
        method: 'PUT',
        body: JSON.stringify({ id: p.id, name: p.name, featured: !p.featured }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success(p.featured ? 'از ویژه‌ها حذف شد' : 'به ویژه‌ها اضافه شد');
      loadProducts();
    } catch { toast.error('خطا'); }
  };

  const toggleVisible = async (p: AdminProduct) => {
    const newVal = !(p.visible !== false);
    // Optimistic
    setProducts(prev => prev.map(x => x.id === p.id ? { ...x, visible: newVal } : x));
    try {
      const res = await adminFetch(token, '/api/admin/products', {
        method: 'PUT',
        body: JSON.stringify({ id: p.id, name: p.name, visible: newVal }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        loadProducts();
        return;
      }
      toast.success(newVal ? 'نمایش داده شد' : 'از نمایش خارج شد');
    } catch {
      toast.error('خطا');
      loadProducts();
    }
  };

  const availabilityLabel = (a: string) => {
    if (a === 'in_stock') return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">موجود</Badge>;
    if (a === 'out_of_stock') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">ناموجود</Badge>;
    return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">تماس بگیرید</Badge>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="جستجوی محصول..."
            value={q}
            onChange={e => handleSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <Button onClick={openCreate} className="bg-[#16233F] hover:bg-[#1e2d4d]">
          <Plus className="w-4 h-4 ml-1" /> افزودن محصول
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-muted-foreground">
                    <th className="text-right py-3 px-3 font-medium">شناسه</th>
                    <th className="text-right py-3 px-3 font-medium">نام محصول</th>
                    <th className="text-right py-3 px-3 font-medium hidden md:table-cell">برند</th>
                    <th className="text-right py-3 px-3 font-medium hidden lg:table-cell">دسته‌بندی</th>
                    <th className="text-right py-3 px-3 font-medium">قیمت</th>
                    <th className="text-right py-3 px-3 font-medium">وضعیت</th>
                    <th className="text-center py-3 px-3 font-medium">تصاویر</th>
                    <th className="text-center py-3 px-3 font-medium">ویژه</th>
                    <th className="text-center py-3 px-3 font-medium">نمایش</th>
                    <th className="text-center py-3 px-3 font-medium">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 && (
                    <tr><td colSpan={10} className="text-center py-12 text-muted-foreground">محصولی یافت نشد</td></tr>
                  )}
                  {products.map(p => {
                    const isVisible = p.visible !== false;
                    return (
                    <tr key={p.id} className={`border-b last:border-0 hover:bg-gray-50/50 ${!isVisible ? 'bg-gray-50/60' : ''}`}>
                      <td className="py-2.5 px-3 text-muted-foreground">#{p.id}</td>
                      <td className={`py-2.5 px-3 font-medium max-w-[200px] truncate ${!isVisible ? 'text-gray-400' : ''}`}>{p.name}{!isVisible && <span className="block text-[10px] text-gray-400">پنهان</span>}</td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-gray-600">{p.brand.name}</td>
                      <td className="py-2.5 px-3 hidden lg:table-cell text-gray-600">{p.category.name}</td>
                      <td className="py-2.5 px-3">
                        {p.price ? formatNumber(p.price) + ' ت' : <span className="text-muted-foreground">تماس</span>}
                      </td>
                      <td className="py-2.5 px-3">{availabilityLabel(p.availability)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <button onClick={() => openImages(p)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#2FC4C9] transition-colors">
                          <ImageIcon className="w-3.5 h-3.5" /> {p._count.images}
                        </button>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Switch checked={p.featured} onCheckedChange={() => toggleFeatured(p)} className="mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <Switch checked={isVisible} onCheckedChange={() => toggleVisible(p)} className="mx-auto" />
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openEdit(p)} className="p-1.5 rounded-md hover:bg-blue-50 text-blue-600 transition-colors">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحه {page} از {totalPages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{editing ? 'ویرایش محصول' : 'افزودن محصول جدید'}</DialogTitle>
            <DialogDescription>اطلاعات محصول را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-2 md:col-span-2">
              <Label>نام محصول *</Label>
              <Input
                value={form.name}
                onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (!editing) setForm(ff => ({ ...ff, slug: toSlug(e.target.value) })); }}
                placeholder="نام محصول"
              />
            </div>
            <div className="space-y-2">
              <Label>اسلاگ (slug)</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>مدل</Label>
              <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="مدل محصول" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>دسته‌بندی *</Label>
              <CategoryCascader
                categories={categories}
                value={form.categoryId}
                onChange={v => setForm(f => ({ ...f, categoryId: v }))}
                searchPlaceholder="جستجوی نام دسته..."
                emptyText="دسته‌ای یافت نشد"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع محصول *</Label>
              <Select value={form.productType} onValueChange={v => setForm(f => ({ ...f, productType: v }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب نوع محصول" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="device">دستگاه</SelectItem>
                  <SelectItem value="material">مواد</SelectItem>
                  <SelectItem value="tool">ابزار</SelectItem>
                  <SelectItem value="consumable">مصرفی</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>برند *</Label>
              <SearchableSelect
                options={brands.map(b => ({ value: String(b.id), label: b.name }))}
                value={form.brandId}
                onChange={v => setForm(f => ({ ...f, brandId: v }))}
                placeholder="انتخاب برند"
                searchPlaceholder="جستجوی نام برند..."
                emptyText="برندی یافت نشد"
              />
            </div>
            <div className="space-y-2">
              <Label>قیمت (تومان)</Label>
              <Input
                type="number"
                value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="خالی = تماس بگیرید"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>درصد تخفیف (۰ تا ۱۰۰)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.discountPercent}
                onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                placeholder="0"
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>نوع قیمت</Label>
              <Select value={form.priceType} onValueChange={v => setForm(f => ({ ...f, priceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">قیمت ثابت</SelectItem>
                  <SelectItem value="call">تماس بگیرید</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>موجودی</Label>
              <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">موجود</SelectItem>
                  <SelectItem value="out_of_stock">ناموجود</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
              <Label>محصول ویژه</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
              <Label>نمایش در سایت</Label>
            </div>
            <div className="space-y-2">
              <Label>کد محصول (SKU)</Label>
              <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="مثلاً WD-EP-100" dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>کشور سازنده</Label>
              {addingCountry ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newCountryName}
                    onChange={e => setNewCountryName(e.target.value)}
                    placeholder="نام کشور جدید"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCountry(); } }}
                    autoFocus
                  />
                  <Button type="button" size="sm" onClick={handleAddCountry} disabled={savingCountry} className="bg-[#2FC4C9] hover:bg-[#2FC4C9]/90 text-white shrink-0">
                    {savingCountry ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    افزودن
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => { setAddingCountry(false); setNewCountryName(''); }} className="shrink-0">انصراف</Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <SearchableSelect
                      options={countries.map(c => ({ value: c.name, label: c.name }))}
                      value={form.country}
                      onChange={v => setForm(f => ({ ...f, country: v }))}
                      placeholder="انتخاب کشور"
                      searchPlaceholder="جستجوی نام کشور..."
                      emptyText="کشوری یافت نشد"
                    />
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setAddingCountry(true)} className="shrink-0">
                    <Plus className="w-4 h-4 ml-1" /> کشور جدید
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>گارانتی</Label>
              <Input value={form.warranty} onChange={e => setForm(f => ({ ...f, warranty: e.target.value }))} placeholder="مثلاً ۱ سال گارانتی" />
            </div>
            <div className="space-y-2">
              <Label>وزن</Label>
              <Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="مثلاً ۱۰۶ گرم" dir="ltr" />
            </div>
            {/* ─── Type-Specific Fields ─── */}
            {form.productType && (
              <div className="md:col-span-2 mt-1">
                <Separator className="mb-3" />
                <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
                  مشخصات اختصاصی — {form.productType === 'device' ? 'دستگاه' : form.productType === 'material' ? 'مواد' : form.productType === 'tool' ? 'ابزار' : 'مصرفی'}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {form.productType === 'device' && (
                    <>
                      <div className="space-y-2">
                        <Label>مدل دقیق</Label>
                        <Input value={form.typeFields.exactModel || ''} onChange={e => setTypeField('exactModel', e.target.value)} placeholder="مثلاً X-Smart Pro" />
                      </div>
                      <div className="space-y-2">
                        <Label>مشخصات فنی کلیدی</Label>
                        <Input value={form.typeFields.keySpecs || ''} onChange={e => setTypeField('keySpecs', e.target.value)} placeholder="سرعت: 40000rpm | گشتاور: 70Ncm" />
                      </div>
                      <div className="flex items-center gap-2 md:col-span-2">
                        <Switch checked={!!form.typeFields.autoclavable} onCheckedChange={v => setTypeField('autoclavable', v)} />
                        <Label>قابلیت اتوکلاو شدن</Label>
                      </div>
                    </>
                  )}
                  {form.productType === 'material' && (
                    <>
                      <div className="space-y-2">
                        <Label>حجم/وزن بسته‌بندی</Label>
                        <Input value={form.typeFields.packSize || ''} onChange={e => setTypeField('packSize', e.target.value)} placeholder="مثلاً ۵۰ گرم، ۵ میلی‌لیتر" />
                      </div>
                      <div className="space-y-2">
                        <Label>نوع کیورینگ</Label>
                        <Select value={form.typeFields.curingType || ''} onValueChange={v => setTypeField('curingType', v)}>
                          <SelectTrigger><SelectValue placeholder="انتخاب نوع کیورینگ" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">نوری</SelectItem>
                            <SelectItem value="self">خودسخت‌شونده</SelectItem>
                            <SelectItem value="dual">دوال‌کیور</SelectItem>
                            <SelectItem value="none">ندارد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>تاریخ انقضا (اختیاری)</Label>
                        <Input type="date" value={form.typeFields.expiryDate || ''} onChange={e => setTypeField('expiryDate', e.target.value)} dir="ltr" />
                      </div>
                    </>
                  )}
                  {form.productType === 'tool' && (
                    <>
                      <div className="space-y-2">
                        <Label>جنس</Label>
                        <Select value={form.typeFields.material || ''} onValueChange={v => setTypeField('material', v)}>
                          <SelectTrigger><SelectValue placeholder="انتخاب جنس" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="stainless">استیل ضدزنگ</SelectItem>
                            <SelectItem value="titanium">تیتانیوم</SelectItem>
                            <SelectItem value="plastic">پلاستیک</SelectItem>
                            <SelectItem value="other">سایر</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>محتویات بسته</Label>
                        <Input value={form.typeFields.packageContents || ''} onChange={e => setTypeField('packageContents', e.target.value)} placeholder="مثلاً ۵ عدد میرور، ۳ عدد پروب" />
                      </div>
                    </>
                  )}
                  {form.productType === 'consumable' && (
                    <>
                      <div className="space-y-2">
                        <Label>سایز</Label>
                        <Input value={form.typeFields.size || ''} onChange={e => setTypeField('size', e.target.value)} placeholder="مثلاً ۲۵mm، میانه" />
                      </div>
                      <div className="space-y-2">
                        <Label>جنس</Label>
                        <Input value={form.typeFields.material || ''} onChange={e => setTypeField('material', e.target.value)} placeholder="مثلاً نایلون، لاتکس" />
                      </div>
                      <div className="space-y-2">
                        <Label>تعداد در بسته</Label>
                        <Input type="number" min="0" value={form.typeFields.perPack || ''} onChange={e => setTypeField('perPack', e.target.value)} placeholder="مثلاً ۱۰۰" dir="ltr" />
                      </div>
                    </>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">تمام فیلدهای این بخش اختیاری هستند.</p>
              </div>
            )}

            {/* ─── Super-Prompt Section ─── */}
            <div className="md:col-span-2 mt-2">
              <Separator className="mb-4" />
              <div className="rounded-xl border-2 border-dashed border-[#2FC4C9]/30 bg-[#2FC4C9]/5 p-4 space-y-3">
                <div className="flex items-center gap-2 text-[#16233F] font-semibold text-sm">
                  <FileText className="w-4 h-4 text-[#2FC4C9]" />
                  📋 خروجی سوپرپرامپت
                </div>
                <Textarea
                  value={superPromptText}
                  onChange={e => setSuperPromptText(e.target.value)}
                  placeholder="متن خروجی AI را اینجا قرار دهید..."
                  rows={6}
                  className="text-sm resize-y"
                />
                <Button
                  type="button"
                  onClick={handleParseSuperPrompt}
                  disabled={parsing || !superPromptText.trim()}
                  className="w-full bg-[#2FC4C9] hover:bg-[#2FC4C9]/90 text-white"
                >
                  {parsing ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 ml-2" />
                  )}
                  تحلیل و پر کردن خودکار 🪄
                </Button>
              </div>
            </div>

            {/* ─── Parsed Fields: Strengths ─── */}
            <div className="md:col-span-2 space-y-2">
              <Label className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                نقاط قوت
              </Label>
              {form.strengths.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.strengths.map((s, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 pr-1 pl-2 py-1.5 gap-1">
                      <span className="text-xs">{s}</span>
                      <button onClick={() => removeStrength(idx)} className="mr-1 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">هنوز نقطه‌ای اضافه نشده — از سوپرپرامپت استفاده کنید</p>
              )}
            </div>

            {/* ─── Parsed Fields: Weaknesses ─── */}
            <div className="md:col-span-2 space-y-2">
              <Label className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                نقاط ضعف
              </Label>
              {form.weaknesses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.weaknesses.map((w, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 pr-1 pl-2 py-1.5 gap-1">
                      <span className="text-xs">{w}</span>
                      <button onClick={() => removeWeakness(idx)} className="mr-1 hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">هنوز نقطه‌ای اضافه نشده — از سوپرپرامپت استفاده کنید</p>
              )}
            </div>

            {/* ─── Parsed Fields: Description ─── */}
            <div className="md:col-span-2 space-y-2">
              <Label>توضیحات</Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="توضیحات کامل محصول..."
                rows={4}
                className="text-sm"
              />
            </div>

            {/* ─── Custom Specs ─── */}
            <div className="md:col-span-2 mt-1">
              <Separator className="mb-3" />
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">ویژگی‌های سفارشی</p>
                <Button type="button" size="sm" variant="outline" onClick={addCustomSpec}>
                  <Plus className="w-4 h-4 ml-1" /> افزودن ویژگی جدید
                </Button>
              </div>
              {form.customSpecs.length === 0 ? (
                <p className="text-xs text-muted-foreground">هنوز ویژگی سفارشی اضافه نشده — این بخش کاملاً اختیاری است.</p>
              ) : (
                <div className="space-y-2">
                  {form.customSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={spec.label}
                        onChange={e => updateCustomSpec(idx, 'label', e.target.value)}
                        placeholder="نام ویژگی"
                        className="flex-1"
                      />
                      <Input
                        value={spec.value}
                        onChange={e => updateCustomSpec(idx, 'value', e.target.value)}
                        placeholder="مقدار"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomSpec(idx)}
                        className="p-2 rounded-md hover:bg-red-50 text-red-500 transition-colors shrink-0"
                        aria-label="حذف ویژگی"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ─── SEO Fields ─── */}
            <div className="md:col-span-2 mt-1">
              <Separator className="mb-3" />
              <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">تنظیمات سئو</p>
            </div>
            <div className="space-y-2">
              <Label>Meta Title</Label>
              <Input
                value={form.metaTitle}
                onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))}
                placeholder="عنوان سئو (خودکار تولید می‌شود)"
                className="text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>کلمات کلیدی</Label>
              <Input
                value={form.keywords}
                onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))}
                placeholder="دندانپزشکی، مرصادنت، ..."
                className="text-sm"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Meta Description</Label>
              <Textarea
                value={form.metaDescription}
                onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))}
                placeholder="توضیحات متا (حداکثر ۱۵۰ کاراکتر)"
                rows={2}
                className="text-sm"
              />
              {form.metaDescription.length > 160 && (
                <p className="text-xs text-amber-600">طول توضیحات متا بیشتر از ۱۶۰ کاراکتر است ({form.metaDescription.length})</p>
              )}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#16233F] hover:bg-[#1e2d4d]">
              {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editing ? 'بروزرسانی' : 'ایجاد محصول'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف محصول</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف محصول &laquo;{deleteTarget?.name}&raquo; اطمینان دارید؟ این عمل غیرقابل بازگشت است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
              {deleting && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Image Gallery Dialog */}
      <Dialog open={!!imageProduct} onOpenChange={() => setImageProduct(null)}>
        <DialogContent className="max-w-3xl" dir="rtl">
          <DialogHeader>
            <DialogTitle>تصاویر محصول: {imageProduct?.name}</DialogTitle>
            <DialogDescription>مدیریت گالری تصاویر</DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <div className="flex items-center gap-3 mb-4">
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <Button variant="outline" asChild disabled={uploading}>
                  <span>
                    {uploading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                    آپلود تصویر
                  </span>
                </Button>
              </label>
            </div>
            {images.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">تصویری وجود ندارد</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {images.map(img => (
                  <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-gray-50">
                    <img src={img.url} alt={img.alt || ''} className="w-full h-32 object-cover" />
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}