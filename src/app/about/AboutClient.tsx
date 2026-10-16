'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Home, Shield, Star, Users, CheckCircle2 } from 'lucide-react';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { useAppNavigation } from '@/hooks/useAppNavigation';

const fadeIn = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 }
};

export default function AboutClient() {
  const navigate = useAppNavigation();

  return (
    <motion.div {...fadeIn} className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink onClick={() => navigate({ type: 'home' })} className="cursor-pointer flex items-center gap-1 text-sm">
              <Home className="w-3.5 h-3.5" />
              خانه
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>درباره ما</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="MersaDent" className="h-16 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-mersadent-dark mb-3">درباره مرصادنت</h1>
          <p className="text-base text-gray-500 leading-7">
            MersaDent (مرصادنت) - یکی از معتبرترین تأمین‌کنندگان تجهیزات و مواد مصرفی دندانپزشکی در ایران
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">تاریخچه و تجربه</h2>
                  <p className="text-sm text-gray-500 leading-7">
                    شرکت مرصادنت با بیش از یک دهه تجربه در زمینه واردات و توزیع تجهیزات دندانپزشکی، همواره در تلاش بوده تا بهترین و باکیفیت‌ترین محصولات را در اختیار دندانپزشکان سراسر کشور قرار دهد. ما با ایجاد ارتباط مستقیم با تولیدکنندگان معتبر جهانی، محصولات اصل و با گارانتی را ارائه می‌دهیم.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">ماموریت ما</h2>
                  <p className="text-sm text-gray-500 leading-7">
                    ماموریت ما ارائه تجهیزات دندانپزشکی با کیفیت و قیمت مناسب به جامعه دندانپزشکی ایران است. ما معتقدیم که هر دندانپزشک حق دارد از بهترین ابزار و تجهیزات برای درمان بیماران خود بهره‌مند شود.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-mersadent-accent/10 text-mersadent-accent flex-shrink-0">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-mersadent-dark mb-2">چرا مرصادنت؟</h2>
                  <ul className="text-sm text-gray-500 leading-7 flex flex-col gap-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      نماینده رسمی برندهای معتبر بین‌المللی
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      گارانتی اصالت و سلامت کالا
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      مشاوره رایگان فنی و فروش
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      ارسال سریع به سراسر کشور
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-mersadent-accent flex-shrink-0 mt-1" />
                      خدمات پس از فروش و پشتیبانی
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
