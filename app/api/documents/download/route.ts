import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSessionUser } from '@/lib/auth';
import { getSecureDocumentPath } from '@/lib/upload';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filename = searchParams.get('file');

    if (!filename) {
      return NextResponse.json({ error: 'Filename is required' }, { status: 400 });
    }

    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Authentication required to view secure documents' }, { status: 401 });
    }

    const isStaff = user.role === 'ADMIN' || user.role === 'MODERATOR';

    // Verify ownership in database unless user is Admin/Moderator
    if (!isStaff) {
      const doc = await prisma.partnerDocument.findFirst({
        where: {
          fileUrl: { contains: filename },
          application: { partnerId: user.id },
        },
      });

      if (!doc) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to access this document' },
          { status: 403 }
        );
      }
    }

    const filePath = getSecureDocumentPath(filename);
    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on secure storage' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(filePath);
    const ext = path.extname(filename).toLowerCase();

    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filename)}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: any) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Failed to access document' }, { status: 500 });
  }
}
