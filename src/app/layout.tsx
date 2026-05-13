import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ResellSync',
  description: 'All-in-one reseller platform demo for cross-posting, inventory sync, checkout, and analytics.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
