import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get('date'); // 'today', or 'YYYY-MM-DD', or omitted
    const pickupLocation = searchParams.get('pickupLocation');
    const status = searchParams.get('status');
    const minSeats = searchParams.get('minSeats');

    const where: any = {};

    if (dateParam === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      where.tripDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    } else if (dateParam && dateParam !== 'all') {
      const chosen = new Date(dateParam);
      if (!isNaN(chosen.getTime())) {
        const start = new Date(chosen);
        start.setHours(0, 0, 0, 0);
        const end = new Date(chosen);
        end.setHours(23, 59, 59, 999);
        where.tripDate = { gte: start, lte: end };
      }
    }

    if (pickupLocation && pickupLocation !== 'ALL') {
      where.pickupLocation = pickupLocation;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (minSeats) {
      where.availableSeats = { gte: parseInt(minSeats, 10) };
    }

    const trips = await prisma.taxiTrip.findMany({
      where,
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            isPilotVerified: true,
          },
        },
        bookings: {
          where: { status: 'CONFIRMED' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: [
        { tripDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ trips });
  } catch (err: any) {
    console.error('Error fetching taxis:', err);
    return NextResponse.json({ error: 'Failed to fetch taxi listings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to create a taxi trip' }, { status: 401 });
    }

    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      return NextResponse.json({ error: 'Your account is not permitted to host trips' }, { status: 403 });
    }

    const body = await req.json();
    const {
      pickupLocation,
      destination = 'Billing Take-Off Point (2,430m)',
      tripDate,
      pickupTime,
      totalSeats,
      farePerSeat,
      driverName,
      driverPhone,
      vehicleNumber,
      vehicleType,
      notes,
    } = body;

    if (!pickupLocation || !tripDate || !pickupTime || !totalSeats || !farePerSeat || !driverName || !driverPhone) {
      return NextResponse.json(
        { error: 'Please provide all required fields including pickup location, date, time, seats, fare, and driver details.' },
        { status: 400 }
      );
    }

    const parsedSeats = parseInt(totalSeats, 10);
    const parsedFare = parseFloat(farePerSeat);

    if (isNaN(parsedSeats) || parsedSeats <= 0 || parsedSeats > 20) {
      return NextResponse.json({ error: 'Total seats must be between 1 and 20' }, { status: 400 });
    }

    const initialStatus = parsedSeats <= 2 ? 'ALMOST_FULL' : 'OPEN';

    const trip = await prisma.taxiTrip.create({
      data: {
        hostId: user.id,
        pickupLocation,
        destination,
        tripDate: new Date(tripDate),
        pickupTime,
        totalSeats: parsedSeats,
        availableSeats: parsedSeats,
        farePerSeat: parsedFare,
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        vehicleNumber: vehicleNumber?.trim() || null,
        vehicleType: vehicleType?.trim() || null,
        notes: notes?.trim() || null,
        status: initialStatus,
      },
    });

    return NextResponse.json({ success: true, trip });
  } catch (err: any) {
    console.error('Error creating taxi trip:', err);
    return NextResponse.json({ error: 'Failed to create taxi trip' }, { status: 500 });
  }
}
