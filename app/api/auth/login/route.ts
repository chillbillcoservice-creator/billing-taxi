import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { identifier, password } = body;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/phone and password are required' },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier.toLowerCase() },
          { phone: cleanIdentifier },
          { email: cleanIdentifier.toLowerCase() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'BANNED') {
      return NextResponse.json(
        { error: 'Your account has been banned. Please contact association administrators.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = signToken({
      userId: user.id,
      username: user.username,
      role: user.role,
      status: user.status,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        phone: user.phone,
        email: user.email,
        role: user.role,
        status: user.status,
        isPilotVerified: user.isPilotVerified,
      },
    });

    response.cookies.set({
      name: 'billing_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (err: any) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during login' }, { status: 500 });
  }
}
