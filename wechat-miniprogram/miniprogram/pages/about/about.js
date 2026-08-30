const { CONTACT_EMAIL, WEBSITE_URL } = require('../../config');

Page({
  data: {
    contactEmail: CONTACT_EMAIL,
    websiteUrl: WEBSITE_URL
  },

  copyEmail() {
    wx.setClipboardData({ data: this.data.contactEmail });
  },

  copyWebsite() {
    wx.setClipboardData({ data: this.data.websiteUrl });
  }
});
