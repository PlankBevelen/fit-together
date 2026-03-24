import { request } from '../../utils/request';
import { setToken, saveProfile } from '../../utils/UserState';

Page({
  handleWxLogin() {
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: async (res) => {
        if (res.code) {
          try {
            const response = await request({
              url: '/auth/code2session',
              method: 'POST',
              data: { code: res.code },
              skipAuth: true,
            });

            if (response.status === 'success') {
              setToken(response.token);
              // Save basic user data to profile if any returned
              if (response.data?.user) {
                saveProfile(response.data.user, true);
              }

              wx.showToast({ title: '登录成功', icon: 'success' });
              
              setTimeout(() => {
                const pages = getCurrentPages();
                if (pages.length > 1) {
                  wx.navigateBack();
                } else {
                  wx.switchTab({ url: '/pages/profile/profile' });
                }
              }, 1000);
            } else {
              wx.showToast({ title: '登录失败', icon: 'none' });
            }
          } catch (error) {
            console.error('Login request failed', error);
            wx.showToast({ title: '登录失败，请重试', icon: 'none' });
          } finally {
            wx.hideLoading();
          }
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取授权失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '调用微信登录失败', icon: 'none' });
      },
    });
  },

  handleCancel() {
    wx.navigateBack({
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      }
    });
  }
});
