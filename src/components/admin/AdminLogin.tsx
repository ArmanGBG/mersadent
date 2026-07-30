'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface AdminLoginProps {
  onLoginSuccess: (token: string) => void;
  onBack: () => void;
}

export function AdminLogin({ onLoginSuccess, onBack }: AdminLoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast.error('نام کاربری و رمز عبور را وارد کنید');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'خطا در ورود');
        return;
      }

      localStorage.setItem('admin_token', data.token);
      onLoginSuccess(data.token);
      toast.success('ورود موفقیت‌آمیز');
    } catch {
      toast.error('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#16233F] p-4" dir="rtl">
      <div className="w-full max-w-md">
        <button
          onClick={onBack}
          className="text-white/60 hover:text-white text-sm mb-6 block mx-auto transition-colors"
        >
          ← بازگشت به سایت
        </button>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="text-center pb-2">
            <div className="w-16 h-16 bg-[#2FC4C9] rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-[#16233F]">پنل مدیریت</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">آرکا مرصاد | MersaDent</p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">نام کاربری</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="pr-10"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">رمز عبور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="pr-10"
                    placeholder="رمز عبور"
                    autoComplete="current-password"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full bg-[#16233F] hover:bg-[#1e2d4d]" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                ورود به پنل مدیریت
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}