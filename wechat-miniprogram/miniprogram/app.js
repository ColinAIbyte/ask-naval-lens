const { getVisitorId } = require('./utils/visitor');

App({
  onLaunch() {
    getVisitorId();
  }
});
