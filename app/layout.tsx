import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Ask Naval Lens — Think through hard decisions with Naval's mental models",
  description: "Match a real decision with relevant ideas from Naval Ravikant's public writings, understand where they apply, and turn them into concrete next steps.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://ask-naval-lens.fancifulman.chatgpt.site'),
  alternates: { languages: { 'zh-CN': '/zh', 'en-US': '/en' } },
  openGraph: {
    title: 'Ask Naval Lens',
    description: "Think through hard decisions with Naval's mental models.",
    type: 'website',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: "Ask Naval Lens — Think through hard decisions with Naval's mental models." }],
  },
  twitter: { card: 'summary_large_image', title: 'Ask Naval Lens', description: "Think through hard decisions with Naval's mental models.", images: ['/og.png'] },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
