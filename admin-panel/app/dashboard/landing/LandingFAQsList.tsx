"use client";

import { useEffect, useState } from "react";
import { createLandingFAQ, deleteLandingFAQ, listLandingFAQs, updateLandingFAQ } from "@/lib/api";
import type { LandingFAQ } from "@/lib/types";

const emptyForm = { question: "", answer: "", position: "0" };

export default function LandingFAQsList({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [faqs, setFaqs] = useState<LandingFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setFaqs(await listLandingFAQs());
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

  function startEdit(f: LandingFAQ) {
    setEditingId(f.id);
    setForm({ question: f.question, answer: f.answer, position: String(f.position) });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.question.trim()) {
      notify("سوال را وارد کن", "err");
      return;
    }
    setSaving(true);
    try {
      const position = Number(form.position) || 0;
      if (editingId) {
        await updateLandingFAQ(editingId, form.question.trim(), form.answer, position);
        notify("ویرایش شد ✅", "ok");
      } else {
        await createLandingFAQ(form.question.trim(), form.answer, position);
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
      await deleteLandingFAQ(id);
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
      <div className="card" style={{ borderColor: "#7C3DFF" }}>
        <h2 style={{ marginTop: 0 }}>{editingId ? "ویرایش سوال متداول" : "افزودن سوال متداول"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
          <input
            placeholder="سوال"
            value={form.question}
            onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          />
          <textarea
            placeholder="جواب"
            rows={3}
            value={form.answer}
            onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
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

      {faqs.length === 0 ? (
        <p className="hint">هنوز سوالی ساخته نشده.</p>
      ) : (
        faqs.map((f) => (
          <div key={f.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {f.question} <span style={{ opacity: 0.5, fontSize: 12 }}>#{f.position}</span>
                </h3>
                <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13, whiteSpace: "pre-wrap" }}>{f.answer}</p>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(f)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f.id)}>
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
