export type Topic = 'wealth' | 'entrepreneurship' | 'life' | 'happiness' | 'decision_making' | 'other';

export type ApprovedSource = {
  id: string;
  title: string;
  url: string;
  sourceType: 'article' | 'podcast_transcript';
  topics: Topic[];
  summary: string;
};

export const approvedSources: ApprovedSource[] = [
  {
    id: 'naval-rich',
    title: 'How to Get Rich',
    url: 'https://nav.al/rich',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'entrepreneurship', 'life'],
    summary: 'Wealth is productive assets rather than status; specific knowledge, accountability, leverage, and judgment compound when applied over a long horizon.',
  },
  {
    id: 'naval-specific-knowledge',
    title: 'Arm Yourself With Specific Knowledge',
    url: 'https://nav.al/specific-knowledge',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'entrepreneurship', 'decision_making'],
    summary: 'Specific knowledge grows from genuine curiosity and work that is difficult to train or standardize; it is discovered through practice more than credentials.',
  },
  {
    id: 'naval-accountability-leverage',
    title: 'Embrace Accountability to Get Leverage',
    url: 'https://nav.al/accountability-leverage',
    sourceType: 'podcast_transcript',
    topics: ['wealth', 'entrepreneurship', 'decision_making'],
    summary: 'Taking visible responsibility builds credibility and access to leverage; code and media can scale output without requiring proportional permission or labor.',
  },
  {
    id: 'naval-finding-time',
    title: 'Finding Time to Invest in Yourself',
    url: 'https://nav.al/finding-time',
    sourceType: 'podcast_transcript',
    topics: ['entrepreneurship', 'life', 'decision_making'],
    summary: 'Judgment develops through experience in positions where consequences are real; adopting a founder mentality can turn ordinary work into preparation for future autonomy.',
  },
  {
    id: 'naval-happiness',
    title: 'Happiness',
    url: 'https://nav.al/happiness',
    sourceType: 'podcast_transcript',
    topics: ['happiness', 'life', 'decision_making'],
    summary: 'Stress often comes from wanting incompatible things at once. Understanding desire, attention, and what is outside one’s control can create room for peace and clearer choices.',
  },
  {
    id: 'naval-arena',
    title: 'Life is Lived in The Arena',
    url: 'https://nav.al/arena',
    sourceType: 'article',
    topics: ['entrepreneurship', 'life', 'decision_making'],
    summary: 'General principles become useful only when tested in context. Doing creates the feedback needed to learn which advice applies and where it breaks down.',
  },
  {
    id: 'naval-indirect',
    title: 'In Most Difficult Things in Life, The Solution is Indirect',
    url: 'https://nav.al/indirect',
    sourceType: 'article',
    topics: ['wealth', 'happiness', 'life', 'decision_making'],
    summary: 'Many elusive outcomes are better treated as by-products: create value rather than chase money directly, and engage deeply rather than pursue happiness as a target.',
  },
];

export function sourcesForTopic(topic: Topic): ApprovedSource[] {
  if (topic === 'other') return approvedSources.slice(0, 4);
  return approvedSources.filter((source) => source.topics.includes(topic)).slice(0, 4);
}
