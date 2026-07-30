import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const vazirmatn = Vazirmatn({
  subsets: ["arabic"],
  variable: "--font-vazirmatn",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body
        className={`${vazirmatn.variable} ${geistMono.variable} font-sans antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}