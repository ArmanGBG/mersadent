import { sendVerification } from './sms-arta';

export type SmsProvider = 'sandbox' | 'arta' | 'sms_ir';

export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER?.trim().toLowerCase();
  if (provider === 'sandbox' || provider === 'arta' || provider === 'sms_ir') {
    return provider;
  }
  if (provider) throw new Error('SMS_PROVIDER_INVALID');
  return 'sandbox';
}

export function isSmsSandbox(): boolean {
  return getSmsProvider() === 'sandbox';
}

export async function sendOtpSms(phone: string, code: string): Promise<void> {
  const provider = getSmsProvider();

  if (provider === 'sandbox') {
    return;
  }

  if (provider === 'arta') {
    await sendVerification(phone, code);
    return;
  }

  throw new Error(`SMS provider ${provider} is not implemented`);
}
