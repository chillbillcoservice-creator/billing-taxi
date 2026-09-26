import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: Request, { params }: { params: { permitNumber: string } }) {
  try {
    const permit = await prisma.permit.findUnique({
      where: { permitNumber: params.permitNumber },
      include: {
        partner: {
          select: {
            name: true,
            username: true,
            phone: true,
          },
        },
        application: {
          select: {
            companyName: true,
            contactPerson: true,
            businessType: true,
            registrationNumber: true,
            pilotCount: true,
            insurancePolicyNo: true,
          },
        },
        issuedBy: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!permit) {
      return NextResponse.json({ error: 'Permit not found or invalid' }, { status: 404 });
    }

    const now = new Date();
    const isExpired = new Date(permit.expiryDate) < now;
    const computedStatus = isExpired ? 'EXPIRED' : permit.status;

    return NextResponse.json({
      permit: {
        ...permit,
        status: computedStatus,
        isExpired,
      },
    });
  } catch (err: any) {
    console.error('Permit verification error:', err);
    return NextResponse.json({ error: 'Failed to verify permit' }, { status: 500 });
  }
}
