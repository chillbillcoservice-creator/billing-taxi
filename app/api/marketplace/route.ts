import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    const status = searchParams.get('status');
    const query = searchParams.get('q');
    const maxPrice = searchParams.get('maxPrice');
    const minPrice = searchParams.get('minPrice');

    const where: any = {};

    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (condition && condition !== 'ALL') {
      where.condition = condition;
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
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const listings = await prisma.marketplaceListing.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            isPilotVerified: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const parsed = listings.map((l) => ({
      ...l,
      photos: JSON.parse(l.photos || '[]'),
    }));

    return NextResponse.json({ listings: parsed });
  } catch (err: any) {
    console.error('Error fetching marketplace listings:', err);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to list equipment' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      category,
      condition,
      price,
      location,
      description,
      photos = [],
      contactPhone,
    } = body;

    if (!title || !category || !condition || !price || !location || !description || !contactPhone) {
      return NextResponse.json(
        { error: 'Please fill in all required equipment details (title, category, condition, price, location, description, contact phone).' },
        { status: 400 }
      );
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: 'Please enter a valid price' }, { status: 400 });
    }

    const listing = await prisma.marketplaceListing.create({
      data: {
        sellerId: user.id,
        title: title.trim(),
        category,
        condition,
        price: parsedPrice,
        location: location.trim(),
        description: description.trim(),
        photos: JSON.stringify(photos),
        status: 'AVAILABLE',
        contactPhone: contactPhone.trim(),
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            isPilotVerified: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      listing: {
        ...listing,
        photos: JSON.parse(listing.photos),
      },
    });
  } catch (err: any) {
    console.error('Error creating marketplace listing:', err);
    return NextResponse.json({ error: 'Failed to create listing' }, { status: 500 });
  }
}
