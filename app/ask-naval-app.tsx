'use client';

import { useEffect, useRef, useState } from 'react';

type Locale = 'zh' | 'en';
type Topic = 'wealth' | 'entrepreneurship' | 'life' | 'happiness' | 'decision_making' | 'other';
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

const topicKeys: Topic[] = ['wealth', 'entrepreneurship', 'life', 'happiness', 'decision_making', 'other'];
const contactEmail = 'fancifulman2008@gmail.com';

const copy = {
  zh: {
    navHow: '如何工作', navPricing: '价格', signIn: '登录', contact: '合作联系', eyebrow: '清晰，源于更好的思考框架',
    titleA: '换一个视角，', titleB: '看清你的问题。', subtitle: '借助 Naval Ravikant 公开分享的思想框架，获得有出处、可行动的独立分析。',
    label: '你现在想理清什么？', placeholder: '例如：我在一家稳定的公司工作了五年，但越来越想辞职做自己的产品。我有一年生活费，也有几个潜在客户，却担心只是厌倦工作——我该如何判断现在是不是合适的时机？', topics: ['财富', '创业', '人生', '幸福', '决策', '其他'],
    cta: '分析我的问题', analyzing: '正在梳理思想框架…', free: (n: number) => n > 0 ? `本周还可免费分析 ${n} 次` : '本周免费额度已用完', credits: (n: number) => `剩余 ${n} 次付费分析`,
    privacy: '请勿输入敏感个人信息', examples: '试试这些问题', exampleItems: ['我应该继续做这个产品吗？', '怎样判断一项工作是否值得长期投入？', '财富和自由之间是什么关系？'],
    lens: '本次分析会包含', lensItems: ['Naval 视角分析', '对应思想框架', '为什么适用于你', '3 个行动建议', '相关公开出处'],
    quote: '不是替你做决定，而是帮你把决定看得更清楚。', disclaimer: '独立分析工具，与 Naval Ravikant 本人无官方关联。',
    shortQuestion: '请至少输入 10 个字符，让问题更具体一些。', topicRequired: '请先选择一个最接近的主题；如果都不合适，可以选择“其他”。', genericError: '暂时无法完成分析，请稍后重试。',
    demoNotice: '演示模式：当前回答由审核过的公开来源与固定框架生成；配置 AI 密钥后将启用个性化模型分析。',
    perspective: '视角分析', frameworks: '对应思想框架', applies: '为什么适用于你', actions: '三个行动建议', sources: '相关公开出处',
    questionLabel: '你的问题', sourceArticle: '文章', sourceTranscript: '公开文字稿', verifiedSource: '已审核', noSources: '没有找到足够的已审核公开出处来支撑额外的思想框架，因此本次分析刻意保持克制。',
    helpful: '有帮助', notHelpful: '没帮助', another: '再问一个问题',
    pricingEyebrow: '简单、透明的早期价格', pricingTitle: '先免费体验，再决定是否继续。', pricingBody: '每周三次完整免费分析。需要更频繁使用时，再购买按次额度，不自动续费。',
    plan: 'Starter Pack', price: '$9', priceNote: '一次性付款 · 30 次分析 · 12 个月有效', buy: '购买 30 次',
    paywallTitle: '本周的免费分析已用完', paywallBody: '购买 30 次分析，继续从经过审核的公开思想框架中获得清晰、可行动的第二视角。',
    close: '暂时不用', paymentUnavailable: '支付服务尚未配置。页面与流程已经就绪，配置支付密钥后即可开放购买。',
    howEyebrow: '不是泛泛聊天', howTitle: '从真实问题，到可验证的下一步。',
    howTrustTitle: '每次分析都遵守', howTrustItems: ['人工审核来源', '固定结构输出', '不冒充本人'],
    howSteps: [['提出问题', '把笼统的焦虑写成一个你真正需要回答的现实选择。'], ['匹配框架', '从人工审核的公开内容中匹配 1–3 个相关思想框架，并附上可核验出处。'], ['开始行动', '把判断拆成三个有时间边界的下一步，不让答案停在“想明白了”。']],
    howProof: [['真实选择', '例：该不该辞职创业？'], ['1–3 个框架', '公开出处'], ['今天', '7 天内', '30 天内']],
    footerPrivacy: '隐私', footerTerms: '条款', footerDisclaimer: '免责声明', useful: '这份分析有帮助吗？', matching: '正在匹配最相关的公开思想与出处。',
    footerContact: '合作联系', share: '分享 Ask Naval', copied: '链接已复制', sampleCta: '看一份完整示例', sampleClose: '关闭示例',
    sample: { eyebrow: '完整示例 · 创业', question: '我做一个副业产品做了八个月，只有 40 个用户、没有收入。我一直在想，继续下去是坚持，还是自欺欺人？', title: '你缺的不是毅力，是一个能证伪自己的检验', perspective: '“坚持还是自欺”把方向和方法混在了一起。八个月本身不是进展证据；你需要一个能区分产品无需求与尚未找到分发方式的现实检验。', frameworks: ['责任与署名', '杠杆'], why: '你正在用投入时间衡量进展，却没有事先定义一个可以停止、继续或调整的标准。', actions: ['今天：写下最初对第八个月的具体预期', '7 天内：访谈 5 位用过但不再使用的人', '30 天内：设定一个能证伪的付费门槛'], sources: [['How to Get Rich', 'https://nav.al/rich'], ['Life is Lived in The Arena', 'https://nav.al/arena']] },
  },
  en: {
    navHow: 'How it works', navPricing: 'Pricing', signIn: 'Sign in', contact: 'Work with me', eyebrow: 'Clarity starts with a better frame',
    titleA: 'See your question', titleB: 'from a sharper angle.', subtitle: "Use Naval Ravikant's publicly shared ideas for a sourced, actionable, independent analysis.",
    label: 'What are you trying to make sense of?', placeholder: 'For example: I have spent five years in a stable job, but I increasingly want to quit and build my own product. I have one year of savings and a few potential customers, yet I worry I am merely tired of my job—how should I judge whether this is the right time?', topics: ['Wealth', 'Startups', 'Life', 'Happiness', 'Decisions', 'Other'],
    cta: 'Analyze my question', analyzing: 'Finding the right mental models…', free: (n: number) => n > 0 ? `${n} free analyses remaining this week` : 'Weekly free analyses used', credits: (n: number) => `${n} paid analyses remaining`,
    privacy: 'Do not enter sensitive personal information', examples: 'Try a question', exampleItems: ['Should I keep building this product?', 'How do I know if a job is worth years of my life?', 'What is the relationship between wealth and freedom?'],
    lens: "What's inside your analysis", lensItems: ['Naval-inspired perspective', 'Relevant mental models', 'Why they fit your situation', '3 concrete next steps', 'Public sources'],
    quote: "It won't make the choice for you. It will help you see the choice clearly.", disclaimer: 'An independent tool with no official affiliation to Naval Ravikant.',
    shortQuestion: 'Please enter at least 10 characters so the question has enough context.', topicRequired: 'Choose the closest topic first. If none fits, select “Other.”', genericError: 'We could not complete the analysis. Please try again shortly.',
    demoNotice: 'Demo mode: this answer uses reviewed public sources and fixed frameworks. Add an AI key to enable personalized model analysis.',
    perspective: 'Perspective', frameworks: 'Mental models', applies: 'Why this applies', actions: 'Three next steps', sources: 'Public sources',
    questionLabel: 'Your question', sourceArticle: 'Article', sourceTranscript: 'Public transcript', verifiedSource: 'Reviewed', noSources: 'We did not find enough reviewed public sources to support additional mental models, so this analysis is intentionally restrained.',
    helpful: 'Helpful', notHelpful: 'Not helpful', another: 'Ask another question',
    pricingEyebrow: 'Simple early pricing', pricingTitle: 'Try it free. Pay only when it helps.', pricingBody: 'Get three complete analyses each week. If you need to use it more often, buy a one-time credit pack—no subscription.',
    plan: 'Starter Pack', price: '$9', priceNote: 'One payment · 30 analyses · valid for 12 months', buy: 'Buy 30 analyses',
    paywallTitle: "You've used this week's free analyses", paywallBody: 'Get 30 more analyses and keep turning reviewed public ideas into clear, actionable second opinions.',
    close: 'Not now', paymentUnavailable: 'Payments are not configured yet. The flow is ready and will activate as soon as payment credentials are added.',
    howEyebrow: 'Not another generic chatbot', howTitle: 'From a real question to a testable next step.',
    howTrustTitle: 'Every analysis follows', howTrustItems: ['Human-reviewed sources', 'Consistent output', 'No impersonation'],
    howSteps: [['Ask honestly', 'Turn a vague worry into the real-world choice you actually need to answer.'], ['Match the frame', 'Match 1–3 relevant mental models from reviewed public material, with verifiable sources attached.'], ['Act clearly', 'Turn the judgment into three time-bound next steps so the answer does not stop at insight.']],
    howProof: [['A real choice', 'e.g. Should I quit to build?'], ['1–3 frameworks', 'Public sources'], ['Today', 'Within 7 days', 'Within 30 days']],
    footerPrivacy: 'Privacy', footerTerms: 'Terms', footerDisclaimer: 'Disclaimer', useful: 'Was this analysis useful?', matching: 'Matching your question to the most relevant public ideas and sources.',
    footerContact: 'Partnerships', share: 'Share Ask Naval', copied: 'Link copied', sampleCta: 'View a complete example', sampleClose: 'Close example',
    sample: { eyebrow: 'Complete example · Startups', question: 'I have worked on a side project for eight months. It has 40 users and no revenue. I keep wondering whether continuing is persistence or self-deception.', title: 'You do not need more grit; you need a test that can prove you wrong', perspective: '“Persistence or self-deception” mixes direction with method. Eight months is not evidence of progress by itself; you need a real-world test that separates weak demand from missing distribution.', frameworks: ['Accountability', 'Leverage'], why: 'You are using time invested as a proxy for progress without defining a condition for stopping, continuing, or changing course.', actions: ['Today: write the specific outcome you expected by month eight', 'Within 7 days: interview five people who tried it and left', 'Within 30 days: set a falsifiable paid-conversion threshold'], sources: [['How to Get Rich', 'https://nav.al/rich'], ['Life is Lived in The Arena', 'https://nav.al/arena']] },
  },
} as const;

function track(event: string, properties: Record<string, string | number | boolean> = {}) {
  void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, properties }) }).catch(() => undefined);
}

export default function AskNavalApp({ initialLocale }: { initialLocale: Locale }) {
  const [locale, setLocale] = useState<Locale>(initialLocale);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [question, setQuestion] = useState('');
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [mode, setMode] = useState<'live' | 'demo' | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paidCredits, setPaidCredits] = useState(0);
  const [freeRemaining, setFreeRemaining] = useState(3);
  const [feedback, setFeedback] = useState<'helpful' | 'not_helpful' | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const answerRef = useRef<HTMLElement>(null);
  const t = copy[locale];
  const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent(locale === 'zh' ? 'Ask Naval 合作与交流' : 'Ask Naval — partnership or feedback')}&body=${encodeURIComponent(locale === 'zh' ? '你好，我从 Ask Naval 网页找到你。\n\n我想和你聊聊：' : 'Hi, I found you through Ask Naval.\n\nI would like to talk about:')}`;
  const hasFrameworks = Boolean(analysis?.frameworks.length);
  const sectionNumbers = { perspective: 1, frameworks: 2, applies: hasFrameworks ? 3 : 2, actions: hasFrameworks ? 4 : 3, sources: hasFrameworks ? 5 : 4 };
  const sectionLabel = (number: number, label: string) => `${String(number).padStart(2, '0')} · ${label}`;

  useEffect(() => {
    track('landing_viewed', { locale });
    void fetch('/api/entitlements')
      .then(async (res) => res.ok ? await res.json() as { paidCredits?: number; freeRemaining?: number } : null)
      .then((data) => { if (data) { setPaidCredits(data.paidCredits ?? 0); setFreeRemaining(data.freeRemaining ?? 3); } })
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
    const selectedTopic = topic;
    if (!selectedTopic) { setError(t.topicRequired); return; }
    setStatus('loading'); setAnalysis(null); setFeedback(null);
    track('analysis_submitted', { topic: selectedTopic, locale });
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: question.trim(), topic: selectedTopic, locale }) });
      const data = await response.json() as { error?: string; analysis?: Analysis; analysisId?: string; mode?: 'live' | 'demo'; paidCredits?: number; freeRemaining?: number };
      if (response.status === 402) { setPaidCredits(data.paidCredits ?? 0); setFreeRemaining(0); setShowPaywall(true); track('paywall_viewed', { trigger: 'quota_exhausted', locale }); return; }
      if (!response.ok) throw new Error(data.error || t.genericError);
      if (!data.analysis || !data.analysisId || !data.mode) throw new Error(t.genericError);
      setAnalysis(data.analysis); setAnalysisId(data.analysisId); setMode(data.mode); setPaidCredits(data.paidCredits ?? paidCredits); setFreeRemaining(data.freeRemaining ?? freeRemaining);
      track('analysis_completed', { topic: selectedTopic, locale, mode: data.mode });
      window.setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message); setStatus('error'); track('analysis_failed', { topic: selectedTopic, locale });
    } finally { setStatus((current) => current === 'error' ? 'error' : 'idle'); }
  }

  async function submitFeedback(value: 'helpful' | 'not_helpful') {
    setFeedback(value); track('feedback_submitted', { rating: value, topic: topic ?? 'other', locale });
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

  async function shareSite() {
    track('share_clicked', { locale });
    const shareData = { title: 'Ask Naval', text: locale === 'zh' ? '用 Naval 的公开思想框架，看清一个现实问题。' : 'See a real question through Naval’s publicly shared ideas.', url: window.location.origin + `/${locale}` };
    try {
      if (navigator.share) await navigator.share(shareData);
      else { await navigator.clipboard.writeText(shareData.url); setShareCopied(true); window.setTimeout(() => setShareCopied(false), 2200); }
    } catch { /* The user may cancel the native share sheet. */ }
  }

  function resetQuestion() { setAnalysis(null); setQuestion(''); setTopic(null); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }

  return (
    <main className="site-shell">
      <nav className="nav-wrap" aria-label="Primary navigation">
        <a className="brand" href={`/${locale}`} aria-label="Ask Naval home"><span className="brand-mark">N</span><span>Ask Naval</span></a>
        <div className="nav-links"><a href="#how">{t.navHow}</a><a href="#pricing">{t.navPricing}</a><a href={`/signin-with-chatgpt?return_to=/${locale}`}>{t.signIn}</a>
          <div className="language-switch" aria-label="Language switcher"><button className={locale === 'zh' ? 'active' : ''} onClick={() => changeLocale('zh')} type="button">中</button><span>/</span><button className={locale === 'en' ? 'active' : ''} onClick={() => changeLocale('en')} type="button">EN</button></div>
        </div>
      </nav>

      <section id="top" className="hero-grid">
        <div className="hero-copy"><p className="eyebrow"><span />{t.eyebrow}</p><h1>{t.titleA}<br />{locale === 'zh' ? <span className="hero-emphasis">{t.titleB}</span> : <em>{t.titleB}</em>}</h1><p className="subtitle">{t.subtitle}</p><p className="hero-disclaimer">{t.disclaimer}</p>
          <div className="ask-card"><label htmlFor="question">{t.label}</label><textarea id="question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder={t.placeholder} maxLength={1000} disabled={status === 'loading'} />
            <div className="topic-row" role="group" aria-label="Question topic">{topicKeys.map((key, index) => <button aria-pressed={topic === key} className={topic === key ? 'selected' : ''} key={key} onClick={() => setTopic(key)} type="button">{t.topics[index]}</button>)}</div>
            <div className="ask-actions"><div className="quota"><span className="quota-dot" /><span>{paidCredits > 0 ? t.credits(paidCredits) : t.free(freeRemaining)}</span></div><button className="primary-button" type="button" onClick={analyze} disabled={status === 'loading'}>{status === 'loading' ? t.analyzing : t.cta}<span aria-hidden="true">↗</span></button></div>
          </div>{error && <p className="form-error" role="alert">{error}</p>}<p className="privacy-note">⌁ {t.privacy}</p>
        </div>
        <aside className="framework-card"><div className="orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-core">N</span></div><p className="framework-label">{t.lens}</p><ol>{t.lensItems.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol><div className="hero-trust">{t.howTrustItems.map((item) => <span key={item}>✓ {item}</span>)}</div><button className="sample-button" type="button" onClick={() => { setShowSample(true); track('sample_viewed', { locale }); }}>{t.sampleCta}<span>↗</span></button></aside>
      </section>

      <section className="examples-section" aria-labelledby="examples-title"><p id="examples-title">{t.examples}</p><div className="examples-list">{t.exampleItems.map((item, index) => <button key={item} onClick={() => { setQuestion(item); setTopic(topicKeys[[1, 4, 0][index]]); track('example_selected', { example_id: index, locale }); }} type="button"><span>{item}</span><span aria-hidden="true">→</span></button>)}</div></section>

      {status === 'loading' && <section className="loading-analysis" aria-live="polite"><span className="loading-mark">N</span><div><strong>{t.analyzing}</strong><p>{t.matching}</p></div></section>}

      {analysis && <section className="analysis-section" ref={answerRef}>
        <header className="analysis-header"><div><p className="eyebrow"><span />{t.questionLabel} · {topic ? t.topics[topicKeys.indexOf(topic)] : t.topics[5]}</p><p className="question-recap">{question.length > 220 ? `${question.slice(0, 220)}…` : question}</p><h2>{analysis.title}</h2></div><span className="analysis-badge">{mode === 'live' ? 'AI' : 'DEMO'} · {locale.toUpperCase()}</span></header>
        {mode === 'demo' && <p className="demo-notice">{t.demoNotice}</p>}{analysis.safety.reason && <p className="safety-notice">{analysis.safety.reason}</p>}
        <div className="analysis-grid"><article className="analysis-main"><div className="answer-block"><p className="section-kicker">{sectionLabel(sectionNumbers.perspective, t.perspective)}</p><p className="lead-answer">{analysis.perspectiveAnalysis}</p></div>{hasFrameworks && <div className="answer-block"><p className="section-kicker">{sectionLabel(sectionNumbers.frameworks, t.frameworks)}</p><div className="framework-list">{analysis.frameworks.map((framework) => <div key={framework.name}><h3>{framework.name}</h3><p>{framework.summary}</p></div>)}</div></div>}<div className="answer-block"><p className="section-kicker">{sectionLabel(sectionNumbers.applies, t.applies)}</p><p>{analysis.whyItApplies}</p></div></article>
          <aside className="analysis-side"><p className="section-kicker">{sectionLabel(sectionNumbers.actions, t.actions)}</p><ol className="action-list">{analysis.actions.map((action, index) => <li key={action.title}><span>{index + 1}</span><div><h3>{action.title}</h3><p>{action.detail}</p></div></li>)}</ol></aside></div>
        <div className="sources-panel"><p className="section-kicker">{sectionLabel(sectionNumbers.sources, t.sources)}</p>{analysis.sources.length > 0 ? <div>{analysis.sources.map((source, index) => <a href={source.url} target="_blank" rel="noreferrer" key={source.id} onClick={() => track('source_clicked', { source_id: source.id, topic: topic ?? 'other', locale })}><span>0{index + 1}</span><div><strong>{source.title}</strong><small>✓ {t.verifiedSource} · {source.sourceType === 'article' ? t.sourceArticle : t.sourceTranscript} · nav.al</small></div><b>↗</b></a>)}</div> : <p className="sources-empty">{t.noSources}</p>}</div>
        <div className="feedback-row"><div><span>{t.useful}</span><button className={feedback === 'helpful' ? 'active' : ''} onClick={() => submitFeedback('helpful')} type="button">↑ {t.helpful}</button><button className={feedback === 'not_helpful' ? 'active' : ''} onClick={() => submitFeedback('not_helpful')} type="button">↓ {t.notHelpful}</button></div><div className="feedback-secondary"><button className="share-result" type="button" onClick={shareSite}>{shareCopied ? `✓ ${t.copied}` : `↗ ${t.share}`}</button><button className="secondary-button" type="button" onClick={resetQuestion}>{t.another} →</button></div></div>
      </section>}

      <section className="how-section" id="how"><p className="eyebrow"><span />{t.howEyebrow}</p><div className="how-heading"><h2>{t.howTitle}</h2><aside className="how-trust"><strong>{t.howTrustTitle}</strong><div>{t.howTrustItems.map((item) => <span key={item}>✓ {item}</span>)}</div><p>{t.disclaimer}</p></aside></div><div className="how-steps">{t.howSteps.map((step, index) => <article key={step[0]}><span className="step-number">0{index + 1}</span><h3>{step[0]}</h3><p>{step[1]}</p><div className="step-proof">{t.howProof[index].map((item) => <span key={item}>{item}</span>)}</div></article>)}</div></section>

      <section className="pricing-section" id="pricing"><div><p className="eyebrow"><span />{t.pricingEyebrow}</p><h2>{t.pricingTitle}</h2><p>{t.pricingBody}</p></div><div className="price-card"><span>{t.plan}</span><div><strong>{t.price}</strong><small>USD</small></div><p>{t.priceNote}</p><button onClick={() => { setShowPaywall(true); track('paywall_viewed', { trigger: 'pricing', locale }); }} type="button">{t.buy}<span>↗</span></button></div></section>

      <footer><span>© 2026 Ask Naval</span><span className="footer-contact">{t.footerContact} · <a className="footer-email" href={contactHref} onClick={() => track('contact_clicked', { placement: 'footer', locale })}>{contactEmail}</a></span><div><a href={`/${locale}/privacy`}>{t.footerPrivacy}</a><a href={`/${locale}/terms`}>{t.footerTerms}</a><a href={`/${locale}/disclaimer`}>{t.footerDisclaimer}</a></div></footer>

      {showSample && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowSample(false)}><section className="sample-modal" role="dialog" aria-modal="true" aria-labelledby="sample-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowSample(false)} type="button" aria-label={t.sampleClose}>×</button><p className="section-kicker">{t.sample.eyebrow}</p><p className="sample-question">{t.sample.question}</p><h2 id="sample-title">{t.sample.title}</h2><div className="sample-grid"><article><span>01 · {t.perspective}</span><p>{t.sample.perspective}</p><span>02 · {t.frameworks}</span><div className="sample-frameworks">{t.sample.frameworks.map((item) => <strong key={item}>{item}</strong>)}</div><span>03 · {t.applies}</span><p>{t.sample.why}</p></article><aside><span>04 · {t.actions}</span><ol>{t.sample.actions.map((item, index) => <li key={item}><b>{index + 1}</b>{item}</li>)}</ol></aside></div><div className="sample-sources"><span>05 · {t.sources}</span>{t.sample.sources.map(([title, url]) => <a href={url} target="_blank" rel="noreferrer" key={url}>✓ {title} ↗</a>)}</div></section></div>}

      {showPaywall && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPaywall(false)}><section className="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowPaywall(false)} type="button" aria-label={t.close}>×</button><span className="paywall-mark">N</span><p className="framework-label">ASK NAVAL · STARTER</p><h2 id="paywall-title">{t.paywallTitle}</h2><p>{t.paywallBody}</p><div className="modal-price"><strong>{t.price}</strong><span>{t.priceNote}</span></div><button className="modal-buy" onClick={startCheckout} type="button">{t.buy}<span>↗</span></button><button className="modal-later" onClick={() => setShowPaywall(false)} type="button">{t.close}</button>{paymentMessage && <p className="payment-message" role="status">{paymentMessage}</p>}<small>{t.disclaimer}</small></section></div>}
    </main>
  );
}
