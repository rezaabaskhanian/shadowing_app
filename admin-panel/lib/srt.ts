import type { VideoClipLine } from "./types";

/** «00:01:02,345» یا «00:01:02.345» یا «1:02.3» → میلی‌ثانیه؛ نامعتبر = null. */
export function parseTimecode(value: string): number | null {
  const v = value.trim().replace(",", ".");
  if (!v) return null;
  const parts = v.split(":");
  if (parts.length > 3 || parts.some((p) => p === "" || isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  while (nums.length < 3) nums.unshift(0);
  const [h, m, s] = nums;
  return Math.round(((h * 60 + m) * 60 + s) * 1000);
}

/** میلی‌ثانیه → «HH:MM:SS.mmm» (برای نمایش زمان صحنه در فیلم). */
export function formatTimecode(ms: number): string {
  if (!ms || ms < 0) return "";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  const rest = ms % 1000;
  const pad = (n: number, w = 2) => String(n).padStart(w, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(rest, 3)}`;
}

interface Cue {
  start: number;
  end: number;
  text: string[];
}

const cleanText = (t: string) =>
  t
    .replace(/<[^>]+>/g, "") // <i>, <b>, <font ...>
    .replace(/\{\\[^}]*\}/g, "") // {\an8} و تگ‌های ASS
    .replace(/\s+/g, " ")
    .trim();

/** «JOHN: Hello» → گوینده‌ی JOHN؛ فقط وقتی پیشوند شبیه اسم باشد (کوتاه، بدون نقطه). */
function splitSpeaker(text: string): { speaker: string; text: string } {
  const m = text.match(/^([A-Z][A-Za-z .'-]{0,24}):\s+(.+)$/);
  if (m && !m[1].includes(".")) return { speaker: m[1].trim(), text: m[2].trim() };
  return { speaker: "", text };
}

function parseCues(srt: string): Cue[] {
  const blocks = srt.replace(/^﻿/, "").replace(/\r/g, "").split(/\n\s*\n/);
  const cues: Cue[] = [];
  for (const block of blocks) {
    const rows = block.split("\n").filter((r) => r.trim() !== "");
    const timeIdx = rows.findIndex((r) => r.includes("-->"));
    if (timeIdx === -1) continue;
    const [a, b] = rows[timeIdx].split("-->");
    const start = parseTimecode(a);
    const end = parseTimecode((b || "").trim().split(/\s+/)[0] || "");
    if (start === null || end === null || end <= start) continue;
    const text = rows.slice(timeIdx + 1).map(cleanText).filter(Boolean);
    if (text.length) cues.push({ start, end, text });
  }
  return cues;
}

export interface SrtImportOptions {
  /** زمانِ شروعِ کلیپ در فیلم: زمان‌های زیرنویس منهای این می‌شوند. */
  offsetMs: number;
  /** فقط زیرنویس‌های تا این زمان (نسبت به شروع کلیپ) نگه داشته می‌شوند؛ ۰ = بدون محدودیت. */
  clipDurationMs: number;
}

/**
 * زیرنویس .srt را به دیالوگ‌های کلیپ تبدیل می‌کند. زیرنویسی که دو نفر را با
 * «-» در یک کادر دارد («- Hi.» / «- Hello.») به دو دیالوگ شکسته می‌شود و زمانش
 * به نسبت طول متن تقسیم می‌شود.
 */
export function srtToLines(srt: string, { offsetMs, clipDurationMs }: SrtImportOptions): VideoClipLine[] {
  const out: VideoClipLine[] = [];
  for (const cue of parseCues(srt)) {
    let start = cue.start - offsetMs;
    let end = cue.end - offsetMs;
    if (end <= 0) continue;
    if (clipDurationMs > 0 && start >= clipDurationMs) continue;
    start = Math.max(0, start);
    if (clipDurationMs > 0) end = Math.min(end, clipDurationMs);
    if (end - start < 100) continue;

    const dashed = cue.text.length > 1 && cue.text.every((t) => t.startsWith("-"));
    const parts = dashed ? cue.text.map((t) => t.replace(/^-+\s*/, "")) : [cue.text.join(" ")];
    const total = parts.reduce((n, p) => n + p.length, 0) || 1;
    let cursor = start;
    parts.forEach((part, i) => {
      const partEnd = i === parts.length - 1 ? end : Math.round(cursor + ((end - start) * part.length) / total);
      const { speaker, text } = splitSpeaker(part);
      out.push({ position: out.length, speaker, text, translation_fa: "", start_ms: cursor, end_ms: partEnd });
      cursor = partEnd;
    });
  }
  return out;
}
