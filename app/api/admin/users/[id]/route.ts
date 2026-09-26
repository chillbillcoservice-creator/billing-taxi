import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const admin = await getSessionUser();
    if (!admin || admin.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: params.id },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { role, status, isPilotVerified, muteMinutes } = body;

    let mutedUntil = targetUser.mutedUntil;
    if (muteMinutes !== undefined) {
      if (muteMinutes > 0) {
        mutedUntil = new Date(Date.now() + muteMinutes * 60000);
      } else {
        mutedUntil = null;
      }
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
        ...(isPilotVerified !== undefined ? { isPilotVerified } : {}),
        mutedUntil,
      },
    });

    await logAdminAction(
      admin.id,
      'UPDATE_USER_PERMISSIONS',
      'USER',
      params.id,
      `Changed user ${targetUser.username} settings: role=${role || targetUser.role}, status=${status || targetUser.status}, pilotVerified=${isPilotVerified !== undefined ? isPilotVerified : targetUser.isPilotVerified}, mutedUntil=${mutedUntil}`
    );

    return NextResponse.json({ success: true, user: updated });
  } catch (err: any) {
    console.error('Update user error:', err);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}
