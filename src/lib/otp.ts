import bcrypt from 'bcryptjs';
import { db } from './db';
import crypto from 'node:crypto';

export const OTP_TTL_MS = 2 * 60 * 1000;
export const OTP_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export async function requestOtp(phone: string, purpose: string, sendOtpSms: (phone: string, code: string) => Promise<void>): Promise<string> {
  const normalizedPhone = canonicalizePhone(phone);

  const latest = await db.oTP.findFirst({
    where: { phone: normalizedPhone, purpose },
    orderBy: { createdAt: 'desc' },
  });

  if (latest && Date.now() - latest.createdAt.getTime() < OTP_COOLDOWN_MS) {
    const remaining = Math.ceil((OTP_COOLDOWN_MS - (Date.now() - latest.createdAt.getTime())) / 1000);
    throw new Error(`لطفاً ${remaining} ثانیه دیگر صبر کنید`);
  }

  const code = crypto.randomInt(100000, 1000000).toString();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await db.oTP.create({
    data: { phone: normalizedPhone, purpose, codeHash, expiresAt },
  });

  try {
    await sendOtpSms(normalizedPhone, code);
  } catch (error) {
    await db.oTP.deleteMany({ where: { phone: normalizedPhone, purpose, consumedAt: null } });
    throw error;
  }

  return code;
}

export async function verifyOtp(phone: string, purpose: string, code: string): Promise<boolean> {
  const normalizedPhone = canonicalizePhone(phone);

  const challenge = await db.oTP.findFirst({
    where: { phone: normalizedPhone, purpose, consumedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) return false;
  if (challenge.expiresAt < new Date()) return false;
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) return false;

  const isValid = await bcrypt.compare(code, challenge.codeHash);

  if (!isValid) {
    await db.oTP.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }

  await db.oTP.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  });

  return true;
}

export function canonicalizePhone(phone: string): string {
  const digits = phone
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/\D/g, '');

  if (digits.length === 10 && digits.startsWith('9')) return `+98${digits}`;
  if (digits.length === 11 && digits.startsWith('09')) return `+98${digits.slice(1)}`;
  if (digits.length === 12 && digits.startsWith('98')) return `+${digits}`;
  return phone.startsWith('+98') ? `+${digits}` : digits;
}

export function phoneVariants(phone: string): string[] {
  const canonical = canonicalizePhone(phone);
  if (!/^\+989\d{9}$/.test(canonical)) return [canonical];
  return [canonical, `0${canonical.slice(3)}`];
}
