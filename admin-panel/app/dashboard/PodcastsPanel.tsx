"use client";

import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import {
  API_BASE,
  deletePodcast,
  generatePodcastAudio,
  generatePodcastScript,
  getPodcast,
  getScene,
  listPodcasts,
  listScenes,
  listTTSVoices,
  savePodcast,
  type TTSVoice,
} from "@/lib/api";
import type { Podcast, PodcastLine, SceneResp } from "@/lib/types";

type Draft = Omit<Podcast, "id"> & { id?: string };

const LEVELS = [
  { id: "beginner", label: "مبتدی" },
  { id: "intermediate", label: "متوسط" },
  { id: "advanced", label: "پیشرفته" },
] as const;

const STATUS_LABELS: Record<Podcast["audio_status"], string> = {
  none: "صدا ساخته نشده",
  generating: "در حال ساخت صدا...",
  ready: "صدا آماده است",
  failed: "ساخت صدا ناموفق بود",
};

const emptyDraft = (position = 0): Draft => ({
  title: "",
  description_fa: "",
  level: "beginner",
  scene_id: "",
  vocabulary: [],
  voices: {},
  audio_url: "",
  audio_status: "none",
  audio_error: "",
  duration_seconds: 0,
  image_url: "",
  position,
  is_active: false,
  lines: [],
});

const mediaUrl = (u: string) => (!u ? "" : /^https?:\/\//i.test(u) ? u : `${API_BASE}${u}`);

/** متن دیالوگ‌های یک صحنه برای اینکه AI پادکست را درباره‌ی همان صحنه بنویسد. */
function sceneContext(s: SceneResp): string {
  const lines = (s.hotspots || []).flatMap((h) => (h.dialogues || []).map((d) => `${d.speaker}: ${d.original_text}`));
  return [`Scene: ${s.title}`, s.description, ...lines].filter(Boolean).join("\n");
}

/**
 * مدیریت «پادکست»: متن گفتگوی دو مجری با AI (از یک موضوع یا یکی از صحنه‌های اپ)،
 * ویرایش متن و لغت‌ها، انتخاب صدای هر مجری، و ساخت صدا در پس‌زمینه (چند دقیقه
 * طول می‌کشد؛ وضعیت خودکار به‌روز می‌شود). فقط پادکستِ با صدای آماده منتشر می‌شود.
 */
export default function PodcastsPanel({
  notify,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
}) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [scenes, setScenes] = useState<SceneResp[]>([]);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(3);

  async function load() {
    setLoading(true);
    try {
      setPodcasts(await listPodcasts());
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    listScenes()
      .then(setScenes)
      .catch(() => {});
    listTTSVoices()
      .then(setVoices)
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // وقتی صدا در حال ساخت است، هر ۵ ثانیه وضعیت را تازه کن.
  useEffect(() => {
    if (!draft?.id || draft.audio_status !== "generating") return;
    const id = draft.id;
    const timer = setInterval(async () => {
      try {
        const p = await getPodcast(id);
        if (p.audio_status !== "generating") {
          setDraft(p);
          load();
          notify(p.audio_status === "ready" ? "صدای پادکست آماده شد" : p.audio_error || "ساخت صدا ناموفق بود", p.audio_status === "ready" ? "ok" : "err");
        }
      } catch {
        // تلاش بعدی
      }
    }, 5000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id, draft?.audio_status]);

  async function run(label: string, fn: () => Promise<void>) {
    setBusy(label);
    try {
      await fn();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setBusy(null);
    }
  }

  const update = (patch: Partial<Draft>) => setDraft((d) => (d ? { ...d, ...patch } : d));
  const lines = draft?.lines ?? [];
  const updateLine = (i: number, patch: Partial<PodcastLine>) => update({ lines: lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  const speakers = [...new Set(lines.map((l) => l.speaker.trim()).filter(Boolean))];

  const open = (id: string) =>
    run("load", async () => {
      setDraft(await getPodcast(id));
      setTopic("");
    });

  const writeScript = () =>
    run("script", async () => {
      if (!draft) return;
      if (lines.length > 0 && !confirm("متن فعلی با متن تازه‌ی AI جایگزین شود؟")) return;
      let scene = "";
      if (draft.scene_id) scene = sceneContext(await getScene(draft.scene_id));
      const s = await generatePodcastScript({ topic, scene, level: draft.level, minutes });
      update({
        title: draft.title || s.title,
        description_fa: draft.description_fa || s.description_fa,
        lines: (s.lines || []).map((l, i) => ({ position: i, start_ms: 0, end_ms: 0, ...l })),
        vocabulary: s.vocabulary || [],
      });
      notify("متن آماده شد؛ بررسی کن، ذخیره کن و بعد «ساخت صدا» را بزن.");
    });

  const save = () =>
    run("save", async () => {
      if (!draft) return;
      const saved = await savePodcast(draft);
      setDraft(saved);
      notify(saved.audio_status === "ready" ? "ذخیره شد" : "ذخیره شد — حالا صدای پادکست را بساز");
      load();
    });

  const makeAudio = () =>
    run("audio", async () => {
      if (!draft?.id) throw new Error("اول پادکست را ذخیره کن");
      const p = await generatePodcastAudio(draft.id);
      update({ audio_status: p.audio_status, audio_error: "" });
      notify("ساخت صدا شروع شد؛ چند دقیقه طول می‌کشد و وضعیت خودکار به‌روز می‌شود.");
    });

  const remove = (p: Podcast) =>
    run("delete", async () => {
      if (!confirm(`پادکست «${p.title}» حذف شود؟`)) return;
      await deletePodcast(p.id);
      if (draft?.id === p.id) setDraft(null);
      load();
    });

  const generating = draft?.audio_status === "generating";

  return (
    <div>
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>🎧 پادکست</h2>
            <p className="hint" style={{ margin: "4px 0 0" }}>
              گفتگوی کوتاه دو مجری درباره‌ی یک موضوع یا یکی از صحنه‌های اپ، با متن هم‌زمان، ترجمه و لغت‌های مهم. مراحل: متن با
              AI ← ویرایش و ذخیره ← ساخت صدا (در پس‌زمینه) ← فعال کردن.
            </p>
          </div>
          {!draft && (
            <button className="btn btn-sm" onClick={() => setDraft(emptyDraft(podcasts.length))}>
              + پادکست جدید
            </button>
          )}
        </div>
      </div>

      {draft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش پادکست" : "پادکست جدید"}</h3>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            <div style={{ flex: "1 1 220px" }}>
              <label>درباره‌ی یک صحنه (اختیاری)</label>
              <select value={draft.scene_id} onChange={(e) => update({ scene_id: e.target.value })}>
                <option value="">— بدون صحنه —</option>
                {scenes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ flex: "1 1 220px" }}>
              <label>یا/و موضوع</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثلاً «سفارش غذا در رستوران»" />
            </div>
            <div>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => update({ level: e.target.value as Draft["level"] })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>طول</label>
              <select value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
                {[2, 3, 4, 5].map((m) => (
                  <option key={m} value={m}>
                    {m} دقیقه
                  </option>
                ))}
              </select>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={writeScript} disabled={!!busy || generating || !(topic.trim() || draft.scene_id)}>
              {busy === "script" ? "در حال نوشتن..." : "✨ نوشتن متن با AI"}
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 260px" }}>
              <label>عنوان</label>
              <input dir="ltr" value={draft.title} onChange={(e) => update({ title: e.target.value })} />
            </div>
            <div style={{ width: 90 }}>
              <label>ترتیب</label>
              <input type="number" value={draft.position} onChange={(e) => update({ position: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <ImageField
            label="تصویر کارت (اختیاری — اگر خالی باشد و صحنه انتخاب شده باشد، تصویرِ همان صحنه نشان داده می‌شود)"
            value={draft.image_url || ""}
            onChange={(url) => update({ image_url: url })}
            notify={notify}
          />
          <label>توضیح فارسی (در این قسمت چه یاد می‌گیرد)</label>
          <textarea rows={2} value={draft.description_fa} onChange={(e) => update({ description_fa: e.target.value })} />

          {speakers.length > 0 && voices.length > 0 && (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
              {speakers.map((sp) => (
                <div key={sp}>
                  <label>صدای {sp}</label>
                  <select value={draft.voices[sp] || ""} onChange={(e) => update({ voices: { ...draft.voices, [sp]: e.target.value } })}>
                    <option value="">خودکار</option>
                    {voices.map((v) => (
                      <option key={v.voice_id} value={v.voice_id}>
                        {v.name} {v.gender ? `(${v.gender === "female" ? "زن" : v.gender === "male" ? "مرد" : v.gender})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}

          <h4 style={{ marginBottom: 4 }}>متن ({lines.length} جمله)</h4>
          <p className="hint" style={{ marginTop: 0 }}>
            هر تغییری در متن یا صدای مجری‌ها، صدای ساخته‌شده‌ی قبلی را باطل می‌کند و باید دوباره ساخته شود.
          </p>
          {lines.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={i} style={{ borderTop: "1px solid var(--border, #333)", verticalAlign: "top" }}>
                      <td style={{ padding: 4, width: 90 }}>
                        <input dir="ltr" list="podcast-speakers" value={l.speaker} onChange={(e) => updateLine(i, { speaker: e.target.value })} />
                      </td>
                      <td style={{ padding: 4, minWidth: 260 }}>
                        <textarea dir="ltr" rows={2} value={l.text} onChange={(e) => updateLine(i, { text: e.target.value })} />
                      </td>
                      <td style={{ padding: 4, minWidth: 200 }}>
                        <textarea rows={2} value={l.translation_fa} onChange={(e) => updateLine(i, { translation_fa: e.target.value })} />
                      </td>
                      <td style={{ padding: 4 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => update({ lines: lines.filter((_, j) => j !== i) })}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <datalist id="podcast-speakers">
                {speakers.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() =>
              update({ lines: [...lines, { position: lines.length, speaker: speakers[lines.length % 2] || "", text: "", translation_fa: "", start_ms: 0, end_ms: 0 }] })
            }
          >
            + جمله
          </button>

          <h4 style={{ marginBottom: 4 }}>لغت‌های مهم ({draft.vocabulary.length})</h4>
          {draft.vocabulary.map((v, i) => (
            <div key={i} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <input
                dir="ltr"
                value={v.word}
                onChange={(e) => update({ vocabulary: draft.vocabulary.map((x, j) => (j === i ? { ...x, word: e.target.value } : x)) })}
                style={{ flex: 1 }}
              />
              <input
                value={v.meaning_fa}
                onChange={(e) => update({ vocabulary: draft.vocabulary.map((x, j) => (j === i ? { ...x, meaning_fa: e.target.value } : x)) })}
                style={{ flex: 1 }}
              />
              <button className="btn btn-ghost btn-sm" onClick={() => update({ vocabulary: draft.vocabulary.filter((_, j) => j !== i) })}>
                ✕
              </button>
            </div>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={() => update({ vocabulary: [...draft.vocabulary, { word: "", meaning_fa: "" }] })}>
            + لغت
          </button>

          <div className="card" style={{ marginTop: 16, background: "var(--surface-2, transparent)" }}>
            <strong>صدا: {STATUS_LABELS[draft.audio_status]}</strong>
            {draft.audio_status === "failed" && draft.audio_error && (
              <p className="hint" style={{ color: "var(--danger, #e55)" }}>
                {draft.audio_error}
              </p>
            )}
            {draft.audio_status === "ready" && draft.audio_url && (
              <audio controls src={mediaUrl(draft.audio_url)} style={{ width: "100%", marginTop: 8 }} />
            )}
            <div style={{ marginTop: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={makeAudio} disabled={!!busy || generating || !draft.id || lines.length === 0}>
                {generating ? "در حال ساخت..." : draft.audio_status === "ready" ? "🎙 ساخت دوباره‌ی صدا" : "🎙 ساخت صدای پادکست"}
              </button>
              {!draft.id && <span className="hint"> — اول ذخیره کن</span>}
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
            <input
              type="checkbox"
              checked={draft.is_active}
              disabled={draft.audio_status !== "ready"}
              onChange={(e) => update({ is_active: e.target.checked })}
              style={{ width: "auto" }}
            />
            فعال (در اپ منتشر شود — فقط وقتی صدا آماده است)
          </label>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="btn" onClick={save} disabled={!!busy || generating || !draft.title.trim()}>
              {busy === "save" ? "در حال ذخیره..." : "ذخیره"}
            </button>
            <button className="btn btn-ghost" onClick={() => setDraft(null)} disabled={!!busy}>
              بستن
            </button>
          </div>
        </div>
      )}

      <div className="card">
        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : podcasts.length === 0 ? (
          <p className="hint">هنوز پادکستی ساخته نشده.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {podcasts.map((p) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: p.is_active ? 1 : 0.6,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700 }} dir="ltr">
                    {p.title}
                  </div>
                  <div className="hint" style={{ margin: 0 }}>
                    {LEVELS.find((l) => l.id === p.level)?.label} · {p.line_count ?? 0} جمله · {STATUS_LABELS[p.audio_status]}
                    {p.duration_seconds > 0 && ` · ${Math.round(p.duration_seconds / 60)} دقیقه`}
                    {p.is_active ? " · منتشرشده" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => open(p.id)} disabled={!!busy}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => remove(p)} disabled={!!busy}>
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
