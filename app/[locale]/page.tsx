import { notFound } from 'next/navigation';
import AskNavalApp from '@/app/ask-naval-app';

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'zh' && locale !== 'en') notFound();
  return <AskNavalApp initialLocale={locale} />;
}
