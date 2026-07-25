"use client";

import { useRef, useState } from "react";
import {
  API_BASE,
  createScene,
  uploadAudio,
  uploadImage,
} from "@/lib/api";
import type {
  DialogueInput,
  Difficulty,
  DisplayType,
  HotspotInput,
  Speaker,
} from "@/lib/types";

const SPEAKERS: { v: Speaker; l: string }[] = [
  { v: "customer", l: "مشتری (customer)" },
  { v: "clerk", l: "فروشنده (clerk)" },
  { v: "npc", l: "شخصیت دیگر (npc)" },
];
const DISPLAY_TYPES: { v: DisplayType; l: string }[] = [
  { v: "full", l: "متن کامل (full)" },
  { v: "partial", l: "نیمه‌راهنما (partial)" },
  { v: "none", l: "بدون متن (none)" },
];

function newDialogue(order: number): DialogueInput {
  return {
    order,
    speaker: "customer",
    original_text: "",
    translation: "",
    audio_url: "",
    display_type: "full",
    partial_hint: "",
    wait_duration: 5,
  };
}

export default function SceneCreator({
  notify,
  onSaved,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<HotspotInput[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // ---------- آپلود تصویر ----------
  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      setHotspots([]);
      setSelected(null);
      notify("تصویر آپلود شد", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setUploadingImg(false);
    }
  }

  // ---------- افزودن هات‌اسپات با کلیک روی تصویر ----------
  function handleImageClick(e: React.MouseEvent) {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const next: HotspotInput = {
      name: `نقطه ${hotspots.length + 1}`,
      x_position: Math.round(x * 100) / 100,
      y_position: Math.round(y * 100) / 100,
      order: hotspots.length + 1,
      dialogues: [],
    };
    setHotspots((h) => [...h, next]);
    setSelected(hotspots.length);
  }

  function updateHotspot(i: number, patch: Partial<HotspotInput>) {
    setHotspots((hs) => hs.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  }
  function removeHotspot(i: number) {
    setHotspots((hs) =>
      hs
        .filter((_, idx) => idx !== i)
        .map((h, idx) => ({ ...h, order: idx + 1 }))
    );
    setSelected(null);
  }

  // ---------- دیالوگ‌ها ----------
  function addDialogue(hi: number) {
    setHotspots((hs) =>
      hs.map((h, idx) =>
        idx === hi
          ? { ...h, dialogues: [...h.dialogues, newDialogue(h.dialogues.length + 1)] }
          : h
      )
    );
  }
  function updateDialogue(
    hi: number,
    di: number,
    patch: Partial<DialogueInput>
  ) {
    setHotspots((hs) =>
      hs.map((h, idx) =>
        idx === hi
          ? {
              ...h,
              dialogues: h.dialogues.map((d, j) =>
                j === di ? { ...d, ...patch } : d
              ),
            }
          : h
      )
    );
  }
  function removeDialogue(hi: number, di: number) {
    setHotspots((hs) =>
      hs.map((h, idx) =>
        idx === hi
          ? {
              ...h,
              dialogues: h.dialogues
                .filter((_, j) => j !== di)
                .map((d, j) => ({ ...d, order: j + 1 })),
            }
          : h
      )
    );
  }
  async function handleDialogueAudio(
    hi: number,
    di: number,
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await uploadAudio(file);
      updateDialogue(hi, di, { audio_url: url });
      notify("صدای دیالوگ آپلود شد", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    }
  }

  // ---------- ذخیره ----------
  function validate(): string | null {
    if (!title.trim()) return "عنوان صحنه الزامی است";
    if (!imageUrl) return "ابتدا تصویر پس‌زمینه را آپلود کنید";
    if (hotspots.length === 0) return "حداقل یک هات‌اسپات اضافه کنید";
    for (const h of hotspots) {
      for (const d of h.dialogues) {
        if (!d.original_text.trim())
          return `متن انگلیسی یکی از دیالوگ‌های «${h.name}» خالی است`;
      }
    }
    return null;
  }

  async function handleSave() {
    const err = validate();
    if (err) {
      notify(err, "err");
      return;
    }
    setSaving(true);
    try {
      await createScene({
        title: title.trim(),
        description: description.trim(),
        background_image_url: imageUrl!,
        difficulty,
        hotspots,
      });
      notify("صحنه با موفقیت ذخیره شد ✅", "ok");
      resetForm();
      onSaved();
    } catch (e: any) {
      notify(e.message, "err");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setDifficulty("beginner");
    setImageUrl(null);
    setHotspots([]);
    setSelected(null);
  }

  const sel = selected !== null ? hotspots[selected] : null;

  return (
    <div>
      {/* اطلاعات پایه صحنه */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>اطلاعات صحنه</h2>
        <div className="row">
          <div>
            <label>عنوان صحنه *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثلاً: خرید در سوپرمارکت"
            />
          </div>
          <div>
            <label>سطح سختی *</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as Difficulty)}
            >
              <option value="beginner">مبتدی</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">پیشرفته</option>
            </select>
          </div>
        </div>
        <label>توضیحات</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="توضیح کوتاه درباره صحنه..."
        />
      </div>

      {/* تصویر */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>۱) تصویر پس‌زمینه</h2>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleImage}
          disabled={uploadingImg}
        />
        {uploadingImg && <p className="hint">در حال آپلود...</p>}
      </div>

      {/* ویرایشگر هات‌اسپات + دیالوگ */}
      {imageUrl && (
        <div className="card">
          <h2 style={{ marginTop: 0 }}>۲) نقاط هات‌اسپات و دیالوگ‌ها</h2>
          <p className="hint">
            روی تصویر کلیک کنید تا نقطه اضافه شود، سپس از سمت چپ نقطه را انتخاب و
            دیالوگ‌هایش را با متن و صدا وارد کنید.
          </p>
          <div className="editor-grid">
            {/* تصویر با نقاط */}
            <div>
              <div className="image-wrap" onClick={handleImageClick}>
                <img ref={imgRef} src={`${API_BASE}${imageUrl}`} alt="scene" />
                {hotspots.map((h, i) => (
                  <div
                    key={i}
                    className={`hotspot ${selected === i ? "selected" : ""}`}
                    style={{ left: `${h.x_position}%`, top: `${h.y_position}%` }}
                    title={h.name}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(i);
                    }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* لیست هات‌اسپات‌ها */}
            <div>
              <h3 style={{ marginTop: 0, fontSize: 15 }}>
                هات‌اسپات‌ها ({hotspots.length})
              </h3>
              {hotspots.length === 0 && (
                <p className="hint">هنوز نقطه‌ای اضافه نشده است.</p>
              )}
              {hotspots.map((h, i) => (
                <div
                  key={i}
                  className={`hs-item ${selected === i ? "active" : ""}`}
                  onClick={() => setSelected(i)}
                >
                  <span className="badge">{i + 1}</span>
                  <span>{h.name}</span>
                  <span className="coords">
                    {h.dialogues.length} دیالوگ
                  </span>
                  <button
                    className="remove-x"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeHotspot(i);
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ویرایش نقطه‌ی انتخاب‌شده */}
          {sel && selected !== null && (
            <div className="card" style={{ marginTop: 16, marginBottom: 0 }}>
              <div className="row">
                <div>
                  <label>نام هات‌اسپات #{selected + 1}</label>
                  <input
                    value={sel.name}
                    onChange={(e) =>
                      updateHotspot(selected, { name: e.target.value })
                    }
                  />
                </div>
                <div style={{ maxWidth: 160, flex: "0 0 auto" }}>
                  <label>موقعیت</label>
                  <input
                    disabled
                    value={`x:${sel.x_position}%  y:${sel.y_position}%`}
                    dir="ltr"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  margin: "14px 0 8px",
                }}
              >
                <h3 style={{ margin: 0, fontSize: 15 }}>
                  دیالوگ‌ها ({sel.dialogues.length})
                </h3>
                <button
                  className="btn btn-sm"
                  onClick={() => addDialogue(selected)}
                >
                  ➕ افزودن دیالوگ
                </button>
              </div>

              {sel.dialogues.map((d, di) => (
                <div className="dialogue-box" key={di}>
                  <h4>
                    <span>دیالوگ #{di + 1}</span>
                    <button
                      className="remove-x"
                      onClick={() => removeDialogue(selected, di)}
                    >
                      حذف ✕
                    </button>
                  </h4>

                  <div className="row">
                    <div>
                      <label>گوینده</label>
                      <select
                        value={d.speaker}
                        onChange={(e) =>
                          updateDialogue(selected, di, {
                            speaker: e.target.value as Speaker,
                          })
                        }
                      >
                        {SPEAKERS.map((s) => (
                          <option key={s.v} value={s.v}>
                            {s.l}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label>نوع نمایش متن</label>
                      <select
                        value={d.display_type}
                        onChange={(e) =>
                          updateDialogue(selected, di, {
                            display_type: e.target.value as DisplayType,
                          })
                        }
                      >
                        {DISPLAY_TYPES.map((s) => (
                          <option key={s.v} value={s.v}>
                            {s.l}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <label>متن انگلیسی *</label>
                  <input
                    dir="ltr"
                    value={d.original_text}
                    onChange={(e) =>
                      updateDialogue(selected, di, {
                        original_text: e.target.value,
                      })
                    }
                    placeholder="How much is this?"
                  />

                  <label>ترجمه فارسی</label>
                  <input
                    value={d.translation}
                    onChange={(e) =>
                      updateDialogue(selected, di, {
                        translation: e.target.value,
                      })
                    }
                    placeholder="این چند است؟"
                  />

                  {d.display_type === "partial" && (
                    <>
                      <label>راهنمای نیمه (partial hint)</label>
                      <input
                        dir="ltr"
                        value={d.partial_hint}
                        onChange={(e) =>
                          updateDialogue(selected, di, {
                            partial_hint: e.target.value,
                          })
                        }
                        placeholder="How ___ is ___?"
                      />
                    </>
                  )}

                  <div className="row">
                    <div style={{ maxWidth: 180, flex: "0 0 auto" }}>
                      <label>مدت انتظار (ثانیه)</label>
                      <input
                        type="number"
                        min={1}
                        max={30}
                        value={d.wait_duration}
                        onChange={(e) =>
                          updateDialogue(selected, di, {
                            wait_duration: Number(e.target.value) || 5,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label>🎙 صدای دیالوگ (آپلود ویس)</label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleDialogueAudio(selected, di, e)}
                      />
                    </div>
                  </div>

                  {d.audio_url && (
                    <audio controls src={`${API_BASE}${d.audio_url}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ذخیره */}
      <div className="card">
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving ? "در حال ذخیره..." : "💾 ذخیره صحنه"}
        </button>{" "}
        <button className="btn btn-ghost" onClick={resetForm}>
          پاک‌کردن فرم
        </button>
      </div>
    </div>
  );
}
