"use client";

import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  completeVideoClip,
  deleteVideoClip,
  detectVideoLines,
  getVideoClip,
  getVideoClipSettings,
  listVideoClips,
  saveVideoClip,
  saveVideoClipSettings,
  uploadImage,
  uploadVideo,
} from "@/lib/api";
import { SCENE_CATEGORIES } from "@/lib/types";
import { formatTimecode, parseTimecode, srtToLines } from "@/lib/srt";
import type { VideoClip, VideoClipLevel, VideoClipLine, VideoClipQuestion } from "@/lib/types";

const LEVELS: { id: VideoClipLevel; label: string }[] = [
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
  { id: "proficient", label: "حرفه‌ای (C1)" },
];

type Draft = Omit<VideoClip, "id"> & { id?: string };

/** همان پیش‌فرضِ اپ (VideoClipScreen): ۰٫۲۵ ثانیه قبل و بعد از جمله. */
const DEFAULT_MUTE_PADDING_MS = 250;
const NUDGE_STEPS = [10, 50, 100, 250];
/** پیش‌نمایش «مثل اپ»: این مقدار قبل و بعد از جمله هم پخش می‌شود تا قطع و وصل صدا شنیده شود. */
const PREVIEW_CONTEXT_MS = 1500;

/** فایل زیرنویس قدیمی معمولاً UTF-8 نیست؛ اگر UTF-8 معتبر نبود با windows-1252 خوانده می‌شود. */
async function readSubtitleFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder("windows-1252").decode(buf);
  }
}

/** ورودی زمان به شکل HH:MM:SS.mmm؛ مقدار فقط موقع خروج از فیلد ثبت می‌شود. */
function TimecodeInput({ value, onChange, placeholder }: { value: number; onChange: (ms: number) => void; placeholder?: string }) {
  const [text, setText] = useState(formatTimecode(value));
  useEffect(() => setText(formatTimecode(value)), [value]);
  return (
    <input
      dir="ltr"
      value={text}
      placeholder={placeholder}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const ms = parseTimecode(text);
        onChange(ms ?? 0);
        setText(formatTimecode(ms ?? 0));
      }}
    />
  );
}

const emptyDraft = (position = 0): Draft => ({
  title: "",
  description_fa: "",
  source: "flow",
  category: "",
  movie_title: "",
  movie_year: 0,
  movie_start_ms: 0,
  movie_end_ms: 0,
  mute_padding_ms: DEFAULT_MUTE_PADDING_MS,
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
  // پیش‌نمایش «مثل اپ»: بازه‌ای (ثانیه) که صدای ویدیو در آن قطع است.
  const muteWindowRef = useRef<[number, number] | null>(null);
  const [hideMovies, setHideMovies] = useState(false);
  const [nudgeStep, setNudgeStep] = useState(50);
  const srtRef = useRef<HTMLInputElement>(null);

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
    getVideoClipSettings()
      .then((st) => setHideMovies(st.hide_movie_clips))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggleHideMovies(hide: boolean) {
    try {
      const st = await saveVideoClipSettings({ hide_movie_clips: hide });
      setHideMovies(st.hide_movie_clips);
      notify(hide ? "همه‌ی کلیپ‌های فیلم از اپ پنهان شدند" : "کلیپ‌های فیلم دوباره در اپ نمایش داده می‌شوند");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

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
    muteWindowRef.current = null;
    v.muted = false;
    v.currentTime = l.start_ms / 1000;
    stopAtRef.current = l.end_ms / 1000;
    v.play();
  }

  /**
   * مثل اپ: کمی قبل و بعد از جمله پخش می‌شود و صدا دقیقاً در همان بازه‌ای قطع
   * است که در اپ قطع می‌شود (جمله ± حاشیه). اگر تکه‌ای از صدای شخصیت شنیده شد،
   * زمان یا حاشیه کم است.
   */
  function previewMuted(l: VideoClipLine) {
    const v = videoRef.current;
    if (!v || !draft) return;
    const pad = draft.mute_padding_ms;
    muteWindowRef.current = [(l.start_ms - pad) / 1000, (l.end_ms + pad) / 1000];
    v.currentTime = Math.max(0, l.start_ms - pad - PREVIEW_CONTEXT_MS) / 1000;
    stopAtRef.current = (l.end_ms + pad + PREVIEW_CONTEXT_MS) / 1000;
    v.play();
    // timeupdate فقط ~۴ بار در ثانیه است؛ برای قطع دقیق هر فریم چک می‌شود.
    const tick = () => {
      const win = muteWindowRef.current;
      if (!win || v.paused) {
        v.muted = false;
        return;
      }
      v.muted = v.currentTime >= win[0] && v.currentTime <= win[1];
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /** جابه‌جایی شروع/پایان یک دیالوگ؛ شروع از ۰ کمتر و پایان از شروع جلوتر نمی‌شود. */
  function nudgeLine(i: number, startDelta: number, endDelta: number) {
    if (!draft) return;
    const l = draft.lines[i];
    const start = Math.max(0, l.start_ms + startDelta);
    const end = Math.max(start + 50, l.end_ms + endDelta);
    updateLine(i, { start_ms: start, end_ms: end });
  }

  function nudgeAll(delta: number) {
    if (!draft) return;
    update({
      lines: draft.lines.map((l) => {
        const start = Math.max(0, l.start_ms + delta);
        return { ...l, start_ms: start, end_ms: Math.max(start + 50, l.end_ms + delta) };
      }),
    });
  }

  const handleSrtFile = (file: File) =>
    run("srt", async () => {
      if (!draft) return;
      const offsetMs = draft.source === "movie" ? draft.movie_start_ms || 0 : 0;
      const clipDurationMs =
        draft.duration_seconds > 0
          ? draft.duration_seconds * 1000
          : draft.movie_end_ms && draft.movie_end_ms > offsetMs
          ? draft.movie_end_ms - offsetMs
          : 0;
      const lines = srtToLines(await readSubtitleFile(file), { offsetMs, clipDurationMs });
      if (srtRef.current) srtRef.current.value = "";
      if (lines.length === 0) {
        throw new Error(
          offsetMs
            ? "هیچ زیرنویسی در بازه‌ی این صحنه پیدا نشد؛ «شروع صحنه در فیلم» را چک کن."
            : "هیچ زیرنویسی پیدا نشد. اگر زیرنویس کل فیلم است، اول «شروع صحنه در فیلم» را وارد کن."
        );
      }
      if (draft.lines.length > 0 && !confirm(`دیالوگ‌های فعلی با ${lines.length} دیالوگ زیرنویس جایگزین شوند؟`)) return;
      update({ lines });
      notify(`${lines.length} دیالوگ از زیرنویس وارد شد؛ گوینده‌ها را با «تکمیل با AI» یا دستی پر کن.`);
    });

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
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 12,
            padding: 10,
            borderRadius: 8,
            border: `1px solid ${hideMovies ? "var(--danger, #c0392b)" : "var(--border, #333)"}`,
          }}
        >
          <input
            type="checkbox"
            checked={hideMovies}
            onChange={(e) => toggleHideMovies(e.target.checked)}
            style={{ width: "auto" }}
          />
          <span>
            <b>پنهان کردن یکجای همه‌ی کلیپ‌های «تکه‌ای از فیلم»</b>
            <span className="hint" style={{ display: "block", margin: 0 }}>
              با روشن کردن این، همه‌ی کلیپ‌های فیلم فوراً از اپ پنهان می‌شوند و کلیپ‌های Google Flow می‌مانند. خود کلیپ‌ها پاک
              نمی‌شوند و با خاموش کردنش برمی‌گردند.
            </span>
          </span>
        </label>
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

          {draft.source === "movie" && (
            <div style={{ border: "1px dashed var(--border, #333)", borderRadius: 8, padding: 10, marginTop: 8 }}>
              <div className="hint" style={{ margin: "0 0 6px" }}>
                🔒 اطلاعات داخلی منبع — در اپ نمایش داده نمی‌شود؛ برای وقتی که گزارشی درباره‌ی این کلیپ رسید. «شروع صحنه»
                برای جابه‌جا کردن زمان‌های زیرنویس کل فیلم هم استفاده می‌شود.
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <div style={{ width: 100 }}>
                  <label>سال فیلم</label>
                  <input
                    dir="ltr"
                    type="number"
                    value={draft.movie_year || ""}
                    onChange={(e) => update({ movie_year: Number(e.target.value) || 0 })}
                    placeholder="1994"
                  />
                </div>
                <div style={{ width: 150 }}>
                  <label>شروع صحنه در فیلم</label>
                  <TimecodeInput
                    value={draft.movie_start_ms || 0}
                    onChange={(ms) => update({ movie_start_ms: ms })}
                    placeholder="01:12:30.500"
                  />
                </div>
                <div style={{ width: 150 }}>
                  <label>پایان صحنه در فیلم</label>
                  <TimecodeInput
                    value={draft.movie_end_ms || 0}
                    onChange={(ms) => update({ movie_end_ms: ms })}
                    placeholder="01:13:05.000"
                  />
                </div>
              </div>
            </div>
          )}

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
                      muteWindowRef.current = null;
                      e.currentTarget.pause();
                      e.currentTarget.muted = false;
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
              <input
                ref={srtRef}
                type="file"
                accept=".srt,application/x-subrip,text/plain"
                style={{ display: "none" }}
                onChange={(e) => e.target.files?.[0] && handleSrtFile(e.target.files[0])}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => srtRef.current?.click()} disabled={!!busy}>
                {busy === "srt" ? "در حال خواندن..." : "📄 ورود زیرنویس (.srt)"}
              </button>
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
            برای تنظیم دقیق زمان: ویدیو را روی لحظه‌ی موردنظر نگه دار و «⏱» کنار شروع/پایان را بزن، یا با «−/+» چند صدم
            ثانیه جابه‌جا کن. «▶» فقط همان دیالوگ را پخش می‌کند؛ «🔇» مثل اپ پخش می‌کند (کمی قبل و بعد، با صدای قطع‌شده سر
            جمله) — اگر تکه‌ای از صدای شخصیت شنیده شد، زمان را جابه‌جا کن یا حاشیه را بیشتر کن. زیرنویس رسمی فیلم معمولاً از
            تشخیص خودکار دقیق‌تر است و متنش هم بی‌غلط است.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 8 }}>
            <div style={{ width: 170 }}>
              <label>حاشیه‌ی قطع صدا (ms)</label>
              <input
                dir="ltr"
                type="number"
                min={0}
                max={1000}
                step={50}
                value={draft.mute_padding_ms}
                onChange={(e) => update({ mute_padding_ms: Math.min(1000, Math.max(0, Number(e.target.value) || 0)) })}
              />
            </div>
            <span className="hint" style={{ margin: "0 0 8px", flex: "1 1 220px" }}>
              صدای ویدیو این مقدار قبل و بعد از جمله‌ی کاربر هم قطع می‌شود (پیشنهاد: ۲۰۰ تا ۳۰۰).
            </span>
            <div>
              <label>گام جابه‌جایی</label>
              <select value={nudgeStep} onChange={(e) => setNudgeStep(Number(e.target.value))}>
                {NUDGE_STEPS.map((n) => (
                  <option key={n} value={n}>
                    {n / 1000} ثانیه
                  </option>
                ))}
              </select>
            </div>
            {draft.lines.length > 0 && (
              <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 2 }}>
                <span className="hint" style={{ margin: 0 }}>همه‌ی دیالوگ‌ها:</span>
                <button className="btn btn-ghost btn-sm" onClick={() => nudgeAll(-nudgeStep)} title="همه زودتر">
                  − زودتر
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => nudgeAll(nudgeStep)} title="همه دیرتر">
                  + دیرتر
                </button>
              </div>
            )}
          </div>

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
                      <td style={{ padding: 4, width: 150 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <input dir="ltr" value={sec(l.start_ms)} onChange={(e) => updateLine(i, { start_ms: toMs(e.target.value) })} />
                          <button className="btn btn-ghost btn-sm" title="شروع = لحظه‌ی فعلی ویدیو" onClick={() => updateLine(i, { start_ms: nowMs() })}>
                            ⏱
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="شروع زودتر" onClick={() => nudgeLine(i, -nudgeStep, 0)}>
                            −
                          </button>
                          <button className="btn btn-ghost btn-sm" title="شروع دیرتر" onClick={() => nudgeLine(i, nudgeStep, 0)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 4, width: 150 }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <input dir="ltr" value={sec(l.end_ms)} onChange={(e) => updateLine(i, { end_ms: toMs(e.target.value) })} />
                          <button className="btn btn-ghost btn-sm" title="پایان = لحظه‌ی فعلی ویدیو" onClick={() => updateLine(i, { end_ms: nowMs() })}>
                            ⏱
                          </button>
                        </div>
                        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="پایان زودتر" onClick={() => nudgeLine(i, 0, -nudgeStep)}>
                            −
                          </button>
                          <button className="btn btn-ghost btn-sm" title="پایان دیرتر" onClick={() => nudgeLine(i, 0, nudgeStep)}>
                            +
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 4, whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", gap: 2 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => nudgeLine(i, -nudgeStep, -nudgeStep)} title="کل جمله زودتر">
                            ⏪
                          </button>
                          <button className="btn btn-ghost btn-sm" onClick={() => nudgeLine(i, nudgeStep, nudgeStep)} title="کل جمله دیرتر">
                            ⏩
                          </button>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => playSegment(l)} title="پخش همین دیالوگ">
                          ▶
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => previewMuted(l)}
                          disabled={!draft.video_url}
                          title="پیش‌نمایش مثل اپ (صدا سر این جمله قطع می‌شود)"
                        >
                          🔇
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
                    {c.source === "movie"
                      ? `فیلم${c.movie_title ? ` (${c.movie_title}${c.movie_year ? `، ${c.movie_year}` : ""})` : ""}${
                          c.movie_start_ms ? ` @ ${formatTimecode(c.movie_start_ms)}` : ""
                        }${hideMovies ? " · پنهان (سوئیچ سراسری)" : ""}`
                      : "Flow"}
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
