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
    remainingKcal: 0,
    completionPercent: 0,

    macros: [
      { key: 'protein', name: '蛋白质', current: 0, target: 0, unit: 'g', color: '#22C55E', percent: 0 },
      { key: 'carb', name: '碳水', current: 0, target: 0, unit: 'g', color: '#4F46E5', percent: 0 },
      { key: 'fat', name: '脂肪', current: 0, target: 0, unit: 'g', color: '#F97316', percent: 0 }
    ],

    todayMeals: [] as any[],

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
        planLabel: '未排餐',
        planValue: '--',
        todayMeals: [],
        activities: []
      }, () => {
        this.syncDerivedData();
      });
    } else {
      // 已登录状态，可以显示 mock 数据
      this.setData({
        auth,
        today: Formatter.getTodayDate() + " " + Formatter.getTodayDayOfWeek(),
        planLabel: '今日方案',
        planValue: '增肌方案A',
        todayMeals: [
          { id: 'breakfast', name: '早餐', desc: '全麦面包 · 水煮蛋 · 脱脂牛奶', kcal: 332, protein: 22, carb: 35, fat: 12, checked: true },
          { id: 'lunch', name: '午餐', desc: '糙米饭 · 鸡胸肉 · 西兰花', kcal: 335, protein: 45, carb: 40, fat: 5, checked: false },
          { id: 'dinner', name: '晚餐', desc: '红薯 · 三文鱼 · 沙拉', kcal: 356, protein: 30, carb: 45, fat: 15, checked: false },
          { id: 'snack', name: '加餐', desc: '香蕉 · 乳清蛋白粉', kcal: 209, protein: 25, carb: 25, fat: 2, checked: false }
        ],
        activities: [
          { id: '1', name: '小雨', initial: '小', action: '完成了今日饮食打卡', time: '10分钟前' },
          { id: '2', name: '阿强', initial: '阿', action: '完成了今日饮食打卡', time: '32分钟前' },
          { id: '3', name: '建国', initial: '建', action: '更新了本周饮食计划', time: '1小时前' }
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
    let targetKcal = 0;
    let consumedKcal = 0;
    let targetP = 0, targetC = 0, targetF = 0;
    let currentP = 0, currentC = 0, currentF = 0;

    this.data.todayMeals.forEach(m => {
      targetKcal += m.kcal;
      targetP += m.protein;
      targetC += m.carb;
      targetF += m.fat;

      if (m.checked) {
        consumedKcal += m.kcal;
        currentP += m.protein;
        currentC += m.carb;
        currentF += m.fat;
      }
    });

    const macros = [
      { key: 'protein', name: '蛋白质', current: currentP, target: targetP, unit: 'g', color: '#22C55E', percent: this.getMacroPercent(currentP, targetP) },
      { key: 'carb', name: '碳水', current: currentC, target: targetC, unit: 'g', color: '#4F46E5', percent: this.getMacroPercent(currentC, targetC) },
      { key: 'fat', name: '脂肪', current: currentF, target: targetF, unit: 'g', color: '#F97316', percent: this.getMacroPercent(currentF, targetF) }
    ];

    const remainingKcal = Math.max(0, targetKcal - consumedKcal);
    const completionPercent = targetKcal > 0 ? this.clampPercent(Math.round((consumedKcal / targetKcal) * 100)) : 0;

    this.setData({
      targetKcal,
      consumedKcal,
      remainingKcal,
      completionPercent,
      macros
    }, done);
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

  onToggleMeal(event: any) {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }
    const index = event.currentTarget.dataset.index;
    if (index === undefined) return;

    const key = `todayMeals[${index}].checked`;
    const currentVal = this.data.todayMeals[index].checked;

    this.setData({
      [key]: !currentVal
    }, () => {
      this.syncDerivedData();
    });
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
