import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import AskNavalApp from '@/app/ask-naval-app';

type Params = Promise<{ locale: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { locale } = await params;
  if (locale !== 'zh' && locale !== 'en') return {};
  const zh = locale === 'zh';
  const title = zh
    ? 'Ask Naval Lens — 用 Naval 的思想框架看清难做的决定'
    : "Ask Naval Lens — Think through hard decisions with Naval's mental models";
  const description = zh
    ? '写下真实处境，匹配 Naval Ravikant 的公开思想框架，获得有出处的判断、适用边界和三个可验证的下一步。'
    : "Match a real decision with relevant ideas from Naval Ravikant's public writings and turn them into concrete next steps.";
  return {
    title,
    description,
    alternates: { canonical: `/${locale}`, languages: { 'zh-CN': '/zh', 'en-US': '/en' } },
    openGraph: { title, description, type: 'website', locale: zh ? 'zh_CN' : 'en_US', images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Ask Naval Lens' }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og.png'] },
  };
}

export default async function LocalizedHome({ params, searchParams }: { params: Params; searchParams: Promise<{ question?: string | string[] }> }) {
  const { locale } = await params;
  if (locale !== 'zh' && locale !== 'en') notFound();
  const query = (await searchParams).question;
  const initialQuestion = typeof query === 'string' && query.length <= 3000 ? query : '';
  return <AskNavalApp initialLocale={locale} initialQuestion={initialQuestion} />;
}
