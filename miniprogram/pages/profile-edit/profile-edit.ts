import { getAuthState, getProfileState, saveProfile, type ProfileDraft } from "../../utils/UserState";
import { request } from "../../utils/request";

Page({
  data: {
    form: {
      avatarUrl: "",
      name: "",
      genderIndex: 0,
      birthday: "",
      bio: "",
    },
    genderOptions: ["男", "女", "其他"],
    genderValues: ["male", "female", "other"],
    isLoggedIn: false,
  },

  onLoad() {
    const auth = getAuthState();
    const { profile } = getProfileState(auth.isLoggedIn);
    
    let genderIndex = 0;
    if (profile?.gender === "female") genderIndex = 1;
    if (profile?.gender === "other") genderIndex = 2;

    this.setData({
      isLoggedIn: auth.isLoggedIn,
      form: {
        avatarUrl: profile?.avatarUrl || "",
        name: profile?.name || "",
        genderIndex,
        birthday: profile?.birthday || "",
        bio: profile?.bio || "",
      },
    });
  },

  onChooseAvatar(e: any) {
    const { avatarUrl } = e.detail;
    this.setData({
      'form.avatarUrl': avatarUrl
    });
  },

  onFormInput(event: any) {
    const field = String(event.currentTarget.dataset.field || "");
    const value = String(event.detail.value || "");
    if (!field) return;
    this.setData({ [`form.${field}`]: value });
  },

  onGenderChange(event: any) {
    const index = Number(event.detail.value);
    if (Number.isNaN(index) || index < 0) return;
    this.setData({ "form.genderIndex": index });
  },

  onBirthdayChange(event: any) {
    this.setData({ "form.birthday": event.detail.value });
  },

  async onTapSave() {
    const form = this.data.form;
    const avatarUrl = String(form.avatarUrl || "").trim();
    const name = String(form.name || "").trim();
    const bio = String(form.bio || "").trim();
    const birthday = String(form.birthday || "").trim();
    const gender = this.data.genderValues[form.genderIndex] as "male" | "female" | "other";

    if (!name) {
      wx.showToast({ title: "请填写昵称", icon: "none" });
      return;
    }

    const payload: Partial<ProfileDraft> = { avatarUrl, name, gender, birthday, bio };

    if (this.data.isLoggedIn) {
      wx.showLoading({ title: '保存中...' });
      try {
        const response = await request({
          url: '/user/profile',
          method: 'PUT',
          data: payload,
        });
        if (response.status === 'success') {
          saveProfile(payload, true);
          wx.showToast({ title: "保存成功", icon: "success" });
          setTimeout(() => wx.navigateBack(), 1500);
        } else {
          wx.showToast({ title: "保存失败", icon: "none" });
        }
      } catch (error) {
        wx.showToast({ title: "保存失败", icon: "none" });
      } finally {
        wx.hideLoading();
      }
    } else {
      saveProfile(payload, false);
      wx.showToast({ title: "已保存草稿", icon: "success" });
      setTimeout(() => wx.navigateBack(), 1500);
    }
  },
});