"use client";

import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  deleteCourseLesson,
  deleteCourseUnit,
  generateCourseAudio,
  getCourseLesson,
  getCourseTree,
  listTTSVoices,
  saveCourseLesson,
  saveCourseUnit,
  suggestCourseLesson,
  uploadAudio,
  uploadImage,
  type TTSVoice,
} from "@/lib/api";
import type { CourseItem, CourseLesson, CourseUnit } from "@/lib/types";

type UnitDraft = Omit<CourseUnit, "id" | "lessons"> & { id?: string };
type LessonDraft = Omit<CourseLesson, "id"> & { id?: string };

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

const emptyItem = (position: number): CourseItem => ({
  position,
  text_en: "",
  meaning_fa: "",
  emoji: "",
  image_url: "",
  audio_url: "",
  tip_fa: "",
});

/**
 * مدیریت «دوره‌ی شروع» برای مبتدی‌مبتدی‌ها: فصل ← درس ← کارت. کاربر در اپ هر
 * کارت را گوش می‌دهد و تکرار می‌کند و درس‌ها به ترتیب (ترتیب فصل، بعد ترتیب
 * درس) باز می‌شوند. «ساخت با AI» کارت‌های یک درس را از موضوعش پیشنهاد می‌دهد و
 * «ساخت صدا» برای کارت‌های بدون صدا با TTS فعال صدا می‌سازد (آهسته‌تر از عادی).
 */
export default function CoursePanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [units, setUnits] = useState<CourseUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [unitDraft, setUnitDraft] = useState<UnitDraft | null>(null);
  const [lesson, setLesson] = useState<LessonDraft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(8);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function load() {
    setLoading(true);
    try {
      setUnits(await getCourseTree());
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listTTSVoices()
      .then(setVoices)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setBusy(null);
    }
  }

  // ---------- فصل ----------
  const saveUnit = () =>
    run("unit", async () => {
      if (!unitDraft) return;
      await saveCourseUnit(unitDraft);
      setUnitDraft(null);
      notify("فصل ذخیره شد");
      load();
    });

  const removeUnit = (u: CourseUnit) =>
    run("unit", async () => {
      if (!confirm(`فصل «${u.title_fa}» با همه‌ی درس‌هایش حذف شود؟`)) return;
      await deleteCourseUnit(u.id);
      if (lesson?.unit_id === u.id) setLesson(null);
      load();
    });

  // ---------- درس ----------
  const openLesson = (id: string) =>
    run("load", async () => {
      setLesson(await getCourseLesson(id));
      setTopic("");
    });

  const newLesson = (u: CourseUnit) => {
    setLesson({
      unit_id: u.id,
      title_fa: "",
      title_en: "",
      emoji: "",
      goal_fa: "",
      position: u.lessons.length,
      is_active: true,
      items: [],
    });
    setTopic("");
  };

  const items = lesson?.items ?? [];
  const updateLesson = (patch: Partial<LessonDraft>) => setLesson((l) => (l ? { ...l, ...patch } : l));
  const updateItem = (i: number, patch: Partial<CourseItem>) =>
    updateLesson({ items: items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const moveItem = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    updateLesson({ items: next });
  };

  const suggest = () =>
    run("suggest", async () => {
      if (!lesson) return;
      if (items.length > 0 && !confirm("کارت‌های فعلی با پیشنهاد AI جایگزین شوند؟")) return;
      const unit = units.find((u) => u.id === lesson.unit_id);
      const s = await suggestCourseLesson(topic || lesson.title_fa, unit?.title_fa ?? "", count);
      updateLesson({
        title_fa: lesson.title_fa || topic,
        title_en: s.title_en || lesson.title_en,
        goal_fa: s.goal_fa || lesson.goal_fa,
        emoji: s.emoji || lesson.emoji,
        items: (s.items || []).map((it, i) => ({ ...emptyItem(i), ...it })),
      });
      notify("کارت‌ها ساخته شدند؛ بررسی کن، ذخیره کن و بعد «ساخت صدا» را بزن.");
    });

  const saveLesson = () =>
    run("save", async () => {
      if (!lesson) return;
      const saved = await saveCourseLesson(lesson);
      setLesson(saved);
      notify("درس ذخیره شد");
      load();
    });

  const makeAudio = () =>
    run("audio", async () => {
      if (!lesson?.id) throw new Error("اول درس را ذخیره کن");
      const res = await generateCourseAudio(lesson.id, voiceId);
      setLesson(res.lesson);
      if (res.message) notify(`${res.made} صدا ساخته شد؛ ${res.message}`, "err");
      else notify(res.made ? `${res.made} صدا ساخته شد` : "همه‌ی کارت‌ها از قبل صدا دارند");
    });

  const removeLesson = () =>
    run("save", async () => {
      if (!lesson?.id || !confirm(`درس «${lesson.title_fa}» حذف شود؟`)) return;
      await deleteCourseLesson(lesson.id);
      setLesson(null);
      load();
    });

  const play = (url: string) => {
    audioRef.current?.pause();
    audioRef.current = new Audio(mediaUrl(url));
    audioRef.current.play().catch(() => {});
  };

  const missingAudio = items.filter((it) => !it.audio_url).length;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>🌱 قدم اول (پایه‌تر از مبتدی)</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              فصل ← درس ← کارت. در اپ: برای هر کارت صدا پخش می‌شود، کاربر تکرار می‌کند و ستاره می‌گیرد؛ درس‌ها به ترتیب
              (فصل، بعد درس) باز می‌شوند. درسِ بدون کارت در اپ نشان داده نمی‌شود. این دوره رایگان است.
            </p>
          </div>
          <button
            className="btn btn-sm"
            onClick={() =>
              setUnitDraft({ title_fa: "", title_en: "", emoji: "", description_fa: "", position: units.length, is_active: true })
            }
          >
            + فصل جدید
          </button>
        </div>
      </div>

      {unitDraft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{unitDraft.id ? "ویرایش فصل" : "فصل جدید"}</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ width: 70 }}>
              <label>ایموجی</label>
              <input value={unitDraft.emoji} onChange={(e) => setUnitDraft({ ...unitDraft, emoji: e.target.value })} placeholder="👋" />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label>عنوان فارسی</label>
              <input value={unitDraft.title_fa} onChange={(e) => setUnitDraft({ ...unitDraft, title_fa: e.target.value })} placeholder="سلام و آشنایی" />
            </div>
            <div style={{ flex: "1 1 200px" }}>
              <label>عنوان انگلیسی</label>
              <input dir="ltr" value={unitDraft.title_en} onChange={(e) => setUnitDraft({ ...unitDraft, title_en: e.target.value })} placeholder="Hello!" />
            </div>
            <div style={{ width: 90 }}>
              <label>ترتیب</label>
              <input type="number" value={unitDraft.position} onChange={(e) => setUnitDraft({ ...unitDraft, position: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <label>توضیح کوتاه (اختیاری)</label>
          <input value={unitDraft.description_fa} onChange={(e) => setUnitDraft({ ...unitDraft, description_fa: e.target.value })} />
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
            <input type="checkbox" checked={unitDraft.is_active} onChange={(e) => setUnitDraft({ ...unitDraft, is_active: e.target.checked })} style={{ width: "auto" }} />
            فعال
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={saveUnit} disabled={!!busy || !unitDraft.title_fa.trim()}>
              ذخیره
            </button>
            <button className="btn btn-ghost" onClick={() => setUnitDraft(null)}>
              انصراف
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div className="card" style={{ flex: "0 1 320px", minWidth: 280 }}>
          {loading ? (
            <p className="hint">در حال بارگذاری...</p>
          ) : units.length === 0 ? (
            <p className="hint">هنوز فصلی ساخته نشده. با «+ فصل جدید» شروع کن (مثلاً «سلام و آشنایی»، «رنگ‌ها»، «اعداد»).</p>
          ) : (
            units.map((u, ui) => (
              <div key={u.id} style={{ marginBottom: 16, opacity: u.is_active ? 1 : 0.55 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <strong>
                    {ui + 1}. {u.emoji} {u.title_fa}
                  </strong>
                  <span style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() =>
                        setUnitDraft({
                          id: u.id,
                          title_fa: u.title_fa,
                          title_en: u.title_en,
                          emoji: u.emoji,
                          description_fa: u.description_fa,
                          position: u.position,
                          is_active: u.is_active,
                        })
                      }
                    >
                      ✎
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => removeUnit(u)}>
                      ✕
                    </button>
                  </span>
                </div>
                {u.lessons.map((l) => (
                  <button
                    key={l.id}
                    className={`sidebar-link ${lesson?.id === l.id ? "active" : ""}`}
                    style={{ width: "100%", textAlign: "right", opacity: l.is_active ? 1 : 0.55 }}
                    onClick={() => openLesson(l.id)}
                  >
                    {l.emoji} {l.title_fa} <span className="hint">({l.item_count ?? 0} کارت)</span>
                  </button>
                ))}
                <button className="btn btn-ghost btn-sm" onClick={() => newLesson(u)}>
                  + درس
                </button>
              </div>
            ))
          )}
        </div>

        {lesson && (
          <div className="card" style={{ flex: "1 1 520px" }}>
            <h3 style={{ marginTop: 0 }}>{lesson.id ? "ویرایش درس" : "درس جدید"}</h3>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              <input
                placeholder="موضوع درس برای AI، مثلاً «رنگ‌ها» یا «سلام و خداحافظی»"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                style={{ flex: 1, minWidth: 220 }}
              />
              <select value={count} onChange={(e) => setCount(Number(e.target.value))}>
                {[6, 8, 10, 12].map((n) => (
                  <option key={n} value={n}>
                    {n} کارت
                  </option>
                ))}
              </select>
              <button className="btn btn-ghost btn-sm" onClick={suggest} disabled={!!busy || !(topic.trim() || lesson.title_fa.trim())}>
                {busy === "suggest" ? "در حال ساخت..." : "✨ ساخت کارت‌ها با AI"}
              </button>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ width: 70 }}>
                <label>ایموجی</label>
                <input value={lesson.emoji} onChange={(e) => updateLesson({ emoji: e.target.value })} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label>عنوان فارسی</label>
                <input value={lesson.title_fa} onChange={(e) => updateLesson({ title_fa: e.target.value })} />
              </div>
              <div style={{ flex: "1 1 180px" }}>
                <label>عنوان انگلیسی</label>
                <input dir="ltr" value={lesson.title_en} onChange={(e) => updateLesson({ title_en: e.target.value })} />
              </div>
              <div>
                <label>فصل</label>
                <select value={lesson.unit_id} onChange={(e) => updateLesson({ unit_id: e.target.value })}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title_fa}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 80 }}>
                <label>ترتیب</label>
                <input type="number" value={lesson.position} onChange={(e) => updateLesson({ position: Number(e.target.value) || 0 })} />
              </div>
            </div>
            <label>هدف درس (فارسی)</label>
            <input value={lesson.goal_fa} onChange={(e) => updateLesson({ goal_fa: e.target.value })} placeholder="بعد از این درس می‌توانی رنگ‌ها را بگویی." />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 8 }}>
              <h4 style={{ margin: 0 }}>
                کارت‌ها ({items.length}){missingAudio > 0 && ` — ${missingAudio} کارت بدون صدا`}
              </h4>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {voices.length > 0 && (
                  <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)}>
                    <option value="">صدای پیش‌فرض</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                )}
                <button className="btn btn-ghost btn-sm" onClick={makeAudio} disabled={!!busy || !lesson.id || missingAudio === 0}>
                  {busy === "audio" ? "در حال ساخت صدا..." : "🔊 ساخت صدا برای کارت‌های بدون صدا"}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => updateLesson({ items: [...items, emptyItem(items.length)] })}>
                  + کارت
                </button>
              </div>
            </div>
            <p className="hint">
              ترتیب: از کلمه به عبارت و در آخر یک جمله‌ی خیلی کوتاه. «ساخت صدا» فقط بعد از ذخیره کار می‌کند؛ اگر متن یک کارت
              را عوض کردی، صدایش را با ✕ کنار 🔊 پاک کن تا دوباره ساخته شود.
            </p>

            {items.map((it, i) => (
              <div key={i} style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ width: 60 }}>
                    <label>ایموجی</label>
                    <input value={it.emoji} onChange={(e) => updateItem(i, { emoji: e.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 180px" }}>
                    <label>انگلیسی</label>
                    <input dir="ltr" value={it.text_en} onChange={(e) => updateItem(i, { text_en: e.target.value })} />
                  </div>
                  <div style={{ flex: "1 1 150px" }}>
                    <label>معنی فارسی</label>
                    <input value={it.meaning_fa} onChange={(e) => updateItem(i, { meaning_fa: e.target.value })} />
                  </div>
                  <span style={{ display: "flex", gap: 4 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => moveItem(i, -1)} title="بالا">
                      ↑
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => moveItem(i, 1)} title="پایین">
                      ↓
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => updateLesson({ items: items.filter((_, j) => j !== i) })}
                      title="حذف کارت"
                    >
                      ✕
                    </button>
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
                  <input
                    value={it.tip_fa}
                    onChange={(e) => updateItem(i, { tip_fa: e.target.value })}
                    placeholder="نکته‌ی تلفظ/کاربرد (اختیاری)"
                    style={{ flex: "1 1 220px" }}
                  />
                  {it.audio_url ? (
                    <span style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => play(it.audio_url)}>
                        🔊
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => updateItem(i, { audio_url: "" })} title="حذف صدا">
                        ✕
                      </button>
                    </span>
                  ) : (
                    <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                      آپلود صدا
                      <input
                        type="file"
                        accept="audio/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          run("upload", async () => updateItem(i, { audio_url: await uploadAudio(e.target.files![0]) }))
                        }
                      />
                    </label>
                  )}
                  {it.image_url ? (
                    <span style={{ display: "flex", gap: 4, alignItems: "center" }}>
                      <img src={mediaUrl(it.image_url)} alt="" style={{ height: 32, borderRadius: 4 }} />
                      <button className="btn btn-ghost btn-sm" onClick={() => updateItem(i, { image_url: "" })} title="حذف تصویر">
                        ✕
                      </button>
                    </span>
                  ) : (
                    <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer" }}>
                      تصویر (اختیاری)
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          run("upload", async () => updateItem(i, { image_url: await uploadImage(e.target.files![0]) }))
                        }
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <input type="checkbox" checked={lesson.is_active} onChange={(e) => updateLesson({ is_active: e.target.checked })} style={{ width: "auto" }} />
              فعال
            </label>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn" onClick={saveLesson} disabled={!!busy || !lesson.title_fa.trim()}>
                {busy === "save" ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button className="btn btn-ghost" onClick={() => setLesson(null)} disabled={!!busy}>
                بستن
              </button>
              {lesson.id && (
                <button className="btn btn-ghost" onClick={removeLesson} disabled={!!busy} style={{ marginInlineStart: "auto" }}>
                  حذف درس
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
