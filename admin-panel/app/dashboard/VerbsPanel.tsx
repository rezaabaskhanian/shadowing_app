"use client";

import { useEffect, useState } from "react";
import {
  deleteVerbMeaning,
  getVerb,
  listVerbs,
  reviewVerbOccurrence,
  saveVerb,
  saveVerbMeaning,
  scanVerb,
  suggestVerbMeanings,
} from "@/lib/api";
import type { VerbDetail, VerbMeaning, VerbMeaningSuggestion, VerbOccurrence, VerbSummary } from "@/lib/types";

type Notify = (msg: string, type?: "ok" | "err") => void;

const EMPTY_MEANING: Partial<VerbMeaning> = {
  meaning_fa: "",
  explanation_fa: "",
  fallback_example: "",
  practice_prompt_fa: "",
  sort_order: 0,
};

// افعال چندمعنایی (get, take, ...): تعریف معناها (با پیشنهاد AI)، جست‌وجوی
// خودکار جمله‌ها در درس‌ها با حدس معنا توسط AI، و صف تأیید ادمین. فقط
// جمله‌های تأییدشده در اپ نشان داده می‌شوند.
export default function VerbsPanel({ notify }: { notify: Notify }) {
  const [verbs, setVerbs] = useState<VerbSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerbDetail | null>(null);
  const [newLemma, setNewLemma] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadList() {
    try {
      setVerbs(await listVerbs());
    } catch (e: any) {
      notify(e.message, "err");
    }
  }

  async function loadDetail(id: string) {
    try {
      setDetail(await getVerb(id));
    } catch (e: any) {
      notify(e.message, "err");
    }
  }

  useEffect(() => {
    loadList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedId) loadDetail(selectedId);
    else setDetail(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  async function refresh() {
    await loadList();
    if (selectedId) await loadDetail(selectedId);
  }

  async function addVerb() {
    if (!newLemma.trim()) return;
    try {
      const v = await saveVerb({ lemma: newLemma.trim(), forms: [], sort_order: verbs.length + 1, is_published: false });
      setNewLemma("");
      await loadList();
      setSelectedId(v.id);
      notify("فعل اضافه شد — شکل‌های صرفی‌اش را کامل کن", "ok");
    } catch (e: any) {
      notify(e.message, "err");
    }
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 16, alignItems: "start" }}>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>افعال چندمعنایی</h3>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {verbs.map((v) => (
            <li key={v.id}>
              <button
                className={`sidebar-link ${selectedId === v.id ? "active" : ""}`}
                style={{ width: "100%", textAlign: "start" }}
                onClick={() => setSelectedId(v.id)}
              >
                <b>{v.lemma}</b> {v.is_published ? "✅" : "📝"}
                <div className="hint" style={{ fontSize: 12 }}>
                  {v.meaning_count} معنا · {v.approved_count} جمله
                  {v.suggested_count > 0 && <span style={{ color: "#f59e0b" }}> · {v.suggested_count} منتظر بررسی</span>}
                </div>
              </button>
            </li>
          ))}
        </ul>
        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
          <input value={newLemma} onChange={(e) => setNewLemma(e.target.value)} placeholder="فعل جدید (مثلاً bring)" />
          <button className="btn btn-sm" onClick={addVerb}>
            +
          </button>
        </div>
      </div>

      {detail ? (
        <VerbEditor detail={detail} notify={notify} busy={busy} setBusy={setBusy} onChanged={refresh} />
      ) : (
        <div className="card hint">یک فعل را از لیست انتخاب کن.</div>
      )}
    </div>
  );
}

function VerbEditor({
  detail,
  notify,
  busy,
  setBusy,
  onChanged,
}: {
  detail: VerbDetail;
  notify: Notify;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onChanged: () => Promise<void>;
}) {
  const { verb, meanings, occurrences } = detail;
  const [forms, setForms] = useState(verb.forms.join(", "));
  const [suggestions, setSuggestions] = useState<VerbMeaningSuggestion[]>([]);
  const [draft, setDraft] = useState<Partial<VerbMeaning> | null>(null);

  useEffect(() => {
    setForms(verb.forms.join(", "));
    setSuggestions([]);
    setDraft(null);
  }, [verb.id, verb.forms]);

  async function run(action: () => Promise<unknown>, okMsg?: string) {
    setBusy(true);
    try {
      await action();
      if (okMsg) notify(okMsg, "ok");
      await onChanged();
    } catch (e: any) {
      notify(e.message, "err");
    } finally {
      setBusy(false);
    }
  }

  const saveVerbInfo = (isPublished = verb.is_published) =>
    run(
      () =>
        saveVerb({
          ...verb,
          forms: forms.split(",").map((f) => f.trim()).filter(Boolean),
          is_published: isPublished,
        }),
      "فعل ذخیره شد"
    );

  const suggested = occurrences.filter((o) => o.status === "suggested");
  const approved = occurrences.filter((o) => o.status === "approved");
  const rejected = occurrences.filter((o) => o.status === "rejected");
  const approvedPerMeaning = (id: string) => approved.filter((o) => o.meaning_id === id).length;
  const gaps = meanings.filter((m) => approvedPerMeaning(m.id) === 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* مشخصات فعل */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          {verb.lemma} {verb.is_published ? "— منتشرشده ✅" : "— پیش‌نویس 📝"}
        </h3>
        <label>شکل‌های صرفی (با کاما جدا کن؛ برای جست‌وجو در درس‌ها)</label>
        <input value={forms} onChange={(e) => setForms(e.target.value)} dir="ltr" />
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <button className="btn btn-sm" disabled={busy} onClick={() => saveVerbInfo()}>
            ذخیره
          </button>
          <button
            className="btn btn-sm btn-ghost"
            disabled={busy || (!verb.is_published && meanings.length < 2)}
            title={!verb.is_published && meanings.length < 2 ? "حداقل ۲ معنا لازم است" : ""}
            onClick={() => saveVerbInfo(!verb.is_published)}
          >
            {verb.is_published ? "برگرداندن به پیش‌نویس" : "انتشار در اپ"}
          </button>
        </div>
        <p className="hint" style={{ marginBottom: 0 }}>
          فعل فقط بعد از انتشار و داشتن حداقل ۲ معنا در اپ دیده می‌شود. در اپ فقط جمله‌های تأییدشده نشان داده می‌شوند.
        </p>
      </div>

      {/* معناها */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>معناها ({meanings.length})</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-sm btn-ghost"
              disabled={busy}
              onClick={() =>
                run(async () => setSuggestions(await suggestVerbMeanings(verb.id)))
              }
            >
              ✨ پیشنهاد معناها با هوش مصنوعی
            </button>
            <button className="btn btn-sm" disabled={busy} onClick={() => setDraft({ ...EMPTY_MEANING, sort_order: meanings.length })}>
              + معنای جدید
            </button>
          </div>
        </div>

        {suggestions.length > 0 && (
          <div style={{ marginTop: 12, padding: 10, border: "1px dashed var(--border)", borderRadius: 8 }}>
            <b>پیشنهادهای هوش مصنوعی</b> — روی «افزودن» بزن تا به معناها اضافه شود:
            {suggestions.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
                <div style={{ flex: 1 }}>
                  <b>{s.meaning_fa}</b> — {s.explanation_fa}
                  <div className="hint" dir="ltr" style={{ textAlign: "left" }}>
                    {s.example}
                  </div>
                </div>
                <button
                  className="btn btn-sm"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await saveVerbMeaning(verb.id, {
                        meaning_fa: s.meaning_fa,
                        explanation_fa: s.explanation_fa,
                        fallback_example: s.example,
                        practice_prompt_fa: s.practice_prompt_fa,
                        sort_order: meanings.length,
                      });
                      setSuggestions((prev) => prev.filter((_, j) => j !== i));
                    })
                  }
                >
                  افزودن
                </button>
              </div>
            ))}
          </div>
        )}

        {draft && (
          <MeaningForm
            value={draft}
            busy={busy}
            onCancel={() => setDraft(null)}
            onSave={(m) =>
              run(async () => {
                await saveVerbMeaning(verb.id, m);
                setDraft(null);
              }, "معنا ذخیره شد")
            }
          />
        )}

        {meanings.map((m) => (
          <div key={m.id} style={{ borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
              <div>
                <b>{m.meaning_fa}</b>{" "}
                <span className="hint">
                  — {approvedPerMeaning(m.id)} جمله‌ی تأییدشده
                  {approvedPerMeaning(m.id) === 0 && " ⚠️"}
                </span>
                <div className="hint">{m.explanation_fa}</div>
                {m.practice_prompt_fa && <div className="hint">🎙 تمرین: {m.practice_prompt_fa}</div>}
              </div>
              <div style={{ display: "flex", gap: 6, alignItems: "start" }}>
                <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => setDraft(m)}>
                  ویرایش
                </button>
                <button
                  className="btn btn-sm btn-ghost"
                  disabled={busy}
                  onClick={() => {
                    if (confirm(`معنای «${m.meaning_fa}» حذف شود؟`)) run(() => deleteVerbMeaning(m.id), "معنا حذف شد");
                  }}
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* جست‌وجو در درس‌ها + صف بررسی */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <h3 style={{ margin: 0 }}>جمله‌های درس‌ها</h3>
          <button
            className="btn btn-sm"
            disabled={busy || meanings.length === 0}
            title={meanings.length === 0 ? "اول معناها را تعریف کن" : ""}
            onClick={() =>
              run(async () => {
                const r = await scanVerb(verb.id);
                notify(
                  r.found === 0
                    ? "جمله‌ی تازه‌ای پیدا نشد"
                    : `${r.found} جمله‌ی تازه پیدا شد${r.classified ? "" : " (حدس معنا با هوش مصنوعی ناموفق بود؛ دستی انتخاب کن)"}`,
                  "ok"
                );
              })
            }
          >
            🔍 جست‌وجو در درس‌ها
          </button>
        </div>
        <p className="hint">
          جمله‌هایی که شکل‌های این فعل را دارند پیدا و معنایشان با هوش مصنوعی حدس زده می‌شود. بعد از ساخت یا ویرایش هر درس هم
          جست‌وجو خودکار انجام می‌شود.
        </p>

        <h4>منتظر بررسی ({suggested.length})</h4>
        {suggested.length === 0 && <p className="hint">چیزی منتظر بررسی نیست.</p>}
        {suggested.map((o) => (
          <OccurrenceRow key={o.id} o={o} meanings={meanings} busy={busy} run={run} />
        ))}

        <h4>تأییدشده ({approved.length})</h4>
        {approved.map((o) => (
          <OccurrenceRow key={o.id} o={o} meanings={meanings} busy={busy} run={run} />
        ))}

        {rejected.length > 0 && (
          <details>
            <summary className="hint">ردشده ({rejected.length})</summary>
            {rejected.map((o) => (
              <OccurrenceRow key={o.id} o={o} meanings={meanings} busy={busy} run={run} />
            ))}
          </details>
        )}
      </div>

      {gaps.length > 0 && (
        <div className="card" style={{ borderColor: "#f59e0b" }}>
          <h3 style={{ marginTop: 0 }}>⚠️ معناهای بدون جمله در درس‌ها</h3>
          <p className="hint">
            این معناها هنوز در هیچ درسی تأیید نشده‌اند (در اپ با مثال پشتیبان و بدون صدا نشان داده می‌شوند) — ایده‌ی خوبی برای
            درس‌های بعدی:
          </p>
          <ul>
            {gaps.map((m) => (
              <li key={m.id}>
                <b>{m.meaning_fa}</b>
                {m.fallback_example && (
                  <span className="hint" dir="ltr">
                    {" "}
                    — {m.fallback_example}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OccurrenceRow({
  o,
  meanings,
  busy,
  run,
}: {
  o: VerbOccurrence;
  meanings: VerbMeaning[];
  busy: boolean;
  run: (action: () => Promise<unknown>, okMsg?: string) => Promise<void>;
}) {
  const [meaningId, setMeaningId] = useState(o.meaning_id || "");
  useEffect(() => setMeaningId(o.meaning_id || ""), [o.meaning_id]);

  // کلمه‌ی پیداشده را در جمله پررنگ نشان می‌دهیم.
  const re = new RegExp(`\\b(${o.matched_form})\\b`, "i");
  const parts = o.sentence.split(re);

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid var(--border)", flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 240 }}>
        <div dir="ltr" style={{ textAlign: "left" }}>
          {parts.map((p, i) => (re.test(p) ? <mark key={i}>{p}</mark> : <span key={i}>{p}</span>))}
        </div>
        <div className="hint" style={{ fontSize: 12 }}>
          📍 {o.scene_title}
          {!o.dialogue_id && " — ⚠️ این جمله دیگر در درس نیست (متن ویرایش شده)"}
        </div>
      </div>
      <select value={meaningId} onChange={(e) => setMeaningId(e.target.value)} style={{ width: 180 }}>
        <option value="">— معنا —</option>
        {meanings.map((m) => (
          <option key={m.id} value={m.id}>
            {m.meaning_fa}
          </option>
        ))}
      </select>
      <button
        className="btn btn-sm"
        disabled={busy || !meaningId || (o.status === "approved" && meaningId === o.meaning_id)}
        onClick={() => run(() => reviewVerbOccurrence(o.id, "approved", meaningId))}
      >
        {o.status === "approved" ? "ذخیره" : "تأیید"}
      </button>
      {o.status !== "rejected" && (
        <button className="btn btn-sm btn-ghost" disabled={busy} onClick={() => run(() => reviewVerbOccurrence(o.id, "rejected", null))}>
          رد
        </button>
      )}
    </div>
  );
}

function MeaningForm({
  value,
  busy,
  onSave,
  onCancel,
}: {
  value: Partial<VerbMeaning>;
  busy: boolean;
  onSave: (m: Partial<VerbMeaning>) => void;
  onCancel: () => void;
}) {
  const [m, setM] = useState(value);
  useEffect(() => setM(value), [value]);
  const set = (k: keyof VerbMeaning) => (e: React.ChangeEvent<HTMLInputElement>) => setM({ ...m, [k]: e.target.value });

  return (
    <div style={{ marginTop: 12, padding: 10, border: "1px solid var(--primary)", borderRadius: 8 }}>
      <label>معنای فارسی (کوتاه، مثلاً «رسیدن»)</label>
      <input value={m.meaning_fa || ""} onChange={set("meaning_fa")} />
      <label>توضیح کوتاه (برای فعل عبارتی، اسمش را هم بنویس؛ مثلاً «get over: خوب شدن»)</label>
      <input value={m.explanation_fa || ""} onChange={set("explanation_fa")} />
      <label>مثال پشتیبان (وقتی هنوز جمله‌ای از درس‌ها تأیید نشده)</label>
      <input value={m.fallback_example || ""} onChange={set("fallback_example")} dir="ltr" />
      <label>موقعیت تمرین صوتی (فارسی؛ مثلاً «به دوستت بگو سرما خورده‌ای.»)</label>
      <input value={m.practice_prompt_fa || ""} onChange={set("practice_prompt_fa")} />
      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
        <button className="btn btn-sm" disabled={busy || !m.meaning_fa?.trim()} onClick={() => onSave(m)}>
          ذخیره‌ی معنا
        </button>
        <button className="btn btn-sm btn-ghost" onClick={onCancel}>
          انصراف
        </button>
      </div>
    </div>
  );
}
