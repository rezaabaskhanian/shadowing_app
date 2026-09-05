"use client";

import { useEffect, useRef, useState } from "react";
import {
  API_BASE,
  approveSceneSubmission,
  approveTopicSuggestion,
  createScene,
  generateAudio,
  generateScene,
  listSceneCategories,
  listTTSVoices,
  updateScene,
  uploadAudio,
  uploadImage,
} from "@/lib/api";
import type { TTSVoice } from "@/lib/api";
import type {
  DialogueInput,
  Difficulty,
  DisplayType,
  HotspotInput,
  SceneResp,
  SceneSubmission,
  Speaker,
  TopicSuggestion,
  WordInput,
} from "@/lib/types";

const PRESET_SPEAKERS: { v: string; l: string }[] = [
  { v: "customer", l: "مشتری (customer)" },
  { v: "clerk", l: "فروشنده (clerk)" },
  { v: "doctor", l: "پزشک (doctor)" },
  { v: "patient", l: "بیمار (patient)" },
  { v: "passenger", l: "مسافر (passenger)" },
  { v: "receptionist", l: "پذیرش / رزرو (receptionist)" },
  { v: "teacher", l: "معلم (teacher)" },
  { v: "student", l: "دانش‌آموز (student)" },
  { v: "guide", l: "راهنما (guide)" },
  { v: "friend", l: "دوست (friend)" },
  { v: "driver", l: "راننده (driver)" },
  { v: "waiter", l: "گارسون (waiter)" },
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
    words: [],
  };
}

// hotspotsFromScene هات‌اسپات‌های دریافتی از بک‌اند را به ورودی‌های فرم تبدیل می‌کند.
function hotspotsFromScene(scene: SceneResp): HotspotInput[] {
  return (scene.hotspots || []).map((h, hi) => ({
    name: h.name || `نقطه ${hi + 1}`,
    x_position: h.x_position ?? 50,
    y_position: h.y_position ?? 50,
    order: h.order ?? hi + 1,
    dialogues: (h.dialogues || []).map((d, di) => ({
      order: d.order ?? di + 1,
      speaker: (d.speaker as Speaker) || "customer",
      original_text: d.original_text || "",
      translation: d.translation || "",
      audio_url: d.audio_url || "",
      display_type: (d.display_type as DisplayType) || "full",
      partial_hint: d.partial_hint || "",
      wait_duration: d.wait_duration || 5,
      words: d.words || [],
    })),
  }));
}

export default function SceneCreator({
  notify,
  onSaved,
  editScene,
  onCancelEdit,
  fromSubmission,
  onApproved,
  onCancelReview,
  fromTopicSuggestion,
  onTopicApproved,
  onCancelTopicReview,
}: {
  notify: (msg: string, type?: "ok" | "err") => void;
  onSaved: () => void;
  editScene?: SceneResp | null;
  onCancelEdit?: () => void;
  fromSubmission?: SceneSubmission | null;
  onApproved?: () => void;
  onCancelReview?: () => void;
  fromTopicSuggestion?: TopicSuggestion | null;
  onTopicApproved?: () => void;
  onCancelTopicReview?: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [isLocked, setIsLocked] = useState(false);
  const [category, setCategory] = useState("");
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [hotspots, setHotspots] = useState<HotspotInput[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // صداهای در دسترس ElevenLabs (برای انتخاب مرد/زن هنگام تولید صدای هر دیالوگ)
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [voiceChoice, setVoiceChoice] = useState<Record<string, string>>({});
  const [speedChoice, setSpeedChoice] = useState<Record<string, number>>({});

  useEffect(() => {
    listTTSVoices()
      .then(setVoices)
      .catch((err) => {
        setVoices([]);
        notify(err.message, "err");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    listSceneCategories()
      .then(setCategoryOptions)
      .catch(() => setCategoryOptions([]));
  }, []);

  // در حالت ویرایش، فرم را با اطلاعات صحنه‌ی موجود پر می‌کنیم.
  useEffect(() => {
    if (!editScene) return;
    setTitle(editScene.title || "");
    setDescription(editScene.description || "");
    setDifficulty((editScene.difficulty as Difficulty) || "beginner");
    setIsLocked(!!editScene.is_locked);
    setCategory(editScene.category || "");
    setImageUrl(editScene.backgroundImageURL || null);
    const hs = hotspotsFromScene(editScene);
    setHotspots(hs);
    setSelected(hs.length > 0 ? 0 : null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editScene]);

  // در حالت بررسیِ پیشنهاد کاربر، فرم را با موقعیت/عکس/دیالوگ‌های پیشنهادی پر
  // می‌کنیم؛ ادمین باقی موارد (عنوان، جای هات‌اسپات، ترجمه، صدا) را کامل می‌کند.
  useEffect(() => {
    if (!fromSubmission) return;
    setTitle("");
    setDescription(fromSubmission.situation_text || "");
    setDifficulty("beginner");
    setIsLocked(false);
    setCategory("");
    setImageUrl(fromSubmission.image_url || null);
    const dialogues: DialogueInput[] = (fromSubmission.dialogues || []).map((d, di) => ({
      order: di + 1,
      speaker: (d.speaker as Speaker) || "customer",
      original_text: d.text || "",
      translation: "",
      audio_url: "",
      display_type: "full",
      partial_hint: "",
      wait_duration: 5,
      words: [],
    }));
    setHotspots(
      dialogues.length > 0
        ? [{ name: "نقطه ۱", x_position: 50, y_position: 50, order: 1, dialogues }]
        : []
    );
    setSelected(dialogues.length > 0 ? 0 : null);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromSubmission]);

  // در حالت بررسیِ پیشنهاد موضوع، فرم را خالی می‌کنیم و فقط پرامپت هوش مصنوعی
  // را از روی موضوع پیشنهادی پر می‌کنیم؛ ادمین با دکمه‌ی «تولید با هوش
  // مصنوعی» موجود، صحنه را از روی همین پرامپت می‌سازد (یا کاملاً دستی).
  useEffect(() => {
    if (!fromTopicSuggestion) return;
    setTitle("");
    setDescription("");
    setDifficulty("beginner");
    setIsLocked(false);
    setCategory("");
    setImageUrl(null);
    setHotspots([]);
    setSelected(null);
    setAiPrompt(fromTopicSuggestion.topic_text || "");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromTopicSuggestion]);

  // ---------- تولید با هوش مصنوعی (فرم را پر می‌کند؛ ذخیره نمی‌کند) ----------
  async function handleGenerate() {
    if (aiPrompt.trim().length < 3) {
      notify("یک موقعیت کوتاه بنویس (مثلاً: مکالمه در داروخانه)", "err");
      return;
    }
    setGenerating(true);
    try {
      const g = await generateScene(aiPrompt.trim(), difficulty);
      setTitle(g.title || "");
      setDescription(g.description || "");
      if (g.difficulty) setDifficulty(g.difficulty);
      const newHotspots: HotspotInput[] = (g.hotspots || []).map((h, hi) => ({
        name: h.name || `نقطه ${hi + 1}`,
        x_position: h.x_position ?? 50,
        y_position: h.y_position ?? 50,
        order: h.order ?? hi + 1,
        dialogues: (h.dialogues || []).map((d, di) => ({
          order: d.order ?? di + 1,
          speaker: d.speaker || "customer",
          original_text: d.original_text || "",
          translation: d.translation || "",
          audio_url: "",
          display_type: d.display_type || "full",
          partial_hint: "",
          wait_duration: d.wait_duration || 5,
          words: d.words || [],
        })),
      }));
      setHotspots(newHotspots);
      setSelected(newHotspots.length > 0 ? 0 : null);
      notify(
        "محتوا تولید شد ✅ حالا تصویر را آپلود کن و جای نقاط را با کلیک تنظیم کن",
        "ok"
      );
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setGenerating(false);
    }
  }

  // ---------- آپلود تصویر ----------
  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImage(file);
      setImageUrl(url);
      // نقاط (و دیالوگ‌های تولیدشده با AI) را فقط وقتی پاک می‌کنیم که در حالت
      // ساخت، تصویر قبلاً آپلود شده را با تصویر دیگری جایگزین می‌کنیم — چون
      // موقعیت نقاط روی تصویر قبلی دیگر معنی ندارد. اولین آپلود بعد از تولید
      // با AI باید نقاط/دیالوگ‌های همان لحظه را حفظ کند.
      if (!editScene && imageUrl) {
        setHotspots([]);
        setSelected(null);
      }
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

  // ---------- جابه‌جا کردن نقطه با درگ روی تصویر ----------
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const draggedRef = useRef(false);

  function positionFromPointer(e: { clientX: number; clientY: number }) {
    const rect = imgRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.min(100, Math.max(0, Math.round(x * 100) / 100)),
      y: Math.min(100, Math.max(0, Math.round(y * 100) / 100)),
    };
  }

  function handleHotspotPointerDown(e: React.PointerEvent, i: number) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    draggedRef.current = false;
    setDraggingIndex(i);
    setSelected(i);
  }

  function handleHotspotPointerMove(e: React.PointerEvent, i: number) {
    if (draggingIndex !== i || !imgRef.current) return;
    draggedRef.current = true;
    const { x, y } = positionFromPointer(e);
    updateHotspot(i, { x_position: x, y_position: y });
  }

  function handleHotspotPointerUp(e: React.PointerEvent) {
    (e.target as Element).releasePointerCapture(e.pointerId);
    setDraggingIndex(null);
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
  // ---------- واژه‌های دیالوگ ----------
  function addWord(hi: number, di: number) {
    updateDialogue(hi, di, {
      words: [
        ...(hotspots[hi]?.dialogues[di]?.words ?? []),
        { word: "", meaning: "" },
      ],
    });
  }
  function updateWord(
    hi: number,
    di: number,
    wi: number,
    patch: Partial<WordInput>
  ) {
    const words = (hotspots[hi]?.dialogues[di]?.words ?? []).map((w, k) =>
      k === wi ? { ...w, ...patch } : w
    );
    updateDialogue(hi, di, { words });
  }
  function removeWord(hi: number, di: number, wi: number) {
    const words = (hotspots[hi]?.dialogues[di]?.words ?? []).filter(
      (_, k) => k !== wi
    );
    updateDialogue(hi, di, { words });
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

  // ---------- تولید صدای دیالوگ با هوش مصنوعی (ElevenLabs) ----------
  const [generatingAudioFor, setGeneratingAudioFor] = useState<string | null>(null);

  async function handleGenerateDialogueAudio(hi: number, di: number) {
    const text = hotspots[hi]?.dialogues[di]?.original_text?.trim();
    if (!text) {
      notify("اول متن انگلیسی دیالوگ را بنویس", "err");
      return;
    }
    const audioKey = `${hi}-${di}`;
    setGeneratingAudioFor(audioKey);
    try {
      const url = await generateAudio(text, voiceChoice[audioKey], speedChoice[audioKey]);
      updateDialogue(hi, di, { audio_url: url });
      notify("صدا با هوش مصنوعی ساخته شد ✅", "ok");
    } catch (err: any) {
      notify(err.message, "err");
    } finally {
      setGeneratingAudioFor(null);
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
      const payload = {
        title: title.trim(),
        description: description.trim(),
        background_image_url: imageUrl!,
        difficulty,
        hotspots,
        is_locked: isLocked,
        category: category.trim(),
      };
      if (fromSubmission) {
        const res = await approveSceneSubmission(fromSubmission.id, payload);
        notify(`صحنه منتشر شد و ${res.points_awarded} امتیاز به کاربر داده شد ✅`, "ok");
        resetForm();
        onApproved?.();
      } else if (fromTopicSuggestion) {
        const res = await approveTopicSuggestion(fromTopicSuggestion.id, payload);
        notify(`صحنه منتشر شد و ${res.points_awarded} امتیاز به کاربر داده شد ✅`, "ok");
        resetForm();
        onTopicApproved?.();
      } else if (editScene) {
        await updateScene(editScene.id, payload);
        notify("صحنه با موفقیت ویرایش شد ✅", "ok");
        onSaved();
        onCancelEdit?.();
        resetForm();
      } else {
        await createScene(payload);
        notify("صحنه با موفقیت ذخیره شد ✅", "ok");
        resetForm();
        onSaved();
      }
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
    setIsLocked(false);
    setCategory("");
    setImageUrl(null);
    setHotspots([]);
    setSelected(null);
  }

  const sel = selected !== null ? hotspots[selected] : null;

  return (
    <div>
      {/* بنر حالت بررسی پیشنهاد کاربر */}
      {fromSubmission && (
        <div
          className="card"
          style={{
            borderColor: "var(--success)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>
            📩 بررسی پیشنهاد کاربر — موقعیت و دیالوگ‌ها از کاربر پرشده؛ عنوان، جای
            هات‌اسپات، ترجمه و صدا را کامل کن و «ذخیره» را بزن تا منتشر و امتیاز
            کاربر اهدا شود.
          </h2>
        </div>
      )}

      {/* بنر حالت بررسی پیشنهاد موضوع */}
      {fromTopicSuggestion && (
        <div
          className="card"
          style={{
            borderColor: "var(--success)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>
            💡 بررسی پیشنهاد موضوع — پرامپت «تولید با هوش مصنوعی» از روی موضوع
            پیشنهادی پر شده؛ می‌توانی همان را بزنی یا کاملاً دستی صحنه بسازی، سپس
            «ذخیره» را بزن تا منتشر و امتیاز کاربر اهدا شود.
          </h2>
        </div>
      )}

      {/* بنر حالت ویرایش */}
      {editScene && (
        <div
          className="card"
          style={{
            borderColor: "#F59E0B",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16 }}>
            ✏️ در حال ویرایش صحنه: «{editScene.title}»
          </h2>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              onCancelEdit?.();
              resetForm();
            }}
          >
            انصراف از ویرایش
          </button>
        </div>
      )}

      {/* تولید با هوش مصنوعی (اختیاری — فرم را پر می‌کند) */}
      <div className="card" style={{ borderColor: "var(--primary)" }}>
        <h2 style={{ marginTop: 0 }}>🤖 تولید با هوش مصنوعی (اختیاری)</h2>
        <p style={{ marginTop: 0, opacity: 0.75, fontSize: 13 }}>
          یک موقعیت کوتاه بنویس؛ دیالوگ‌ها، ترجمه و واژه‌ها خودکار ساخته و در فرم
          زیر پر می‌شوند. بعدش تصویر را آپلود کن و جای نقاط را تنظیم کن.
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            placeholder="مثلاً: مکالمه در داروخانه"
            disabled={generating}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !generating) handleGenerate();
            }}
            style={{ flex: 1 }}
          />
          <button
            className="btn"
            type="button"
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? "در حال تولید..." : "✨ تولید"}
          </button>
        </div>
      </div>

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
            <label>سطح زبان‌آموز *</label>
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
        <label>دسته‌بندی</label>
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="مثلاً: shop، travel، restaurant..."
          list="scene-category-options"
        />
        <datalist id="scene-category-options">
          {categoryOptions.map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            style={{ width: "auto" }}
          />
          این صحنه قفل باشد (فقط با اشتراک فعال باز می‌شود)
        </label>
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
            روی تصویر کلیک کنید تا نقطه اضافه شود؛ برای جابه‌جا کردن نقطه‌ی موجود
            آن را با موس بگیرید و بکشید. از سمت چپ هم می‌توانید نقطه را انتخاب و
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
                    className={`hotspot ${selected === i ? "selected" : ""} ${
                      draggingIndex === i ? "dragging" : ""
                    }`}
                    style={{ left: `${h.x_position}%`, top: `${h.y_position}%` }}
                    title={h.name}
                    onPointerDown={(e) => handleHotspotPointerDown(e, i)}
                    onPointerMove={(e) => handleHotspotPointerMove(e, i)}
                    onPointerUp={handleHotspotPointerUp}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!draggedRef.current) setSelected(i);
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
                <div style={{ maxWidth: 200, flex: "0 0 auto" }}>
                  <label>موقعیت (٪) — قابل ویرایش دستی</label>
                  <div style={{ display: "flex", gap: 6 }} dir="ltr">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={sel.x_position}
                      onChange={(e) =>
                        updateHotspot(selected, {
                          x_position: Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.1}
                      value={sel.y_position}
                      onChange={(e) =>
                        updateHotspot(selected, {
                          y_position: Math.min(
                            100,
                            Math.max(0, Number(e.target.value) || 0)
                          ),
                        })
                      }
                    />
                  </div>
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
                      <label>گوینده (نقش/شخصیت)</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <select
                          style={{ flex: 1, minWidth: 130 }}
                          value={PRESET_SPEAKERS.some((s) => s.v === d.speaker) ? d.speaker : "custom"}
                          onChange={(e) => {
                            if (e.target.value !== "custom") {
                              updateDialogue(selected, di, { speaker: e.target.value });
                            }
                          }}
                        >
                          {PRESET_SPEAKERS.map((s) => (
                            <option key={s.v} value={s.v}>
                              {s.l}
                            </option>
                          ))}
                          <option value="custom">✍️ نقش دلخواه...</option>
                        </select>
                        <input
                          style={{ flex: 1, minWidth: 120 }}
                          placeholder="نام/نقش گوینده"
                          value={d.speaker}
                          onChange={(e) =>
                            updateDialogue(selected, di, { speaker: e.target.value })
                          }
                        />
                      </div>
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
                      <label>🎙 صدای دیالوگ</label>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <input
                          type="file"
                          accept="audio/*"
                          style={{ flex: 1, minWidth: 160 }}
                          onChange={(e) => handleDialogueAudio(selected, di, e)}
                        />
                        {voices.length > 0 && (
                          <select
                            value={voiceChoice[`${selected}-${di}`] ?? ""}
                            onChange={(e) =>
                              setVoiceChoice((s) => ({
                                ...s,
                                [`${selected}-${di}`]: e.target.value,
                              }))
                            }
                            style={{ minWidth: 170 }}
                          >
                            <option value="">صدای پیش‌فرض</option>
                            {voices.map((v) => (
                              <option key={v.voice_id} value={v.voice_id}>
                                {v.gender === "male"
                                  ? "👨"
                                  : v.gender === "female"
                                  ? "👩"
                                  : "🎙"}{" "}
                                {v.name}
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
                          value={speedChoice[`${selected}-${di}`] ?? ""}
                          onChange={(e) =>
                            setSpeedChoice((s) => ({
                              ...s,
                              [`${selected}-${di}`]: Number(e.target.value) || 0,
                            }))
                          }
                          style={{ width: 80 }}
                        />
                        <button
                          type="button"
                          className="btn btn-sm btn-ghost"
                          onClick={() => handleGenerateDialogueAudio(selected, di)}
                          disabled={generatingAudioFor === `${selected}-${di}`}
                        >
                          {generatingAudioFor === `${selected}-${di}`
                            ? "در حال ساخت..."
                            : "🔊 تولید با AI"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {d.audio_url && (
                    <audio controls src={`${API_BASE}${d.audio_url}`} />
                  )}

                  {/* واژه‌های دیالوگ (انگلیسی + معنی) */}
                  <div style={{ marginTop: 12 }}>
                    <label>📚 واژه‌های این دیالوگ (اختیاری)</label>
                    {(d.words ?? []).map((w, wi) => (
                      <div
                        key={wi}
                        style={{ display: "flex", gap: 6, marginTop: 6 }}
                      >
                        <input
                          placeholder="واژه انگلیسی"
                          value={w.word}
                          onChange={(e) =>
                            updateWord(selected, di, wi, { word: e.target.value })
                          }
                        />
                        <input
                          placeholder="معنی فارسی"
                          value={w.meaning}
                          onChange={(e) =>
                            updateWord(selected, di, wi, {
                              meaning: e.target.value,
                            })
                          }
                        />
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeWord(selected, di, wi)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ marginTop: 6 }}
                      onClick={() => addWord(selected, di)}
                    >
                      + افزودن واژه
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ذخیره */}
      <div className="card">
        <button className="btn" onClick={handleSave} disabled={saving}>
          {saving
            ? "در حال ذخیره..."
            : fromSubmission || fromTopicSuggestion
            ? "✅ انتشار و اهدای امتیاز"
            : editScene
            ? "💾 ذخیره تغییرات"
            : "💾 ذخیره صحنه"}
        </button>{" "}
        <button
          className="btn btn-ghost"
          onClick={() => {
            if (fromSubmission) onCancelReview?.();
            else if (fromTopicSuggestion) onCancelTopicReview?.();
            else if (editScene) onCancelEdit?.();
            resetForm();
          }}
        >
          {fromSubmission || fromTopicSuggestion
            ? "انصراف از بررسی"
            : editScene
            ? "انصراف"
            : "پاک‌کردن فرم"}
        </button>
      </div>
    </div>
  );
}
