import fs from 'fs';
import path from 'path';

// Public uploads for marketplace, lost & found, chat, avatars
const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');
// Secure uploads for partner permit documents - strictly NOT served statically by Next.js
const SECURE_DOCS_DIR = path.join(process.cwd(), 'storage', 'secure_documents');

// Ensure directories exist
if (!fs.existsSync(PUBLIC_UPLOAD_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOAD_DIR, { recursive: true });
}
if (!fs.existsSync(SECURE_DOCS_DIR)) {
  fs.mkdirSync(SECURE_DOCS_DIR, { recursive: true });
}

export interface SaveFileResult {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  isSecure: boolean;
}

export async function saveFile(
  buffer: Buffer,
  originalFilename: string,
  mimeType: string,
  isSecureDocument: boolean = false
): Promise<SaveFileResult> {
  const allowedImageMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const allowedDocMimes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (isSecureDocument) {
    if (!allowedDocMimes.includes(mimeType)) {
      throw new Error('Invalid document format. Only PDF, JPG, PNG, and DOC files are accepted.');
    }
    if (buffer.length > 15 * 1024 * 1024) {
      throw new Error('Document size exceeds maximum 15MB limit.');
    }
  } else {
    // Media / images
    const isVideo = mimeType.startsWith('video/');
    if (!allowedImageMimes.includes(mimeType) && !isVideo) {
      throw new Error('Invalid file format. Please upload JPG, PNG, WebP, or MP4.');
    }
    if (buffer.length > 10 * 1024 * 1024) {
      throw new Error('File size exceeds maximum 10MB limit.');
    }
  }

  const extension = path.extname(originalFilename) || (mimeType.includes('pdf') ? '.pdf' : '.jpg');
  const safeBase = originalFilename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 20);
  const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}_${safeBase}${extension}`;

  const targetDir = isSecureDocument ? SECURE_DOCS_DIR : PUBLIC_UPLOAD_DIR;
  const filePath = path.join(targetDir, uniqueName);

  await fs.promises.writeFile(filePath, buffer);

  return {
    url: isSecureDocument ? `/api/documents/download?file=${uniqueName}` : `/uploads/${uniqueName}`,
    filename: uniqueName,
    size: buffer.length,
    mimeType,
    isSecure: isSecureDocument,
  };
}

export function getSecureDocumentPath(filename: string): string | null {
  // Prevent directory traversal attacks
  const safeFilename = path.basename(filename);
  const fullPath = path.join(SECURE_DOCS_DIR, safeFilename);
  if (!fs.existsSync(fullPath)) return null;
  return fullPath;
}
