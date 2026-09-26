import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, phone, email, password, role, pilotGlider } = body;

    if (!name || !username || !phone || !password) {
      return NextResponse.json(
        { error: 'Name, username, phone number, and password are required' },
        { status: 400 }
      );
    }

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const cleanPhone = phone.trim();

    // Check duplicate username or phone
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanUsername },
          { phone: cleanPhone },
          ...(email ? [{ email: email.trim().toLowerCase() }] : []),
        ],
      },
    });

    if (existing) {
      if (existing.username === cleanUsername) {
        return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
      }
      if (existing.phone === cleanPhone) {
        return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const assignedRole = role === 'PARTNER' ? 'PARTNER' : 'MEMBER';

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        username: cleanUsername,
        phone: cleanPhone,
        email: email ? email.trim().toLowerCase() : null,
        passwordHash,
        role: assignedRole,
        pilotGlider: pilotGlider?.trim() || null,
        status: 'ACTIVE',
      },
    });

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
      },
    });

    response.cookies.set({
      name: 'billing_auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;
  } catch (err: any) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
