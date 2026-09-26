import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type'); // LOST, FOUND, or ALL
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const query = searchParams.get('q');

    const where: any = {};

    if (type && type !== 'ALL') {
      where.type = type;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (query) {
      where.OR = [
        { title: { contains: query } },
        { description: { contains: query } },
        { location: { contains: query } },
      ];
    }

    const items = await prisma.lostFoundItem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsedItems = items.map((item) => ({
      ...item,
      photos: JSON.parse(item.photos || '[]'),
    }));

    return NextResponse.json({ items: parsedItems });
  } catch (err: any) {
    console.error('Error fetching lost & found:', err);
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to post a lost/found item' }, { status: 401 });
    }

    const body = await req.json();
    const {
      type,
      title,
      category,
      description,
      photos = [],
      itemDate,
      location,
      contactPhone,
    } = body;

    if (!type || !title || !category || !description || !location || !contactPhone) {
      return NextResponse.json(
        { error: 'Please fill in all required fields (title, category, description, location, contact)' },
        { status: 400 }
      );
    }

    const item = await prisma.lostFoundItem.create({
      data: {
        userId: user.id,
        type: type === 'FOUND' ? 'FOUND' : 'LOST',
        title: title.trim(),
        category,
        description: description.trim(),
        photos: JSON.stringify(photos),
        itemDate: itemDate ? new Date(itemDate) : new Date(),
        location: location.trim(),
        contactPhone: contactPhone.trim(),
        status: 'OPEN',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...item,
        photos: JSON.parse(item.photos),
      },
    });
  } catch (err: any) {
    console.error('Error creating lost/found item:', err);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
