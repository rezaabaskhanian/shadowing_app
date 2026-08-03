import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'fa';

interface Translations {
  [key: string]: {
    en: string;
    fa: string;
  };
}

export const translations: Translations = {
  // Navigation
  home: { en: 'Home', fa: 'خانه' },
  leitner: { en: 'Leitner', fa: 'لایتنر' },
  shadowing: { en: 'Shadowing', fa: 'شدو' },
  progress: { en: 'Progress', fa: 'پیشرفت' },
  profile: { en: 'You', fa: 'حساب من' },
  
  // Home Screen
  goodEvening: { en: 'Good evening, Maya', fa: 'عصر بخیر، مایا' },
  readyToStepIn: { en: 'Ready to step in?', fa: 'آماده‌ای شروع کنیم؟' },
  todaysShadowing: { en: 'Today\'s shadowing', fa: 'سایه‌زنی امروز' },
  repsCount: { en: 'reps', fa: 'تکرار' },
  fluency: { en: 'Fluency', fa: 'روانی کلام' },
  continueStory: { en: 'CONTINUE STORY', fa: 'ادامه داستان' },
  worlds: { en: 'WORLDS', fa: 'دنیای مکالمات' },
  sentences: { en: 'sentences', fa: 'جمله' },
  min: { en: 'min', fa: 'دقیقه' },
  
  // Leitner & Words
  leitnerBoxTitle: { en: 'Leitner Box', fa: 'جعبه‌ی لایتنر' },
  leitnerSubtitle: {
    en: 'Promote words you know to Level up & delay review; demote forgotten words back to Level 1.',
    fa: 'با «بلد بودم» سطح بالا می‌رود و مرور بعدی دیرتر می‌شود؛ با «بلد نبودم» به سطح ۱ برمی‌گردد.'
  },
  leitnerEmptyTitle: { en: 'No words added yet', fa: 'هنوز واژه‌ای اضافه نکرده‌ای' },
  leitnerEmptyText: {
    en: 'Tap "Words" inside any dialogue line to add new vocabulary to your Leitner box.',
    fa: 'از داخل هر دیالوگ روی دکمه‌ی «واژه‌ها» بزن و واژه‌های جدید را به جعبه اضافه کن.'
  },
  leitnerNoDueTitle: { en: 'No reviews due today! 🎉', fa: 'امروز واژه‌ای برای مرور نداری! 🎉' },
  leitnerNoDueText: {
    en: 'Great job! You completed all reviews for today. Check "All" to browse your collection.',
    fa: 'عالی بود! همه‌ی واژه‌های امروز را مرور کردی. از تب «همه» می‌توانی بقیه را ببینی.'
  },
  showMeaning: { en: 'Show Meaning', fa: 'نمایش معنی' },
  level: { en: 'Level', fa: 'سطح' },
  knewIt: { en: 'Knew it', fa: 'بلد بودم' },
  forgotIt: { en: 'Forgot', fa: 'بلد نبودم' },
  wordsDue: { en: 'due for review', fa: 'آماده مرور' },
  wordsSaved: { en: 'words saved', fa: 'واژه ثبت‌شده' },
  wordsUnit: { en: 'words', fa: 'واژه' },
  today: { en: 'Today', fa: 'امروز' },
  all: { en: 'All', fa: 'همه' },
  
  // Scenes Screen
  chooseScenarioTitle: { en: 'Choose Your Scenario', fa: 'سناریوی خود را انتخاب کنید' },
  chooseScenarioSub: { en: 'Practice natural conversations in real places.', fa: 'مکالمات طبیعی را در محیط‌های واقعی تمرین کنید.' },

  // Progress Screen
  greatJobTitle: { en: 'Great Job!', fa: 'عالی بود!' },
  greatJobSub: { en: 'You did amazing on today\'s practice.', fa: 'عملکرد فوق‌العاده‌ای در تمرین امروز داشتید.' },
  overallScore: { en: 'Overall Score', fa: 'نمره کل' },
  pronunciation: { en: 'Pronunciation', fa: 'تلفظ' },
  compareAudio: { en: 'Compare Audio', fa: 'مقایسه صدا' },

  // Profile Screen
  profileTitle: { en: 'Profile', fa: 'حساب کاربری' },
  profileSub: { en: 'Manage your account and preferences.', fa: 'مدیریت حساب و تنظیمات' },
  learnerLevel: { en: 'Level A2 Learner', fa: 'زبان‌آموز سطح A2' },
  appLanguage: { en: 'App Language', fa: 'زبان برنامه' },
  
  // Scene Intro / Preview
  hotspots: { en: 'Hotspots', fa: 'موقعیت' },
  sentencesCount: { en: 'Sentences', fa: 'جملات' },
  minutesCount: { en: 'Minutes', fa: 'دقیقه' },
  conversationsInScene: { en: 'CONVERSATIONS IN THIS SCENE', fa: 'مکالمات این صحنه' },
  sceneRuleTip: {
    en: 'Every line is practised 7 times across Listen → Shadow → Compare → Free Shadow.',
    fa: 'هر جمله ۷ بار در مراحل شنیدن → سایه‌زنی → مقایسه → سایه‌زنی آزاد تمرین می‌شود.'
  },
  enterScene: { en: 'Enter the scene', fa: 'ورود به صحنه' },
  
  // Player Screen
  shadowThisLine: { en: 'Shadow this line', fa: 'این جمله را تکرار کن' },
  listenStep: { en: 'Step 1: Listen', fa: 'گام ۱: گوش بده' },
  shadowStep: { en: 'Step 2: Shadow', fa: 'گام ۲: همزمان تکرار کن' },
  recordStep: { en: 'Step 3: Independent Record', fa: 'گام ۳: ضبط مستقل' },
  compareStep: { en: 'Step 4: Compare & Master', fa: 'گام ۴: مقایسه و تسلط' },
  autoPlay: { en: 'Auto', fa: 'خودکار' },
  
  // Auth Screen
  welcomeBack: { en: 'Log in to ShadowTalk', fa: 'ورود به شادوتالک' },
  loginSub: { en: 'Enter your credentials to continue', fa: 'اطلاعات خود را برای ورود وارد کنید' },
  emailOrPhone: { en: 'Email or Phone', fa: 'ایمیل یا شماره موبایل' },
  password: { en: 'Password', fa: 'رمز عبور' },
  forgotPassword: { en: 'Forgot Password?', fa: 'رمز عبور را فراموش کرده‌اید؟' },
  login: { en: 'Log In', fa: 'ورود' },
  sendOtp: { en: 'Send SMS Code', fa: 'ارسال کد پیامکی' },
  enterOtp: { en: 'Enter 4-Digit Code', fa: 'کد ۴ رقمی را وارد کنید' },
  verifyAndLogin: { en: 'Verify & Sign In', fa: 'تأیید و ورود' },
  dontHaveAccount: { en: 'Don\'t have an account?', fa: 'حساب کاربری ندارید؟' },
  alreadyHaveAccount: { en: 'Already have an account?', fa: 'حساب کاربری دارید؟' },
  signUp: { en: 'Sign Up', fa: 'ثبت‌نام' },
  signUpOtp: { en: 'Sign Up with Phone (OTP)', fa: 'ثبت‌نام با شماره موبایل (کد پیامکی)' },
  phoneNumber: { en: 'Phone Number (e.g. 0912...)', fa: 'شماره موبایل (مثلاً ۰۹۱۲...)' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][language] || translations[key].en;
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
