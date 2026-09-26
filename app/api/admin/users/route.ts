import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const status = searchParams.get('status');
    const q = searchParams.get('q');

    const where: any = {};
    if (role && role !== 'ALL') where.role = role;
    if (status && status !== 'ALL') where.status = status;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { username: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        email: true,
        role: true,
        status: true,
        pilotGlider: true,
        pilotLicenseNumber: true,
        isPilotVerified: true,
        mutedUntil: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ users });
  } catch (err: any) {
    console.error('Error fetching admin users:', err);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
