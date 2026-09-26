import QRCode from 'qrcode';

export interface DigitalPermitPayload {
  permitNumber: string;
  partnerName: string;
  companyName: string;
  businessType: string;
  scope: string;
  issuedDate: string;
  expiryDate: string;
  verificationUrl: string;
}

export function generatePermitNumber(): string {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `HP-BIR-${year}-${randomSuffix}`;
}

export async function generatePermitQRCode(verificationUrl: string): Promise<string> {
  try {
    return await QRCode.toDataURL(verificationUrl, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 280,
      color: {
        dark: '#082f49', // parablue-900
        light: '#ffffff',
      },
    });
  } catch (err) {
    console.error('Failed to generate QR code', err);
    return '';
  }
}
