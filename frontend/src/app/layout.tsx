import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata: Metadata = {
  title: 'MRA Meeting Room Booking — Multi-Entity Corporate Portal',
  description: 'Enterprise meeting room reservation portal for MRA Group (PT Mugi Rekso Abadi, PT Mogems Putri International, MRA Media) with collision detection and calendar (.ics) sync.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
