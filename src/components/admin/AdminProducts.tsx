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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search, Plus, Pencil, Trash2, Upload, X, ChevronLeft, ChevronRight, ImageIcon, Loader2, FileText, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch, formatNumber, toSlug } from '@/lib/admin-utils';
import { SearchableSelect } from './SearchableSelect';
import { CategoryCascader } from './CategoryCascader';

interface AdminProduct {
  id: number; name: string; slug: string; model: string | null;
  price: number | null; priceType: string; availability: string; stockQuantity: number;
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
  availability: string; stockQuantity: string; categoryId: string; brandId: string;
  featured: boolean; visible: boolean; discountPercent: string;
  description: string; strengths: string[]; weaknesses: string[];
  metaTitle: string; metaDescription: string; keywords: string;
  sku: string; country: string; warranty: string; weight: string;
  productType: string; typeFields: TypeFields;
  customSpecs: CustomSpec[];
}

const emptyProduct: ProductForm = {
  name: '', slug: '', model: '', price: '', priceType: 'fixed', availability: 'in_stock', stockQuantity: '0',
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

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Image dialog
  const [activeTab, setActiveTab] = useState("basic");
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
    setImages([]);
    setActiveTab("basic");
    setForm({ ...emptyProduct });
    setDialogOpen(true);
  };

  // Inline "add country" — creates a Country row, appends to local list, and selects it

  // Inline create brand
  const handleCreateBrand = async (name: string) => {
    if (!name.trim()) return;
    try {
      const res = await adminFetch(token, '/api/admin/brands', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      const created = data.brand;
      setBrands(prev => [...prev, created]);
      setForm(f => ({ ...f, brandId: String(created.id) }));
      toast.success(`برند «${created.name}» اضافه شد`);
    } catch { toast.error('خطا در ایجاد برند'); }
  };

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
    fetchImages(p.id);
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
      stockQuantity: String(p.stockQuantity ?? 0),
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
    setDialogOpen(true);
  };

  const handleSave = async (stay: boolean = false) => {
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
        stockQuantity: parseInt(form.stockQuantity) || 0,
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
        if (stay && data.product) {
          setEditing(data.product);
          fetchImages(data.product.id);
          setActiveTab('images');
          loadProducts(); // refresh background list
          return;
        }
      }
      if (!stay) {
        setDialogOpen(false);
        loadProducts();
      }
    } catch { toast.error('خطا در ذخیره محصول'); }
    finally { setSaving(false); }
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

  const fetchImages = async (id: number) => {
    try {
      const res = await adminFetch(token, `/api/admin/products/${id}/images`);
      const data = await res.json();
      setImages(data.images || []);
    } catch { setImages([]); }
  };
  
  const openImagesTab = (p: AdminProduct) => {
    openEdit(p);
    setActiveTab("images");
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      // Use the dedicated per-product images endpoint (POST /api/admin/products/[id]/images)
      // instead of the previous non-existent /api/admin/upload route.
      const res = await fetch(`/api/admin/products/${editing.id}/images`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('تصویر آپلود شد');
      fetchImages(editing.id);
      loadProducts();
    } catch { toast.error('خطا در آپلود'); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!editing) return;
    try {
      const res = await adminFetch(token, `/api/admin/products/${editing.id}/images?imageId=${imageId}`, { method: 'DELETE' });
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


  if (dialogOpen) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto pb-24" dir="rtl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{editing ? 'ویرایش محصول' : 'افزودن محصول جدید'}</h2>
            <p className="text-muted-foreground mt-1 text-sm">اطلاعات محصول را به تفکیک در تب‌های زیر وارد کنید.</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>انصراف و بازگشت</Button>
            <Button onClick={() => handleSave(false)} disabled={saving} className="bg-[#16233F] hover:bg-[#1e2d4d]">
              {saving && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              {editing ? 'بروزرسانی' : 'ایجاد محصول'}
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="basic">اطلاعات پایه</TabsTrigger>
            <TabsTrigger value="specs">ویژگی‌ها</TabsTrigger>
            <TabsTrigger value="content">محتوا</TabsTrigger>
            <TabsTrigger value="seo">تنظیمات و سئو</TabsTrigger>
            <TabsTrigger value="images">تصاویر محصول</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <Label>نام محصول *</Label>
                <Input value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (!editing) setForm(ff => ({ ...ff, slug: toSlug(e.target.value) })); }} placeholder="نام محصول" />
              </div>
              <div className="space-y-2">
                <Label>اسلاگ (slug)</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="auto-generated" dir="ltr" className="text-left" />
              </div>
              <div className="space-y-2">
                <Label>کد محصول (SKU)</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="مثلاً WD-EP-100" dir="ltr" className="text-left" />
              </div>
              
              <div className="space-y-2">
                <Label>دسته‌بندی *</Label>
                <CategoryCascader categories={categories} value={form.categoryId} onChange={v => setForm(f => ({ ...f, categoryId: v }))} />
              </div>
              
              <div className="space-y-2">
                <Label>برند *</Label>
                <SearchableSelect
                  options={brands.map(b => ({ value: String(b.id), label: b.name }))}
                  value={form.brandId}
                  onChange={v => setForm(f => ({ ...f, brandId: v }))}
                  onCreateNew={handleCreateBrand}
                  placeholder="انتخاب برند..."
                />
              </div>

              <div className="space-y-2">
                <Label>نوع کالا (تخصصی) *</Label>
                <Select value={form.productType} onValueChange={v => setForm(f => ({ ...f, productType: v }))}>
                  <SelectTrigger><SelectValue placeholder="انتخاب نوع کالا..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="device">تجهیزات (دستگاه)</SelectItem>
                    <SelectItem value="material">مواد مصرفی</SelectItem>
                    <SelectItem value="tool">ابزارآلات</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>قیمت (تومان)</Label>
                <Input type="number" min="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="قیمت به تومان (خالی = تماس بگیرید)" />
              </div>
              <div className="space-y-2">
                <Label>درصد تخفیف</Label>
                <Input type="number" min="0" max="100" value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))} placeholder="مثلا 15" />
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
                <Label>وضعیت موجودی</Label>
                <Select value={form.availability} onValueChange={v => setForm(f => ({ ...f, availability: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">موجود</SelectItem>
                    <SelectItem value="out_of_stock">ناموجود</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>تعداد در انبار (عدد)</Label>
                <Input type="number" min="0" value={form.stockQuantity} onChange={e => { const val = e.target.value; const num = parseInt(val) || 0; setForm(f => ({ ...f, stockQuantity: val, availability: num <= 0 ? 'out_of_stock' : 'in_stock' })); }} placeholder="تعداد موجودی" />
              </div>

              <div className="space-y-2 md:col-span-2 grid grid-cols-2 mt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <Switch checked={form.featured} onCheckedChange={v => setForm(f => ({ ...f, featured: v }))} />
                  <Label>محصول ویژه (نمایش در صفحه اصلی)</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.visible} onCheckedChange={v => setForm(f => ({ ...f, visible: v }))} />
                  <Label>نمایش در سایت</Label>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="specs" className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-2">
                  <Label>کشور سازنده</Label>
                  <div className="flex gap-2">
                    <SearchableSelect options={countries.map(c => ({ value: c.name, label: c.name }))} value={form.country} onChange={v => setForm(f => ({ ...f, country: v }))} placeholder="انتخاب..." />
                    <Button type="button" variant="outline" onClick={() => setAddingCountry(true)}><Plus className="w-4 h-4" /></Button>
                  </div>
                  {addingCountry && (
                    <div className="flex items-center gap-2 mt-2 p-2 border rounded-md bg-gray-50">
                      <Input placeholder="نام کشور..." value={newCountryName} onChange={e => setNewCountryName(e.target.value)} className="h-8 text-sm" />
                      <Button type="button" size="sm" onClick={handleAddCountry} disabled={savingCountry}><CheckCircle2 className="w-4 h-4" /></Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setAddingCountry(false)}><X className="w-4 h-4" /></Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>مدل کالا</Label>
                  <Input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} placeholder="مدل محصول" />
                </div>
                
                <div className="space-y-2">
                  <Label>وزن</Label>
                  <Input value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="مثلاً ۱۰۶ گرم" />
                </div>
                
                <div className="space-y-2">
                  <Label>گارانتی</Label>
                  <Input value={form.warranty} onChange={e => setForm(f => ({ ...f, warranty: e.target.value }))} placeholder="مثلاً ۱ سال گارانتی" />
                </div>
             </div>

             <Separator className="my-6" />
             <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">مشخصات فنی دلخواه</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCustomSpec}>
                  <Plus className="w-4 h-4 ml-1" /> افزودن مشخصه
                </Button>
             </div>
             
             {form.customSpecs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 bg-gray-50 rounded-lg">هیچ مشخصه دلخواهی اضافه نشده است.</p>
             ) : (
                <div className="space-y-3">
                  {form.customSpecs.map((spec, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Input placeholder="عنوان (مثلاً: ابعاد)" value={spec.label} onChange={e => updateCustomSpec(idx, 'label', e.target.value)} className="w-1/3" />
                      <Input placeholder="مقدار (مثلاً: 10x20 cm)" value={spec.value} onChange={e => updateCustomSpec(idx, 'value', e.target.value)} className="flex-1" />
                      <Button type="button" variant="outline" size="icon" onClick={() => removeCustomSpec(idx)} className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0">
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
             )}
          </TabsContent>

          <TabsContent value="content" className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
            <div className="space-y-2">
              <Label>توضیحات کامل (HTML/متن)</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="توضیحات جامع محصول..." className="min-h-[200px]" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label className="text-emerald-600">نقاط قوت</Label>
                   <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, strengths: [...f.strengths, ''] }))}><Plus className="w-3 h-3 ml-1" /> افزودن</Button>
                 </div>
                 <div className="space-y-2">
                   {form.strengths.map((s, idx) => (
                     <div key={idx} className="flex gap-2">
                       <Input value={s} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, strengths: f.strengths.map((st, i) => i === idx ? v : st) })); }} placeholder="نقطه قوت..." />
                       <Button type="button" variant="ghost" size="icon" onClick={() => setForm(f => ({ ...f, strengths: f.strengths.filter((_, i) => i !== idx) }))}><X className="w-4 h-4" /></Button>
                     </div>
                   ))}
                 </div>
               </div>
               
               <div className="space-y-4">
                 <div className="flex items-center justify-between">
                   <Label className="text-red-600">نقاط ضعف</Label>
                   <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, weaknesses: [...f.weaknesses, ''] }))}><Plus className="w-3 h-3 ml-1" /> افزودن</Button>
                 </div>
                 <div className="space-y-2">
                   {form.weaknesses.map((s, idx) => (
                     <div key={idx} className="flex gap-2">
                       <Input value={s} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, weaknesses: f.weaknesses.map((st, i) => i === idx ? v : st) })); }} placeholder="نقطه ضعف..." />
                       <Button type="button" variant="ghost" size="icon" onClick={() => setForm(f => ({ ...f, weaknesses: f.weaknesses.filter((_, i) => i !== idx) }))}><X className="w-4 h-4" /></Button>
                     </div>
                   ))}
                 </div>
               </div>
            </div>
          </TabsContent>

          <TabsContent value="seo" className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
            <div className="space-y-2">
              <Label>Meta Title (عنوان سئو)</Label>
              <Input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} placeholder="عنوان سئو (در صورت خالی بودن، نام محصول استفاده می‌شود)" />
            </div>
            
            <div className="space-y-2">
              <Label>کلمات کلیدی (Keywords)</Label>
              <Input value={form.keywords} onChange={e => setForm(f => ({ ...f, keywords: e.target.value }))} placeholder="دندانپزشکی، مرصادنت، کامپوزیت (با ویرگول جدا کنید)" />
            </div>
            
            <div className="space-y-2">
              <Label>Meta Description (توضیحات سئو)</Label>
              <Textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} placeholder="توضیحات متا (حداکثر ۱۶۰ کاراکتر)" className="min-h-[100px]" />
              {form.metaDescription.length > 160 && (
                <p className="text-xs text-amber-600 mt-1">طول توضیحات متا بیشتر از ۱۶۰ کاراکتر است ({form.metaDescription.length})</p>
              )}
            </div>
          </TabsContent>
          <TabsContent value="images" className="space-y-6 border p-6 rounded-lg bg-white shadow-sm">
            {!editing ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-700">افزودن گالری تصاویر</h3>
                <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto leading-relaxed">
                  شما در حال ایجاد یک محصول جدید هستید. برای آپلود تصاویر متعدد و مدیریت آن‌ها (که به صورت کاملاً اتوماتیک به فرمت سریع و کم‌حجم WebP تبدیل می‌شوند)، لطفاً ابتدا <strong>اطلاعات پایه را ذخیره کنید</strong>.
                </p>
                <Button 
                  onClick={() => handleSave(true)} 
                  disabled={saving} 
                  className="mt-6 bg-[#16233F] hover:bg-[#1e2d4d]"
                >
                  {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                  ذخیره و فعالسازی آپلود تصاویر
                </Button>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">مدیریت تصاویر محصول</h3>
                  <label className="cursor-pointer">
                    <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={handleUpload} />
                    <Button variant="outline" asChild disabled={uploading}>
                      <span>
                        {uploading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Upload className="w-4 h-4 ml-2" />}
                        آپلود تصویر جدید
                      </span>
                    </Button>
                  </label>
                </div>
                <p className="text-xs text-muted-foreground mb-6">فرمت‌های مجاز: PNG, JPG, WebP, SVG (حداکثر ۴ مگابایت). تصاویر به صورت اتوماتیک تغییر سایز داده و به WebP تبدیل می‌شوند.</p>
                
                {images.length === 0 ? (
                  <p className="text-center text-muted-foreground py-12 border-2 border-dashed rounded-lg bg-gray-50">تصویری وجود ندارد</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {images.map(img => (
                      <div key={img.id} className="relative group rounded-lg overflow-hidden border bg-gray-50 shadow-sm aspect-square flex items-center justify-center p-2">
                        <img src={img.url} alt={img.alt || ''} className="w-full h-full object-contain" />
                        <button
                          onClick={() => handleDeleteImage(img.id)}
                          className="absolute top-2 left-2 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    );
  }
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
                        <button onClick={() => openImagesTab(p)} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[#2FC4C9] transition-colors">
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

      
    </div>
  );
}