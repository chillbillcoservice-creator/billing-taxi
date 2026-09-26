import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to report this content' }, { status: 401 });
    }

    const body = await req.json();
    const { reason = 'Inappropriate content / Community guideline violation' } = body;

    const message = await prisma.chatMessage.findUnique({
      where: { id: params.id },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    const report = await prisma.chatReport.create({
      data: {
        messageId: params.id,
        reporterId: user.id,
        reason: reason.trim(),
        status: 'PENDING',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Report submitted to safety marshals and moderators for review.',
      reportId: report.id,
    });
  } catch (err: any) {
    console.error('Error reporting message:', err);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
