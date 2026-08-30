const api = require('../../utils/api');
const { createRequestId } = require('../../utils/visitor');
const { SHARE_IMAGE_PATH } = require('../../config');

const MAX_QUESTION_LENGTH = 3000;
const topics = [
  { id: 'wealth', label: '财富自由' },
  { id: 'career', label: '职业选择' },
  { id: 'entrepreneurship', label: '创业产品' },
  { id: 'decision_making', label: '判断决策' },
  { id: 'happiness', label: '幸福内心' },
  { id: 'other', label: '其他' }
];

const examples = [
  {
    topic: 'entrepreneurship',
    label: '副业要不要继续',
    question: '我做一个副业产品已经 8 个月，只有 40 个用户且没有收入。工作稳定，但占用大部分精力。我应该继续兼职验证，还是辞职全职投入？'
  },
  {
    topic: 'happiness',
    label: '为什么越成功越焦虑',
    question: '我刚刚升职，收入也提高了，但我反而更焦虑，总觉得下一个目标还在后退。我该怎么判断自己真正想要的生活？'
  },
  {
    topic: 'career',
    label: '热门技能还是独特优势',
    question: '我可以花半年学习一个市场正热门的技能，也可以继续深挖自己已有但比较小众的优势。应该如何比较这两条路的长期价值？'
  }
];

Page({
  data: {
    question: '',
    topic: '',
    topics,
    examples,
    charCount: 0,
    maxQuestionLength: MAX_QUESTION_LENGTH,
    freeRemaining: 3,
    loadingQuota: true,
    loading: false,
    error: '',
    quotaExhausted: false,
    privacyAccepted: false
  },

  onLoad(options) {
    const question = options && options.q ? decodeURIComponent(options.q) : '';
    if (question) {
      this.setData({
        question: question.slice(0, MAX_QUESTION_LENGTH),
        charCount: Math.min(question.length, MAX_QUESTION_LENGTH)
      });
    }
    this.setData({ privacyAccepted: wx.getStorageSync('ask_naval_privacy_ack_v1') === true });
    api.track('landing_viewed', { locale: 'zh', platform: 'miniprogram' });
  },

  onShow() {
    this.refreshEntitlements();
  },

  async refreshEntitlements() {
    try {
      const entitlement = await api.getEntitlements();
      const remaining = Number(entitlement.freeRemaining || 0);
      this.setData({
        freeRemaining: remaining,
        quotaExhausted: remaining <= 0,
        loadingQuota: false
      });
    } catch {
      this.setData({ loadingQuota: false });
    }
  },

  handleInput(event) {
    const question = event.detail.value || '';
    this.setData({ question, charCount: question.length, error: '' });
    this.requestId = '';
  },

  selectTopic(event) {
    const selected = event.currentTarget.dataset.id;
    this.setData({ topic: this.data.topic === selected ? '' : selected, error: '' });
    this.requestId = '';
  },

  useExample(event) {
    const example = this.data.examples[Number(event.currentTarget.dataset.index)];
    if (!example) return;
    this.setData({
      question: example.question,
      charCount: example.question.length,
      topic: example.topic,
      error: ''
    });
    this.requestId = '';
    api.track('example_selected', { locale: 'zh', platform: 'miniprogram', topic: example.topic });
    wx.pageScrollTo({ selector: '#question-card', duration: 250 });
  },

  validateQuestion() {
    const question = this.data.question.trim();
    if (question.length < 8) return '请至少写 8 个字符，并补充你的真实处境。';
    if (question.length > MAX_QUESTION_LENGTH) return '问题最多 3000 个字符。';
    const meaningful = question.match(/[\u4e00-\u9fffA-Za-z0-9]/g) || [];
    if (meaningful.length < 6 || new Set(meaningful.map((item) => item.toLowerCase())).size < 5) {
      return '请把问题写得更具体一些，说明你正在权衡什么。';
    }
    if (!this.data.topic) return '请选择一个最接近的主题。';
    return '';
  },

  async submitQuestion() {
    if (this.data.loading) return;
    const validationError = this.validateQuestion();
    if (validationError) {
      this.setData({ error: validationError });
      wx.pageScrollTo({ selector: '#question-card', duration: 200 });
      return;
    }
    if (!this.data.privacyAccepted) {
      this.setData({ error: '请先阅读并同意隐私说明，再开始分析。' });
      return;
    }
    if (this.data.quotaExhausted) {
      this.setData({ error: '本周 3 次免费分析已用完，请下周再来。' });
      return;
    }

    this.setData({ loading: true, error: '' });
    api.track('analysis_submitted', {
      locale: 'zh',
      platform: 'miniprogram',
      topic: this.data.topic
    });

    try {
      this.requestId = this.requestId || createRequestId();
      const response = await api.analyzeQuestion(this.data.question.trim(), this.data.topic, this.requestId);
      this.setData({ freeRemaining: response.freeRemaining, loading: false });
      api.track('analysis_completed', {
        locale: 'zh',
        platform: 'miniprogram',
        topic: this.data.topic,
        analysis_id: response.analysisId
      });
      wx.navigateTo({ url: `/pages/result/result?id=${response.analysisId}` });
    } catch (error) {
      const state = requestErrorState(error);
      this.setData({
        loading: false,
        error: state.message,
        quotaExhausted: state.quotaExhausted,
        freeRemaining: state.quotaExhausted ? 0 : this.data.freeRemaining
      });
      api.track('analysis_failed', {
        locale: 'zh',
        platform: 'miniprogram',
        topic: this.data.topic,
        status: Number(error && error.status) || 0
      });
      if (Number(error && error.status) !== 0 && Number(error && error.status) !== 409) this.requestId = '';
    }
  },

  openAbout() {
    wx.navigateTo({ url: '/pages/about/about' });
  },

  togglePrivacy() {
    const accepted = !this.data.privacyAccepted;
    wx.setStorageSync('ask_naval_privacy_ack_v1', accepted);
    this.setData({ privacyAccepted: accepted, error: '' });
  },

  onShareAppMessage() {
    return {
      title: '把难做的决定，看清楚，再行动｜Ask Naval Lens',
      path: '/pages/index/index',
      imageUrl: SHARE_IMAGE_PATH
    };
  }
});

function requestErrorState(error) {
  const status = Number(error && error.status) || 0;
  if (status === 401) return { quotaExhausted: false, message: '登录状态已过期，请再提交一次。' };
  if (status === 402) return { quotaExhausted: true, message: '本周 3 次免费分析已用完，请下周再来。' };
  if (status === 409) return { quotaExhausted: false, message: '这份分析仍在生成，请稍等片刻后再试。不会重复扣除次数。' };
  if (status === 429) return { quotaExhausted: false, message: '请求有点频繁，请几分钟后再试。' };
  if (status === 503) return { quotaExhausted: false, message: (error && error.message) || '分析服务暂时繁忙，你的次数不会被扣除，请稍后重试。' };
  if (status === 400) return { quotaExhausted: false, message: (error && error.message) || '请检查问题内容后再试。' };
  return { quotaExhausted: false, message: '网络连接失败，请检查网络后重试。你的问题仍保留在页面中。' };
}
