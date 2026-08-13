import { Platform } from 'react-native';
import { Banknote, Building2, Car, Coffee, Cross, HeartPulse, Hotel, Plane, ShoppingCart, Utensils } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:8088' : 'http://localhost:8088';
export function formatAudioUrl(path: string): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export interface WordEntry {
  word: string;
  meaning: string;
}

export interface Dialogue {
  id: string;
  sequence: number;
  speaker: string;
  english_text: string;
  persian_text: string;
  audio_url: string;
  duration: number;
  words?: WordEntry[];
}

export interface Conversation {
  id: string;
  title: string;
  dialogues: Dialogue[];
}

export interface Hotspot {
  id: string;
  x: number;
  y: number;
  speaker: string;
  dialogue: string;
  translation: string;
  audioUrl: string;
  conversation?: Conversation;
}

export interface DialogueItem {
  id: string;
  hotspotId: string;
  x: number;
  y: number;
  speaker: string;
  dialogue: string;
  translation: string;
  audioUrl: string;
  words?: WordEntry[];
}

export type ScenarioCategory = 'business' | 'travel' | 'daily';

export interface Scenario {
  id: string;
  title: string;
  lesson: string;
  level: string;
  progress: number;
  time: string;
  icon: any;
  color: string;
  imageUri: any;
  hotspots: Hotspot[];
  description?: string;
  category?: ScenarioCategory;
  sentencesCount?: number;
}

export function expandScenarioToDialogueItems(scenario: Scenario): DialogueItem[] {
  const items: DialogueItem[] = [];
  for (const hotspot of scenario.hotspots) {
    if (hotspot.conversation) {
      for (const d of hotspot.conversation.dialogues) {
        items.push({
          id: d.id,
          hotspotId: hotspot.id,
          x: hotspot.x,
          y: hotspot.y,
          speaker: d.speaker,
          dialogue: d.english_text,
          translation: d.persian_text,
          audioUrl: formatAudioUrl(d.audio_url),
          words: d.words,
        });
      }
    } else {
      items.push({
        id: hotspot.id,
        hotspotId: hotspot.id,
        x: hotspot.x,
        y: hotspot.y,
        speaker: hotspot.speaker,
        dialogue: hotspot.dialogue,
        translation: hotspot.translation,
        audioUrl: formatAudioUrl(hotspot.audioUrl),
      });
    }
  }
  return items;
}

const imgClothes = require('../assets/scenes/clothes_shopping.png');
const imgHotel = require('../assets/scenes/hotel_reception.png');
const imgDriving = require('../assets/scenes/driving_lesson.png');
const imgWeightLoss = require('../assets/scenes/weight_loss.png');

export const SCENARIOS: Scenario[] = [
  {
    id: '770e8400-e29b-41d4-a716-446655440000',
    title: 'Clothes Shopping',
    lesson: 'Lesson 1 of 10',
    level: 'Beginner',
    progress: 0,
    time: '12 min',
    icon: ShoppingCart,
    color: COLORS.primary,
    imageUri: imgClothes,
    description: 'Practice buying clothes, asking about sizes, materials, prices, and restocking.',
    category: 'daily',
    sentencesCount: 10,
    hotspots: [
      {
        id: '770e8400-e29b-41d4-a716-446655440001',
        x: 0.45,
        y: 0.55,
        speaker: 'clerk',
        dialogue: 'Hi, how much is this jacket?',
        translation: 'سلام، این کاپشن چند است؟',
        audioUrl: formatAudioUrl('/uploads/cafe/c1.mp3'),
        conversation: {
          id: 'conv_clothes_1',
          title: 'Price & Material',
          dialogues: [
            {
              id: '770e8400-e29b-41d4-a716-446655440101',
              sequence: 1,
              speaker: 'customer',
              english_text: 'Hi, how much is this jacket?',
              persian_text: 'سلام، این کاپشن چند است؟',
              audio_url: formatAudioUrl('/uploads/cafe/c1.mp3'),
              duration: 3,
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440102',
              sequence: 2,
              speaker: 'clerk',
              english_text: "It's ninety dollars.",
              persian_text: 'نود دلار است.',
              audio_url: formatAudioUrl('/uploads/cafe/c2.mp3'),
              duration: 2,
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440103',
              sequence: 3,
              speaker: 'customer',
              english_text: "Oh, that's too expensive! Do you have any discount?",
              persian_text: 'اوه، خیلی گرونه! تخفیف دارید؟',
              audio_url: formatAudioUrl('/uploads/cafe/c3.mp3'),
              duration: 4,
              words: [{ word: 'expensive', meaning: 'گران' }, { word: 'discount', meaning: 'تخفیف' }],
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440104',
              sequence: 4,
              speaker: 'clerk',
              english_text: 'What size and material is this shirt?',
              persian_text: 'سایز و جنس این پیراهن چیست؟',
              audio_url: formatAudioUrl('/uploads/cafe/c4.mp3'),
              duration: 3,
              words: [{ word: 'size', meaning: 'سایز' }, { word: 'material', meaning: 'جنس، پارچه' }],
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440105',
              sequence: 5,
              speaker: 'clerk',
              english_text: "It's medium size and 100% cotton.",
              persian_text: 'سایز متوسط و ۱۰۰٪ پنبه است.',
              audio_url: formatAudioUrl('/uploads/cafe/c5.mp3'),
              duration: 3,
            },
          ],
        },
      },
      {
        id: '770e8400-e29b-41d4-a716-446655440002',
        x: 0.78,
        y: 0.50,
        speaker: 'clerk',
        dialogue: 'Is it too tight, just right, or too loose on you?',
        translation: 'برات تنگه، اندازه‌ست یا گشاد؟',
        audioUrl: formatAudioUrl('/uploads/cafe/p1.mp3'),
        conversation: {
          id: 'conv_clothes_2',
          title: 'Fitting & Restock',
          dialogues: [
            {
              id: '770e8400-e29b-41d4-a716-446655440201',
              sequence: 1,
              speaker: 'clerk',
              english_text: 'Is it too tight, just right, or too loose on you?',
              persian_text: 'برات تنگه، اندازه‌ست یا گشاد؟',
              audio_url: formatAudioUrl('/uploads/cafe/p1.mp3'),
              duration: 4,
              words: [{ word: 'tight', meaning: 'تنگ' }, { word: 'loose', meaning: 'گشاد' }],
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440202',
              sequence: 2,
              speaker: 'customer',
              english_text: 'It feels a bit tight around the shoulders.',
              persian_text: 'دور شانه‌ها کمی تنگ است.',
              audio_url: formatAudioUrl('/uploads/cafe/p2.mp3'),
              duration: 3,
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440203',
              sequence: 3,
              speaker: 'customer',
              english_text: 'Do you have a large size in stock?',
              persian_text: 'سایز بزرگ‌تر موجود دارید؟',
              audio_url: formatAudioUrl('/uploads/cafe/p3.mp3'),
              duration: 3,
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440204',
              sequence: 4,
              speaker: 'clerk',
              english_text: 'We are currently out of stock for size large.',
              persian_text: 'در حال حاضر سایز بزرگ موجود نیست.',
              audio_url: formatAudioUrl('/uploads/cafe/p4.mp3'),
              duration: 4,
            },
            {
              id: '770e8400-e29b-41d4-a716-446655440205',
              sequence: 5,
              speaker: 'customer',
              english_text: 'When will you restock size large?',
              persian_text: 'کی سایز بزرگ را موجود می‌کنید؟',
              audio_url: formatAudioUrl('/uploads/cafe/c6.mp3'),
              duration: 3,
              words: [{ word: 'restock', meaning: 'موجود کردن مجدد' }],
            },
          ],
        },
      },
    ],
  },
  {
    id: '880e8400-e29b-41d4-a716-446655440000',
    title: 'Hotel Booking & Stay',
    lesson: 'Lesson 1 of 10',
    level: 'Intermediate',
    progress: 0,
    time: '15 min',
    icon: Hotel,
    color: COLORS.orange,
    imageUri: imgHotel,
    description: 'Practice checking in, asking for room views, amenities, and buffet hours.',
    category: 'travel',
    sentencesCount: 10,
    hotspots: [
      {
        id: '880e8400-e29b-41d4-a716-446655440001',
        x: 0.25,
        y: 0.65,
        speaker: 'receptionist',
        dialogue: 'Hello, I had previously reserved a room.',
        translation: 'سلام، من قبلاً اتاق رزرو کرده بودم.',
        audioUrl: formatAudioUrl('/uploads/cafe/c1.mp3'),
        conversation: {
          id: 'conv_hotel_1',
          title: 'Check-in & Pricing',
          dialogues: [
            {
              id: '880e8400-e29b-41d4-a716-446655440101',
              sequence: 1,
              speaker: 'customer',
              english_text: 'Hello, I had previously reserved a room.',
              persian_text: 'سلام، من قبلاً اتاق رزرو کرده بودم.',
              audio_url: formatAudioUrl('/uploads/cafe/c1.mp3'),
              duration: 3,
              words: [{ word: 'reserved', meaning: 'رزرو شده' }, { word: 'previously', meaning: 'قبلاً' }],
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440102',
              sequence: 2,
              speaker: 'receptionist',
              english_text: 'Welcome! Let me check your booking details.',
              persian_text: 'خوش آمدید! اجازه دهید جزئیات رزرو را بررسی کنم.',
              audio_url: formatAudioUrl('/uploads/cafe/c2.mp3'),
              duration: 3,
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440103',
              sequence: 3,
              speaker: 'customer',
              english_text: 'How much is it per night?',
              persian_text: 'شبی چند هست؟',
              audio_url: formatAudioUrl('/uploads/cafe/c3.mp3'),
              duration: 2,
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440104',
              sequence: 4,
              speaker: 'receptionist',
              english_text: 'It is one hundred and twenty dollars per night.',
              persian_text: 'شبی یکصد و بیست دلار است.',
              audio_url: formatAudioUrl('/uploads/cafe/c4.mp3'),
              duration: 3,
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440105',
              sequence: 5,
              speaker: 'customer',
              english_text: 'What amenities does it have?',
              persian_text: 'چه امکاناتی داره؟',
              audio_url: formatAudioUrl('/uploads/cafe/c5.mp3'),
              duration: 2,
              words: [{ word: 'amenities', meaning: 'امکانات، تسهیلات' }],
            },
          ],
        },
      },
      {
        id: '880e8400-e29b-41d4-a716-446655440002',
        x: 0.82,
        y: 0.65,
        speaker: 'receptionist',
        dialogue: 'Do you have a room with a mountain, sea, or forest view?',
        translation: 'اتاق رو به کوه یا دریا یا جنگل دارین؟',
        audioUrl: formatAudioUrl('/uploads/cafe/p1.mp3'),
        conversation: {
          id: 'conv_hotel_2',
          title: 'Views & Buffet',
          dialogues: [
            {
              id: '880e8400-e29b-41d4-a716-446655440201',
              sequence: 1,
              speaker: 'receptionist',
              english_text: 'It has free Wi-Fi, TV, mini-bar, and room service.',
              persian_text: 'دارای وای‌فای رایگان، تلویزیون، مینی‌بار و روم سرویس است.',
              audio_url: formatAudioUrl('/uploads/cafe/p1.mp3'),
              duration: 4,
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440202',
              sequence: 2,
              speaker: 'customer',
              english_text: 'Do you have a room with a mountain, sea, or forest view?',
              persian_text: 'اتاق رو به کوه یا دریا یا جنگل دارین؟',
              audio_url: formatAudioUrl('/uploads/cafe/p2.mp3'),
              duration: 4,
              words: [{ word: 'view', meaning: 'منظره، نما' }, { word: 'mountain', meaning: 'کوه' }, { word: 'sea', meaning: 'دریا' }],
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440203',
              sequence: 3,
              speaker: 'receptionist',
              english_text: 'Yes, we have a sea view room available.',
              persian_text: 'بله، اتاق رو به دریا موجود داریم.',
              audio_url: formatAudioUrl('/uploads/cafe/p3.mp3'),
              duration: 3,
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440204',
              sequence: 4,
              speaker: 'customer',
              english_text: 'Until when is the buffet open?',
              persian_text: 'بوفه تا کی بازه؟',
              audio_url: formatAudioUrl('/uploads/cafe/p4.mp3'),
              duration: 3,
              words: [{ word: 'buffet', meaning: 'بوفه غذا' }],
            },
            {
              id: '880e8400-e29b-41d4-a716-446655440205',
              sequence: 5,
              speaker: 'receptionist',
              english_text: 'The breakfast buffet is open until 10:30 AM.',
              persian_text: 'بوفه صبحانه تا ساعت ۱۰:۳۰ صبح باز است.',
              audio_url: formatAudioUrl('/uploads/cafe/c7.mp3'),
              duration: 3,
            },
          ],
        },
      },
    ],
  },
  {
    id: '990e8400-e29b-41d4-a716-446655440000',
    title: 'Driving Lesson',
    lesson: 'Lesson 1 of 10',
    level: 'Intermediate',
    progress: 0,
    time: '12 min',
    icon: Car,
    color: COLORS.teal,
    imageUri: imgDriving,
    description: 'Practice driving instructions, traffic lights, speed limits, and road signals.',
    category: 'daily',
    sentencesCount: 10,
    hotspots: [
      {
        id: '990e8400-e29b-41d4-a716-446655440001',
        x: 0.25,
        y: 0.70,
        speaker: 'instructor',
        dialogue: "Don't run the red light!",
        translation: 'از چراغ قرمز رد نشو!',
        audioUrl: formatAudioUrl('/uploads/cafe/c1.mp3'),
        conversation: {
          id: 'conv_driving_1',
          title: 'Speed & Signals',
          dialogues: [
            {
              id: '990e8400-e29b-41d4-a716-446655440101',
              sequence: 1,
              speaker: 'instructor',
              english_text: "Don't run the red light!",
              persian_text: 'از چراغ قرمز رد نشو!',
              audio_url: formatAudioUrl('/uploads/cafe/c1.mp3'),
              duration: 2,
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440102',
              sequence: 2,
              speaker: 'student',
              english_text: 'Sorry instructor, I will stop right away.',
              persian_text: 'ببخشید مربی، سریعاً متوقف می‌شوم.',
              audio_url: formatAudioUrl('/uploads/cafe/c2.mp3'),
              duration: 3,
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440103',
              sequence: 3,
              speaker: 'instructor',
              english_text: 'Keep the speed limit!',
              persian_text: 'حد مجاز سرعت را رعایت کن!',
              audio_url: formatAudioUrl('/uploads/cafe/c3.mp3'),
              duration: 2,
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440104',
              sequence: 4,
              speaker: 'instructor',
              english_text: 'Use your turn signal before turning.',
              persian_text: 'راهنما بزن!',
              audio_url: formatAudioUrl('/uploads/cafe/c4.mp3'),
              duration: 3,
              words: [{ word: 'signal', meaning: 'راهنما، اشاره' }, { word: 'turn', meaning: 'پیچیدن' }],
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440105',
              sequence: 5,
              speaker: 'student',
              english_text: 'Got it, turning on indicator now.',
              persian_text: 'متوجه شدم، راهنما زدم.',
              audio_url: formatAudioUrl('/uploads/cafe/c5.mp3'),
              duration: 2,
            },
          ],
        },
      },
      {
        id: '990e8400-e29b-41d4-a716-446655440002',
        x: 0.70,
        y: 0.35,
        speaker: 'instructor',
        dialogue: 'Slow down when you reach a speed bump.',
        translation: 'وقتی به سرعت‌گیر می‌رسی سرعت را کاهش بده.',
        audioUrl: formatAudioUrl('/uploads/cafe/p1.mp3'),
        conversation: {
          id: 'conv_driving_2',
          title: 'Speed Bumps & Honking',
          dialogues: [
            {
              id: '990e8400-e29b-41d4-a716-446655440201',
              sequence: 1,
              speaker: 'instructor',
              english_text: "Don't honk near the hospital!",
              persian_text: 'نزدیک بیمارستان بوق نزن!',
              audio_url: formatAudioUrl('/uploads/cafe/p1.mp3'),
              duration: 3,
              words: [{ word: 'honk', meaning: 'بوق زدن' }, { word: 'hospital', meaning: 'بیمارستان' }],
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440202',
              sequence: 2,
              speaker: 'instructor',
              english_text: 'Slow down when you reach a speed bump.',
              persian_text: 'وقتی به سرعت‌گیر می‌رسی سرعت را کاهش بده.',
              audio_url: formatAudioUrl('/uploads/cafe/p2.mp3'),
              duration: 4,
              words: [{ word: 'speed bump', meaning: 'سرعت‌گیر' }, { word: 'slow down', meaning: 'کاهش سرعت' }],
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440203',
              sequence: 3,
              speaker: 'student',
              english_text: 'Understood, applying brakes gently.',
              persian_text: 'چشم، آروم ترمز می‌گیرم.',
              audio_url: formatAudioUrl('/uploads/cafe/p3.mp3'),
              duration: 3,
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440204',
              sequence: 4,
              speaker: 'instructor',
              english_text: 'Always check your rearview mirror.',
              persian_text: 'همیشه آینه وسط را چک کن.',
              audio_url: formatAudioUrl('/uploads/cafe/p4.mp3'),
              duration: 3,
            },
            {
              id: '990e8400-e29b-41d4-a716-446655440205',
              sequence: 5,
              speaker: 'instructor',
              english_text: 'Very good control and smooth driving!',
              persian_text: 'کنترل بسیار خوب و رانندگی نرم!',
              audio_url: formatAudioUrl('/uploads/cafe/c8.mp3'),
              duration: 3,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'aa0e8400-e29b-41d4-a716-446655440000',
    title: 'Weight Loss Consultation',
    lesson: 'Lesson 1 of 10',
    level: 'Beginner',
    progress: 0,
    time: '12 min',
    icon: HeartPulse,
    color: COLORS.pink,
    imageUri: imgWeightLoss,
    description: 'Practice talking to a nutritionist about dieting, exercise, sweets, and healthy habits.',
    category: 'daily',
    sentencesCount: 10,
    hotspots: [
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440001',
        x: 0.55,
        y: 0.55,
        speaker: 'doctor',
        dialogue: 'Doctor, I want to lose weight.',
        translation: 'می‌خوام وزنم را کم کنم.',
        audioUrl: formatAudioUrl('/uploads/cafe/c1.mp3'),
        conversation: {
          id: 'conv_diet_1',
          title: 'Diet Rules & Fast Food',
          dialogues: [
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440101',
              sequence: 1,
              speaker: 'patient',
              english_text: 'Doctor, I want to lose weight.',
              persian_text: 'می‌خوام وزنم را کم کنم.',
              audio_url: formatAudioUrl('/uploads/cafe/c1.mp3'),
              duration: 2,
              words: [{ word: 'lose weight', meaning: 'کاهش وزن' }],
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440102',
              sequence: 2,
              speaker: 'doctor',
              english_text: "First rule: don't eat fast food.",
              persian_text: 'فست‌فود نخور.',
              audio_url: formatAudioUrl('/uploads/cafe/c2.mp3'),
              duration: 3,
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440103',
              sequence: 3,
              speaker: 'doctor',
              english_text: "Also, don't eat sweets.",
              persian_text: 'شیرینی نخور.',
              audio_url: formatAudioUrl('/uploads/cafe/c3.mp3'),
              duration: 2,
              words: [{ word: 'sweets', meaning: 'شیرینی‌جات' }],
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440104',
              sequence: 4,
              speaker: 'doctor',
              english_text: 'Make sure to exercise regularly.',
              persian_text: 'ورزش کن.',
              audio_url: formatAudioUrl('/uploads/cafe/c4.mp3'),
              duration: 3,
              words: [{ word: 'exercise', meaning: 'ورزش کردن' }, { word: 'regularly', meaning: 'به‌طور منظم' }],
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440105',
              sequence: 5,
              speaker: 'patient',
              english_text: "I can't stop eating sweets, I love them too much!",
              persian_text: 'من نمیتونم شیرینی نخورم، خیلی دوست دارم!',
              audio_url: formatAudioUrl('/uploads/cafe/c5.mp3'),
              duration: 4,
            },
          ],
        },
      },
      {
        id: 'aa0e8400-e29b-41d4-a716-446655440002',
        x: 0.18,
        y: 0.65,
        speaker: 'doctor',
        dialogue: 'If you want to lose weight, you must moderate your sweets intake.',
        translation: 'اگه میخای وزن کم کنی باید رعایت کنی در مصرف شیرینی.',
        audioUrl: formatAudioUrl('/uploads/cafe/p1.mp3'),
        conversation: {
          id: 'conv_diet_2',
          title: 'Moderation & Dark Chocolate',
          dialogues: [
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440201',
              sequence: 1,
              speaker: 'doctor',
              english_text: 'If you want to lose weight, you must moderate your sweets intake.',
              persian_text: 'اگه میخای وزن کم کنی باید رعایت کنی در مصرف شیرینی.',
              audio_url: formatAudioUrl('/uploads/cafe/p1.mp3'),
              duration: 4,
              words: [{ word: 'moderate', meaning: 'رعایت کردن، اعتدال' }, { word: 'intake', meaning: 'مصرف' }],
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440202',
              sequence: 2,
              speaker: 'patient',
              english_text: 'Can I eat dark chocolate instead?',
              persian_text: 'میتونم به جاش شکلات تلخ بخورم؟',
              audio_url: formatAudioUrl('/uploads/cafe/p2.mp3'),
              duration: 3,
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440203',
              sequence: 3,
              speaker: 'doctor',
              english_text: 'Yes, a small piece of dark chocolate is fine.',
              persian_text: 'بله، یک تکه کوچک شکلات تلخ ایرادی ندارد.',
              audio_url: formatAudioUrl('/uploads/cafe/p3.mp3'),
              duration: 3,
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440204',
              sequence: 4,
              speaker: 'doctor',
              english_text: 'Drink plenty of water every day.',
              persian_text: 'هر روز مقدار زیادی آب بنوش.',
              audio_url: formatAudioUrl('/uploads/cafe/p4.mp3'),
              duration: 3,
            },
            {
              id: 'aa0e8400-e29b-41d4-a716-446655440205',
              sequence: 5,
              speaker: 'patient',
              english_text: 'Thank you doctor, I will follow your plan!',
              persian_text: 'ممنونم دکتر، رژیم شما را دنبال خواهم کرد!',
              audio_url: formatAudioUrl('/uploads/cafe/c6.mp3'),
              duration: 3,
            },
          ],
        },
      },
    ],
  },
];

export const CURRENT_SCENARIO = SCENARIOS[0];
