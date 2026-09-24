export type Speaker = string;
export type DisplayType = "full" | "partial" | "none";
export type Difficulty = "beginner" | "intermediate" | "advanced";

// یک واژه‌ی دیالوگ همراه با معنی
export interface WordInput {
  word: string;
  meaning: string;
}

// یک اصطلاح یا عبارت (idiom / phrase) دیالوگ همراه با معنی
export interface PhraseInput {
  phrase: string;
  meaning: string;
}

// ورودی‌ها (برای ساخت صحنه)
export interface DialogueInput {
  order: number;
  speaker: Speaker;
  original_text: string;
  translation: string;
  audio_url: string;
  display_type: DisplayType;
  partial_hint: string;
  wait_duration: number;
  words: WordInput[];
  phrases: PhraseInput[];
}

export interface HotspotInput {
  name: string;
  x_position: number;
  y_position: number;
  order: number;
  dialogues: DialogueInput[];
}

// یک جمله‌ی مثالِ نکته‌ی گرامری (انگلیسی + ترجمه‌ی فارسی)
export interface GrammarExampleInput {
  text: string;
  translation: string;
}

export interface CreateScenePayload {
  title: string;
  description: string;
  background_image_url: string;
  difficulty: Difficulty;
  hotspots: HotspotInput[];
  is_locked: boolean;
  is_published: boolean;
  // جایگاه در مسیرِ سطح خودش (۰ = ساخت: آخر مسیر، ویرایش: بدون تغییر)
  level_position?: number;
  category: string;
  // نکته‌ی گرامریِ اختیاری: موضوع، توضیح فارسی و ۲ تا ۴ مثال
  grammar_topic?: string;
  grammar_explanation?: string;
  grammar_examples?: GrammarExampleInput[];
  grammar_audio_url?: string;
}

// خروجی تولید صحنه با هوش مصنوعی (بدون تصویر/صدا)
export interface GeneratedDialogue {
  order: number;
  speaker: Speaker;
  original_text: string;
  translation: string;
  display_type: DisplayType;
  wait_duration: number;
  words: WordInput[];
}
export interface GeneratedHotspot {
  name: string;
  x_position: number;
  y_position: number;
  order: number;
  dialogues: GeneratedDialogue[];
}
export interface GeneratedScene {
  title: string;
  description: string;
  difficulty: Difficulty;
  image_prompt: string;
  hotspots: GeneratedHotspot[];
  // فقط وقتی موضوع گرامری داده شده باشد؛ مثال‌ها جمله‌های واقعیِ همین دیالوگ‌ها هستند.
  grammar_note?: {
    explanation_fa: string;
    examples: { hotspot_order: number; dialogue_order: number; text?: string; translation?: string }[];
  };
}

// پاسخ‌ها (از بک‌اند)
export interface DialogueResp {
  id: string;
  order: number;
  speaker: string;
  original_text: string;
  translation: string;
  audio_url: string;
  display_type: string;
  partial_hint: string;
  wait_duration: number;
  words?: WordInput[];
  phrases?: PhraseInput[];
}

export interface HotspotResp {
  id: string;
  name: string;
  x_position: number;
  y_position: number;
  order: number;
  dialogues: DialogueResp[];
}

export interface SceneResp {
  id: string;
  title: string;
  description: string;
  backgroundImageURL: string;
  difficulty: string;
  status: string;
  order: number;
  // فقط سمت پنل: جایگاه صحنه در مسیرِ سطح خودش (برای پیش‌پر کردن فرم ویرایش)
  level_position?: number;
  is_locked: boolean;
  category: string;
  grammar_topic?: string;
  grammar_explanation?: string;
  grammar_examples?: GrammarExampleInput[];
  grammar_audio_url?: string;
  hotspots: HotspotResp[] | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: { id: string; nickname: string; phone: string; role: string };
  tokens: { access_token: string; refresh_token: string };
}

// ---------- تنظیمات (کلیدهای API) ----------
export interface SettingItem {
  set: boolean;
  masked: string;
}

export interface SettingsResp {
  ai_provider: string;
  anthropic_api_key: SettingItem;
  claude_model: string;
  gemini_api_key: SettingItem;
  gemini_model: string;
  deepseek_api_key: SettingItem;
  deepseek_model: string;
  openrouter_api_key: SettingItem;
  openrouter_model: string;
  ai_daily_token_limit: string;
  elevenlabs_api_key: SettingItem;
  elevenlabs_voice_id: SettingItem;
  elevenlabs_model_id: string;
  groq_api_key: SettingItem;
  groq_stt_model: string;
  fcm_service_account_json: SettingItem;
}

// ---------- نوتیفیکیشن‌ها ----------
export interface NotificationStatsResp {
  total_users: number;
  daily_reminder_opt_in: number;
  content_notif_opt_in: number;
  fcm_configured: boolean;
}

export interface BroadcastItem {
  id: string;
  title: string;
  body: string;
  sent_count: number;
  created_at: string;
}

// ---------- پیشنهاد صحنه توسط کاربر ----------
export interface SubmissionDialogueLine {
  speaker: string;
  text: string;
}

export interface SceneSubmission {
  id: string;
  user_id: string;
  image_url: string;
  situation_text: string;
  dialogues: SubmissionDialogueLine[] | null;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  points_awarded: number | null;
  scene_id: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
}

// ---------- پیشنهاد موضوع توسط کاربر ----------
export interface TopicSuggestion {
  id: string;
  user_id: string;
  topic_text: string;
  status: "pending" | "approved" | "rejected";
  admin_note: string;
  points_awarded: number | null;
  scene_id: string;
  reviewed_by: string;
  reviewed_at: string;
  created_at: string;
}

// ---------- طرح‌های اشتراک ----------
export interface SubscriptionPlan {
  id: string;
  name: string;
  duration_days: number;
  price_toman: number;
  product_id: string;
  created_at: string;
}

// ---------- طرح‌های تاپ‌آپ توکن (خرید مصرفی) ----------
export interface TokenTopupPlan {
  id: string;
  name: string;
  tokens: number;
  price_toman: number;
  product_id: string;
  created_at: string;
}

export interface DailyRevenue {
  date: string;
  revenue_toman: number;
  purchase_count: number;
}

export interface RevenueStats {
  total_revenue_toman: number;
  total_purchase_count: number;
  period_revenue_toman: number;
  period_purchase_count: number;
  daily: DailyRevenue[];
}

// ---------- هزینه‌ی واقعیِ مصرف AI ----------
export interface DailyAIUsage {
  date: string;
  input_tokens: number;
  output_tokens: number;
}

export interface AIUsageReport {
  total_cost_usd: number;
  period_cost_usd: number;
  period_days: number;
  daily: DailyAIUsage[];
  daily_cost_usd: number[];
}

export interface AIUsageStatus {
  has_active_subscription: boolean;
  used_tokens: number;
  daily_limit: number;
  remaining_tokens: number;
  estimated_cost_usd: number;
}

// ---------- بخش‌های صفحه‌ی معرفی (landing, www.lingoflow.ir) ----------
export interface LandingImage {
  id: string;
  url: string;
}

export interface LandingSection {
  id: string;
  tab_label: string;
  title: string;
  description: string;
  position: number;
  images: LandingImage[];
}

export interface LandingSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url: string;
  google_play_url: string;
  bazaar_url: string;
  cta_title: string;
  cta_subtitle: string;
}

export type LandingHighlightKind = "feature" | "step";

export interface LandingHighlight {
  id: string;
  kind: LandingHighlightKind;
  icon: string;
  title: string;
  description: string;
  position: number;
}

export interface LandingFAQ {
  id: string;
  question: string;
  answer: string;
  position: number;
}

// ---------- کاربران و فعالیتشون (صفحه‌ی کاربران ادمین) ----------
export interface AdminUserRow {
  id: string;
  nickname: string;
  phone: string;
  role: string;
  points: number;
  created_at: string;
  current_streak: number;
  completed_scenes: number;
  last_activity_at: string | null;
  has_active_subscription: boolean;
}

export interface AdminUsersResp {
  users: AdminUserRow[];
  total: number;
  limit: number;
  offset: number;
}

// ---------- پیشنهادات و انتقادات کاربران (درج اپ موبایل) ----------
export interface Feedback {
  id: string;
  user_id: string;
  message: string;
  created_at: string;
  user_nickname: string;
  user_phone: string;
}

// ---------- آیتم‌های تست تعیین سطح (intro/situational/shadow) ----------
export type AssessmentItemKind = "shadow" | "free_speech";
export type AssessmentItemCategory = "intro" | "situational";

export interface AssessmentItem {
  id: string;
  kind: AssessmentItemKind;
  category: AssessmentItemCategory;
  prompt_text: string;
  target_text?: string; // فقط برای kind=shadow
  audio_url?: string; // فقط برای kind=shadow
  difficulty?: Difficulty;
  is_active: boolean;
  created_at: string;
}

export interface AssessmentItemPayload {
  kind: AssessmentItemKind;
  category: AssessmentItemCategory;
  prompt_text: string;
  target_text: string;
  audio_url: string;
  difficulty: Difficulty | "";
  is_active: boolean;
}

// دسته‌بندی‌های ثابت صحنه — باید با scene.Category در بک‌اند
// (internal/domain/learning/scene/category.go) یکی باشند؛ بک‌اند مقدار دیگری نمی‌پذیرد.
export const SCENE_CATEGORIES: { value: string; label: string }[] = [
  { value: "migration", label: "✈️ مهاجرت" },
  { value: "career", label: "💼 کار و شغل" },
  { value: "education", label: "🎓 تحصیل" },
  { value: "daily", label: "🗣️ مکالمه‌ی روزمره" },
  { value: "travel", label: "🌍 سفر" },
  { value: "social", label: "🎬 سرگرمی و اجتماعی" },
];

export function sceneCategoryLabel(value: string): string {
  return SCENE_CATEGORIES.find((c) => c.value === value)?.label || value;
}
