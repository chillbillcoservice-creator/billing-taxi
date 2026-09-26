import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const isAdminOrMod = user.role === 'ADMIN' || user.role === 'MODERATOR';

    const where: any = {};

    // Normal members and partners only see their own applications
    if (!isAdminOrMod) {
      where.partnerId = user.id;
    }

    if (status && status !== 'ALL') {
      where.status = status;
    }

    const applications = await prisma.partnerApplication.findMany({
      where,
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            username: true,
            email: true,
            phone: true,
          },
        },
        documents: true,
        permit: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ applications });
  } catch (err: any) {
    console.error('Error fetching partner applications:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyName,
      contactPerson,
      businessType,
      registrationNumber,
      address,
      pilotCount = 1,
      insurancePolicyNo,
      status = 'SUBMITTED', // or 'DRAFT'
      documents = [], // array of { docType, title, fileUrl, fileSize, mimeType }
    } = body;

    if (!companyName || !contactPerson || !businessType || !registrationNumber || !address || !insurancePolicyNo) {
      return NextResponse.json(
        { error: 'Please fill in all required company and registration fields.' },
        { status: 400 }
      );
    }

    const application = await prisma.partnerApplication.create({
      data: {
        partnerId: user.id,
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        businessType,
        registrationNumber: registrationNumber.trim(),
        address: address.trim(),
        pilotCount: parseInt(pilotCount, 10) || 1,
        insurancePolicyNo: insurancePolicyNo.trim(),
        status: status === 'DRAFT' ? 'DRAFT' : 'SUBMITTED',
        submittedAt: status === 'SUBMITTED' ? new Date() : null,
        documents: {
          create: documents.map((doc: any) => ({
            docType: doc.docType || 'OTHER',
            title: doc.title || 'Attached Document',
            fileUrl: doc.fileUrl,
            fileSize: doc.fileSize || 0,
            mimeType: doc.mimeType || 'application/pdf',
          })),
        },
      },
      include: {
        documents: true,
      },
    });

    // Notify admins if application was submitted
    if (status === 'SUBMITTED') {
      const admins = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true },
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            userId: admin.id,
            type: 'APPLICATION_UPDATE',
            title: 'New Partner Permit Application 📋',
            message: `${companyName} (${businessType}) has submitted a permit application for review.`,
            link: `/admin/applications/${application.id}`,
          },
        });
      }
    }

    return NextResponse.json({ success: true, application });
  } catch (err: any) {
    console.error('Error creating partner application:', err);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}
