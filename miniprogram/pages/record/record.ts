type RecordImage = { path: string };

type StoredCheckin = {
  id: string;
  date: string;
  weight: string;
  waist: string;
  note: string;
  followPlan: boolean;
  images: RecordImage[];
};

const STORAGE_IMAGES_KEY = "record_images";
const STORAGE_CHECKINS_KEY = "record_checkins";

function safeParseJSON<T>(value: any, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}

function todayKey() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getUserSavedImagePath(tempFilePath: string): Promise<string> {
  const fs = wx.getFileSystemManager();
  return new Promise((resolve, reject) => {
    fs.saveFile({
      tempFilePath,
      success: (res) => resolve(res.savedFilePath),
      fail: reject,
    });
  });
}

function ensureAlbumPermission(): Promise<void> {
  return new Promise((resolve, reject) => {
    wx.getSetting({
      success: (settingRes) => {
        const auth = (settingRes as any).authSetting || {};
        if (auth["scope.writePhotosAlbum"]) {
          resolve();
          return;
        }
        wx.authorize({
          scope: "scope.writePhotosAlbum",
          success: () => resolve(),
          fail: () => {
            wx.showModal({
              title: "需要相册权限",
              content: "保存图片到相册需要授权，请在设置中开启。",
              confirmText: "去设置",
              cancelText: "取消",
              success: (modalRes) => {
                if (!modalRes.confirm) {
                  reject(new Error("permission denied"));
                  return;
                }
                wx.openSetting({
                  success: (openRes) => {
                    const nextAuth = (openRes as any).authSetting || {};
                    if (nextAuth["scope.writePhotosAlbum"]) resolve();
                    else reject(new Error("permission denied"));
                  },
                  fail: () => reject(new Error("openSetting failed")),
                });
              },
              fail: () => reject(new Error("modal failed")),
            });
          },
        });
      },
      fail: () => reject(new Error("getSetting failed")),
    });
  });
}

Page({
  data: {
    colors: {
      primary: "#3730A3",
      secondary: "#6366F1",
      success: "#059669",
      warning: "#D97706",
    },

    segments: ["打卡", "趋势"],
    segment: "打卡",

    submitted: false,
    lastWeight: "71.2",
    weight: "71.0",
    followPlan: true,
    showMore: false,
    waist: "",
    note: "",

    images: [] as RecordImage[],

    toastMessage: "",
    toastType: "success" as "success" | "error",

    weightTrend: [
      { date: "3/18", weight: 71.2, target: 70.0 },
      { date: "3/19", weight: 71.3, target: 69.8 },
      { date: "3/20", weight: 71.0, target: 69.6 },
      { date: "3/21", weight: 71.2, target: 69.4 },
    ],
    proteinTrend: [
      { date: "3/16", rate: 85, label: "周一" },
      { date: "3/17", rate: 92, label: "周二" },
      { date: "3/18", rate: 78, label: "周三" },
      { date: "3/19", rate: 100, label: "周四" },
      { date: "3/20", rate: 95, label: "周五" },
      { date: "3/21", rate: 88, label: "周六" },
      { date: "3/22", rate: 72, label: "今日" },
    ],
    historyRecords: [
      { date: "3/21 周六", summary: "体重 71.2kg · 蛋白质 142g", change: -0.2, achieved: true },
      { date: "3/20 周五", summary: "体重 71.4kg · 蛋白质 138g", change: -0.4, achieved: true },
      { date: "3/19 周四", summary: "体重 71.8kg · 蛋白质 155g", change: +0.1, achieved: false },
      { date: "3/18 周三", summary: "体重 71.7kg · 蛋白质 128g", change: -0.2, achieved: true },
      { date: "3/17 周二", summary: "体重 71.9kg · 蛋白质 133g", change: -0.6, achieved: true },
    ],
  },

  onLoad() {
    const images = this.loadImages();
    this.setData({ images });
  },

  loadImages() {
    const raw = wx.getStorageSync(STORAGE_IMAGES_KEY);
    const parsed = safeParseJSON<RecordImage[]>(raw, []);
    return Array.isArray(parsed) ? parsed.filter((x) => x && typeof (x as any).path === "string") : [];
  },

  saveImages(images: RecordImage[]) {
    wx.setStorageSync(STORAGE_IMAGES_KEY, JSON.stringify(images));
  },

  showToast(message: string, type: "success" | "error" = "success") {
    this.setData({ toastMessage: message, toastType: type });
    setTimeout(() => {
      this.setData({ toastMessage: "" });
    }, 2500);
  },

  onSegmentChange(event: any) {
    const value = String(event.detail?.value || "");
    if (!value) return;
    this.setData({ segment: value });
  },

  onWeightInput(event: any) {
    this.setData({ weight: String(event.detail?.value || "") });
  },

  onToggleFollowPlan() {
    this.setData({ followPlan: !this.data.followPlan });
  },

  onToggleMore() {
    this.setData({ showMore: !this.data.showMore });
  },

  onWaistInput(event: any) {
    this.setData({ waist: String(event.detail?.value || "") });
  },

  onNoteInput(event: any) {
    this.setData({ note: String(event.detail?.value || "") });
  },

  async onChooseImages() {
    try {
      const chooseMedia = (wx as any).chooseMedia;
      const chooseImage = (wx as any).chooseImage;

      const tempFilePaths: string[] = await new Promise((resolve, reject) => {
        if (typeof chooseMedia === "function") {
          chooseMedia({
            count: 9,
            mediaType: ["image"],
            sourceType: ["album", "camera"],
            success: (res: any) => {
              const files = (res?.tempFiles || []).map((f: any) => String(f?.tempFilePath || "")).filter(Boolean);
              resolve(files);
            },
            fail: reject,
          });
          return;
        }
        chooseImage({
          count: 9,
          sizeType: ["compressed"],
          sourceType: ["album", "camera"],
          success: (res: any) => resolve((res?.tempFilePaths || []).map((p: any) => String(p)).filter(Boolean)),
          fail: reject,
        });
      });

      if (!tempFilePaths.length) return;

      const savedPaths: string[] = [];
      for (const p of tempFilePaths) {
        const saved = await getUserSavedImagePath(p);
        savedPaths.push(saved);
      }

      const next = [...this.data.images, ...savedPaths.map((p) => ({ path: p }))];
      this.setData({ images: next });
      this.saveImages(next);
      this.showToast("已添加照片", "success");
    } catch {
      this.showToast("添加失败", "error");
    }
  },

  onPreviewImage(event: any) {
    const current = String(event.currentTarget?.dataset?.path || "");
    if (!current) return;
    const urls = this.data.images.map((x) => x.path);
    wx.previewImage({ urls, current });
  },

  onRemoveImage(event: any) {
    const path = String(event.currentTarget?.dataset?.path || "");
    if (!path) return;
    const next = this.data.images.filter((x) => x.path !== path);
    this.setData({ images: next });
    this.saveImages(next);
    this.showToast("已删除", "success");
  },

  async onSaveImage(event: any) {
    const path = String(event.currentTarget?.dataset?.path || "");
    if (!path) return;
    try {
      await ensureAlbumPermission();
      await new Promise<void>((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: path,
          success: () => resolve(),
          fail: reject,
        });
      });
      this.showToast("已保存到相册", "success");
    } catch {
      this.showToast("保存失败", "error");
    }
  },

  async onSaveAllImages() {
    if (!this.data.images.length) return;
    try {
      await ensureAlbumPermission();
      for (const img of this.data.images) {
        await new Promise<void>((resolve, reject) => {
          wx.saveImageToPhotosAlbum({
            filePath: img.path,
            success: () => resolve(),
            fail: reject,
          });
        });
      }
      this.showToast("已全部保存到相册", "success");
    } catch {
      this.showToast("保存失败", "error");
    }
  },

  onSubmit() {
    const record: StoredCheckin = {
      id: uuid(),
      date: todayKey(),
      weight: String(this.data.weight || ""),
      waist: String(this.data.waist || ""),
      note: String(this.data.note || ""),
      followPlan: Boolean(this.data.followPlan),
      images: this.data.images,
    };

    const raw = wx.getStorageSync(STORAGE_CHECKINS_KEY);
    const list = safeParseJSON<StoredCheckin[]>(raw, []);
    const next = [record, ...(Array.isArray(list) ? list : [])].slice(0, 60);
    wx.setStorageSync(STORAGE_CHECKINS_KEY, JSON.stringify(next));

    this.setData({ submitted: true, lastWeight: String(this.data.weight || this.data.lastWeight) });
    this.showToast("打卡成功 · 继续保持！", "success");
  },
});

