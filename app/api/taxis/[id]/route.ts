import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const trip = await prisma.taxiTrip.findUnique({
      where: { id: params.id },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            username: true,
            avatarUrl: true,
            isPilotVerified: true,
            phone: true,
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
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    return NextResponse.json({ trip });
  } catch (err: any) {
    console.error('Error fetching trip details:', err);
    return NextResponse.json({ error: 'Failed to fetch trip details' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trip = await prisma.taxiTrip.findUnique({
      where: { id: params.id },
      include: { bookings: true },
    });

    if (!trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    const isHost = trip.hostId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'MODERATOR';

    if (!isHost && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden: You do not have permission to modify this trip' }, { status: 403 });
    }

    const body = await req.json();
    const { status, pickupTime, notes, driverPhone, farePerSeat } = body;

    const updated = await prisma.taxiTrip.update({
      where: { id: params.id },
      data: {
        ...(status ? { status } : {}),
        ...(pickupTime ? { pickupTime } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(driverPhone ? { driverPhone } : {}),
        ...(farePerSeat ? { farePerSeat: parseFloat(farePerSeat) } : {}),
      },
    });

    // If trip was cancelled, notify all confirmed passengers
    if (status === 'CANCELLED' && trip.status !== 'CANCELLED') {
      const activeBookings = trip.bookings.filter((b) => b.status === 'CONFIRMED');
      for (const booking of activeBookings) {
        await prisma.notification.create({
          data: {
            userId: booking.userId,
            type: 'TAXI_CANCELLED',
            title: 'Taxi Trip Cancelled ⚠️',
            message: `The taxi trip scheduled for ${trip.pickupTime} from ${trip.pickupLocation} was cancelled by the host.`,
            link: '/taxis',
          },
        });
      }
    }

    return NextResponse.json({ success: true, trip: updated });
  } catch (err: any) {
    console.error('Error updating trip:', err);
    return NextResponse.json({ error: 'Failed to update trip' }, { status: 500 });
  }
}
