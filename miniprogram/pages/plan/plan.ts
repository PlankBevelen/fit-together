import Formatter from "../../utils/Formatter"
import { getAuthState } from "../../utils/UserState"
import { request } from "../../utils/request"

type MealItem = { food: string; grams: string; kcal: string };
type MealSection = { name: string; items: MealItem[] };
type Meals = Record<string, MealSection>;

type MealPlan = {
  id: string;
  name: string;
  meals: Meals;
  isActive?: boolean;
};

const COLORS = {
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

const mealPlansInit: MealPlan[] = [];

function buildMealCards(meals: Meals, sections: string[]) {
  const cards = sections.map((section) => {
    const plan = meals[section];
    const items = plan ? plan.items : [];
    const totalKcal = items.reduce((sum, item) => sum + Formatter.parseKcal(item.kcal), 0);
    return { section, items, totalKcal };
  });
  const totalKcal = cards.reduce((sum, c) => sum + c.totalKcal, 0);
  return { cards, totalKcal };
}

function getWeekTitle(weekOffset: number) {
  if (weekOffset === 0) return "本周";
  if (weekOffset === -1) return "上周";
  if (weekOffset === 1) return "下周";
  return `${Math.abs(weekOffset)}周${weekOffset > 0 ? '后' : '前'}`;
}

function getWeekRange(weekOffset: number) {
  const dates = Formatter.getWeekDates(weekOffset);
  return `${dates[0].displayDate} - ${dates[6].displayDate}`;
}

function buildCalendarDays(plansMap: Record<string, string>, mealPlans: MealPlan[], weekOffset: number) {
  const dates = Formatter.getWeekDates(weekOffset);
  return dates.map((d) => {
    const planId = plansMap[d.date] || "";
    const planObj = mealPlans.find(p => p.id === planId);
    return {
      ...d,
      planId,
      planName: planObj ? planObj.name : ""
    };
  });
}

function buildMonthDays(plansMap: Record<string, string>, mealPlans: MealPlan[]) {
  const dates = Formatter.getMonthDates();
  return dates.map((d) => {
    const planId = plansMap[d.date] || "";
    const planObj = mealPlans.find(p => p.id === planId);
    return {
      ...d,
      planId,
      planName: planObj ? planObj.name : ""
    };
  });
}

const emptyMeals: Meals = {
  早餐: { name: "早餐", items: [] },
  午餐: { name: "午餐", items: [] },
  晚餐: { name: "晚餐", items: [] },
  加餐: { name: "加餐", items: [] },
};

Page({
  data: {
    auth: { isLoggedIn: false },
    colors: COLORS,

    segments: ["方案搭配", "日历排餐"],
    segment: "方案搭配",

    mealPlans: mealPlansInit,
    activePlanIndex: 0,
    
    mealSections: ["早餐", "午餐", "晚餐", "加餐"],
    mealCards: [] as { section: string; items: MealItem[]; totalKcal: number }[],
    mealTotalKcal: 0,

    nutritionSummary: [
      { label: "蛋白质", value: "162g", color: "#4ADE80" },
      { label: "碳水", value: "268g", color: COLORS.secondary },
      { label: "脂肪", value: "52g", color: "#FB923C" },
    ],

    showAIDrawer: false,

    calendarWeekOffset: 0,
    calendarWeekTitle: getWeekTitle(0),
    calendarWeekRange: getWeekRange(0),
    calendarPlans: {} as Record<string, string>,
    calendarDays: [] as any[],

    calendarView: "week",
    calendarMonthDays: [] as any[],

    showPlanPicker: false,
    pickerDay: "",
    pickerSelectedPlanId: "",

    isGenerating: false,
    
    showAddPlanModal: false,
    newPlanName: "",

    showAddMealItemModal: false,
    currentMealSection: "",
    newMealItem: { food: "", grams: "", kcal: "" } as MealItem,
  },

  onLoad() {
    this.syncAuthState();
  },

  onShow() {
    this.syncAuthState();
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
  },

  async syncAuthState() {
    const auth = getAuthState();
    if (!auth.isLoggedIn) {
      this.setData({
        auth,
        mealPlans: [],
        activePlanIndex: 0,
        nutritionSummary: [
          { label: "蛋白质", value: "0g", color: "#4ADE80" },
          { label: "碳水", value: "0g", color: COLORS.secondary },
          { label: "脂肪", value: "0g", color: "#FB923C" },
        ],
        calendarPlans: {} as Record<string, string>,
      });
      this.updateDerivedData();
    } else {
      this.setData({ auth });
      await this.fetchPlans();
    }
  },

  async fetchPlans() {
    try {
      const res = await request({
        url: '/plan',
        method: 'GET',
      });
      
      if (res && res.data && res.data.plans && res.data.plans.length > 0) {
        const activeIdx = res.data.plans.findIndex((p: any) => p.isActive);
        this.setData({
          mealPlans: res.data.plans,
          activePlanIndex: activeIdx >= 0 ? activeIdx : 0,
        });
      } else {
        // 如果没有计划，设置为空数组
        this.setData({
          mealPlans: [],
          activePlanIndex: 0,
        });
      }
      
      // 更新日历
      if (res && res.data && res.data.calendar) {
        this.setData({
          calendarPlans: res.data.calendar
        });
      } else {
        this.setData({
          calendarPlans: {},
        });
      }

      // 更新营养总结
      this.setData({
        nutritionSummary: [
          { label: "蛋白质", value: "0g", color: "#4ADE80" },
          { label: "碳水", value: "0g", color: COLORS.secondary },
          { label: "脂肪", value: "0g", color: "#FB923C" },
        ]
      });
      
      this.updateDerivedData();
    } catch (err) {
      console.error('Failed to fetch plans', err);
      // Fallback to empty
      this.setData({ mealPlans: [] });
      this.updateDerivedData();
    }
  },

  updateDerivedData() {
    const plans = this.data.mealPlans;
    const activeIndex = this.data.activePlanIndex;
    const currentPlan = plans[activeIndex];
    
    let mealDerived: { cards: any[]; totalKcal: number } = { cards: [], totalKcal: 0 };
    if (currentPlan && currentPlan.meals) {
      mealDerived = buildMealCards(currentPlan.meals, this.data.mealSections);
    } else {
      mealDerived = buildMealCards(emptyMeals, this.data.mealSections);
    }
    
    const calendarDays = buildCalendarDays(this.data.calendarPlans, plans, this.data.calendarWeekOffset);
    const calendarMonthDays = buildMonthDays(this.data.calendarPlans, plans);

    // 计算当前查看的计划是否是 active 的
    const isCurrentActive = currentPlan ? !!currentPlan.isActive : false;

    this.setData({ 
      mealCards: mealDerived.cards, 
      mealTotalKcal: mealDerived.totalKcal, 
      calendarDays,
      calendarMonthDays,
      isCurrentActive
    });
  },

  async onSetActivePlan() {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    
    const plans = [...this.data.mealPlans];
    const currentPlan = plans[this.data.activePlanIndex];
    if (!currentPlan) return;

    if (currentPlan.id && !currentPlan.id.startsWith('plan_') && currentPlan.id !== 'empty') {
      wx.showLoading({ title: "设置中" });
      try {
        await request({
          url: `/plan/${currentPlan.id}`,
          method: 'PUT',
          data: {
            isActive: true
          }
        });
        
        // 更新本地状态
        plans.forEach(p => p.isActive = false);
        currentPlan.isActive = true;

        this.setData({ mealPlans: plans }, () => {
          this.updateDerivedData();
          wx.hideLoading();
          wx.showToast({ title: '设置成功', icon: 'success' });
        });
      } catch (err: any) {
        wx.hideLoading();
        wx.showToast({ title: err.message || '设置失败', icon: 'none' });
      }
    } else {
      wx.showToast({ title: '演示计划无法设置', icon: 'none' });
    }
  },

  onSegmentChange(event: any) {
    const value = String(event.detail?.value || "");
    if (!value) return;
    this.setData({ segment: value });
  },

  onSwitchPlan(event: any) {
    const index = Number(event.currentTarget.dataset.index);
    if (!Number.isNaN(index) && index >= 0 && index < this.data.mealPlans.length) {
      this.setData({ activePlanIndex: index }, () => {
        this.updateDerivedData();
      });
    }
  },

  onAddPlan() {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    this.setData({ showAddPlanModal: true, newPlanName: "" });
  },

  onCloseAddPlan() {
    this.setData({ showAddPlanModal: false });
  },

  onPlanNameInput(event: any) {
    this.setData({ newPlanName: event.detail.value });
  },

  async onConfirmAddPlan() {
    const name = this.data.newPlanName.trim();
    if (!name) {
      wx.showToast({ title: "请输入套餐名称", icon: "none" });
      return;
    }

    wx.showLoading({ title: "保存中" });
    try {
      const res = await request({
        url: '/plan',
        method: 'POST',
        data: {
          name,
          meals: emptyMeals,
          isActive: true
        }
      });

      if (res && res.data && res.data.plan) {
        const savedPlan = res.data.plan;
        const updatedPlans = [...this.data.mealPlans, savedPlan];
        
        this.setData({
          mealPlans: updatedPlans,
          activePlanIndex: updatedPlans.length - 1,
          showAddPlanModal: false,
          newPlanName: ""
        }, () => {
          this.updateDerivedData();
          wx.hideLoading();
          wx.showToast({ title: '创建成功', icon: 'success' });
        });
      }
    } catch (err: any) {
      wx.hideLoading();
      wx.showToast({ title: err.message || '创建失败', icon: 'none' });
    }
  },

  async onDeletePlan() {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    
    const plans = this.data.mealPlans;
    if (plans.length === 0) return;
    
    const currentPlan = plans[this.data.activePlanIndex];
    if (!currentPlan) return;

    wx.showModal({
      title: '删除套餐',
      content: `确定要删除「${currentPlan.name}」吗？`,
      confirmColor: COLORS.danger,
      success: async (res) => {
        if (res.confirm) {
          wx.showLoading({ title: "删除中" });
          
          try {
            // 如果这个计划有关联的后端ID
            if (currentPlan.id && !currentPlan.id.startsWith('plan_') && currentPlan.id !== 'empty') {
              await request({
                url: `/plan/${currentPlan.id}`,
                method: 'DELETE',
              });
            }

            const updatedPlans = plans.filter((_, index) => index !== this.data.activePlanIndex);
            
            this.setData({
              mealPlans: updatedPlans,
              activePlanIndex: 0
            }, () => {
              this.updateDerivedData();
              wx.hideLoading();
              wx.showToast({ title: '删除成功', icon: 'success' });
            });
            
          } catch (err: any) {
            wx.hideLoading();
            wx.showToast({ title: err.message || '删除失败', icon: 'none' });
          }
        }
      }
    });
  },

  onTapAddMealItem(event: any) {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    const section = String(event.currentTarget.dataset.section || "");
    if (!section) return;

    this.setData({
      showAddMealItemModal: true,
      currentMealSection: section,
      newMealItem: { food: "", grams: "", kcal: "" }
    });
  },

  onCloseAddMealItem() {
    this.setData({ showAddMealItemModal: false });
  },

  onMealItemFoodInput(event: any) {
    this.setData({ 'newMealItem.food': event.detail.value });
  },

  onMealItemGramsInput(event: any) {
    this.setData({ 'newMealItem.grams': event.detail.value });
  },

  onMealItemKcalInput(event: any) {
    this.setData({ 'newMealItem.kcal': event.detail.value });
  },

  async onConfirmAddMealItem() {
    const { food, grams, kcal } = this.data.newMealItem;
    const section = this.data.currentMealSection;

    if (!food || !grams || !kcal) {
      wx.showToast({ title: "请填写完整食物信息", icon: "none" });
      return;
    }

    const plans = [...this.data.mealPlans];
    const currentPlan = plans[this.data.activePlanIndex];
    if (!currentPlan) return;

    const currentMeals = currentPlan.meals[section];
    if (!currentMeals) return;

    const newItem = { food, grams, kcal: kcal.endsWith('kcal') ? kcal : kcal + 'kcal' };
    const nextItems = [...currentMeals.items, newItem];
    currentPlan.meals = { ...currentPlan.meals, [section]: { ...currentMeals, items: nextItems } };

    // 如果这个计划有关联的后端ID，则同步到后端
    if (currentPlan.id && !currentPlan.id.startsWith('plan_') && currentPlan.id !== 'empty') {
      wx.showLoading({ title: "保存中" });
      try {
        await request({
          url: `/plan/${currentPlan.id}`,
          method: 'PUT',
          data: {
            meals: currentPlan.meals
          }
        });
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: '同步到云端失败', icon: 'none' });
        // 可以选择在这里 return 阻止本地更新，或者继续让本地更新
      }
    }

    this.setData({ 
      mealPlans: plans,
      showAddMealItemModal: false,
      newMealItem: { food: "", grams: "", kcal: "" }
    }, () => {
      this.updateDerivedData();
      wx.showToast({ title: '添加成功', icon: 'success' });
    });
  },

  async onRemoveMealItem(event: any) {
    const section = String(event.currentTarget.dataset.section || "");
    const itemIndex = Number(event.currentTarget.dataset.index);
    if (!section || Number.isNaN(itemIndex) || itemIndex < 0) return;

    const plans = [...this.data.mealPlans];
    const currentPlan = plans[this.data.activePlanIndex];
    if (!currentPlan) return;

    const currentMeals = currentPlan.meals[section];
    if (!currentMeals) return;

    const nextItems = currentMeals.items.filter((_, i) => i !== itemIndex);
    currentPlan.meals = { ...currentPlan.meals, [section]: { ...currentMeals, items: nextItems } };
    
    // 如果这个计划有关联的后端ID（不是初始化时的 mock 计划），则同步到后端
    if (currentPlan.id && !currentPlan.id.startsWith('plan_')) {
      try {
        await request({
          url: `/plan/${currentPlan.id}`,
          method: 'PUT',
          data: {
            meals: currentPlan.meals
          }
        });
      } catch (err) {
        wx.showToast({ title: '同步到云端失败', icon: 'none' });
      }
    }

    this.setData({ mealPlans: plans }, () => {
      this.updateDerivedData();
    });
  },

  onOpenAIDrawer() {
    if (!this.data.auth.isLoggedIn) {
      wx.showToast({ title: "请先登录", icon: "none" });
      return;
    }
    this.setData({ showAIDrawer: true });
  },

  onCloseAIDrawer() {
    this.setData({ showAIDrawer: false });
  },

  async onGeneratePlan() {
    this.setData({ isGenerating: true });
    try {
      const res = await request({
        url: '/plan/generate',
        method: 'POST',
      });
      
      if (res && res.data && res.data.plan) {
        const generatedPlan = res.data.plan;
        
        // 生成的计划保存到后端
        const saveRes = await request({
          url: '/plan',
          method: 'POST',
          data: {
            name: generatedPlan.name || 'AI智能方案',
            meals: generatedPlan.meals,
            isActive: true
          }
        });

        if (saveRes && saveRes.data && saveRes.data.plan) {
          const savedPlan = saveRes.data.plan;
          // 追加到计划列表
          const updatedPlans = [...this.data.mealPlans, savedPlan];
          
          this.setData({
            mealPlans: updatedPlans,
            activePlanIndex: updatedPlans.length - 1,
            showAIDrawer: false,
            isGenerating: false
          }, () => {
            this.updateDerivedData();
            wx.showToast({ title: '生成成功', icon: 'success' });
          });
        } else {
           throw new Error('保存计划失败');
        }
      } else {
        throw new Error('返回格式错误');
      }
    } catch (err: any) {
      wx.showToast({ title: err.message || '生成失败，请重试', icon: 'none' });
      this.setData({ isGenerating: false });
    }
  },

  onPrevWeek() {
    const nextOffset = this.data.calendarWeekOffset - 1;
    this.setData({
      calendarWeekOffset: nextOffset,
      calendarWeekTitle: getWeekTitle(nextOffset),
      calendarWeekRange: getWeekRange(nextOffset),
    }, () => {
      this.updateDerivedData();
    });
  },

  onNextWeek() {
    const nextOffset = this.data.calendarWeekOffset + 1;
    this.setData({
      calendarWeekOffset: nextOffset,
      calendarWeekTitle: getWeekTitle(nextOffset),
      calendarWeekRange: getWeekRange(nextOffset),
    }, () => {
      this.updateDerivedData();
    });
  },

  onChangeCalendarView(event: any) {
    const view = String(event.currentTarget.dataset.view || "");
    if (view === "week" || view === "month") {
      this.setData({ calendarView: view });
    }
  },

  onSwiperChange(event: any) {
    const current = event.detail.current;
    this.setData({ calendarView: current === 0 ? "week" : "month" });
  },

  onCopyPrevWeek() {
    wx.showToast({ title: "敬请期待", icon: "none" });
  },

  onOpenPlanPicker(event: any) {
    const day = String(event.currentTarget.dataset.day || "");
    if (!day) return;
    const selectedId = this.data.calendarPlans[day] || "";
    this.setData({ showPlanPicker: true, pickerDay: day, pickerSelectedPlanId: selectedId });
  },

  onClosePlanPicker() {
    this.setData({ showPlanPicker: false, pickerDay: "" });
  },

  async onSelectPlan(event: any) {
    const planId = String(event.currentTarget.dataset.planid || "");
    const day = this.data.pickerDay; // This is now 'YYYY-MM-DD'
    if (!day) return;

    const calendarPlans = { ...this.data.calendarPlans };
    if (planId) {
      calendarPlans[day] = planId;
    } else {
      // 存入空字符串而不是删除，用于标识显式"清除排餐"
      calendarPlans[day] = "";
    }
    
    // Sync to backend
    wx.showLoading({ title: '保存中' });
    try {
      await request({
        url: '/plan/calendar',
        method: 'POST',
        data: {
          date: day,
          planId: planId
        }
      });
      wx.hideLoading();
    } catch (err) {
      wx.hideLoading();
      wx.showToast({ title: '保存失败', icon: 'none' });
      return; // If failed, don't update local state
    }

    this.setData({ calendarPlans, showPlanPicker: false, pickerDay: "", pickerSelectedPlanId: planId }, () => {
      this.updateDerivedData();
    });
  },

  noop() {},
});
