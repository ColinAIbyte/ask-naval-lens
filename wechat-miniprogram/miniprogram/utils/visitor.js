const STORAGE_KEY = 'ask_naval_visitor_v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function createUuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === 'x' ? random : ((random & 0x3) | 0x8);
    return value.toString(16);
  });
}

function getVisitorId() {
  const stored = wx.getStorageSync(STORAGE_KEY);
  if (typeof stored === 'string' && UUID_PATTERN.test(stored)) return stored;

  const visitorId = createUuid();
  wx.setStorageSync(STORAGE_KEY, visitorId);
  return visitorId;
}

module.exports = { getVisitorId, createRequestId: createUuid };
