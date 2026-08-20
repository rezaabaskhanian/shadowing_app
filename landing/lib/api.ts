import type { LandingContent } from "./types";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8088";

const emptySettings = {
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  google_play_url: "",
  bazaar_url: "",
  cta_title: "",
  cta_subtitle: "",
};

// no-store: این محتوا از پنل ادمین لحظه‌ای تغییر می‌کند، صفحه‌ی معرفی
// نباید نسخه‌ی کش‌شده نشون بده.
export async function fetchLandingContent(): Promise<LandingContent> {
  const fallback: LandingContent = {
    sections: [],
    settings: emptySettings,
    highlights: { features: [], steps: [] },
    faqs: [],
  };

  const res = await fetch(`${API_BASE}/v1/public/landing-sections`, {
    cache: "no-store",
  });
  if (!res.ok) return fallback;
  const data = await res.json().catch(() => ({}));
  return {
    sections: data.sections || [],
    settings: data.settings || emptySettings,
    highlights: data.highlights || { features: [], steps: [] },
    faqs: data.faqs || [],
  };
}
