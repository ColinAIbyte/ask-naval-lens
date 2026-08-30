const { API_BASE_URL } = require('../config');

const STORAGE_KEY = 'ask_naval_mini_session_v1';
let sessionPromise = null;
let unavailableUntil = 0;

function getStoredToken() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (!stored || typeof stored.accessToken !== 'string' || typeof stored.expiresAt !== 'string') return '';
  if (Date.parse(stored.expiresAt) <= Date.now() + 60 * 1000) {
    wx.removeStorageSync(STORAGE_KEY);
    return '';
  }
  return stored.accessToken;
}

function getAccessToken() {
  const storedToken = getStoredToken();
  if (storedToken) return Promise.resolve(storedToken);
  if (Date.now() < unavailableUntil) return Promise.resolve('');
  if (sessionPromise) return sessionPromise;

  sessionPromise = login()
    .catch(() => {
      unavailableUntil = Date.now() + 5 * 60 * 1000;
      return '';
    })
    .then((accessToken) => {
      sessionPromise = null;
      return accessToken;
    });
  return sessionPromise;
}

function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      timeout: 10000,
      success(loginResult) {
        if (!loginResult.code) {
          reject(new Error('wx_login_no_code'));
          return;
        }
        wx.request({
          url: `${API_BASE_URL}/api/mini/session`,
          method: 'POST',
          timeout: 15000,
          header: { 'content-type': 'application/json' },
          data: { code: loginResult.code },
          success(response) {
            if (response.statusCode < 200 || response.statusCode >= 300 || !response.data.accessToken) {
              reject(new Error('mini_session_unavailable'));
              return;
            }
            wx.setStorageSync(STORAGE_KEY, response.data);
            resolve(response.data.accessToken);
          },
          fail: reject
        });
      },
      fail: reject
    });
  });
}

function clearSession() {
  wx.removeStorageSync(STORAGE_KEY);
}

module.exports = { getAccessToken, clearSession };
