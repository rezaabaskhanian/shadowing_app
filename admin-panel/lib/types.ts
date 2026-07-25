export type Speaker = "customer" | "clerk" | "npc";
export type DisplayType = "full" | "partial" | "none";
export type Difficulty = "beginner" | "intermediate" | "advanced";

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
  // توجه: کلید difficulty در بک‌اند فاصله‌ی انتهایی دارد ("difficulty ")
  status: string;
  order: number;
  hotspots: HotspotResp[] | null;
  created_at: string;
  updated_at: string;
}

export interface LoginResponse {
  user: { id: string; nickname: string; phone: string; role: string };
  tokens: { access_token: string; refresh_token: string };
}
