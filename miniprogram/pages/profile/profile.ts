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

Page({
  data: {
    colors: PROFILE_COLORS,

    user: {
      name: "张小明",
      trainingDays: 42,
      avatarUrl:
        "https://images.unsplash.com/photo-1575992877113-6a7dda2d1592?w=200&h=200&fit=crop",
    },

    stats: {
      bmi: "22.3",
      weekCheckins: 5,
    },

    progressStats: [
      { label: "当前体重", value: "71.0 kg", color: PROFILE_COLORS.text },
      { label: "目标体重", value: "68.0 kg", color: PROFILE_COLORS.primary },
      { label: "已减", value: "3.2 kg", color: PROFILE_COLORS.success },
      { label: "还差", value: "3.0 kg", color: PROFILE_COLORS.warning },
    ],

    weekDays: buildProfileWeekDays(),
    menuItems,
  },

  onTapMenuItem(event: any) {
    const id = String(event.currentTarget.dataset.id || "");
    if (!id) return;

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
    wx.showToast({ title: "已退出（示例）", icon: "none" });
  },
});
