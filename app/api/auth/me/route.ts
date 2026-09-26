import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ user: null });
    }

    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      user,
      unreadNotifications,
    });
  } catch (err: any) {
    console.error('Error fetching session user:', err);
    return NextResponse.json({ user: null });
  }
}
