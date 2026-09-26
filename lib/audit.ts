import prisma from './prisma';

export async function logAdminAction(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  } catch (err) {
    console.error('Audit log creation failed:', err);
  }
}
