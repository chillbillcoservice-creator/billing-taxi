import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function PATCH(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, bio, pilotGlider, pilotLicenseNumber, phone, email } = body;

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name ? { name: name.trim() } : {}),
        ...(bio !== undefined ? { bio: bio.trim() } : {}),
        ...(pilotGlider !== undefined ? { pilotGlider: pilotGlider.trim() } : {}),
        ...(pilotLicenseNumber !== undefined ? { pilotLicenseNumber: pilotLicenseNumber.trim() } : {}),
        ...(phone ? { phone: phone.trim() } : {}),
        ...(email ? { email: email.trim().toLowerCase() } : {}),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        username: updated.username,
        phone: updated.phone,
        email: updated.email,
        bio: updated.bio,
        pilotGlider: updated.pilotGlider,
        pilotLicenseNumber: updated.pilotLicenseNumber,
        isPilotVerified: updated.isPilotVerified,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (err: any) {
    console.error('Profile update error:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
