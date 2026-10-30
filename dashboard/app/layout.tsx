import type { Metadata } from 'next';
import './globals.css';
import { themeInitScript } from '@/lib/theme';
export const metadata: Metadata = { title: 'AI Invoice Processing', description: 'Automatically extract invoice details, prevent duplicate entries, and keep your billing records organised.' };
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="en" data-theme="light" suppressHydrationWarning>
    <head><script dangerouslySetInnerHTML={{__html: themeInitScript}}/></head>
    <body>{children}</body>
  </html>;
}
