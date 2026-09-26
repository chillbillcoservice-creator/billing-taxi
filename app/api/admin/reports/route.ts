import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'PENDING';

    const reports = await prisma.chatReport.findMany({
      where: status === 'ALL' ? {} : { status },
      include: {
        reporter: {
          select: { id: true, name: true, username: true },
        },
        message: {
          include: {
            sender: {
              select: { id: true, name: true, username: true, role: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ reports });
  } catch (err: any) {
    console.error('Error fetching reports:', err);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
