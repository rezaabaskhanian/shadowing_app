"use client";

import { useState } from "react";
import { API_BASE, uploadImage } from "@/lib/api";

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

/** فیلدِ «تصویرِ کارت» (همان تصویری که کنارِ مورد در صفحه‌ی خانه‌ی اپ دیده می‌شود). */
export default function ImageField({
  label = "تصویر کارت (اختیاری — در صفحه‌ی خانه‌ی اپ کنار این مورد دیده می‌شود)",
  value,
  onChange,
  notify,
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
    } catch (err) {
      notify((err as Error).message, "err");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div style={{ marginBottom: 12 }}>
      <label>{label}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: value ? `center / cover no-repeat url(${mediaUrl(value)})` : "#f3f4f6",
            border: "1px solid #e5e7eb",
            flexShrink: 0,
          }}
        />
        <label className="btn btn-sm" style={{ cursor: "pointer", margin: 0 }}>
          {uploading ? "در حال آپلود..." : value ? "تغییر تصویر" : "آپلود تصویر"}
          <input
            type="file"
            accept="image/*"
            hidden
            disabled={uploading}
            onChange={(e) => {
              onFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
        {value && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onChange("")}>
            حذف
          </button>
        )}
      </div>
    </div>
  );
}
