import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isSeller = listing.sellerId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isSeller && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, price, title, description } = body;

    const updated = await prisma.marketplaceListing.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(price ? { price: parseFloat(price) } : {}),
        ...(title ? { title: title.trim() } : {}),
        ...(description ? { description: description.trim() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      listing: {
        ...updated,
        photos: JSON.parse(updated.photos || '[]'),
      },
    });
  } catch (err: any) {
    console.error('Update listing error:', err);
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: params.id },
    });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    const isSeller = listing.sellerId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isSeller && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.marketplaceListing.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: 'Listing deleted' });
  } catch (err: any) {
    console.error('Delete listing error:', err);
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
  }
}
