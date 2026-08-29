'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import AnalysisResult from '@/app/analysis-result';
import type { PublicAnalysis } from '@/lib/analysis';

type Locale = 'zh' | 'en';
type Topic = 'wealth' | 'career' | 'entrepreneurship' | 'decision_making' | 'happiness' | 'other';

const topicKeys: Topic[] = ['wealth', 'career', 'entrepreneurship', 'decision_making', 'happiness', 'other'];
const exampleTopics: Record<Locale, Topic[]> = {
  zh: ['entrepreneurship', 'career', 'happiness'],
  en: ['entrepreneurship', 'decision_making', 'wealth'],
};
const contactEmail = 'fancifulman2008@gmail.com';

const copy = {
  zh: {
    navHow: '它如何工作', navPricing: '体验与价格', signIn: '登录', contact: '合作联系', eyebrow: '不是替你决定，而是帮你看清',
    titleA: '把难做的决定，', titleB: '看清楚，再行动。', subtitle: '写下你的真实处境。系统会从 Naval Ravikant 的公开思想中匹配相关框架，解释为什么适用，并给出 3 个可验证的下一步。',
    label: '写下你正在反复权衡的真实问题', placeholder: '例如：我在一家稳定的公司工作了五年，但越来越想辞职做自己的产品。我有一年的生活费和几个潜在客户，却担心经济环境不好，也不确定自己只是厌倦工作，还是真的发现了机会。我该用什么标准判断现在是否应该辞职？', topics: ['财富', '职业', '创业', '决策', '幸福', '其他'],
    topicHint: '选择最接近的主题（可选）', inputGuide: '建议写清：你的处境、正在比较的选项，以及最担心什么。', generalTopic: '综合分析',
    cta: '免费分析这个问题', analyzing: '正在匹配思想框架…', free: (n: number) => n > 0 ? `本周免费分析还剩 ${n} 次` : '本周免费额度已用完', credits: (n: number) => `剩余 ${n} 次付费分析`,
    privacy: '请勿输入姓名、电话、账号等敏感个人信息', examples: '不知道怎么写？从一个真实问题开始', exampleItems: ['我做一个副业产品八个月了，只有 40 个用户、没有收入。我很享受开发，但分不清继续是坚持，还是不愿承认方向错了。接下来 30 天我该验证什么？', '我在稳定公司工作五年，手上有一年的生活费和几个潜在客户。现在辞职做产品，究竟是经过计算的风险，还是冲动？', '我终于拿到追了几年的升职，却比以前更焦虑。每完成一个目标就出现下一个，我该怎样理解野心、成功和幸福的关系？'],
    lens: '你会得到一份怎样的分析', lensItems: ['你真正要决定的问题', '1–3 个相关思想框架', '为什么适合你的处境', '3 个可验证的下一步', '每个框架的原始出处'],
    quote: '不是替你做决定，而是帮你把决定看得更清楚。', disclaimer: '独立分析工具，不冒充 Naval Ravikant，与本人无官方关联。',
    shortQuestion: '请至少输入 30 个字符，并提供足够的现实背景。', topicRequired: '主题为选填项。', genericError: '暂时无法完成分析，请稍后重试。',
    demoNotice: '演示模式：当前回答由审核过的公开来源与固定框架生成；配置 AI 密钥后将启用个性化模型分析。',
    perspective: '视角分析', frameworks: '对应思想框架', applies: '为什么适用于你', actions: '三个行动建议', sources: '相关公开出处',
    questionLabel: '你的问题', sourceArticle: '文章', sourceTranscript: '公开文字稿', verifiedSource: '已审核', noSources: '没有找到足够的已审核公开出处来支撑额外的思想框架，因此本次分析刻意保持克制。',
    helpful: '有帮助', notHelpful: '没帮助', another: '再问一个问题',
    pricingEyebrow: '简单、透明的早期价格', pricingTitle: '每周先用 3 次，真正有帮助再购买。', pricingBody: '每周三次完整免费分析。需要更频繁使用时，再购买按次额度；一次付费，不自动续订。',
    plan: '早期体验包', price: '$9', priceNote: '一次性付款 · 30 次分析 · 12 个月有效', buy: '购买 30 次分析',
    paywallTitle: '本周的免费分析已用完', paywallBody: '购买 30 次分析，继续从经过审核的公开思想框架中获得清晰、可行动的第二视角。',
    purchaseTitle: '需要更多分析次数？', purchaseBody: '一次购买 30 次分析额度，在接下来 12 个月里按需使用；不会自动续订。',
    close: '暂时不用', paymentUnavailable: '购买功能还在准备中。你可以先使用每周免费额度；开放后会在这里直接购买。',
    howEyebrow: '不是泛泛聊天', howTitle: '从一团纠结，到一个可以验证的下一步。',
    howTrustTitle: '每次分析都遵守', howTrustItems: ['人工整理的 Naval 公开内容', '框架与出处一一对应', '不冒充本人'],
    howSteps: [['说清处境', '写下你面对的选择、已经知道的事实，以及真正让你犹豫的地方。'], ['匹配框架', '只从审核过的公开内容中选择 1–3 个真正相关的框架，并附上原始出处。'], ['设计验证', '把判断变成三个有完成时间和成功标准的行动，不让答案停在“想明白了”。']],
    howProof: [['真实选择', '例：该不该辞职创业？'], ['1–3 个框架', '公开出处'], ['今天', '7 天内', '30 天内']],
    footerPrivacy: '隐私', footerTerms: '条款', footerDisclaimer: '免责声明', useful: '这份分析有帮助吗？', matching: '正在匹配最相关的公开思想与出处。',
    footerContact: '合作、建议或反馈', share: '分享这份分析', copied: '分析链接已复制', sampleCta: '先看一份输出示例', sampleClose: '关闭示例',
    sample: { eyebrow: '输出示例 · 创业', question: '我做一个副业产品做了八个月，只有 40 个用户、没有收入。我一直在想，继续下去是坚持，还是自欺欺人？', title: '你缺的不是毅力，是一个能证伪自己的检验', perspective: '“坚持还是自欺”把方向和方法混在了一起。八个月本身不是进展证据；你需要一个能区分产品无需求与尚未找到分发方式的现实检验。', frameworks: ['为结果负责（Accountability）', '杠杆（Leverage）'], why: '你正在用投入时间衡量进展，却没有事先定义一个可以停止、继续或调整的标准。', actions: ['今天：写下最初对第八个月的具体预期', '7 天内：访谈 5 位用过但不再使用的人', '30 天内：设定一个能证伪的付费门槛'], sources: [['How to Get Rich', 'https://nav.al/rich'], ['Life is Lived in The Arena', 'https://nav.al/arena']] },
  },
  en: {
    navHow: 'How it works', navPricing: 'Pricing', signIn: 'Sign in', contact: 'Work with me', eyebrow: 'Clarity starts with a better frame',
    titleA: 'Think through hard decisions', titleB: "with Naval's mental models.", subtitle: "Bring a real decision. Ask Naval Lens matches your situation with relevant ideas from Naval Ravikant's public writings, explains why they apply, and turns them into concrete next steps.",
    label: 'What decision are you trying to make?', placeholder: "I've worked at a stable company for five years, but I increasingly want to build my own product. I have a year of runway and a few potential customers, but I'm worried about quitting into a weak economy. How should I think about the decision?", topics: ['Wealth', 'Career', 'Entrepreneurship', 'Decisions', 'Happiness', 'Other'],
    topicHint: 'Choose the closest topic (optional)', inputGuide: 'Include your context, the options you are weighing, and what worries you most.', generalTopic: 'General',
    cta: 'Analyze my question', analyzing: 'Finding the right mental models…', free: (n: number) => n > 0 ? `${n} free analyses remaining this week` : 'Weekly free analyses used', credits: (n: number) => `${n} paid analyses remaining`,
    privacy: 'Do not enter sensitive personal information', examples: 'Try a question', exampleItems: ["I've built a side project for eight months. It has 40 users and no revenue. Is continuing persistence or denial?", "I have a stable, prestigious offer and a lower-paid role with people I deeply respect. How should I compare them?", "My income is still tied to my time. Should I invest, build a business, or build an audience to create more freedom?"],
    lens: "What's inside your analysis", lensItems: ['Naval-inspired perspective', 'Relevant mental models', 'Why they fit your situation', '3 concrete next steps', 'Public sources'],
    quote: "It won't make the choice for you. It will help you see the choice clearly.", disclaimer: 'Independent project. Not affiliated with or endorsed by Naval Ravikant.',
    shortQuestion: 'Please provide at least 30 characters of real context.', topicRequired: 'Topic is optional.', genericError: 'We could not complete the analysis. Your quota was not used. Please try again shortly.',
    demoNotice: 'Demo mode: this answer uses reviewed public sources and fixed frameworks. Add an AI key to enable personalized model analysis.',
    perspective: 'Perspective', frameworks: 'Mental models', applies: 'Why this applies', actions: 'Three next steps', sources: 'Public sources',
    questionLabel: 'Your question', sourceArticle: 'Article', sourceTranscript: 'Public transcript', verifiedSource: 'Reviewed', noSources: 'We did not find enough reviewed public sources to support additional mental models, so this analysis is intentionally restrained.',
    helpful: 'Helpful', notHelpful: 'Not helpful', another: 'Ask another question',
    pricingEyebrow: 'Simple early pricing', pricingTitle: 'Try it free. Pay only when it helps.', pricingBody: 'Get three complete analyses each week. If you need to use it more often, buy a one-time credit pack—no subscription.',
    plan: 'Starter Pack', price: '$9', priceNote: 'One payment · 30 analyses · valid for 12 months', buy: 'Buy 30 analyses',
    paywallTitle: "You've used this week's free analyses", paywallBody: 'Get 30 more analyses and keep turning reviewed public ideas into clear, actionable second opinions.',
    purchaseTitle: 'Need more analyses?', purchaseBody: 'Buy 30 analyses to use whenever you need them over the next 12 months. No subscription.',
    close: 'Not now', paymentUnavailable: 'Payments are not configured yet. The flow is ready and will activate as soon as payment credentials are added.',
    howEyebrow: 'Not another generic chatbot', howTitle: 'From a real question to a testable next step.',
    howTrustTitle: 'Every analysis follows', howTrustItems: ["Curated library of Naval's public writings", 'Structured output', 'No impersonation'],
    howSteps: [['Ask honestly', 'Turn a vague worry into the real-world choice you actually need to answer.'], ['Match the frame', 'Match 1–3 relevant mental models from reviewed public material, with verifiable sources attached.'], ['Act clearly', 'Turn the judgment into three time-bound next steps so the answer does not stop at insight.']],
    howProof: [['A real choice', 'e.g. Should I quit to build?'], ['1–3 frameworks', 'Public sources'], ['Today', 'Within 7 days', 'Within 30 days']],
    footerPrivacy: 'Privacy', footerTerms: 'Terms', footerDisclaimer: 'Disclaimer', useful: 'Was this analysis useful?', matching: 'Matching your question to the most relevant public ideas and sources.',
    footerContact: 'Partnerships', share: 'Share this analysis', copied: 'Analysis link copied', sampleCta: 'View a complete example', sampleClose: 'Close example',
    sample: { eyebrow: 'Complete example · Startups', question: 'I have worked on a side project for eight months. It has 40 users and no revenue. I keep wondering whether continuing is persistence or self-deception.', title: 'You do not need more grit; you need a test that can prove you wrong', perspective: '“Persistence or self-deception” mixes direction with method. Eight months is not evidence of progress by itself; you need a real-world test that separates weak demand from missing distribution.', frameworks: ['Accountability', 'Leverage'], why: 'You are using time invested as a proxy for progress without defining a condition for stopping, continuing, or changing course.', actions: ['Today: write the specific outcome you expected by month eight', 'Within 7 days: interview five people who tried it and left', 'Within 30 days: set a falsifiable paid-conversion threshold'], sources: [['How to Get Rich', 'https://nav.al/rich'], ['Life is Lived in The Arena', 'https://nav.al/arena']] },
  },
} as const;

function track(event: string, properties: Record<string, string | number | boolean> = {}) {
  void fetch('/api/events', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ event, properties }) }).catch(() => undefined);
}

export default function AskNavalApp({ initialLocale, initialQuestion = '' }: { initialLocale: Locale; initialQuestion?: string }) {
  const locale = initialLocale;
  const [topic, setTopic] = useState<Topic | null>(null);
  const [question, setQuestion] = useState(initialQuestion);
  const [analysis, setAnalysis] = useState<PublicAnalysis | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState('');
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<'quota' | 'pricing'>('quota');
  const [paymentMessage, setPaymentMessage] = useState('');
  const [paidCredits, setPaidCredits] = useState(0);
  const [freeRemaining, setFreeRemaining] = useState(3);
  const [showSample, setShowSample] = useState(false);
  const answerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLTextAreaElement>(null);
  const t = copy[locale];
  const questionLength = question.trim().length;
  const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent(locale === 'zh' ? 'Ask Naval Lens 合作与交流' : 'Ask Naval Lens — partnership or feedback')}&body=${encodeURIComponent(locale === 'zh' ? '你好，我从 Ask Naval Lens 网页找到你。\n\n我想和你聊聊：' : 'Hi, I found you through Ask Naval Lens.\n\nI would like to talk about:')}`;
  useEffect(() => {
    document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
    track('landing_viewed', { locale });
    void fetch('/api/entitlements')
      .then(async (res) => res.ok ? await res.json() as { paidCredits?: number; freeRemaining?: number } : null)
      .then((data) => { if (data) { setPaidCredits(data.paidCredits ?? 0); setFreeRemaining(data.freeRemaining ?? 3); } })
      .catch(() => undefined);
  }, [locale]);

  async function analyze() {
    setError(''); setPaymentMessage('');
    if (question.trim().length < 30) { setError(t.shortQuestion); return; }
    const selectedTopic = topic;
    setStatus('loading'); setAnalysis(null); setResultUrl(null);
    track('analysis_submitted', { topic: selectedTopic ?? 'unspecified', locale });
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ question: question.trim(), topic: selectedTopic, locale }) });
      const data = await response.json() as { error?: string; analysis?: PublicAnalysis; analysisId?: string; resultUrl?: string; paidCredits?: number; freeRemaining?: number };
      if (response.status === 402) { setPaidCredits(data.paidCredits ?? 0); setFreeRemaining(0); setPaywallTrigger('quota'); setShowPaywall(true); track('paywall_viewed', { trigger: 'quota_exhausted', locale }); return; }
      if (!response.ok) throw new Error(data.error || t.genericError);
      if (!data.analysis || !data.analysisId || !data.resultUrl) throw new Error(t.genericError);
      setAnalysis(data.analysis); setAnalysisId(data.analysisId); setResultUrl(data.resultUrl); setPaidCredits(data.paidCredits ?? paidCredits); setFreeRemaining(data.freeRemaining ?? freeRemaining);
      window.history.pushState({}, '', data.resultUrl);
      track('analysis_completed', { topic: selectedTopic ?? 'unspecified', locale });
      window.setTimeout(() => answerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : t.genericError;
      setError(message); setStatus('error'); track('analysis_failed', { topic: selectedTopic ?? 'unspecified', locale });
    } finally { setStatus((current) => current === 'error' ? 'error' : 'idle'); }
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

  function resetQuestion() { setAnalysis(null); setAnalysisId(null); setResultUrl(null); setQuestion(''); setTopic(null); setError(''); window.history.pushState({}, '', `/${locale}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function askFollowUp(value: string) { setAnalysis(null); setAnalysisId(null); setResultUrl(null); setQuestion(value); setTopic(null); setError(''); window.history.pushState({}, '', `/${locale}?question=${encodeURIComponent(value)}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function chooseExample(value: string, selectedTopic: Topic, index: number) {
    setQuestion(value); setTopic(selectedTopic); setError('');
    track('example_selected', { example_id: index, locale });
    window.setTimeout(() => { questionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); questionRef.current?.focus({ preventScroll: true }); }, 40);
  }

  return (
    <main className={`site-shell locale-${locale}`}>
      <nav className="nav-wrap" aria-label={locale === 'zh' ? '主要导航' : 'Primary navigation'}>
        <a className="brand" href={`/${locale}`} aria-label="Ask Naval Lens home"><span className="brand-mark">N</span><span>Ask Naval Lens</span></a>
        <div className="nav-links"><a className="nav-how" href="#how">{t.navHow}</a><a className="nav-pricing" href="#pricing">{t.navPricing}</a><a className="nav-signin" href={`/signin-with-chatgpt?return_to=/${locale}`}>{t.signIn}</a>
          <div className="language-switch" aria-label={locale === 'zh' ? '切换语言' : 'Switch language'}><Link className={locale === 'zh' ? 'active' : ''} href="/zh" aria-current={locale === 'zh' ? 'page' : undefined} onClick={() => track('language_changed', { from_locale: locale, to_locale: 'zh' })}>中</Link><span>/</span><Link className={locale === 'en' ? 'active' : ''} href="/en" aria-current={locale === 'en' ? 'page' : undefined} onClick={() => track('language_changed', { from_locale: locale, to_locale: 'en' })}>EN</Link></div>
        </div>
      </nav>

      <section id="top" className="hero-grid">
        <div className="hero-copy"><p className="eyebrow"><span />{t.eyebrow}</p><h1>{t.titleA}<br />{locale === 'zh' ? <span className="hero-emphasis">{t.titleB}</span> : <em>{t.titleB}</em>}</h1><p className="subtitle">{t.subtitle}</p><p className="hero-disclaimer">{t.disclaimer}</p>
          <div className="ask-card"><label htmlFor="question">{t.label}</label><textarea ref={questionRef} id="question" value={question} onChange={(event) => { setQuestion(event.target.value); if (error) setError(''); }} placeholder={t.placeholder} minLength={30} maxLength={3000} disabled={status === 'loading'} />
            <div className="input-meta"><span>{t.inputGuide}</span><span className={questionLength >= 30 ? 'ready' : ''}>{questionLength}/3000</span></div>
            <p className="topic-prompt">{t.topicHint}</p><div className="topic-row" role="group" aria-label={t.topicHint}>{topicKeys.map((key, index) => <button aria-pressed={topic === key} className={topic === key ? 'selected' : ''} key={key} onClick={() => setTopic(topic === key ? null : key)} type="button">{t.topics[index]}</button>)}</div>
            <div className="ask-actions"><div className="quota"><span className="quota-dot" /><span>{t.free(freeRemaining)}{paidCredits > 0 ? ` · ${t.credits(paidCredits)}` : ''}</span></div><button className="primary-button" type="button" onClick={analyze} disabled={status === 'loading'}>{status === 'loading' ? t.analyzing : t.cta}<span aria-hidden="true">↗</span></button></div>
          </div>{error && <p className="form-error" role="alert">{error}</p>}<p className="privacy-note">⌁ {t.privacy}</p>
        </div>
        <aside className="framework-card"><div className="orbit" aria-hidden="true"><span className="orbit-ring ring-one" /><span className="orbit-ring ring-two" /><span className="orbit-core">N</span></div><p className="framework-label">{t.lens}</p><ol>{t.lensItems.map((item, index) => <li key={item}><span>0{index + 1}</span>{item}</li>)}</ol><div className="hero-trust">{t.howTrustItems.map((item) => <span key={item}>✓ {item}</span>)}</div>{locale === 'zh' && <button className="sample-button" type="button" onClick={() => { setShowSample(true); track('sample_viewed', { locale }); }}>{t.sampleCta}<span>↗</span></button>}</aside>
      </section>

      <section className="examples-section" aria-labelledby="examples-title"><p id="examples-title">{t.examples}</p><div className="examples-list">{t.exampleItems.map((item, index) => <button key={item} onClick={() => chooseExample(item, exampleTopics[locale][index], index)} type="button"><span>{item}</span><span aria-hidden="true">→</span></button>)}</div></section>

      {status === 'loading' && <section className="loading-analysis" aria-live="polite"><span className="loading-mark">N</span><div><strong>{t.analyzing}</strong><p>{t.matching}</p></div></section>}

      {analysis && analysisId && resultUrl && <div ref={answerRef}><AnalysisResult locale={locale} analysis={analysis} question={question} topicLabel={topic ? t.topics[topicKeys.indexOf(topic)] : t.generalTopic} analysisId={analysisId} resultUrl={resultUrl} onAskAnother={resetQuestion} onFollowUp={askFollowUp} /></div>}

      <section className="how-section" id="how"><p className="eyebrow"><span />{t.howEyebrow}</p><div className="how-heading"><h2>{t.howTitle}</h2><aside className="how-trust"><strong>{t.howTrustTitle}</strong><div>{t.howTrustItems.map((item) => <span key={item}>✓ {item}</span>)}</div><p>{t.disclaimer}</p></aside></div><div className="how-steps">{t.howSteps.map((step, index) => <article key={step[0]}><span className="step-number">0{index + 1}</span><h3>{step[0]}</h3><p>{step[1]}</p><div className="step-proof">{t.howProof[index].map((item) => <span key={item}>{item}</span>)}</div></article>)}</div></section>

      <section className="pricing-section" id="pricing"><div><p className="eyebrow"><span />{t.pricingEyebrow}</p><h2>{t.pricingTitle}</h2><p>{t.pricingBody}</p></div><div className="price-card"><span>{t.plan}</span><div><strong>{t.price}</strong><small>USD</small></div><p>{t.priceNote}</p><button onClick={() => { setPaywallTrigger('pricing'); setShowPaywall(true); track('paywall_viewed', { trigger: 'pricing', locale }); }} type="button">{t.buy}<span>↗</span></button></div></section>

      <footer><span>© 2026 Ask Naval Lens</span><span className="footer-contact">{t.footerContact} · <a className="footer-email" href={contactHref} onClick={() => track('contact_clicked', { placement: 'footer', locale })}>{contactEmail}</a></span><div><a href={`/${locale}/privacy`}>{t.footerPrivacy}</a><a href={`/${locale}/terms`}>{t.footerTerms}</a><a href={`/${locale}/disclaimer`}>{t.footerDisclaimer}</a></div></footer>

      {showSample && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowSample(false)}><section className="sample-modal" role="dialog" aria-modal="true" aria-labelledby="sample-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowSample(false)} type="button" aria-label={t.sampleClose}>×</button><p className="section-kicker">{t.sample.eyebrow}</p><p className="sample-question">{t.sample.question}</p><h2 id="sample-title">{t.sample.title}</h2><div className="sample-grid"><article><span>01 · {t.perspective}</span><p>{t.sample.perspective}</p><span>02 · {t.frameworks}</span><div className="sample-frameworks">{t.sample.frameworks.map((item) => <strong key={item}>{item}</strong>)}</div><span>03 · {t.applies}</span><p>{t.sample.why}</p></article><aside><span>04 · {t.actions}</span><ol>{t.sample.actions.map((item, index) => <li key={item}><b>{index + 1}</b>{item}</li>)}</ol></aside></div><div className="sample-sources"><span>05 · {t.sources}</span>{t.sample.sources.map(([title, url]) => <a href={url} target="_blank" rel="noreferrer" key={url}>✓ {title} ↗</a>)}</div></section></div>}

      {showPaywall && <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowPaywall(false)}><section className="paywall-modal" role="dialog" aria-modal="true" aria-labelledby="paywall-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowPaywall(false)} type="button" aria-label={t.close}>×</button><span className="paywall-mark">N</span><p className="framework-label">ASK NAVAL LENS · STARTER</p><h2 id="paywall-title">{paywallTrigger === 'quota' ? t.paywallTitle : t.purchaseTitle}</h2><p>{paywallTrigger === 'quota' ? t.paywallBody : t.purchaseBody}</p><div className="modal-price"><strong>{t.price}</strong><span>{t.priceNote}</span></div><button className="modal-buy" onClick={startCheckout} type="button">{t.buy}<span>↗</span></button><button className="modal-later" onClick={() => setShowPaywall(false)} type="button">{t.close}</button>{paymentMessage && <p className="payment-message" role="status">{paymentMessage}</p>}<small>{t.disclaimer}</small></section></div>}
    </main>
  );
}
