"use client";

import { useEffect, useRef, useState } from "react";
import { deleteRoleplay, listPodcasts, listRoleplays, saveRoleplay } from "@/lib/api";
import type { Podcast, Roleplay } from "@/lib/types";

const LEVELS: { id: Roleplay["level"]; label: string }[] = [
  { id: "starter", label: "قدم اول (A1)" },
  { id: "beginner", label: "مبتدی (A2)" },
  { id: "intermediate", label: "متوسط (B1)" },
  { id: "advanced", label: "پیشرفته (B2)" },
  { id: "proficient", label: "حرفه‌ای (C1)" },
];
const levelLabel = (l: string) => LEVELS.find((x) => x.id === l)?.label ?? l;

// دسته‌ها همان کلیدهایی‌اند که اپ ترجمه‌شان را دارد (roleplayCat_*).
const CATEGORIES: { id: string; label: string }[] = [
  { id: "health", label: "سلامت" },
  { id: "home", label: "خانه و قبض" },
  { id: "money", label: "بانک و پول" },
  { id: "car", label: "ماشین و رانندگی" },
  { id: "shopping", label: "خرید" },
  { id: "travel", label: "سفر" },
  { id: "work", label: "کار" },
  { id: "social", label: "آدم‌ها و گپ" },
  { id: "phone", label: "تلفن و اینترنت" },
  { id: "daily", label: "زندگی روزمره" },
];
const categoryLabel = (c: string) => CATEGORIES.find((x) => x.id === c)?.label ?? c;

/** فرمِ ویرایش: هدف‌ها هر خط یکی، جمله‌های کلیدی هر خط «انگلیسی | فارسی». */
interface Draft {
  id?: string;
  title: string;
  title_fa: string;
  situation_fa: string;
  ai_role: string;
  user_role_fa: string;
  goals: string;
  phrases: string;
  category: string;
  level: Roleplay["level"];
  podcast_id: string;
  position: number;
  is_active: boolean;
}

const emptyDraft = (position: number): Draft => ({
  title: "",
  title_fa: "",
  situation_fa: "",
  ai_role: "",
  user_role_fa: "",
  goals: "",
  phrases: "",
  category: "daily",
  level: "intermediate",
  podcast_id: "",
  position,
  is_active: false,
});

const toDraft = (r: Roleplay): Draft => ({
  id: r.id,
  title: r.title,
  title_fa: r.title_fa,
  situation_fa: r.situation_fa,
  ai_role: r.ai_role,
  user_role_fa: r.user_role_fa,
  goals: r.goals_fa.join("\n"),
  phrases: r.key_phrases.map((p) => (p.fa ? `${p.en} | ${p.fa}` : p.en)).join("\n"),
  category: r.category,
  level: r.level,
  podcast_id: r.podcast_id ?? "",
  position: r.position,
  is_active: r.is_active,
});

const fromDraft = (d: Draft): Omit<Roleplay, "id"> & { id?: string } => ({
  id: d.id,
  title: d.title.trim(),
  title_fa: d.title_fa.trim(),
  situation_fa: d.situation_fa.trim(),
  ai_role: d.ai_role.trim(),
  user_role_fa: d.user_role_fa.trim(),
  goals_fa: d.goals.split("\n").map((g) => g.trim()).filter(Boolean),
  key_phrases: d.phrases
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [en = "", fa = ""] = l.split("|").map((x) => x.trim());
      return { en, fa };
    })
    .filter((p) => p.en),
  category: d.category,
  level: d.level,
  podcast_id: d.podcast_id || undefined,
  position: Number(d.position) || 0,
  is_active: d.is_active,
});

/**
 * «نقش‌آفرینی»: موقعیت‌های زندگی واقعی که کاربر با AI تمرین می‌کند. سناریو هم از این‌جا
 * ساخته و ویرایش می‌شود و هم با MCP (save_roleplays)؛ هر دو به همان API می‌رسند.
 */
export default function RoleplaysPanel({ notify }: { notify: (msg: string, type?: "ok" | "err") => void }) {
  const [items, setItems] = useState<Roleplay[]>([]);
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await listRoleplays());
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listPodcasts()
      .then((list) => setPodcasts(list.filter((p) => p.kind === "featured")))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));

  function openDraft(d: Draft) {
    setDraft(d);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  async function submit() {
    if (!draft) return;
    const body = fromDraft(draft);
    if (!body.title) return notify("عنوان انگلیسی لازم است", "err");
    if (!body.ai_role) return notify("نقش AI لازم است؛ بدون آن گفتگو معنی ندارد", "err");
    setSaving(true);
    try {
      const saved = await saveRoleplay(body);
      setItems((prev) =>
        prev.some((x) => x.id === saved.id) ? prev.map((x) => (x.id === saved.id ? saved : x)) : [...prev, saved],
      );
      setDraft(null);
      notify(draft.id ? "ذخیره شد" : "نقش‌آفرینی ساخته شد (پیش‌نویس)");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function togglePublish(r: Roleplay) {
    try {
      const saved = await saveRoleplay({ ...r, is_active: !r.is_active });
      setItems((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
      notify(saved.is_active ? "منتشر شد" : "به پیش‌نویس برگشت");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function remove(r: Roleplay) {
    if (!confirm(`«${r.title_fa || r.title}» حذف شود؟ گفتگوهای کاربران روی آن هم پاک می‌شود.`)) return;
    try {
      await deleteRoleplay(r.id);
      setItems((prev) => prev.filter((x) => x.id !== r.id));
      if (draft?.id === r.id) setDraft(null);
      notify("حذف شد");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  const activeCount = items.filter((i) => i.is_active).length;
  const nextPosition = items.reduce((m, i) => Math.max(m, i.position), 0) + 1;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, flex: 1 }}>🎭 نقش‌آفرینی</h2>
          <button className="btn" onClick={() => openDraft(emptyDraft(nextPosition))}>
            + نقش‌آفرینی جدید
          </button>
        </div>
        <p className="hint">
          کاربر در اپ یک موقعیت (دکتر، بانک، مصاحبه‌ی کاری…) را انتخاب می‌کند و با AI که نقش طرف مقابل را دارد صحبت می‌کند.
          سناریوی تازه پیش‌نویس است تا این‌جا منتشرش کنی. {activeCount} از {items.length} منتشرشده.
        </p>
      </div>

      {draft && (
        <div className="card" ref={formRef}>
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش نقش‌آفرینی" : "نقش‌آفرینی جدید"}</h3>

          <div className="row">
            <div>
              <label>عنوان (انگلیسی)</label>
              <input dir="ltr" value={draft.title} placeholder="At the Doctor's" onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div>
              <label>عنوان فارسی</label>
              <input value={draft.title_fa} placeholder="پیش دکتر" onChange={(e) => update({ title_fa: e.target.value })} />
            </div>
          </div>

          <div className="row">
            <div>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => update({ level: e.target.value as Draft["level"] })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>دسته</label>
              <select value={draft.category} onChange={(e) => update({ category: e.target.value })}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>ترتیب</label>
              <input type="number" value={draft.position} onChange={(e) => update({ position: Number(e.target.value) })} />
            </div>
          </div>

          <label>موقعیت (فارسی، چیزی که کاربر قبل از شروع می‌خواند)</label>
          <textarea
            rows={2}
            value={draft.situation_fa}
            placeholder="از دیروز سرگیجه داری و دل‌درد. رفتی مطب دکتر و باید حالت رو توضیح بدی."
            onChange={(e) => update({ situation_fa: e.target.value })}
          />

          <label>نقش کاربر (فارسی)</label>
          <input value={draft.user_role_fa} placeholder="بیمار هستی و پیش دکتر رفتی." onChange={(e) => update({ user_role_fa: e.target.value })} />

          <label>نقش AI (انگلیسی؛ فقط برای مدل، به کاربر نشان داده نمی‌شود)</label>
          <textarea
            dir="ltr"
            rows={4}
            value={draft.ai_role}
            placeholder="You are Dr. Miller, a friendly family doctor. The patient has felt dizzy since yesterday... Ask about symptoms, allergies and other medicine, then suggest treatment."
            onChange={(e) => update({ ai_role: e.target.value })}
          />
          <p className="hint" style={{ marginTop: 4 }}>
            بگو AI چه کسی است، موقعیت چیست و به ترتیب چه چیزهایی بپرسد. سطح زبان را خود سیستم از «سطح» اضافه می‌کند.
          </p>

          <div className="row">
            <div>
              <label>مأموریت کاربر (هر خط یک مورد)</label>
              <textarea
                rows={5}
                value={draft.goals}
                placeholder={"علائمت رو توضیح بده\nبگو از کی شروع شده\nبپرس قرص‌ها رو کی بخوری"}
                onChange={(e) => update({ goals: e.target.value })}
              />
            </div>
            <div>
              <label>جمله‌های کلیدی (هر خط: انگلیسی | فارسی)</label>
              <textarea
                dir="ltr"
                rows={5}
                value={draft.phrases}
                placeholder={"I feel dizzy. | سرم گیج می‌ره.\nI'm allergic to penicillin. | به پنی‌سیلین حساسیت دارم."}
                onChange={(e) => update({ phrases: e.target.value })}
              />
            </div>
          </div>
          <p className="hint" style={{ marginTop: 4 }}>
            آخر گفتگو به کاربر نشان داده می‌شود کدام جمله‌های کلیدی را گفته؛ جمله‌ها کوتاه و پرکاربرد باشند.
          </p>

          <label>پادکستِ همین موقعیت (اختیاری)</label>
          <select value={draft.podcast_id} onChange={(e) => update({ podcast_id: e.target.value })}>
            <option value="">— بدون پادکست —</option>
            {podcasts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
          <p className="hint" style={{ marginTop: 4 }}>
            اگر انتخاب شود، در صفحه‌ی همان پادکست دکمه‌ی «همین موقعیت رو با هوش مصنوعی تمرین کن» نشان داده می‌شود.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" disabled={saving} onClick={submit}>
              {saving ? "در حال ذخیره..." : draft.id ? "ذخیره‌ی تغییرات" : "ساختن (پیش‌نویس)"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)}>
              انصراف
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : items.length === 0 ? (
          <p className="hint">هنوز سناریویی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {items.map((r) => (
              <div
                key={r.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: r.is_active ? 1 : 0.7,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <span style={{ fontWeight: 700 }}>{r.title_fa || r.title}</span>
                    <span dir="ltr" className="hint" style={{ margin: "0 8px" }}>
                      {r.title}
                    </span>
                  </div>
                  <div className="hint" style={{ margin: 0 }}>
                    {[
                      levelLabel(r.level),
                      categoryLabel(r.category),
                      `${r.key_phrases.length} جمله‌ی کلیدی`,
                      r.podcast_id ? "پادکست دارد" : "",
                      r.is_active ? "منتشرشده" : "پیش‌نویس",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-sm" onClick={() => togglePublish(r)}>
                    {r.is_active ? "برگرداندن به پیش‌نویس" : "انتشار"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => openDraft(toDraft(r))}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(r)}>
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
