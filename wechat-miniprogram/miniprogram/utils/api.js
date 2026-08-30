const { API_BASE_URL, USE_WECHAT_SESSION } = require('../config');
const { getVisitorId } = require('./visitor');
const { getAccessToken, clearSession } = require('./session');

async function request(path, options) {
  const config = options || {};
  const accessToken = config.skipSession || !USE_WECHAT_SESSION ? '' : await getAccessToken();
  return new Promise((resolve, reject) => {
    const header = Object.assign({
      'content-type': 'application/json',
      'x-asknaval-visitor': getVisitorId()
    }, config.header || {});
    if (USE_WECHAT_SESSION) header['x-asknaval-client'] = 'miniprogram';
    if (accessToken) header.authorization = `Bearer ${accessToken}`;
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method: config.method || 'GET',
      data: config.data,
      timeout: config.timeout || 45000,
      header,
      success(response) {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(response.data);
          return;
        }
        if (response.statusCode === 401 && accessToken) clearSession();
        reject({
          status: response.statusCode,
          data: response.data,
          message: response.data && response.data.error
        });
      },
      fail(error) {
        reject({ status: 0, data: null, message: error.errMsg || 'network_error' });
      }
    });
  });
}

function getEntitlements() {
  return request('/api/entitlements');
}

function analyzeQuestion(question, topic, requestId) {
  return request('/api/analyze', {
    method: 'POST',
    header: { 'idempotency-key': requestId },
    data: { question, topic: topic || null, locale: 'zh' },
    timeout: 80000
  });
}

function getAnalysis(analysisId) {
  return request(`/api/analyses/${encodeURIComponent(analysisId)}`);
}

function submitFeedback(analysisId, rating) {
  return request('/api/feedback', {
    method: 'POST',
    data: { analysisId, rating }
  });
}

function track(event, properties) {
  request('/api/events', {
    method: 'POST',
    data: { event, properties: properties || {} },
    timeout: 10000
  }).catch(() => undefined);
}

module.exports = {
  getEntitlements,
  analyzeQuestion,
  getAnalysis,
  submitFeedback,
  track
};
