export type Topic = 'wealth' | 'career' | 'entrepreneurship' | 'decision_making' | 'happiness' | 'other';

export type ApprovedSource = {
  id: string;
  title: string;
  url: string;
  sourceType: 'article' | 'podcast_transcript';
  topics: Topic[];
  tags: string[];
  summary: string;
};

// Curated paraphrases of Naval's public writing. These are retrieval context,
// not quotations, and every record resolves to an original nav.al page.
export const approvedSources: ApprovedSource[] = [
  {
    id: 'naval-rich',
    title: 'How to Get Rich',
    url: 'https://nav.al/rich',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'career', 'entrepreneurship', 'decision_making'],
    tags: ['wealth', 'freedom', 'ownership', 'leverage', 'equity', 'code', 'media', 'business', 'audience', '财富', '自由', '所有权', '股权', '杠杆', '代码', '媒体', '创业', '生意', '受众'],
    summary: 'Wealth is productive assets rather than status. Specific knowledge, accountability, ownership, leverage, and judgment compound when applied over a long horizon; code and media can scale output without proportionally scaling labor.',
  },
  {
    id: 'naval-specific-knowledge',
    title: 'Arm Yourself With Specific Knowledge',
    url: 'https://nav.al/specific-knowledge',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'career', 'entrepreneurship'],
    tags: ['career', 'curiosity', 'skills', 'strengths', 'specific knowledge', 'learning', 'product', 'founder', '职业', '好奇心', '技能', '优势', '具体知识', '学习', '产品', '创始人'],
    summary: 'Specific knowledge grows from genuine curiosity, lived experience, and work that is difficult to train or standardize. It is discovered through practice and pattern recognition more than through credentials.',
  },
  {
    id: 'naval-creative-technical',
    title: 'Specific Knowledge Is Highly Creative or Technical',
    url: 'https://nav.al/creative-technical',
    sourceType: 'podcast_transcript',
    topics: ['career', 'entrepreneurship', 'wealth'],
    tags: ['career', 'apprenticeship', 'creative', 'technical', 'automation', 'skills', 'mentor', 'team', '职业', '学徒', '创造力', '技术', '自动化', '技能', '导师', '团队'],
    summary: 'The best careers often develop at the creative or technical frontier through apprenticeship and self-directed learning. Valuable specific knowledge is individual, contextual, and hard to automate.',
  },
  {
    id: 'naval-accountability-leverage',
    title: 'Embrace Accountability to Get Leverage',
    url: 'https://nav.al/accountability-leverage',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'career', 'entrepreneurship', 'decision_making'],
    tags: ['accountability', 'risk', 'reputation', 'credibility', 'ownership', 'founder', 'business', 'responsibility', '责任', '担责', '风险', '声誉', '信誉', '所有权', '创始人', '创业'],
    summary: 'Taking visible responsibility for outcomes builds credibility and access to leverage. Acting under your own name is risky, but it can create responsibility, equity, and a track record.',
  },
  {
    id: 'naval-finding-time',
    title: 'Finding Time to Invest in Yourself',
    url: 'https://nav.al/finding-time',
    sourceType: 'podcast_transcript',
    topics: ['career', 'entrepreneurship', 'decision_making'],
    tags: ['career', 'job', 'quit', 'runway', 'time', 'founder', 'experience', 'judgment', 'autonomy', '职业', '工作', '辞职', '生活费', '跑道', '时间', '创业', '经验', '判断力', '自主'],
    summary: 'Judgment develops through experience in positions where consequences are real. A founder mentality can turn ordinary work into preparation for autonomy, while protected time lets a person invest in capabilities that compound.',
  },
  {
    id: 'naval-arena',
    title: 'Life Is Lived in the Arena',
    url: 'https://nav.al/arena',
    sourceType: 'article',
    topics: ['career', 'entrepreneurship', 'decision_making', 'other'],
    tags: ['decision', 'experiment', 'action', 'feedback', 'risk', 'uncertainty', 'quit', 'opportunity', 'choice', '决策', '实验', '行动', '反馈', '风险', '不确定', '辞职', '机会', '选择', '坚持', '放弃', '验证'],
    summary: 'General principles become useful only when tested in context. Acting in the real world creates feedback about which advice applies, what assumptions fail, and what the situation actually demands.',
  },
  {
    id: 'naval-judgment',
    title: 'Judgment Is the Decisive Skill',
    url: 'https://nav.al/judgment',
    sourceType: 'podcast_transcript',
    topics: ['career', 'entrepreneurship', 'decision_making', 'wealth'],
    tags: ['decision', 'judgment', 'long term', 'consequences', 'opportunity', 'experience', 'prestige', 'risk', '决策', '判断', '长期', '后果', '机会', '经验', '名望', '稳定', '风险'],
    summary: 'Judgment is the ability to understand the long-term consequences of actions. It improves through broad learning, real experience, accountability, emotional steadiness, and a demonstrated track record.',
  },
  {
    id: 'naval-renting-time',
    title: "You Won't Get Rich Renting Out Your Time",
    url: 'https://nav.al/renting-time',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'career', 'entrepreneurship'],
    tags: ['salary', 'time', 'income', 'freedom', 'equity', 'ownership', 'invest', 'business', '工资', '时间', '收入', '自由', '股权', '所有权', '投资', '创业', '生意'],
    summary: 'Income tied directly to hours cannot grow nonlinearly. Ownership in productive assets or businesses separates at least part of a person’s earning power from the hours they personally work.',
  },
  {
    id: 'naval-salary-freedom',
    title: 'Live Below Your Means for Freedom',
    url: 'https://nav.al/salary-freedom',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'career', 'entrepreneurship', 'decision_making'],
    tags: ['salary', 'runway', 'savings', 'freedom', 'lifestyle', 'quit', 'risk', 'optionality', '工资', '生活费', '储蓄', '自由', '生活方式', '辞职', '风险', '选择空间'],
    summary: 'Keeping lifestyle costs below income creates freedom of operation. Runway and low fixed obligations can make career and entrepreneurial choices less dependent on fear or immediate cash flow.',
  },
  {
    id: 'naval-happiness',
    title: 'Happiness',
    url: 'https://nav.al/happiness',
    sourceType: 'podcast_transcript',
    topics: ['happiness', 'decision_making', 'other'],
    tags: ['happiness', 'anxiety', 'desire', 'achievement', 'promotion', 'comparison', 'ambition', 'peace', 'success', '幸福', '焦虑', '欲望', '成就', '升职', '比较', '野心', '平静', '成功'],
    summary: 'Desire can make contentment conditional on a future result, while achievements often create new targets rather than permanent fulfillment. A peaceful mind can improve judgment without requiring a person to abandon ambition.',
  },
  {
    id: 'naval-indirect',
    title: 'In Most Difficult Things in Life, the Solution Is Indirect',
    url: 'https://nav.al/indirect',
    sourceType: 'article',
    topics: ['wealth', 'career', 'happiness', 'decision_making', 'other'],
    tags: ['happiness', 'success', 'ambition', 'comparison', 'meaning', 'indirect', 'money', 'purpose', '幸福', '成功', '野心', '比较', '意义', '间接', '金钱', '目标', '追求'],
    summary: 'Many elusive outcomes work better as by-products than direct targets: create value rather than chase money alone, and become absorbed in meaningful activity rather than treating happiness as an achievement to capture.',
  },
];

const stopWords = new Set(['about', 'after', 'again', 'because', 'before', 'could', 'from', 'have', 'into', 'more', 'that', 'their', 'them', 'there', 'these', 'they', 'this', 'want', 'what', 'when', 'where', 'which', 'while', 'with', 'would', 'your']);
const cjkStopTokens = new Set(['一个', '这个', '那个', '我们', '你们', '他们', '自己', '应该', '如何', '怎么', '是否', '还是', '现在', '一直', '已经', '因为', '但是', '而且', '需要', '可以', '可能', '问题', '事情', '觉得', '想要', '什么', '以及', '如果']);

export function retrieveSources(question: string, topic: Topic | null, limit = 6): ApprovedSource[] {
  const haystack = normalize(question);
  const tokens = searchTokens(haystack);
  const scored = approvedSources.map((source, index) => {
    let score = topic && source.topics.includes(topic) ? 8 : 0;
    for (const tag of source.tags) {
      const normalizedTag = normalize(tag);
      if (normalizedTag && haystack.includes(normalizedTag)) score += normalizedTag.includes(' ') ? 7 : 5;
    }
    const searchable = normalize(`${source.title} ${source.summary} ${source.tags.join(' ')}`);
    for (const token of tokens) if (searchable.includes(token)) score += 1;
    return { source, score, index };
  });

  return scored
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, Math.max(5, Math.min(limit, 10)))
    .map(({ source }) => source);
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim();
}

function searchTokens(value: string): Set<string> {
  const tokens = new Set(value.split(/\s+/).filter((token) => token.length > 3 && !stopWords.has(token)));
  const cjkRuns = value.match(/[\p{Script=Han}]{2,}/gu) ?? [];
  for (const run of cjkRuns) {
    for (const size of [2, 3]) {
      for (let index = 0; index <= run.length - size; index += 1) {
        const token = run.slice(index, index + size);
        if (!cjkStopTokens.has(token)) tokens.add(token);
      }
    }
  }
  return tokens;
}
