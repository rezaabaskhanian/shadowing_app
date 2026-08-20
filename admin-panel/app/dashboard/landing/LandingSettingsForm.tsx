"use client";

import { useEffect, useState } from "react";
import { API_BASE, getLandingSettings, updateLandingSettings, uploadImage } from "@/lib/api";
import type { LandingSettings } from "@/lib/types";

const emptySettings: LandingSettings = {
  hero_title: "",
  hero_subtitle: "",
  hero_image_url: "",
  google_play_url: "",
  bazaar_url: "",
  cta_title: "",
  cta_subtitle: "",
};

export default function LandingSettingsForm({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [form, setForm] = useState<LandingSettings>(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setForm(await getLandingSettings());
      } catch (err: any) {
        notify(err.message, "err");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function set<K extends keyof LandingSettings>(key: K, value: LandingSettings[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateLandingSettings(form);
      notify("تنظیمات ذخیره شد ✅", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeroUpload(file: File) {
    setUploadingHero(true);
    try {
      const url = await uploadImage(file);
      set("hero_image_url", url);
      notify("عکس هیرو آپلود شد — یادت نره ذخیره کنی", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setUploadingHero(false);
    }
  }

  if (loading) return <p className="hint">در حال بارگذاری...</p>;

  const heroImageSrc = form.hero_image_url
    ? form.hero_image_url.startsWith("http")
      ? form.hero_image_url
      : `${API_BASE}${form.hero_image_url}`
    : "";

  return (
    <div className="card" style={{ borderColor: "#7C3DFF" }}>
      <h2 style={{ marginTop: 0 }}>⚙️ تنظیمات کلی صفحه‌ی معرفی</h2>
      <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
        عنوان/توضیح هیرو (بالای صفحه)، لینک‌های دانلود (که هم توی هیرو هم توی
        بنر پایانی و فوتر نمایش داده می‌شوند) و متن بنر پایانی.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
        <label className="hint">عنوان هیرو</label>
        <input
          placeholder="مثلاً «یادگیری زبان با روش شدوئینگ»"
          value={form.hero_title}
          onChange={(e) => set("hero_title", e.target.value)}
        />

        <label className="hint">توضیح هیرو</label>
        <textarea
          placeholder="یک یا دو جمله زیر تیتر اصلی"
          rows={3}
          value={form.hero_subtitle}
          onChange={(e) => set("hero_subtitle", e.target.value)}
        />

        <label className="hint">عکس هیرو (اسکرین‌شات اپ)</label>
        {heroImageSrc && (
          <img
            src={heroImageSrc}
            alt=""
            style={{ width: 120, height: 240, objectFit: "cover", borderRadius: 16, border: "1px solid #333" }}
          />
        )}
        <label className="btn btn-ghost btn-sm" style={{ display: "inline-block", cursor: "pointer", width: "fit-content" }}>
          {uploadingHero ? "در حال آپلود..." : heroImageSrc ? "تغییر عکس" : "+ افزودن عکس"}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            disabled={uploadingHero}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleHeroUpload(file);
              e.target.value = "";
            }}
          />
        </label>

        <hr style={{ margin: "8px 0", opacity: 0.2 }} />

        <label className="hint">لینک دانلود Google Play</label>
        <input
          placeholder="https://play.google.com/store/apps/details?id=..."
          value={form.google_play_url}
          onChange={(e) => set("google_play_url", e.target.value)}
        />

        <label className="hint">لینک دانلود کافه بازار</label>
        <input
          placeholder="https://cafebazaar.ir/app/..."
          value={form.bazaar_url}
          onChange={(e) => set("bazaar_url", e.target.value)}
        />

        <hr style={{ margin: "8px 0", opacity: 0.2 }} />

        <label className="hint">عنوان بنر پایانی صفحه</label>
        <input
          placeholder="مثلاً «همین حالا شروع کن»"
          value={form.cta_title}
          onChange={(e) => set("cta_title", e.target.value)}
        />

        <label className="hint">توضیح بنر پایانی صفحه</label>
        <textarea
          placeholder="یک جمله‌ی کوتاه دعوت‌کننده"
          rows={2}
          value={form.cta_subtitle}
          onChange={(e) => set("cta_subtitle", e.target.value)}
        />

        <button className="btn btn-sm" onClick={handleSave} disabled={saving} style={{ width: "fit-content", marginTop: 8 }}>
          {saving ? "..." : "ذخیره تنظیمات"}
        </button>
      </div>
    </div>
  );
}
