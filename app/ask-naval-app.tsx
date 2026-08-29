'use client';

import { useEffect, useRef, useState } from 'react';

type Locale = 'zh' | 'en';
type Topic = 'wealth' | 'entrepreneurship' | 'life' | 'happiness' | 'decision_making';
type Source = { id: string; title: string; url: string; sourceType: string };
type Analysis = {
  title: string;
  perspectiveAnalysis: string;
  frameworks: Array<{ name: string; summary: string; sourceIds: string[] }>;
  whyItApplies: string;
  actions: Array<{ title: string; detail: string }>;
  sources: Source[];
  safety: { status: 'allow' | 'caution' | 'refuse'; reason: string | null };
};

const topicKeys: Topic[] = ['wealth', 'entrepreneurship', 'life', 'happiness', 'decision_making'];

const copy = {
  zh: {
    navHow: '如何工作', navPricing: '价格', signIn: '登录', eyebrow: '清晰，源于更好的思考框架',
    titleA: '换一个视角，', titleB: '看清你的问题。', subtitle: '借助 Naval Ravikant 公开分享的思想框架，获得有出处、可行动的独立分析。',
    label: '你现在想理清什么？', placeholder: '例如：我应该辞职，全职做自己的产品吗？', topics: ['财富', '创业', '人生', '幸福', '决策'],
    cta: '分析我的问题', analyzing: '正在梳理思想框架…', free: '今天可免费分析 1 次', credits: (n: number) => `剩余 ${n} 次付费分析`,
    privacy: '请勿输入敏感个人信息', examples: '试试这些问题', exampleItems: ['我应该继续做这个产品吗？', '怎样判断一项工作是否值得长期投入？', '财富和自由之间是什么关系？'],
    lens: '本次分析会包含', lensItems: ['Naval 视角分析', '对应思想框架', '为什么适用于你', '3 个行动建议', '相关公开出处'],
    quote: '不是替你做决定，而是帮你把决定看得更清楚。', disclaimer: '独立分析工具，与 Naval Ravikant 本人无官方关联。',
    shortQuestion: '请至少输入 10 个字符，让问题更具体一些。', genericError: '暂时无法完成分析，请稍后重试。',
    demoNotice: '演示模式：当前回答由审核过的公开来源与固定框架生成；配置 AI 密钥后将启用个性化模型分析。',
    perspective: '01 · 视角分析', frameworks: '02 · 对应思想框架', applies: '03 · 为什么适用于你', actions: '04 · 三个行动建议', sources: '05 · 相关公开出处',
    sourceType: '公开来源', helpful: '有帮助', notHelpful: '没帮助', another: '再问一个问题',
    pricingEyebrow: '简单、透明的早期价格', pricingTitle: '先免费体验，再决定是否继续。', pricingBody: '每天一次完整免费分析。需要更多时，再购买按次额度，不自动续费。',
    plan: 'Starter Pack', price: '$9', priceNote: '一次性付款 · 30 次分析 · 12 个月有效', buy: '购买 30 次',
    paywallTitle: '今天的免费分析已用完', paywallBody: '购买 30 次分析，继续从经过审核的公开思想框架中获得清晰、可行动的第二视角。',
    close: '暂时不用', paymentUnavailable: '支付服务尚未配置。页面与流程已经就绪，配置支付密钥后即可开放购买。',
    howEyebrow: '不是泛泛聊天', howTitle: '从真实问题，到可验证的下一步。',
    howSteps: [['提出问题', '写下你正在面对的真实选择或困惑。'], ['匹配框架', '系统只从审核过的 Naval 公开内容中寻找相关思想。'], ['开始行动', '获得适用原因、三个行动建议和可核验出处。']],
    footerPrivacy: '隐私', footerTerms: '条款', footerDisclaimer: '免责声明', useful: '这份分析有帮助吗？', matching: '正在匹配最相关的公开思想与出处。',
  },
  en: {
    navHow: 'How it works', navPricing: 'Pricing', signIn: 'Sign in', eyebrow: 'Clarity starts with a better frame',
    titleA: 'See your question', titleB: 'from a sharper angle.', subtitle: "Use Naval Ravikant's publicly shared ideas for a sourced, actionable, independent analysis.",
    label: 'What are you trying to make sense of?', placeholder: 'For example: Should I quit my job to build my product full time?', topics: ['Wealth', 'Startups', 'Life', 'Happiness', 'Decisions'],
    cta: 'Analyze my question', analyzing: 'Finding the right mental models…', free: '1 free analysis available today', credits: (n: number) => `${n} paid analyses remaining`,
    privacy: 'Do not enter sensitive personal information', examples: 'Try a question', exampleItems: ['Should I keep building this product?', 'How do I know if a job is worth years of my life?', 'What is the relationship between wealth and freedom?'],
    lens: "What's inside your analysis", lensItems: ['Naval-inspired perspective', 'Relevant mental models', 'Why they fit your situation', '3 concrete next steps', 'Public sources'],
    quote: "It won't make the choice for you. It will help you see the choice clearly.", disclaimer: 'An independent tool with no official affiliation to Naval Ravikant.',
    shortQuestion: 'Please enter at least 10 characters so the question has enough context.', genericError: 'We could not complete the analysis. Please try again shortly.',
    demoNotice: 'Demo mode: this answer uses reviewed public sources and fixed frameworks. Add an AI key to enable personalized model analysis.',
    perspective: '01 · Perspective', frameworks: '02 · Mental models', applies: '03 · Why this applies', actions: '04 · Three next steps', sources: '05 · Public sources',
    sourceType: 'Public source', helpful: 'Helpful', notHelpful: 'Not helpful', another: 'Ask another question',
    pricingEyebrow: 'Simple early pricing', pricingTitle: 'Try it free. Pay only when it helps.', pricingBody: 'Get one complete analysis each day. If you need more, buy a one-time credit pack—no subscription.',
    plan: 'Starter Pack', price: '$9', priceNote: 'One payment · 30 analyses · valid for 12 months', buy: 'Buy 30 analyses',
    paywallTitle: "You've used today's free analysis", paywallBody: 'Get 30 more analyses and keep turning reviewed public ideas into clear, actionable second opinions.',
    close: 'Not now', paymentUnavailable: 'Payments are not configured yet. The flow is ready and will activate as soon as payment credentials are added.',
    howEyebrow: 'Not another generic chatbot', howTitle: 'From a real question to a testable next step.',
    howSteps: [['Ask honestly', 'Describe the choice or tension you are actually facing.'], ['Match the frame', 'We search only reviewed public material for ideas that fit.'], ['Act clearly', 'Get the rationale, three concrete next steps, and verifiable sources.']],
    footerPrivacy: 'Privacy', footerTerms: 'Terms', footerDisclaimer: 'Disclaimer', useful: 'Was this analysis useful?', matching: 'Matching your question to the most relevant public ideas and sources.',
  },
} as const;

function track(event: string, properties: Record<string, string | number | boolean> = {}) {
  void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, properties }) }).catch(() => undefined);
}

export default function AskNavalApp({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [topic, setTopic] = useState<Topic>('entrepreneurship');
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'demo' | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paidCredits, setPaidCredits] = useState(0);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const answerRef = useRef<HTMLElement>(null);
  const t = copy[locale];

  useEffect(() => {
    track('landing_viewed', { locale });
    void fetch('/api/entitlements')
      .then(async (res) => res.ok ? await res.json() as { paidCredits?: number } : null)
      .then((data) => data && setPaidCredits(data.paidCredits ?? 0))
      .catch(() => undefined);
  }, []);

  function changeLocale(next: Locale) {
    if (next === locale) return;
    track('language_changed', { from_locale: locale, to_locale: next });
    setLocale(next);
    window.history.replaceState({}, '', `/${next}`);
    document.documentElement.lang = next;
  }

  async function analyze() {
    setError(''); setPaymentMessage('');
    if (question.trim().length < 10) { setError(t.shortQuestion); return; }
    setStatus('loading'); setAnalysis(null); setFeedback(null);
    track('analysis_submitted', { topic, locale });
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: question.trim(), topic, locale }) });
      const data = await response.json() as { error?: string; analysis?: Analysis; analysisId?: string; mode?: 'live' | 'demo'; paidCredits?: number };
      if (response.status === 402) { setShowPaywall(true); track('paywall_viewed', { trigger: 'quota_exhausted', locale }); return; }
      if (!response.ok) throw new Error(data.error || t.genericError);
      if (!data.analysis || !data.analysisId || !data.mode) throw new Error(t.genericError);
      setAnalysis(data.analysis); setAnalysisId(data.analysisId); setMode(data.mode); setPaidCredits(data.paidCredits ?? paidCredits);
      track('analysis_completed', { topic, locale, mode: data.mode });
      window.setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message); setStatus('error'); track('analysis_failed', { topic, locale });
    } finally { setStatus((current) => current === 'error' ? 'error' : 'idle'); }
  }

  async function submitFeedback(value: 'helpful' | 'not_helpful') {
    setFeedback(value); track('feedback_submitted', { rating: value, topic, locale });
    if (analysisId) void fetch('/api/feedback', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ analysisId, rating: value }) });
  }

  async function startCheckout() {
    setPaymentMessage(''); track('checkout_started', { plan_id: 'starter_30', locale });
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ locale }) });
      const data = await response.json() as { signInUrl?: string; checkoutUrl?: string; error?: string };
      if (response.status === 401 && data.signInUrl) { window.location.href = data.signInUrl; return; }
      if (!response.ok || !data.checkoutUrl) { setPaymentMessage(t.paymentUnavailable); return; }
      window.location.href = data.checkoutUrl;
    } catch { setPaymentMessage(t.paymentUnavailable); }
  }

  function resetQuestion() { setAnalysis(null); setQuestion(''); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return (
    <main className="site-shell">
      <nav className="nav-wrap" aria-label="Primary navigation">
        <a className="brand" href={`/${locale}`} aria-label="Ask Naval home"><span className="brand-mark">N</span><span>Ask Naval</span></a>
        <div className="nav-links"><a href="#how">{t.navHow}</a><a href="#pricing">{t.navPricing}</a><a href={`/signin-with-chatgpt?return_to=/${locale}`}>{t.signIn}</a>
          <div className="language-switch" aria-label="Language switcher"><button className={locale === 'zh' ? 'active' : ''} onClick={() => changeLocale('zh')} type="button">中</button><span>/</span><button className={locale === 'en' ? 'active' : ''} onClick={() => changeLocale('en')} type="button">EN</button></div>
        </div>
      </nav>

      <section id="top" className="hero-grid">
        <div className="hero-copy"><p className="eyebrow"><span />{t.eyebrow}</p><h1>{t.titleA}<br /><em>{t.titleB}</em></h1><p className="subtitle">{t.subtitle}</p>
          <div className="ask-card"><label htmlFor="question">{t.label}</label><textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.placeholder} maxLength={1000} disabled={status === 'loading'} />
            <div className="topic-row" aria-label="Question topic">{topicKeys.map((key, index) => <button className={topic === key ? 'selected' : ''} key={key} onClick={() => setTopic(key)} type="button">{t.topics[index]}</button>)}</div>
            <div className="ask-actions"><div className="quota"><span className="quota-dot" /><span>{paidCredits > 0 ? t.credits(paidCredits) : t.free}</span></div><button className="primary-button" type="button" onClick={analyze} disabled={status === 'loading'}>{status === 'loading' ? t.analyzing : t.cta}<span aria-hidden="true">↗</span></button></div>
          </div>{error && <p className="form-error" role="alert">{error}</p>}<p className="privacy-note">⌁ {t.privacy}</p>
        </div>
        <aside className="framework-card"><div className="orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-core">N</span></div><p className="framework-label">{t.lens}</p><ol>{t.lensItems.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol><blockquote>{t.quote}</blockquote></aside>
      </section>

      <section className="examples-section" aria-labelledby="examples-title"><p id="examples-title">{t.examples}</p><div className="examples-list">{t.exampleItems.map((item, index) => <button key={item} onClick={() => { setQuestion(item); setTopic(topicKeys[[1, 4, 0][index]]); track('example_selected', { example_id: index, locale }); }} type="button"><span>{item}</span><span aria-hidden="true">→</span></button>)}</div></section>

      {status === 'loading' && <section className="loading-analysis" aria-live="polite"><span className="loading-mark">N</span><div><strong>{t.analyzing}</strong><p>{t.matching}</p></div></section>}

      {analysis && <section className="analysis-section" ref={answerRef}>
        <header className="analysis-header"><div><p className="eyebrow"><span />{t.topics[topicKeys.indexOf(topic)]}</p><h2>{analysis.title}</h2></div><span className="analysis-badge">{mode === 'live' ? 'AI' : 'DEMO'} · {locale.toUpperCase()}</span></header>
        {mode === 'demo' && <p className="demo-notice">{t.demoNotice}</p>}{analysis.safety.reason && <p className="safety-notice">{analysis.safety.reason}</p>}
        <div className="analysis-grid"><article className="analysis-main"><div className="answer-block"><p className="section-kicker">{t.perspective}</p><p className="lead-answer">{analysis.perspectiveAnalysis}</p></div><div className="answer-block"><p className="section-kicker">{t.frameworks}</p><div className="framework-list">{analysis.frameworks.map((framework) => <div key={framework.name}><h3>{framework.name}</h3><p>{framework.summary}</p></div>)}</div></div><div className="answer-block"><p className="section-kicker">{t.applies}</p><p>{analysis.whyItApplies}</p></div></article>
          <aside className="analysis-side"><p className="section-kicker">{t.actions}</p><ol className="action-list">{analysis.actions.map((action, index) => <li key={action.title}><span>{index + 1}</span><div><h3>{action.title}</h3><p>{action.detail}</p></div></li>)}</ol></aside></div>
        <div className="sources-panel"><p className="section-kicker">{t.sources}</p><div>{analysis.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id} onClick={() => track('source_clicked', { source_id: source.id, topic, locale })}><span>0{index + 1}</span><div><strong>{source.title}</strong><small>{t.sourceType} · nav.al</small></div><b>↗</b></a>)}</div></div>
        <div className="feedback-row"><div><span>{t.useful}</span><button className={feedback === 'helpful' ? 'active' : ''} onClick={() => submitFeedback('helpful')} type="button">↑ {t.helpful}</button><button className={feedback === 'not_helpful' ? 'active' : ''} onClick={() => submitFeedback('not_helpful')} type="button">↓ {t.notHelpful}</button></div><button className="secondary-button" type="button" onClick={resetQuestion}>{t.another} →</button></div>
      </section>}

      <section className="how-section" id="how"><p className="eyebrow"><span />{t.howEyebrow}</p><div className="how-heading"><h2>{t.howTitle}</h2><p>{t.disclaimer}</p></div><div className="how-steps">{t.howSteps.map((step, index) => <article key={step[0]}><span>0{index + 1}</span><h3>{step[0]}</h3><p>{step[1]}</p></article>)}</div></section>

      <section className="pricing-section" id="pricing"><div><p className="eyebrow"><span />{t.pricingEyebrow}</p><h2>{t.pricingTitle}</h2><p>{t.pricingBody}</p></div><div className="price-card"><span>{t.plan}</span><div><strong>{t.price}</strong><small>USD</small></div><p>{t.priceNote}</p><button onClick={() => { setShowPaywall(true); track('paywall_viewed', { trigger: 'pricing', locale }); }} type="button">{t.buy}<span>↗</span></button></div></section>

      <footer><span>© 2026 Ask Naval</span><span>{t.disclaimer}</span><div><a href={`/${locale}/privacy`}>{t.footerPrivacy}</a><a href={`/${locale}/terms`}>{t.footerTerms}</a><a href={`/${locale}/disclaimer`}>{t.footerDisclaimer}</a></div></footer>

      {showPaywall && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPaywall(false)}><section className="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowPaywall(false)} type="button" aria-label={t.close}>×</button><span className="paywall-mark">N</span><p className="framework-label">ASK NAVAL · STARTER</p><h2 id="paywall-title">{t.paywallTitle}</h2><p>{t.paywallBody}</p><div className="modal-price"><strong>{t.price}</strong><span>{t.priceNote}</span></div><button className="modal-buy" onClick={startCheckout} type="button">{t.buy}<span>↗</span></button><button className="modal-later" onClick={() => setShowPaywall(false)} type="button">{t.close}</button>{paymentMessage && <p className="payment-message" role="status">{paymentMessage}</p>}<small>{t.disclaimer}</small></section></div>}
    </main>
  );
}
