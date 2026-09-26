import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const logs = await prisma.auditLog.findMany({
      include: {
        admin: {
          select: { id: true, name: true, username: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return NextResponse.json({ logs });
  } catch (err: any) {
    console.error('Audit logs error:', err);
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
