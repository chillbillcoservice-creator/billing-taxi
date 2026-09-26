import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const isSender = message.senderId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isSender && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Soft delete to preserve conversation integrity
    await prisma.chatMessage.update({
      where: { id: params.id },
      data: { isDeleted: true },
    });

    if (isStaff && !isSender) {
      await logAdminAction(
        user.id,
        'DELETE_CHAT_MESSAGE',
        'CHAT_MESSAGE',
        params.id,
        `Moderator deleted message from sender ${message.senderId}`
      );
    }

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (err: any) {
    console.error('Delete message error:', err);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
