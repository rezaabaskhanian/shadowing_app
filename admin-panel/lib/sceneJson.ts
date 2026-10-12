import type {
  CreateScenePayload,
  DialogueInput,
  Difficulty,
  DisplayType,
  GrammarExampleInput,
  HotspotInput,
  PhraseInput,
  WordInput,
} from "./types";
import { SCENE_CATEGORIES } from "./types";

const DIFFICULTIES: Difficulty[] = ["starter", "beginner", "intermediate", "advanced"];
const DISPLAY_TYPES: DisplayType[] = ["full", "partial", "none"];

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => !!v && typeof v === "object" && !Array.isArray(v);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
const num = (v: unknown, fallback: number) => (typeof v === "number" && isFinite(v) ? v : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const clampPct = (v: number) => Math.min(100, Math.max(0, Math.round(v * 100) / 100));

function words(v: unknown): WordInput[] {
  return arr(v)
    .filter(isObj)
    .map((w) => ({ word: str(w.word), meaning: str(w.meaning) }))
    .filter((w) => w.word);
}

function phrases(v: unknown): PhraseInput[] {
  return arr(v)
    .filter(isObj)
    .map((p) => ({ phrase: str(p.phrase), meaning: str(p.meaning) }))
    .filter((p) => p.phrase);
}

function dialogue(d: Obj, index: number): DialogueInput {
  const display = str(d.display_type) as DisplayType;
  return {
    order: num(d.order, index + 1),
    speaker: str(d.speaker) || "npc",
    original_text: str(d.original_text),
    translation: str(d.translation),
    audio_url: str(d.audio_url),
    display_type: DISPLAY_TYPES.includes(display) ? display : "full",
    partial_hint: str(d.partial_hint),
    wait_duration: num(d.wait_duration, 5),
    words: words(d.words),
    phrases: phrases(d.phrases),
  };
}

/**
 * JSON صحنه (همان شکلِ خروجیِ «تولید با AI» / API ساخت صحنه) را به payload
 * ساخت صحنه تبدیل می‌کند. اگر JSON جای هات‌اسپات‌ها را نداشت، با فاصله روی
 * عکس پخش می‌شوند. صحنه‌ی بدون عکس همیشه پیش‌نویس ذخیره می‌شود.
 * خطا با پیام فارسی برای ادمین.
 */
export function sceneJsonToPayload(raw: unknown): CreateScenePayload {
  if (!isObj(raw)) throw new Error("JSON باید یک آبجکت صحنه باشد");
  const title = str(raw.title);
  if (!title) throw new Error("«title» صحنه خالی است");

  const rawHotspots = arr(raw.hotspots).filter(isObj);
  if (rawHotspots.length === 0) throw new Error(`صحنه‌ی «${title}» هیچ هات‌اسپاتی ندارد`);

  const hotspots: HotspotInput[] = rawHotspots.map((h, hi) => {
    const dialogues = arr(h.dialogues).filter(isObj).map(dialogue);
    const empty = dialogues.findIndex((d) => !d.original_text);
    if (empty !== -1) throw new Error(`در «${str(h.name) || `نقطه ${hi + 1}`}» متن انگلیسی دیالوگ ${empty + 1} خالی است`);
    return {
      name: str(h.name) || `نقطه ${hi + 1}`,
      // بدون جای مشخص: پخشِ یکنواخت در عرض عکس، کمی پایین‌تر از وسط.
      x_position: clampPct(num(h.x_position, ((hi + 1) / (rawHotspots.length + 1)) * 100)),
      y_position: clampPct(num(h.y_position, 55)),
      order: num(h.order, hi + 1),
      dialogues,
    };
  });

  const difficulty = str(raw.difficulty) as Difficulty;
  const category = str(raw.category);
  const image = str(raw.background_image_url);
  const examples: GrammarExampleInput[] = arr(raw.grammar_examples)
    .filter(isObj)
    .map((e) => ({ text: str(e.text), translation: str(e.translation) }))
    .filter((e) => e.text)
    .slice(0, 4);

  return {
    title,
    description: str(raw.description),
    background_image_url: image,
    difficulty: DIFFICULTIES.includes(difficulty) ? difficulty : "beginner",
    hotspots,
    is_locked: raw.is_locked === true,
    is_published: raw.is_published === true && !!image,
    level_position: Math.max(0, Math.floor(num(raw.level_position, 0))),
    category: SCENE_CATEGORIES.some((c) => c.value === category) ? category : "",
    grammar_topic: str(raw.grammar_topic),
    grammar_explanation: str(raw.grammar_explanation),
    grammar_examples: examples,
    grammar_audio_url: str(raw.grammar_audio_url),
  };
}

/** یک فایل/متن JSON: یک صحنه، آرایه‌ای از صحنه‌ها، یا { scenes: [...] }. */
export function parseScenesJson(text: string): unknown[] {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (isObj(data) && Array.isArray(data.scenes)) return data.scenes;
  return [data];
}
