import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Roblox Creator Hub — Campaign Analytics',
  description: 'Track creator campaign performance across TikTok, YouTube, and Instagram',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
