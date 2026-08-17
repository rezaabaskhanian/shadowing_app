export type Speaker = string;
export type DisplayType = "full" | "partial" | "none";
export type Difficulty = "beginner" | "intermediate" | "advanced";

// یک واژه‌ی دیالوگ همراه با معنی
export interface WordInput {
  word: string;
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
}

export interface HotspotInput {
  name: string;
  x_position: number;
  y_position: number;
  order: number;
  dialogues: DialogueInput[];
}

export interface CreateScenePayload {
  title: string;
  description: string;
  background_image_url: string;
  difficulty: Difficulty;
  hotspots: HotspotInput[];
  is_locked: boolean;
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
  is_locked: boolean;
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
  elevenlabs_api_key: SettingItem;
  elevenlabs_voice_id: SettingItem;
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
  created_at: string;
}

// ---------- کاربران و فعالیتشون (صفحه‌ی کاربران ادمین) ----------
export interface AdminUserRow {
  id: string;
  nickname: string;
  phone: string;
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
