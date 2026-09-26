import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { logAdminAction } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id: params.id },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            email: true,
          },
        },
        documents: true,
        permit: true,
      },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const isApplicant = application.partnerId === user.id;
    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    // Strict access control: Normal users can NEVER view someone else's private documents
    if (!isApplicant && !isStaff) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ application });
  } catch (err: any) {
    console.error('Error fetching application:', err);
    return NextResponse.json({ error: 'Failed to fetch application' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const application = await prisma.partnerApplication.findUnique({
      where: { id: params.id },
    });

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const isApplicant = application.partnerId === user.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isApplicant && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();

    if (isAdmin) {
      // Admin review actions
      const { status, adminNotes, changeRequestReason } = body;

      const updated = await prisma.partnerApplication.update({
        where: { id: params.id },
        data: {
          ...(status ? { status } : {}),
          ...(adminNotes !== undefined ? { adminNotes } : {}),
          ...(changeRequestReason !== undefined ? { changeRequestReason } : {}),
          reviewedAt: new Date(),
        },
        include: { documents: true, permit: true },
      });

      await logAdminAction(
        user.id,
        `UPDATE_APPLICATION_STATUS_${status}`,
        'APPLICATION',
        params.id,
        `Admin changed status to ${status}. Notes: ${adminNotes || 'None'}`
      );

      // Notify the applicant
      if (status) {
        let title = 'Application Status Updated ℹ️';
        let msg = `Your permit application status is now ${status}.`;
        if (status === 'CHANGES_REQUIRED') {
          title = 'Application: Changes Required ⚠️';
          msg = `Reviewer feedback: "${changeRequestReason || 'Please review and update requested documents.'}"`;
        } else if (status === 'APPROVED') {
          title = 'Application Approved! 🎉';
          msg = 'Your permit application has been approved. Digital permit is ready.';
        } else if (status === 'REJECTED') {
          title = 'Application Rejected 🚫';
          msg = `Reason: ${changeRequestReason || 'Application does not meet safety criteria.'}`;
        }

        await prisma.notification.create({
          data: {
            userId: application.partnerId,
            type: 'APPLICATION_UPDATE',
            title,
            message: msg,
            link: `/permissions/applications/${application.id}`,
          },
        });
      }

      return NextResponse.json({ success: true, application: updated });
    } else {
      // Applicant updates draft or responds to changes required
      const { companyName, contactPerson, registrationNumber, address, pilotCount, insurancePolicyNo, status } = body;

      const updated = await prisma.partnerApplication.update({
        where: { id: params.id },
        data: {
          ...(companyName ? { companyName: companyName.trim() } : {}),
          ...(contactPerson ? { contactPerson: contactPerson.trim() } : {}),
          ...(registrationNumber ? { registrationNumber: registrationNumber.trim() } : {}),
          ...(address ? { address: address.trim() } : {}),
          ...(pilotCount ? { pilotCount: parseInt(pilotCount, 10) } : {}),
          ...(insurancePolicyNo ? { insurancePolicyNo: insurancePolicyNo.trim() } : {}),
          ...(status ? { status } : {}),
          ...(status === 'SUBMITTED' ? { submittedAt: new Date() } : {}),
        },
        include: { documents: true, permit: true },
      });

      return NextResponse.json({ success: true, application: updated });
    }
  } catch (err: any) {
    console.error('Error updating application:', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
