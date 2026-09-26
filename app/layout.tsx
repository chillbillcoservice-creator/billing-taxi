import type { Metadata, Viewport } from 'next';
import './globals.css';
import ClientShell from '@/components/ClientShell';

export const metadata: Metadata = {
  title: 'Billing Taxi | Bir-Billing Paragliding Community & Rides',
  description:
    'Dedicated shared taxi rides, real-time community chat, equipment marketplace, lost & found, and digital partner permits for the Bir-Billing paragliding takeoff point in Himachal Pradesh.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#082f49',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased min-h-screen flex flex-col items-center">
        <ClientShell>{children}</ClientShell>
      </body>
    </html>
  );
}
