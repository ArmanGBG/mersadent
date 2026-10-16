'use client';
import React, { useState, useEffect } from 'react';
import { Phone, MapPin, Mail, Instagram, Send, MessageCircle, ExternalLink, Clock } from 'lucide-react';
import { useAppNavigation } from '@/hooks/useAppNavigation';
import { Category, useAppContext } from '@/contexts/AppContext';

export function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const navigate = useAppNavigation();
  const onNavigate = navigate;
  const { categories } = useAppContext();

  // Normalize a phone string for tel: href (strip non-digits, convert Persian digits)
  const telHref = (raw: string) => {
    if (!raw) return '';
    const persian = '۰۱۲۳۴۵۶۷۸۹';
    let out = '';
    for (const ch of raw) {
      const idx = persian.indexOf(ch);
      out += idx >= 0 ? String(idx) : ch;
    }
    return `tel:${out.replace(/[^\d+]/g, '')}`;
  };

  const phone = settings.phone?.trim() || '';
  const email = settings.email?.trim() || '';
  const address = settings.address?.trim() || '';
  const instagram = settings.instagram?.trim() || '';
  const telegram = settings.telegram?.trim() || '';
  const whatsapp = settings.whatsapp?.trim() || '';
  const hasSocial = instagram || telegram || whatsapp;
  const enamadCode = (settings.enamad_code || '').trim().replace(/[^\d]/g, '');

  return (
    <footer className="bg-mersadent-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10">
          {/* Company info */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img src="/logo.png" alt="MersaDent" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-sm text-gray-400 leading-7">
              {settings.site_description || 'تأمین‌کننده انواع تجهیزات و مواد مصرفی دندانپزشکی با بهترین کیفیت و قیمت'}
            </p>
            {hasSocial && (
              <div className="flex items-center gap-2 mt-4">
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="اینستاگرام"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {telegram && (
                  <a
                    href={telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تلگرام"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="واتساپ"
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-mersadent-accent/20 text-gray-300 hover:text-mersadent-accent flex items-center justify-center transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-bold mb-4">دسته‌بندی‌ها</h3>
            <ul className="flex flex-col gap-2">
              {categories.slice(0, 6).map(cat => (
                <li key={cat.id}>
                  <button
                    onClick={() => {
                      onNavigate({ type: 'category', categoryId: cat.id, slug: cat.slug });
                      window.scrollTo(0, 0);
                    }}
                    className="text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-bold mb-4">دسترسی سریع</h3>
            <ul className="flex flex-col gap-2">
              {[
                { label: 'صفحه اصلی', action: () => { onNavigate({ type: 'home' }); window.scrollTo(0, 0); } },
                { label: 'مقالات آموزشی', action: () => { onNavigate({ type: 'blog' }); window.scrollTo(0, 0); } },
                { label: 'برندها', action: () => { onNavigate({ type: 'brand', brandId: 0, brandName: 'all' }); window.scrollTo(0, 0); } },
                { label: 'درباره ما', action: () => { onNavigate({ type: 'about' }); window.scrollTo(0, 0); } },
                { label: 'قوانین و مقررات', href: '/terms' },
                { label: 'شرایط بازگشت کالا', href: '/returns' },
              ].map((item: any) => (
                <li key={item.label}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      onClick={item.action}
                      className="text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                    >
                      {item.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold mb-4">تماس با ما</h3>
            <ul className="flex flex-col gap-3">
              {phone && (
                <li>
                  <a href={telHref(phone)} className="flex items-center gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors">
                    <Phone className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                    <span dir="ltr" className="text-right">{phone}</span>
                  </a>
                </li>
              )}
              {email && (
                <li>
                  <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors">
                    <Mail className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                    <span dir="ltr" className="text-right">{email}</span>
                  </a>
                </li>
              )}
              {address && (
                <li>
                  <a
                    href={`https://nshn.ir/search?q=${encodeURIComponent(address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-sm text-gray-400 hover:text-mersadent-accent transition-colors"
                  >
                    <MapPin className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-0.5" />
                    <span>{address}</span>
                    <ExternalLink className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  </a>
                </li>
              )}
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Clock className="w-4 h-4 text-mersadent-accent flex-shrink-0" />
                شنبه تا پنجشنبه ۹ - ۱۸
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Trust badges — e-Namad (auto-shown when enamad_code is set) */}
      {enamadCode && (
        <div className="border-t border-white/10 bg-white/5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-center sm:justify-start">
            <a
              href={`https://trustseal.enamad.ir/?id=${enamadCode}`}
              target="_blank"
              rel="noopener noreferrer"
              referrerPolicy="origin"
              className="inline-block bg-white rounded-md p-1.5 shadow-sm hover:shadow-md transition-shadow"
              aria-label="نماد اعتماد الکترونیکی (ای‌نماد)"
              title="نماد اعتماد الکترونیکی"
            >
              <img
                referrerPolicy="origin"
                src={`https://trustseal.enamad.ir/logo.aspx?id=${enamadCode}`}
                alt="نماد اعتماد الکترونیکی"
                className="h-20 w-auto block"
              />
            </a>
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © ۱۴۰۴ MersaDent. تمامی حقوق محفوظ است.
          </p>
          <p className="text-xs text-gray-500">
            طراحی و توسعه armangbg
          </p>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN APP
// ============================================================
