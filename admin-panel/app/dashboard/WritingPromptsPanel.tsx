"use client";

import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import { deleteWritingPrompt, listWritingPrompts, saveWritingPrompt, suggestWritingPrompt } from "@/lib/api";
import type { SpeakingTopicLevel, WritingPrompt } from "@/lib/types";

const LEVELS: { id: SpeakingTopicLevel; label: string }[] = [
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
];


type Draft = {
  id?: string;
  title: string;
  prompt_fa: string;
  guide_questions: string; // هر سؤال در یک خط
  useful_phrases: string; // هر عبارت در یک خط
  level: SpeakingTopicLevel;
  min_words: number;
  max_words: number;
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
  min_words: 40,
  max_words: 150,
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
 * مدیریت موضوع‌های «تمرین نوشتن»: کاربر در اپ یک داستان/متن کوتاه می‌نویسد و AI
 * آن را تصحیح می‌کند. «پیشنهاد با AI» از یک ایده‌ی کوتاه، عنوان، توضیح فارسی،
 * ایده‌های داستان و ساختارهای پیشنهادی را پر می‌کند.
 */
export default function WritingPromptsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [topics, setTopics] = useState<WritingPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [idea, setIdea] = useState("");
  const [suggesting, setSuggesting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setTopics(await listWritingPrompts());
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

  function edit(t: WritingPrompt) {
    setDraft({
      id: t.id,
      title: t.title,
      prompt_fa: t.prompt_fa,
      guide_questions: t.guide_questions.join("\n"),
      useful_phrases: t.useful_phrases.join("\n"),
      level: t.level,
      min_words: t.min_words,
      max_words: t.max_words,
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
      const s = await suggestWritingPrompt(idea, draft.level);
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
      await saveWritingPrompt({
        id: draft.id,
        title: draft.title,
        prompt_fa: draft.prompt_fa,
        guide_questions: lines(draft.guide_questions),
        useful_phrases: lines(draft.useful_phrases),
        level: draft.level,
        min_words: draft.min_words,
        max_words: draft.max_words,
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

  async function handleDelete(t: WritingPrompt) {
    if (!confirm(`موضوع «${t.title}» و همه‌ی تلاش‌های کاربران روی آن حذف شود؟`)) return;
    try {
      await deleteWritingPrompt(t.id);
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
            <h2 style={{ margin: 0 }}>✍️ تمرین نوشتن</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              کاربر در اپ (منوی کناری) درباره‌ی موضوع یک داستان/متن کوتاه می‌نویسد و AI اشتباه‌ها را با توضیح گرامری،
              عبارت‌های بهتر، ساختارهایی که بهتر است استفاده کند و نسخه‌ی بهترشده را نشان می‌دهد. فقط موضوع‌های «فعال» در
              اپ دیده می‌شوند.
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
              placeholder="ایده‌ی کوتاه، مثلاً «روزی که گم شدم» یا «یک دوست خاص»"
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
                placeholder="A day I will never forget"
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
            <div style={{ width: 110 }}>
              <label>حداقل کلمه</label>
              <input
                type="number"
                value={draft.min_words}
                onChange={(e) => setDraft({ ...draft, min_words: Number(e.target.value) || 0 })}
              />
            </div>
            <div style={{ width: 110 }}>
              <label>حداکثر کلمه</label>
              <input
                type="number"
                value={draft.max_words}
                onChange={(e) => setDraft({ ...draft, max_words: Number(e.target.value) || 0 })}
              />
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

          <label>توضیح فارسی برای کاربر (درباره‌ی چه بنویسد)</label>
          <textarea
            rows={2}
            value={draft.prompt_fa}
            onChange={(e) => setDraft({ ...draft, prompt_fa: e.target.value })}
            placeholder="داستان روزی را بنویس که هیچ‌وقت فراموشش نمی‌کنی: کجا بودی، چه اتفاقی افتاد و چه حسی داشتی."
          />

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 280px" }}>
              <label>ایده‌ها/سؤال‌های راهنمای داستان (انگلیسی، هر خط یکی)</label>
              <textarea
                dir="ltr"
                rows={6}
                value={draft.guide_questions}
                onChange={(e) => setDraft({ ...draft, guide_questions: e.target.value })}
                placeholder={"Where were you?\nWhat happened first?"}
              />
            </div>
            <div style={{ flex: "1 1 280px" }}>
              <label>عبارت‌ها/ساختارهای پیشنهادی (هر خط یکی)</label>
              <textarea
                dir="ltr"
                rows={6}
                value={draft.useful_phrases}
                onChange={(e) => setDraft({ ...draft, useful_phrases: e.target.value })}
                placeholder={"One day, ...\nSuddenly, ...\nIn the end, ..."}
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
                    {levelLabel(t.level)} · {t.min_words} تا {t.max_words} کلمه · {t.guide_questions.length} ایده ·{" "}
                    {t.useful_phrases.length} ساختار{t.is_active ? "" : " · غیرفعال"}
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
