"use client";

import { useEffect, useState } from "react";
import {
  API_BASE,
  createAssessmentItem,
  deleteAssessmentItem,
  generateAudio,
  listAssessmentItems,
  listTTSVoices,
  updateAssessmentItem,
  uploadAudio,
  type TTSVoice,
} from "@/lib/api";
import type { AssessmentItem, AssessmentItemPayload } from "@/lib/types";

const emptyForm: AssessmentItemPayload = {
  kind: "free_speech",
  category: "situational",
  prompt_text: "",
  target_text: "",
  audio_url: "",
  difficulty: "",
  is_active: true,
};

const kindLabel: Record<string, string> = {
  free_speech: "پاسخ آزاد",
  shadow: "Shadow (تکرار جمله)",
};
const categoryLabel: Record<string, string> = {
  intro: "معرفی خود",
  situational: "موقعیت",
};

export default function AssessmentPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [items, setItems] = useState<AssessmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AssessmentItemPayload>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [voiceId, setVoiceId] = useState("");
  const [speed, setSpeed] = useState(0);
  const [generatingAudio, setGeneratingAudio] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setItems(await listAssessmentItems());
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listTTSVoices()
      .then(setVoices)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startEdit(it: AssessmentItem) {
    setEditingId(it.id);
    setForm({
      kind: it.kind,
      category: it.category,
      prompt_text: it.prompt_text,
      target_text: it.target_text || "",
      audio_url: it.audio_url || "",
      difficulty: it.difficulty || "",
      is_active: it.is_active,
    });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleUploadAudio(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAudio(file);
      setForm((f) => ({ ...f, audio_url: url }));
      notify("صدا آپلود شد", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleGenerateAudio() {
    if (!form.target_text.trim()) {
      notify("اول جمله‌ی هدف (target text) را بنویس", "err");
      return;
    }
    setGeneratingAudio(true);
    try {
      const url = await generateAudio(form.target_text.trim(), voiceId, speed);
      setForm((f) => ({ ...f, audio_url: url }));
      notify("صدا با هوش مصنوعی ساخته شد ✅", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setGeneratingAudio(false);
    }
  }

  async function handleSave() {
    if (!form.prompt_text.trim()) {
      notify("متن سوال/دستور را وارد کن", "err");
      return;
    }
    if (form.kind === "shadow" && (!form.target_text.trim() || !form.audio_url)) {
      notify("برای Shadow، هم جمله‌ی هدف و هم صدای مرجع الزامی است", "err");
      return;
    }

    setSaving(true);
    try {
      const payload: AssessmentItemPayload = {
        ...form,
        prompt_text: form.prompt_text.trim(),
        target_text: form.kind === "shadow" ? form.target_text.trim() : "",
        audio_url: form.kind === "shadow" ? form.audio_url : "",
      };
      if (editingId) {
        await updateAssessmentItem(editingId, payload);
        notify("ویرایش شد ✅", "ok");
      } else {
        await createAssessmentItem(payload);
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
      await deleteAssessmentItem(id);
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
      <p className="hint" style={{ maxWidth: 640 }}>
        این آیتم‌ها برای «تست تعیین سطح» اپ استفاده می‌شوند: هر بار یک «معرفی
        خود» و یک «موقعیت» به‌صورت رندوم از این لیست انتخاب می‌شوند (بدون
        نمره‌ی عددی، فقط رونویسی + بررسی ربط با هوش مصنوعی)، و یک «Shadow»
        رندوم که نمره‌ی واقعی تلفظ می‌گیرد و سطح کاربر را می‌سازد.
      </p>

      <div className="card" style={{ borderColor: "var(--primary)" }}>
        <h2 style={{ marginTop: 0 }}>{editingId ? "ویرایش آیتم" : "افزودن آیتم جدید"}</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 560 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({ ...f, kind: e.target.value as AssessmentItemPayload["kind"] }))
              }
              style={{ flex: 1 }}
            >
              <option value="free_speech">پاسخ آزاد (free_speech)</option>
              <option value="shadow">Shadow (تکرار جمله)</option>
            </select>

            {form.kind === "free_speech" && (
              <select
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    category: e.target.value as AssessmentItemPayload["category"],
                  }))
                }
                style={{ flex: 1 }}
              >
                <option value="intro">معرفی خود</option>
                <option value="situational">موقعیت</option>
              </select>
            )}

            <select
              value={form.difficulty}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  difficulty: e.target.value as AssessmentItemPayload["difficulty"],
                }))
              }
              style={{ flex: 1 }}
            >
              <option value="">سطح دشواری (اختیاری)</option>
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
            </select>
          </div>

          <textarea
            placeholder={
              form.kind === "shadow"
                ? "دستور نمایش‌داده‌شده، مثلاً: به این جمله گوش کن و تکرارش کن"
                : "سوال/دستور، مثلاً: خودت را معرفی کن"
            }
            rows={2}
            value={form.prompt_text}
            onChange={(e) => setForm((f) => ({ ...f, prompt_text: e.target.value }))}
          />

          {form.kind === "shadow" && (
            <>
              <textarea
                placeholder="جمله‌ی هدف انگلیسی (همان چیزی که کاربر باید تکرار کند)"
                rows={2}
                value={form.target_text}
                onChange={(e) => setForm((f) => ({ ...f, target_text: e.target.value }))}
              />
              <div>
                <label>🎙 صدای مرجع</label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input
                    type="file"
                    accept="audio/*"
                    style={{ flex: 1, minWidth: 160 }}
                    onChange={handleUploadAudio}
                  />
                  {voices.length > 0 && (
                    <select
                      value={voiceId}
                      onChange={(e) => setVoiceId(e.target.value)}
                      style={{ minWidth: 170 }}
                    >
                      <option value="">صدای پیش‌فرض</option>
                      {voices.map((v) => (
                        <option key={v.voice_id} value={v.voice_id}>
                          {v.gender === "male" ? "👨" : v.gender === "female" ? "👩" : "🎙"} {v.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <input
                    type="number"
                    min={0.7}
                    max={1.2}
                    step={0.05}
                    title="سرعت گفتار (۰.۷ تا ۱.۲ — پیش‌فرض ۱)"
                    placeholder="سرعت"
                    value={speed || ""}
                    onChange={(e) => setSpeed(Number(e.target.value) || 0)}
                    style={{ width: 80 }}
                  />
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost"
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio}
                  >
                    {generatingAudio ? "در حال ساخت..." : "🔊 تولید با AI"}
                  </button>
                </div>
                {form.audio_url && <audio controls src={`${API_BASE}${form.audio_url}`} />}
              </div>
            </>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
            />
            فعال (در تست‌های جدید قابل انتخاب باشد)
          </label>

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
        items.map((it) => (
          <div key={it.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {kindLabel[it.kind] || it.kind}
                  {it.kind === "free_speech" && ` · ${categoryLabel[it.category] || it.category}`}
                  {!it.is_active && (
                    <span style={{ opacity: 0.5, fontSize: 12 }}> (غیرفعال)</span>
                  )}
                </h3>
                <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {it.prompt_text}
                </p>
                {it.kind === "shadow" && it.target_text && (
                  <p style={{ margin: "4px 0 0", opacity: 0.6, fontSize: 12 }}>
                    🎯 {it.target_text}
                  </p>
                )}
                {it.audio_url && <audio controls src={`${API_BASE}${it.audio_url}`} />}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => startEdit(it)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(it.id)}>
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
