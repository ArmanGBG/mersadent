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

const OTP_LENGTH = 6;
const COUNTDOWN_SECONDS = 60;

function maskPhone(phone: string): string {
  if (phone.length < 8) return phone;
  return phone.slice(0, 5) + '***' + phone.slice(-3);
}

export function AuthModal({ open, onOpenChange, onLoginSuccess }: AuthModalProps) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [authMode, setAuthMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
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
        setName('');
        setAuthMode('LOGIN');
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
    let digits = phone.replace(/\D/g, '');
    if (digits.startsWith('98')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = digits.slice(1);
    if (!/^9\d{9}$/.test(digits)) {
      setError('لطفاً شماره موبایل معتبر وارد کنید');
      return;
    }
    const fullPhone = '+98' + digits;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: fullPhone, purpose: authMode }),
      });
      const data = await res.json();
      if (data.success) {
        setPhone(digits);
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
      setError('لطفاً کد ۶ رقمی را کامل وارد کنید');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const endpoint = authMode === 'SIGNUP' ? '/api/auth/register' : '/api/auth/verify-otp';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `+98${phone}`, code, purpose: authMode, name }),
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
        body: JSON.stringify({ phone: `+98${phone}`, purpose: authMode }),
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
                  {authMode === 'SIGNUP' ? 'ثبت‌نام' : 'ورود'}
                </DialogTitle>
                <DialogDescription className="text-right text-sm text-gray-500">
                  {authMode === 'SIGNUP' ? 'ابتدا حساب کاربری بسازید' : 'با حساب ثبت‌شده خود وارد شوید'}
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-5">
                {authMode === 'SIGNUP' && (
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="نام و نام خانوادگی" className="h-11 rounded-xl" />
                )}

                {/* Phone input with fixed country prefix */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-mersadent-dark">شماره موبایل</label>
                  <div className="flex items-center gap-0" dir="ltr">
                    <span className="flex items-center justify-center h-11 px-3 bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl text-sm font-medium text-gray-600 whitespace-nowrap" dir="ltr">
                      +98
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
                         placeholder="9XXXXXXXXX"
                        className="pr-10 pl-4 h-11 text-left rounded-r-xl font-mono tracking-wider focus-visible:ring-mersadent-accent/30 focus-visible:border-mersadent-accent"
                         maxLength={10}
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
                  disabled={loading || (phone.replace(/\D/g, '').replace(/^98/, '').replace(/^0/, '').length !== 10) || (authMode === 'SIGNUP' && !name.trim())}
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

                <button
                  type="button"
                  onClick={() => { setAuthMode(authMode === 'LOGIN' ? 'SIGNUP' : 'LOGIN'); setError(''); }}
                  className="text-sm text-mersadent-accent hover:underline"
                >
                  {authMode === 'LOGIN' ? 'حساب ندارید؟ ثبت‌نام کنید' : 'قبلاً ثبت‌نام کرده‌اید؟ وارد شوید'}
                </button>

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
                    {maskPhone(`+98${phone}`)}
                  </span>{' '}
                  را وارد کنید
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-5">
                {/* Six separate digit inputs */}
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
