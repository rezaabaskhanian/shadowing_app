"use client";

import { useState } from "react";
import LandingSettingsForm from "./landing/LandingSettingsForm";
import LandingHighlightsList from "./landing/LandingHighlightsList";
import LandingSectionsList from "./landing/LandingSectionsList";
import LandingFAQsList from "./landing/LandingFAQsList";

type SubTab = "settings" | "features" | "steps" | "sections" | "faqs";

const SUB_TABS: { key: SubTab; label: string }[] = [
  { key: "settings", label: "تنظیمات کلی" },
  { key: "features", label: "چرا LingoFlow" },
  { key: "steps", label: "چطور کار می‌کنه" },
  { key: "sections", label: "بخش‌های تکمیلی" },
  { key: "faqs", label: "سوالات متداول" },
];

export default function LandingSectionsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [subTab, setSubTab] = useState<SubTab>("settings");

  return (
    <div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`tab-btn ${subTab === t.key ? "active" : ""}`}
            onClick={() => setSubTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "settings" && <LandingSettingsForm notify={notify} />}
      {subTab === "features" && (
        <LandingHighlightsList
          kind="feature"
          title="چرا LingoFlow"
          hint="نوار ۳ فیچر کوتاه که بالای صفحه، زیر هیرو نمایش داده می‌شود (مثلاً: تمرین هدایت‌شده، شدوئینگ خط‌به‌خط، همه‌ی زبان‌ها)."
          notify={notify}
        />
      )}
      {subTab === "steps" && (
        <LandingHighlightsList
          kind="step"
          title="چطور کار می‌کنه"
          hint="کارت‌های شماره‌دار «چطور کار می‌کنه» (مثلاً: انتخاب صحنه → گوش دادن/سایه‌زدن/ضبط/مقایسه → تکرار)."
          notify={notify}
        />
      )}
      {subTab === "sections" && <LandingSectionsList notify={notify} />}
      {subTab === "faqs" && <LandingFAQsList notify={notify} />}
    </div>
  );
}
