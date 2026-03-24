import { clearToken } from "../../utils/UserState";

Page({
  data: {
    // 
  },

  onTapLogout() {
    wx.showModal({
      title: '确认退出',
      content: '退出登录后，部分功能将无法使用，确定要退出吗？',
      confirmText: '退出',
      confirmColor: '#DC2626',
      success: (res) => {
        if (res.confirm) {
          clearToken();
          wx.showToast({ title: "已退出登录", icon: "none" });
          wx.reLaunch({ url: "/pages/index/index" });
        }
      }
    });
  }
});