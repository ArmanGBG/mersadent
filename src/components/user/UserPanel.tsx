'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Home, Package, MapPin, User, ShoppingBag, Loader2, LogIn, Plus,
  Pencil, Trash2, ChevronLeft, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { IRAN_PROVINCES } from '@/lib/iran-cities';
import { SearchableSelect } from '@/components/admin/SearchableSelect';

interface UserData {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  userType?: string | null;
}

interface OrderItem {
  id: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: string;
  totalPrice: number;
  paymentMethod: string | null;
  paymentStatus: string;
  shippingName: string | null;
  shippingPhone: string;
  shippingAddress: string;
  notes: string | null;
  createdAt: string;
  items: OrderItem[];
}

interface Address {
  id: number;
  title: string | null;
  province: string | null;
  city: string | null;
  fullAddress: string;
  postalCode: string | null;
  isDefault: boolean;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const statusLabel = (status: string) => {
  switch (status) {
    case 'pending': return { text: 'در انتظار تأیید', color: 'bg-amber-100 text-amber-700' };
    case 'confirmed': return { text: 'تأیید شده', color: 'bg-blue-100 text-blue-700' };
    case 'shipped': return { text: 'ارسال شده', color: 'bg-purple-100 text-purple-700' };
    case 'delivered': return { text: 'تحویل داده شده', color: 'bg-emerald-100 text-emerald-700' };
    case 'cancelled': return { text: 'لغو شده', color: 'bg-red-100 text-red-600' };
    default: return { text: status, color: 'bg-gray-100 text-gray-600' };
  }
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.25 },
};

interface UserPanelProps {
  user: UserData | null;
  setUser: (user: UserData | null) => void;
  onNavigate: (view: any) => void;
  onAuthRequired: () => void;
  defaultTab?: string;
}

export function UserPanel({ user, setUser, onNavigate, onAuthRequired, defaultTab }: UserPanelProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Profile form
  const [profileName, setProfileName] = useState('');
  const [profileUserType, setProfileUserType] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Address form
  const [addrDialogOpen, setAddrDialogOpen] = useState(false);
  const [editingAddr, setEditingAddr] = useState<Address | null>(null);
  const [addrTitle, setAddrTitle] = useState('');
  const [addrProvince, setAddrProvince] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrFull, setAddrFull] = useState('');
  const [addrPostal, setAddrPostal] = useState('');
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [savingAddr, setSavingAddr] = useState(false);

  const fetchData = async () => {
    if (!user) { setLoading(false); return; }
    const token = localStorage.getItem('user_token');
    setLoading(true);
    try {
      const [ordersRes, addrsRes] = await Promise.all([
        fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/addresses', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (ordersRes.ok) {
        const data = await ordersRes.json();
        setOrders(data.orders || []);
      }
      if (addrsRes.ok) {
        const data = await addrsRes.json();
        setAddresses(data.addresses || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { if (!cancelled) setLoading(false); return; }
      const token = localStorage.getItem('user_token');
      if (!cancelled) setLoading(true);
      try {
        const [ordersRes, addrsRes] = await Promise.all([
          fetch('/api/orders', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/addresses', { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);
        if (ordersRes.ok && !cancelled) {
          const data = await ordersRes.json();
          setOrders(data.orders || []);
        }
        if (addrsRes.ok && !cancelled) {
          const data = await addrsRes.json();
          setAddresses(data.addresses || []);
        }
      } catch {
        // silent
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (user) {
      queueMicrotask(() => {
        setProfileName(user.name || '');
        setProfileEmail(user.email || '');
        setProfileUserType(user.userType || '');
      });
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ name: profileName, email: profileEmail || null, userType: profileUserType || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        toast.success('پروفایل بروزرسانی شد');
      } else {
        toast.error(data.error || 'خطا');
      }
    } catch {
      toast.error('خطای شبکه');
    }
    setSavingProfile(false);
  };

  const openNewAddress = () => {
    setEditingAddr(null);
    setAddrTitle(''); setAddrProvince(''); setAddrCity(''); setAddrFull(''); setAddrPostal('');
    setAddrIsDefault(addresses.length === 0);
    setAddrDialogOpen(true);
  };

  const openEditAddress = (addr: Address) => {
    setEditingAddr(addr);
    setAddrTitle(addr.title || '');
    setAddrProvince(addr.province || '');
    setAddrCity(addr.city || '');
    setAddrFull(addr.fullAddress);
    setAddrPostal(addr.postalCode || '');
    setAddrIsDefault(addr.isDefault);
    setAddrDialogOpen(true);
  };

  const handleSaveAddress = async () => {
    if (!addrFull.trim()) { toast.error('آدرس کامل الزامی است'); return; }
    setSavingAddr(true);
    try {
      const token = localStorage.getItem('user_token');
      const body = { title: addrTitle || null, province: addrProvince || null, city: addrCity || null, fullAddress: addrFull, postalCode: addrPostal || null, isDefault: addrIsDefault };
      let res: Response;
      if (editingAddr) {
        res = await fetch(`/api/addresses/${editingAddr.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(body),
        });
      }
      if (res.ok) {
        toast.success(editingAddr ? 'آدرس بروزرسانی شد' : 'آدرس جدید اضافه شد');
        setAddrDialogOpen(false);
        fetchData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'خطا');
      }
    } catch {
      toast.error('خطای شبکه');
    }
    setSavingAddr(false);
  };

  const handleDeleteAddress = async (id: number) => {
    try {
      const token = localStorage.getItem('user_token');
      const res = await fetch(`/api/addresses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('آدرس حذف شد');
        fetchData();
      }
    } catch {
      toast.error('خطا در حذف آدرس');
    }
  };

  if (!user) {
    return (
      <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center">
        <User className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-gray-400 mb-2">برای دسترسی به پنل کاربری وارد شوید</h2>
        <Button onClick={onAuthRequired} className="mt-4 bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl">
          <LogIn className="w-4 h-4 ml-2" />
          ورود / ثبت‌نام
        </Button>
      </motion.div>
    );
  }

  const persianDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  };

  return (
    <motion.div {...fadeIn} className="max-w-4xl mx-auto px-4 sm:px-6 pb-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => onNavigate({ type: 'home' })} className="cursor-pointer flex items-center gap-1 text-sm">
              <Home className="w-3.5 h-3.5" />
              خانه
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>پنل کاربری</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-full bg-mersadent-accent/10 flex items-center justify-center">
          <User className="w-6 h-6 text-mersadent-accent" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-mersadent-dark">{user.name || 'کاربر'}</h1>
          <p className="text-xs text-gray-400" dir="ltr">{user.phone}</p>
        </div>
      </div>

      <Tabs defaultValue={defaultTab === 'addresses' ? 'addresses' : defaultTab === 'profile' ? 'profile' : 'orders'} dir="rtl">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="orders">سفارش‌ها</TabsTrigger>
          <TabsTrigger value="addresses">آدرس‌ها</TabsTrigger>
          <TabsTrigger value="profile">پروفایل</TabsTrigger>
        </TabsList>

        {/* ===== ORDERS TAB ===== */}
        <TabsContent value="orders" className="mt-6">
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">سفارشی ثبت نشده است</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {orders.map(order => {
                const st = statusLabel(order.status);
                return (
                  <Card key={order.id} className="border border-gray-100">
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-mersadent-dark" dir="ltr">{order.orderNumber}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${st.color}`}>{st.text}</span>
                          </div>
                          <span className="text-xs text-gray-400">{persianDate(order.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-mersadent-dark">{formatPrice(order.totalPrice)}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onNavigate({ type: 'order-detail', orderId: order.id })}
                            className="text-xs rounded-lg h-8"
                          >
                            جزئیات
                            <ChevronLeft className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== ADDRESSES TAB ===== */}
        <TabsContent value="addresses" className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-mersadent-dark">آدرس‌های من</h3>
            <Button size="sm" onClick={openNewAddress} className="bg-mersadent-accent hover:bg-mersadent-accent/90 text-white text-xs rounded-lg h-8">
              <Plus className="w-3.5 h-3.5 ml-1" />
              افزودن آدرس جدید
            </Button>
          </div>

          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
            </div>
          ) : addresses.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">آدرسی ذخیره نشده است</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {addresses.map(addr => (
                <Card key={addr.id} className="border border-gray-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-mersadent-dark">{addr.title || 'آدرس'}</span>
                          {addr.isDefault && (
                            <Badge className="bg-mersadent-accent/10 text-mersadent-accent border-mersadent-accent/20 text-[10px]">پیش‌فرض</Badge>
                          )}
                        </div>
                        {(addr.province || addr.city) && (
                          <p className="text-xs text-gray-500 mb-0.5">{[addr.province, addr.city].filter(Boolean).join('، ')}</p>
                        )}
                        <p className="text-xs text-gray-600 leading-5">{addr.fullAddress}</p>
                        {addr.postalCode && (
                          <p className="text-xs text-gray-400 mt-1">کد پستی: <span dir="ltr">{addr.postalCode}</span></p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => openEditAddress(addr)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-mersadent-accent hover:bg-mersadent-accent/5 transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteAddress(addr.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== PROFILE TAB ===== */}
        <TabsContent value="profile" className="mt-6">
          <Card className="border border-gray-100 max-w-lg">
            <CardContent className="p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-mersadent-dark">اطلاعات حساب</h3>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">نام و نام خانوادگی</label>
                <Input value={profileName} onChange={e => setProfileName(e.target.value)} className="h-10 text-sm" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">ایمیل</label>
                <Input value={profileEmail} onChange={e => setProfileEmail(e.target.value)} className="h-10 text-sm" dir="ltr" type="email" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">نقش (شغل)</label>
                <select
                  value={profileUserType}
                  onChange={e => setProfileUserType(e.target.value)}
                  className="h-10 text-sm rounded-md border border-input bg-background px-3 py-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">انتخاب نقش...</option>
                  <option value="دانشجو">دانشجو</option>
                  <option value="دندانپزشک">دندانپزشک</option>
                  <option value="متخصص">متخصص</option>
                  <option value="لابراتوار">لابراتوار</option>
                  <option value="سایر">سایر</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">شماره موبایل</label>
                <Input value={user.phone || ''} disabled className="h-10 text-sm bg-gray-50" dir="ltr" />
                <p className="text-[10px] text-gray-400">شماره موبایل قابل تغییر نیست</p>
              </div>
              <Button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="w-fit bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl h-10"
              >
                {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4 ml-1.5" /> ذخیره تغییرات</>}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== ORDER DETAIL DIALOG ===== */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-right">جزئیات سفارش</DialogTitle>
            <DialogDescription className="text-right" dir="ltr">
              {selectedOrder?.orderNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2.5 py-1 rounded-full ${statusLabel(selectedOrder.status).color}`}>
                  {statusLabel(selectedOrder.status).text}
                </span>
                <span className="text-xs text-gray-400">{persianDate(selectedOrder.createdAt)}</span>
              </div>

              <Separator />

              {/* Shipping info */}
              <div className="bg-gray-50 rounded-xl p-3 text-sm">
                <p className="font-semibold text-mersadent-dark mb-1">اطلاعات ارسال</p>
                <p className="text-xs text-gray-600">نام: {selectedOrder.shippingName || '—'}</p>
                <p className="text-xs text-gray-600">تلفن: <span dir="ltr">{selectedOrder.shippingPhone}</span></p>
                <p className="text-xs text-gray-600">آدرس: {selectedOrder.shippingAddress}</p>
                {selectedOrder.notes && <p className="text-xs text-gray-500 mt-1">توضیحات: {selectedOrder.notes}</p>}
              </div>

              {/* Items */}
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold text-mersadent-dark">اقلام سفارش</p>
                {selectedOrder.items.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-mersadent-dark line-clamp-1">{item.productName}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Intl.NumberFormat('fa-IR').format(item.quantity)} × {formatPrice(item.unitPrice)}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-mersadent-dark flex-shrink-0 mr-3">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-mersadent-dark">جمع کل:</span>
                <span className="text-base font-extrabold text-mersadent-accent">{formatPrice(selectedOrder.totalPrice)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ===== ADDRESS FORM DIALOG ===== */}
      <Dialog open={addrDialogOpen} onOpenChange={setAddrDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-right">{editingAddr ? 'ویرایش آدرس' : 'افزودن آدرس جدید'}</DialogTitle>
            <DialogDescription className="text-right">اطلاعات آدرس را وارد کنید</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">عنوان (مثلاً: خانه، مطب)</label>
              <Input value={addrTitle} onChange={e => setAddrTitle(e.target.value)} placeholder="عنوان آدرس" className="h-10 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">استان</label>
                <SearchableSelect
                  value={addrProvince}
                  onChange={(v) => { setAddrProvince(v); setAddrCity(''); }}
                  options={Object.keys(IRAN_PROVINCES).map(p => ({ label: p, value: p }))}
                  placeholder="انتخاب استان..."
                  className="h-10"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-gray-600">شهر</label>
                <SearchableSelect
                  value={addrCity}
                  onChange={setAddrCity}
                  options={addrProvince ? (IRAN_PROVINCES as any)[addrProvince].map((c: string) => ({ label: c, value: c })) : []}
                  placeholder="انتخاب شهر..."
                  disabled={!addrProvince}
                  className="h-10"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">آدرس کامل <span className="text-red-500">*</span></label>
              <Textarea value={addrFull} onChange={e => setAddrFull(e.target.value)} placeholder="خیابان، کوچه، پلاک، واحد" className="min-h-[70px] text-sm resize-none" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600">کد پستی</label>
              <Input value={addrPostal} onChange={e => setAddrPostal(e.target.value)} placeholder="۱۰۲۳۴۵۶۷۸۹" className="h-10 text-sm" dir="ltr" maxLength={10} />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={addrIsDefault} onCheckedChange={(v) => setAddrIsDefault(!!v)} />
              <span className="text-sm text-gray-600">آدرس پیش‌فرض</span>
            </label>
            <Button
              onClick={handleSaveAddress}
              disabled={savingAddr || !addrFull.trim()}
              className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white rounded-xl h-10"
            >
              {savingAddr ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ذخیره'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}