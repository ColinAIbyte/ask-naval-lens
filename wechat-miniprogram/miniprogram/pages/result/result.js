const api = require('../../utils/api');
const { SHARE_IMAGE_PATH } = require('../../config');

const topicLabels = {
  wealth: '财富自由',
  career: '职业选择',
  entrepreneurship: '创业产品',
  decision_making: '判断决策',
  happiness: '幸福内心',
  other: '其他',
  unspecified: '未指定'
};

Page({
  data: {
    analysisId: '',
    question: '',
    topicLabel: '',
    analysis: null,
    loading: true,
    error: '',
    feedback: '',
    canFeedback: false,
    sharingEnabled: false
  },

  onLoad(options) {
    const analysisId = options && options.id ? options.id : '';
    this.setData({ analysisId });
    wx.hideShareMenu({ menus: ['shareAppMessage', 'shareTimeline'] });
    this.loadAnalysis();
  },

  async loadAnalysis() {
    const analysisId = this.data.analysisId;
    if (!/^[0-9a-f-]{36}$/i.test(analysisId)) {
      this.setData({ loading: false, error: '这份分析地址无效或不完整。' });
      return;
    }

    this.setData({ loading: true, error: '' });
    try {
      const response = await api.getAnalysis(analysisId);
      this.showAnalysis(response);
    } catch (error) {
      this.setData({
        loading: false,
        error: Number(error && error.status) === 404
          ? '没有找到这份分析。它可能已被删除，或分享地址不完整。'
          : '暂时无法载入这份分析，请检查网络后重试。'
      });
    }
  },

  showAnalysis(record) {
    this.setData({
      question: record.question || '',
      topicLabel: topicLabels[record.topic] || topicLabels.unspecified,
      analysis: record.analysis,
      canFeedback: record.canFeedback === true,
      loading: false,
      error: ''
    });
    api.track('analysis_viewed', {
      locale: 'zh',
      platform: 'miniprogram',
      topic: record.topic || 'unspecified',
      analysis_id: this.data.analysisId
    });
  },

  retryLoad() {
    this.loadAnalysis();
  },

  askAnother() {
    wx.reLaunch({ url: '/pages/index/index' });
  },

  chooseFollowUp(event) {
    const question = event.currentTarget.dataset.question || '';
    api.track('followup_selected', {
      locale: 'zh',
      platform: 'miniprogram',
      analysis_id: this.data.analysisId
    });
    wx.reLaunch({ url: `/pages/index/index?q=${encodeURIComponent(question)}` });
  },

  copySource(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;
    wx.setClipboardData({
      data: url,
      success: () => {
        api.track('source_clicked', {
          locale: 'zh',
          platform: 'miniprogram',
          analysis_id: this.data.analysisId
        });
        wx.showToast({ title: '原文链接已复制', icon: 'success' });
      }
    });
  },

  submitFeedback(event) {
    const rating = event.currentTarget.dataset.rating;
    if (rating !== 'helpful' && rating !== 'not_helpful') return;
    this.setData({ feedback: rating });
    api.submitFeedback(this.data.analysisId, rating)
      .then(() => {
        api.track('feedback_submitted', {
          locale: 'zh',
          platform: 'miniprogram',
          analysis_id: this.data.analysisId,
          rating
        });
      })
      .catch(() => {
        this.setData({ feedback: '' });
        wx.showToast({ title: '反馈暂未提交成功', icon: 'none' });
      });
  },

  confirmSharing() {
    wx.showModal({
      title: '分享前请确认',
      content: '分享后，对方可以看到你的原问题与完整分析。不要分享包含隐私或敏感信息的内容。',
      confirmText: '我已了解',
      success: (result) => {
        if (!result.confirm) return;
        this.setData({ sharingEnabled: true });
      }
    });
  },

  onShareAppMessage() {
    api.track('share_started', {
      locale: 'zh',
      platform: 'miniprogram',
      analysis_id: this.data.analysisId
    });
    return {
      title: '一份 Ask Naval Lens 思考分析',
      path: `/pages/result/result?id=${this.data.analysisId}`,
      imageUrl: SHARE_IMAGE_PATH
    };
  }
});
