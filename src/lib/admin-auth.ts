import { NextRequest, NextResponse } from 'next/server';
import { createHmac, randomBytes } from 'crypto';
import { db } from './db';

const getSecret = () => process.env.JWT_SECRET || 'fallback-secret-2024';

export function signAdminToken(username: string): string {
  const secret = getSecret();
  const payload = JSON.stringify({ sub: username, role: 'admin', exp: Date.now() + 86400000 });
  const iv = randomBytes(16).toString('hex');
  const hmac = createHmac('sha256', secret).update(iv + '.' + payload).digest('hex');
  return Buffer.from(iv + '.' + payload + '.' + hmac).toString('base64url');
}

export async function verifyAdminToken(request: NextRequest): Promise<{ sub: string; role: string } | null> {
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
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload as { sub: string; role: string };
  } catch {
    return null;
  }
}

export async function logActivity(action: string, detail?: string, userId?: string) {
  try {
    await db.activityLog.create({
      data: { action, detail: detail || null, userId: userId || null },
    });
  } catch (e) {
    console.error('Failed to log activity:', e);
  }
}

export function unauthorizedResponse() {
  return new Response(JSON.stringify({ error: 'دسترسی غیرمجاز' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}