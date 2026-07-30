import { NextRequest } from 'next/server';
import { createHmac, randomBytes } from 'crypto';

const getSecret = () => process.env.JWT_SECRET || 'fallback-secret-2024';

/** 7 days in ms */
const USER_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000;

export function signUserToken(userId: number): string {
  const secret = getSecret();
  const payload = JSON.stringify({ userId, type: 'user', exp: Date.now() + USER_TOKEN_TTL });
  const iv = randomBytes(16).toString('hex');
  const hmac = createHmac('sha256', secret).update(iv + '.' + payload).digest('hex');
  return Buffer.from(iv + '.' + payload + '.' + hmac).toString('base64url');
}

export async function verifyUserToken(request: NextRequest): Promise<{ userId: number; type: string } | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const parts = decoded.split('.');
    if (parts.length !== 3) return null;

    const [iv, payloadStr, hmac] = parts;
    const secret = getSecret();
    const expectedHmac = createHmac('sha256', secret).update(iv + '.' + payloadStr).digest('hex');

    if (hmac !== expectedHmac) return null;

    const payload = JSON.parse(payloadStr);
    if (payload.type !== 'user') return null;
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload as { userId: number; type: string };
  } catch {
    return null;
  }
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}