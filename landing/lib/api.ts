import type { LandingSection } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

// no-store: این محتوا از پنل ادمین لحظه‌ای تغییر می‌کند، صفحه‌ی معرفی
// نباید نسخه‌ی کش‌شده نشون بده.
export async function fetchLandingSections(): Promise<LandingSection[]> {
  const res = await fetch(`${API_BASE}/v1/public/landing-sections`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return (data.sections || []) as LandingSection[];
}
