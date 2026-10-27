"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ImageField from "./ImageField";
import { API_BASE, deleteSong, getSong, listSongs, saveSong, uploadAudio } from "@/lib/api";
import type { Song, SongLine } from "@/lib/types";

type Draft = Omit<Song, "id"> & { id?: string };

const LEVELS = [
  { id: "starter", label: "قدم اول" },
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
  { id: "proficient", label: "حرفه‌ای (C1)" },
] as const;

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

const emptyDraft = (position = 0): Draft => ({
  title: "",
  artist: "",
  description_fa: "",
  level: "beginner",
  cover_url: "",
  audio_url: "",
  instrumental_url: "",
  duration_seconds: 0,
  lines: [],
  vocabulary: [],
  license_note: "",
  position,
  is_active: false,
});

const fmt = (ms: number) => {
  const s = Math.max(0, ms) / 1000;
  return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`;
};

// زیرنویس SRT یا LRC را به خط‌های زمان‌دار تبدیل می‌کند. در LRC پایانِ هر خط شروعِ
// خط بعدی است و پایانِ خط آخر ۴ ثانیه بعد از شروعش (یا طول آهنگ).
function parseSubtitles(raw: string, durationSec: number): SongLine[] {
  const text = raw.replace(/\r/g, "");
  const toMs = (h: string, m: string, sec: string, frac = "0") =>
    ((+h * 60 + +m) * 60 + +sec) * 1000 + Math.round(+`0.${frac}` * 1000);
  if (/-->/.test(text)) {
    const out: SongLine[] = [];
    for (const block of text.split(/\n\s*\n/)) {
      const rows = block.split("\n").map((r) => r.trim()).filter(Boolean);
      const ti = rows.findIndex((r) => r.includes("-->"));
      if (ti < 0) continue;
      const m = rows[ti].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/);
      const words = rows.slice(ti + 1).join(" ").replace(/<[^>]+>/g, "").trim();
      if (!m || !words) continue;
      out.push({ text: words, translation_fa: "", start_ms: toMs(m[1], m[2], m[3], m[4]), end_ms: toMs(m[5], m[6], m[7], m[8]) });
    }
    return out;
  }
  const timed: { ms: number; text: string }[] = [];
  for (const row of text.split("\n")) {
    const stamps = [...row.matchAll(/\[(\d+):(\d+)(?:[.:](\d+))?\]/g)];
    const words = row.replace(/\[[^\]]*\]/g, "").trim();
    for (const st of stamps) timed.push({ ms: toMs("0", st[1], st[2], st[3] ?? "0"), text: words });
  }
  timed.sort((a, b) => a.ms - b.ms);
  const lines = timed.filter((x) => x.text);
  return lines.map((l) => {
    const next = timed.find((x) => x.ms > l.ms);
    const end = next ? next.ms : durationSec > 0 ? Math.min(durationSec * 1000, l.ms + 4000) : l.ms + 4000;
    return { text: l.text, translation_fa: "", start_ms: l.ms, end_ms: Math.max(end, l.ms + 300) };
  });
}

// همان شرط‌های انتشارِ سرور، تا قبل از ذخیره دیده شوند.
function publishProblem(d: Draft): string {
  if (!d.audio_url) return "فایل صدای آهنگ آپلود نشده";
  if (d.lines.length === 0) return "متن آهنگ خالی است";
  let prevEnd = 0;
  for (let i = 0; i < d.lines.length; i++) {
    const l = d.lines[i];
    if (l.end_ms <= l.start_ms) return `زمان خط ${i + 1} کامل نیست`;
    if (l.start_ms < prevEnd) return `خط ${i + 1} قبل از تمام شدن خط قبلی شروع شده`;
    prevEnd = l.end_ms;
  }
  return "";
}

/**
 * بخش «آهنگ»: آهنگ آماده آپلود می‌شود، متن خط‌به‌خط چسبانده می‌شود و زمان هر خط با
 * «ضربه زدن هم‌زمان با آهنگ» گذاشته می‌شود (Space یا دکمه، دقیقاً وقتی خواننده آن خط
 * را شروع می‌کند). نسخه‌ی بی‌کلام (اختیاری) برای «با آهنگ بخوان» در اپ است.
 */
export default function SongsPanel({ notify }: { notify: (msg: string, type?: "ok" | "err") => void }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<"" | "save" | "upload">("");
  const [lyrics, setLyrics] = useState("");
  // اندیس خطی که ضربه‌ی بعدی شروعش را ثبت می‌کند؛ null = همگام‌سازی خاموش.
  const [syncIdx, setSyncIdx] = useState<number | null>(null);
  const [nowMs, setNowMs] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stopAtRef = useRef<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSongs(await listSongs());
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    load();
  }, [load]);

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const setLine = (i: number, patch: Partial<SongLine>) =>
    setDraft((d) => (d ? { ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : d));

  async function open(id: string) {
    try {
      const s = await getSong(id);
      setDraft(s);
      setLyrics(s.lines.map((l) => l.text).join("\n"));
      setSyncIdx(null);
    } catch (err) {
      notify((err as Error).message, "err");
    }
  }

  function startNew() {
    setDraft(emptyDraft(songs.length));
    setLyrics("");
    setSyncIdx(null);
  }

  // متن چسبانده‌شده را به خط تبدیل می‌کند؛ ترجمه و زمانِ خط‌هایی که متنشان عوض نشده می‌ماند.
  function applyLyrics() {
    if (!draft) return;
    const texts = lyrics
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
    const old = new Map(draft.lines.map((l) => [l.text, l]));
    update({
      lines: texts.map((text) => old.get(text) ?? { text, translation_fa: "", start_ms: 0, end_ms: 0 }),
    });
    notify(`${texts.length} خط ساخته شد`);
  }

  async function importSubtitles(file: File | undefined) {
    if (!file || !draft) return;
    const parsed = parseSubtitles(await file.text(), draft.duration_seconds);
    if (!parsed.length) {
      notify("خطی در این فایل پیدا نشد (فقط SRT و LRC)", "err");
      return;
    }
    // ترجمه‌ی خط‌هایی که متنشان همان قبلی است حفظ می‌شود.
    const oldFa = new Map(draft.lines.map((l) => [l.text, l.translation_fa]));
    update({ lines: parsed.map((l) => ({ ...l, translation_fa: oldFa.get(l.text) ?? "" })) });
    setLyrics(parsed.map((l) => l.text).join("\n"));
    notify(`${parsed.length} خط با زمان وارد شد`);
  }

  async function upload(field: "audio_url" | "instrumental_url", file: File | undefined) {
    if (!file) return;
    setBusy("upload");
    try {
      update({ [field]: await uploadAudio(file) } as Partial<Draft>);
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setBusy("");
    }
  }

  // ---------- همگام‌سازی ----------
  const curMs = () => Math.round((audioRef.current?.currentTime ?? 0) * 1000);

  function startSync() {
    const a = audioRef.current;
    if (!a || !draft?.lines.length) return;
    update({ lines: draft.lines.map((l) => ({ ...l, start_ms: 0, end_ms: 0 })) });
    stopAtRef.current = null;
    a.currentTime = 0;
    a.play();
    setSyncIdx(0);
  }

  // یک ضربه: شروع خط فعلی = الان، و پایان خط قبلی = الان (اگر خودش زودتر بسته نشده).
  const tap = useCallback(() => {
    if (syncIdx === null || !draft) return;
    const t = curMs();
    setDraft((d) => {
      if (!d) return d;
      const lines = d.lines.map((l) => ({ ...l }));
      if (syncIdx > 0 && lines[syncIdx - 1].end_ms <= lines[syncIdx - 1].start_ms) lines[syncIdx - 1].end_ms = t;
      if (syncIdx < lines.length) lines[syncIdx].start_ms = t;
      return { ...d, lines };
    });
    setSyncIdx(syncIdx + 1);
  }, [syncIdx, draft]);

  // پایان خطِ در حال خواندن (برای مکث‌های بی‌کلام بین خط‌ها، یا خط آخر).
  const endLine = useCallback(() => {
    if (syncIdx === null || syncIdx === 0) return;
    const t = curMs();
    setLine(syncIdx - 1, { end_ms: t });
    if (draft && syncIdx >= draft.lines.length) {
      audioRef.current?.pause();
      setSyncIdx(null);
      notify("همگام‌سازی تمام شد؛ با ▶ هر خط را چک کن و ذخیره کن.");
    }
  }, [syncIdx, draft, notify]);

  useEffect(() => {
    if (syncIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        tap();
      } else if (e.code === "Enter") {
        e.preventDefault();
        endLine();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [syncIdx, tap, endLine]);

  function playLine(l: SongLine) {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = l.start_ms / 1000;
    stopAtRef.current = l.end_ms > l.start_ms ? l.end_ms : null;
    a.play();
  }

  function nudge(i: number, field: "start_ms" | "end_ms", delta: number) {
    if (!draft) return;
    setLine(i, { [field]: Math.max(0, draft.lines[i][field] + delta) } as Partial<SongLine>);
  }

  async function save() {
    if (!draft) return;
    if (draft.is_active) {
      const p = publishProblem(draft);
      if (p) {
        notify(`قابل انتشار نیست: ${p}`, "err");
        return;
      }
    }
    setBusy("save");
    try {
      const saved = await saveSong(draft);
      setDraft(saved);
      notify("ذخیره شد");
      load();
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setBusy("");
    }
  }

  async function remove(s: Song) {
    if (!confirm(`«${s.title}» حذف شود؟`)) return;
    try {
      await deleteSong(s.id);
      if (draft?.id === s.id) setDraft(null);
      load();
    } catch (err) {
      notify((err as Error).message, "err");
    }
  }

  const problem = draft ? publishProblem(draft) : "";
  const activeIdx = draft ? draft.lines.findIndex((l) => l.end_ms > l.start_ms && nowMs >= l.start_ms && nowMs < l.end_ms) : -1;

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h3 style={{ margin: 0 }}>🎵 آهنگ</h3>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              آهنگ آماده + متن خط‌به‌خط که در اپ هم‌زمان با صدا هایلایت می‌شود (مثل داستان). فقط آهنگی بگذار که حق
              استفاده‌اش را داری (ساخته‌ی خودت، مجوز تجاری از سازنده، یا مالکیت عمومی).
            </p>
          </div>
          <button className="btn" onClick={startNew} disabled={!!busy}>
            + آهنگ جدید
          </button>
        </div>
      </div>

      {draft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش آهنگ" : "آهنگ جدید"}</h3>

          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 2 }}>
              <label>عنوان (انگلیسی)</label>
              <input dir="ltr" value={draft.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>خواننده / سازنده</label>
              <input dir="ltr" value={draft.artist} onChange={(e) => update({ artist: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => update({ level: e.target.value as Draft["level"] })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label>توضیح کوتاه (فارسی)</label>
          <textarea rows={2} value={draft.description_fa} onChange={(e) => update({ description_fa: e.target.value })} />

          <ImageField label="کاور آهنگ" value={draft.cover_url} onChange={(url) => update({ cover_url: url })} notify={notify} />

          <label>یادداشت منبع (اختیاری، فقط ادمین می‌بیند)</label>
          <input
            value={draft.license_note}
            placeholder="مثلاً: ساخته‌شده با Suno، پلن Pro، مجوز تجاری — ۱۴۰۵/۰۸/۰۵"
            onChange={(e) => update({ license_note: e.target.value })}
          />

          <div className="card" style={{ marginTop: 12, background: "var(--surface-2, transparent)" }}>
            <strong>صدا</strong>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              <label className="btn btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                {busy === "upload" ? "در حال آپلود..." : draft.audio_url ? "تغییر آهنگ اصلی" : "آپلود آهنگ اصلی (با کلام)"}
                <input type="file" accept="audio/*" hidden disabled={!!busy} onChange={(e) => { upload("audio_url", e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }}>
                {draft.instrumental_url ? "✓ نسخه‌ی بی‌کلام — تغییر" : "آپلود نسخه‌ی بی‌کلام (اختیاری، برای «با آهنگ بخوان»)"}
                <input type="file" accept="audio/*" hidden disabled={!!busy} onChange={(e) => { upload("instrumental_url", e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {draft.instrumental_url && (
                <button className="btn btn-ghost btn-sm" onClick={() => update({ instrumental_url: "" })}>
                  حذف بی‌کلام
                </button>
              )}
            </div>
            {draft.audio_url && (
              <audio
                ref={audioRef}
                controls
                src={mediaUrl(draft.audio_url)}
                style={{ width: "100%", marginTop: 8 }}
                onLoadedMetadata={(e) => update({ duration_seconds: Math.round(e.currentTarget.duration || 0) })}
                onTimeUpdate={(e) => {
                  const ms = Math.round(e.currentTarget.currentTime * 1000);
                  setNowMs(ms);
                  if (stopAtRef.current !== null && ms >= stopAtRef.current) {
                    e.currentTarget.pause();
                    stopAtRef.current = null;
                  }
                }}
              />
            )}
            {draft.duration_seconds > 0 && <p className="hint">طول آهنگ: {fmt(draft.duration_seconds * 1000)}</p>}
          </div>

          <h4 style={{ marginBottom: 4 }}>متن آهنگ</h4>
          <p className="hint" style={{ marginTop: 0 }}>
            هر خط آهنگ در یک سطر. بعد «ساخت خط‌ها» را بزن؛ ترجمه و زمانِ خط‌هایی که عوض نشده‌اند می‌ماند.
          </p>
          <textarea dir="ltr" rows={6} value={lyrics} onChange={(e) => setLyrics(e.target.value)} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn btn-ghost btn-sm" onClick={applyLyrics} disabled={!lyrics.trim()}>
              ساخت خط‌ها از متن
            </button>
            <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: 0 }}>
              وارد کردن زیرنویس با زمان (.srt / .lrc)
              <input
                type="file"
                accept=".srt,.lrc,text/plain"
                hidden
                onChange={(e) => {
                  importSubtitles(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {draft.lines.length > 0 && (
            <div className="card" style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <strong>زمان‌بندی ({draft.lines.filter((l) => l.end_ms > l.start_ms).length}/{draft.lines.length})</strong>
                {syncIdx === null ? (
                  <button className="btn btn-sm" onClick={startSync} disabled={!draft.audio_url}>
                    ⏱ شروع همگام‌سازی
                  </button>
                ) : (
                  <>
                    <button className="btn btn-sm" onClick={tap} disabled={syncIdx >= draft.lines.length}>
                      ▶ شروع خط {Math.min(syncIdx + 1, draft.lines.length)} (Space)
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={endLine} disabled={syncIdx === 0}>
                      ■ پایان خط {syncIdx} (Enter)
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => {
                        audioRef.current?.pause();
                        setSyncIdx(null);
                      }}
                    >
                      توقف
                    </button>
                  </>
                )}
              </div>
              <p className="hint">
                همگام‌سازی آهنگ را از اول پخش می‌کند. هر بار که خواننده یک خط را <b>شروع</b> می‌کند Space بزن؛ اگر بعد از
                خطی مکث بی‌کلام طولانی است، آخرِ آن خط Enter بزن. آخرِ خط آخر هم Enter. بعد با ▶ هر خط را چک کن و با
                دکمه‌های ±۰٫۱ ثانیه دقیقش کن.
              </p>
              {!draft.audio_url && <p className="hint">اول آهنگ اصلی را آپلود کن.</p>}

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {draft.lines.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      border: `1px solid ${i === activeIdx || i === syncIdx ? "#FF7A59" : "var(--border, #333)"}`,
                      background: i === activeIdx ? "rgba(255,122,89,0.08)" : undefined,
                      borderRadius: 8,
                      padding: 8,
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span className="hint" style={{ margin: 0, minWidth: 22 }}>
                        {i + 1}
                      </span>
                      <div dir="ltr" style={{ flex: 1, fontWeight: 600 }}>
                        {l.text}
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={() => playLine(l)} disabled={!draft.audio_url || l.end_ms <= l.start_ms}>
                        ▶
                      </button>
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 6, flexWrap: "wrap" }}>
                      <input
                        placeholder="ترجمه‌ی فارسی"
                        value={l.translation_fa}
                        onChange={(e) => setLine(i, { translation_fa: e.target.value })}
                        style={{ flex: 1, minWidth: 200 }}
                      />
                      {(["start_ms", "end_ms"] as const).map((f) => (
                        <span key={f} style={{ display: "inline-flex", alignItems: "center", gap: 2 }} dir="ltr">
                          <span className="hint" style={{ margin: 0 }}>
                            {f === "start_ms" ? "از" : "تا"}
                          </span>
                          <button className="btn btn-ghost btn-sm" onClick={() => nudge(i, f, -100)}>
                            −
                          </button>
                          <span style={{ minWidth: 52, textAlign: "center", fontFamily: "monospace" }}>{fmt(l[f])}</span>
                          <button className="btn btn-ghost btn-sm" onClick={() => nudge(i, f, 100)}>
                            +
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h4 style={{ marginBottom: 4 }}>لغت‌های مهم ({draft.vocabulary.length})</h4>
          {draft.vocabulary.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input
                dir="ltr"
                value={v.word}
                onChange={(e) => update({ vocabulary: draft.vocabulary.map((x, j) => (j === i ? { ...x, word: e.target.value } : x)) })}
                style={{ flex: 1 }}
              />
              <input
                value={v.meaning_fa}
                onChange={(e) => update({ vocabulary: draft.vocabulary.map((x, j) => (j === i ? { ...x, meaning_fa: e.target.value } : x)) })}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => update({ vocabulary: draft.vocabulary.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => update({ vocabulary: [...draft.vocabulary, { word: "", meaning_fa: "" }] })}>
            + لغت
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(e) => update({ is_active: e.target.checked })}
              style={{ width: "auto" }}
            />
            فعال (در اپ منتشر شود)
          </label>
          {problem && <p className="hint">برای انتشار: {problem}</p>}

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={save} disabled={!!busy || !draft.title.trim()}>
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
        ) : songs.length === 0 ? (
          <p className="hint">هنوز آهنگی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {songs.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: s.is_active ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }} dir="ltr">
                    {s.title}
                    {s.artist ? ` — ${s.artist}` : ""}
                  </div>
                  <div className="hint" style={{ margin: 0 }}>
                    {LEVELS.find((l) => l.id === s.level)?.label} · {s.line_count ?? 0} خط
                    {s.duration_seconds > 0 && ` · ${fmt(s.duration_seconds * 1000)}`}
                    {s.instrumental_url ? " · بی‌کلام دارد" : ""}
                    {s.is_active ? " · منتشرشده" : " · پیش‌نویس"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => open(s.id)} disabled={!!busy}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(s)} disabled={!!busy}>
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
