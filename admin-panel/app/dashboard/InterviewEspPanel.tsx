"use client";

import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import {
  deleteInterviewSet,
  deleteSpecialtyField,
  generateAudio,
  getInterviewSet,
  getSettings,
  getSpecialtyField,
  listInterviewSets,
  listSpecialtyFields,
  saveFieldWords,
  saveInterviewSet,
  saveSpecialtyField,
  updateSetting,
} from "@/lib/api";
import type {
  FieldWord,
  InterviewKind,
  InterviewQuestion,
  InterviewSet,
  SpecialtyField,
  SpecialtyFieldDetail,
} from "@/lib/types";

type Notify = (msg: string, type?: "ok" | "err") => void;

const LEVELS = [
  { id: "starter", label: "قدم اول" },
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط (B1)" },
  { id: "advanced", label: "پیشرفته (B2)" },
  { id: "proficient", label: "حرفه‌ای (C1)" },
];
const KINDS: { id: InterviewKind; label: string }[] = [
  { id: "job", label: "💼 مصاحبه‌ی کاری" },
  { id: "admission", label: "🎓 پذیرش دانشگاه" },
  { id: "visa", label: "🛂 سفارت / مهاجرت" },
];
const CONTENT_LABEL: Record<string, string> = {
  scene: "صحنه",
  podcast: "پادکست",
  speaking_topic: "موضوع صحبت",
  writing_prompt: "موضوع نوشتن",
  interview: "مصاحبه",
};

const isOn = (v?: string) => ["1", "true", "on", "yes"].includes((v || "").trim().toLowerCase());
const levelLabel = (l: string) => LEVELS.find((x) => x.id === l)?.label ?? l;

const emptyQuestion = (): InterviewQuestion => ({
  text: "",
  translation_fa: "",
  audio_url: "",
  prep_seconds: 10,
  answer_seconds: 60,
  tip_fa: "",
  sample_answer: "",
  sample_answer_fa: "",
  key_phrases: [],
});

const emptySet = (position = 0): InterviewSet => ({
  kind: "job",
  field_key: "",
  title: "",
  title_fa: "",
  description_fa: "",
  level: "intermediate",
  image_url: "",
  interviewer_voice: "",
  position,
  is_active: false,
  questions: [emptyQuestion()],
});

/**
 * «مصاحبه‌ی شبیه‌سازی‌شده» و «زبان تخصصی». هر دو بخش با کلیدهای بالای این صفحه
 * برای کاربرها روشن می‌شوند؛ تا خاموش‌اند، اپ ورودی‌شان را نشان نمی‌دهد. هر
 * مصاحبه و هر رشته هم جدا «فعال» می‌شود، پس می‌شود یکی‌یکی منتشر کرد.
 */
export default function InterviewEspPanel({ notify }: { notify: Notify }) {
  return (
    <div>
      <FeatureSwitches notify={notify} />
      <InterviewsSection notify={notify} />
      <FieldsSection notify={notify} />
    </div>
  );
}

function FeatureSwitches({ notify }: { notify: Notify }) {
  const [interview, setInterview] = useState(false);
  const [esp, setEsp] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setInterview(isOn(s.feature_interview_enabled));
        setEsp(isOn(s.feature_esp_enabled));
      })
      .catch((err) => notify(err.message, "err"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function toggle(key: string, value: boolean, set: (v: boolean) => void) {
    try {
      await updateSetting(key, value ? "true" : "false");
      set(value);
      notify(value ? "روشن شد؛ اپ تا ۳۰ ثانیه‌ی دیگر این بخش را نشان می‌دهد" : "خاموش شد");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  return (
    <div className="card">
      <h2 style={{ margin: 0 }}>🎯 مصاحبه و زبان تخصصی</h2>
      <p className="hint" style={{ margin: "4px 0 12px" }}>
        تا کلید یک بخش خاموش است، اپ ورودی آن بخش را به هیچ کاربری نشان نمی‌دهد. اول محتوا را بساز و فعال کن، بعد کلید را
        روشن کن.
      </p>
      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={interview}
          onChange={(e) => toggle("FEATURE_INTERVIEW_ENABLED", e.target.checked, setInterview)}
        />
        بخش «مصاحبه‌ی شبیه‌سازی‌شده» برای کاربرها روشن باشد
      </label>
      <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={esp}
          onChange={(e) => toggle("FEATURE_ESP_ENABLED", e.target.checked, setEsp)}
        />
        بخش «زبان تخصصی» برای کاربرها روشن باشد (فقط از سطح B1 به بالا دیده می‌شود)
      </label>
    </div>
  );
}

// ---------- مصاحبه‌ها ----------

function InterviewsSection({ notify }: { notify: Notify }) {
  const [sets, setSets] = useState<InterviewSet[]>([]);
  const [draft, setDraft] = useState<InterviewSet | null>(null);
  const [saving, setSaving] = useState(false);
  const [voicing, setVoicing] = useState(false);

  async function load() {
    try {
      setSets(await listInterviewSets());
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function edit(s: InterviewSet) {
    try {
      const full = await getInterviewSet(s.id!);
      setDraft({ ...full, questions: full.questions?.length ? full.questions : [emptyQuestion()] });
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  function setQ(i: number, patch: Partial<InterviewQuestion>) {
    if (!draft) return;
    const qs = [...(draft.questions || [])];
    qs[i] = { ...qs[i], ...patch };
    setDraft({ ...draft, questions: qs });
  }

  function moveQ(i: number, d: number) {
    if (!draft) return;
    const qs = [...(draft.questions || [])];
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setDraft({ ...draft, questions: qs });
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      const saved = await saveInterviewSet({ ...draft, questions: (draft.questions || []).filter((q) => q.text.trim()) });
      notify("مصاحبه ذخیره شد");
      setDraft({ ...saved, questions: saved.questions?.length ? saved.questions : [emptyQuestion()] });
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  // صدای مصاحبه‌گر را برای سؤال‌های بی‌صدا یکی‌یکی می‌سازد (هم‌زمان نه، تا TTS خطای ۴۲۹ ندهد).
  async function voiceMissing() {
    if (!draft) return;
    setVoicing(true);
    const qs = [...(draft.questions || [])];
    let made = 0;
    for (let i = 0; i < qs.length; i++) {
      if (!qs[i].text.trim() || qs[i].audio_url) continue;
      try {
        qs[i] = { ...qs[i], audio_url: await generateAudio(qs[i].text, draft.interviewer_voice) };
        made++;
        setDraft({ ...draft, questions: [...qs] });
      } catch (err: any) {
        notify(`سؤال ${i + 1}: ${err.message}`, "err");
      }
    }
    setVoicing(false);
    notify(`${made} صدا ساخته شد؛ برای ثبت، «ذخیره» را بزن`);
  }

  async function handleDelete(s: InterviewSet) {
    if (!confirm(`مصاحبه‌ی «${s.title}» و همه‌ی جواب‌های کاربران حذف شود؟`)) return;
    try {
      await deleteInterviewSet(s.id!);
      notify("حذف شد");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>🎙 مصاحبه‌های شبیه‌سازی‌شده</h3>
          <p className="hint" style={{ margin: "4px 0 0" }}>
            کاربر صدای سؤال را می‌شنود، چند ثانیه آماده می‌شود، جواب می‌دهد و می‌تواند دوباره جواب بدهد. آخر کار گزارش و
            جواب نمونه می‌بیند.
          </p>
        </div>
        {!draft && (
          <button className="btn btn-sm" onClick={() => setDraft(emptySet(sets.length))}>
            + مصاحبه‌ی جدید
          </button>
        )}
      </div>

      {draft && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div>
              <label>نوع</label>
              <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as InterviewKind })}>
                {KINDS.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => setDraft({ ...draft, level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label>عنوان (انگلیسی)</label>
              <input dir="ltr" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label>عنوان فارسی</label>
              <input value={draft.title_fa} onChange={(e) => setDraft({ ...draft, title_fa: e.target.value })} />
            </div>
            <div style={{ width: 140 }}>
              <label>کلید رشته (اختیاری)</label>
              <input
                dir="ltr"
                value={draft.field_key}
                placeholder="medicine"
                onChange={(e) => setDraft({ ...draft, field_key: e.target.value })}
              />
            </div>
            <div style={{ width: 140 }}>
              <label>صدای مصاحبه‌گر</label>
              <input
                dir="ltr"
                value={draft.interviewer_voice}
                placeholder="Charon"
                onChange={(e) => setDraft({ ...draft, interviewer_voice: e.target.value })}
              />
            </div>
          </div>
          <label>توضیح فارسی</label>
          <textarea
            rows={2}
            value={draft.description_fa}
            onChange={(e) => setDraft({ ...draft, description_fa: e.target.value })}
          />
          <ImageField value={draft.image_url} onChange={(url) => setDraft({ ...draft, image_url: url })} notify={notify} />

          <h4>سؤال‌ها</h4>
          {(draft.questions || []).map((q, i) => (
            <div key={q.id || i} style={{ border: "1px solid var(--border, #333)", borderRadius: 8, padding: 10, marginBottom: 8 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <strong>سؤال {i + 1}</strong>
                <button className="btn btn-ghost btn-sm" onClick={() => moveQ(i, -1)}>
                  ↑
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => moveQ(i, 1)}>
                  ↓
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDraft({ ...draft, questions: (draft.questions || []).filter((_, j) => j !== i) })}
                >
                  حذف
                </button>
                {q.audio_url ? <audio src={q.audio_url} controls style={{ height: 28 }} /> : <span className="hint">بی‌صدا</span>}
              </div>
              <input dir="ltr" placeholder="Tell me about yourself." value={q.text} onChange={(e) => setQ(i, { text: e.target.value, audio_url: "" })} />
              <input placeholder="ترجمه‌ی فارسی سؤال" value={q.translation_fa} onChange={(e) => setQ(i, { translation_fa: e.target.value })} />
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ width: 130 }}>
                  <label>آماده‌شدن (ثانیه)</label>
                  <input type="number" value={q.prep_seconds} onChange={(e) => setQ(i, { prep_seconds: Number(e.target.value) || 0 })} />
                </div>
                <div style={{ width: 130 }}>
                  <label>جواب (ثانیه)</label>
                  <input type="number" value={q.answer_seconds} onChange={(e) => setQ(i, { answer_seconds: Number(e.target.value) || 0 })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label>نکته‌ی فارسی برای جواب</label>
                  <input value={q.tip_fa} onChange={(e) => setQ(i, { tip_fa: e.target.value })} />
                </div>
              </div>
              <label>جواب نمونه (انگلیسی) و ترجمه</label>
              <textarea dir="ltr" rows={2} value={q.sample_answer} onChange={(e) => setQ(i, { sample_answer: e.target.value })} />
              <textarea rows={2} value={q.sample_answer_fa} onChange={(e) => setQ(i, { sample_answer_fa: e.target.value })} />
              <label>عبارت‌های پیشنهادی (هر خط یکی)</label>
              <textarea
                dir="ltr"
                rows={2}
                value={q.key_phrases.join("\n")}
                onChange={(e) => setQ(i, { key_phrases: e.target.value.split("\n") })}
              />
            </div>
          ))}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setDraft({ ...draft, questions: [...(draft.questions || []), emptyQuestion()] })}
          >
            + سؤال
          </button>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />
            فعال (وقتی کلید بخش روشن باشد، در اپ دیده می‌شود)
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={handleSave} disabled={saving || !draft.title.trim()}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button className="btn btn-ghost" onClick={voiceMissing} disabled={voicing}>
              {voicing ? "در حال ساخت صدا..." : "🔊 ساخت صدای سؤال‌های بی‌صدا"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={saving}>
              بستن
            </button>
          </div>
        </div>
      )}

      {!draft && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {sets.length === 0 && <p className="hint">هنوز مصاحبه‌ای ساخته نشده.</p>}
          {sets.map((s) => (
            <div key={s.id} className="list-row" style={{ display: "flex", justifyContent: "space-between", gap: 12, opacity: s.is_active ? 1 : 0.55 }}>
              <div>
                <div style={{ fontWeight: 700 }} dir="ltr">
                  {s.title}
                </div>
                <div className="hint" style={{ margin: 0 }}>
                  {KINDS.find((k) => k.id === s.kind)?.label} · {levelLabel(s.level)} · {s.question_count ?? 0} سؤال
                  {s.field_key ? ` · رشته: ${s.field_key}` : ""}
                  {s.is_active ? "" : " · غیرفعال"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => edit(s)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(s)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- رشته‌ها ----------

const emptyField = (position = 0): SpecialtyField => ({
  key: "",
  title_fa: "",
  title_en: "",
  icon: "",
  min_level: "intermediate",
  position,
  is_active: false,
});

// هر لغت در یک خط: word | meaning_fa | example | example_fa | level
const wordsToText = (words: FieldWord[]) =>
  words.map((w) => [w.word, w.meaning_fa, w.example, w.example_fa, w.level].join(" | ")).join("\n");
const textToWords = (text: string): FieldWord[] =>
  text
    .split("\n")
    .map((l) => l.split("|").map((p) => p.trim()))
    .filter((p) => p[0])
    .map((p) => ({ word: p[0], meaning_fa: p[1] || "", example: p[2] || "", example_fa: p[3] || "", level: p[4] || "intermediate", audio_url: "" }));

function FieldsSection({ notify }: { notify: Notify }) {
  const [fields, setFields] = useState<SpecialtyField[]>([]);
  const [draft, setDraft] = useState<SpecialtyField | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [detail, setDetail] = useState<SpecialtyFieldDetail | null>(null);
  const [wordsText, setWordsText] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    try {
      setFields(await listSpecialtyFields());
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function edit(f: SpecialtyField) {
    try {
      const d = await getSpecialtyField(f.key);
      setDraft(d);
      setDetail(d);
      setWordsText(wordsToText(d.words));
      setIsNew(false);
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function handleSave() {
    if (!draft) return;
    setSaving(true);
    try {
      await saveSpecialtyField(draft);
      // صدای لغت‌هایی که از قبل ساخته شده، با ذخیره‌ی دوباره‌ی متن از بین نرود.
      const audio = new Map((detail?.words || []).map((w) => [w.word.toLowerCase(), w.audio_url]));
      const words = textToWords(wordsText).map((w) => ({ ...w, audio_url: audio.get(w.word.toLowerCase()) || "" }));
      const d = await saveFieldWords(draft.key, words);
      notify(`رشته ذخیره شد (${d.words.length} لغت)`);
      setDraft(d);
      setDetail(d);
      setWordsText(wordsToText(d.words));
      setIsNew(false);
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(f: SpecialtyField) {
    if (!confirm(`رشته‌ی «${f.title_fa}» و لغت‌هایش حذف شود؟ (برچسبش از محتوا برداشته می‌شود، خود محتوا می‌ماند)`)) return;
    try {
      await deleteSpecialtyField(f.key);
      notify("حذف شد");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h3 style={{ margin: 0 }}>🩺 زبان تخصصی: رشته‌ها</h3>
          <p className="hint" style={{ margin: "4px 0 0" }}>
            هر رشته یک فهرست لغت دارد؛ صحنه‌ها، پادکست‌ها، موضوع‌ها و مصاحبه‌ها با «کلید رشته» به آن وصل می‌شوند.
          </p>
        </div>
        {!draft && (
          <button
            className="btn btn-sm"
            onClick={() => {
              setDraft(emptyField(fields.length));
              setDetail(null);
              setWordsText("");
              setIsNew(true);
            }}
          >
            + رشته‌ی جدید
          </button>
        )}
      </div>

      {draft && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ width: 160 }}>
              <label>کلید (انگلیسی، ثابت)</label>
              <input dir="ltr" value={draft.key} disabled={!isNew} placeholder="medicine" onChange={(e) => setDraft({ ...draft, key: e.target.value })} />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label>عنوان فارسی</label>
              <input value={draft.title_fa} onChange={(e) => setDraft({ ...draft, title_fa: e.target.value })} />
            </div>
            <div style={{ flex: "1 1 180px" }}>
              <label>عنوان انگلیسی</label>
              <input dir="ltr" value={draft.title_en} onChange={(e) => setDraft({ ...draft, title_en: e.target.value })} />
            </div>
            <div style={{ width: 90 }}>
              <label>آیکون</label>
              <input value={draft.icon} placeholder="🩺" onChange={(e) => setDraft({ ...draft, icon: e.target.value })} />
            </div>
            <div>
              <label>از سطح</label>
              <select value={draft.min_level} onChange={(e) => setDraft({ ...draft, min_level: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label>لغت‌ها (هر خط: word | معنی | example | ترجمه‌ی مثال | سطح)</label>
          <textarea
            dir="ltr"
            rows={10}
            value={wordsText}
            placeholder={"diagnosis | تشخیص | The diagnosis was clear. | تشخیص روشن بود. | intermediate"}
            onChange={(e) => setWordsText(e.target.value)}
          />
          {detail && (
            <div className="hint" style={{ marginTop: 8 }}>
              محتوای برچسب‌خورده ({detail.content.length}):{" "}
              {detail.content.length === 0
                ? "هنوز هیچ (با ابزار MCP set_content_field یا کلید رشته‌ی مصاحبه برچسب بزن)"
                : detail.content.map((c) => `${CONTENT_LABEL[c.kind]}: ${c.title}`).join(" · ")}
            </div>
          )}
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              style={{ width: "auto" }}
              checked={draft.is_active}
              onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            />
            فعال (وقتی کلید بخش روشن باشد، در اپ دیده می‌شود)
          </label>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={handleSave} disabled={saving || !draft.key.trim() || !draft.title_fa.trim()}>
              {saving ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={saving}>
              بستن
            </button>
          </div>
        </div>
      )}

      {!draft && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
          {fields.length === 0 && <p className="hint">هنوز رشته‌ای ساخته نشده.</p>}
          {fields.map((f) => (
            <div key={f.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, opacity: f.is_active ? 1 : 0.55 }}>
              <div>
                <div style={{ fontWeight: 700 }}>
                  {f.icon} {f.title_fa} <span className="hint">({f.key})</span>
                </div>
                <div className="hint" style={{ margin: 0 }}>
                  از {levelLabel(f.min_level)} · {f.word_count ?? 0} لغت{f.is_active ? "" : " · غیرفعال"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn btn-ghost btn-sm" onClick={() => edit(f)}>
                  ویرایش
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(f)}>
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
