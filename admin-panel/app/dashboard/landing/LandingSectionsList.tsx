"use client";

import { useEffect, useState } from "react";
import {
  API_BASE,
  addLandingSectionImage,
  createLandingSection,
  deleteLandingSection,
  deleteLandingSectionImage,
  listLandingSections,
  updateLandingSection,
  uploadImage,
} from "@/lib/api";
import type { LandingSection } from "@/lib/types";

const emptyForm = { tabLabel: "", title: "", description: "", position: "0" };

export default function LandingSectionsList({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const list = await listLandingSections();
      setSections(list);
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

  function startEdit(s: LandingSection) {
    setEditingId(s.id);
    setForm({
      tabLabel: s.tab_label,
      title: s.title,
      description: s.description,
      position: String(s.position),
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.tabLabel.trim() || !form.title.trim()) {
      notify("برچسب تب و عنوان را وارد کن", "err");
      return;
    }
    setSaving(true);
    try {
      const position = Number(form.position) || 0;
      if (editingId) {
        await updateLandingSection(editingId, form.tabLabel.trim(), form.title.trim(), form.description, position);
        notify("بخش ویرایش شد ✅", "ok");
      } else {
        await createLandingSection(form.tabLabel.trim(), form.title.trim(), form.description, position);
        notify("بخش ساخته شد ✅", "ok");
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
      await deleteLandingSection(id);
      notify("بخش حذف شد", "ok");
      if (editingId === id) {
        setEditingId(null);
        setForm(emptyForm);
      }
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleUploadImage(sectionId: string, file: File) {
    setUploadingFor(sectionId);
    try {
      const url = await uploadImage(file);
      await addLandingSectionImage(sectionId, url);
      notify("عکس اضافه شد ✅", "ok");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setUploadingFor(null);
    }
  }

  async function handleDeleteImage(sectionId: string, imageId: string) {
    try {
      await deleteLandingSectionImage(sectionId, imageId);
      notify("عکس حذف شد", "ok");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  if (loading) return <p className="hint">در حال بارگذاری...</p>;

  return (
    <div>
      <div className="card" style={{ borderColor: "#7C3DFF" }}>
        <h2 style={{ marginTop: 0 }}>
          🌐 {editingId ? "ویرایش بخش" : "افزودن بخش جدید"}
        </h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          این بخش‌ها به‌صورت تکمیلی، پایین‌تر از فیچرها و مراحل کار در صفحه‌ی
          www.lingoflow.ir نمایش داده می‌شوند (متن + عکس کنار هم). ترتیب با
          «موقعیت» (عدد کوچک‌تر = جلوتر) مشخص می‌شود.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 520 }}>
          <input
            placeholder="برچسب تب (کوتاه، مثلاً «فیچر ۱» یا «ارتباط با ما»)"
            value={form.tabLabel}
            onChange={(e) => setForm((f) => ({ ...f, tabLabel: e.target.value }))}
          />
          <input
            placeholder="عنوان بخش"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <textarea
            placeholder="توضیحات بخش"
            rows={4}
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
              {saving ? "..." : editingId ? "ذخیره تغییرات" : "+ افزودن بخش"}
            </button>
            {editingId && (
              <button className="btn btn-ghost btn-sm" onClick={startCreate}>
                انصراف از ویرایش
              </button>
            )}
          </div>
        </div>
      </div>

      {sections.length === 0 ? (
        <p className="hint">هنوز بخشی ساخته نشده.</p>
      ) : (
        sections.map((s) => (
          <div key={s.id} className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h3 style={{ margin: 0 }}>
                  {s.tab_label} <span style={{ opacity: 0.5, fontSize: 12 }}>#{s.position}</span>
                </h3>
                <p style={{ margin: "4px 0", fontWeight: 600 }}>{s.title}</p>
                <p style={{ margin: 0, opacity: 0.8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {s.description}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(s)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s.id)}>
                  حذف
                </button>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                {s.images.map((img) => (
                  <div key={img.id} style={{ position: "relative" }}>
                    <img
                      src={img.url.startsWith("http") ? img.url : `${API_BASE}${img.url}`}
                      alt=""
                      style={{ width: 90, height: 90, objectFit: "cover", borderRadius: 8 }}
                    />
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteImage(s.id, img.id)}
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        background: "var(--danger, #ef4444)",
                        color: "#fff",
                        borderRadius: "50%",
                        width: 22,
                        height: 22,
                        padding: 0,
                        lineHeight: "22px",
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <label className="btn btn-ghost btn-sm" style={{ display: "inline-block", cursor: "pointer" }}>
                {uploadingFor === s.id ? "در حال آپلود..." : "+ افزودن عکس"}
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  disabled={uploadingFor === s.id}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUploadImage(s.id, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
