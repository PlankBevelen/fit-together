export type GoalType = "cut" | "bulk" | "maintain";

export type ProfileDraft = {
  name?: string;
  avatarUrl?: string;
  gender?: "male" | "female" | "other";
  birthday?: string;
  bio?: string;
  birthYear?: string;
  heightCm?: string;
  weightKg?: string;
  targetWeightKg?: string;
  goal?: GoalType;
  updatedAt: number;
};

const STORAGE_KEYS = {
  token: "ft_token",
  profile: "ft_profile",
  profileDraft: "ft_profile_draft",
  loginPromptDismissed: "ft_login_prompt_dismissed_v1",
  profilePromptDismissed: "ft_profile_prompt_dismissed_v1",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeGoal(value: unknown): GoalType | undefined {
  if (value === "cut" || value === "bulk" || value === "maintain") return value;
  return undefined;
}

function normalizeGender(value: unknown): "male" | "female" | "other" | undefined {
  if (value === "male" || value === "female" || value === "other") return value;
  return undefined;
}

function readProfile(key: string): ProfileDraft | undefined {
  const raw = wx.getStorageSync(key) as unknown;
  if (!isRecord(raw)) return undefined;

  const updatedAt = typeof raw.updatedAt === "number" ? raw.updatedAt : Date.now();
  const draft: ProfileDraft = { updatedAt };

  if (typeof raw.name === "string") draft.name = raw.name;
  if (typeof raw.avatarUrl === "string") draft.avatarUrl = raw.avatarUrl;
  if (typeof raw.birthday === "string") draft.birthday = raw.birthday;
  if (typeof raw.bio === "string") draft.bio = raw.bio;
  if (typeof raw.birthYear === "string") draft.birthYear = raw.birthYear;
  if (typeof raw.heightCm === "string") draft.heightCm = raw.heightCm;
  if (typeof raw.weightKg === "string") draft.weightKg = raw.weightKg;
  if (typeof raw.targetWeightKg === "string") draft.targetWeightKg = raw.targetWeightKg;
  draft.goal = normalizeGoal(raw.goal);
  draft.gender = normalizeGender(raw.gender);

  return draft;
}

function writeProfile(key: string, next: ProfileDraft) {
  wx.setStorageSync(key, next);
}

export function getAuthState() {
  const token = wx.getStorageSync(STORAGE_KEYS.token) as unknown;
  const isLoggedIn = Boolean(token && String(token).length > 0);
  return { isLoggedIn };
}

export function setToken(token: string) {
  wx.setStorageSync(STORAGE_KEYS.token, token);
}

export function clearToken() {
  wx.removeStorageSync(STORAGE_KEYS.token);
}

export function getProfileState(isLoggedIn: boolean) {
  const profile = readProfile(isLoggedIn ? STORAGE_KEYS.profile : STORAGE_KEYS.profileDraft);
  const isComplete = isProfileComplete(profile);
  return { profile, isComplete };
}

export function saveProfile(nextPartial: Partial<ProfileDraft>, isLoggedIn: boolean) {
  const key = isLoggedIn ? STORAGE_KEYS.profile : STORAGE_KEYS.profileDraft;
  const current = readProfile(key);
  const next: ProfileDraft = {
    updatedAt: Date.now(),
    ...current,
    ...nextPartial,
    goal: nextPartial.goal ?? current?.goal,
    gender: nextPartial.gender ?? current?.gender,
  };
  writeProfile(key, next);
  return next;
}

export function isProfileComplete(profile?: ProfileDraft) {
  if (!profile) return false;
  if (!profile.heightCm) return false;
  if (!profile.weightKg) return false;
  if (!profile.targetWeightKg) return false;
  if (!profile.gender) return false;
  return true;
}

export function isLoginPromptDismissed() {
  const value = wx.getStorageSync(STORAGE_KEYS.loginPromptDismissed) as unknown;
  return Boolean(value);
}

export function dismissLoginPrompt() {
  wx.setStorageSync(STORAGE_KEYS.loginPromptDismissed, true);
}

export function isProfilePromptDismissed() {
  const value = wx.getStorageSync(STORAGE_KEYS.profilePromptDismissed) as unknown;
  return Boolean(value);
}

export function dismissProfilePrompt() {
  wx.setStorageSync(STORAGE_KEYS.profilePromptDismissed, true);
}
