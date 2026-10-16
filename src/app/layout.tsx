export const dynamic = "force-dynamic";
import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AppProvider } from "@/contexts/AppContext";
import { db } from "@/lib/db";
import { CompareProvider, CompareFloatingBar } from "@/components/compare";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";



export const metadata: Metadata = {
  title: "MersaDent | مرصادنت - تأمین‌کننده تجهیزات دندانپزشکی",
  description: "MersaDent (مرصادنت) - عرضه‌کننده انواع تجهیزات و مواد مصرفی دندانپزشکی با بهترین قیمت و گارانتی اصالت کالا. توربین، آنگل، کیورینگ لایت، اسکیلر، یونیت دندانپزشکی و بسیاری تجهیزات دیگر.",
  keywords: ["MersaDent", "مرصادنت", "تجهیزات دندانپزشکی", "توربین دندانپزشکی", "آنگل", "کیورینگ لایت", "اسکیلر", "یونیت دندانپزشکی", "اتوکلاو"],
  authors: [{ name: "MersaDent" }],
  openGraph: {
    title: "MersaDent | مرصادنت",
    description: "تأمین‌کننده تجهیزات دندانپزشکی",
    type: "website",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/logo.png', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  // Fetch site settings server-side for Footer and Layout
  const settingsRows = await db.siteSetting.findMany();
  const settings: Record<string, string> = {};
  settingsRows.forEach(r => settings[r.key] = r.value);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.0.0/Vazirmatn-font-face.css" rel="stylesheet" type="text/css" />
      </head>
      <body
        className={`font-vazirmatn font-sans antialiased bg-mersadent-bg text-foreground min-h-screen flex flex-col`}
      >
        <AppProvider>
          <CompareProvider>
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer settings={settings} />
            <MobileBottomNav />
            <CompareFloatingBar />
          </CompareProvider>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}