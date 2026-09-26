import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      totalUsers,
      activeUsers,
      todayTrips,
      todaySeatsResult,
      totalMarketplace,
      totalLostFound,
      pendingApplications,
      activePermits,
      pendingReports,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.taxiTrip.count({
        where: {
          tripDate: { gte: todayStart, lte: todayEnd },
        },
      }),
      prisma.taxiTrip.aggregate({
        _sum: { availableSeats: true },
        where: {
          tripDate: { gte: todayStart, lte: todayEnd },
          status: { in: ['OPEN', 'ALMOST_FULL'] },
        },
      }),
      prisma.marketplaceListing.count({ where: { status: 'AVAILABLE' } }),
      prisma.lostFoundItem.count({ where: { status: 'OPEN' } }),
      prisma.partnerApplication.count({
        where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
      }),
      prisma.permit.count({ where: { status: 'VALID' } }),
      prisma.chatReport.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      stats: {
        totalUsers,
        activeUsers,
        todayTrips,
        openSeatsToday: todaySeatsResult._sum.availableSeats || 0,
        totalMarketplace,
        totalLostFound,
        pendingApplications,
        activePermits,
        pendingReports,
      },
    });
  } catch (err: any) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}
