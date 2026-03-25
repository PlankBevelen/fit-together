import {
  dismissLoginPrompt,
  getAuthState,
  getProfileState,
  isLoginPromptDismissed,
} from "../../utils/UserState";

const PROFILE_COLORS = {
  primary: "#3730A3",
  secondary: "#6366F1",
  primaryBg: "#EEF2FF",
  success: "#059669",
  successBg: "#ECFDF5",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  danger: "#DC2626",
  dangerBg: "#FEF2F2",
  bg2: "#F8F9FA",
  bg3: "#F1F3F5",
  divider: "#E5E7EB",
  text: "#111827",
  text2: "#6B7280",
  text3: "#9CA3AF",
};

function formatNumber(value: number, digits = 1) {
  if (!Number.isFinite(value)) return "--";
  return value.toFixed(digits);
}

function computeBMI(heightCm?: string, weightKg?: string) {
  const h = Number(heightCm);
  const w = Number(weightKg);
  if (!Number.isFinite(h) || !Number.isFinite(w) || h <= 0 || w <= 0) return undefined;
  const meters = h / 100;
  return w / (meters * meters);
}

Page({
  data: {
    colors: PROFILE_COLORS,

    auth: {
      isLoggedIn: false,
    },
    profileComplete: false,
    showLoginPrompt: false,

    user: {
      name: "游客",
      trainingDays: 0,
      avatarUrl:
        "/static/image/user-avatar.png",
    },

    stats: {
      bmi: "--",
      weekCheckins: 0,
    },

    showLoginSheet: false,
  },

  onLoad() {
    this.syncUserState();
  },

  onShow() {
    this.syncUserState();
  },

  syncUserState() {
    const auth = getAuthState();
    const { profile, isComplete } = getProfileState(auth.isLoggedIn);
    const bmiValue = computeBMI(profile?.heightCm, profile?.weightKg);
    const bmi = typeof bmiValue === "number" ? formatNumber(bmiValue, 1) : "--";

    const showLoginPrompt = !auth.isLoggedIn && !isLoginPromptDismissed();

    this.setData({
      auth,
      profileComplete: isComplete,
      showLoginPrompt,
      user: {
        name: profile?.name || (auth.isLoggedIn ? "已登录用户" : "游客"),
        trainingDays: auth.isLoggedIn ? 28 : 0,
        avatarUrl:
          profile?.avatarUrl ||
          "/static/image/user-avatar.png",
      },
      stats: {
        bmi,
        weekCheckins: auth.isLoggedIn ? 6 : 0,
      },
    });
  },


  onTapLogin() {
    this.setData({ showLoginSheet: false });
    wx.navigateTo({ url: "/pages/login/login" });
  },

  onTapRegister() {
    this.setData({ showLoginSheet: false });
    wx.navigateTo({ url: "/pages/login/login" });
  },

  onTapUserHeader() {
    if (this.data.auth.isLoggedIn) {
      wx.navigateTo({ url: "/pages/profile-edit/profile-edit" });
    } else {
      wx.navigateTo({ url: "/pages/login/login" });
    }
  },

  onTapSkipLogin() {
    dismissLoginPrompt();
    this.setData({ showLoginPrompt: false });
  },

  onRecallLoginPrompt() {
    this.setData({ showLoginPrompt: true });
  },

  onCloseLoginSheet() {
    this.setData({ showLoginSheet: false });
  },

  onTapStartProfile() {
    wx.navigateTo({ url: "/pages/profile-edit/profile-edit" });
  },

  onTapProfile() {
    wx.navigateTo({ url: "/pages/profile-edit/profile-edit" });
  },

  onTapCouple() {
    if (!this.data.auth.isLoggedIn) {
      this.setData({ showLoginSheet: true });
      return;
    }
    wx.showToast({ title: "情侣模式：敬请期待", icon: "none" });
  },

  onTapSquad() {
    if (!this.data.auth.isLoggedIn) {
      this.setData({ showLoginSheet: true });
      return;
    }
    wx.showToast({ title: "训练小队：敬请期待", icon: "none" });
  },

  onTapFeedback() {
    wx.showToast({ title: "意见反馈：敬请期待", icon: "none" });
  },

  onTapSettings() {
    wx.navigateTo({ url: "/pages/settings/index" });
  },

  noop() {},
});
