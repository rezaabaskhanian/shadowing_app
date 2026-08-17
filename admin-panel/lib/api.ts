import type {
  AdminUsersResp,
  BroadcastItem,
  CreateScenePayload,
  Difficulty,
  GeneratedScene,
  LoginResponse,
  NotificationStatsResp,
  SceneResp,
  SceneSubmission,
  SettingsResp,
  SubscriptionPlan,
  TopicSuggestion,
} from "./types";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

const TOKEN_KEY = "shadowing_admin_token";
const ROLE_KEY = "shadowing_admin_role";
const NAME_KEY = "shadowing_admin_name";

// ---------- مدیریت توکن ----------
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}
export function getRole(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ROLE_KEY);
}
export function getName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(NAME_KEY);
}
export function saveSession(res: LoginResponse) {
  localStorage.setItem(TOKEN_KEY, res.tokens.access_token);
  localStorage.setItem(ROLE_KEY, res.user.role);
  localStorage.setItem(NAME_KEY, res.user.nickname);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(NAME_KEY);
}

// ---------- ابزار داخلی ----------
async function authFetch(path: string, opts: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(opts.headers || {});
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status === 401 || res.status === 403) {
    clearSession();
    if (typeof window !== "undefined") window.location.href = "/login";
    throw new Error("دسترسی نامعتبر است. لطفاً دوباره وارد شوید.");
  }
  return res;
}

async function jsonOrThrow(res: Response) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || "خطای ناشناخته");
  }
  return data;
}

// ---------- احراز هویت ----------
export async function login(
  phone: string,
  password: string
): Promise<LoginResponse> {
  const res = await fetch(`${API_BASE}/v1/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: phone, password_hash: password }),
  });
  return jsonOrThrow(res) as Promise<LoginResponse>;
}

// ---------- آپلود ----------
export async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("image", file);
  const res = await authFetch("/v1/admin/upload", { method: "POST", body: fd });
  const data = await jsonOrThrow(res);
  return data.url as string;
}

export async function uploadAudio(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("audio", file);
  const res = await authFetch("/v1/admin/upload-audio", {
    method: "POST",
    body: fd,
  });
  const data = await jsonOrThrow(res);
  return data.url as string;
}

// تولید صدای دیالوگ با هوش مصنوعی (ElevenLabs) — جایگزین آپلود دستی فایل صوتی
export async function generateAudio(
  text: string,
  voiceId?: string
): Promise<string> {
  const res = await authFetch("/v1/admin/generate-audio", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, voice_id: voiceId || "" }),
  });
  const data = await jsonOrThrow(res);
  return data.url as string;
}

export interface TTSVoice {
  voice_id: string;
  name: string;
  gender: string;
  accent: string;
}

export async function listTTSVoices(): Promise<TTSVoice[]> {
  const res = await authFetch("/v1/admin/tts-voices", { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data.voices || []) as TTSVoice[];
}

// ---------- تنظیمات (کلیدهای API) ----------
export async function getSettings(): Promise<SettingsResp> {
  const res = await authFetch("/v1/admin/settings", { method: "GET" });
  return jsonOrThrow(res) as Promise<SettingsResp>;
}

export async function updateSetting(key: string, value: string) {
  const res = await authFetch("/v1/admin/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ key, value }),
  });
  return jsonOrThrow(res);
}

// ---------- صحنه‌ها ----------
export async function createScene(payload: CreateScenePayload) {
  const res = await authFetch("/v1/admin/scenes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

// تولید محتوای صحنه با هوش مصنوعی (فقط برای پرکردن فرم؛ چیزی ذخیره نمی‌کند)
export async function generateScene(
  prompt: string,
  difficulty: Difficulty
): Promise<GeneratedScene> {
  const res = await authFetch("/v1/admin/generate-scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, difficulty }),
  });
  return jsonOrThrow(res) as Promise<GeneratedScene>;
}

export async function listScenes(): Promise<SceneResp[]> {
  const res = await authFetch("/v1/admin/scenes", { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data || []) as SceneResp[];
}

export async function getScene(id: string): Promise<SceneResp> {
  const res = await authFetch(`/v1/admin/scenes/${id}`, { method: "GET" });
  return jsonOrThrow(res) as Promise<SceneResp>;
}

export async function updateScene(id: string, payload: CreateScenePayload) {
  const res = await authFetch(`/v1/admin/scenes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function deleteScene(id: string) {
  const res = await authFetch(`/v1/admin/scenes/${id}`, { method: "DELETE" });
  return jsonOrThrow(res);
}

// ---------- نوتیفیکیشن‌ها ----------
export async function getNotificationStats(): Promise<NotificationStatsResp> {
  const res = await authFetch("/v1/admin/notifications/stats", { method: "GET" });
  return jsonOrThrow(res) as Promise<NotificationStatsResp>;
}

export async function sendBroadcast(
  title: string,
  body: string
): Promise<{ sent_count: number; message: string }> {
  const res = await authFetch("/v1/admin/notifications/broadcast", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, body }),
  });
  return jsonOrThrow(res);
}

export async function listBroadcasts(): Promise<BroadcastItem[]> {
  const res = await authFetch("/v1/admin/notifications/broadcasts", { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data.broadcasts || []) as BroadcastItem[];
}

// ---------- پیشنهادهای صحنه توسط کاربران ----------
export async function listSceneSubmissions(
  status?: string
): Promise<SceneSubmission[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await authFetch(`/v1/admin/scene-submissions${qs}`, { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data.submissions || []) as SceneSubmission[];
}

export async function approveSceneSubmission(
  id: string,
  payload: CreateScenePayload
): Promise<{ scene: SceneResp; points_awarded: number }> {
  const res = await authFetch(`/v1/admin/scene-submissions/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function rejectSceneSubmission(id: string, note: string) {
  const res = await authFetch(`/v1/admin/scene-submissions/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  return jsonOrThrow(res);
}

// ---------- پیشنهادهای موضوع توسط کاربران ----------
export async function listTopicSuggestions(
  status?: string
): Promise<TopicSuggestion[]> {
  const qs = status ? `?status=${status}` : "";
  const res = await authFetch(`/v1/admin/topic-suggestions${qs}`, { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data.suggestions || []) as TopicSuggestion[];
}

export async function getTopicSuggestion(id: string): Promise<TopicSuggestion> {
  const res = await authFetch(`/v1/admin/topic-suggestions/${id}`, { method: "GET" });
  return jsonOrThrow(res) as Promise<TopicSuggestion>;
}

// ---------- کاربران و فعالیتشون ----------
export async function listUsers(params: {
  limit?: number;
  offset?: number;
  search?: string;
}): Promise<AdminUsersResp> {
  const qs = new URLSearchParams();
  if (params.limit) qs.set("limit", String(params.limit));
  if (params.offset) qs.set("offset", String(params.offset));
  if (params.search) qs.set("search", params.search);

  const res = await authFetch(`/v1/admin/users?${qs.toString()}`, { method: "GET" });
  return jsonOrThrow(res);
}

export async function approveTopicSuggestion(
  id: string,
  payload: CreateScenePayload
): Promise<{ scene: SceneResp; points_awarded: number }> {
  const res = await authFetch(`/v1/admin/topic-suggestions/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return jsonOrThrow(res);
}

export async function rejectTopicSuggestion(id: string, note: string) {
  const res = await authFetch(`/v1/admin/topic-suggestions/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ note }),
  });
  return jsonOrThrow(res);
}

// ---------- طرح‌های اشتراک ----------
export async function listSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const res = await authFetch("/v1/admin/subscription-plans", { method: "GET" });
  const data = await jsonOrThrow(res);
  return (data.plans || []) as SubscriptionPlan[];
}

export async function createSubscriptionPlan(
  name: string,
  durationDays: number,
  priceToman: number
): Promise<SubscriptionPlan> {
  const res = await authFetch("/v1/admin/subscription-plans", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, duration_days: durationDays, price_toman: priceToman }),
  });
  return jsonOrThrow(res);
}

export async function deleteSubscriptionPlan(id: string) {
  const res = await authFetch(`/v1/admin/subscription-plans/${id}`, { method: "DELETE" });
  return jsonOrThrow(res);
}

export async function grantSubscription(
  phone: string,
  planId: string,
  pointsToRedeem: number
) {
  const res = await authFetch("/v1/admin/subscriptions/grant", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, plan_id: planId, points_to_redeem: pointsToRedeem }),
  });
  return jsonOrThrow(res);
}
