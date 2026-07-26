import { Banknote, Building2, Coffee, Cross, Plane, ShoppingCart, Utensils } from 'lucide-react-native';
import { COLORS } from '../theme/colors';

// export const SCENARIOS = [
//   {
//     id: 'airport',
//     title: 'Airport',
//     lesson: 'Lesson 5 of 8',
//     level: 'Beginner',
//     progress: 65,
//     time: '15 min',
//     icon: Plane,
//     color: COLORS.primary,
//     imageUri:
//       'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'supermarket',
//     title: 'Supermarket',
//     lesson: 'Lesson 3 of 7',
//     level: 'Beginner',
//     progress: 42,
//     time: '12 min',
//     icon: ShoppingCart,
//     color: COLORS.primary,
//     imageUri:
//       'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'coffee',
//     title: 'Coffee Shop',
//     lesson: 'Lesson 2 of 6',
//     level: 'Beginner',
//     progress: 20,
//     time: '10 min',
//     icon: Coffee,
//     color: COLORS.primaryDark,
//     imageUri:
//       'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'hotel',
//     title: 'Hotel',
//     lesson: 'Lesson 1 of 5',
//     level: 'Beginner',
//     progress: 10,
//     time: '15 min',
//     icon: Building2,
//     color: COLORS.orange,
//     imageUri:
//       'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'restaurant',
//     title: 'Restaurant',
//     lesson: 'Lesson 1 of 7',
//     level: 'Beginner',
//     progress: 0,
//     time: '12 min',
//     icon: Utensils,
//     color: COLORS.pink,
//     imageUri:
//       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'hospital',
//     title: 'Hospital',
//     lesson: 'Lesson 1 of 6',
//     level: 'Beginner',
//     progress: 0,
//     time: '15 min',
//     icon: Cross,
//     color: COLORS.info,
//     imageUri:
//       'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'bank',
//     title: 'Bank',
//     lesson: 'Lesson 1 of 5',
//     level: 'Beginner',
//     progress: 0,
//     time: '12 min',
//     icon: Banknote,
//     color: COLORS.success,
//     imageUri:
//       'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?q=80&w=1000&auto=format&fit=crop',
//   },
// ];

// export const CURRENT_SCENARIO = SCENARIOS[1];

// export const CURRENT_SCENE_HOTSPOTS = [
//   {
//     id: 'aisle',
//     x: 0.22,
//     y: 0.58,
//     speaker: 'Clerk',
//     dialogue: 'Good evening. Can I help you find something?',
//     translation: 'عصر بخیر. می‌توانم در پیدا کردن چیزی کمکتان کنم؟',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
//   },
//   {
//     id: 'basket',
//     x: 0.48,
//     y: 0.68,
//     speaker: 'Customer',
//     dialogue: 'Yes, I need some fresh fruit and bread.',
//     translation: 'بله، مقداری میوه تازه و نان می‌خواهم.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
//   },
//   {
//     id: 'checkout',
//     x: 0.76,
//     y: 0.48,
//     speaker: 'Clerk',
//     dialogue: 'Sure. The checkout is right over there.',
//     translation: 'حتما. صندوق همین‌جاست.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
//   },
//   {
//     id: 'door',
//     x: 0.84,
//     y: 0.24,
//     speaker: 'System',
//     dialogue: 'Please keep your receipt for any returns.',
//     translation: 'لطفا رسید خود را برای هرگونه مرجوعی نگه دارید.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
//   },
// ];



// import {
//   Banknote,
//   Building2,
//   Coffee,
//   Cross,
//   Plane,
//   ShoppingCart,
//   Utensils,
// } from 'lucide-react-native';
// import { COLORS } from '../theme/colors';

// export const SCENARIOS = [
//   {
//     id: 'airport',
//     title: 'Airport',
//     lesson: 'Lesson 5 of 8',
//     level: 'Beginner',
//     progress: 65,
//     time: '15 min',
//     icon: Plane,
//     color: COLORS.primary,
//     imageUri:
//       'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'supermarket',
//     title: 'Supermarket',
//     lesson: 'Lesson 3 of 7',
//     level: 'Beginner',
//     progress: 42,
//     time: '12 min',
//     icon: ShoppingCart,
//     color: COLORS.primary,
//     imageUri:
//       'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'coffee',
//     title: 'Coffee Shop',
//     lesson: 'Lesson 2 of 6',
//     level: 'Beginner',
//     progress: 20,
//     time: '10 min',
//     icon: Coffee,
//     color: COLORS.primaryDark,
//     imageUri:
//       'https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'hotel',
//     title: 'Hotel',
//     lesson: 'Lesson 1 of 5',
//     level: 'Beginner',
//     progress: 10,
//     time: '15 min',
//     icon: Building2,
//     color: COLORS.orange,
//     imageUri:
//       'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'restaurant',
//     title: 'Restaurant',
//     lesson: 'Lesson 1 of 7',
//     level: 'Beginner',
//     progress: 0,
//     time: '12 min',
//     icon: Utensils,
//     color: COLORS.pink,
//     imageUri:
//       'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'hospital',
//     title: 'Hospital',
//     lesson: 'Lesson 1 of 6',
//     level: 'Beginner',
//     progress: 0,
//     time: '15 min',
//     icon: Cross,
//     color: COLORS.info,
//     imageUri:
//       'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=1000&auto=format&fit=crop',
//   },
//   {
//     id: 'bank',
//     title: 'Bank',
//     lesson: 'Lesson 1 of 5',
//     level: 'Beginner',
//     progress: 0,
//     time: '12 min',
//     icon: Banknote,
//     color: COLORS.success,
//     imageUri:
//       'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?q=80&w=1000&auto=format&fit=crop',
//   },
// ];

// export const CURRENT_SCENARIO = SCENARIOS[1];

// export const CURRENT_SCENE_HOTSPOTS = [
//   {
//     id: 'aisle',
//     x: 0.22,
//     y: 0.58,
//     speaker: 'Clerk',
//     dialogue: 'Good evening. Can I help you find something?',
//     translation: 'عصر بخیر. می‌توانم در پیدا کردن چیزی کمکتان کنم؟',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
//   },
//   {
//     id: 'basket',
//     x: 0.48,
//     y: 0.68,
//     speaker: 'Customer',
//     dialogue: 'Yes, I need some fresh fruit and bread.',
//     translation: 'بله، مقداری میوه تازه و نان می‌خواهم.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
//   },
//   {
//     id: 'checkout',
//     x: 0.76,
//     y: 0.48,
//     speaker: 'Clerk',
//     dialogue: 'Sure. The checkout is right over there.',
//     translation: 'حتما. صندوق همین‌جاست.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
//   },
//   {
//     id: 'door',
//     x: 0.84,
//     y: 0.24,
//     speaker: 'System',
//     dialogue: 'Please keep your receipt for any returns.',
//     translation: 'لطفا رسید خود را برای هرگونه مرجوعی نگه دارید.',
//     audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
//   },
// ];



// import {
//   Banknote,
//   Building2,
//   Coffee,
//   Cross,
//   Plane,
//   ShoppingCart,
//   Utensils,
// } from 'lucide-react-native';
// import { COLORS } from '../theme/colors';

// interface Hotspot {
//   id: string;
//   x: number;
//   y: number;
//   speaker: string;
//   dialogue: string;
//   translation: string;
//   audioUrl: string;
//   // New optional conversation containing multiple dialogues
//   conversation?: {
//     id: string;
//     title: string;
//     dialogues: Dialogue[];
//   };
// }

// interface Dialogue {
//   id: string;
//   sequence: number;
//   speaker: string;
//   english_text: string;
//   persian_text: string;
//   audio_url: string;
//   duration: number;
// }
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
          audioUrl: d.audio_url,
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
        audioUrl: hotspot.audioUrl,
      });
    }
  }
  return items;
}


const sceneAirport = require('../assets/scenes/scene1.png');
const sceneSupermarket = require('../assets/scenes/sample1.png');
const sceneCoffee = require('../assets/scenes/scene2.png');
const sceneHotel = require('../assets/scenes/sample2.png');
const sceneRestaurant = require('../assets/scenes/scene3.jpg');
const sceneHospital = require('../assets/scenes/scene1_small.jpg');
const sceneBank = require('../assets/scenes/scene2_small.jpg');
export const SCENARIOS: Scenario[] = [
  {
    id: 'airport',
    title: 'Airport',
    lesson: 'Lesson 5 of 8',
    level: 'Beginner',
    progress: 65,
    time: '15 min',
    icon: Plane,
    color: COLORS.primary,
    imageUri: sceneAirport,
    hotspots: [
      {
        id: 'checkin',
        x: 0.25,
        y: 0.45,
        speaker: 'Agent',
        dialogue: 'Good morning! Where are you flying to today?',
        translation: 'صبح بخیر! امروز به کجا پرواز می‌کنید؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'passenger',
        x: 0.55,
        y: 0.55,
        speaker: 'Passenger',
        dialogue: 'I have a reservation to London. Here\'s my passport.',
        translation: 'رزرو لندن دارم. پاسپورتم اینجاست.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'gate',
        x: 0.78,
        y: 0.35,
        speaker: 'Agent',
        dialogue: 'Gate B12, boarding starts in 45 minutes.',
        translation: 'دروازه B12، سوار شدن از ۴۵ دقیقه دیگر شروع می‌شود.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
      {
        id: 'luggage',
        x: 0.40,
        y: 0.72,
        speaker: 'System',
        dialogue: 'Please place your luggage on the scale.',
        translation: 'لطفا چمدان خود را روی ترازو قرار دهید.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
      },
    ],
  },
  {
    id: 'supermarket',
    title: 'Supermarket Shopping',
    lesson: 'Lesson 3 of 7',
    level: 'Beginner',
    progress: 42,
    time: '15 min',
    icon: ShoppingCart,
    color: COLORS.primary,
    imageUri: sceneSupermarket,
    hotspots: [
      {
        id: 'canned_food',
        x: 0.68,
        y: 0.42,
        speaker: 'customer',
        dialogue: 'Excuse me, how much is this can of tuna?',
        translation: 'ببخشید، این کنسرو تن ماهی چند است؟',
        audioUrl: 'https://voca.ro/1ixdmPCkCGOi',
        conversation: {
          id: 'conv_001',
          title: 'Buying Canned Food',
          dialogues: [
            {
              id: 'd1',
              sequence: 1,
              speaker: 'customer',
              english_text: 'Excuse me, how much is this can of tuna?',
              persian_text: 'ببخشید، این کنسرو تن ماهی چند است؟',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 3,
            },
            {
              id: 'd2',
              sequence: 2,
              speaker: 'store_clerk',
              english_text: "It's three dollars and fifty cents.",
              persian_text: 'سه دلار و پنجاه سنت است.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
            {
              id: 'd3',
              sequence: 3,
              speaker: 'customer',
              english_text: 'And how much is that one?',
              persian_text: 'و آن یکی چند است؟',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
            {
              id: 'd4',
              sequence: 4,
              speaker: 'store_clerk',
              english_text: 'That one is five dollars.',
              persian_text: 'آن یکی پنج دلار است.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
            {
              id: 'd5',
              sequence: 5,
              speaker: 'customer',
              english_text: "That's a bit expensive.",
              persian_text: 'کمی گران است.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
            {
              id: 'd6',
              sequence: 6,
              speaker: 'store_clerk',
              english_text: 'This brand is cheaper.',
              persian_text: 'این برند ارزان‌تر است.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
            {
              id: 'd7',
              sequence: 7,
              speaker: 'customer',
              english_text: 'Can I pay by card?',
              persian_text: 'می‌توانم با کارت پرداخت کنم؟',
              audio_url: 'audio/d7.mp3',
              duration: 2,
            },
            {
              id: 'd8',
              sequence: 8,
              speaker: 'store_clerk',
              english_text: 'Yes, card or cash is fine.',
              persian_text: 'بله، کارت یا نقدی فرقی ندارد.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
          ],
        },
      },
      {
        id: 'cashier',
        x: 0.82,
        y: 0.72,
        speaker: 'cashier',
        dialogue: 'Did you find everything you needed?',
        translation: 'همه چیزهایی که لازم داشتید پیدا کردید؟',
        audioUrl: 'https://voca.ro/1ixdmPCkCGOi',
        conversation: {
          id: 'conv_002',
          title: 'Checkout',
          dialogues: [
            {
              id: 'd9',
              sequence: 1,
              speaker: 'cashier',
              english_text: 'Did you find everything you needed?',
              persian_text: 'همه چیزهایی که لازم داشتید پیدا کردید؟',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 3,
            },
            {
              id: 'd10',
              sequence: 2,
              speaker: 'customer',
              english_text: 'Yes, thank you.',
              persian_text: 'بله، ممنون.',
              audio_url: 'https://voca.ro/1ixdmPCkCGOi',
              duration: 2,
            },
          ],
        },
      },
    ],
  },
  {
    id: 'coffee',
    title: 'Coffee Shop',
    lesson: 'Lesson 2 of 6',
    level: 'Beginner',
    progress: 20,
    time: '10 min',
    icon: Coffee,
    color: COLORS.primaryDark,
    imageUri: sceneCoffee,
    hotspots: [
      {
        id: 'counter',
        x: 0.30,
        y: 0.42,
        speaker: 'Barista',
        dialogue: 'Welcome! What can I get for you?',
        translation: 'خوش آمدید! چه سفارش می‌دهید؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'order',
        x: 0.60,
        y: 0.58,
        speaker: 'Customer',
        dialogue: 'Can I have a large latte with oat milk, please?',
        translation: 'می‌شه یک لاته بزرگ با شیر جو بدم؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'pickup',
        x: 0.75,
        y: 0.32,
        speaker: 'Barista',
        dialogue: 'Your latte is ready! Have a great day!',
        translation: 'لاته شما آماده‌ست! روز خوبی داشته باشید!',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
  {
    id: 'hotel',
    title: 'Hotel',
    lesson: 'Lesson 1 of 5',
    level: 'Beginner',
    progress: 10,
    time: '15 min',
    icon: Building2,
    color: COLORS.orange,
    imageUri: sceneHotel,
    hotspots: [
      {
        id: 'reception',
        x: 0.35,
        y: 0.40,
        speaker: 'Receptionist',
        dialogue: 'Good evening. Welcome to the Grand Hotel. Do you have a reservation?',
        translation: 'عصر بخیر. به هتل گراند خوش آمدید. رزرو دارید؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'guest',
        x: 0.65,
        y: 0.55,
        speaker: 'Guest',
        dialogue: 'Yes, I booked a room for two nights under the name Smith.',
        translation: 'بله، یک اتاق برای دو شب به نام اسمیت رزرو کردم.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'key',
        x: 0.50,
        y: 0.30,
        speaker: 'Receptionist',
        dialogue: 'Room 305, elevator is on your right. Enjoy your stay!',
        translation: 'اتاق ۳۰۵، آسانسور سمت راست شماست. اقامت خوشی داشته باشید!',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
  {
    id: 'restaurant',
    title: 'Restaurant',
    lesson: 'Lesson 1 of 7',
    level: 'Beginner',
    progress: 0,
    time: '12 min',
    icon: Utensils,
    color: COLORS.pink,
    imageUri: sceneRestaurant,
    hotspots: [
      {
        id: 'host',
        x: 0.20,
        y: 0.50,
        speaker: 'Host',
        dialogue: 'Good evening! Do you have a reservation?',
        translation: 'عصر بخیر! رزرو دارید؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'diner',
        x: 0.50,
        y: 0.65,
        speaker: 'Diner',
        dialogue: 'No, a table for two, please. By the window if possible.',
        translation: 'نه، یک میز برای دو نفر لطفا. اگه ممکنه کنار پنجره.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'waiter',
        x: 0.80,
        y: 0.40,
        speaker: 'Waiter',
        dialogue: 'Are you ready to order, or would you like a few more minutes?',
        translation: 'آماده سفارش هستید یا چند دقیقه دیگر صبر کنیم؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
  {
    id: 'hospital',
    title: 'Hospital',
    lesson: 'Lesson 1 of 6',
    level: 'Beginner',
    progress: 0,
    time: '15 min',
    icon: Cross,
    color: COLORS.info,
    imageUri: sceneHospital,
    hotspots: [
      {
        id: 'nurse',
        x: 0.30,
        y: 0.45,
        speaker: 'Nurse',
        dialogue: 'Hello, what brings you in today?',
        translation: 'سلام، امروز به چه دلیلی مراجعه کردید؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'patient',
        x: 0.60,
        y: 0.60,
        speaker: 'Patient',
        dialogue: 'I\'ve had a headache for three days and a fever.',
        translation: 'سه روزه سردرد دارم و تب هم دارم.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'doctor',
        x: 0.45,
        y: 0.30,
        speaker: 'Doctor',
        dialogue: 'Let me take a look. We may need some tests done.',
        translation: 'بذارید نگاه کنم. شاید به آزمایش نیاز باشه.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
  {
    id: 'bank',
    title: 'Bank',
    lesson: 'Lesson 1 of 5',
    level: 'Beginner',
    progress: 0,
    time: '12 min',
    icon: Banknote,
    color: COLORS.success,
    imageUri: sceneBank,
    hotspots: [
      {
        id: 'teller',
        x: 0.35,
        y: 0.42,
        speaker: 'Teller',
        dialogue: 'Hello! How can I assist you today?',
        translation: 'سلام! امروز چطور می‌تونم کمکتون کنم؟',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      },
      {
        id: 'customer',
        x: 0.65,
        y: 0.58,
        speaker: 'Customer',
        dialogue: 'I\'d like to open a savings account, please.',
        translation: 'می‌خوام یک حساب پس‌انداز باز کنم.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
      },
      {
        id: 'manager',
        x: 0.50,
        y: 0.28,
        speaker: 'Teller',
        dialogue: 'Sure, I just need your ID and a signed form.',
        translation: 'حتما، فقط کارت شناسایی و فرم امضا شده لازم دارم.',
        audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
      },
    ],
  },
];

export const CURRENT_SCENARIO = SCENARIOS[1];
