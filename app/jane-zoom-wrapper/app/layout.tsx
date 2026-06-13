import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'PsyNova Jane + Zoom Wrapper',
  description: 'Operational wrapper — Jane calendar + Zoom sessions',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
