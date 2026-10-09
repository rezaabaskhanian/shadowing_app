"use client";

import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import {
  deleteSpeakingTopic,
  listSpeakingTopics,
  saveSpeakingTopic,
  suggestSpeakingTopic,
} from "@/lib/api";
import type { SpeakingTopic, SpeakingTopicLevel } from "@/lib/types";

const LEVELS: { id: SpeakingTopicLevel; label: string }[] = [
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
];

const DURATIONS = [30, 45, 60, 90, 120];

type Draft = {
  id?: string;
  title: string;
  prompt_fa: string;
  guide_questions: string; // هر سؤال در یک خط
  useful_phrases: string; // هر عبارت در یک خط
  level: SpeakingTopicLevel;
  duration_seconds: number;
  position: number;
  is_active: boolean;
  image_url: string;
};

const emptyDraft = (position = 0): Draft => ({
  title: "",
  prompt_fa: "",
  guide_questions: "",
  useful_phrases: "",
  level: "beginner",
  duration_seconds: 60,
  position,
  is_active: true,
  image_url: "",
});

const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/**
 * مدیریت موضوع‌های «صحبت درباره‌ی یک موضوع» (۱ تا ۲ دقیقه): کاربر در اپ درباره‌ی
 * موضوع صحبت می‌کند و AI صحبتش را بررسی می‌کند. «پیشنهاد با AI» از یک ایده‌ی
 * کوتاه، عنوان، توضیح فارسی، سؤال‌های راهنما و عبارت‌های مفید را پر می‌کند.
 */
export default function SpeakingTopicsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [topics, setTopics] = useState<SpeakingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTopics(await listSpeakingTopics());
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function edit(t: SpeakingTopic) {
    setDraft({
      id: t.id,
      title: t.title,
      prompt_fa: t.prompt_fa,
      guide_questions: t.guide_questions.join("\n"),
      useful_phrases: t.useful_phrases.join("\n"),
      level: t.level,
      duration_seconds: t.duration_seconds,
      position: t.position,
      is_active: t.is_active,
      image_url: t.image_url || "",
    });
    setIdea("");
  }

  async function handleSuggest() {
    if (!draft || !idea.trim()) return;
    setSuggesting(true);
    try {
      const s = await suggestSpeakingTopic(idea, draft.level);
      setDraft({
        ...draft,
        title: s.title || draft.title,
        prompt_fa: s.prompt_fa || draft.prompt_fa,
        guide_questions: (s.guide_questions || []).join("\n"),
        useful_phrases: (s.useful_phrases || []).join("\n"),
      });
      notify("پیشنهاد AI آماده شد؛ بررسی و ویرایش کن و بعد ذخیره کن.");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSuggesting(false);
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveSpeakingTopic({
        id: draft.id,
        title: draft.title,
        prompt_fa: draft.prompt_fa,
        guide_questions: lines(draft.guide_questions),
        useful_phrases: lines(draft.useful_phrases),
        level: draft.level,
        duration_seconds: draft.duration_seconds,
        position: draft.position,
        is_active: draft.is_active,
        image_url: draft.image_url,
      });
      notify("موضوع ذخیره شد");
      setDraft(null);
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(t: SpeakingTopic) {
    if (!confirm(`موضوع «${t.title}» و همه‌ی تلاش‌های کاربران روی آن حذف شود؟`)) return;
    try {
      await deleteSpeakingTopic(t.id);
      notify("حذف شد");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  const levelLabel = (l: string) => LEVELS.find((x) => x.id === l)?.label ?? l;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>🎤 صحبت درباره‌ی یک موضوع</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              کاربر در اپ (منوی کناری) یک تا دو دقیقه درباره‌ی موضوع صحبت می‌کند و AI امتیاز، اشتباه‌های گرامری با
              توضیح، عبارت‌های بهتر و نسخه‌ی بهترشده‌ی صحبتش را نشان می‌دهد. فقط موضوع‌های «فعال» در اپ دیده می‌شوند.
            </p>
          </div>
          {!draft && (
            <button className="btn btn-sm" onClick={() => setDraft(emptyDraft(topics.length))}>
              + موضوع جدید
            </button>
          )}
        </div>
      </div>

      {draft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش موضوع" : "موضوع جدید"}</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
            <input
              placeholder="ایده‌ی کوتاه، مثلاً «بهترین سفرم» یا «کار روزانه‌ام»"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              style={{ flex: 1, minWidth: 240 }}
            />
            <button className="btn btn-sm btn-ghost" onClick={handleSuggest} disabled={suggesting || !idea.trim()}>
              {suggesting ? "در حال ساخت..." : "✨ پیشنهاد با AI"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <label>عنوان (انگلیسی)</label>
              <input
                dir="ltr"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="My best trip"
              />
            </div>
            <div>
              <label>سطح</label>
              <select
                value={draft.level}
                onChange={(e) => setDraft({ ...draft, level: e.target.value as SpeakingTopicLevel })}
              >
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>مدت صحبت</label>
              <select
                value={draft.duration_seconds}
                onChange={(e) => setDraft({ ...draft, duration_seconds: Number(e.target.value) })}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} ثانیه
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 90 }}>
              <label>ترتیب</label>
              <input
                type="number"
                value={draft.position}
                onChange={(e) => setDraft({ ...draft, position: Number(e.target.value) || 0 })}
              />
            </div>
          </div>

          <ImageField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} notify={notify} />

          <label>توضیح فارسی برای کاربر (درباره‌ی چه بگوید)</label>
          <textarea
            rows={2}
            value={draft.prompt_fa}
            onChange={(e) => setDraft({ ...draft, prompt_fa: e.target.value })}
            placeholder="درباره‌ی بهترین سفری که رفتی صحبت کن: کجا رفتی، با کی، و چه چیزی برایت جالب بود."
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px" }}>
              <label>سؤال‌های راهنما (انگلیسی، هر خط یک سؤال)</label>
              <textarea
                dir="ltr"
                rows={6}
                value={draft.guide_questions}
                onChange={(e) => setDraft({ ...draft, guide_questions: e.target.value })}
                placeholder={"Where did you go?\nWho did you go with?"}
              />
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <label>عبارت‌ها/ساختارهای پیشنهادی (هر خط یکی)</label>
              <textarea
                dir="ltr"
                rows={6}
                value={draft.useful_phrases}
                onChange={(e) => setDraft({ ...draft, useful_phrases: e.target.value })}
                placeholder={"Last summer, I went to ...\nThe best part was ..."}
              />
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
              style={{ width: "auto" }}
            />
            فعال (در اپ نمایش داده شود)
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={handleSave} disabled={saving || !draft.title.trim()}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={saving}>
              انصراف
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : topics.length === 0 ? (
          <p className="hint">هنوز موضوعی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {topics.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: t.is_active ? 1 : 0.55,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }} dir="ltr">
                    {t.title}
                  </div>
                  <div className="hint" style={{ margin: 0 }}>
                    {levelLabel(t.level)} · {t.duration_seconds} ثانیه · {t.guide_questions.length} سؤال ·{" "}
                    {t.useful_phrases.length} عبارت{t.is_active ? "" : " · غیرفعال"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => edit(t)}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(t)}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
