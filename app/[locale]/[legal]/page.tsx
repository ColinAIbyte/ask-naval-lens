import { notFound } from 'next/navigation';

const content = {
  zh: {
    privacy: ['隐私政策', '我们只收集运行分析、管理额度和改进产品所需的最少数据。问题与回答不会被发送到产品埋点；支付由第三方支付服务商处理。请不要输入身份证件、账户、病历或其他敏感信息。问题和回答计划最多保留 90 天，之后删除或匿名化。你可以联系我们申请提前删除。'],
    terms: ['服务条款', 'Ask Naval 是独立的教育与思考辅助工具，不保证结果，也不构成医疗、法律、投资或其他专业建议。免费额度和付费额度只用于本产品的分析服务。滥用、自动化攻击、绕过额度或索取受版权保护全文可能导致访问被限制。'],
    disclaimer: ['免责声明', 'Ask Naval 与 Naval Ravikant 本人没有官方关联，也不代表或冒充本人。分析基于经过审核的公开内容进行归纳和解释，不是 Naval 的个人答复。产品不复制或提供《纳瓦尔宝典》或其他作品的整本、章节或大段原文。高风险决定请咨询合格专业人士。'],
    back: '返回 Ask Naval',
  },
  en: {
    privacy: ['Privacy policy', 'We collect only the minimum data needed to run analyses, manage credits, and improve the product. Questions and answers are not sent to product analytics; payments are handled by a third-party payment provider. Do not enter identity documents, account details, medical records, or other sensitive information. Questions and answers are intended to be retained for no more than 90 days, then deleted or anonymized. You may request earlier deletion.'],
    terms: ['Terms of service', 'Ask Naval is an independent educational thinking aid. It does not guarantee outcomes and is not medical, legal, investment, or other professional advice. Free and paid credits apply only to this product’s analysis service. Abuse, automated attacks, quota circumvention, or requests for copyrighted full text may result in restricted access.'],
    disclaimer: ['Disclaimer', 'Ask Naval has no official affiliation with Naval Ravikant and does not represent or impersonate him. Analyses interpret reviewed public material and are not personal replies from Naval. The product does not reproduce or provide full books, chapters, or long passages from The Almanack of Naval Ravikant or other works. Consult qualified professionals for high-risk decisions.'],
    back: 'Back to Ask Naval',
  },
} as const;

export default async function LegalPage({ params }: { params: Promise<{ locale: string; legal: string }> }) {
  const { locale, legal } = await params;
  if ((locale !== 'zh' && locale !== 'en') || (legal !== 'privacy' && legal !== 'terms' && legal !== 'disclaimer')) notFound();
  const [title, body] = content[locale][legal];
  return <main className="legal-page"><a className="brand" href={`/${locale}`}><span className="brand-mark">N</span><span>Ask Naval</span></a><article><p className="eyebrow"><span />ASK NAVAL · LEGAL</p><h1>{title}</h1><p>{body}</p><a className="secondary-button" href={`/${locale}`}>← {content[locale].back}</a></article></main>;
}
