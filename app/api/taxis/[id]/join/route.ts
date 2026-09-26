import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to join this taxi' }, { status: 401 });
    }

    if (user.status === 'BANNED' || user.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Your account cannot join taxi trips' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const requestedSeats = parseInt(body.seats || '1', 10);
    const contactPhone = body.phone?.trim() || user.phone;

    if (isNaN(requestedSeats) || requestedSeats <= 0) {
      return NextResponse.json({ error: 'Invalid seat count' }, { status: 400 });
    }

    // Run in Prisma transaction to guarantee atomic seat locking
    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.taxiTrip.findUnique({
        where: { id: params.id },
        include: {
          bookings: {
            where: { status: 'CONFIRMED' },
          },
          host: true,
        },
      });

      if (!trip) {
        throw new Error('TRIP_NOT_FOUND');
      }

      if (trip.status === 'CANCELLED' || trip.status === 'COMPLETED') {
        throw new Error('TRIP_CLOSED');
      }

      // Check if user already has an active booking on this trip
      const existingUserBooking = trip.bookings.find((b) => b.userId === user.id);
      if (existingUserBooking) {
        throw new Error('ALREADY_BOOKED');
      }

      if (trip.availableSeats < requestedSeats) {
        throw new Error('INSUFFICIENT_SEATS');
      }

      // Create booking
      const booking = await tx.taxiBooking.create({
        data: {
          tripId: trip.id,
          userId: user.id,
          passengerCount: requestedSeats,
          contactPhone,
          status: 'CONFIRMED',
        },
      });

      const newAvailable = trip.availableSeats - requestedSeats;
      let newStatus = trip.status;
      if (newAvailable === 0) {
        newStatus = 'FULL';
      } else if (newAvailable <= 2) {
        newStatus = 'ALMOST_FULL';
      } else {
        newStatus = 'OPEN';
      }

      const updatedTrip = await tx.taxiTrip.update({
        where: { id: trip.id },
        data: {
          availableSeats: newAvailable,
          status: newStatus,
        },
      });

      // Create notification for host
      if (trip.hostId !== user.id) {
        await tx.notification.create({
          data: {
            userId: trip.hostId,
            type: newAvailable === 0 ? 'TAXI_FULL' : 'TAXI_JOINED',
            title: newAvailable === 0 ? 'Taxi is now FULL! 🚖' : 'New Passenger Joined 🪂',
            message: `${user.name} booked ${requestedSeats} seat(s) for your ${trip.pickupTime} trip to Billing. ${newAvailable} seats left.`,
            link: `/taxis/${trip.id}`,
          },
        });
      }

      return { booking, trip: updatedTrip };
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully joined taxi trip!',
      data: result,
    });
  } catch (err: any) {
    console.error('Error joining taxi:', err);
    if (err.message === 'TRIP_NOT_FOUND') {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    if (err.message === 'TRIP_CLOSED') {
      return NextResponse.json({ error: 'This trip is no longer active' }, { status: 400 });
    }
    if (err.message === 'ALREADY_BOOKED') {
      return NextResponse.json({ error: 'You have already booked a seat in this taxi' }, { status: 400 });
    }
    if (err.message === 'INSUFFICIENT_SEATS') {
      return NextResponse.json({ error: 'Sorry, this taxi does not have enough remaining seats!' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to join taxi trip' }, { status: 500 });
  }
}
