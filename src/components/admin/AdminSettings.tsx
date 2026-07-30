'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, Globe, Phone, Mail, MapPin, Instagram, MessageCircle, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { adminFetch } from '@/lib/admin-utils';

export function AdminSettings({ token }: { token: string }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<number | null>(null);
  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    adminFetch(token, '/api/admin/settings')
      .then(r => r.json())
      .then(d => { if (d.settings) setSettings(d.settings); })
      .finally(() => setLoading(false));
  }, [token]);

  const update = (key: string, value: string) => setSettings(prev => ({ ...prev, [key]: value }));

  // ---- Hero image upload ----
  const handleHeroUpload = async (slideNum: number, file: File) => {
    if (file.size > 4 * 1024 * 1024) {
      toast.error('حجم فایل نباید بیشتر از ۴ مگابایت باشد');
      return;
    }
    setUploadingSlide(slideNum);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slide', String(slideNum));
      const res = await fetch('/api/admin/hero/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      update(`hero_slide_${slideNum}_image`, data.url);
      toast.success('تصویر اسلاید آپلود شد');
    } catch {
      toast.error('خطا در آپلود تصویر');
    } finally {
      setUploadingSlide(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await adminFetch(token, '/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success('تنظیمات ذخیره شد');
    } catch { toast.error('خطا در ذخیره تنظیمات'); }
    finally { setSaving(false); }
  };

  if (loading) {
    return <div className="space-y-4"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      {/* Site Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#2FC4C9]" />
            اطلاعات سایت
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>نام سایت</Label>
              <Input value={settings.site_name || ''} onChange={e => update('site_name', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>تلفن</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={settings.phone || ''} onChange={e => update('phone', e.target.value)} className="pr-10" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>توضیحات سایت</Label>
            <Input value={settings.site_description || ''} onChange={e => update('site_description', e.target.value)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>ایمیل</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={settings.email || ''} onChange={e => update('email', e.target.value)} className="pr-10" dir="ltr" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>آدرس</Label>
              <div className="relative">
                <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input value={settings.address || ''} onChange={e => update('address', e.target.value)} className="pr-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-[#2FC4C9]" />
            شبکه‌های اجتماعی
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Instagram className="w-4 h-4" /> اینستاگرام
              </Label>
              <Input value={settings.instagram || ''} onChange={e => update('instagram', e.target.value)} placeholder="https://instagram.com/..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>تلگرام</Label>
              <Input value={settings.telegram || ''} onChange={e => update('telegram', e.target.value)} placeholder="https://t.me/..." dir="ltr" />
            </div>
            <div className="space-y-2">
              <Label>واتساپ</Label>
              <Input value={settings.whatsapp || ''} onChange={e => update('whatsapp', e.target.value)} placeholder="https://wa.me/..." dir="ltr" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Slides */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">تنظیمات اسلایدشو (هیرو)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {[1, 2, 3, 4].map(i => {
            const imgVal = settings[`hero_slide_${i}_image`] || '';
            return (
              <div key={i} className="space-y-3">
                <h4 className="font-medium text-sm">اسلاید {i}</h4>

                {/* Image upload */}
                <div className="space-y-1.5">
                  <Label className="text-xs">تصویر اسلاید</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-32 h-16 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {imgVal ? (
                        <>
                          <img src={imgVal} alt={`پیش‌نمایش اسلاید ${i}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => update(`hero_slide_${i}_image`, '')}
                            className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                            aria-label="حذف تصویر"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <ImagePlus className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <input
                        ref={(el) => { fileInputRefs.current[i] = el; }}
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleHeroUpload(i, f);
                          e.target.value = '';
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRefs.current[i]?.click()}
                        disabled={uploadingSlide === i}
                      >
                        {uploadingSlide === i ? (
                          <><Loader2 className="w-4 h-4 ml-1.5 animate-spin" /> در حال آپلود...</>
                        ) : imgVal ? (
                          <><ImagePlus className="w-4 h-4 ml-1.5" /> تغییر تصویر</>
                        ) : (
                          <><ImagePlus className="w-4 h-4 ml-1.5" /> آپلود تصویر</>
                        )}
                      </Button>
                      <p className="text-[11px] text-muted-foreground">
                        تصویر با ابعاد افقی (مثلاً ۱۹۲۰×۱۰۸۰). حداکثر ۴ مگابایت.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">عنوان</Label>
                    <Input
                      value={settings[`hero_slide_${i}_title`] || ''}
                      onChange={e => update(`hero_slide_${i}_title`, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">زیرعنوان</Label>
                    <Input
                      value={settings[`hero_slide_${i}_subtitle`] || ''}
                      onChange={e => update(`hero_slide_${i}_subtitle`, e.target.value)}
                    />
                  </div>
                </div>

                {/* Optional purchase / navigation link */}
                <div className="space-y-1.5">
                  <Label className="text-xs">لینک خرید (اختیاری)</Label>
                  <Input
                    value={settings[`hero_slide_${i}_link`] || ''}
                    onChange={e => update(`hero_slide_${i}_link`, e.target.value)}
                    placeholder="مثلاً /category/all یا https://example.com/product"
                    dir="ltr"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    اگر پر کنید، دکمه‌ی «مشاهده تجهیزات» روی این اسلاید به این آدرس هدایت می‌شود. خالی بگذارید تا رفتار پیش‌فرض (رفتن به همه دسته‌بندی‌ها) حفظ شود.
                  </p>
                </div>

                {i < 4 && <Separator />}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#16233F] hover:bg-[#1e2d4d] px-8">
          {saving ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Save className="w-4 h-4 ml-2" />}
          ذخیره تنظیمات
        </Button>
      </div>
    </div>
  );
}