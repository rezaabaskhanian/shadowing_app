"use client";

import { useEffect, useState } from "react";
import {
  createLandingHighlight,
  deleteLandingHighlight,
  listLandingHighlights,
  updateLandingHighlight,
} from "@/lib/api";
import type { LandingHighlight, LandingHighlightKind } from "@/lib/types";

const emptyForm = { icon: "", title: "", description: "", position: "0" };

export default function LandingHighlightsList({
  kind,
  title,
  hint,
  notify,
}: {
  kind: LandingHighlightKind;
  title: string;
  hint: string;
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [items, setItems] = useState<LandingHighlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await listLandingHighlights(kind));
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  function startEdit(item: LandingHighlight) {
    setEditingId(item.id);
    setForm({
      icon: item.icon,
      title: item.title,
      description: item.description,
      position: String(item.position),
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.title.trim()) {
      notify("عنوان را وارد کن", "err");
      return;
    }
    setSaving(true);
    try {
      const position = Number(form.position) || 0;
      if (editingId) {
        await updateLandingHighlight(kind, editingId, form.icon.trim(), form.title.trim(), form.description, position);
        notify("ویرایش شد ✅", "ok");
      } else {
        await createLandingHighlight(kind, form.icon.trim(), form.title.trim(), form.description, position);
        notify("اضافه شد ✅", "ok");
      }
      setForm(emptyForm);
      setEditingId(null);
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteLandingHighlight(kind, id);
      notify("حذف شد", "ok");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  if (loading) return <p className="hint">در حال بارگذاری...</p>;

  return (
    <div>
      <div className="card" style={{ borderColor: "var(--primary)" }}>
        <h2 style={{ marginTop: 0 }}>
          {editingId ? `ویرایش آیتم — ${title}` : `افزودن آیتم — ${title}`}
        </h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>{hint}</p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 480 }}>
          <input
            placeholder="آیکون (یک ایموجی، مثلاً 🎙️)"
            value={form.icon}
            onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))}
            style={{ width: 160 }}
          />
          <input
            placeholder="عنوان"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            placeholder="توضیح کوتاه"
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
          <input
            placeholder="موقعیت (ترتیب نمایش)"
            type="number"
            value={form.position}
            onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
            style={{ width: 160 }}
          />
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "..." : editingId ? "ذخیره تغییرات" : "+ افزودن"}
            </button>
            {editingId && (
              <button className="btn btn-ghost btn-sm" onClick={startCreate}>
                انصراف از ویرایش
              </button>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="hint">هنوز آیتمی ساخته نشده.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {item.icon} {item.title} <span style={{ opacity: 0.5, fontSize: 12 }}>#{item.position}</span>
                </h3>
                <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {item.description}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(item)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(item.id)}>
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
