import { MapPin } from 'lucide-react-native';
import { COLORS } from '../theme/colors';
import type { Dialogue, Hotspot, Scenario } from '../data/scenarios';
import { API_BASE, absUrl } from './config';

// ---- شکل پاسخ بک‌اند ----
interface BackendWord {
  word: string;
  meaning: string;
}
interface BackendDialogue {
  id: string;
  order: number;
  speaker: string;
  original_text: string;
  translation: string;
  audio_url: string;
  display_type: string;
  partial_hint: string;
  wait_duration: number;
  words: BackendWord[] | null;
}
interface BackendHotspot {
  id: string;
  name: string;
  x_position: number;
  y_position: number;
  order: number;
  dialogues: BackendDialogue[] | null;
}
interface BackendScene {
  id: string;
  title: string;
  description: string;
  backgroundImageURL: string;
  status: string;
  order: number;
  hotspots: BackendHotspot[] | null;
  // توجه: کلید difficulty در بک‌اند فاصله‌ی انتهایی دارد
  'difficulty '?: string;
  difficulty?: string;
}

function difficultyToLevel(d?: string): string {
  switch ((d || '').trim()) {
    case 'beginner':
      return 'Beginner';
    case 'intermediate':
      return 'Intermediate';
    case 'advanced':
      return 'Advanced';
    default:
      return 'Beginner';
  }
}

// تبدیل صحنه‌ی بک‌اند به مدل Scenario اپ
function mapScene(s: BackendScene): Scenario {
  const hotspots: Hotspot[] = (s.hotspots || []).map((h) => {
    const dialogues: Dialogue[] = (h.dialogues || []).map((d) => ({
      id: d.id,
      sequence: d.order,
      speaker: d.speaker,
      english_text: d.original_text,
      persian_text: d.translation,
      audio_url: absUrl(d.audio_url),
      duration: d.wait_duration || 3,
      words: (d.words || []).map((w) => ({ word: w.word, meaning: w.meaning })),
    }));
    const first = dialogues[0];
    return {
      id: h.id,
      // بک‌اند مختصات را ۰..۱۰۰ (درصد) ذخیره می‌کند، اپ ۰..۱ می‌خواهد
      x: (h.x_position || 0) / 100,
      y: (h.y_position || 0) / 100,
      speaker: first?.speaker || h.name,
      dialogue: first?.english_text || h.name,
      translation: first?.persian_text || '',
      audioUrl: first?.audio_url || '',
      conversation:
        dialogues.length > 0
          ? { id: h.id, title: h.name, dialogues }
          : undefined,
    };
  });

  return {
    id: s.id,
    title: s.title,
    lesson: s.description || '',
    level: difficultyToLevel(s['difficulty '] ?? s.difficulty),
    progress: 0,
    time: '',
    icon: MapPin,
    color: COLORS.primary,
    imageUri: { uri: absUrl(s.backgroundImageURL) },
    hotspots,
  };
}

// لیست صحنه‌ها (بدون هات‌اسپات - سبک)
export async function fetchScenes(): Promise<Scenario[]> {
  const res = await fetch(`${API_BASE}/v1/scenes`);
  if (!res.ok) throw new Error('failed to fetch scenes');
  const data = (await res.json()) as BackendScene[] | null;
  return (data || []).map(mapScene);
}

// یک صحنه با هات‌اسپات‌ها و دیالوگ‌هایش
export async function fetchScene(id: string): Promise<Scenario> {
  const res = await fetch(`${API_BASE}/v1/scenes/${id}`);
  if (!res.ok) throw new Error('failed to fetch scene');
  const data = (await res.json()) as BackendScene;
  return mapScene(data);
}
