import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = body; // REVIEWED, DISMISSED

    const report = await prisma.chatReport.update({
      where: { id: params.id },
      data: { status: status || 'REVIEWED' },
    });

    await logAdminAction(
      user.id,
      'RESOLVE_CHAT_REPORT',
      'CHAT_REPORT',
      params.id,
      `Moderator marked report as ${status}`
    );

    return NextResponse.json({ success: true, report });
  } catch (err: any) {
    console.error('Error resolving report:', err);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
