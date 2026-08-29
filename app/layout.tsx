import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Ask Naval — A clearer frame for your question',
  description: "An independent analysis tool based on Naval Ravikant's publicly shared ideas.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: { languages: { 'zh-CN': '/zh', 'en-US': '/en' } },
  openGraph: {
    title: 'Ask Naval',
    description: 'A clearer frame for your question.',
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Ask Naval — A clearer frame for your question.' }],
  },
  twitter: { card: 'summary_large_image', title: 'Ask Naval', description: 'A clearer frame for your question.', images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="zh"><body>{children}</body></html>;
}
