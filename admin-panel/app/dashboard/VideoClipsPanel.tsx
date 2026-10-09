"use client";

import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  completeVideoClip,
  deleteVideoClip,
  detectVideoLines,
  getVideoClip,
  listVideoClips,
  saveVideoClip,
  uploadImage,
  uploadVideo,
} from "@/lib/api";
import { SCENE_CATEGORIES } from "@/lib/types";
import type { VideoClip, VideoClipLevel, VideoClipLine, VideoClipQuestion } from "@/lib/types";

const LEVELS: { id: VideoClipLevel; label: string }[] = [
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
];

type Draft = Omit<VideoClip, "id"> & { id?: string };

const emptyDraft = (position = 0): Draft => ({
  title: "",
  description_fa: "",
  source: "flow",
  category: "",
  movie_title: "",
  video_url: "",
  poster_url: "",
  level: "beginner",
  duration_seconds: 0,
  questions: [],
  position,
  is_active: false,
  lines: [],
});

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);
const sec = (ms: number) => (ms / 1000).toFixed(1);
const toMs = (v: string) => Math.max(0, Math.round((parseFloat(v) || 0) * 1000));

/**
 * مدیریت «تمرین با ویدیو»: آپلود کلیپ (ساخته‌شده با Google Flow یا تکه‌ای از
 * فیلم)، دیالوگ‌های زمان‌بندی‌شده (دستی با دکمه‌ی «الان» روی پلیر، یا تشخیص
 * خودکار با Groq)، تکمیل گوینده/ترجمه/سؤال‌های فهم با AI. کاربر در اپ کلیپ را
 * می‌بیند و سر نوبت شخصیتی که انتخاب کرده (صدای ویدیو قطع می‌شود) حرف می‌زند.
 */
export default function VideoClipsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [clips, setClips] = useState<VideoClip[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopAtRef = useRef<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      setClips(await listVideoClips());
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

  const openClip = (id: string) =>
    run("load", async () => {
      setDraft(await getVideoClip(id));
    });

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const updateLine = (i: number, patch: Partial<VideoClipLine>) =>
    setDraft((d) => (d ? { ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : d));
  const updateQuestion = (i: number, patch: Partial<VideoClipQuestion>) =>
    setDraft((d) => (d ? { ...d, questions: d.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) } : d));

  const nowMs = () => Math.round((videoRef.current?.currentTime ?? 0) * 1000);

  function addLine() {
    if (!draft) return;
    const start = nowMs();
    update({
      lines: [
        ...draft.lines,
        { position: draft.lines.length, speaker: "", text: "", translation_fa: "", start_ms: start, end_ms: start + 2000 },
      ],
    });
  }

  function playSegment(l: VideoClipLine) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = l.start_ms / 1000;
    stopAtRef.current = l.end_ms / 1000;
    v.play();
  }

  const handleVideoFile = (file: File) =>
    run("upload", async () => {
      const url = await uploadVideo(file);
      update({ video_url: url });
      notify("ویدیو آپلود شد");
    });

  const handlePosterFile = (file: File) =>
    run("poster", async () => {
      update({ poster_url: await uploadImage(file) });
    });

  const handleDetect = () =>
    run("detect", async () => {
      if (!draft?.video_url) throw new Error("اول ویدیو را آپلود کن");
      if (draft.lines.length > 0 && !confirm("دیالوگ‌های فعلی با دیالوگ‌های تشخیص‌داده‌شده جایگزین شوند؟")) return;
      const lines = await detectVideoLines(draft.video_url);
      update({ lines });
      notify(`${lines.length} دیالوگ تشخیص داده شد؛ گوینده‌ها را با «تکمیل با AI» یا دستی پر کن.`);
    });

  const handleComplete = () =>
    run("complete", async () => {
      if (!draft) return;
      const res = await completeVideoClip({
        title: draft.title,
        description_fa: draft.description_fa,
        level: draft.level,
        lines: draft.lines,
      });
      const lines = draft.lines.map((l, i) => {
        const c = res.lines?.find((x) => x.index === i);
        if (!c) return l;
        return {
          ...l,
          speaker: l.speaker.trim() || c.speaker || "",
          translation_fa: l.translation_fa.trim() || c.translation_fa || "",
        };
      });
      update({ lines, questions: res.questions?.length ? res.questions : draft.questions });
      notify("پیشنهاد AI اعمال شد؛ بررسی کن و ذخیره کن.");
    });

  const handleSave = () =>
    run("save", async () => {
      if (!draft) return;
      const saved = await saveVideoClip(draft);
      setDraft(saved);
      notify("کلیپ ذخیره شد");
      load();
    });

  const handleDelete = (c: VideoClip) =>
    run("delete", async () => {
      if (!confirm(`کلیپ «${c.title}» حذف شود؟`)) return;
      await deleteVideoClip(c.id);
      if (draft?.id === c.id) setDraft(null);
      notify("حذف شد");
      load();
    });

  const speakers = draft ? [...new Set(draft.lines.map((l) => l.speaker.trim()).filter(Boolean))] : [];

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>🎬 تمرین با ویدیو</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              کلیپ کوتاه (Google Flow یا تکه‌ای از فیلم) + دیالوگ‌های زمان‌بندی‌شده. کاربر کلیپ را می‌بیند، به سؤال‌های فهم
              جواب می‌دهد، یک شخصیت انتخاب می‌کند و سر جمله‌های او (صدای ویدیو قطع می‌شود) حرف می‌زند. زمان دیالوگ‌ها باید
              دقیق باشد، چون همان لحظه‌ها صدا قطع و میکروفون روشن می‌شود.
            </p>
          </div>
          {!draft && (
            <button className="btn btn-sm" onClick={() => setDraft(emptyDraft(clips.length))}>
              + کلیپ جدید
            </button>
          )}
        </div>
      </div>

      {draft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش کلیپ" : "کلیپ جدید"}</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px" }}>
              <label>عنوان</label>
              <input value={draft.title} onChange={(e) => update({ title: e.target.value })} placeholder="At the coffee shop" />
            </div>
            <div>
              <label>منبع</label>
              <select value={draft.source} onChange={(e) => update({ source: e.target.value as Draft["source"] })}>
                <option value="flow">ساخته‌شده (Google Flow)</option>
                <option value="movie">تکه‌ای از فیلم</option>
              </select>
            </div>
            <div>
              <label>موضوع (مثل صحنه‌ها)</label>
              <select value={draft.category || ""} onChange={(e) => update({ category: e.target.value })}>
                <option value="">— بدون موضوع —</option>
                {SCENE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            {draft.source === "movie" && (
              <div style={{ flex: "1 1 180px" }}>
                <label>نام فیلم</label>
                <input
                  value={draft.movie_title || ""}
                  onChange={(e) => update({ movie_title: e.target.value })}
                  placeholder="Friends (S01E05)"
                />
              </div>
            )}
            <div>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => update({ level: e.target.value as VideoClipLevel })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 90 }}>
              <label>ترتیب</label>
              <input type="number" value={draft.position} onChange={(e) => update({ position: Number(e.target.value) || 0 })} />
            </div>
          </div>

          <label>توضیح فارسی (اختیاری — زمینه‌ی کلیپ)</label>
          <textarea rows={2} value={draft.description_fa} onChange={(e) => update({ description_fa: e.target.value })} />

          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", marginTop: 8 }}>
            <div style={{ flex: "1 1 420px" }}>
              <label>ویدیو (mp4/mov/webm، حداکثر ۸۰ مگابایت)</label>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                disabled={!!busy}
                onChange={(e) => e.target.files?.[0] && handleVideoFile(e.target.files[0])}
              />
              {busy === "upload" && <p className="hint">در حال آپلود ویدیو...</p>}
              {draft.video_url && (
                <video
                  ref={videoRef}
                  src={mediaUrl(draft.video_url)}
                  controls
                  style={{ width: "100%", marginTop: 8, borderRadius: 8, background: "#000" }}
                  onLoadedMetadata={(e) => update({ duration_seconds: Math.round(e.currentTarget.duration || 0) })}
                  onTimeUpdate={(e) => {
                    if (stopAtRef.current !== null && e.currentTarget.currentTime >= stopAtRef.current) {
                      stopAtRef.current = null;
                      e.currentTarget.pause();
                    }
                  }}
                />
              )}
            </div>
            <div style={{ width: 200 }}>
              <label>پوستر (اختیاری)</label>
              <input
                type="file"
                accept="image/*"
                disabled={!!busy}
                onChange={(e) => e.target.files?.[0] && handlePosterFile(e.target.files[0])}
              />
              {draft.poster_url && (
                <img src={mediaUrl(draft.poster_url)} alt="" style={{ width: "100%", marginTop: 8, borderRadius: 8 }} />
              )}
              {draft.duration_seconds > 0 && <p className="hint">مدت: {draft.duration_seconds} ثانیه</p>}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20, gap: 8, flexWrap: "wrap" }}>
            <h4 style={{ margin: 0 }}>
              دیالوگ‌ها ({draft.lines.length}){speakers.length > 0 && ` — شخصیت‌ها: ${speakers.join("، ")}`}
            </h4>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button className="btn btn-ghost btn-sm" onClick={handleDetect} disabled={!!busy || !draft.video_url}>
                {busy === "detect" ? "در حال تشخیص..." : "🎙 تشخیص خودکار دیالوگ‌ها"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleComplete} disabled={!!busy || draft.lines.length === 0}>
                {busy === "complete" ? "در حال تکمیل..." : "✨ تکمیل با AI (گوینده، ترجمه، سؤال)"}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={addLine} disabled={!draft.video_url}>
                + دیالوگ (از لحظه‌ی فعلی ویدیو)
              </button>
            </div>
          </div>
          <p className="hint">
            برای تنظیم دقیق زمان: ویدیو را روی لحظه‌ی موردنظر نگه دار و «⏱» کنار شروع/پایان را بزن. «▶» فقط همان دیالوگ را
            پخش می‌کند تا ببینی درست بریده شده.
          </p>

          {draft.lines.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ textAlign: "right", opacity: 0.7 }}>
                    <th style={{ padding: 4 }}>گوینده</th>
                    <th style={{ padding: 4 }}>متن انگلیسی</th>
                    <th style={{ padding: 4 }}>ترجمه</th>
                    <th style={{ padding: 4 }}>شروع (ث)</th>
                    <th style={{ padding: 4 }}>پایان (ث)</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {draft.lines.map((l, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border, #333)", verticalAlign: "top" }}>
                      <td style={{ padding: 4, width: 110 }}>
                        <input dir="ltr" list="clip-speakers" value={l.speaker} onChange={(e) => updateLine(i, { speaker: e.target.value })} />
                      </td>
                      <td style={{ padding: 4, minWidth: 220 }}>
                        <textarea dir="ltr" rows={2} value={l.text} onChange={(e) => updateLine(i, { text: e.target.value })} />
                      </td>
                      <td style={{ padding: 4, minWidth: 180 }}>
                        <textarea rows={2} value={l.translation_fa} onChange={(e) => updateLine(i, { translation_fa: e.target.value })} />
                      </td>
                      <td style={{ padding: 4, width: 110 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <input dir="ltr" value={sec(l.start_ms)} onChange={(e) => updateLine(i, { start_ms: toMs(e.target.value) })} />
                          <button className="btn btn-ghost btn-sm" title="شروع = لحظه‌ی فعلی ویدیو" onClick={() => updateLine(i, { start_ms: nowMs() })}>
                            ⏱
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 4, width: 110 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <input dir="ltr" value={sec(l.end_ms)} onChange={(e) => updateLine(i, { end_ms: toMs(e.target.value) })} />
                          <button className="btn btn-ghost btn-sm" title="پایان = لحظه‌ی فعلی ویدیو" onClick={() => updateLine(i, { end_ms: nowMs() })}>
                            ⏱
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 4, whiteSpace: "nowrap" }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => playSegment(l)} title="پخش همین دیالوگ">
                          ▶
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => update({ lines: draft.lines.filter((_, j) => j !== i) })}
                          title="حذف"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="clip-speakers">
                {speakers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
            <h4 style={{ margin: 0 }}>سؤال‌های فهم ({draft.questions.length})</h4>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => update({ questions: [...draft.questions, { question_fa: "", options: ["", "", ""], answer_index: 0 }] })}
            >
              + سؤال
            </button>
          </div>
          <p className="hint">قبل از اجرای نقش، از کاربر پرسیده می‌شود تا ببیند کلیپ را فهمیده یا نه. اختیاری است.</p>
          {draft.questions.map((q, i) => (
            <div key={i} style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={q.question_fa} onChange={(e) => updateQuestion(i, { question_fa: e.target.value })} placeholder="سؤال" style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" onClick={() => update({ questions: draft.questions.filter((_, j) => j !== i) })}>
                  ✕
                </button>
              </div>
              {q.options.map((o, oi) => (
                <label key={oi} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={q.answer_index === oi}
                    onChange={() => updateQuestion(i, { answer_index: oi })}
                    style={{ width: "auto" }}
                  />
                  <input
                    value={o}
                    onChange={(e) => updateQuestion(i, { options: q.options.map((x, xi) => (xi === oi ? e.target.value : x)) })}
                    placeholder={`گزینه‌ی ${oi + 1}${q.answer_index === oi ? " (درست)" : ""}`}
                    style={{ flex: 1 }}
                  />
                </label>
              ))}
            </div>
          ))}

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input type="checkbox" checked={draft.is_active} onChange={(e) => update({ is_active: e.target.checked })} style={{ width: "auto" }} />
            فعال (در اپ نمایش داده شود — ویدیو و حداقل یک دیالوگ لازم است)
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button className="btn" onClick={handleSave} disabled={!!busy || !draft.title.trim()}>
              {busy === "save" ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={!!busy}>
              بستن
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : clips.length === 0 ? (
          <p className="hint">هنوز کلیپی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clips.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: c.is_active ? 1 : 0.55,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }}>{c.title}</div>
                  <div className="hint" style={{ margin: 0 }}>
                    {c.source === "movie" ? `فیلم${c.movie_title ? ` (${c.movie_title})` : ""}` : "Flow"}
                    {c.category ? ` · ${SCENE_CATEGORIES.find((x) => x.value === c.category)?.label ?? c.category}` : ""} ·{" "}
                    {LEVELS.find((l) => l.id === c.level)?.label} ·{" "}
                    {c.duration_seconds} ثانیه · {c.speaker_count ?? 0} شخصیت · {c.questions.length} سؤال
                    {c.is_active ? "" : " · غیرفعال"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => openClip(c.id)} disabled={!!busy}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c)} disabled={!!busy}>
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
