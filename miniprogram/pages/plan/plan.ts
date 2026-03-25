import { getAuthState } from "../../utils/UserState"

type MealItem = { food: string; grams: string; kcal: string };
type MealSection = { name: string; items: MealItem[] };
type Meals = Record<string, MealSection>;

type MealPlan = {
  id: string;
  name: string;
  meals: Meals;
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

const defaultMealsInit: Meals = {
  早餐: {
    name: "早餐",
    items: [
      { food: "全麦面包", grams: "60g", kcal: "158kcal" },
      { food: "水煮蛋", grams: "60g", kcal: "86kcal" },
      { food: "脱脂牛奶", grams: "250ml", kcal: "88kcal" },
    ],
  },
  午餐: {
    name: "午餐",
    items: [
      { food: "糙米饭", grams: "150g", kcal: "174kcal" },
      { food: "鸡胸肉", grams: "120g", kcal: "127kcal" },
      { food: "西兰花", grams: "100g", kcal: "34kcal" },
    ],
  },
  晚餐: {
    name: "晚餐",
    items: [
      { food: "红薯", grams: "200g", kcal: "172kcal" },
      { food: "三文鱼", grams: "100g", kcal: "139kcal" },
      { food: "沙拉", grams: "120g", kcal: "45kcal" },
    ],
  },
  加餐: {
    name: "加餐",
    items: [
      { food: "香蕉", grams: "100g", kcal: "89kcal" },
      { food: "乳清蛋白粉", grams: "30g", kcal: "120kcal" },
    ],
  },
};

const mealPlansInit: MealPlan[] = [
  {
    id: "plan_a",
    name: "增肌方案A",
    meals: defaultMealsInit
  },
  {
    id: "plan_b",
    name: "低脂减脂",
    meals: {
      早餐: { name: "早餐", items: [{ food: "燕麦粥", grams: "80g", kcal: "290kcal" }, { food: "水煮蛋", grams: "60g", kcal: "86kcal" }] },
      午餐: { name: "午餐", items: [{ food: "蔬菜沙拉", grams: "200g", kcal: "100kcal" }, { food: "鸡胸肉", grams: "150g", kcal: "159kcal" }] },
      晚餐: { name: "晚餐", items: [{ food: "蒸西兰花", grams: "150g", kcal: "51kcal" }, { food: "牛里脊", grams: "100g", kcal: "107kcal" }] },
      加餐: { name: "加餐", items: [] },
    }
  }
];

function parseKcal(value: string) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

function buildMealCards(meals: Meals, sections: string[]) {
  const cards = sections.map((section) => {
    const plan = meals[section];
    const items = plan ? plan.items : [];
    const totalKcal = items.reduce((sum, item) => sum + parseKcal(item.kcal), 0);
    return { section, items, totalKcal };
  });
  const totalKcal = cards.reduce((sum, c) => sum + c.totalKcal, 0);
  return { cards, totalKcal };
}

function getWeekTitle(weekOffset: number) {
  if (weekOffset === 0) return "本周";
  if (weekOffset < 0) return "上周";
  return "下周";
}

function getWeekRange(weekOffset: number) {
  if (weekOffset === 0) return "3/16–3/22";
  if (weekOffset === -1) return "3/9–3/15";
  return "3/23–3/29";
}

const weekDaysBase = [
  { day: "周一", date: "3/16" },
  { day: "周二", date: "3/17" },
  { day: "周三", date: "3/18" },
  { day: "周四", date: "3/19" },
  { day: "周五", date: "3/20" },
  { day: "周六", date: "3/21" },
  { day: "周日", date: "3/22", isToday: true },
];

function buildCalendarDays(plansMap: Record<string, string>, mealPlans: MealPlan[]) {
  return weekDaysBase.map((d) => {
    const planId = plansMap[d.day] || "";
    const planObj = mealPlans.find(p => p.id === planId);
    return {
      ...d,
      planId,
      planName: planObj ? planObj.name : ""
    };
  });
}

function buildMonthDays(mealPlans: MealPlan[]) {
  const days = [];
  for (let i = 0; i < 42; i++) {
    const isToday = i === 15;
    let planName = "";
    if (isToday) planName = mealPlans[0]?.name || "";
    else if (i % 5 === 0) planName = mealPlans[1]?.name || "";
    
    days.push({
      day: (i % 30) + 1,
      isToday,
      planName
    });
  }
  return days;
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
    calendarPlans: {
      周一: "plan_a",
      周三: "plan_a",
      周五: "plan_b",
      周日: "plan_b",
    } as Record<string, string>,
    calendarDays: [] as any[],

    calendarView: "week",
    calendarMonthDays: [] as any[],

    showPlanPicker: false,
    pickerDay: "",
    pickerSelectedPlanId: "",
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

  syncAuthState() {
    const auth = getAuthState();
    if (!auth.isLoggedIn) {
      this.setData({
        auth,
        mealPlans: [{ id: "empty", name: "未命名方案", meals: emptyMeals }],
        activePlanIndex: 0,
        nutritionSummary: [
          { label: "蛋白质", value: "0g", color: "#4ADE80" },
          { label: "碳水", value: "0g", color: COLORS.secondary },
          { label: "脂肪", value: "0g", color: "#FB923C" },
        ],
        calendarPlans: {} as Record<string, string>,
      });
    } else {
      this.setData({
        auth,
        mealPlans: mealPlansInit,
        nutritionSummary: [
          { label: "蛋白质", value: "162g", color: "#4ADE80" },
          { label: "碳水", value: "268g", color: COLORS.secondary },
          { label: "脂肪", value: "52g", color: "#FB923C" },
        ],
        calendarPlans: {
          周一: "plan_a",
          周三: "plan_a",
          周五: "plan_b",
          周日: "plan_b",
        },
      });
    }

    this.updateDerivedData();
  },

  updateDerivedData() {
    const plans = this.data.mealPlans;
    const activeIndex = this.data.activePlanIndex;
    const currentPlan = plans[activeIndex] || plans[0];
    
    const mealDerived = buildMealCards(currentPlan.meals, this.data.mealSections);
    const calendarDays = buildCalendarDays(this.data.calendarPlans, plans);
    const calendarMonthDays = buildMonthDays(plans);

    this.setData({ 
      mealCards: mealDerived.cards, 
      mealTotalKcal: mealDerived.totalKcal, 
      calendarDays,
      calendarMonthDays
    });
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
    wx.showToast({ title: "敬请期待", icon: "none" });
  },

  onTapAddMealItem() {
    wx.showToast({ title: "敬请期待", icon: "none" });
  },

  onRemoveMealItem(event: any) {
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
    
    this.setData({ mealPlans: plans }, () => {
      this.updateDerivedData();
    });
  },

  onOpenAIDrawer() {
    this.setData({ showAIDrawer: true });
  },

  onCloseAIDrawer() {
    this.setData({ showAIDrawer: false });
  },

  onPrevWeek() {
    const nextOffset = this.data.calendarWeekOffset - 1;
    this.setData({
      calendarWeekOffset: nextOffset,
      calendarWeekTitle: getWeekTitle(nextOffset),
      calendarWeekRange: getWeekRange(nextOffset),
    });
  },

  onNextWeek() {
    const nextOffset = this.data.calendarWeekOffset + 1;
    this.setData({
      calendarWeekOffset: nextOffset,
      calendarWeekTitle: getWeekTitle(nextOffset),
      calendarWeekRange: getWeekRange(nextOffset),
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

  onSelectPlan(event: any) {
    const planId = String(event.currentTarget.dataset.planid || "");
    const day = this.data.pickerDay;
    if (!day) return;

    const calendarPlans = { ...this.data.calendarPlans };
    if (planId) {
      calendarPlans[day] = planId;
    } else {
      delete calendarPlans[day];
    }
    
    this.setData({ calendarPlans, showPlanPicker: false, pickerDay: "", pickerSelectedPlanId: planId }, () => {
      this.updateDerivedData();
    });
  },

  noop() {},
});
