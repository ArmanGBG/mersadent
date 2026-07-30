'use client';

import { useState, useEffect, useRef, useCallback, type KeyboardEvent, type ClipboardEvent, type FocusEvent } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Phone, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';

// Simple Google SVG icon (inline to avoid extra deps)
function GoogleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

interface User {
  id: number;
  name: string | null;
  phone: string | null;
  email: string | null;
  avatar: string | null;
}

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (user: User, token: string) => void;
}

const OTP_LENGTH = 5;
const COUNTDOWN_SECONDS = 60;

function maskPhone(phone: string): string {
  if (phone.length < 11) return phone;
  return phone.slice(0, 4) + '***' + phone.slice(-3);
}

export function AuthModal({ open, onOpenChange, onLoginSuccess }: AuthModalProps) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // OTP digit refs
  const digitRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setStep(1);
        setPhone('');
        setCountdown(0);
        setError('');
      });
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  // Auto-focus first digit when step 2 mounts
  useEffect(() => {
    if (step === 2 && digitRefs.current[0]) {
      // Small delay to ensure the DOM is ready
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [step]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    timerRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [countdown]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const getOtpValue = useCallback((): string => {
    return digitRefs.current.map(ref => ref?.value || '').join('');
  }, []);

  const clearDigits = useCallback(() => {
    digitRefs.current.forEach(ref => {
      if (ref) ref.value = '';
    });
  }, []);

  const handleSendOtp = async () => {
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 9) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }
    const fullPhone = '09' + digits;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone }),
      });
      const data = await res.json();
      if (data.success) {
        setPhone(fullPhone);
        setStep(2);
        clearDigits();
        setCountdown(COUNTDOWN_SECONDS);
        // Dev mode: show the code
        if (data.code) {
          toast.info(`کد تایید: ${data.code}`, { duration: 10000 });
        }
      } else {
        setError(data.error || 'خطا در ارسال کد');
      }
    } catch {
      setError('خطای شبکه');
    }
    setLoading(false);
  };

  const handleVerifyOtp = async () => {
    const code = getOtpValue();
    if (code.length < OTP_LENGTH) {
      setError('لطفاً کد ۵ رقمی را کامل وارد کنید');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user_token', data.token);
        onLoginSuccess(data.user, data.token);
        onOpenChange(false);
        toast.success('ورود با موفقیت انجام شد');
      } else {
        setError(data.error || 'کد تایید نادرست است');
      }
    } catch {
      setError('خطای شبکه');
    }
    setLoading(false);
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (data.success) {
        setCountdown(COUNTDOWN_SECONDS);
        clearDigits();
        if (digitRefs.current[0]) digitRefs.current[0].focus();
        if (data.code) {
          toast.info(`کد جدید: ${data.code}`, { duration: 10000 });
        }
      } else {
        setError(data.error || 'خطا در ارسال مجدد کد');
      }
    } catch {
      setError('خطای شبکه');
    }
    setLoading(false);
  };

  const handleDigitInput = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    e.target.value = val.slice(0, 1);
    setError('');

    if (val && index < OTP_LENGTH - 1) {
      digitRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits are filled
    const totalFilled = digitRefs.current.reduce((sum, ref) => sum + (ref?.value ? 1 : 0), 0);
    if (totalFilled === OTP_LENGTH) {
      setTimeout(() => {
        const code = getOtpValue();
        if (code.length === OTP_LENGTH) {
          handleVerifyOtp();
        }
      }, 300);
    }
  };

  const handleDigitKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digitRefs.current[index]?.value && index > 0) {
        digitRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      digitRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      e.preventDefault();
      digitRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitFocus = (index: number, e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handleDigitPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    pasted.split('').forEach((char, i) => {
      if (digitRefs.current[i]) {
        digitRefs.current[i]!.value = char;
      }
    });

    // Focus the next empty input or the last one
    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    digitRefs.current[focusIndex]?.focus();

    // Auto-submit if all filled
    if (pasted.length === OTP_LENGTH) {
      setTimeout(() => handleVerifyOtp(), 300);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Try to call the Google auth API
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('user_token', data.token);
        onLoginSuccess(data.user, data.token);
        onOpenChange(false);
        toast.success('ورود با موفقیت انجام شد');
      } else {
        toast.error(data.error || 'خطا در ورود با گوگل');
      }
    } catch {
      toast.error('خطای شبکه. لطفاً دوباره تلاش کنید.');
    }
    setLoading(false);
  };

  const handleBackToPhone = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setStep(1);
    setCountdown(0);
    setError('');
    clearDigits();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Accent bar at top */}
        <div className="h-1 bg-mersadent-accent" />

        <div className="p-6 sm:p-8">
          {step === 1 ? (
            /* ========== STEP 1: Phone Number ========== */
            <>
              <DialogHeader className="space-y-2 mb-6">
                <DialogTitle className="text-right text-xl font-bold text-mersadent-dark">
                  ورود / ثبت‌نام
                </DialogTitle>
                <DialogDescription className="text-right text-sm text-gray-500">
                  شماره موبایل خود را وارد کنید
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-5">
                {/* Google Login Button */}
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 h-11 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 bg-white font-medium text-sm text-gray-700 transition-all disabled:opacity-50"
                >
                  <GoogleIcon className="w-5 h-5" />
                  ورود با حساب گوگل
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400">یا</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Phone input with 09 prefix label */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-mersadent-dark">شماره موبایل</label>
                  <div className="flex items-center gap-0" dir="ltr">
                    <span className="flex items-center justify-center h-11 px-3 bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl text-sm font-medium text-gray-600 whitespace-nowrap">
                      09
                    </span>
                    <div className="relative flex-1">
                      <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setPhone(val);
                          setError('');
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSendOtp();
                        }}
                        placeholder="XXXXXXXXX"
                        className="pr-10 pl-4 h-11 text-left rounded-r-xl font-mono tracking-wider focus-visible:ring-mersadent-accent/30 focus-visible:border-mersadent-accent"
                        maxLength={9}
                        type="tel"
                        autoFocus
                      />
                    </div>
                  </div>
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-500 text-right">{error}</p>
                )}

                {/* Submit button */}
                <Button
                  onClick={handleSendOtp}
                  disabled={loading || phone.replace(/\D/g, '').length < 9}
                  className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white h-11 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4 ml-2" />
                      ارسال کد تایید
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-gray-400 text-center leading-5">
                  با ورود یا ثبت‌نام،{' '}
                  <span className="text-gray-500 underline">شرایط و قوانین</span>{' '}
                  مرصادنت را می‌پذیرید.
                </p>
              </div>
            </>
          ) : (
            /* ========== STEP 2: OTP Code ========== */
            <>
              <DialogHeader className="space-y-2 mb-6">
                <DialogTitle className="text-right text-xl font-bold text-mersadent-dark">
                  کد تایید
                </DialogTitle>
                <DialogDescription className="text-right text-sm text-gray-500">
                  کد ارسال شده به{' '}
                  <span className="font-bold text-mersadent-dark" dir="ltr">
                    {maskPhone(phone)}
                  </span>{' '}
                  را وارد کنید
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-5">
                {/* 5 separate digit inputs */}
                <div className="flex justify-center gap-2.5 sm:gap-3" dir="ltr">
                  {Array.from({ length: OTP_LENGTH }).map((_, i) => (
                    <input
                      key={i}
                      ref={(el) => { digitRefs.current[i] = el; }}
                      type="tel"
                      inputMode="numeric"
                      maxLength={1}
                      onChange={(e) => handleDigitInput(i, e)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      onFocus={(e) => handleDigitFocus(i, e)}
                      onPaste={i === 0 ? handleDigitPaste : undefined}
                      className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                        text-mersadent-dark
                        focus:border-mersadent-accent focus:ring-2 focus:ring-mersadent-accent/20
                        border-gray-200
                        hover:border-gray-300
                      `}
                      autoComplete="one-time-code"
                    />
                  ))}
                </div>

                {/* Error message */}
                {error && (
                  <p className="text-sm text-red-500 text-right">{error}</p>
                )}

                {/* Verify button */}
                <Button
                  onClick={handleVerifyOtp}
                  disabled={loading}
                  className="w-full bg-mersadent-accent hover:bg-mersadent-accent/90 text-white h-11 rounded-xl font-semibold transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 ml-2" />
                      تایید
                    </>
                  )}
                </Button>

                {/* Actions row */}
                <div className="flex items-center justify-center gap-4 text-sm">
                  <button
                    onClick={handleBackToPhone}
                    className="text-gray-500 hover:text-mersadent-accent transition-colors flex items-center gap-1"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    تغییر شماره
                  </button>

                  <span className="text-gray-200">|</span>

                  <button
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || loading}
                    className="text-mersadent-accent hover:text-mersadent-accent/80 disabled:text-gray-400 transition-colors"
                  >
                    {countdown > 0 ? (
                      `ارسال مجدد (${new Intl.NumberFormat('fa-IR').format(countdown)} ثانیه)`
                    ) : (
                      'ارسال مجدد کد'
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}