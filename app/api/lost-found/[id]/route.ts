import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.lostFoundItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const isOwner = item.userId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, title, description, location } = body;

    const updated = await prisma.lostFoundItem.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
        ...(location ? { location: location.trim() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...updated,
        photos: JSON.parse(updated.photos || '[]'),
      },
    });
  } catch (err: any) {
    console.error('Update item error:', err);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const item = await prisma.lostFoundItem.findUnique({
      where: { id: params.id },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const isOwner = item.userId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.lostFoundItem.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Item deleted' });
  } catch (err: any) {
    console.error('Delete item error:', err);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
