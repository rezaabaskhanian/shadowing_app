"use client";

import { useRef, useState } from "react";
import { API_BASE, uploadImage } from "@/lib/api";

export type StoryImage = { url: string; caption: string };

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

/**
 * عکس‌های «داستان تصویری»: کاربر از روی این عکس‌ها به همین ترتیب داستان
 * می‌گوید. توضیح کوتاه هر عکس به AI داده می‌شود تا بفهمد کاربر همه‌ی عکس‌ها را
 * گفته یا نه (خودِ عکس برای AI فرستاده نمی‌شود، پس هزینه بالا نمی‌رود).
 */
export default function StoryImagesField({
  value,
  onChange,
  notify,
  max = 6,
}: {
  value: StoryImage[];
  onChange: (images: StoryImage[]) => void;
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
    const added: StoryImage[] = [];
    try {
      for (const file of Array.from(files).slice(0, room)) {
        added.push({ url: await uploadImage(file), caption: "" });
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
    <div style={{ marginBottom: 12, padding: 10, border: "1px dashed var(--border, #333)", borderRadius: 8 }}>
      <label>🖼 داستان تصویری (اختیاری)</label>
      <p className="hint" style={{ margin: "0 0 8px" }}>
        اگر عکس بگذاری، این موضوع «داستان تصویری» می‌شود: کاربر عکس‌ها را به همین ترتیب می‌بیند و از رویشان داستان
        می‌گوید. زیر هر عکس یک جمله‌ی کوتاه بنویس که در عکس چه می‌گذرد (مثلاً «مرد کیفش را در کافه جا می‌گذارد») — AI با
        همین بررسی می‌کند که کاربر همه‌ی عکس‌ها را گفته یا نه. ۳ تا ۴ عکس بهترین است.
      </p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {value.map((img, i) => (
          <div
            key={`${img.url}-${i}`}
            style={{ width: 170, border: "1px solid var(--border, #333)", borderRadius: 8, padding: 6 }}
          >
            <div style={{ position: "relative" }}>
              <img src={mediaUrl(img.url)} alt="" style={{ width: "100%", height: 96, objectFit: "cover", borderRadius: 6 }} />
              <span
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  background: "rgba(0,0,0,0.6)",
                  color: "#fff",
                  borderRadius: 10,
                  padding: "0 7px",
                  fontSize: 12,
                }}
              >
                {i + 1}
              </span>
            </div>
            <textarea
              rows={2}
              value={img.caption}
              placeholder="در این عکس چه می‌گذرد؟"
              onChange={(e) => onChange(value.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))}
              style={{ marginTop: 4, fontSize: 12 }}
            />
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
            style={{ width: 170, minHeight: 150 }}
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
