import Formatter from "../../utils/Formatter"
import { getAuthState } from "../../utils/UserState"
import { request } from "../../utils/request"

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
      this.setData({ 
        auth,
        today: Formatter.getTodayDate() + " " + Formatter.getTodayDayOfWeek(),
      });
      this.fetchTodayPlan();
    }
    
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
  },

  async fetchTodayPlan() {
    try {
      const res = await request({
        url: '/plan',
        method: 'GET',
      });
      
      let activePlan = null;
      if (res && res.data && res.data.plans && res.data.plans.length > 0) {
        const todayStr = Formatter.formatYYYYMMDD(new Date());

        // 1. 检查日历中是否为今天显式安排了排餐
        // 如果有记录，不管是有效 planId 还是空字符串，都代表显式安排
        if (res.data.calendar && typeof res.data.calendar[todayStr] !== 'undefined') {
          const planIdToUse = res.data.calendar[todayStr];
          if (planIdToUse) {
            activePlan = res.data.plans.find((p: any) => p.id === planIdToUse);
          } else {
            // 如果 planIdToUse 为空字符串，说明用户显式选择了"清除排餐"，此时不应该有任何计划
            activePlan = null;
          }
        } else {
          // 2. 如果今天没有在日历里做任何操作（没记录），使用默认的 isActive 方案
          activePlan = res.data.plans.find((p: any) => p.isActive) || res.data.plans[0];
        }
      }

      if (!activePlan) {
        this.setData({
          planLabel: '未排餐',
          planValue: '--',
          todayMeals: [],
        }, () => {
          this.syncDerivedData();
        });
        return;
      }

      // 解析 plan 数据为 todayMeals 格式
      const mealsObj = activePlan.meals || {};
      const mealSections = [
        { id: 'breakfast', name: '早餐' },
        { id: 'lunch', name: '午餐' },
        { id: 'dinner', name: '晚餐' },
        { id: 'snack', name: '加餐' }
      ];

      const todayMeals: any[] = [];
      
      mealSections.forEach(section => {
        const mealData = mealsObj[section.name];
        if (mealData && mealData.items && mealData.items.length > 0) {
          let totalKcal = 0;
          const foods: string[] = [];
          
          mealData.items.forEach((item: any) => {
            totalKcal += Formatter.parseKcal(item.kcal);
            foods.push(item.food);
          });

          // 估算宏量营养素 (假设 30% 蛋白质，50% 碳水，20% 脂肪)
          const protein = Math.round((totalKcal * 0.3) / 4);
          const carb = Math.round((totalKcal * 0.5) / 4);
          const fat = Math.round((totalKcal * 0.2) / 9);

          todayMeals.push({
            id: section.id,
            name: section.name,
            desc: foods.join(' · '),
            kcal: totalKcal,
            protein,
            carb,
            fat,
            checked: false // 暂时将打卡状态设为本地 false
          });
        }
      });

      this.setData({
        planLabel: '今日方案',
        planValue: activePlan.name,
        todayMeals,
        // 可以保留或者清空 mock 好友动态
        activities: [
          { id: '1', name: '小雨', initial: '小', action: '完成了今日饮食打卡', time: '10分钟前' },
          { id: '2', name: '阿强', initial: '阿', action: '完成了今日饮食打卡', time: '32分钟前' }
        ]
      }, () => {
        this.syncDerivedData();
      });

    } catch (err) {
      console.error('Failed to fetch today plan:', err);
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
