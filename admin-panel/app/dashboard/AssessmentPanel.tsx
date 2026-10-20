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
  cefr: "",
  band: 1,
  is_pseudo: false,
  options: [],
  correct_index: 0,
  is_active: true,
};

const kindLabel: Record<string, string> = {
  free_speech: "پاسخ آزاد",
  shadow: "Shadow (تکرار جمله، نسخه‌ی ۱)",
  vocab_yesno: "لغت بله/خیر (v2)",
  listen_choice: "شنیدن چندگزینه‌ای (v2)",
  imitation: "تکرار جمله‌ی بلندشونده (v2)",
};

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1"];
// کدام kind جمله‌ی هدف و صدا دارد
const hasAudio = (k: string) => k === "shadow" || k === "listen_choice" || k === "imitation";
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
  const [kindFilter, setKindFilter] = useState<string>("all");

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
      cefr: it.cefr || "",
      band: it.band || 1,
      is_pseudo: !!it.is_pseudo,
      options: it.options || [],
      correct_index: it.correct_index ?? 0,
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
    if (hasAudio(form.kind) && (!form.target_text.trim() || !form.audio_url)) {
      notify("برای این نوع، هم جمله‌ی هدف و هم صدای مرجع الزامی است", "err");
      return;
    }
    if ((form.kind === "listen_choice" || form.kind === "imitation") && !form.cefr) {
      notify("سطح CEFR را انتخاب کن", "err");
      return;
    }
    if (form.kind === "listen_choice" && form.options.filter((o) => o.trim()).length < 2) {
      notify("دست‌کم دو گزینه لازم است", "err");
      return;
    }

    setSaving(true);
    try {
      const payload: AssessmentItemPayload = {
        ...form,
        prompt_text: form.prompt_text.trim(),
        target_text: hasAudio(form.kind) ? form.target_text.trim() : "",
        audio_url: hasAudio(form.kind) ? form.audio_url : "",
        options: form.options.map((o) => o.trim()).filter(Boolean),
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
        نسخه‌ی ۱ (اپ‌های قدیمی): «معرفی خود»، «موقعیت» و «Shadow». نسخه‌ی ۲:
        «لغت بله/خیر» (۱۲ کلمه در هر لایه‌ی بسامدی + ۲۰ کلمه‌ی ساختگی)،
        «شنیدن چندگزینه‌ای» (۳ جمله در هر سطح CEFR) و «تکرار جمله‌ی بلندشونده»
        (یکی در هر سطح). سطح شروع = فهمیدن (لغت + شنیدن)؛ «معرفی خود» در نسخه‌ی
        ۲ اختیاری است و فقط بازخورد می‌دهد.
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
              <option value="shadow">Shadow (تکرار جمله، نسخه‌ی ۱)</option>
              <option value="vocab_yesno">لغت بله/خیر (v2)</option>
              <option value="listen_choice">شنیدن چندگزینه‌ای (v2)</option>
              <option value="imitation">تکرار جمله‌ی بلندشونده (v2)</option>
            </select>

            {form.kind === "vocab_yesno" && (
              <>
                <select
                  value={form.band}
                  onChange={(e) => setForm((f) => ({ ...f, band: Number(e.target.value) }))}
                  style={{ flex: 1 }}
                  disabled={form.is_pseudo}
                >
                  {[1, 2, 3, 4, 5].map((b) => (
                    <option key={b} value={b}>
                      لایه‌ی {b} ({(b - 1) * 1000 + 1} تا {b * 1000})
                    </option>
                  ))}
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 4, whiteSpace: "nowrap" }}>
                  <input
                    type="checkbox"
                    checked={form.is_pseudo}
                    onChange={(e) => setForm((f) => ({ ...f, is_pseudo: e.target.checked }))}
                  />
                  کلمه‌ی ساختگی
                </label>
              </>
            )}

            {(form.kind === "listen_choice" || form.kind === "imitation") && (
              <select
                value={form.cefr}
                onChange={(e) => setForm((f) => ({ ...f, cefr: e.target.value }))}
                style={{ flex: 1 }}
              >
                <option value="">سطح CEFR</option>
                {CEFR_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            )}

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

            {(form.kind === "shadow" || form.kind === "free_speech") && (
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
            )}
          </div>

          <textarea
            placeholder={
              form.kind === "vocab_yesno"
                ? "کلمه‌ی انگلیسی، مثلاً: borrow"
                : form.kind === "listen_choice"
                ? "سؤال نمایش‌داده‌شده، مثلاً: این جمله یعنی چه؟"
                : form.kind === "shadow" || form.kind === "imitation"
                ? "دستور نمایش‌داده‌شده، مثلاً: به این جمله گوش کن و تکرارش کن"
                : "سوال/دستور، مثلاً: خودت را معرفی کن"
            }
            rows={2}
            value={form.prompt_text}
            onChange={(e) => setForm((f) => ({ ...f, prompt_text: e.target.value }))}
          />

          {form.kind === "listen_choice" && (
            <div>
              <label>گزینه‌ها (هر خط یک گزینه؛ گزینه‌ی درست را از لیست پایین انتخاب کن)</label>
              <textarea
                rows={3}
                value={form.options.join("\n")}
                onChange={(e) => setForm((f) => ({ ...f, options: e.target.value.split("\n") }))}
              />
              <select
                value={form.correct_index}
                onChange={(e) => setForm((f) => ({ ...f, correct_index: Number(e.target.value) }))}
              >
                {form.options.map((o, i) => (
                  <option key={i} value={i}>
                    ✓ {i + 1}. {o}
                  </option>
                ))}
              </select>
            </div>
          )}

          {hasAudio(form.kind) && (
            <>
              <textarea
                placeholder="جمله‌ی هدف انگلیسی (به کاربر نمایش داده نمی‌شود؛ فقط صدایش پخش می‌شود)"
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

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
        {["all", "free_speech", "shadow", "vocab_yesno", "listen_choice", "imitation"].map((k) => (
          <button
            key={k}
            className={`btn btn-sm ${kindFilter === k ? "" : "btn-ghost"}`}
            onClick={() => setKindFilter(k)}
          >
            {k === "all" ? "همه" : kindLabel[k]} ({k === "all" ? items.length : items.filter((i) => i.kind === k).length})
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="hint">هنوز آیتمی ساخته نشده.</p>
      ) : (
        items.filter((it) => kindFilter === "all" || it.kind === kindFilter).map((it) => (
          <div key={it.id} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <h3 style={{ margin: 0 }}>
                  {kindLabel[it.kind] || it.kind}
                  {it.kind === "free_speech" && ` · ${categoryLabel[it.category] || it.category}`}
                  {it.cefr && ` · ${it.cefr}`}
                  {it.kind === "vocab_yesno" && (it.is_pseudo ? " · ساختگی" : ` · لایه‌ی ${it.band}`)}
                  {!it.is_active && (
                    <span style={{ opacity: 0.5, fontSize: 12 }}> (غیرفعال)</span>
                  )}
                </h3>
                <p style={{ margin: "4px 0 0", opacity: 0.8, fontSize: 13, whiteSpace: "pre-wrap" }}>
                  {it.prompt_text}
                </p>
                {it.kind === "listen_choice" && it.options && (
                  <ol style={{ margin: "4px 0 0", fontSize: 12, opacity: 0.8 }}>
                    {it.options.map((o, i) => (
                      <li key={i} style={{ fontWeight: i === it.correct_index ? 700 : 400 }}>
                        {i === it.correct_index ? "✓ " : ""}
                        {o}
                      </li>
                    ))}
                  </ol>
                )}
                {it.target_text && (
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
