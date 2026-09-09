import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Award,
  Bell,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Flame,
  Gift,
  ListChecks,
  Map as MapIcon,
  Mic,
  Shield,
  Ticket,
  Unlock,
} from 'lucide-react-native';

import { COLORS, BORDER_RADIUS, hexToRgba } from '../../theme/colors';
import { FONT_FAMILY } from '../../theme/typography';
import { useLanguage } from '../../data/i18n';

interface FaqItem {
  id: string;
  question: { en: string; fa: string };
  answer: { en: string; fa: string };
}

// هر باکس یه رنگ/آیکن مخصوص خودش داره فقط برای تنوع بصری و راحت‌تر
// اسکن‌کردن لیست — بین دو باکس کنار هم عمداً رنگ تکرار نمی‌شه. رنگ‌های
// طلایی (streak/xp/points) روی موضوعاتی که واقعاً به هم مربوطن تکرار شدن،
// نه رندوم.
const FAQ_ICON: Record<string, { icon: any; color: string }> = {
  'what-is-shadowing': { icon: Mic, color: COLORS.primary },
  'recording-privacy': { icon: Shield, color: COLORS.info },
  'streak-meaning': { icon: Flame, color: COLORS.secondary },
  'what-counts-as-practice': { icon: CheckCircle2, color: COLORS.tertiary },
  'xp-level': { icon: Award, color: COLORS.warningDeep },
  'points-vs-xp': { icon: Gift, color: COLORS.audioMine },
  'redeem-points-subscription': { icon: Ticket, color: COLORS.secondary },
  'curriculum-path': { icon: MapIcon, color: COLORS.primary },
  'free-sample-scenes': { icon: Unlock, color: COLORS.info },
  'comprehension-quiz': { icon: ListChecks, color: COLORS.tertiary },
  'leitner-box': { icon: BookOpen, color: COLORS.info },
  reminders: { icon: Bell, color: COLORS.warningDeep },
};

/**
 * محتوای ثابت سوالات متداول — عمداً داخل خودِ اپ (نه از سرور) چون تعدادش کمه
 * و نیازی به مدیریت جدا نداره.
 *
 * نکته‌ی مهم: این لیست دستی نوشته شده و با رفتار واقعی اپ هماهنگ نگه داشته
 * می‌شود، نه خودکار. هر وقت رفتار یکی از این بخش‌ها عوض شد (مثلاً نحوه‌ی
 * محاسبه‌ی استریک/XP، حذف یا نگه‌داشتن صدای ضبط‌شده، سیستم امتیاز و…)، باید
 * متن مربوطه اینجا هم دستی به‌روزرسانی شود، وگرنه اپ توضیح غلط می‌دهد.
 */
const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'what-is-shadowing',
    question: {
      en: 'What is "shadowing" practice?',
      fa: 'تمرین «سایه‌زنی» (Shadowing) چیست؟',
    },
    answer: {
      en: 'You listen to a native line of dialogue and repeat it right after, imitating pronunciation and rhythm. Record your voice, then compare it word-by-word against the target to see where you scored well or need more practice.',
      fa: 'یک خط دیالوگ را از زبان‌مادری می‌شنوی و بلافاصله بعدش تکرارش می‌کنی — تلفظ و ریتم را تقلید می‌کنی. صدایت ضبط می‌شود و بعد کلمه‌به‌کلمه با متن اصلی مقایسه می‌شود تا ببینی کجاها خوب بودی و کجا نیاز به تمرین بیشتر داری.',
    },
  },
  {
    id: 'recording-privacy',
    question: {
      en: 'Is my recorded voice stored anywhere?',
      fa: 'صدای ضبط‌شده‌ام جایی ذخیره می‌شود؟',
    },
    answer: {
      en: 'The server scores your recording and deletes the file right after — nothing is kept there. The only copy that remains is on your own phone, under "My Recordings", so you can replay it any time.',
      fa: 'سرور صدای ضبط‌شده را فقط برای نمره‌دهی استفاده می‌کند و بلافاصله بعدش پاکش می‌کند — چیزی روی سرور نگه داشته نمی‌شود. تنها نسخه‌ای که می‌ماند همان روی خودِ گوشی توئه، زیر بخش «صداهای من»، که هر وقت خواستی می‌تونی دوباره گوش بدی.',
    },
  },
  {
    id: 'streak-meaning',
    question: {
      en: 'What does the flame/streak number mean?',
      fa: 'عدد کنار شعله (استریک) یعنی چی؟',
    },
    answer: {
      en: 'It counts how many days in a row you\'ve practiced at least once. Practicing today keeps it going; missing a full day resets it back to 1.',
      fa: 'تعداد روزهای متوالی‌ای که حداقل یک تمرین انجام دادی رو نشون می‌ده. با تمرین امروز ادامه پیدا می‌کنه؛ اگه یک روز کامل تمرین نکنی، به ۱ برمی‌گرده.',
    },
  },
  {
    id: 'what-counts-as-practice',
    question: {
      en: 'What exactly counts as "a practice" for the streak?',
      fa: 'دقیقاً چه چیزی «یک تمرین» حساب می‌شه و استریک رو نگه می‌داره؟',
    },
    answer: {
      en: 'Just opening a scene or listening isn\'t enough. Shadowing practice has 4 steps: 1) Listen, 2) Shadow along, 3) Independent Record — record your own voice, 4) Compare & Master — your recording gets scored. The streak updates the moment at least one line gets scored, so you only need to record and reach step 4 for a single line, not finish the whole scene. Completing a Language Habit mission also counts, separately.',
      fa: 'فقط بازکردن صحنه یا گوش‌دادن به دیالوگ کافی نیست. تمرین شدوئینگ ۴ گام داره: ۱) گوش بده، ۲) هم‌زمان تکرار کن، ۳) ضبط مستقل — صدای خودت رو ضبط کن، ۴) مقایسه و تسلط — ضبطت نمره می‌گیرد. استریک دقیقاً همون لحظه‌ای آپدیت می‌شه که حداقل یک جمله نمره بگیره؛ پس لازم نیست کل صحنه رو تموم کنی، فقط کافیه یک جمله رو ضبط کنی و به گام ۴ برسونیش. انجام یک ماموریت «عادت زبانی» هم جدا از این، حساب می‌شه.',
    },
  },
  {
    id: 'xp-level',
    question: {
      en: 'What are XP and Level?',
      fa: 'XP و سطح (Level) چیه؟',
    },
    answer: {
      en: 'XP is experience earned by finishing scenes (all its dialogue lines). Your total XP places you on a rank ladder — Beginner, Diligent, Practiced, Skilled, Expert, Master — separate from how hard a scene is.',
      fa: 'XP امتیاز تجربه‌ست که با کامل‌کردن یک صحنه (همه‌ی خط‌های دیالوگش) به دست می‌آید. مجموع XP تو، سطحت رو روی یه نردبان رتبه‌بندی مشخص می‌کنه — تازه‌کار، کوشا، ورزیده، ماهر، خبره، استاد — که ربطی به سختی خودِ صحنه نداره.',
    },
  },
  {
    id: 'points-vs-xp',
    question: {
      en: 'How are "Points" different from XP?',
      fa: 'تفاوت «امتیاز» (Points) با XP چیه؟',
    },
    answer: {
      en: 'Points are a separate currency, earned only when a scene or topic you submitted yourself gets approved by an admin. They can be redeemed for bonus days on a subscription purchase — they have nothing to do with regular practice.',
      fa: 'امتیاز یه واحد کاملاً جداست که فقط وقتی صحنه یا پیشنهاد موضوعی که خودت ساختی توسط ادمین تایید بشه بهت داده می‌شه. برای گرفتن روز اضافه روی خرید اشتراک قابل استفاده‌ست و ربطی به تمرین معمولی نداره.',
    },
  },
  {
    id: 'redeem-points-subscription',
    question: {
      en: 'How do I use my points on a subscription purchase?',
      fa: 'چطور امتیازم رو موقع خرید اشتراک استفاده کنم؟',
    },
    answer: {
      en: 'On the subscription (Paywall) screen, if you have at least 100 points, a "Use my points" card shows up with a switch. Turn it on before buying: every 100 points gives you 3 bonus days added on top of the plan you buy. It doesn\'t reduce the price you pay — since that\'s fixed and already charged by Cafe Bazaar — it extends how long your subscription lasts instead. Only full 100-point blocks are spent; any leftover stays in your balance for next time.',
      fa: 'توی صفحه‌ی خرید اشتراک (Paywall)، اگه حداقل ۱۰۰ امتیاز داشته باشی، یه کارت «استفاده از امتیازم» با یه سوییچ نشون داده می‌شه. قبل از خرید روشنش کن: هر ۱۰۰ امتیاز، ۳ روز اضافه روی پلنی که می‌خری بهت می‌ده. این کار قیمتی که پرداخت می‌کنی رو کم نمی‌کنه — چون اون از قبل نزد کافه‌بازار ثابت و پرداخت‌شده‌ست — به‌جاش مدت اشتراکت رو بیشتر می‌کنه. فقط بلوک‌های کامل ۱۰۰تایی خرج می‌شن؛ باقیمونده تو موجودیت می‌مونه برای دفعه‌ی بعد.',
    },
  },
  {
    id: 'curriculum-path',
    question: {
      en: 'Why is a scene locked even though I have a subscription?',
      fa: 'چرا یه صحنه قفله در حالی که اشتراک دارم؟',
    },
    answer: {
      en: 'Scenes are arranged in a learning path (see the map icon on the Scenes tab), separately for each level — beginner, intermediate, advanced. A locked scene there isn\'t about subscription — it just means you haven\'t finished the scene right before it in that same level yet. Finish that one first and the next unlocks automatically. Since each level has its own independent path, being stuck on a beginner scene never blocks intermediate or advanced ones — you can jump straight into your level. This is also separate from subscription locks, which show a different message and send you to the paywall.',
      fa: 'صحنه‌ها روی یه مسیر آموزشی چیده شدن (آیکن نقشه توی تب صحنه‌ها رو ببین)، و این مسیر برای هر سطح (مبتدی/متوسط/پیشرفته) جداست. قفل‌بودن یه صحنه اونجا ربطی به اشتراک نداره — فقط یعنی صحنه‌ی درست قبل از اون توی همون سطح رو هنوز تموم نکردی. اون رو تموم کن تا بعدی خودکار باز بشه. چون مسیر هر سطح مستقله، گیرکردن رو یه صحنه‌ی مبتدی هیچ‌وقت صحنه‌های متوسط/پیشرفته رو قفل نمی‌کنه — می‌تونی مستقیم بری سراغ سطح خودت. این هم جدا از قفل اشتراکه که پیام دیگه‌ای نشون می‌ده و می‌بردت به صفحه‌ی خرید.',
    },
  },
  {
    id: 'free-sample-scenes',
    question: {
      en: 'Which scenes can I try without a subscription?',
      fa: 'بدون اشتراک کدوم صحنه‌ها رو می‌تونم امتحان کنم؟',
    },
    answer: {
      en: 'The first scene of each level — beginner, intermediate, advanced — is always free, for every user, regardless of subscription. This is fixed by the app, not something an admin can lock, so you can always sample all three levels before deciding to subscribe.',
      fa: 'اولین صحنه‌ی هر سطح — مبتدی، متوسط، پیشرفته — همیشه برای همه رایگانه، مستقل از اینکه اشتراک داری یا نه. این قانون تو خودِ اپ ثابته و ادمین نمی‌تونه قفلش کنه، پس همیشه می‌تونی از هر سه سطح یه نمونه امتحان کنی قبل از اینکه برای خرید اشتراک تصمیم بگیری.',
    },
  },
  {
    id: 'comprehension-quiz',
    question: {
      en: 'What is the quiz after a scene?',
      fa: 'کوئیز بعد از هر صحنه چیه؟',
    },
    answer: {
      en: 'After finishing all the lines in a scene, you can start a short quiz: you see the Persian translation of a line from that scene and pick the matching English sentence from a few options. It checks listening comprehension, not just pronunciation. Each correct answer adds a small amount of XP to that scene.',
      fa: 'بعد از تموم‌کردن همه‌ی جمله‌های یک صحنه، می‌تونی یه کوئیز کوتاه شروع کنی: ترجمه‌ی فارسیِ یکی از جمله‌های همون صحنه رو می‌بینی و باید جمله‌ی انگلیسیِ درست رو از بین چند گزینه انتخاب کنی. این درک شنیداری رو می‌سنجه، نه فقط تلفظ. هر پاسخ درست کمی XP به همون صحنه اضافه می‌کنه.',
    },
  },
  {
    id: 'leitner-box',
    question: {
      en: 'What is the Leitner box for?',
      fa: 'جعبه‌ی لایتنر برای چیه؟',
    },
    answer: {
      en: 'It\'s a spaced-repetition system for the words you save while practicing. Mark a word "Knew it" and it moves up a level with a longer wait before its next review; mark "Forgot" and it drops back down for a sooner review.',
      fa: 'یک سیستم مرور فاصله‌دار برای واژه‌هاییه که حین تمرین ذخیره می‌کنی. با زدن «بلد بودم» یک سطح بالا می‌ره و مرور بعدیش دیرتر می‌شه؛ با «بلد نبودم» به سطح پایین‌تر برمی‌گرده تا زودتر دوباره مرورش کنی.',
    },
  },
  {
    id: 'reminders',
    question: {
      en: 'How do daily reminders work?',
      fa: 'یادآوری‌های روزانه چطور کار می‌کنن؟',
    },
    answer: {
      en: 'From your profile, you can turn on a study reminder and add one or more times of day — the app will notify you around those times so you don\'t miss your streak.',
      fa: 'از صفحه‌ی پروفایل می‌تونی یادآوری تمرین رو روشن کنی و یک یا چند ساعت دلخواه اضافه کنی — اپ حوالی همون ساعت‌ها بهت نوتیفیکیشن می‌ده تا استریکت نشکنه.',
    },
  },
];

export const HelpFaqScreen = () => {
  const navigation = useNavigation<any>();
  const { t, language } = useLanguage();
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <ArrowLeft color={COLORS.text} size={22} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('helpFaq')}</Text>
        <Text style={styles.sub}>{t('helpFaqSub')}</Text>

        {FAQ_ITEMS.map((item) => {
          const isOpen = openId === item.id;
          const { icon: Icon, color } = FAQ_ICON[item.id] || FAQ_ICON['what-is-shadowing'];
          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.card, isOpen && { borderColor: color, backgroundColor: hexToRgba(color, 0.06) }]}
              activeOpacity={0.85}
              onPress={() => toggle(item.id)}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: hexToRgba(color, 0.12) }]}>
                  <Icon color={color} size={18} />
                </View>
                <Text style={styles.question}>{item.question[language]}</Text>
                <View style={[styles.chevronWrap, isOpen && styles.chevronWrapOpen]}>
                  <ChevronDown color={isOpen ? color : COLORS.muted} size={18} />
                </View>
              </View>
              {isOpen && <Text style={styles.answer}>{item.answer[language]}</Text>}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: 54,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  content: {
    paddingBottom: 32,
  },
  title: {
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bold,
    fontSize: 24,
    marginBottom: 6,
  },
  sub: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 14,
    marginBottom: 24,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  question: {
    flex: 1,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.semiBold,
    fontSize: 14,
  },
  chevronWrap: {
    transform: [{ rotate: '0deg' }],
  },
  chevronWrapOpen: {
    transform: [{ rotate: '180deg' }],
  },
  answer: {
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.regular,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});
