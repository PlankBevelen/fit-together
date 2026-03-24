import { getAuthState } from "../../utils/UserState"

type CarbonType = "high" | "mid" | "low" | "rest";

type CarbonInfo = {
  label: string;
  color: string;
  bg: string;
  carbs: string;
  kcal: string;
  shortLabel: string;
  kcalShort: string;
};

type WeekDay = {
  day: string;
  date: string;
  type: CarbonType;
  isToday?: boolean;
  info: CarbonInfo;
};

type MealItem = { food: string; grams: string; kcal: string };
type MealSection = { name: string; items: MealItem[] };
type Meals = Record<string, MealSection>;

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
  carbonHigh: "#059669",
  carbonHighBg: "#ECFDF5",
  carbonMid: "#3730A3",
  carbonMidBg: "#EEF2FF",
  carbonLow: "#D97706",
  carbonLowBg: "#FFFBEB",
  carbonRest: "#92400E",
  carbonRestBg: "#FEF3C7",
};

const carbonInfo: Record<CarbonType, CarbonInfo> = {
  high: { label: "高碳日", shortLabel: "高碳", color: COLORS.carbonHigh, bg: COLORS.carbonHighBg, carbs: "280g", kcal: "2480kcal", kcalShort: "2480" },
  mid: { label: "中碳日", shortLabel: "中碳", color: COLORS.carbonMid, bg: COLORS.carbonMidBg, carbs: "220g", kcal: "2100kcal", kcalShort: "2100" },
  low: { label: "低碳日", shortLabel: "低碳", color: COLORS.carbonLow, bg: COLORS.carbonLowBg, carbs: "180g", kcal: "1800kcal", kcalShort: "1800" },
  rest: { label: "休息日", shortLabel: "休息", color: COLORS.carbonRest, bg: COLORS.carbonRestBg, carbs: "150g", kcal: "1600kcal", kcalShort: "1600" },
};

const weekDaysBase: { day: string; date: string; type: CarbonType; isToday?: boolean }[] = [
  { day: "周一", date: "3/16", type: "high" },
  { day: "周二", date: "3/17", type: "low" },
  { day: "周三", date: "3/18", type: "mid" },
  { day: "周四", date: "3/19", type: "rest" },
  { day: "周五", date: "3/20", type: "high" },
  { day: "周六", date: "3/21", type: "low" },
  { day: "周日", date: "3/22", type: "high", isToday: true },
];

const mealPlansInit: Meals = {
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

function parseKcal(value: string) {
  const n = parseInt(value, 10);
  return Number.isNaN(n) ? 0 : n;
}

function buildWeekDays() {
  return weekDaysBase.map((d) => ({
    ...d,
    info: carbonInfo[d.type],
  }));
}

function buildCalendarDays(plans: Record<string, string>) {
  return buildWeekDays().map((d) => ({
    ...d,
    plan: plans[d.day] || "",
  }));
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

function buildMonthDays() {
  const days = [];
  for (let i = 0; i < 42; i++) {
    const isToday = i === 15;
    days.push({
      day: (i % 30) + 1,
      isToday,
      plan: isToday ? "高碳增肌" : (i % 5 === 0 ? "低脂减脂" : ""),
      info: carbonInfo.high
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

    segments: ["碳循环", "方案搭配", "日历排餐"],
    segment: "碳循环",

    pickers: [
      { label: "训练周期", value: "4 天循环" },
      { label: "热量目标", value: "减脂模式" },
    ],

    carbonLegend: (Object.keys(carbonInfo) as CarbonType[]).map((key) => ({
      key,
      label: carbonInfo[key].label,
      color: carbonInfo[key].color,
    })),

    weekDays: buildWeekDays(),

    summaryStats: [
      { label: "周平均", value: "2085kcal" },
      { label: "热量赤字", value: "-2240kcal" },
      { label: "周总碳水", value: "1630g" },
    ],

    collapsibleCards: [
      {
        key: "core",
        title: "核心逻辑",
        content:
          "碳循环是一种通过在不同日子安排不同碳水化合物摄入量来调节身体代谢的饮食策略。高碳日提供训练所需能量，低碳日促进脂肪燃烧，休息日减少热量摄入。配合系统性的阻力训练，可以在保留肌肉的同时有效减脂。",
      },
      {
        key: "tips",
        title: "注意事项",
        content:
          "1. 蛋白质摄入应保持稳定，每天建议 1.6-2.2g/kg 体重。\n2. 高碳日优先安排大肌群训练（腿、背）。\n3. 碳水主要来源选择糙米、红薯、燕麦等复合碳水。\n4. 低碳日注意补充电解质，可适量增加健康脂肪摄入。\n5. 初期可能有轻微疲劳感，适应期通常为 1-2 周。",
      },
    ],
    openCardKey: "",

    mealSections: ["早餐", "午餐", "晚餐", "加餐"],
    meals: mealPlansInit,
    mealCards: [] as { section: string; items: MealItem[]; totalKcal: number }[],
    mealTotalKcal: 0,
    adopted: false,

    nutritionSummary: [
      { label: "蛋白质", value: "162g", color: "#4ADE80" },
      { label: "碳水", value: "268g", color: COLORS.secondary },
      { label: "脂肪", value: "52g", color: "#FB923C" },
    ],

    showAIDrawer: false,
    aiSummary: { hint: "基于你的高碳日计划", totalKcal: 2476, protein: "162g" },
    aiItems: [
      {
        meal: "早餐",
        items: [
          { food: "燕麦粥", grams: "80g", kcal: "290kcal" },
          { food: "水煮蛋", grams: "60g", kcal: "86kcal" },
          { food: "蓝莓", grams: "100g", kcal: "57kcal" },
        ],
      },
      {
        meal: "午餐",
        items: [
          { food: "糙米饭", grams: "180g", kcal: "209kcal" },
          { food: "鸡胸肉", grams: "150g", kcal: "159kcal" },
          { food: "胡萝卜炒菜", grams: "120g", kcal: "58kcal" },
        ],
      },
      {
        meal: "晚餐",
        items: [
          { food: "红薯", grams: "150g", kcal: "129kcal" },
          { food: "牛里脊", grams: "100g", kcal: "107kcal" },
          { food: "蒸西兰花", grams: "150g", kcal: "51kcal" },
        ],
      },
    ],

    calendarWeekOffset: 0,
    calendarWeekTitle: getWeekTitle(0),
    calendarWeekRange: getWeekRange(0),
    calendarPlans: {
      周一: "增肌方案A",
      周三: "高碳增肌",
      周五: "增肌方案A",
      周日: "高碳周末版",
    } as Record<string, string>,
    calendarDays: [] as Array<WeekDay & { plan: string }>,

    calendarView: "week",
    calendarMonthDays: buildMonthDays(),

    showPlanPicker: false,
    pickerDay: "",
    pickerType: "high" as CarbonType,
    pickerInfo: carbonInfo.high,
    pickerSelectedPlan: "",
    planOptions: ["增肌方案A", "高碳增肌", "低脂减脂", "维持方案", "高碳周末版"],
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
        summaryStats: [
          { label: "周平均", value: "0kcal" },
          { label: "热量赤字", value: "0kcal" },
          { label: "周总碳水", value: "0g" },
        ],
        meals: emptyMeals,
        nutritionSummary: [
          { label: "蛋白质", value: "0g", color: "#4ADE80" },
          { label: "碳水", value: "0g", color: COLORS.secondary },
          { label: "脂肪", value: "0g", color: "#FB923C" },
        ],
        calendarPlans: {} as Record<string, string>,
        aiItems: []
      });
    } else {
      this.setData({
        auth,
        summaryStats: [
          { label: "周平均", value: "2085kcal" },
          { label: "热量赤字", value: "-2240kcal" },
          { label: "周总碳水", value: "1630g" },
        ],
        meals: mealPlansInit,
        nutritionSummary: [
          { label: "蛋白质", value: "162g", color: "#4ADE80" },
          { label: "碳水", value: "268g", color: COLORS.secondary },
          { label: "脂肪", value: "52g", color: "#FB923C" },
        ],
        calendarPlans: {
          周一: "增肌方案A",
          周三: "高碳增肌",
          周五: "增肌方案A",
          周日: "高碳周末版",
        },
        aiItems: [
          {
            meal: "早餐",
            items: [
              { food: "燕麦粥", grams: "80g", kcal: "290kcal" },
              { food: "水煮蛋", grams: "60g", kcal: "86kcal" },
              { food: "蓝莓", grams: "100g", kcal: "57kcal" },
            ],
          },
          {
            meal: "午餐",
            items: [
              { food: "糙米饭", grams: "180g", kcal: "209kcal" },
              { food: "鸡胸肉", grams: "150g", kcal: "159kcal" },
              { food: "胡萝卜炒菜", grams: "120g", kcal: "58kcal" },
            ],
          },
          {
            meal: "晚餐",
            items: [
              { food: "红薯", grams: "150g", kcal: "129kcal" },
              { food: "牛里脊", grams: "100g", kcal: "107kcal" },
              { food: "蒸西兰花", grams: "150g", kcal: "51kcal" },
            ],
          },
        ]
      });
    }

    const mealDerived = buildMealCards(this.data.meals, this.data.mealSections);
    const calendarDays = buildCalendarDays(this.data.calendarPlans);
    this.setData({ mealCards: mealDerived.cards, mealTotalKcal: mealDerived.totalKcal, calendarDays });
  },

  onSelectSegment(event: any) {
    const value = String(event.currentTarget.dataset.value || "");
    if (!value) return;
    this.setData({ segment: value });
  },

  onSegmentChange(event: any) {
    const value = String(event.detail?.value || "");
    if (!value) return;
    this.setData({ segment: value });
  },

  onToggleCard(event: any) {
    const key = String(event.currentTarget.dataset.key || "");
    if (!key) return;
    const next = this.data.openCardKey === key ? "" : key;
    this.setData({ openCardKey: next });
  },

  onTapPicker() {
    wx.showToast({ title: "敬请期待", icon: "none" });
  },

  onTapAddMealItem() {
    wx.showToast({ title: "敬请期待", icon: "none" });
  },

  onRemoveMealItem(event: any) {
    const section = String(event.currentTarget.dataset.section || "");
    const index = Number(event.currentTarget.dataset.index);
    if (!section) return;
    if (Number.isNaN(index) || index < 0) return;

    const current = this.data.meals[section];
    if (!current) return;

    const nextItems = current.items.filter((_, i) => i !== index);
    const meals: Meals = { ...this.data.meals, [section]: { ...current, items: nextItems } };
    const mealDerived = buildMealCards(meals, this.data.mealSections);
    this.setData({ meals, mealCards: mealDerived.cards, mealTotalKcal: mealDerived.totalKcal });
  },

  onOpenAIDrawer() {
    this.setData({ showAIDrawer: true });
  },

  onCloseAIDrawer() {
    this.setData({ showAIDrawer: false });
  },

  onRegenerateAI() {
    wx.showToast({ title: "已重新生成（示例）", icon: "none" });
  },

  onAdoptAIPlan() {
    this.setData({ adopted: true, showAIDrawer: false });
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
    const type = String(event.currentTarget.dataset.type || "") as CarbonType;
    if (!day) return;
    if (!carbonInfo[type]) return;
    const pickerSelectedPlan = this.data.calendarPlans[day] || "";
    this.setData({ showPlanPicker: true, pickerDay: day, pickerType: type, pickerInfo: carbonInfo[type], pickerSelectedPlan });
  },

  onClosePlanPicker() {
    this.setData({ showPlanPicker: false, pickerDay: "" });
  },

  onSelectPlan(event: any) {
    const plan = String(event.currentTarget.dataset.plan || "");
    const day = this.data.pickerDay;
    if (!plan || !day) return;

    const calendarPlans = { ...this.data.calendarPlans, [day]: plan };
    const calendarDays = buildCalendarDays(calendarPlans);
    this.setData({ calendarPlans, calendarDays, showPlanPicker: false, pickerDay: "", pickerSelectedPlan: plan });
  },

  noop() {},
});
