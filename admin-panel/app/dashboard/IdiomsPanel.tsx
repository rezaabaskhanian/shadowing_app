"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { deleteIdioms, importIdioms, listIdioms, saveIdiom } from "@/lib/api";
import type { Idiom, IdiomInput } from "@/lib/types";

const LEVELS: { id: IdiomInput["level"]; label: string }[] = [
  { id: "", label: "بدون سطح" },
  { id: "A1", label: "A1" },
  { id: "A2", label: "A2" },
  { id: "B1", label: "B1" },
  { id: "B2", label: "B2" },
  { id: "C1", label: "C1" },
  { id: "C2", label: "C2" },
];

const levelLabel = (l: string) => LEVELS.find((x) => x.id === l)?.label ?? l;

const emptyDraft = (): IdiomInput & { id?: string } => ({
  phrase: "",
  meaning_fa: "",
  explanation_fa: "",
  example_en: "",
  example_fa: "",
  level: "",
  category: "",
  is_active: true,
});

type Mode = "single" | "json" | "bulk";

const JSON_SAMPLE = `[
  {
    "phrase": "break the ice",
    "meaning_fa": "یخ جمع را شکستن",
    "explanation_fa": "شروع صحبت در جمعی که هنوز با هم راحت نیستند",
    "example_en": "He told a joke to break the ice.",
    "example_fa": "یه جوک گفت تا یخ جمع بشکنه.",
    "level": "B1",
    "category": "social"
  }
]`;

const BULK_SAMPLE = `break the ice | یخ جمع را شکستن | He told a joke to break the ice. | یه جوک گفت تا یخ جمع بشکنه.
piece of cake | خیلی آسان | The test was a piece of cake.
hit the road | راه افتادن`;

/** اولین مقدارِ متنیِ غیرخالی از بین چند اسمِ ممکن برای یک فیلد. */
function pick(o: Record<string, unknown>, ...keys: string[]) {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/**
 * JSON را با اسم‌های رایج فیلدها می‌پذیرد: آرایه، یا آبجکتی با idioms/items/data،
 * و برای هر ردیف phrase|idiom|expression|en و meaning_fa|meaning|fa و ...؛
 * رشته‌ی ساده هم یعنی فقط خود اصطلاح.
 */
function parseJsonIdioms(text: string): Partial<IdiomInput>[] {
  const data = JSON.parse(text);
  const list: unknown[] = Array.isArray(data)
    ? data
    : data && typeof data === "object"
    ? ((data.idioms || data.items || data.expressions || data.data || [data]) as unknown[])
    : [];
  if (!Array.isArray(list)) throw new Error("ساختار JSON باید یک آرایه باشد");

  return list.map((row) => {
    if (typeof row === "string") return { phrase: row.trim() };
    const o = (row || {}) as Record<string, unknown>;
    // examples: [{en, fa}] یا ["..."] → فقط اولی
    let exEn = pick(o, "example_en", "example", "example_sentence");
    let exFa = pick(o, "example_fa", "example_translation", "example_meaning");
    if (!exEn && Array.isArray(o.examples) && o.examples.length) {
      const first = o.examples[0];
      if (typeof first === "string") exEn = first;
      else if (first && typeof first === "object") {
        exEn = pick(first as Record<string, unknown>, "en", "example_en", "text", "sentence");
        exFa = exFa || pick(first as Record<string, unknown>, "fa", "example_fa", "translation");
      }
    }
    return {
      phrase: pick(o, "phrase", "idiom", "expression", "en", "english", "text"),
      meaning_fa: pick(o, "meaning_fa", "meaning", "fa", "persian", "translation", "translation_fa"),
      explanation_fa: pick(o, "explanation_fa", "explanation", "description", "usage", "note", "notes"),
      example_en: exEn,
      example_fa: exFa,
      level: pick(o, "level").toUpperCase() as IdiomInput["level"],
      category: pick(o, "category", "topic", "tag"),
    };
  });
}

/** هر خط: اصطلاح | معنی فارسی | مثال انگلیسی | ترجمه‌ی مثال (جداکننده | یا Tab). */
function parseBulkIdioms(text: string): Partial<IdiomInput>[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [phrase = "", meaning_fa = "", example_en = "", example_fa = ""] = line
        .split(line.includes("|") ? "|" : "\t")
        .map((p) => p.trim());
      return { phrase, meaning_fa, example_en, example_fa };
    });
}

/**
 * «اصطلاحات» (idioms / expressions): ثبت تکی، از روی JSON (فایل یا متن) یا
 * گروهی (هر خط یک اصطلاح). اصطلاح تکراری (بدون حساسیت به حروف بزرگ/کوچک) دو
 * بار ثبت نمی‌شود؛ در وارد کردن گروهی می‌شود انتخاب کرد که به‌روز شود یا رد.
 */
export default function IdiomsPanel({ notify }: { notify: (msg: string, type?: "ok" | "err") => void }) {
  const [idioms, setIdioms] = useState<Idiom[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("single");
  const [draft, setDraft] = useState(emptyDraft());
  const [saving, setSaving] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkLevel, setBulkLevel] = useState<IdiomInput["level"]>("");
  const [overwrite, setOverwrite] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      setIdioms(await listIdioms());
      setSelected(new Set());
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

  // پیش‌نمایش پیش از وارد کردن: تعداد ردیف‌ها یا خطای parse
  const preview = useMemo((): { items: Partial<IdiomInput>[]; error: string } => {
    try {
      if (mode === "json") return { items: jsonText.trim() ? parseJsonIdioms(jsonText) : [], error: "" };
      if (mode === "bulk") return { items: parseBulkIdioms(bulkText), error: "" };
    } catch (err: any) {
      return { items: [], error: err instanceof SyntaxError ? "JSON نامعتبر است" : err.message };
    }
    return { items: [], error: "" };
  }, [mode, jsonText, bulkText]);

  const validPreview = preview.items.filter((i) => i.phrase);

  async function handleSaveSingle() {
    setSaving(true);
    try {
      await saveIdiom(draft);
      notify(draft.id ? "اصطلاح ویرایش شد" : "اصطلاح اضافه شد");
      // دسته و سطح برای اصطلاح بعدی می‌ماند تا پشت سر هم وارد کردن راحت باشد.
      setDraft({ ...emptyDraft(), category: draft.id ? "" : draft.category, level: draft.id ? "" : draft.level });
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    const items = validPreview.map((i) => ({
      ...i,
      category: i.category || bulkCategory,
      level: i.level || bulkLevel,
    }));
    if (items.length === 0) return;
    setSaving(true);
    try {
      const res = await importIdioms(items, overwrite);
      notify(`اضافه: ${res.created} · به‌روز: ${res.updated} · رد/تکراری: ${res.skipped}`);
      if (mode === "json") setJsonText("");
      else setBulkText("");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleJsonFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setJsonText(await file.text());
    if (fileRef.current) fileRef.current.value = "";
  }

  function edit(i: Idiom) {
    const { id, created_at: _created, ...rest } = i;
    setDraft({ id, ...rest });
    setMode("single");
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function handleDelete(ids: string[]) {
    if (ids.length === 0) return;
    if (!confirm(ids.length === 1 ? "این اصطلاح حذف شود؟" : `${ids.length} اصطلاح حذف شوند؟`)) return;
    try {
      await deleteIdioms(ids);
      notify("حذف شد");
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  async function toggleActive(i: Idiom) {
    try {
      const { created_at: _created, ...rest } = i;
      await saveIdiom({ ...rest, is_active: !i.is_active });
      load();
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  const categories = useMemo(
    () => Array.from(new Set(idioms.map((i) => i.category).filter(Boolean))).sort(),
    [idioms]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return idioms.filter(
      (i) =>
        (!categoryFilter || i.category === categoryFilter) &&
        (!q || i.phrase.toLowerCase().includes(q) || i.meaning_fa.includes(q) || i.example_en.toLowerCase().includes(q))
    );
  }, [idioms, search, categoryFilter]);

  const allSelected = filtered.length > 0 && filtered.every((i) => selected.has(i.id));

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  const tabBtn = (m: Mode, label: string) => (
    <button className={`btn btn-sm ${mode === m ? "" : "btn-ghost"}`} onClick={() => setMode(m)}>
      {label}
    </button>
  );

  return (
    <div>
      <div className="card" ref={formRef}>
        <h2 style={{ margin: 0 }}>💬 اصطلاحات</h2>
        <p className="hint" style={{ margin: "4px 0 12px" }}>
          اصطلاح‌ها را تکی، از روی JSON یا گروهی (هر خط یکی) اضافه کن. هر اصطلاح فقط یک‌بار ثبت می‌شود (بزرگی و کوچکی
          حروف مهم نیست).
        </p>
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {tabBtn("single", "➕ تکی")}
          {tabBtn("json", "{ } از JSON")}
          {tabBtn("bulk", "📝 گروهی (هر خط یکی)")}
        </div>

        {mode === "single" && (
          <div>
            {draft.id && <p className="hint">در حال ویرایش «{draft.phrase}»</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <label>اصطلاح (انگلیسی)</label>
                <input
                  dir="ltr"
                  value={draft.phrase}
                  onChange={(e) => setDraft({ ...draft, phrase: e.target.value })}
                  placeholder="break the ice"
                />
              </div>
              <div style={{ flex: "1 1 260px" }}>
                <label>معنی فارسی</label>
                <input
                  value={draft.meaning_fa}
                  onChange={(e) => setDraft({ ...draft, meaning_fa: e.target.value })}
                  placeholder="یخ جمع را شکستن"
                />
              </div>
            </div>
            <label>توضیح کاربرد (فارسی، اختیاری)</label>
            <textarea
              rows={2}
              value={draft.explanation_fa}
              onChange={(e) => setDraft({ ...draft, explanation_fa: e.target.value })}
              placeholder="وقتی می‌خواهی در جمعی که هنوز راحت نیستند صحبت را شروع کنی"
            />
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 260px" }}>
                <label>جمله‌ی مثال (انگلیسی)</label>
                <input
                  dir="ltr"
                  value={draft.example_en}
                  onChange={(e) => setDraft({ ...draft, example_en: e.target.value })}
                  placeholder="He told a joke to break the ice."
                />
              </div>
              <div style={{ flex: "1 1 260px" }}>
                <label>ترجمه‌ی مثال</label>
                <input value={draft.example_fa} onChange={(e) => setDraft({ ...draft, example_fa: e.target.value })} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
              <div>
                <label>سطح</label>
                <select
                  value={draft.level}
                  onChange={(e) => setDraft({ ...draft, level: e.target.value as IdiomInput["level"] })}
                >
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label>دسته (اختیاری)</label>
                <input
                  list="idiom-categories"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="مثلاً کار، سفر، احساسات"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={draft.is_active}
                  onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
                  style={{ width: "auto" }}
                />
                فعال
              </label>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button className="btn" onClick={handleSaveSingle} disabled={saving || !draft.phrase.trim()}>
                {saving ? "در حال ذخیره..." : draft.id ? "ذخیره‌ی تغییرات" : "افزودن"}
              </button>
              {draft.id && (
                <button className="btn btn-ghost" onClick={() => setDraft(emptyDraft())} disabled={saving}>
                  انصراف
                </button>
              )}
            </div>
          </div>
        )}

        {mode !== "single" && (
          <div>
            {mode === "json" ? (
              <>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: "none" }}
                    onChange={(e) => handleJsonFile(e.target.files)}
                  />
                  <button className="btn btn-sm btn-ghost" onClick={() => fileRef.current?.click()}>
                    ⬆️ انتخاب فایل JSON
                  </button>
                  <button className="btn btn-sm btn-ghost" onClick={() => setJsonText(JSON_SAMPLE)}>
                    نمونه
                  </button>
                  <span className="hint" style={{ margin: 0 }}>
                    آرایه‌ای از آبجکت‌ها؛ فقط «phrase» اجباری است (idiom / expression هم قبول است).
                  </span>
                </div>
                <textarea
                  dir="ltr"
                  rows={12}
                  value={jsonText}
                  onChange={(e) => setJsonText(e.target.value)}
                  placeholder={JSON_SAMPLE}
                  style={{ marginTop: 8 }}
                />
              </>
            ) : (
              <>
                <p className="hint" style={{ margin: 0 }}>
                  هر خط یک اصطلاح: <code dir="ltr">اصطلاح | معنی فارسی | مثال انگلیسی | ترجمه‌ی مثال</code> — فقط ستون اول
                  اجباری است. جداکننده می‌تواند «|» یا Tab باشد (از اکسل/گوگل‌شیت مستقیم کپی کن).
                </p>
                <textarea
                  dir="ltr"
                  rows={12}
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={BULK_SAMPLE}
                  style={{ marginTop: 8 }}
                />
              </>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end", marginTop: 8 }}>
              <div>
                <label>سطح پیش‌فرض</label>
                <select value={bulkLevel} onChange={(e) => setBulkLevel(e.target.value as IdiomInput["level"])}>
                  {LEVELS.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: "1 1 200px" }}>
                <label>دسته‌ی پیش‌فرض</label>
                <input
                  list="idiom-categories"
                  value={bulkCategory}
                  onChange={(e) => setBulkCategory(e.target.value)}
                  placeholder="برای ردیف‌هایی که دسته ندارند"
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="checkbox"
                  checked={overwrite}
                  onChange={(e) => setOverwrite(e.target.checked)}
                  style={{ width: "auto" }}
                />
                تکراری‌ها به‌روز شوند (وگرنه رد می‌شوند)
              </label>
            </div>

            {preview.error ? (
              <p className="error-msg">{preview.error}</p>
            ) : (
              preview.items.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p className="hint" style={{ margin: "0 0 6px" }}>
                    {validPreview.length} اصطلاح آماده‌ی وارد کردن
                    {preview.items.length > validPreview.length &&
                      ` · ${preview.items.length - validPreview.length} ردیف بدون اصطلاح نادیده گرفته می‌شود`}
                  </p>
                  <div style={{ maxHeight: 220, overflow: "auto", border: "1px solid var(--border, #333)", borderRadius: 8 }}>
                    <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                      <tbody>
                        {validPreview.slice(0, 50).map((i, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid var(--border, #333)" }}>
                            <td dir="ltr" style={{ padding: 6, fontWeight: 600 }}>
                              {i.phrase}
                            </td>
                            <td style={{ padding: 6 }}>{i.meaning_fa}</td>
                            <td dir="ltr" style={{ padding: 6, opacity: 0.75 }}>
                              {i.example_en}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {validPreview.length > 50 && (
                      <p className="hint" style={{ padding: 6, margin: 0 }}>
                        و {validPreview.length - 50} مورد دیگر...
                      </p>
                    )}
                  </div>
                </div>
              )
            )}

            <button
              className="btn"
              onClick={handleImport}
              disabled={saving || validPreview.length === 0}
              style={{ marginTop: 12 }}
            >
              {saving ? "در حال وارد کردن..." : `وارد کردن ${validPreview.length || ""} اصطلاح`}
            </button>
          </div>
        )}

        <datalist id="idiom-categories">
          {categories.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
          <input
            placeholder="جستجو در اصطلاح، معنی یا مثال"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, minWidth: 220 }}
          />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ width: "auto" }}>
            <option value="">همه‌ی دسته‌ها</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <span className="hint" style={{ margin: 0 }}>
            {filtered.length} از {idioms.length}
          </span>
        </div>

        {filtered.length > 0 && (
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, margin: 0 }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => setSelected(allSelected ? new Set() : new Set(filtered.map((i) => i.id)))}
                style={{ width: "auto" }}
              />
              انتخاب همه
            </label>
            {selected.size > 0 && (
              <button className="btn btn-danger btn-sm" onClick={() => handleDelete(Array.from(selected))}>
                حذف {selected.size} مورد
              </button>
            )}
          </div>
        )}

        {loading ? (
          <p className="hint">در حال بارگذاری...</p>
        ) : filtered.length === 0 ? (
          <p className="hint">{idioms.length === 0 ? "هنوز اصطلاحی اضافه نشده." : "اصطلاحی با این فیلتر پیدا نشد."}</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filtered.map((i) => (
              <div
                key={i.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  border: "1px solid var(--border, #333)",
                  borderRadius: 8,
                  padding: 10,
                  opacity: i.is_active ? 1 : 0.55,
                }}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i.id)}
                  onChange={() => toggleSelect(i.id)}
                  style={{ width: "auto" }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div>
                    <span dir="ltr" style={{ fontWeight: 700 }}>
                      {i.phrase}
                    </span>
                    {i.meaning_fa && <span> — {i.meaning_fa}</span>}
                  </div>
                  {i.example_en && (
                    <div className="hint" dir="ltr" style={{ margin: 0, textAlign: "left" }}>
                      {i.example_en}
                    </div>
                  )}
                  <div className="hint" style={{ margin: 0 }}>
                    {[i.level && levelLabel(i.level), i.category, !i.is_active && "غیرفعال"].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(i)}>
                    {i.is_active ? "غیرفعال کن" : "فعال کن"}
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => edit(i)}>
                    ویرایش
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete([i.id])}>
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
