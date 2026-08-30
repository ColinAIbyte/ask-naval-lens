'use client';

import { useEffect, useState } from 'react';
import type { PublicAnalysis } from '@/lib/analysis';

type Locale = 'zh' | 'en';

const labels = {
  en: {
    question: 'Your question', core: "What you're really deciding", lens: 'The Naval Lens', frameworks: 'Relevant frameworks',
    context: 'Assumptions and missing context',
    publishedIdea: 'Published idea', why: 'Why it applies here', interpretation: 'Applied to your situation', limitation: 'Where it may not apply',
    actions: 'What to do next', timeframe: 'Timeframe', signal: 'Suggested validation signal', deeper: 'Go deeper', sources: 'Original source',
    helpful: 'Helpful', notHelpful: 'Not helpful', useful: 'Was this analysis useful?', share: 'Share this analysis', copied: 'Analysis link copied', another: 'Analyze another decision', disclaimer: 'Generated from Naval Ravikant’s published ideas as an independent thinking aid. This is not Naval Ravikant’s advice. Independent project; not affiliated with or endorsed by him.',
  },
  zh: {
    question: '你提出的问题', core: '先看清：你真正要决定什么', lens: 'Naval 框架下的判断', frameworks: '与这件事最相关的思想框架',
    context: '分析前提与缺失信息',
    publishedIdea: '公开思想原意', why: '为什么与你的处境相关', interpretation: '放进你的处境后', limitation: '这个框架不能替你决定什么',
    actions: '把判断变成行动', timeframe: '何时完成', signal: '建议验证信号', deeper: '沿着这三个问题继续想', sources: '可核验的原始出处',
    helpful: '有帮助', notHelpful: '没说到点上', useful: '这份分析说到点上了吗？', share: '分享这份分析', copied: '分析链接已复制', another: '再分析一个问题', disclaimer: '本回答基于 Naval Ravikant 公开思想框架生成，仅作为独立思考辅助，不代表 Naval Ravikant 本人意见。本工具独立制作，与本人无官方关联。',
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

  useEffect(() => {
    track('analysis_viewed', { locale, analysis_id: analysisId, topic: topicLabel });
  }, [analysisId, locale, topicLabel]);

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
    else window.location.assign(`/${locale}?question=${encodeURIComponent(value)}`);
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
      {analysis.contextNote && <aside className="analysis-context-note"><strong>{t.context}</strong><p>{analysis.contextNote}</p></aside>}
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
          <div className="framework-sources"><strong>{t.sources}</strong>{framework.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer" onClick={() => track('source_clicked', { locale, analysis_id: analysisId, source_url: source.url })}>{source.title}<span aria-hidden="true">↗</span></a>)}</div>
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
