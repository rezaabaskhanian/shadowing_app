"use client";

import { useEffect, useState } from "react";
import ImageField from "./ImageField";
import {
  API_BASE,
  deletePodcast,
  generatePodcastAudio,
  generatePodcastScript,
  getPodcast,
  getPodcastLevelPresets,
  getResource,
  getScene,
  listPodcasts,
  listResources,
  listScenes,
  listTTSVoices,
  savePodcast,
  savePodcastLevelPresets,
  type TTSVoice,
} from "@/lib/api";
import type { ContentResource, Podcast, PodcastLevelPreset, PodcastLine, SceneResp } from "@/lib/types";

type Draft = Omit<Podcast, "id"> & { id?: string };

const LEVELS = [
  { id: "starter", label: "قدم اول" },
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
  kind: "lesson",
  scene_id: "",
  vocabulary: [],
  voices: {},
  audio_url: "",
  audio_status: "none",
  audio_error: "",
  duration_seconds: 0,
  image_url: "",
  speech_speed: 0,
  line_gap_ms: 0,
  position,
  is_active: false,
  lines: [],
});

const SPEEDS = [
  { v: 0.8, l: "آرام (۰٫۸)" },
  { v: 0.9, l: "کمی آرام (۰٫۹)" },
  { v: 1, l: "عادی (۱)" },
  { v: 1.1, l: "کمی تند (۱٫۱)" },
];

const KINDS = [
  { id: "lesson", label: "📚 درسی", hint: "درباره‌ی یک صحنه، درس یا موضوعِ آموزشی" },
  { id: "featured", label: "⭐ منتخب", hint: "موضوعِ آزاد و جذاب (داستان، فرهنگ، نکته‌های جالب) — بی‌ربط به درس‌ها" },
] as const;

type ScriptSettings = Pick<PodcastLevelPreset, "max_words_per_sentence" | "min_lines" | "max_lines" | "new_vocab">;

const PRESET_FIELDS: { key: keyof PodcastLevelPreset; label: string; step?: number }[] = [
  { key: "max_words_per_sentence", label: "حداکثر کلمه در جمله (۰ = آزاد)" },
  { key: "min_lines", label: "حداقل جمله" },
  { key: "max_lines", label: "حداکثر جمله" },
  { key: "new_vocab", label: "لغت تازه" },
  { key: "speech_speed", label: "سرعت صدا", step: 0.05 },
  { key: "line_gap_ms", label: "مکث بین جمله‌ها (ms)", step: 100 },
];

/**
 * متن یک فایل کتابخانه‌ی محتوا برای AI: اگر شکل صحنه دارد (عنوان، نقاط، دیالوگ‌ها)
 * فقط بخش‌های مفید (موقعیت، جمله‌ها، واژه‌ها)، وگرنه خود JSON.
 */
function resourceText(content: unknown): string {
  const one = (c: any): string => {
    if (!c || typeof c !== "object" || !Array.isArray(c.hotspots)) return JSON.stringify(c);
    const out: string[] = [`Title: ${c.title || ""}`, c.description || "", c.grammar_topic ? `Grammar: ${c.grammar_topic}` : ""];
    for (const h of c.hotspots) {
      out.push(`[${h.name || ""}]`);
      for (const d of h.dialogues || []) {
        const keys = [...(d.words || []).map((w: any) => w.word), ...(d.phrases || []).map((p: any) => p.phrase)].filter(Boolean);
        out.push(`${d.speaker || ""}: ${d.original_text || ""}${keys.length ? `  (key: ${keys.join(", ")})` : ""}`);
      }
    }
    return out.filter(Boolean).join("\n");
  };
  const c = content as any;
  const list = Array.isArray(c) ? c : Array.isArray(c?.scenes) ? c.scenes : [c];
  return list.map(one).join("\n\n").slice(0, 12000);
}

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
  const [resources, setResources] = useState<ContentResource[]>([]);
  const [resourceId, setResourceId] = useState("");
  const [presets, setPresets] = useState<Record<string, PodcastLevelPreset>>({});
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [scriptSettings, setScriptSettings] = useState<ScriptSettings>({
    max_words_per_sentence: 10,
    min_lines: 12,
    max_lines: 16,
    new_vocab: 5,
  });

  /** با انتخاب سطح، تنظیمات متن و صدا از پیش‌فرض همان سطح پر می‌شوند. */
  function applyLevel(level: Draft["level"], base: Draft): Draft {
    const p = presets[level];
    if (!p) return { ...base, level };
    setScriptSettings({
      max_words_per_sentence: p.max_words_per_sentence,
      min_lines: p.min_lines,
      max_lines: p.max_lines,
      new_vocab: p.new_vocab,
    });
    return { ...base, level, speech_speed: p.speech_speed, line_gap_ms: p.line_gap_ms };
  }

  const numberInput = (value: number, onChange: (n: number) => void, step = 1) => (
    <input dir="ltr" type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
  );

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
    listResources()
      .then(setResources)
      .catch(() => {});
    getPodcastLevelPresets()
      .then(setPresets)
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
      const p = await getPodcast(id);
      setDraft(p);
      setTopic("");
      setResourceId("");
      // تنظیمات نوشتن متن از پیش‌فرض سطح همین پادکست؛ سرعت/مکث خودش دست نمی‌خورد.
      applyLevel(p.level, p);
    });

  const writeScript = () =>
    run("script", async () => {
      if (!draft) return;
      if (lines.length > 0 && !confirm("متن فعلی با متن تازه‌ی AI جایگزین شود؟")) return;
      let scene = "";
      if (draft.scene_id) scene = sceneContext(await getScene(draft.scene_id));
      let source = "";
      if (resourceId) source = resourceText((await getResource(resourceId)).content);
      const s = await generatePodcastScript({ topic, scene, source, level: draft.level, kind: draft.kind, ...scriptSettings });
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
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => setPresetsOpen((v) => !v)}>
                ⚙️ پیش‌فرض سطح‌ها
              </button>
              <button
                className="btn btn-sm"
                onClick={() => {
                  setResourceId("");
                  setTopic("");
                  setDraft(applyLevel("beginner", emptyDraft(podcasts.length)));
                }}
              >
                + پادکست جدید
              </button>
            </div>
          )}
        </div>

        {presetsOpen && !draft && (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <p className="hint" style={{ marginTop: 0 }}>
              موقع ساختن هر پادکست، این مقدارها از روی سطحش پر می‌شوند و برای همان پادکست قابل تغییرند. سرعت ۰٫۸ = آرام، ۱ =
              عادی.
            </p>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "right", opacity: 0.7 }}>
                  <th style={{ padding: 4 }}>سطح</th>
                  {PRESET_FIELDS.map((f) => (
                    <th key={f.key} style={{ padding: 4 }}>
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LEVELS.map((lvl) => (
                  <tr key={lvl.id} style={{ borderTop: "1px solid var(--border, #333)" }}>
                    <td style={{ padding: 4, fontWeight: 700 }}>{lvl.label}</td>
                    {PRESET_FIELDS.map((f) => (
                      <td key={f.key} style={{ padding: 4, width: 100 }}>
                        {numberInput(
                          presets[lvl.id]?.[f.key] ?? 0,
                          (n) => setPresets((ps) => ({ ...ps, [lvl.id]: { ...ps[lvl.id], [f.key]: n } })),
                          f.step
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="btn btn-sm"
              style={{ marginTop: 8 }}
              disabled={!!busy}
              onClick={() =>
                run("presets", async () => {
                  setPresets(await savePodcastLevelPresets(presets));
                  notify("پیش‌فرض سطح‌ها ذخیره شد");
                })
              }
            >
              ذخیره‌ی پیش‌فرض‌ها
            </button>
          </div>
        )}
      </div>

      {draft && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{draft.id ? "ویرایش پادکست" : "پادکست جدید"}</h3>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
            {KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                className={`btn btn-sm ${draft.kind === k.id ? "" : "btn-ghost"}`}
                title={k.hint}
                onClick={() => update(k.id === "featured" ? { kind: "featured", scene_id: "" } : { kind: "lesson" })}
              >
                {k.label}
              </button>
            ))}
            <span className="hint" style={{ margin: 0 }}>
              {draft.kind === "featured"
                ? "منتخب: در اپ بخش جدای «پادکست‌های منتخب» دارد و به درسی وصل نیست؛ فقط موضوع بنویس."
                : "درسی: از صحنه، منبع کتابخانه یا موضوع ساخته می‌شود."}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginBottom: 12 }}>
            {draft.kind === "lesson" && (
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
            )}
            {draft.kind === "lesson" && (
              <div style={{ flex: "1 1 220px" }}>
                <label>از منابع کتابخانه (اختیاری)</label>
                <select value={resourceId} onChange={(e) => setResourceId(e.target.value)}>
                  <option value="">— بدون منبع —</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div style={{ flex: "1 1 220px" }}>
              <label>یا/و موضوع</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثلاً «سفارش غذا در رستوران»" />
            </div>
            <div>
              <label>سطح</label>
              <select value={draft.level} onChange={(e) => setDraft(applyLevel(e.target.value as Draft["level"], draft))}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              onClick={writeScript}
              disabled={!!busy || generating || !(topic.trim() || draft.scene_id || resourceId)}
            >
              {busy === "script" ? "در حال نوشتن..." : "✨ نوشتن متن با AI"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              flexWrap: "wrap",
              alignItems: "flex-end",
              marginBottom: 12,
              padding: 10,
              border: "1px dashed var(--border, #333)",
              borderRadius: 8,
            }}
          >
            <div style={{ width: 120 }}>
              <label>حداکثر کلمه در جمله</label>
              {numberInput(scriptSettings.max_words_per_sentence, (n) =>
                setScriptSettings({ ...scriptSettings, max_words_per_sentence: n })
              )}
            </div>
            <div style={{ width: 90 }}>
              <label>جمله از</label>
              {numberInput(scriptSettings.min_lines, (n) => setScriptSettings({ ...scriptSettings, min_lines: n }))}
            </div>
            <div style={{ width: 90 }}>
              <label>تا</label>
              {numberInput(scriptSettings.max_lines, (n) => setScriptSettings({ ...scriptSettings, max_lines: n }))}
            </div>
            <div style={{ width: 90 }}>
              <label>لغت تازه</label>
              {numberInput(scriptSettings.new_vocab, (n) => setScriptSettings({ ...scriptSettings, new_vocab: n }))}
            </div>
            <div>
              <label>سرعت صدا</label>
              <select value={draft.speech_speed || 1} onChange={(e) => update({ speech_speed: Number(e.target.value) })}>
                {SPEEDS.map((s) => (
                  <option key={s.v} value={s.v}>
                    {s.l}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ width: 140 }}>
              <label>مکث بین جمله‌ها (ms)</label>
              {numberInput(draft.line_gap_ms, (n) => update({ line_gap_ms: n }), 100)}
            </div>
            <span className="hint" style={{ margin: "0 0 8px", flex: "1 1 200px" }}>
              از پیش‌فرض سطح پر شده‌اند. چهار تای اول روی نوشتن متن اثر دارند؛ سرعت و مکث روی ساخت صدا (تغییرشان صدای قبلی را
              باطل می‌کند).
            </span>
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
                    {p.kind === "featured" ? "⭐ منتخب" : "📚 درسی"} · {LEVELS.find((l) => l.id === p.level)?.label} ·{" "}
                    {p.line_count ?? 0} جمله · {STATUS_LABELS[p.audio_status]}
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
