'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, ShoppingBag, UserX, MapPin, UserCheck, ChevronLeft, Shield, Eye, Users, Download, ShoppingCart, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { IRAN_PROVINCES } from '@/lib/iran-cities';
import { SearchableSelect } from '@/components/admin/SearchableSelect';
import { AdminUserDetail } from './AdminUserDetail';

interface AdminUser {
  id: number;
  phone: string | null;
  email: string | null;
  name: string | null;
  avatar: string | null;
  isAdmin: boolean;
  isActive: boolean;
  userType: string | null;
  createdAt: string;
  totalOrders: number;
  totalSpent: number;
  addresses: any[];
  orders: any[];
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('fa-IR').format(price) + ' تومان';
};

const persianDate = (isoString: string) => {
  return new Intl.DateTimeFormat('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(isoString));
};

export function AdminUsers({ token }: { token: string }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState(''); // For the debounce/form
  const [filterRole, setFilterRole] = useState('');
  const [filterProvince, setFilterProvince] = useState('');
  const [filterCity, setFilterCity] = useState('');

  // Modals
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [actionTarget, setActionTarget] = useState<{ user: AdminUser, type: 'status' } | null>(null);
  const [updating, setUpdating] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const url = new URL('/api/admin/users', window.location.origin);
      url.searchParams.set('page', String(page));
      url.searchParams.set('limit', '15');
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (filterRole) url.searchParams.set('userType', filterRole);
      if (filterProvince) url.searchParams.set('province', filterProvince);
      if (filterCity) url.searchParams.set('city', filterCity);

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      setUsers(data.users || []);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
    } catch {
      toast.error('خطا در دریافت مشتریان');
    } finally {
      setLoading(false);
    }
  }, [token, page, searchQuery, filterRole, filterProvince, filterCity]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput);
  };

  
  const handleExport = async () => {
    try {
      const url = new URL('/api/admin/users', window.location.origin);
      if (searchQuery) url.searchParams.set('q', searchQuery);
      if (filterRole) url.searchParams.set('userType', filterRole);
      if (filterProvince) url.searchParams.set('province', filterProvince);
      if (filterCity) url.searchParams.set('city', filterCity);
      url.searchParams.set('export', 'true');

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.users) {
        let csv = 'شناسه,نام و نام خانوادگی,شماره تماس,ایمیل,نقش,استان,شهر,آدرس کامل,تعداد سفارشات,مجموع خرید (تومان),وضعیت حساب,تاریخ عضویت\n';
        data.users.forEach((u: AdminUser) => {
          const addr = u.addresses?.[0] || {};
          const row = [
            u.id,
            u.name || 'بدون نام',
            u.phone || '',
            u.email || '',
            u.userType || 'مشخص نشده',
            addr.province || '',
            addr.city || '',
            addr.fullAddress || '',
            u.totalOrders,
            u.totalSpent,
            u.isActive ? 'فعال' : 'مسدود',
            new Date(u.createdAt).toLocaleDateString('fa-IR')
          ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
          csv += row + '\n';
        });

        const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `mersadent_customers_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        toast.success(`فایل اکسل با ${data.users.length} کاربر دانلود شد`);
      }
    } catch (e) {
      toast.error('خطا در دریافت خروجی اکسل');
    }
  };

  const handleUpdate = async () => {
    if (!actionTarget) return;
    setUpdating(true);
    try {
      const payload: any = { 
        id: actionTarget.user.id,
        isActive: !actionTarget.user.isActive
      };

      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      toast.success('تغییرات با موفقیت اعمال شد');
      setActionTarget(null);
      loadUsers();
    } catch {
      toast.error('خطا در اعمال تغییرات');
    } finally {
      setUpdating(false);
    }
  };

  if (selectedUserId) {
    return <AdminUserDetail userId={selectedUserId} token={token} onBack={() => setSelectedUserId(null)} />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#2FC4C9]" />
            مشتریان
          </h2>
          <p className="text-sm text-gray-500 mt-1">مدیریت کاربران، سطح دسترسی و بررسی سوابق</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <form onSubmit={handleSearch} className="relative w-full sm:w-96 flex">
          <Input 
            placeholder="جستجو نام، موبایل یا ایمیل..." 
            className="pl-10 h-10 rounded-l-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" className="rounded-r-none h-10 bg-gray-100 text-gray-600 hover:bg-gray-200" variant="secondary">
            <Search className="w-4 h-4" />
          </Button>
        </form>
        <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg font-medium border border-gray-100">
          تعداد کل کاربران: <span className="text-[#2FC4C9] font-bold">{new Intl.NumberFormat('fa-IR').format(totalCount)}</span> نفر
        </div>
      </div>

      {/* Filters Row */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400 shrink-0" />
        <select
          value={filterRole}
          onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="h-9 px-3 text-xs border border-gray-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-[#2FC4C9]/30 focus:border-[#2FC4C9]"
        >
          <option value="">همه نقش‌ها</option>
          <option value="دندانپزشک">دندانپزشک</option>
          <option value="دانشجو">دانشجو</option>
          <option value="متخصص">متخصص</option>
          <option value="لابراتوار">لابراتوار</option>
          <option value="سایر">سایر</option>
        </select>
        <SearchableSelect
          value={filterProvince}
          onChange={(val) => { setFilterProvince(val); setFilterCity(''); setPage(1); }}
          options={Object.keys(IRAN_PROVINCES).map(p => ({ value: p, label: p }))}
          placeholder="استان..."
          className="w-40"
        />
        <SearchableSelect
          value={filterCity}
          onChange={(val) => { setFilterCity(val); setPage(1); }}
          options={filterProvince && IRAN_PROVINCES[filterProvince] ? IRAN_PROVINCES[filterProvince].map((c: string) => ({ value: c, label: c })) : []}
          placeholder="شهر..."
          className="w-40"
          disabled={!filterProvince}
        />
        {(filterRole || filterProvince || filterCity) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setFilterRole(''); setFilterProvince(''); setFilterCity(''); setPage(1); }}
            className="text-xs text-red-500 hover:text-red-700 h-9"
          >
            پاک کردن فیلترها
          </Button>
        )}
        <div className="mr-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="h-9 text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Download className="w-3.5 h-3.5" />
            دانلود CSV
          </Button>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-20 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-600">کاربری یافت نشد</h3>
          <p className="text-sm text-gray-400 mt-1">جستجوی خود را تغییر دهید</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-medium">
                  <th className="px-4 py-3 text-center w-12">#</th>
                  <th className="px-4 py-3">مشخصات کاربر</th>
                  <th className="px-4 py-3">تماس</th>
                  <th className="px-4 py-3 hidden sm:table-cell">تاریخ عضویت</th>
                  <th className="px-4 py-3 text-center">سفارشات</th>
                  <th className="px-4 py-3">مجموع خرید</th>
                  <th className="px-4 py-3 text-center">وضعیت</th>
                  <th className="px-4 py-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u, idx) => {
                  const rowNum = (page - 1) * 15 + idx + 1;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 text-center text-xs text-gray-400">{rowNum}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-500 font-bold text-sm">
                            {u.avatar ? <img src={u.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : (u.name ? u.name.charAt(0) : 'U')}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800">{u.name || 'کاربر مهمان'}</p>
                            {u.userType && <span className="text-[10px] bg-[#2FC4C9]/10 text-[#2FC4C9] px-1.5 py-0.5 rounded-full">{u.userType}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-xs text-gray-600" dir="ltr">{u.phone || '—'}</p>
                        <p className="text-[10px] text-gray-400">{u.email || ''}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-xs text-gray-500">{persianDate(u.createdAt)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                          {u.totalOrders}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#2FC4C9]">
                        {formatPrice(u.totalSpent)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {u.isActive ? (
                          <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full border border-emerald-100">فعال</span>
                        ) : (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-full border border-red-100">مسدود</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => setSelectedUserId(u.id)} className="h-8 px-2 text-blue-600 border-blue-200 hover:bg-blue-50" title="جزئیات کاربر">
                            <Eye className="w-4 h-4" />
                          </Button>

                          <Button size="sm" variant="outline" onClick={() => setActionTarget({ user: u, type: 'status' })} className={`h-8 px-2 ${u.isActive ? 'text-red-500 border-red-200 hover:bg-red-50' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'}`} title={u.isActive ? 'مسدود کردن کاربر' : 'فعال‌سازی کاربر'}>
                            {u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-100 bg-gray-50/50">
              <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="h-8 text-xs bg-white">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                let p = page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                if (p < 1) p = 1;
                if (p > totalPages) p = totalPages;
                return (
                  <Button
                    key={i}
                    size="sm"
                    variant={page === p ? 'default' : 'outline'}
                    onClick={() => setPage(p)}
                    className={page === p ? 'bg-[#2FC4C9] hover:bg-[#2FC4C9]/90 text-white h-8 w-8 p-0 text-xs' : 'h-8 w-8 p-0 text-xs bg-white'}
                  >
                    {p}
                  </Button>
                );
              })}
              <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="h-8 text-xs bg-white">
                <ChevronLeft className="w-3.5 h-3.5 rotate-180" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      
      {/* 1. Action Confirmation Dialog */}
      <AlertDialog open={!!actionTarget} onOpenChange={() => setActionTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تایید عملیات</AlertDialogTitle>
            <AlertDialogDescription>
              {actionTarget?.user?.isActive
                ? `آیا مایل به مسدود کردن موقتِ «${actionTarget?.user?.name || actionTarget?.user?.phone}» هستید؟ این کاربر دیگر قادر به ورود به سایت نخواهد بود.`
                : `آیا مایل به فعال‌سازی مجددِ «${actionTarget?.user?.name || actionTarget?.user?.phone}» هستید؟`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); handleUpdate(); }} disabled={updating} className="bg-red-600 hover:bg-red-700">
              {updating && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              تایید تغییر وضعیت
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      
    </div>
  );
}
