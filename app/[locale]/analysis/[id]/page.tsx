import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import AnalysisResult from '@/app/analysis-result';
import { getChatGPTUser } from '@/app/chatgpt-auth';
import type { PublicAnalysis } from '@/lib/analysis';
import { database, ensureDatabase } from '@/lib/database';
import { isValidVisitorId, VISITOR_COOKIE } from '@/lib/visitor';

type Params = Promise<{ locale: string; id: string }>;
type StoredResult = { id: string; subjectId: string; locale: 'zh' | 'en'; topic: string; question: string; analysis: PublicAnalysis; createdAt: string };

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const result = await getStoredResult(id);
  if (!result) return {};
  const description = result.analysis.lensJudgment.slice(0, 180);
  return {
    title: `${result.analysis.coreProblem.slice(0, 70)} — Ask Naval Lens`,
    description,
    robots: { index: false, follow: false },
    openGraph: { title: result.analysis.coreProblem, description, type: 'article', images: [] },
    twitter: { card: 'summary', title: result.analysis.coreProblem, description, images: [] },
  };
}

export default async function AnalysisPage({ params }: { params: Params }) {
  const { locale, id } = await params;
  if ((locale !== 'zh' && locale !== 'en') || !/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const result = await getStoredResult(id);
  if (!result) notFound();
  if (result.locale !== locale) redirect(`/${result.locale}/analysis/${id}`);

  const topicLabel = topicLabels[result.locale][result.topic] ?? topicLabels[result.locale].other;
  const [user, cookieStore] = await Promise.all([getChatGPTUser(), cookies()]);
  const visitorId = cookieStore.get(VISITOR_COOKIE)?.value;
  const viewerSubject = user ? `user:${user.userId}` : isValidVisitorId(visitorId) ? `anon:${visitorId}` : null;
  return <main className="shared-result-page">
    <nav className="nav-wrap" aria-label="Primary navigation"><a className="brand" href={`/${result.locale}`}><span className="brand-mark">N</span><span>Ask Naval Lens</span></a><a className="secondary-button" href={`/${result.locale}`}>{result.locale === 'zh' ? '分析新问题' : 'New analysis'} →</a></nav>
    <AnalysisResult locale={result.locale} analysis={result.analysis} question={result.question} topicLabel={topicLabel} analysisId={result.id} resultUrl={`/${result.locale}/analysis/${result.id}`} canFeedback={viewerSubject === result.subjectId} />
  </main>;
}

async function getStoredResult(id: string): Promise<StoredResult | null> {
  if (!/^[a-f0-9-]{36}$/i.test(id)) return null;
  await ensureDatabase();
  const row = await database().prepare('SELECT id, subject_id, locale, topic, question, result_json, created_at FROM analyses WHERE id = ?').bind(id).first<{
    id: string; subject_id: string; locale: string; topic: string; question: string; result_json: string; created_at: string;
  }>();
  if (!row || (row.locale !== 'zh' && row.locale !== 'en')) return null;
  try {
    return { id: row.id, subjectId: row.subject_id, locale: row.locale, topic: row.topic, question: row.question, analysis: JSON.parse(row.result_json) as PublicAnalysis, createdAt: row.created_at };
  } catch { return null; }
}

const topicLabels: Record<'zh' | 'en', Record<string, string>> = {
  en: { wealth: 'Wealth', career: 'Career', entrepreneurship: 'Entrepreneurship', decision_making: 'Decisions', happiness: 'Happiness', other: 'Other', unspecified: 'General' },
  zh: { wealth: '财富', career: '职业', entrepreneurship: '创业', decision_making: '决策', happiness: '幸福', other: '其他', unspecified: '综合分析' },
};
