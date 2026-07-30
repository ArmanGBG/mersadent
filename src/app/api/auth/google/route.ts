import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { signUserToken } from '@/lib/user-auth';

export async function POST(request: NextRequest) {
  // Check if Google OAuth is configured
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({
      success: false,
      error: 'ورود با گوگل در حال حاضر فعال نیست. لطفاً از شماره موبایل استفاده کنید.',
    }, { status: 503 });
  }

  try {
    const body = await request.json();
    const { email, name, avatar, googleId } = body;

    const userGoogleId: string | null = googleId || null;
    const userEmail: string | null = email || null;
    const userName: string | null = name || null;
    const userAvatar: string | null = avatar || null;

    if (!userGoogleId && !userEmail) {
      return NextResponse.json({ success: false, error: 'شناسه گوگل یا ایمیل الزامی است' }, { status: 400 });
    }

    // Find existing user by googleId or email
    let user = userGoogleId
      ? await db.user.findUnique({ where: { googleId: userGoogleId } })
      : null;

    if (!user && userEmail) {
      user = await db.user.findUnique({ where: { email: userEmail } });
    }

    if (user) {
      // Update existing user: link google account if not already linked
      if (userGoogleId && !user.googleId) {
        user = await db.user.update({
          where: { id: user.id },
          data: {
            googleId: userGoogleId,
            ...(userAvatar && !user.avatar ? { avatar: userAvatar } : {}),
          },
        });
      }
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          googleId: userGoogleId,
          email: userEmail,
          name: userName,
          avatar: userAvatar,
        },
      });
    }

    const token = signUserToken(user.id);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ success: false, error: 'خطای سرور' }, { status: 500 });
  }
}