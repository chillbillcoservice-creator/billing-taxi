import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Only admins and safety marshals can pin announcements' }, { status: 403 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const updated = await prisma.chatMessage.update({
      where: { id: params.id },
      data: { isPinned: !message.isPinned },
    });

    await logAdminAction(
      user.id,
      updated.isPinned ? 'PIN_CHAT_MESSAGE' : 'UNPIN_CHAT_MESSAGE',
      'CHAT_MESSAGE',
      params.id,
      `${user.username} toggled pin status to ${updated.isPinned}`
    );

    return NextResponse.json({ success: true, isPinned: updated.isPinned });
  } catch (err: any) {
    console.error('Error toggling pin status:', err);
    return NextResponse.json({ error: 'Failed to update pin status' }, { status: 500 });
  }
}
