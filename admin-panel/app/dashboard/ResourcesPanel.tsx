"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteResource, getResource, listResources, saveResource } from "@/lib/api";
import type { ContentResource, ResourceKind } from "@/lib/types";

const KINDS: { id: ResourceKind; label: string }[] = [
  { id: "lesson", label: "درس" },
  { id: "scene", label: "صحنه" },
  { id: "podcast", label: "پادکست" },
  { id: "vocabulary", label: "لغت/اصطلاح" },
  { id: "other", label: "سایر" },
];

const kindLabel = (k: string) => KINDS.find((x) => x.id === k)?.label ?? k;

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDate = (s: string) => {
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("fa-IR");
};

/** عنوانِ پیش‌فرض: اول title خود JSON (اگر بود)، بعد اسم فایل بدون پسوند. */
function guessTitle(content: unknown, fileName: string) {
  if (content && typeof content === "object" && !Array.isArray(content)) {
    const o = content as Record<string, unknown>;
    for (const k of ["title", "title_en", "title_fa", "name"]) {
      if (typeof o[k] === "string" && (o[k] as string).trim()) return (o[k] as string).trim();
    }
  }
  return fileName.replace(/\.json$/i, "");
}

function download(fileName: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

type EditDraft = { id: string; title: string; kind: ResourceKind; notes: string };

/**
 * «کتابخانه‌ی محتوا»: فایل‌های JSON (مثلاً درس‌های آماده) فقط برای نگه‌داری و
 * مرجع ذخیره می‌شوند و در اپ نمایش داده نمی‌شوند. چند فایل را می‌شود یک‌جا
 * آپلود کرد یا متن JSON را مستقیم چسباند.
 */
export default function ResourcesPanel({ notify }: { notify: (msg: string, type?: "ok" | "err") => void }) {
  const [items, setItems] = useState<ContentResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadKind, setUploadKind] = useState<ResourceKind>("lesson");
  const [uploading, setUploading] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteTitle, setPasteTitle] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"" | ResourceKind>("");
  const [viewing, setViewing] = useState<ContentResource | null>(null);
  const [editing, setEditing] = useState<EditDraft | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      setItems(await listResources());
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

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    const failed: string[] = [];
    for (const file of Array.from(files)) {
      try {
        const content = JSON.parse(await file.text());
        await saveResource({
          title: guessTitle(content, file.name),
          kind: uploadKind,
          notes: "",
          file_name: file.name,
          content,
        });
        ok++;
      } catch (err: any) {
        failed.push(`${file.name}: ${err instanceof SyntaxError ? "JSON نامعتبر" : err.message}`);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (ok) notify(`${ok} فایل ذخیره شد`);
    if (failed.length) notify(`ذخیره نشد — ${failed.join(" | ")}`, "err");
    load();
  }

  async function handlePaste() {
    let content: unknown;
    try {
      content = JSON.parse(pasteText);
    } catch {
      notify("متن JSON معتبر نیست", "err");
      return;
    }
    setUploading(true);
    try {
      await saveResource({ title: pasteTitle.trim() || guessTitle(content, ""), kind: uploadKind, notes: "", content });
      notify("ذخیره شد");
      setPasteOpen(false);
      setPasteTitle("");
      setPasteText("");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setUploading(false);
    }
  }

  async function open(r: ContentResource) {
    try {
      setViewing(await getResource(r.id));
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleDownload(r: ContentResource) {
    try {
      const full = await getResource(r.id);
      download(r.file_name || r.title, full.content);
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleSaveEdit() {
    if (!editing) return;
    try {
      await saveResource(editing);
      notify("ذخیره شد");
      setEditing(null);
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleDelete(r: ContentResource) {
    if (!confirm(`فایل «${r.title}» حذف شود؟`)) return;
    try {
      await deleteResource(r.id);
      notify("حذف شد");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (r) =>
        (!kindFilter || r.kind === kindFilter) &&
        (!q || r.title.toLowerCase().includes(q) || r.file_name.toLowerCase().includes(q) || r.notes.toLowerCase().includes(q))
    );
  }, [items, search, kindFilter]);

  return (
    <div>
      <div className="card">
        <h2 style={{ margin: 0 }}>📚 کتابخانه‌ی محتوا</h2>
        <p className="hint" style={{ margin: "4px 0 12px" }}>
          فایل‌های JSON (مثل درس‌های آماده) این‌جا فقط برای نگه‌داری و مرجع ذخیره می‌شوند و در اپ نمایش داده نمی‌شوند.
          می‌توانی چند فایل را با هم انتخاب کنی؛ عنوان از «title» خود فایل یا اسم فایل برداشته می‌شود.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={uploadKind} onChange={(e) => setUploadKind(e.target.value as ResourceKind)} style={{ width: "auto" }}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                نوع: {k.label}
              </option>
            ))}
          </select>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            multiple
            style={{ display: "none" }}
            onChange={(e) => handleFiles(e.target.files)}
          />
          <button className="btn btn-sm" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "در حال ذخیره..." : "⬆️ آپلود فایل‌های JSON"}
          </button>
          <button className="btn btn-sm btn-ghost" onClick={() => setPasteOpen((v) => !v)} disabled={uploading}>
            📋 چسباندن متن JSON
          </button>
        </div>

        {pasteOpen && (
          <div style={{ marginTop: 12 }}>
            <label>عنوان (اختیاری)</label>
            <input value={pasteTitle} onChange={(e) => setPasteTitle(e.target.value)} placeholder="مثلاً درس ۱ — سلام و احوال‌پرسی" />
            <label>متن JSON</label>
            <textarea dir="ltr" rows={10} value={pasteText} onChange={(e) => setPasteText(e.target.value)} placeholder='{ "title": "...", ... }' />
            <button className="btn btn-sm" onClick={handlePaste} disabled={uploading || !pasteText.trim()} style={{ marginTop: 8 }}>
              ذخیره
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          <input
            placeholder="جستجو در عنوان، اسم فایل یا یادداشت"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select value={kindFilter} onChange={(e) => setKindFilter(e.target.value as "" | ResourceKind)} style={{ width: "auto" }}>
            <option value="">همه‌ی نوع‌ها</option>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : filtered.length === 0 ? (
          <p className="hint">{items.length === 0 ? "هنوز فایلی ذخیره نشده." : "فایلی با این فیلتر پیدا نشد."}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((r) =>
              editing?.id === r.id ? (
                <div key={r.id} style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 10 }}>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ flex: "1 1 260px" }}>
                      <label>عنوان</label>
                      <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                    </div>
                    <div>
                      <label>نوع</label>
                      <select value={editing.kind} onChange={(e) => setEditing({ ...editing, kind: e.target.value as ResourceKind })}>
                        {KINDS.map((k) => (
                          <option key={k.id} value={k.id}>
                            {k.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <label>یادداشت</label>
                  <textarea rows={2} value={editing.notes} onChange={(e) => setEditing({ ...editing, notes: e.target.value })} />
                  <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                    <button className="btn btn-sm" onClick={handleSaveEdit} disabled={!editing.title.trim()}>
                      ذخیره
                    </button>
                    <button className="btn btn-sm btn-ghost" onClick={() => setEditing(null)}>
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={r.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                    border: "1px solid var(--border, #333)",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700 }}>{r.title}</div>
                    <div className="hint" style={{ margin: 0 }}>
                      {kindLabel(r.kind)} · {formatSize(r.size_bytes)} · {formatDate(r.created_at)}
                      {r.file_name ? (
                        <>
                          {" · "}
                          <span dir="ltr">{r.file_name}</span>
                        </>
                      ) : null}
                    </div>
                    {r.notes && (
                      <div className="hint" style={{ margin: "2px 0 0" }}>
                        {r.notes}
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => open(r)}>
                      مشاهده
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDownload(r)}>
                      دانلود
                    </button>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => setEditing({ id: r.id, title: r.title, kind: r.kind, notes: r.notes })}
                    >
                      ویرایش
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r)}>
                      حذف
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {viewing && (
        <div
          className="modal-back"
          onClick={(e) => {
            if (e.target === e.currentTarget) setViewing(null);
          }}
        >
          <div className="modal">
            <div className="modal-head">
              <h3 style={{ margin: 0 }}>{viewing.title}</h3>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(viewing.content, null, 2));
                    notify("کپی شد");
                  }}
                >
                  کپی
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => setViewing(null)}>
                  بستن
                </button>
              </div>
            </div>
            <pre
              dir="ltr"
              style={{ fontSize: 12, whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0, maxHeight: "70vh", overflow: "auto" }}
            >
              {JSON.stringify(viewing.content, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
