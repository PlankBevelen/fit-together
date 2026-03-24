import Formatter from "../../utils/Formatter"
import { getAuthState } from "../../utils/UserState"

Page({
  data: {
    auth: { isLoggedIn: false },
    today: Formatter.getTodayDate() + " " + Formatter.getTodayDayOfWeek(),
    planLabel: '未设置',
    planValue: '--',

    ringSize: 160,
    ringStrokeWidth: 12,
    consumedKcal: 0,
    targetKcal: 0,
    burnedKcal: 0,
    remainingKcal: 0,
    completionPercent: 0,

    macros: [
      { key: 'protein', name: '蛋白质', current: 0, target: 0, unit: 'g', color: '#22C55E', percent: 0 },
      { key: 'carb', name: '碳水', current: 0, target: 0, unit: 'g', color: '#4F46E5', percent: 0 },
      { key: 'fat', name: '脂肪', current: 0, target: 0, unit: 'g', color: '#F97316', percent: 0 }
    ],

    mealPlanTitle: '今日餐次方案',
    mealPlanStatus: '未设置',
    mealPlanMeals: '暂无方案',

    quickActions: [
      { key: 'checkin', title: '立即打卡' },
      { key: 'ai', title: 'AI 建议' },
      { key: 'friends', title: '好友动态' }
    ],

    activityTitle: '好友动态',
    activityMore: '全部',
    activities: [] as any[]
  },

  onReady() {
    this.syncDerivedData();
  },

  onShow() {
    const auth = getAuthState();
    
    // 如果未登录，使用初始空数据；如果已登录，为了演示可以保留部分 mock 数据或者保持空数据等待接口
    // 这里根据需求，未登录时为初始态。
    if (!auth.isLoggedIn) {
      this.setData({
        auth,
        today: Formatter.getTodayDate() + " " + Formatter.getTodayDayOfWeek(),
        planLabel: '未设置',
        planValue: '--',
        consumedKcal: 0,
        targetKcal: 0,
        burnedKcal: 0,
        macros: [
          { key: 'protein', name: '蛋白质', current: 0, target: 0, unit: 'g', color: '#22C55E', percent: 0 },
          { key: 'carb', name: '碳水', current: 0, target: 0, unit: 'g', color: '#4F46E5', percent: 0 },
          { key: 'fat', name: '脂肪', current: 0, target: 0, unit: 'g', color: '#F97316', percent: 0 }
        ],
        mealPlanStatus: '未设置',
        mealPlanMeals: '暂无方案',
        activities: []
      }, () => {
        this.syncDerivedData();
      });
    } else {
      // 已登录状态，可以显示 mock 数据
      this.setData({
        auth,
        today: Formatter.getTodayDate() + " " + Formatter.getTodayDayOfWeek(),
        planLabel: '高碳日',
        planValue: '280g',
        consumedKcal: 1840,
        targetKcal: 2480,
        burnedKcal: 320,
        macros: [
          { key: 'protein', name: '蛋白质', current: 128, target: 160, unit: 'g', color: '#22C55E', percent: 0 },
          { key: 'carb', name: '碳水', current: 245, target: 280, unit: 'g', color: '#4F46E5', percent: 0 },
          { key: 'fat', name: '脂肪', current: 48, target: 70, unit: 'g', color: '#F97316', percent: 0 }
        ],
        mealPlanStatus: '已选',
        mealPlanMeals: '早餐 · 午餐 · 晚餐 · 加餐',
        activities: [
          { id: '1', name: '小雨', initial: '小', action: '完成了今日打卡 · 高碳日', time: '10分钟前' },
          { id: '2', name: '阿强', initial: '阿', action: '完成了今日打卡 · 中碳日', time: '32分钟前' },
          { id: '3', name: '建国', initial: '建', action: '更新了本周训练计划', time: '1小时前' }
        ]
      }, () => {
        this.syncDerivedData();
      });
    }
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  syncDerivedData(done?: () => void) {
    const completionPercent = this.getCompletionPercent();
    const remainingKcal = this.getRemainingKcal();
    const macros = this.data.macros.map(item => ({
      ...item,
      percent: this.getMacroPercent(item.current, item.target)
    }));

    this.setData({ completionPercent, remainingKcal, macros }, done);
  },

  clampPercent(value: number) {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  },

  getCompletionPercent() {
    const target = this.data.targetKcal || 0;
    if (target <= 0) return 0;
    return this.clampPercent(Math.round((this.data.consumedKcal / target) * 100));
  },

  getRemainingKcal() {
    const remaining = (this.data.targetKcal || 0) - (this.data.consumedKcal || 0);
    return remaining < 0 ? 0 : remaining;
  },

  getMacroPercent(current: number, target: number) {
    if (!target || target <= 0) return 0;
    return this.clampPercent(Math.round((current / target) * 100));
  },

  onTapMealPlan() {
    wx.showToast({ title: '敬请期待', icon: 'none' });
  },

  onTapQuickAction(event: any) {
    const key = String(event.currentTarget.dataset.key || '');
    if (!key) return;
    if (key === 'checkin') {
      wx.switchTab({ url: '/pages/record/record' });
      return;
    }
    wx.showToast({ title: '敬请期待', icon: 'none' });
  }
})
