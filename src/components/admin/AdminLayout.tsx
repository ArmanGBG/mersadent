'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Package, FolderOpen, Award, FileText, FolderCog,
  Settings, Users, LogOut, Menu, X, ChevronRight, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'products', label: 'محصولات', icon: Package },
  { id: 'categories', label: 'دسته‌بندی‌ها', icon: FolderOpen },
  { id: 'brands', label: 'برندها', icon: Award },
  { id: 'blog', label: 'مقالات', icon: FileText },
  { id: 'blog-categories', label: 'دسته بلاگ', icon: FolderCog },
  { id: 'orders', label: 'سفارشات', icon: ShoppingCart },
  { id: 'users', label: 'مشتریان', icon: Users },
  { id: 'settings', label: 'تنظیمات', icon: Settings },
];

interface SidebarNavProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
  onClose?: () => void;
}

function SidebarNav({ activeSection, onNavigate, onLogout, onClose }: SidebarNavProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 flex items-center gap-3">
        <div className="w-10 h-10 bg-[#2FC4C9] rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="min-w-0">
          <h2 className="text-white font-bold text-base truncate">MersaDent</h2>
          <p className="text-white/50 text-xs">پنل مدیریت</p>
        </div>
      </div>
      <Separator className="bg-white/10" />
      <ScrollArea className="flex-1 py-3">
        <nav className="space-y-1 px-3">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); onClose?.(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-[#2FC4C9]/15 text-[#2FC4C9]'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 mr-auto" />}
              </button>
            );
          })}
        </nav>
      </ScrollArea>
      <Separator className="bg-white/10" />
      <div className="p-3">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          <span>خروج</span>
        </button>
      </div>
    </div>
  );
}

interface AdminLayoutProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

export function AdminLayout({ activeSection, onNavigate, onLogout, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const currentNav = NAV_ITEMS.find(n => n.id === activeSection);

  return (
    <div className="min-h-screen bg-gray-50 flex" dir="ltr">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#16233F] flex-col flex-shrink-0">
        <SidebarNav activeSection={activeSection} onNavigate={onNavigate} onLogout={onLogout} />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute right-0 top-0 bottom-0 w-64 bg-[#16233F] shadow-xl">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-3 left-3 text-white/60 hover:text-white z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarNav activeSection={activeSection} onNavigate={onNavigate} onLogout={onLogout} onClose={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b flex items-center px-4 lg:px-6 gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500 hover:text-gray-700"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800 flex items-center gap-2" dir="rtl">
            {currentNav && <currentNav.icon className="w-5 h-5 text-[#2FC4C9]" />}
            {currentNav?.label || 'داشبورد'}
          </h1>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-gray-500" dir="rtl">مدیر سیستم</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}