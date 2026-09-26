import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';
import { saveFile } from '@/lib/upload';

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Please sign in to upload files' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const isSecureStr = formData.get('isSecure') as string | null;
    const isSecure = isSecureStr === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await saveFile(buffer, file.name, file.type, isSecure);

    return NextResponse.json({
      success: true,
      url: result.url,
      filename: result.filename,
      size: result.size,
      mimeType: result.mimeType,
      isSecure: result.isSecure,
    });
  } catch (err: any) {
    console.error('File upload error:', err);
    return NextResponse.json({ error: err.message || 'File upload failed' }, { status: 400 });
  }
}
