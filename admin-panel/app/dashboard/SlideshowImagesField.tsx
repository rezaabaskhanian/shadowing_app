"use client";

import { useRef, useState } from "react";
import { API_BASE, uploadImage } from "@/lib/api";

export type SlideImage = { url: string; from_line: number };

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

/**
 * عکس‌های اسلایدشوی پادکست: در اپ هنگام پخش آرام (محو شدن + بزرگ‌نمایی آرام)
 * جای هم را می‌گیرند. «از جمله‌ی» = شماره‌ی جمله‌ای که عکس از آن به بعد دیده
 * می‌شود؛ خالی (۰) = خودکار، یکنواخت بین کل پادکست.
 */
export default function SlideshowImagesField({
  value,
  onChange,
  lineCount,
  notify,
  max = 12,
}: {
  value: SlideImage[];
  onChange: (images: SlideImage[]) => void;
  lineCount: number;
  notify: (msg: string, type?: "ok" | "err") => void;
  max?: number;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = max - value.length;
    if (room <= 0) {
      notify(`حداکثر ${max} عکس`, "err");
      return;
    }
    setUploading(true);
    const added: SlideImage[] = [];
    try {
      for (const file of Array.from(files).slice(0, room)) {
        added.push({ url: await uploadImage(file), from_line: 0 });
      }
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
      if (added.length) onChange([...value, ...added]);
    }
  }

  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div style={{ marginBottom: 12 }}>
      <label>عکس‌های هنگام پخش (اختیاری — اسلایدشو)</label>
      <p className="hint" style={{ margin: "0 0 6px" }}>
        چند عکس بگذار تا موقع گوش دادن آرام جای هم را بگیرند. «از جمله‌ی» را خالی بگذاری، عکس‌ها خودکار و یکنواخت بین
        جمله‌ها پخش می‌شوند. بدون این عکس‌ها، همان تصویر کارت نشان داده می‌شود.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {value.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            style={{ width: 130, border: "1px solid var(--border, #333)", borderRadius: 8, padding: 6 }}
          >
            <img src={mediaUrl(img.url)} alt="" style={{ width: "100%", height: 74, objectFit: "cover", borderRadius: 6 }} />
            <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
              <span className="hint" style={{ margin: 0, fontSize: 11 }}>
                از جمله‌ی
              </span>
              <input
                dir="ltr"
                type="number"
                min={0}
                max={lineCount || undefined}
                value={img.from_line || ""}
                placeholder="خودکار"
                onChange={(e) =>
                  onChange(value.map((x, j) => (j === i ? { ...x, from_line: Math.max(0, Number(e.target.value) || 0) } : x)))
                }
                style={{ width: 56, padding: "2px 4px" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => move(i, -1)} disabled={i === 0}>
                ◀
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange(value.filter((_, j) => j !== i))}>
                ✕
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => move(i, 1)}
                disabled={i === value.length - 1}
              >
                ▶
              </button>
            </div>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            className="btn btn-ghost"
            style={{ width: 130, minHeight: 120 }}
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "در حال آپلود..." : "+ افزودن عکس"}
          </button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        multiple
        style={{ display: "none" }}
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}
