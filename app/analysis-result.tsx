'use client';

import { useState } from 'react';
import type { PublicAnalysis } from '@/lib/analysis';

type Locale = 'zh' | 'en';

const labels = {
  en: {
    question: 'Your question', core: "What you're really deciding", lens: 'The Naval Lens', frameworks: 'Relevant frameworks',
    publishedIdea: 'Published idea', why: 'Why it applies here', interpretation: 'Applied to your situation', limitation: 'Where it may not apply',
    actions: 'What to do next', timeframe: 'Timeframe', signal: 'Success signal', deeper: 'Go deeper', sources: 'Original source',
    helpful: 'Helpful', notHelpful: 'Not helpful', useful: 'Was this analysis useful?', share: 'Share this analysis', copied: 'Analysis link copied', another: 'Analyze another decision', disclaimer: 'Independent project. Not affiliated with or endorsed by Naval Ravikant.',
  },
  zh: {
    question: '你的问题', core: '你真正要决定的是什么', lens: 'Naval 思想视角', frameworks: '相关思想框架',
    publishedIdea: '公开思想', why: '为什么适用于这里', interpretation: '对你处境的分析', limitation: '可能不适用之处',
    actions: '接下来做什么', timeframe: '时间范围', signal: '成功信号', deeper: '继续深入', sources: '原始出处',
    helpful: '有帮助', notHelpful: '没帮助', useful: '这份分析有帮助吗？', share: '分享这份分析', copied: '分析链接已复制', another: '分析另一个决定', disclaimer: '独立项目，与 Naval Ravikant 本人无官方关联，也未获得本人背书。',
  },
} as const;

export default function AnalysisResult({
  locale,
  analysis,
  question,
  topicLabel,
  analysisId,
  resultUrl,
  onAskAnother,
  onFollowUp,
}: {
  locale: Locale;
  analysis: PublicAnalysis;
  question: string;
  topicLabel: string;
  analysisId: string;
  resultUrl: string;
  onAskAnother?: () => void;
  onFollowUp?: (question: string) => void;
}) {
  const t = labels[locale];
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [shareCopied, setShareCopied] = useState(false);

  async function submitFeedback(value: 'helpful' | 'not_helpful') {
    setFeedback(value);
    track('feedback_submitted', { rating: value, topic: topicLabel, locale, analysis_id: analysisId });
    void fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ analysisId, rating: value }) });
  }

  async function shareAnalysis() {
    const url = new URL(resultUrl, window.location.origin).toString();
    track('analysis_shared', { locale, analysis_id: analysisId });
    try {
      if (navigator.share) await navigator.share({ title: 'Ask Naval Lens', text: analysis.coreProblem, url });
      else {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2200);
      }
    } catch { /* Native share can be cancelled. */ }
  }

  function chooseFollowUp(value: string) {
    track('followup_selected', { locale, analysis_id: analysisId });
    if (onFollowUp) onFollowUp(value);
    else window.location.href = `/${locale}?question=${encodeURIComponent(value)}`;
  }

  return (
    <section className="analysis-section analysis-v1">
      <header className="analysis-header">
        <div>
          <p className="eyebrow"><span />{t.question} · {topicLabel}</p>
          <p className="question-recap">{question}</p>
          <p className="section-kicker">01 · {t.core}</p>
          <h2>{analysis.coreProblem}</h2>
        </div>
        <span className="analysis-badge">NAVAL LENS</span>
      </header>

      {analysis.safety.reason && <p className="safety-notice">{analysis.safety.reason}</p>}
      <div className="lens-judgment"><p className="section-kicker">02 · {t.lens}</p><p>{analysis.lensJudgment}</p></div>

      {analysis.frameworks.length > 0 && <div className="frameworks-v1">
        <p className="section-kicker">03 · {t.frameworks}</p>
        {analysis.frameworks.map((framework, index) => <article key={`${framework.name}-${index}`}>
          <span className="framework-index">0{index + 1}</span>
          <h3>{framework.name}</h3>
          <div className="framework-detail-grid">
            <div><strong>{t.publishedIdea}</strong><p>{framework.summary}</p></div>
            <div><strong>{t.why}</strong><p>{framework.whyRelevant}</p></div>
            <div><strong>{t.interpretation}</strong><p>{framework.analysis}</p></div>
            <div className="framework-limit"><strong>{t.limitation}</strong><p>{framework.limitations}</p></div>
          </div>
          <div className="framework-sources"><strong>{t.sources}</strong>{framework.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<span aria-hidden="true">↗</span></a>)}</div>
        </article>)}
      </div>}

      <div className="actions-v1">
        <p className="section-kicker">04 · {t.actions}</p>
        <div>{analysis.actions.map((action, index) => <article key={`${action.action}-${index}`}>
          <span>{index + 1}</span><h3>{action.action}</h3><p>{action.why}</p>
          <dl><div><dt>{t.timeframe}</dt><dd>{action.timeframe}</dd></div><div><dt>{t.signal}</dt><dd>{action.successSignal}</dd></div></dl>
        </article>)}</div>
      </div>

      {analysis.followUpQuestions.length > 0 && <div className="followups-v1">
        <p className="section-kicker">05 · {t.deeper}</p>
        <div>{analysis.followUpQuestions.map((item) => <button key={item} type="button" onClick={() => chooseFollowUp(item)}><span>{item}</span><b aria-hidden="true">→</b></button>)}</div>
      </div>}

      <div className="feedback-row">
        <div><span>{t.useful}</span><button className={feedback === 'helpful' ? 'active' : ''} onClick={() => submitFeedback('helpful')} type="button">↑ {t.helpful}</button><button className={feedback === 'not_helpful' ? 'active' : ''} onClick={() => submitFeedback('not_helpful')} type="button">↓ {t.notHelpful}</button></div>
        <div className="feedback-secondary"><button className="share-result" type="button" onClick={shareAnalysis}>{shareCopied ? `✓ ${t.copied}` : `↗ ${t.share}`}</button>{onAskAnother ? <button className="secondary-button" type="button" onClick={onAskAnother}>{t.another} →</button> : <a className="secondary-button" href={`/${locale}`}>{t.another} →</a>}</div>
      </div>
      <p className="result-disclaimer">{t.disclaimer}</p>
    </section>
  );
}

function track(event: string, properties: Record<string, string | number | boolean>) {
  void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, properties }) }).catch(() => undefined);
}
