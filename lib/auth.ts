import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import prisma from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'billing-taxi-secret-key-bir-takeoff-2400m';

export interface TokenPayload {
  userId: string;
  username: string;
  role: string;
  status: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export async function getSessionUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('billing_auth_token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    if (!payload) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        avatarUrl: true,
        role: true,
        status: true,
        pilotGlider: true,
        pilotLicenseNumber: true,
        isPilotVerified: true,
        mutedUntil: true,
      },
    });

    if (!user || user.status === 'BANNED') {
      return null;
    }

    return user;
  } catch (err) {
    return null;
  }
}

export async function requireAuth(allowedRoles?: string[]) {
  const user = await getSessionUser();
  if (!user) {
    throw new Error('UNAUTHORIZED');
  }
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new Error('FORBIDDEN');
  }
  return user;
}
