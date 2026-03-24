type WeekDayItem = {
  day: string;
  done: boolean;
  isToday: boolean;
};

import {
  dismissLoginPrompt,
  getAuthState,
  getProfileState,
  isLoginPromptDismissed,
  type ProfileDraft,
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

function buildProfileWeekDays(isLoggedIn: boolean): WeekDayItem[] {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  return days.map((day, i) => {
    const isToday = i === 6;
    const done = isLoggedIn ? (i < 5 || isToday) : false;
    return { day, done, isToday };
  });
}

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

function buildProgressStats(profile?: ProfileDraft) {
  const currentWeight = profile?.weightKg ? `${profile.weightKg} kg` : "--";
  const targetWeight = profile?.targetWeightKg ? `${profile.targetWeightKg} kg` : "--";

  const current = Number(profile?.weightKg);
  const target = Number(profile?.targetWeightKg);
  const delta = Number.isFinite(current) && Number.isFinite(target) ? current - target : undefined;

  const lost = typeof delta === "number" ? `${formatNumber(Math.max(0, delta), 1)} kg` : "--";
  const left = typeof delta === "number" ? `${formatNumber(Math.max(0, -delta), 1)} kg` : "--";

  return [
    { label: "当前体重", value: currentWeight, color: PROFILE_COLORS.text },
    { label: "目标体重", value: targetWeight, color: PROFILE_COLORS.primary },
    { label: "已减", value: lost, color: PROFILE_COLORS.success },
    { label: "还差", value: left, color: PROFILE_COLORS.warning },
  ];
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
        "https://images.unsplash.com/photo-1575992877113-6a7dda2d1592?w=200&h=200&fit=crop",
    },

    stats: {
      bmi: "--",
      weekCheckins: 0,
    },

    progressStats: buildProgressStats(),

    weekDays: buildProfileWeekDays(false),
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
          "https://images.unsplash.com/photo-1575992877113-6a7dda2d1592?w=200&h=200&fit=crop",
      },
      stats: {
        bmi,
        weekCheckins: auth.isLoggedIn ? 6 : 0,
      },
      progressStats: buildProgressStats(profile),
      weekDays: buildProfileWeekDays(auth.isLoggedIn),
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
