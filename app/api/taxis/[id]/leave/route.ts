import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const trip = await tx.taxiTrip.findUnique({
        where: { id: params.id },
        include: {
          bookings: {
            where: { userId: user.id, status: 'CONFIRMED' },
          },
        },
      });

      if (!trip) {
        throw new Error('TRIP_NOT_FOUND');
      }

      const booking = trip.bookings[0];
      if (!booking) {
        throw new Error('NO_ACTIVE_BOOKING');
      }

      // Mark booking cancelled
      await tx.taxiBooking.update({
        where: { id: booking.id },
        data: { status: 'CANCELLED' },
      });

      const newAvailable = Math.min(trip.totalSeats, trip.availableSeats + booking.passengerCount);
      let newStatus = trip.status;
      if (trip.status === 'FULL' || trip.status === 'ALMOST_FULL' || trip.status === 'OPEN') {
        newStatus = newAvailable <= 2 ? 'ALMOST_FULL' : 'OPEN';
      }

      const updatedTrip = await tx.taxiTrip.update({
        where: { id: trip.id },
        data: {
          availableSeats: newAvailable,
          status: newStatus,
        },
      });

      // Notify host
      if (trip.hostId !== user.id) {
        await tx.notification.create({
          data: {
            userId: trip.hostId,
            type: 'TAXI_JOINED',
            title: 'Passenger Cancelled Booking ℹ️',
            message: `${user.name} cancelled their booking (${booking.passengerCount} seat(s)). ${newAvailable} seats now open on your ${trip.pickupTime} trip.`,
            link: `/taxis/${trip.id}`,
          },
        });
      }

      return { updatedTrip };
    });

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully. Your seat has been released.',
      trip: result.updatedTrip,
    });
  } catch (err: any) {
    console.error('Error leaving taxi:', err);
    if (err.message === 'TRIP_NOT_FOUND') {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    if (err.message === 'NO_ACTIVE_BOOKING') {
      return NextResponse.json({ error: 'You do not have an active booking on this trip' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to cancel taxi booking' }, { status: 500 });
  }
}
