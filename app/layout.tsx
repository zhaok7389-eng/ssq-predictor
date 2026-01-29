import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '\u8F6F\u808B\u306E\u53D1\u8D22\u7814\u7A76\u6240',
  description: '\u9ED1\u5A03\u7684\u9ED1\u79D1\u6280\uFF0C\u4E13\u6CBB\u5C0F\u8D22\u8FF7',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '\u53D1\u8D22\u7814\u7A76\u6240',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FFB6C1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="antialiased">
        <main className="min-h-screen max-w-lg mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
