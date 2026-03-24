// app.ts
import { doSilentLogin } from './utils/request';
import { getAuthState } from './utils/UserState';

App<IAppOption>({
  globalData: {},
  onLaunch() {
    // 展示本地存储能力
    const logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 如果未登录，尝试静默登录以恢复登录态
    const auth = getAuthState();
    if (!auth.isLoggedIn) {
      doSilentLogin().then(() => {
        // 静默登录成功后，如果当前页面有 onShow 方法，可能需要重新触发一下数据同步
        // 但通常通过 request.ts 中的自动拦截已经能解决大部分问题
        const pages = getCurrentPages();
        if (pages.length > 0) {
          const currentPage = pages[pages.length - 1];
          if (currentPage && typeof currentPage.onShow === 'function') {
            currentPage.onShow();
          }
        }
      }).catch(err => {
        console.error('静默登录失败', err);
      });
    }
  },
})