import type {
  CreateScenePayload,
  Difficulty,
  GeneratedScene,
  LoginResponse,
  SceneResp,
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

export async function deleteScene(id: string) {
  const res = await authFetch(`/v1/admin/scenes/${id}`, { method: "DELETE" });
  return jsonOrThrow(res);
}
