type MenuItem = {
  id: string;
  iconText: string;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: number | null;
};

type WeekDayItem = {
  day: string;
  done: boolean;
  isToday: boolean;
};

import {
  clearToken,
  dismissLoginPrompt,
  getAuthState,
  getProfileState,
  isLoginPromptDismissed,
  saveProfile,
  type GoalType,
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

const menuItems: MenuItem[] = [
  {
    id: "body",
    iconText: "体",
    iconColor: PROFILE_COLORS.primary,
    iconBg: PROFILE_COLORS.primaryBg,
    title: "体测档案",
    subtitle: "身高体重目标等基础数据",
    badge: null,
  },
  {
    id: "squad",
    iconText: "队",
    iconColor: PROFILE_COLORS.success,
    iconBg: PROFILE_COLORS.successBg,
    title: "训练小队",
    subtitle: "精英燃脂队 · 5 人",
    badge: 2,
  },
  {
    id: "couple",
    iconText: "❤",
    iconColor: PROFILE_COLORS.danger,
    iconBg: PROFILE_COLORS.dangerBg,
    title: "情侣模式",
    subtitle: "已绑定 · 连续 28 天",
    badge: null,
  },
  {
    id: "notify",
    iconText: "铃",
    iconColor: PROFILE_COLORS.text2,
    iconBg: PROFILE_COLORS.bg2,
    title: "通知设置",
    subtitle: "打卡提醒、好友动态",
    badge: null,
  },
  {
    id: "privacy",
    iconText: "锁",
    iconColor: PROFILE_COLORS.text2,
    iconBg: PROFILE_COLORS.bg2,
    title: "隐私设置",
    subtitle: "数据可见性管理",
    badge: null,
  },
  {
    id: "about",
    iconText: "i",
    iconColor: PROFILE_COLORS.text2,
    iconBg: PROFILE_COLORS.bg2,
    title: "关于 / 反馈",
    subtitle: "版本 1.2.0 · 意见反馈",
    badge: null,
  },
];

function buildProfileWeekDays(): WeekDayItem[] {
  const days = ["一", "二", "三", "四", "五", "六", "日"];
  return days.map((day, i) => {
    const isToday = i === 6;
    const done = i < 5 || isToday;
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

function goalLabel(goal?: GoalType) {
  if (goal === "cut") return "减脂";
  if (goal === "bulk") return "增肌";
  if (goal === "maintain") return "维持";
  return "";
}

function goalFromIndex(index: number): GoalType {
  if (index === 1) return "bulk";
  if (index === 2) return "maintain";
  return "cut";
}

function goalIndex(goal?: GoalType) {
  if (goal === "bulk") return 1;
  if (goal === "maintain") return 2;
  return 0;
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
    showProfileForm: false,

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

    weekDays: buildProfileWeekDays(),
    menuItems,

    form: {
      heightCm: "",
      weightKg: "",
      targetWeightKg: "",
      goalIndex: 0,
    },
    goalOptions: ["减脂", "增肌", "维持"],
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
        trainingDays: 0,
        avatarUrl:
          profile?.avatarUrl ||
          "https://images.unsplash.com/photo-1575992877113-6a7dda2d1592?w=200&h=200&fit=crop",
      },
      stats: {
        bmi,
        weekCheckins: 0,
      },
      progressStats: buildProgressStats(profile),
      form: {
        heightCm: profile?.heightCm || "",
        weightKg: profile?.weightKg || "",
        targetWeightKg: profile?.targetWeightKg || "",
        goalIndex: goalIndex(profile?.goal),
      },
    });
  },

  openProfileForm() {
    this.setData({ showProfileForm: true });
  },

  onTapLogin() {
    wx.showToast({ title: "登录流程待接入", icon: "none" });
  },

  onTapSkipLogin() {
    dismissLoginPrompt();
    this.setData({ showLoginPrompt: false });
  },

  onTapStartProfile() {
    this.openProfileForm();
  },

  onCloseProfileForm() {
    this.setData({ showProfileForm: false });
  },

  onFormInput(event: any) {
    const field = String(event.currentTarget.dataset.field || "");
    const value = String(event.detail.value || "");
    if (field !== "heightCm" && field !== "weightKg" && field !== "targetWeightKg") return;
    this.setData({ [`form.${field}`]: value });
  },

  onGoalChange(event: any) {
    const index = Number(event.detail.value);
    if (Number.isNaN(index) || index < 0) return;
    this.setData({ "form.goalIndex": index });
  },

  onTapSaveProfile() {
    const form = this.data.form as { heightCm: string; weightKg: string; targetWeightKg: string; goalIndex: number };
    const heightCm = String(form.heightCm || "").trim();
    const weightKg = String(form.weightKg || "").trim();
    const targetWeightKg = String(form.targetWeightKg || "").trim();
    const goal = goalFromIndex(Number(form.goalIndex));

    if (!heightCm || !weightKg || !targetWeightKg) {
      wx.showToast({ title: "请填写身高/体重/目标体重", icon: "none" });
      return;
    }

    saveProfile({ heightCm, weightKg, targetWeightKg, goal }, this.data.auth.isLoggedIn);
    this.setData({ showProfileForm: false });
    this.syncUserState();

    wx.showToast({ title: `已保存（${goalLabel(goal)}）`, icon: "none" });
  },

  onTapMenuItem(event: any) {
    const id = String(event.currentTarget.dataset.id || "");
    if (!id) return;

    if ((id === "squad" || id === "couple") && !this.data.auth.isLoggedIn) {
      wx.showModal({
        title: "建议登录",
        content: "登录后可同步数据，并解锁训练小队/情侣模式等功能。",
        confirmText: "去登录",
        cancelText: "先逛逛",
        success: (res) => {
          if (res.confirm) {
            this.onTapLogin();
            return;
          }
          this.onTapSkipLogin();
        },
      });
      return;
    }

    if (id === "body") {
      this.openProfileForm();
      return;
    }

    const titleMap: Record<string, string> = {
      body: "体测档案",
      squad: "训练小队",
      couple: "情侣模式",
      notify: "通知设置",
      privacy: "隐私设置",
      about: "关于 / 反馈",
    };

    wx.showToast({ title: titleMap[id] ? `${titleMap[id]}：敬请期待` : "敬请期待", icon: "none" });
  },

  onTapLogout() {
    clearToken();
    this.syncUserState();
    wx.showToast({ title: "已退出登录", icon: "none" });
  },

  noop() {},
});
