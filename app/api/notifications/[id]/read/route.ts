import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await prisma.notification.updateMany({
      where: { id: params.id, userId: user.id },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error marking notification read:', err);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
