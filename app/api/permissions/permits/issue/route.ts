import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { generatePermitNumber, generatePermitQRCode } from '@/lib/permitGenerator';
import { logAdminAction } from '@/lib/audit';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only administrators can issue official permits' }, { status: 403 });
    }

    const body = await req.json();
    const { applicationId, validityMonths = 12, scope = 'COMMERCIAL_TANDEM_OPERATIONS' } = body;

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id: applicationId },
      include: { permit: true, partner: true },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.permit) {
      return NextResponse.json(
        { error: 'A permit has already been issued for this application', permit: application.permit },
        { status: 400 }
      );
    }

    const permitNumber = generatePermitNumber();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/verify-permit/${permitNumber}`;
    const qrCodeData = await generatePermitQRCode(verificationUrl);

    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + parseInt(validityMonths, 10));

    const result = await prisma.$transaction(async (tx) => {
      // Create permit
      const permit = await tx.permit.create({
        data: {
          permitNumber,
          applicationId: application.id,
          partnerId: application.partnerId,
          scope,
          expiryDate,
          qrCodeData,
          status: 'VALID',
          issuedByAdminId: user.id,
        },
      });

      // Update application status to APPROVED
      await tx.partnerApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          reviewedAt: new Date(),
        },
      });

      // Log admin audit
      await tx.auditLog.create({
        data: {
          adminId: user.id,
          action: 'ISSUE_PERMIT',
          targetType: 'PERMIT',
          targetId: permitNumber,
          details: `Admin issued permit ${permitNumber} to ${application.companyName} valid until ${expiryDate.toISOString()}`,
        },
      });

      // Notify partner
      await tx.notification.create({
        data: {
          userId: application.partnerId,
          type: 'PERMIT_APPROVED',
          title: 'Official Digital Permit Issued! 🪪',
          message: `Permit ${permitNumber} has been issued for ${application.companyName}. You can display or download it now.`,
          link: `/permissions/permits/${permit.id}`,
        },
      });

      return permit;
    });

    return NextResponse.json({ success: true, permit: result });
  } catch (err: any) {
    console.error('Error issuing permit:', err);
    return NextResponse.json({ error: 'Failed to issue permit' }, { status: 500 });
  }
}
