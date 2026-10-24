import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

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
  greetingMorning: { en: 'Good morning', fa: 'صبح بخیر' },
  greetingAfternoon: { en: 'Good afternoon', fa: 'ظهر بخیر' },
  greetingEvening: { en: 'Good evening', fa: 'عصر بخیر' },
  greetingNight: { en: 'Good night', fa: 'شب بخیر' },
  readyToStepIn: { en: 'Ready to step in?', fa: 'آماده‌ای شروع کنیم؟' },
  todaysShadowing: { en: 'Today\'s shadowing', fa: 'سایه‌زنی امروز' },
  repsCount: { en: 'reps', fa: 'تکرار' },
  fluency: { en: 'Fluency', fa: 'روانی کلام' },
  continueStory: { en: 'CONTINUE STORY', fa: 'ادامه داستان' },
  worlds: { en: 'WORLDS', fa: 'دنیای مکالمات' },
  viewFullPath: { en: 'View full path', fa: 'مسیر کامل' },
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
  tapToReveal: { en: 'Tap card to reveal meaning', fa: 'برای دیدن معنی، کارت را لمس کن' },
  leitnerDoneTitle: { en: 'Review complete! 🎉', fa: 'مرور تمام شد! 🎉' },
  leitnerDoneText: {
    en: 'You went through all the cards in this list.',
    fa: 'همه‌ی کارت‌های این لیست را مرور کردی.',
  },
  reviewAgain: { en: 'Review Again', fa: 'مرور دوباره' },
  removeWord: { en: 'Remove from box', fa: 'حذف از جعبه' },
  level: { en: 'Level', fa: 'سطح' },
  levelStarter: { en: 'First Steps', fa: 'قدم اول' },
  levelBeginner: { en: 'Beginner', fa: 'مبتدی' },
  levelIntermediate: { en: 'Intermediate', fa: 'متوسط' },
  levelAdvanced: { en: 'Advanced', fa: 'پیشرفته' },
  levelProficient: { en: 'Proficient', fa: 'حرفه‌ای' },
  knewIt: { en: 'Knew it', fa: 'بلد بودم' },
  leitnerFeedbackKnew: { en: 'Nice! 🎉', fa: 'آفرین! 🎉' },
  leitnerFeedbackKnewSub: { en: '“{word}” moved up to level {level}', fa: '«{word}» رفت سطح {level}' },
  leitnerFeedbackForgot: { en: 'No worries!', fa: 'اشکالی نداره!' },
  leitnerFeedbackForgotSub: { en: '“{word}” will come back sooner', fa: '«{word}» زودتر دوباره میاد' },
  forgotIt: { en: 'Forgot', fa: 'بلد نبودم' },
  wordsDue: { en: 'due for review', fa: 'آماده مرور' },
  wordsSaved: { en: 'words saved', fa: 'واژه ثبت‌شده' },
  wordsUnit: { en: 'words', fa: 'واژه' },
  today: { en: 'Today', fa: 'امروز' },
  all: { en: 'All', fa: 'همه' },
  
  // Scenes Screen
  chooseScenarioTitle: { en: 'Choose Your Scenario', fa: 'سناریوی خود را انتخاب کنید' },
  chooseScenarioSub: { en: 'Practice natural conversations in real places.', fa: 'مکالمات طبیعی را در محیط‌های واقعی تمرین کنید.' },
  categoryMigration: { en: '✈️ Migration', fa: '✈️ مهاجرت' },
  categoryCareer: { en: '💼 Career', fa: '💼 کار و شغل' },
  categoryEducation: { en: '🎓 Education', fa: '🎓 تحصیل' },
  categoryDaily: { en: '🗣️ Daily Conversation', fa: '🗣️ مکالمه‌ی روزمره' },
  categoryTravel: { en: '🌍 Travel', fa: '🌍 سفر' },
  categorySocial: { en: '🎬 Entertainment & Social', fa: '🎬 سرگرمی و اجتماعی' },
  noScenariosMatch: { en: 'No scenarios match your filters.', fa: 'سناریویی با این فیلترها پیدا نشد.' },
  searchScenesPlaceholder: { en: 'Search scenarios…', fa: 'جست‌وجوی سناریوها…' },

  // Onboarding Walkthrough (first app open only)
  onboardingSkip: { en: 'Skip', fa: 'رد کردن' },
  onboardingNext: { en: 'Next', fa: 'بعدی' },
  onboardingGetStarted: { en: "Let's go", fa: 'بزن بریم' },
  onboardingSlide1Title: { en: 'See it. Hear it.', fa: 'ببین. بشنو.' },
  onboardingSlide1Sub: {
    en: 'Step into real situations — a cafe, a hotel, an interview — and hear how native speakers actually talk.',
    fa: 'وارد موقعیت‌های واقعی شو — کافه، هتل، مصاحبه — و بشنو که یک انگلیسی‌زبان بومی واقعاً چطور صحبت می‌کنه.',
  },
  onboardingSlide2Title: { en: 'Shadow it. Record it.', fa: 'تقلید کن. ضبط کن.' },
  onboardingSlide2Sub: {
    en: 'Repeat right along with the speaker, then record your own voice and compare.',
    fa: 'همزمان با گوینده تکرار کن، بعد صدای خودت رو ضبط کن و با اصلش مقایسه کن.',
  },
  onboardingSlide3Title: { en: 'Get feedback. Improve.', fa: 'بازخورد بگیر. پیشرفت کن.' },
  onboardingSlide3Sub: {
    en: "AI checks your pronunciation and fluency and tells you exactly what to fix. Retry until it clicks.",
    fa: 'هوش‌مصنوعی تلفظ و روانی گفتارت رو می‌سنجه و دقیق می‌گه چی رو اصلاح کنی. دوباره امتحان کن تا جا بیفته.',
  },

  // Progress Screen
  greatJobTitle: { en: 'Great Job!', fa: 'عالی بود!' },
  greatJobSub: { en: 'You did amazing on today\'s practice.', fa: 'عملکرد فوق‌العاده‌ای در تمرین امروز داشتید.' },
  goodJobTitle: { en: 'Good job!', fa: 'خوب بود!' },
  goodJobSub: { en: 'A solid practice — keep going.', fa: 'تمرین خوبی بود؛ با تکرار بهتر هم می‌شه.' },
  needsPracticeTitle: { en: 'Keep practicing', fa: 'نیاز به تمرین بیشتر' },
  needsPracticeSub: { en: 'Try this session again to improve.', fa: 'همین تمرین رو دوباره امتحان کن تا جا بیفته.' },
  overallScore: { en: 'Overall Score', fa: 'نمره کل' },
  pronunciation: { en: 'Clarity', fa: 'وضوح' },
  vocabulary: { en: 'Vocabulary', fa: 'دایره واژگان' },
  grammar: { en: 'Grammar', fa: 'گرامر' },
  listening: { en: 'Listening', fa: 'شنیداری' },
  weeklyActivity: { en: 'Weekly Activity', fa: 'فعالیت هفتگی' },
  weeklyActivitySub: { en: 'Minutes practiced per day', fa: 'دقیقه‌های تمرین در هر روز' },
  progressTrend: { en: 'Progress Over Time', fa: 'پیشرفت در طول زمان' },
  progressTrendSub: { en: 'Your average speaking score, week by week', fa: 'میانگین نمره‌ی گفتاری شما، هفته به هفته' },
  progressTrendEmpty: {
    en: 'Practice a few sessions to start seeing your trend here.',
    fa: 'چند تمرین انجام بده تا روند پیشرفتت اینجا نمایش داده بشه.',
  },
  progressTrendWeekLabel: { en: 'Wk', fa: 'هفته' },
  skillBreakdown: { en: 'Skill Breakdown', fa: 'تفکیک مهارت‌ها' },
  achievementsTitle: { en: 'Achievements', fa: 'دستاوردها' },
  achievementsEmpty: {
    en: "No achievements yet — keep practicing to unlock your first one!",
    fa: 'هنوز دستاوردی نداری — به تمرین ادامه بده تا اولینش رو باز کنی!',
  },
  streakInfoBody: {
    en: 'Practice at least once a day to keep this number growing. Miss a full day and your streak resets — unless you use a freeze to save it.',
    fa: 'هر روز حداقل یک تمرین انجام بده تا این عدد بالا برود. اگر یک روز کامل تمرین نکنی، استریک صفر می‌شود — مگر با «فریز» نجاتش بدهی.',
  },
  close: { en: 'Close', fa: 'بستن' },
  statsStreakLabel: { en: 'Day streak', fa: 'روز متوالی' },
  statsLevelLabel: { en: 'Level', fa: 'سطح' },
  statsXPLabel: { en: 'XP', fa: 'XP' },
  xpExplain: {
    en: 'You get 5 XP for each dialogue line you record for the first time without showing its text, plus 50 XP for fully completing a scene. If you tap "Show me the text" while recording, that line gives no XP (record it again without the text later to earn it). Quizzes and your pronunciation score don\'t change XP. Your total XP sets your level.',
    fa: 'برای هر جمله‌ای که بار اول بدون نمایش متن ضبطش کنی ۵ XP می‌گیری، و با تمام‌کردن کامل یک صحنه ۵۰ XP. اگه موقع ضبط «متن را نشانم بده» رو بزنی، اون جمله XP نمی‌ده (بعداً بدون دیدن متن دوباره ضبطش کنی، XPش رو می‌گیری). کوییز و نمره‌ی تلفظ روی XP اثری ندارن. مجموع XP سطح تو را تعیین می‌کند.',
  },

  streakReminderTitle: { en: 'Streak reminder', fa: 'یادآوری استریک' },
  streakReminderSub: {
    en: "If you haven't practiced today, we'll send you a reminder so your streak doesn't break.",
    fa: 'اگه امروز هنوز تمرین نکرده باشی، بهت یادآوری می‌فرستیم تا استریکت نشکنه.',
  },
  vocabReminderTitle: { en: 'Vocabulary reminder', fa: 'یادآوری واژگان' },
  vocabReminderSub: {
    en: "When a word in your Leitner box is due for review, we'll send you a reminder.",
    fa: 'وقتی کلمه‌ای تو جعبه‌ی لایتنرت سررسید مرور بشه، بهت یادآوری می‌فرستیم.',
  },
  weeklyDigestTitle: { en: 'Weekly report', fa: 'گزارش هفتگی' },
  weeklyDigestSub: {
    en: 'A weekly summary of your speaking progress and weakest skill — only when you actually practiced.',
    fa: 'خلاصه‌ی هفتگیِ پیشرفت گفتاری‌ات و ضعیف‌ترین مهارتت — فقط وقتی واقعاً تمرین کرده باشی.',
  },
  learningGoalTitle: { en: 'Learning goal', fa: 'هدف یادگیری' },
  learningGoalSub: {
    en: "Optional — helps us lean today's mission toward scenes that fit your goal.",
    fa: 'اختیاری — کمک می‌کنه Today’s Mission بیشتر سمت صحنه‌های مرتبط با هدفت بره.',
  },
  learningGoalNone: { en: 'None', fa: 'هیچ‌کدام' },
  learningGoalMigration: { en: 'Migration', fa: 'مهاجرت' },
  learningGoalTravel: { en: 'Travel', fa: 'سفر' },
  learningGoalWork: { en: 'Work', fa: 'کار' },
  learningGoalDailyLife: { en: 'Daily Life', fa: 'زندگی روزمره' },
  learningGoalStudy: { en: 'Study', fa: 'تحصیل' },

  // Profile Screen
  profileTitle: { en: 'Profile', fa: 'حساب کاربری' },
  profileSub: { en: 'Manage your account and preferences.', fa: 'مدیریت حساب و تنظیمات' },
  learnerLevel: { en: 'Level A2 Learner', fa: 'زبان‌آموز سطح A2' },
  appLanguage: { en: 'App Language', fa: 'زبان برنامه' },
  helpFaq: { en: 'Help & FAQ', fa: 'راهنما و سوالات متداول' },
  helpFaqSub: {
    en: 'Answers to common questions about practice, streaks, XP and points.',
    fa: 'جواب سوالات پرتکرار درباره‌ی تمرین، استریک، XP و امتیاز.',
  },
  logout: { en: 'Log Out', fa: 'خروج از حساب کاربری' },

  // Submit Scene
  submitSceneTitle: { en: 'Suggest a Scene', fa: 'پیشنهاد یک صحنه' },
  submitSceneSub: {
    en: 'Suggest a situation and dialogue — our team will review it, complete the details, and publish it. You earn points if it gets approved.',
    fa: 'یک موقعیت و دیالوگ پیشنهاد بده — تیم ما بررسی، تکمیل و منتشرش می‌کند. اگر تایید شود امتیاز می‌گیری.',
  },
  submitScenePhoto: { en: 'Photo (optional)', fa: 'عکس (اختیاری)' },
  submitScenePhotoAdd: { en: 'Add Photo', fa: 'افزودن عکس' },
  submitScenePhotoRemove: { en: 'Remove Photo', fa: 'حذف عکس' },
  submitSceneSituation: { en: 'Describe the situation', fa: 'موقعیت را توضیح بده' },
  submitSceneSituationPlaceholder: {
    en: 'e.g. Ordering coffee at a busy cafe...',
    fa: 'مثلاً: سفارش قهوه در یک کافه شلوغ...',
  },
  submitSceneDialogues: { en: 'Dialogue lines', fa: 'خط‌های دیالوگ' },
  submitSceneSpeaker: { en: 'Speaker (optional)', fa: 'گوینده (اختیاری)' },
  submitSceneLine: { en: 'What they say', fa: 'چی میگه' },
  submitSceneAddLine: { en: '+ Add line', fa: '+ افزودن خط' },
  submitSceneSubmit: { en: 'Submit for Review', fa: 'ارسال برای بررسی' },
  submitSceneSuccess: {
    en: 'Thanks! Your suggestion was submitted for review.',
    fa: 'ممنون! پیشنهادت برای بررسی ارسال شد.',
  },
  submitSceneFillFields: {
    en: 'Please describe the situation and add at least one dialogue line',
    fa: 'لطفاً موقعیت را توضیح بده و حداقل یک خط دیالوگ اضافه کن',
  },
  mySubmissionsTitle: { en: 'My Suggestions', fa: 'پیشنهادهای من' },
  mySubmissionsEmpty: { en: 'You haven\'t suggested a scene yet.', fa: 'هنوز صحنه‌ای پیشنهاد نداده‌ای.' },
  mySubmissionsCta: { en: '+ Suggest a Scene', fa: '+ پیشنهاد صحنه جدید' },
  statusPending: { en: 'Pending review', fa: 'در انتظار بررسی' },
  statusApproved: { en: 'Approved', fa: 'تایید شد' },
  statusRejected: { en: 'Rejected', fa: 'رد شد' },
  pointsEarned: { en: 'points earned', fa: 'امتیاز گرفتی' },
  myPoints: { en: 'My Points', fa: 'امتیازهای من' },
  myPointsSub: {
    en: 'Every 100 points = 3 extra days on a subscription purchase',
    fa: 'هر ۱۰۰ امتیاز = ۳ روز اضافه روی خرید اشتراک',
  },
  viewMySubmissions: { en: 'My Suggestions', fa: 'پیشنهادهای من' },
  
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
  sceneAudioPreparing: { en: 'Preparing audio… {done}/{total}', fa: 'آماده کردن صدا… {done} از {total}' },
  sceneAudioFailed: { en: '{n} sentence audio could not download; it will stream.', fa: 'صدای {n} جمله دانلود نشد؛ هنگام پخش از اینترنت می‌آید.' },
  sceneAudioRetry: { en: 'Try again', fa: 'دوباره' },
  fourStepMethodTitle: { en: 'The 4-Step Method', fa: 'روش ۴ مرحله‌ای' },
  dialoguePreview: { en: 'Dialogue Preview', fa: 'پیش‌نمایش گفتگو' },
  moreSentencesSuffix: { en: 'more sentences', fa: 'جمله‌ی دیگر' },
  
  // Player Screen
  shadowThisLine: { en: 'Shadow this line', fa: 'این جمله را تکرار کن' },
  listenStep: { en: 'Step 1: Listen', fa: 'گام ۱: گوش بده' },
  shadowStep: { en: 'Step 2: Shadow', fa: 'گام ۲: همزمان تکرار کن' },
  recordStep: { en: 'Step 3: Independent Record', fa: 'گام ۳: ضبط مستقل' },
  compareStep: { en: 'Step 4: Compare & Master', fa: 'گام ۴: مقایسه و تسلط' },
  autoPlay: { en: 'Auto', fa: 'خودکار' },
  tabListen: { en: 'Listen', fa: 'گوش دادن' },
  tabShadow: { en: 'Shadow', fa: 'سایه زدن' },
  tabRecord: { en: 'Record', fa: 'ضبط کردن' },
  tabCompare: { en: 'Compare', fa: 'مقایسه' },
  repeatAlongBanner: { en: 'Repeat along with the audio', fa: 'همزمان با صدا تکرار کنید' },
  autoRepeatHint: { en: 'auto — skip anytime', fa: 'خودکار — هر وقت خواستی رد کن' },
  unlimitedRepeatHint: { en: 'loops until you continue', fa: 'تا وقتی خودت ادامه ندهی تکرار می‌شود' },
  practiceSettingsTitle: { en: 'Practice', fa: 'تمرین' },
  savingRecording: { en: 'Saving your recording…', fa: 'در حال ذخیره‌ی صدای شما…' },
  recordingSaved: { en: 'Saved to your phone', fa: 'روی گوشی ذخیره شد' },
  recordingSaveFailed: { en: "Couldn't save the recording", fa: 'ذخیره‌ی صدا انجام نشد' },
  myRecordings: { en: 'My Recordings', fa: 'ضبط‌های من' },
  myRecordingsSub: {
    en: 'Your saved voice recordings — listen back anytime',
    fa: 'صداهای ضبط‌شده‌ات روی گوشی — هر وقت خواستی دوباره گوش بده',
  },
  noRecordingsYet: {
    en: 'No recordings yet. Record yourself in a scene to see them here.',
    fa: 'هنوز چیزی ضبط نکرده‌ای. در مرحله‌ی ضبطِ یک صحنه صدایت را ضبط کن.',
  },
  deleteRecording: { en: 'Delete recording?', fa: 'این ضبط حذف شود؟' },
  cancel: { en: 'Cancel', fa: 'انصراف' },
  delete: { en: 'Delete', fa: 'حذف' },
  lineLabel: { en: 'line', fa: 'جمله' },
  repeatsPerStepLabel: { en: 'Repeats per step', fa: 'تعداد تکرار هر مرحله' },
  repeatsPerStepSub: {
    en: 'How many times Listen and Shadow loop before moving on. ∞ waits for you.',
    fa: 'مرحله‌های گوش دادن و سایه زدن چند بار تکرار شوند و بعد خودکار جلو بروند. ∞ یعنی منتظر خودت می‌ماند.',
  },
  selfPacedHint: { en: 'Take your time — continue when ready', fa: 'هر چقدر خواستی تمرین کن' },
  textInBubble: { en: 'Bubble', fa: 'حباب' },
  textInCard: { en: 'Card', fa: 'کارت' },
  highlightColorLabel: { en: 'Highlight color', fa: 'رنگ هایلایت' },
  highlightColorSub: {
    en: 'Color used to highlight the word being spoken.',
    fa: 'رنگی که برای هایلایت کلمه‌ی در حال گفتن استفاده می‌شود.',
  },
  recordingRequiredTitle: { en: 'Recording needed', fa: 'ضبط لازم است' },
  recordingRequiredMessage: {
    en: 'Record yourself first — you need a recording before you can compare it.',
    fa: 'اول باید صدای خودت رو ضبط کنی؛ برای رفتن به مقایسه حتماً باید یک ضبط داشته باشی.',
  },
  sequentialRecordingRequiredMessage: {
    en: 'You need to record the earlier lines first before you can listen to or compare this one.',
    fa: 'باید جمله‌های قبل از این را هم ضبط کرده باشی تا بتوانی این یکی را بشنوی یا مقایسه کنی.',
  },
  nextStep: { en: 'Next step', fa: 'مرحله بعد' },
  startShadowing: { en: 'Start Shadowing', fa: 'شروع سایه‌زنی' },
  stopShadowing: { en: 'Stop Shadowing', fa: 'توقف سایه‌زنی' },
  replayMaster: { en: 'Replay Master', fa: 'پخش دوباره صدای اصلی' },
  lineHasNoAudio: {
    en: 'No reference audio for this line yet.',
    fa: 'برای این جمله هنوز صدای مرجع ثبت نشده.'
  },
  tapToRecord: { en: 'Tap to Record', fa: 'برای ضبط بزنید' },
  tapToStopRecord: { en: 'Tap to Stop', fa: 'برای پایان ضبط بزنید' },
  masterAudio: { en: 'Master Audio', fa: 'صدای اصلی' },
  yourRecording: { en: 'Your Recording', fa: 'صدای شما' },

  // ---- نمره‌دهی گفتار ----
  // این فیچر تلفظ آوایی (فونتیک) را نمی‌سنجد؛ فقط با کمکِ اطمینانِ STT
  // (whisper) می‌گوید هر کلمه چقدر واضح ادا شده. برای همین همه‌جا از واژه‌ی
  // «تلفظ» پرهیز شده و «وضوح/گفتار» به‌کار رفته تا چیزی که واقعاً سنجیده
  // نمی‌شود ادعا نشود.
  scoringInProgress: { en: 'Scoring your speech…', fa: 'در حال بررسی گفتار شما…' },
  scoringFailed: {
    en: "Couldn't score this recording. Check your connection.",
    fa: 'نمره‌دهی انجام نشد. اتصال اینترنت را بررسی کنید.',
  },
  recordToSeeScore: {
    en: 'Record yourself to see your speech score',
    fa: 'صدایت را ضبط کن تا نمره‌ی گفتارت را ببینی',
  },
  scoreEstimatedNote: {
    en: 'Rough estimate — speech-recognition service unavailable, so words are not checked.',
    fa: 'نمره تقریبی است — سرویس تشخیص گفتار در دسترس نبود، پس کلمه‌ها بررسی نشده‌اند.',
  },
  scoreOverall: { en: 'Overall', fa: 'کل' },
  scorePronunciation: { en: 'Clarity', fa: 'وضوح' },
  scoreFluency: { en: 'Fluency', fa: 'روانی' },
  weHeard: { en: 'We heard:', fa: 'آنچه شنیدیم:' },
  checkPronunciation: { en: 'Check my speech', fa: 'گفتارم را بررسی کن' },
  tryAgain: { en: 'Try again', fa: 'تلاش دوباره' },
  noRecordingForLine: {
    en: 'Not recorded yet',
    fa: 'هنوز ضبط نشده',
  },

  // ---- متن مخفی در مرحله‌ی ضبط ----
  recordingUnavailable: {
    en: "This device can't record audio here. Please report it.",
    fa: 'ضبط صدا روی این دستگاه ممکن نیست. لطفاً اطلاع بده.',
  },
  showText: { en: 'Show me the text', fa: 'متن را نشانم بده' },
  hideText: { en: 'Hide the text', fa: 'متن را مخفی کن' },
  showTextNoXpHint: {
    en: 'Showing the text means no XP for this line',
    fa: 'با نمایش متن، این جمله XP نمی‌گیرد',
  },

  // ---- لیست ضبط‌های صحنه ----
  myLinesTitle: { en: 'My recordings', fa: 'ضبط‌های من' },
  playAllMine: { en: 'Play all', fa: 'پخش همه' },
  stopPlayAll: { en: 'Stop', fa: 'توقف' },
  playConversation: { en: 'Play conversation', fa: 'پخش کل مکالمه' },
  checkWordPrefix: { en: 'Check', fa: 'بررسی کنید' },
  playBoth: { en: 'Play Both', fa: 'پخش هر دو' },
  retry: { en: 'Retry', fa: 'تلاش دوباره' },
  finishSession: { en: 'Finish Session', fa: 'پایان جلسه' },
  addToLeitner: { en: 'Add to Leitner', fa: 'افزودن به لایتنر' },

  // Session Result Screen
  rhythm: { en: 'Rhythm', fa: 'ریتم' },
  sentenceAnalysis: { en: 'Sentence Analysis', fa: 'تحلیل جمله' },
  aiCoachInsight: { en: 'AI Coach Insight', fa: 'تحلیل هوشمند مربی' },
  aiCoachInsightBody: {
    en: "You're doing great with vowels, but try to stress the key words a bit more.",
    fa: 'صداهای مصوت را خوب تلفظ می‌کنید، اما سعی کنید روی کلمات کلیدی بیشتر تاکید کنید.',
  },
  practiceAgain: { en: 'Practice Again', fa: 'تمرین دوباره' },
  // این دکمه درس را تمام می‌کند (و نه رفتن به درس بعدی)؛ اسمش باید همان کاری
  // را بگوید که می‌کند.
  finishLesson: { en: 'Finish Lesson', fa: 'پایان درس' },
  shadowAgain: { en: 'Practice again', fa: 'دوباره تمرین کن' },
  backToHome: { en: 'Back to home', fa: 'برگرد به خانه' },
  lessonCompleteTitle: { en: 'Lesson complete! 🎉', fa: 'درس تمام شد! 🎉' },
  lessonCompleteMessage: {
    en: 'You recorded and compared every sentence in this scene.',
    fa: 'همه‌ی جمله‌های این صحنه را ضبط و مقایسه کردی.'
  },

  // AI Conversation — گفتگوی آزاد صوتی بعد از تمام‌شدنِ یک صحنه
  startAiConversation: { en: 'Practice free conversation', fa: 'گفتگوی آزاد با هوش مصنوعی' },
  sceneGrammarTitle: { en: 'Grammar point', fa: 'نکته‌ی گرامری' },
  sceneGrammarExamples: { en: 'Examples from this scene', fa: 'مثال‌هایی از همین صحنه' },
  dialoguePhrasesTitle: { en: 'Idioms & phrases', fa: 'اصطلاح‌ها و عبارت‌ها' },
  sceneWordsTitle: { en: 'Words in this scene', fa: 'واژه‌های این صحنه' },
  sceneWordsMore: { en: '+{count} more', fa: '+{count} تا دیگه' },
  sceneWordsLess: { en: 'Show less', fa: 'کمتر' },
  aiConversationTranslate: { en: 'Translate', fa: 'ترجمه' },
  aiConversationHideTranslation: { en: 'Hide translation', fa: 'مخفی کردن ترجمه' },
  aiConversationTitle: { en: 'AI Conversation', fa: 'گفتگو با هوش مصنوعی' },
  aiConversationRecordHint: { en: 'Tap to speak', fa: 'برای صحبت‌کردن لمس کن' },
  aiConversationSending: { en: 'Sending...', fa: 'در حال ارسال...' },
  aiConversationRetryHint: { en: "Didn't catch that — try again", fa: 'متوجه نشدم — دوباره امتحان کن' },
  aiConversationEndedTitle: { en: 'Conversation complete! 🎉', fa: 'گفتگو تمام شد! 🎉' },
  aiConversationEndedMessage: { en: 'Great job practicing!', fa: 'آفرین، تمرین خوبی بود!' },
  aiConversationTurnProgress: { en: 'Turn {current} of {total}', fa: 'نوبت {current} از {total}' },
  aiConversationPreparing: { en: 'Getting your conversation ready…', fa: 'در حال آماده‌سازی گفتگو…' },
  aiConversationLoadError: { en: 'Could not start the conversation', fa: 'شروع گفتگو ممکن نشد' },
  aiConversationForbiddenNoSub: {
    en: 'This feature is only available with an active subscription',
    fa: 'این قابلیت فقط برای کاربران با اشتراک فعال در دسترس است',
  },
  aiConversationForbiddenQuota: {
    en: "You've reached today's free limit. Buy more tokens to keep going now, or try again tomorrow.",
    fa: 'سقف رایگانِ امروزت تمام شده. برای ادامه‌ی همین حالا توکن بخر، یا فردا دوباره امتحان کن.',
  },
  aiConversationSubscribeBtn: { en: 'Subscribe', fa: 'خرید اشتراک' },
  aiConversationBuyTokensBtn: { en: 'Buy tokens', fa: 'خرید توکن' },
  grammarTipLabel: { en: 'Better:', fa: 'بهتره اینطوری بگی:' },
  aiConversationHintBtn: { en: 'Suggest a reply', fa: 'پیشنهاد جواب' },
  aiConversationHintsLeft: { en: '{count} left', fa: '{count} تا مونده' },
  aiConversationHintTitle: { en: 'You could say:', fa: 'می‌تونی بگی:' },
  aiConversationHintError: { en: 'Could not get a suggestion — try again', fa: 'پیشنهاد گرفته نشد — دوباره امتحان کن' },
  aiConversationHintClose: { en: 'Close', fa: 'بستن' },

  // ورودیِ کشو برای گفتگو با اپ — از میان دروسِ تمام‌شده به‌صورت رندوم انتخاب می‌شود
  drawerConversationTitle: { en: 'Chat with the app', fa: 'گفت‌وگو با اپلیکیشن' },
  drawerConversationNoCompletedLessons: {
    en: 'Finish a lesson first, then come back for a conversation about it',
    fa: 'اول باید حداقل یک درس را کامل کنی، بعد می‌تونی درباره‌ش گفت‌وگو کنی',
  },

  // Free Speech — یک بار توضیحِ آزاد بعد از تمام‌شدنِ یک صحنه (بدون پاسخِ AI)
  startFreeSpeech: { en: 'Describe what happened', fa: 'توضیح بده چی شد' },
  freeSpeechTitle: { en: 'Free Speech', fa: 'توضیح آزاد' },
  freeSpeechPrompt: {
    en: 'Describe, in your own words, what happened in this situation.',
    fa: 'با کلمات خودت توضیح بده توی این موقعیت چی اتفاق افتاد.',
  },
  freeSpeechRecordHint: { en: 'Tap to speak', fa: 'برای صحبت‌کردن لمس کن' },
  freeSpeechAnalyzing: {
    en: "We're analyzing your speech. This usually takes 5–10 seconds — please wait.",
    fa: 'در حال تحلیل صدات هستیم. معمولاً ۵ تا ۱۰ ثانیه طول می‌کشه، لطفاً صبر کن.',
  },
  freeSpeechFeedbackLoading: {
    en: 'Checking your answer and grammar…',
    fa: 'در حال بررسی جواب و گرامرت…',
  },
  freeSpeechFeedbackError: {
    en: 'Could not get feedback right now.',
    fa: 'الان بازخورد گرفته نشد.',
  },
  freeSpeechFeedbackRetry: { en: 'Try again', fa: 'دوباره امتحان کن' },
  freeSpeechForbiddenNoSub: {
    en: 'This feature is only available with an active subscription',
    fa: 'این قابلیت فقط برای کاربران با اشتراک فعال در دسترس است',
  },
  freeSpeechForbiddenQuota: {
    en: "You've reached today's free limit. Buy more tokens to keep going now, or try again tomorrow.",
    fa: 'سقف رایگانِ امروزت تمام شده. برای ادامه‌ی همین حالا توکن بخر، یا فردا دوباره امتحان کن.',
  },
  recordMaxDurationHint: { en: 'Up to {max} seconds', fa: 'حداکثر {max} ثانیه' },
  recordTimer: { en: '{elapsed} / {max} s', fa: '{elapsed} از {max} ثانیه' },
  freeSpeechRecapLabel: { en: 'What happened in the scene', fa: 'یادآوری: توی این صحنه چی گذشت' },
  freeSpeechYourAnswer: { en: 'What you said', fa: 'چیزی که گفتی' },
  freeSpeechTryAgain: { en: 'Try again', fa: 'دوباره امتحان کن' },
  freeSpeechRetryHint: { en: "Didn't catch that — try again", fa: 'متوجه نشدم — دوباره امتحان کن' },
  lessonIncompleteTitle: { en: 'Lesson not finished yet', fa: 'درس هنوز تمام نشده' },
  lessonIncompleteMessage: {
    en: "You haven't compared every sentence yet — finish the remaining ones first.",
    fa: 'هنوز همه‌ی جمله‌ها را مقایسه نکرده‌ای — اول بقیه را کامل کن.'
  },
  wordExcellent: { en: 'Excellent', fa: 'عالی' },
  wordGood: { en: 'Good', fa: 'خوب' },
  wordNeedsPractice: { en: 'Needs practice', fa: 'نیاز به تمرین' },
  
  // Auth Screen
  welcomeBack: { en: 'Log in to LingoFlow', fa: 'ورود به LingoFlow' },
  loginSub: { en: 'Enter your credentials to continue', fa: 'اطلاعات خود را برای ورود وارد کنید' },
  emailOrPhone: { en: 'Email or Phone', fa: 'ایمیل یا شماره موبایل' },
  password: { en: 'Password', fa: 'رمز عبور' },
  forgotPassword: { en: 'Forgot Password?', fa: 'رمز عبور را فراموش کرده‌اید؟' },
  login: { en: 'Log In', fa: 'ورود' },
  sendOtp: { en: 'Send SMS Code', fa: 'ارسال کد پیامکی' },
  enterOtp: { en: 'Enter 5-Digit Code', fa: 'کد ۵ رقمی را وارد کنید' },
  verifyAndLogin: { en: 'Verify & Sign In', fa: 'تأیید و ورود' },
  dontHaveAccount: { en: 'Don\'t have an account?', fa: 'حساب کاربری ندارید؟' },
  alreadyHaveAccount: { en: 'Already have an account?', fa: 'حساب کاربری دارید؟' },
  signUp: { en: 'Sign Up', fa: 'ثبت‌نام' },
  signUpOtp: { en: 'Sign Up with Phone (OTP)', fa: 'ثبت‌نام با شماره موبایل (کد پیامکی)' },
  phoneNumber: { en: 'Phone Number (e.g. 0912...)', fa: 'شماره موبایل (مثلاً ۰۹۱۲...)' },
  nicknameLabel: { en: 'Nickname', fa: 'نام کاربری' },
  registerSub: { en: 'Create an account to start practicing', fa: 'برای شروع تمرین، یک حساب کاربری بسازید' },
  fillAllFields: { en: 'Please fill in all fields', fa: 'لطفاً همه فیلدها را پر کنید' },
  loginFailed: { en: 'Login failed. Check your phone and password.', fa: 'ورود ناموفق بود. شماره و رمز عبور را بررسی کنید.' },
  registerFailed: { en: 'Something went wrong. Please try again.', fa: 'خطایی رخ داد. لطفاً دوباره تلاش کنید.' },
  networkError: { en: 'Could not reach the server. Check your connection and try again.', fa: 'ارتباط با سرور برقرار نشد. اتصال اینترنت خود را بررسی کنید.' },
  passwordMismatch: { en: 'Passwords do not match', fa: 'رمز عبور و تکرار آن مطابقت ندارند' },
  weakPassword: { en: 'Password must be at least 8 characters', fa: 'رمز عبور باید حداقل ۸ کاراکتر باشد' },

  // Reset Password Screen
  resetPasswordTitle: { en: 'Reset Password', fa: 'بازیابی رمز عبور' },
  resetPasswordSub: {
    en: 'Enter your nickname and choose a new password.',
    fa: 'نام کاربری خود را وارد کرده و رمز عبور جدید انتخاب کنید.'
  },
  sendResetCode: { en: 'Send Reset Code', fa: 'ارسال کد بازیابی' },
  newPassword: { en: 'New Password', fa: 'رمز عبور جدید' },
  confirmNewPassword: { en: 'Confirm New Password', fa: 'تکرار رمز عبور جدید' },
  updatePassword: { en: 'Update Password', fa: 'ثبت رمز عبور جدید' },
  resetSuccessTitle: { en: 'Password Updated! 🎉', fa: 'رمز عبور تغییر یافت! 🎉' },
  resetSuccessSub: {
    en: 'Your password has been reset successfully. You can now log in with your new password.',
    fa: 'رمز عبور شما با موفقیت تغییر کرد. اکنون می‌توانید با رمز جدید وارد شوید.'
  },
  backToLogin: { en: 'Back to Login', fa: 'بازگشت به صفحه ورود' },
  otpCodeLabel: { en: '5-Digit Code', fa: 'کد ۵ رقمی' },
  otpSentMessage: { en: 'We sent a code to', fa: 'کد تایید به این شماره ارسال شد:' },
  verifyCode: { en: 'Verify Code', fa: 'تایید کد' },
  resendCode: { en: 'Resend code', fa: 'ارسال دوباره کد' },
  continueLabel: { en: 'Continue', fa: 'ادامه' },

  // Notifications & Reminders Settings
  notificationsTitle: { en: 'Notifications & Reminders', fa: 'اعلانات و یادآوری‌ها' },
  studyReminder: { en: 'Daily Study Reminder', fa: 'یادآوری درس‌خواندن' },
  studyReminderSub: {
    en: 'Get daily alerts to keep your learning streak active.',
    fa: 'دریافت یادآوری روزانه برای حفظ استریک و استمرار در تمرین.'
  },
  reminderTime: { en: 'Reminder Times', fa: 'ساعت‌های یادآوری' },
  reminderTimesEmpty: {
    en: 'No time selected yet — add at least one.',
    fa: 'هنوز ساعتی انتخاب نکرده‌ای — حداقل یکی اضافه کن.'
  },
  addReminderTime: { en: 'Add a time', fa: 'افزودن ساعت' },
  pickReminderTime: { en: 'Pick a reminder time', fa: 'انتخاب ساعت یادآوری' },
  reminderTimeLimitReached: {
    en: 'You can add up to 12 reminder times.',
    fa: 'حداکثر ۱۲ ساعت یادآوری می‌توانی اضافه کنی.'
  },
  reminderTimeDuplicate: { en: 'This time is already added.', fa: 'این ساعت قبلاً اضافه شده است.' },
  hour: { en: 'Hour', fa: 'ساعت' },
  minute: { en: 'Minute', fa: 'دقیقه' },
  contentNotification: { en: 'Sentence & Vocab Alerts', fa: 'نوتیفیکیشن واژه‌ها و جملات' },
  contentNotificationSub: {
    en: 'Receive banner notifications featuring your Leitner words or lesson sentences.',
    fa: 'نمایش بنر نوتیفیکیشن حاوی واژگان جعبه لایتنر یا جملات مکالمات.'
  },
  notificationSource: { en: 'Notification Content Source', fa: 'منبع محتوای نوتیفیکیشن' },
  sourceLeitner: { en: 'Leitner Words', fa: 'واژگان لایتنر' },
  sourceSentences: { en: 'Lesson Sentences', fa: 'جملات درس‌ها' },
  sourceMixed: { en: 'Both (Mixed)', fa: 'ترکیب واژه‌ها و جملات' },
  // متن خودِ نوتیفیکیشن یادآوری روزانه — با زبانِ دستگاه ساخته می‌شود، نه
  // زبان انتخابی داخل اپ (getDeviceLanguage در utils/deviceLanguage).
  notifDailyReminderTitle: { en: '🔥 Time to shadow!', fa: '🔥 وقت تمرینه!' },
  notifDailyReminderBody: {
    en: 'A few minutes of practice keeps your streak alive.',
    fa: 'چند دقیقه تمرین کن تا استریکت از بین نره.'
  },
  sendTestNotification: { en: 'Send Test Notification Banner', fa: 'ارسال نوتیفیکیشن آزمایشی' },
  testNotificationSent: { en: 'Test notification displayed!', fa: 'نوتیفیکیشن آزمایشی نمایش داده شد!' },
  noContentForTestNotification: {
    en: 'Nothing to preview yet — save a Leitner word or open a scene first.',
    fa: 'هنوز چیزی برای نمایش نیست — اول یه کلمه به جعبه‌ی لایتنر اضافه کن یا یه صحنه باز کن.',
  },
  viewContent: { en: 'Review Now', fa: 'مشاهده و مرور' },

  // ---- Language Habit ----
  habitCardTitle: { en: 'Language Habit', fa: 'عادت زبانی' },
  habitRealSituations: { en: 'Real Situations', fa: 'موقعیت‌های واقعی' },
  habitSuggestTopic: { en: 'Suggest a Topic', fa: 'پیشنهاد موضوع' },
  habitContactUs: { en: 'Contact Us', fa: 'ارتباط با ما' },

  habitScreenTitle: { en: 'Real Situations', fa: 'موقعیت‌های واقعی' },
  habitTodaysMission: { en: "Today's Mission", fa: 'ماموریت امروز' },
  habitPracticeWhile: { en: 'Practice this dialogue while {activity}', fa: 'این دیالوگ را همزمان با {activity} تمرین کن' },
  habitStartMission: { en: 'Start Mission', fa: 'شروع ماموریت' },
  habitHistoryTitle: { en: 'Your Progress', fa: 'پیشرفت شما' },
  habitCompletedMissions: { en: 'Completed missions', fa: 'ماموریت‌های انجام‌شده' },
  habitCurrentStreak: { en: 'Current streak', fa: 'استریک فعلی' },
  habitTotalPracticeTime: { en: 'Total practice time', fa: 'کل زمان تمرین' },
  habitNoMissionToday: {
    en: 'No mission today. Check back tomorrow!',
    fa: 'امروز ماموریتی نیست. فردا دوباره سر بزن!',
  },
  habitDoneForToday: {
    en: "You've done today's mission. A new one arrives tomorrow!",
    fa: 'ماموریت امروز را انجام دادی. فردا یک ماموریت تازه منتظرت است!',
  },
  habitDaysStreakSuffix: { en: 'day streak', fa: 'روز استریک' },
  habitMissionKicker: {
    en: "Today's Real Situation",
    fa: 'موقعیت واقعی امروز',
  },
  habitPurposeText: {
    en: "This dialogue is picked from scenes you've practiced well in shadowing (or a new scene if you're just starting). Saying it from memory while your hands and mind are busy with an everyday task makes it automatic — so in a real conversation it comes out without thinking.",
    fa: 'این دیالوگ از صحنه‌هایی انتخاب می‌شود که در شادوئینگ خوب تمرینشان کرده‌ای (اگر تازه شروع کرده‌ای، از یک صحنه‌ی جدید). وقتی آن را وسط یک کار روزمره و در حالی که دست و ذهنت درگیر کار دیگری است از حفظ بگویی، خودکار می‌شود؛ تا در یک مکالمه‌ی واقعی بدون فکر کردن از دهانت بیرون بیاید.',
  },
  habitHowItWorksTitle: { en: 'How this mission works', fa: 'این ماموریت چطور کار می‌کند' },
  habitHowItWorks1: {
    en: 'First you get to see the full dialogue and memorize it.',
    fa: 'اول متن کامل دیالوگ را می‌بینی و فرصت داری حفظش کنی.',
  },
  habitHowItWorks2: {
    en: 'Then the text is hidden — start the task and say the dialogue from memory while you record.',
    fa: 'بعد متن مخفی می‌شود؛ کار روزمره را شروع کن و همزمان دیالوگ را از حفظ بگو تا ضبط شود.',
  },
  habitHowItWorks3: {
    en: "At the end, you'll see your accuracy and the mission counts toward your streak. A new mission arrives every day.",
    fa: 'در پایان، دقت گفتارت را می‌بینی و این ماموریت در استریکت حساب می‌شود. هر روز یک ماموریت تازه می‌آید.',
  },

  habitStudyTitle: { en: 'Memorize this dialogue', fa: 'این دیالوگ را حفظ کن' },
  habitStudySubtitle: {
    en: "Take a moment to read it. Once you start, the text will be hidden and you'll say it from memory.",
    fa: 'یک لحظه وقت بگذار و آن را بخوان. بعد از شروع، متن مخفی می‌شود و باید از حفظ بگویی.',
  },
  habitStudyReadyBtn: { en: "I'm ready, start", fa: 'آماده‌ام، شروع کن' },
  habitStartRecording: { en: 'Start', fa: 'شروع' },
  habitStopRecording: { en: 'Stop', fa: 'پایان' },
  habitUploading: { en: 'Uploading your practice…', fa: 'در حال ارسال تمرین…' },
  habitAnalyzing: { en: 'Analyzing…', fa: 'در حال تحلیل…' },
  habitUploadFailed: {
    en: "Couldn't upload your practice. Check your connection.",
    fa: 'ارسال تمرین انجام نشد. اتصال اینترنت را بررسی کن.',
  },

  habitMissionComplete: { en: 'Mission Complete', fa: 'ماموریت کامل شد' },
  habitYouRemembered: { en: 'You remembered', fa: 'به یاد آوردی' },
  habitWordsLabel: { en: 'Words', fa: 'کلمات' },
  habitAccuracyLabel: { en: 'Accuracy', fa: 'دقت' },
  habitYouPracticed: { en: 'You practiced', fa: 'تمرین کردی' },
  habitDoneBtn: { en: 'Done', fa: 'پایان' },

  // ---- Topic Suggestion ----
  topicSuggestionTitle: { en: 'Suggest a Topic', fa: 'پیشنهاد موضوع' },
  topicSuggestionPlaceholder: {
    en: 'e.g. Ordering food at a restaurant',
    fa: 'مثلاً: سفارش غذا در رستوران',
  },
  topicSuggestionSubmit: { en: 'Submit', fa: 'ارسال' },
  topicSuggestionNote: {
    en: 'We review this manually and may add it as a new scene.',
    fa: 'این پیشنهاد را به‌صورت دستی بررسی می‌کنیم و ممکن است به‌عنوان صحنه‌ی جدید اضافه شود.',
  },
  topicSuggestionMineTitle: { en: 'My Suggestions', fa: 'پیشنهادهای من' },
  topicSuggestionEmpty: { en: 'No suggestions yet.', fa: 'هنوز پیشنهادی ثبت نشده.' },
  topicSuggestionFillField: { en: 'Please write a topic', fa: 'لطفاً یک موضوع بنویس' },

  // ---- Feedback (پیشنهادات و انتقادات) ----
  feedbackTitle: { en: 'Suggestions & Feedback', fa: 'پیشنهادات و انتقادات' },
  feedbackNote: {
    en: 'Tell us what you like or what we should improve — our team reads every message.',
    fa: 'هر پیشنهاد یا انتقادی داری برامون بنویس — تیم ما همه‌ی پیام‌ها را می‌خواند.',
  },
  feedbackPlaceholder: {
    en: 'Write your suggestion or feedback here...',
    fa: 'پیشنهاد یا انتقادت را اینجا بنویس...',
  },
  feedbackSubmit: { en: 'Send', fa: 'ارسال' },
  feedbackFillField: { en: 'Please write a message', fa: 'لطفاً پیامی بنویس' },
  supportRepliesTitle: { en: 'Replies from the team', fa: 'جواب‌های تیم LingoFlow' },
  supportReplyKind_feedback: { en: 'Your feedback', fa: 'پیشنهاد و انتقاد شما' },
  supportReplyKind_submission: { en: 'Your scene suggestion', fa: 'صحنه‌ای که پیشنهاد دادی' },
  supportReplyKind_topic: { en: 'Your topic suggestion', fa: 'موضوعی که پیشنهاد دادی' },
  supportReplyKind_subscription: { en: 'Your subscription', fa: 'اشتراک شما' },
  supportReplyKind_topup: { en: 'Your token purchase', fa: 'خرید توکن شما' },
  feedbackSuccess: { en: 'Thanks! Your message was sent.', fa: 'ممنون! پیامت ارسال شد.' },

  // ---- Paywall (خرید کافه‌بازاری / باز کردن صحنه‌های قفل) ----
  paywallTitle: { en: 'Unlock All Scenes', fa: 'باز کردن همه‌ی صحنه‌ها' },
  paywallSubtitle: {
    en: 'The first 30 scenes are always free. Pick a plan to unlock every scene.',
    fa: 'سی صحنه‌ی اول همیشه رایگانه. یه پلن انتخاب کن و همه‌ی صحنه‌ها رو باز کن.',
  },
  paywallPriceLabel: { en: 'Price', fa: 'قیمت' },
  paywallBuyButton: { en: 'Continue', fa: 'ادامه و پرداخت' },
  paywallProcessing: { en: 'Processing…', fa: 'در حال پردازش…' },
  paywallSuccessTitle: { en: 'Subscription activated!', fa: 'اشتراک فعال شد!' },
  paywallSuccessSub: {
    en: 'All scenes are unlocked.',
    fa: 'همه‌ی صحنه‌ها باز شدن.',
  },
  paywallSuccessBtn: { en: "Great, let's go", fa: 'عالی، بریم' },
  paywallErrorGeneric: {
    en: "Couldn't complete the purchase. Please try again.",
    fa: 'خرید کامل نشد. دوباره امتحان کن.',
  },
  paywallRestoreButton: { en: 'Restore purchase', fa: 'بازیابی خرید قبلی' },
  paywallRestoreNotFound: {
    en: 'No previous purchase was found for this Bazaar account.',
    fa: 'خرید قبلی‌ای برای این حساب بازار پیدا نشد.',
  },
  paywallPlansLoadError: {
    en: "Couldn't load plans. Please try again.",
    fa: 'طرح‌های اشتراک بارگذاری نشد. دوباره امتحان کن.',
  },
  paywallRedeemPointsTitle: { en: 'Use my points', fa: 'استفاده از امتیازم' },
  paywallRedeemPointsSub: {
    en: 'You have {points} points — redeem them for {days} bonus days on this subscription.',
    fa: '{points} امتیاز داری — می‌تونی خرجش کنی برای {days} روز اضافه روی این اشتراک.',
  },

  // ---------- تاپ‌آپ توکن ----------
  tokenTopupTitle: { en: 'Buy more tokens', fa: 'خرید توکن بیشتر' },
  tokenTopupSubtitle: {
    en: "Once your free daily limit runs out, buy a token pack to keep using AI Conversation and Free Speech right now, instead of waiting until tomorrow.",
    fa: 'وقتی سقفِ رایگانِ روزانه‌ات تمام شد، یه بسته‌ی توکن بخر تا همین حالا بتونی به گفتگو با AI و توضیح آزاد ادامه بدی، بدون اینکه منتظرِ فردا بمونی.',
  },
  tokenTopupUsageToday: { en: "Today's usage", fa: 'مصرف امروز' },
  tokenTopupUsedOf: { en: '{used} of {limit} tokens', fa: '{used} از {limit} توکن' },
  tokenTopupCreditBalance: { en: 'Purchased credit remaining', fa: 'اعتبارِ خریداری‌شده‌ی باقی‌مانده' },
  tokenTopupBuyButton: { en: 'Buy', fa: 'خرید' },
  tokenTopupProcessing: { en: 'Processing…', fa: 'در حال پردازش…' },
  tokenTopupSuccessTitle: { en: 'Tokens added!', fa: 'توکن اضافه شد!' },
  tokenTopupSuccessSub: { en: 'You can keep going right away.', fa: 'همین حالا می‌تونی ادامه بدی.' },
  tokenTopupSuccessBtn: { en: "Great, let's go", fa: 'عالی، بریم' },
  tokenTopupErrorGeneric: {
    en: "Couldn't complete the purchase. Please try again.",
    fa: 'خرید کامل نشد. دوباره امتحان کن.',
  },
  tokenTopupPlansLoadError: {
    en: "Couldn't load token packs. Please try again.",
    fa: 'بسته‌های توکن بارگذاری نشد. دوباره امتحان کن.',
  },

  lockedBadge: { en: 'Locked', fa: 'قفل' },
  homeFlowVideos: { en: 'OUR VIDEOS', fa: 'ویدیوهای ما' },
  homeMovieClips: { en: 'SCENES FROM MOVIES', fa: 'صحنه‌هایی از فیلم‌ها' },
  homeSeeAll: { en: 'See all', fa: 'همه' },
  homeLevelAllDone: {
    en: "You've finished every scene at your level! See the full path for what's next.",
    fa: 'همه‌ی درس‌های سطحت را تمام کردی! برای ادامه، «مسیر کامل» را ببین.',
  },
  curriculumMapTitle: { en: 'Learning Path', fa: 'مسیر آموزشی' },
  curriculumMapSub: {
    en: '{done} of {total} scenes completed',
    fa: '{done} از {total} صحنه کامل شده',
  },
  startQuiz: { en: 'Test yourself', fa: 'شروع کوئیز' },
  quizPromptKicker: { en: 'Which sentence did you hear?', fa: 'کدوم جمله رو شنیدی؟' },
  quizUnavailable: {
    en: 'No quiz available for this scene yet.',
    fa: 'هنوز کوئیزی برای این صحنه در دسترس نیست.',
  },
  quizLoadError: {
    en: 'Could not load the quiz. Check your connection and try again.',
    fa: 'بارگذاری کوئیز ممکن نشد. اینترنتت رو چک کن و دوباره امتحان کن.',
  },
  quizRetry: { en: 'Try again', fa: 'تلاش دوباره' },
  quizDone: { en: 'Done', fa: 'باشه' },

  // ---- Contact Us ----
  contactUsTitle: { en: 'Contact Us', fa: 'ارتباط با ما' },
  contactUsSub: {
    en: 'Questions, feedback, or an issue? Reach out.',
    fa: 'سوال، بازخورد یا مشکلی داری؟ باهامون در ارتباط باش.',
  },
  contactUsEmailLabel: { en: 'Email', fa: 'ایمیل' },
  contactUsCopy: { en: 'Copy', fa: 'کپی' },
  contactUsCopied: { en: 'Copied!', fa: 'کپی شد!' },
  contactUsOpenEmail: { en: 'Open Email App', fa: 'باز کردن اپ ایمیل' },

  // ---- Toast demo ----
  toastDemoTitle: { en: 'Toast Preview', fa: 'پیش‌نمایش پیام‌ها' },
  toastDemoSub: {
    en: 'Tap a card to fire that toast — same messages shown for real elsewhere in the app.',
    fa: 'روی هر کارت بزن تا همون پیام نمایش داده بشه — دقیقاً همون متن‌هایی که جاهای واقعی اپ دیده می‌شن.',
  },
  toastDemoSuccessTitle: { en: 'Success', fa: 'موفقیت' },
  toastDemoErrorTitle: { en: 'Error', fa: 'خطا' },
  toastDemoInfoTitle: { en: 'Info', fa: 'اطلاع‌رسانی' },
  toastDemoWarningTitle: { en: 'Warning', fa: 'هشدار' },
  toastDemoQueueTitle: { en: 'Queue (fires 3 in a row)', fa: 'صف (۳ تا پشت‌سرهم)' },
  toastDemoQueueSample: {
    en: 'Shows how back-to-back toasts wait their turn instead of interrupting each other.',
    fa: 'نشون می‌ده وقتی چند پیام پشت‌سرهم بیان، هرکدوم نوبتشو صبر می‌کنه و قطع نمی‌شه.',
  },
  toastDemoMenuLabel: { en: 'Toast Preview', fa: 'پیش‌نمایش پیام‌ها' },
  toastDemoMenuSub: { en: 'Dev-only: see every toast style', fa: 'فقط برای توسعه: دیدن همه‌ی استایل‌های پیام' },
  realtimePoCMenuLabel: { en: 'Realtime Voice PoC', fa: 'آزمایش مکالمه‌ی زنده' },
  realtimePoCMenuSub: { en: 'Dev-only: Gemini Live architecture test', fa: 'فقط برای توسعه: تست معماری Gemini Live' },

  // ---- Placement Test (Quick Check) ----
  placementIntroTitle: { en: 'Speaking Placement Test', fa: 'تعیین سطح گفتاری' },
  placementIntroBody: {
    en: 'A quick, 5-item check (about 2-3 minutes) so we can personalize your practice to your level.',
    fa: 'یک تست کوتاه ۵ مرحله‌ای (حدود ۲ تا ۳ دقیقه) تا تمرین‌ها را دقیق‌تر متناسب با سطح تو بسازیم.',
  },
  placementIntroBullet1: {
    en: 'Listen to three sentences (easy to hard) and repeat each one',
    fa: 'سه جمله (از ساده تا سخت) را می‌شنوی و هرکدام را تکرار می‌کنی',
  },
  placementIntroBullet2: {
    en: 'Two free-speaking prompts about yourself and an everyday situation',
    fa: 'دو سؤال آزاد؛ یکی درباره‌ی خودت و یکی درباره‌ی یک موقعیت روزمره',
  },
  placementIntroBullet3: {
    en: "At the end, you'll see your speaking level",
    fa: 'در پایان، سطح گفتاری‌ت را می‌بینی',
  },
  placementIntroTimeEstimate: { en: '~2-3 minutes', fa: '~۲ تا ۳ دقیقه' },
  placementStartBtn: { en: 'Start', fa: 'شروع' },
  placementSkipBtn: { en: 'Skip for now', fa: 'فعلاً رد کن' },

  placementItemProgress: { en: 'Item {current} of {total}', fa: 'آیتم {current} از {total}' },
  placementShadowKicker: { en: 'Listen, then repeat', fa: 'گوش بده و تکرار کن' },
  placementFreeSpeechKicker: { en: 'Speak freely', fa: 'آزادانه صحبت کن' },
  placementPlayReference: { en: 'Play sample audio', fa: 'پخش صدای نمونه' },
  placementStartRecordBtn: { en: 'Start recording', fa: 'شروع ضبط' },
  placementStopRecordBtn: { en: 'Stop recording', fa: 'توقف ضبط' },
  placementMaxDurationHint: { en: 'Up to {max} seconds', fa: 'حداکثر {max} ثانیه' },
  placementRecordTimer: { en: '{elapsed} / {max} s', fa: '{elapsed} از {max} ثانیه' },
  placementRecordingLabel: { en: 'Recording…', fa: 'در حال ضبط...' },
  placementPlaybackBtn: { en: 'Play my recording', fa: 'پخش ضبط من' },
  placementRerecordBtn: { en: 'Record again', fa: 'ضبط دوباره' },
  placementConfirmNextBtn: { en: 'Confirm & continue', fa: 'تایید و ادامه' },
  placementConfirmFinishBtn: { en: 'Finish & submit', fa: 'اتمام و ارسال نتیجه' },
  placementMicDenied: {
    en: 'Microphone access was denied. Allow it in your phone settings.',
    fa: 'دسترسی به میکروفن رد شد. از تنظیمات گوشی اجازه بده.',
  },
  placementSubmitting: {
    en: 'Submitting and scoring your answers…',
    fa: 'در حال ارسال و بررسی نتیجه...',
  },
  placementSubmitFailed: {
    en: "Couldn't submit your results. Check your connection.",
    fa: 'ارسال نتیجه انجام نشد. اتصال اینترنت را بررسی کن.',
  },
  placementRetryBtn: { en: 'Try again', fa: 'تلاش دوباره' },

  // تست تعیین سطح نسخه‌ی ۲
  placementV2IntroBullet1: { en: 'Words: tap the ones you know', fa: 'لغت: کلمه‌هایی که بلدی را مشخص کن' },
  placementV2IntroBullet2: { en: 'Listening: hear a sentence and pick its meaning', fa: 'شنیدن: یک جمله گوش بده و معنی‌اش را انتخاب کن' },
  placementV2IntroBullet3: { en: 'Speaking: repeat sentences that get longer', fa: 'صحبت: جمله‌هایی را که کم‌کم بلندتر می‌شوند تکرار کن' },
  placementV2IntroTime: { en: '~4-5 minutes', fa: '~۴ تا ۵ دقیقه' },
  placementV2VocabKicker: { en: 'Part 1 of 3 · Words', fa: 'بخش ۱ از ۳ · لغت' },
  placementV2VocabHint: {
    en: 'Do you know what this word means? Be honest — some words are made up.',
    fa: 'معنی این کلمه را می‌دانی؟ صادق باش؛ بعضی از کلمه‌ها ساختگی‌اند.',
  },
  placementV2VocabYes: { en: 'I know it', fa: 'می‌دانم' },
  placementV2VocabNo: { en: "I don't know", fa: 'نمی‌دانم' },
  placementV2ListenKicker: { en: 'Part 2 of 3 · Listening', fa: 'بخش ۲ از ۳ · شنیدن' },
  placementV2ListenStep: { en: 'Step {current} of {total}', fa: 'مرحله‌ی {current} از {total}' },
  placementV2ListenPrompt: { en: 'What does this sentence mean?', fa: 'این جمله یعنی چه؟' },
  placementV2PlaysLeft: { en: 'Tap to listen ({n} left)', fa: 'برای شنیدن بزن ({n} بار باقی مانده)' },
  placementV2Playing: { en: 'Playing…', fa: 'در حال پخش...' },
  placementV2ImitationPrompt: {
    en: 'Part 3 of 3 · Listen once, then repeat the whole sentence',
    fa: 'بخش ۳ از ۳ · یک بار گوش بده، بعد کل جمله را تکرار کن',
  },
  placementV2PlayedOnce: { en: 'Played — now repeat it', fa: 'پخش شد؛ حالا تکرارش کن' },
  placementV2SkipHard: { en: 'Too hard — skip', fa: 'سخت بود، رد شو' },
  placementV2SkipOptional: { en: 'Skip (optional)', fa: 'رد شدن (اختیاری)' },
  placementV2ResultTitle: { en: 'Your English level', fa: 'سطح انگلیسی تو' },
  placementV2Comprehension: { en: 'Understanding', fa: 'فهمیدن' },
  placementV2Speaking: { en: 'Speaking', fa: 'صحبت' },
  placementV2VocabSize: { en: 'You know about {n} English words', fa: 'حدود {n} کلمه‌ی انگلیسی بلدی' },
  placementV2Progress: {
    en: 'Since your last test: {before} → {after} words, {prevLevel} → {level}',
    fa: 'از تست قبلی: {before} ← {after} کلمه، {prevLevel} ← {level}',
  },
  placementV2StartAt: { en: 'Your path starts at', fa: 'مسیرت از اینجا شروع می‌شود' },
  placementV2WhyComprehension: {
    en: 'This level matches what you can understand, so almost every word will be familiar.',
    fa: 'این سطح با چیزی که می‌فهمی جور است، پس تقریباً همه‌ی کلمه‌ها برایت آشنا خواهند بود.',
  },
  placementV2WhySpeaking: {
    en: 'You understand more than you can say yet, so we start one level lower to build your speaking.',
    fa: 'بیشتر از آنچه می‌توانی بگویی می‌فهمی، برای همین یک سطح پایین‌تر شروع می‌کنیم تا صحبتت قوی شود.',
  },
  placementV2SpeakingUnmeasured: {
    en: "We couldn't check your speaking this time, so the level is based on understanding.",
    fa: 'این بار نشد صحبتت را بسنجیم، برای همین سطح بر اساس فهمیدن است.',
  },
  placementV2VocabInvalid: {
    en: 'Some made-up words were marked as known, so the word part was not used.',
    fa: 'چند کلمه‌ی ساختگی را «می‌دانم» زدی، برای همین بخش لغت در نتیجه حساب نشد.',
  },
  placementV2IntroFeedback: { en: 'A better way to say it:', fa: 'بهتر است این‌طور بگویی:' },
  placementV2RetestNote: {
    en: 'Take the test again in 4 weeks to see your progress.',
    fa: '۴ هفته‌ی دیگر دوباره تست بده تا پیشرفتت را ببینی.',
  },
  placementV2StartPathBtn: { en: 'Start my path', fa: 'شروع مسیر' },

  placementResultTitle: { en: 'Your speaking level', fa: 'سطح گفتاری شما' },
  placementResultEstimatedNote: {
    en: 'This is a rough estimate.',
    fa: 'این نتیجه تقریبی است.',
  },
  placementFreeSpeechSectionTitle: { en: 'Free-speaking items', fa: 'بخش‌های گفتار آزاد' },
  placementRelevanceYes: { en: 'Answered', fa: 'پاسخ داده شد' },
  placementRelevancePartial: { en: 'Partially answered', fa: 'تا حدی پاسخ داده شد' },
  placementRelevanceNo: { en: 'Not answered', fa: 'پاسخ داده نشد' },

  placementCtaTitle: { en: 'Find your speaking level', fa: 'سطح گفتاری‌ت رو مشخص کن' },
  placementCtaSub: {
    en: 'A quick 5-step test, about 2-3 minutes',
    fa: 'یک تست کوتاه ۵ مرحله‌ای، حدود ۲ تا ۳ دقیقه',
  },
  placementDrawerTitle: { en: 'Speaking Level Test', fa: 'تست تعیین سطح' },
  myLevelTitle: { en: 'My level', fa: 'سطح من' },
  myLevelSourceManual: { en: 'Chosen by you', fa: 'انتخاب خودت' },
  myLevelSourceTest: { en: 'From your level test', fa: 'از تست تعیین سطح' },
  myLevelSourceDefault: {
    en: "You haven't taken the level test yet — starting as Beginner",
    fa: 'هنوز تست تعیین سطح نداده‌ای — پیش‌فرض مبتدی',
  },
  myLevelTestResult: { en: 'Test result: {level}', fa: 'نتیجه‌ی تست: {level}' },
  myLevelResetToTest: { en: 'Use my test result', fa: 'برگرد به نتیجه‌ی تست' },
  myLevelHarderWarning: {
    en: 'Heads up: lessons at this level may be hard for you.',
    fa: 'حواست باشه: درس‌های این سطح ممکنه برات سخت باشن.',
  },
  myLevelSaveFailed: { en: "Couldn't change your level. Try again.", fa: 'تغییر سطح انجام نشد. دوباره امتحان کن.' },
  placementLevelBadge: { en: 'Level: {level}', fa: 'سطح: {level}' },
  todaysMission: { en: "TODAY'S MISSION", fa: 'ماموریت امروز' },
  speaking: { en: 'Speaking', fa: 'گفتار' },

  // ---- Polysemous verbs ----
  verbsTab: { en: 'Verbs', fa: 'افعال' },
  idiomsTab: { en: 'Idioms', fa: 'اصطلاحات' },
  idiomsIntro: {
    en: 'Common idioms and expressions, ordered by level. Tap + to review one in your Leitner box.',
    fa: 'اصطلاح‌ها و عبارت‌های پرکاربرد، به ترتیب سطح. با + هر کدام را به لایتنر ببر تا مرورش کنی.',
  },
  idiomsEmpty: { en: 'No idioms yet.', fa: 'هنوز اصطلاحی اضافه نشده.' },
  idiomsMyLevel: { en: 'your level', fa: 'سطح تو' },
  idiomsShowAll: { en: 'Show all levels', fa: 'نمایش همه‌ی سطح‌ها' },
  verbsIntro: {
    en: 'Common verbs with many meanings — each meaning comes with a real sentence from your lessons.',
    fa: 'فعل‌های پرکاربردی که چند معنا دارند — هر معنا با یک جمله‌ی واقعی از درس‌ها.',
  },
  verbsEmpty: { en: 'No verbs yet. Check back soon!', fa: 'هنوز فعلی اضافه نشده. به‌زودی!' },
  verbLearnedOf: { en: '{learned} of {total} meanings learned', fa: '{learned} از {total} معنا یادگرفته' },
  verbMeaningsTitle: { en: 'Meanings', fa: 'معناها' },
  verbHeardIn: { en: 'In: {scene}', fa: 'در درس: {scene}' },
  verbGoToLesson: { en: 'Go to lesson', fa: 'برو به درس' },
  verbNoLessonExample: { en: 'Not in your lessons yet', fa: 'هنوز در درس‌ها نیامده' },
  verbAddToLeitner: { en: 'Add to Leitner', fa: 'افزودن به لایتنر' },
  verbInLeitner: { en: 'In Leitner', fa: 'در لایتنر' },
  verbStatusLearned: { en: 'Learned', fa: 'یادگرفته' },
  verbStatusRecognition: { en: 'Recognized {n}/{target}', fa: 'تشخیص {n} از {target}' },
  verbStatusSpoken: { en: 'Spoken ✓', fa: 'گفته‌شده ✓' },
  verbLearnedRule: {
    en: 'A meaning counts as learned after 2 correct answers on different days, plus either one spoken practice or 2 successful Leitner reviews.',
    fa: 'یک معنا وقتی «یادگرفته» حساب می‌شود که ۲ بار در دو روز مختلف درست تشخیصش بدهی، و یا یک بار درست با صدا بگویی‌اش یا ۲ بار در لایتنر درست مرورش کنی.',
  },
  verbStartQuiz: { en: 'Practice: which meaning?', fa: 'تمرین: کدام معنا؟' },
  verbSpeakPractice: { en: 'Say it', fa: 'با صدا بگو' },
  verbQuizQuestion: { en: 'What does "{form}" mean here?', fa: 'این‌جا «{form}» یعنی چه؟' },
  verbQuizCorrect: { en: 'Correct!', fa: 'درسته!' },
  verbQuizWrong: { en: 'Not quite — it means: {meaning}', fa: 'نه دقیقاً — این‌جا یعنی: {meaning}' },
  verbQuizNext: { en: 'Next', fa: 'بعدی' },
  verbQuizDone: { en: 'Done! {correct} of {total} correct.', fa: 'تمام شد! {correct} از {total} درست.' },
  verbQuizEmpty: {
    en: 'Not enough examples for a quiz yet.',
    fa: 'هنوز مثال کافی برای آزمون این فعل نیست.',
  },
  verbBackToVerb: { en: 'Back to the verb', fa: 'برگشت به فعل' },
  verbSpeakTitle: { en: 'Say one sentence', fa: 'یک جمله بگو' },
  verbSpeakInstruction: {
    en: 'Use "{verb}" meaning «{meaning}»:',
    fa: 'با «{verb}» به معنای «{meaning}»:',
  },
  verbSpeakTapToRecord: { en: 'Tap to record, tap again to finish', fa: 'بزن و بگو، دوباره بزن تا تمام شود' },
  verbSpeakChecking: { en: 'Checking…', fa: 'در حال بررسی…' },
  verbSpeakYouSaid: { en: 'You said', fa: 'گفتی' },
  verbSpeakPassed: { en: 'Great — you used it right!', fa: 'عالی — درست به کار بردی!' },
  verbSpeakNotYet: { en: 'Not quite yet', fa: 'هنوز نه' },
  verbSpeakBetter: { en: 'A natural way to say it', fa: 'یک شکل طبیعی‌تر' },
  verbSpeakTryAgain: { en: 'Try again', fa: 'دوباره امتحان کن' },
  verbSpeakSubscriptionOnly: {
    en: 'Spoken practice is for subscribers.',
    fa: 'تمرین صوتی مخصوص مشترک‌هاست.',
  },
  verbSpeakQuotaReached: {
    en: "You've used today's AI allowance.",
    fa: 'سقف امروزِ هوش مصنوعی‌ات تمام شده.',
  },
  verbSpeakFailed: { en: "Couldn't check that. Try again.", fa: 'بررسی نشد. دوباره امتحان کن.' },
  verbTagHere: { en: '"{form}" here means «{meaning}»', fa: '«{form}» این‌جا یعنی «{meaning}»' },
  verbTagMore: { en: '{n} more meanings ←', fa: '{n} معنای دیگر ←' },
  verbPendingTitle: {
    en: 'You met a new meaning of "{verb}"',
    fa: 'معنای تازه‌ای از «{verb}» دیدی',
  },
  verbPendingSub: { en: '30-second practice?', fa: '۳۰ ثانیه تمرین؟' },
  idiomsThisWeek: { en: 'This week', fa: 'اصطلاح‌های این هفته' },
  podcastAllLevels: { en: 'Show all levels', fa: 'همه‌ی سطح‌ها' },
  podcastMyLevelsOnly: { en: 'Only my level', fa: 'فقط سطح من' },
  goalTravel: { en: 'Travel', fa: 'سفر' },
  goalMigration: { en: 'Moving abroad', fa: 'مهاجرت' },
  goalStudy: { en: 'Study', fa: 'تحصیل' },
  goalWork: { en: 'Work', fa: 'کار' },
  goalPlanHomeTitle: { en: 'Have a goal in mind?', fa: 'هدف مشخصی داری؟' },
  goalPlanHomeSub: { en: 'Travel, moving abroad, study or work: get a plan with a date.', fa: 'سفر، مهاجرت، تحصیل یا کار: برنامه‌ی من تا تاریخ هدفت' },
  goalPlanTitle: { en: 'My plan', fa: 'برنامه‌ی من' },
  goalPlanIntro: { en: 'Three quick questions and we build an honest plan.', fa: 'سه سؤال کوتاه، و یک برنامه‌ی صادقانه برایت می‌سازیم.' },
  goalPlanPickGoal: { en: 'What is your goal?', fa: 'هدفت چیه؟' },
  goalPlanWhen: { en: 'When do you need it?', fa: 'تا کی لازمش داری؟' },
  goalPlanNoDate: { en: 'No date', fa: 'تاریخ ندارم' },
  goalPlanMonths: { en: 'In {n} months', fa: '{n} ماه دیگر' },
  goalPlanMinutes: { en: 'How much time per day?', fa: 'روزی چقدر وقت داری؟' },
  goalPlanMinuteOption: { en: '{n} min', fa: '{n} دقیقه' },
  goalPlanCreate: { en: 'Build my plan', fa: 'برنامه‌ام را بساز' },
  goalPlanDaysLeft: { en: '{n} days left', fa: '{n} روز مانده' },
  goalPlanNoDateNote: { en: 'No deadline: situations in order of urgency.', fa: 'بدون تاریخ: موقعیت‌ها به ترتیب فوریت' },
  goalPlanReadyOf: { en: '{a} of {b} situations ready', fa: '{a} از {b} موقعیت آماده' },
  goalPlanHonestPartial: {
    en: 'In the time you have, you can prepare {n} of {m} situations: the most urgent ones first.',
    fa: 'با زمانی که داری، {n} موقعیت از {m} موقعیت را آماده می‌کنی؛ فوری‌ترها اول.',
  },
  goalPlanHonestAll: { en: 'You can prepare all {n} situations in time.', fa: 'هر {n} موقعیت را به موقع آماده می‌کنی.' },
  goalPlanLevelReachable: {
    en: 'At this pace you will also reach {level} (roughly).',
    fa: 'با همین ریتم حدوداً به سطح «{level}» هم می‌رسی.',
  },
  goalPlanLevelPartial: {
    en: 'Reaching {level} takes more hours; by then you cover roughly {pct}% of the way. Our promise is the situations, not the level.',
    fa: 'رسیدن به سطح «{level}» ساعت بیشتری می‌خواهد؛ تا آن روز حدود {pct}٪ راهش را می‌روی. قول ما موقعیت‌هاست، نه سطح.',
  },
  goalPlanToday: { en: 'Today', fa: 'امروز' },
  goalPlanAllDone: { en: 'Everything in your plan is ready.', fa: 'همه‌ی موقعیت‌های برنامه‌ات آماده است.' },
  goalPlanSituations: { en: 'Situations', fa: 'موقعیت‌ها' },
  goalPlanComingSoon: { en: 'Coming soon', fa: 'به‌زودی' },
  goalPlanOutOfPlan: { en: 'Beyond your plan; open it any time', fa: 'بیرون از برنامه؛ هر وقت خواستی' },
  goalPlanEdit: { en: 'Change my plan', fa: 'تغییر برنامه' },
  goalPlanDelete: { en: 'Delete plan', fa: 'حذف برنامه' },
  goalPlanForecastTitle: { en: 'Honest forecast', fa: 'پیش‌بینی صادقانه' },
  goalPlanDeleteTitle: { en: 'Delete this plan?', fa: 'برنامه حذف شود؟' },
  goalPlanDeleteBody: { en: 'Your finished scenes stay as they are.', fa: 'صحنه‌هایی که تمام کرده‌ای سر جایشان می‌مانند.' },
  goalPlanLoadError: { en: 'Something went wrong. Try again.', fa: 'مشکلی پیش آمد. دوباره امتحان کن.' },
  retestCardTitle: { en: 'Time to see your progress', fa: 'وقتشه پیشرفتت رو ببینی' },
  retestCardSub: {
    en: 'A 3-minute check shows how far you have come.',
    fa: 'یک تست ۳ دقیقه‌ای نشون می‌ده چقدر جلو رفتی.',
  },

  // صحبت درباره‌ی یک موضوع (۱ تا ۲ دقیقه)
  topicSpeakingTitle: { en: 'Speak on a Topic', fa: 'صحبت درباره‌ی یک موضوع' },
  topicSpeakingSubtitle: {
    en: 'Talk for 1–2 minutes and get feedback on your mistakes',
    fa: 'یک تا دو دقیقه صحبت کن و درباره‌ی اشتباه‌هایت بازخورد بگیر',
  },
  topicSpeakingEmpty: { en: 'No topics yet. Check back soon!', fa: 'هنوز موضوعی اضافه نشده. به‌زودی!' },
  topicSpeakingLoadError: { en: 'Could not load topics.', fa: 'موضوع‌ها بارگذاری نشد.' },
  topicSpeakingRetry: { en: 'Try again', fa: 'تلاش دوباره' },
  topicSpeakingSeconds: { en: '{s} sec', fa: '{s} ثانیه' },
  topicSpeakingBest: { en: 'Best: {score}', fa: 'بهترین: {score}' },
  topicSpeakingGuideTitle: { en: 'Questions to help you', fa: 'سؤال‌هایی که کمکت می‌کنند' },
  topicSpeakingPhrasesTitle: { en: 'Try to use these', fa: 'سعی کن از این‌ها استفاده کنی' },
  topicSpeakingStartHint: { en: 'Tap the mic and start talking', fa: 'میکروفون را بزن و شروع کن' },
  topicSpeakingStopHint: { en: 'Tap to finish', fa: 'برای تمام کردن لمس کن' },
  topicSpeakingMinHint: { en: 'Keep going — at least {min} seconds', fa: 'ادامه بده — حداقل {min} ثانیه' },
  topicSpeakingAnalyzing: {
    en: 'Listening to your talk and preparing feedback… this can take up to 30 seconds.',
    fa: 'در حال گوش دادن به صحبتت و آماده کردن بازخورد… ممکن است تا ۳۰ ثانیه طول بکشد.',
  },
  topicSpeakingScore: { en: 'Score', fa: 'امتیاز' },
  topicSpeakingStats: { en: '{words} words · {wpm} words/min', fa: '{words} کلمه · {wpm} کلمه در دقیقه' },
  topicSpeakingStrengths: { en: 'What you did well', fa: 'نقاط قوت' },
  topicSpeakingMistakes: { en: 'Fix these', fa: 'این‌ها را درست کن' },
  topicSpeakingNoMistakes: { en: 'No important grammar mistakes. Great job!', fa: 'اشتباه گرامری مهمی نداشتی. عالی!' },
  topicSpeakingBetter: { en: 'Sound more natural', fa: 'طبیعی‌تر بگو' },
  topicSpeakingInsteadOf: { en: 'Instead of', fa: 'به‌جای' },
  topicSpeakingSay: { en: 'Say', fa: 'بگو' },
  topicSpeakingUsedPhrases: { en: 'Suggested phrases you used', fa: 'عبارت‌های پیشنهادی که استفاده کردی' },
  topicSpeakingImproved: { en: 'A better version of your talk', fa: 'نسخه‌ی بهتر صحبت تو' },
  topicSpeakingYourTalk: { en: 'What you said', fa: 'چیزی که گفتی' },
  topicSpeakingTryAgain: { en: 'Speak again', fa: 'دوباره صحبت کن' },
  topicSpeakingOtherTopics: { en: 'Other topics', fa: 'موضوع‌های دیگر' },
  topicSpeakingLockedNoSub: {
    en: 'Topic speaking feedback is for subscribers.',
    fa: 'بازخورد صحبت درباره‌ی موضوع مخصوص مشترک‌هاست.',
  },
  topicSpeakingLockedQuota: {
    en: "You've used today's AI limit.",
    fa: 'سهم امروزت از هوش مصنوعی تمام شده.',
  },

  // تمرین با ویدیو (کلیپ + جای شخصیت حرف زدن)
  videoClipsTitle: { en: 'Practice with Videos', fa: 'تمرین با ویدیو' },
  videoClipsSubtitle: {
    en: 'Watch a short clip, then speak as one of the characters',
    fa: 'یک کلیپ کوتاه ببین، بعد جای یکی از شخصیت‌ها حرف بزن',
  },
  videoClipsLoadError: { en: 'Could not load the videos.', fa: 'ویدیوها بارگذاری نشد.' },
  videoClipsEmpty: { en: 'No videos yet. Check back soon!', fa: 'هنوز ویدیویی اضافه نشده. به‌زودی!' },
  videoClipsFilterAll: { en: 'All', fa: 'همه' },
  videoClipsFilterFlow: { en: 'Our videos', fa: 'ساخته‌ی ما' },
  videoClipsFilterMovie: { en: 'From movies', fa: 'از فیلم‌ها' },
  videoClipsAllMovies: { en: 'All movies', fa: 'همه‌ی فیلم‌ها' },
  videoClipsEmptyFilter: { en: 'No videos here yet.', fa: 'هنوز ویدیویی در این بخش نیست.' },
  videoClipsSourceMovie: { en: 'Movie', fa: 'فیلم' },
  videoClipsSourceFlow: { en: 'Scene', fa: 'صحنه' },
  videoClipsCharacters: { en: '{n} characters', fa: '{n} شخصیت' },
  videoClipYourTurn: { en: 'Your turn!', fa: 'نوبت توست!' },
  videoClipSubtitlesOffHint: { en: 'Subtitles off — just listen', fa: 'زیرنویس خاموش است — فقط گوش کن' },
  videoClipSubEn: { en: 'English', fa: 'انگلیسی' },
  videoClipSubFa: { en: 'Persian', fa: 'فارسی' },
  videoClipSubOff: { en: 'No subtitles', fa: 'بدون زیرنویس' },
  videoClipWatchHint: {
    en: 'Tip: watch once with subtitles, then once without.',
    fa: 'پیشنهاد: یک بار با زیرنویس ببین، یک بار بدون زیرنویس.',
  },
  videoClipReplay: { en: 'Replay', fa: 'از اول' },
  videoClipToQuiz: { en: 'Did you understand?', fa: 'فهمیدی چی شد؟' },
  videoClipToPick: { en: 'Choose a character', fa: 'انتخاب شخصیت' },
  videoClipQuestionN: { en: 'Question {n} of {total}', fa: 'سؤال {n} از {total}' },
  videoClipNext: { en: 'Next', fa: 'بعدی' },
  videoClipQuizPerfect: { en: 'You understood everything!', fa: 'همه‌چیز را فهمیدی!' },
  videoClipQuizDone: {
    en: 'Watch again for the parts you missed, or go on.',
    fa: 'برای قسمت‌هایی که نفهمیدی دوباره ببین، یا ادامه بده.',
  },
  videoClipWatchAgain: { en: 'Watch again', fa: 'دوباره ببین' },
  videoClipPickTitle: { en: 'Who do you want to be?', fa: 'می‌خواهی جای کی حرف بزنی؟' },
  videoClipPickHint: {
    en: "The video plays again; on this character's lines the sound goes off and you speak.",
    fa: 'کلیپ دوباره پخش می‌شود؛ سر جمله‌های این شخصیت صدا قطع می‌شود و تو حرف می‌زنی.',
  },
  videoClipLinesCount: { en: '{n} lines', fa: '{n} جمله' },
  videoClipShowText: { en: 'Show the lines', fa: 'متن جمله‌ها را نشان بده' },
  videoClipShowTextOn: { en: 'Easier: you read your lines.', fa: 'آسان‌تر: جمله‌هایت را می‌خوانی.' },
  videoClipShowTextOff: {
    en: 'Harder: only the Persian meaning is shown — say it from memory.',
    fa: 'سخت‌تر: فقط معنی فارسی نشان داده می‌شود — از حفظ بگو.',
  },
  videoClipStartPerform: { en: 'Start', fa: 'شروع' },
  videoClipPerformHint: { en: 'Get ready…', fa: 'آماده باش…' },
  videoClipScoring: { en: 'Scoring your lines… {done}/{total}', fa: 'در حال نمره دادن به جمله‌هایت… {done}/{total}' },
  videoClipResultAs: { en: 'Your score as {speaker}', fa: 'امتیازت به‌جای {speaker}' },
  videoClipLineMissing: { en: 'Not recorded', fa: 'ضبط نشد' },
  videoClipLineError: { en: 'Could not score', fa: 'نمره داده نشد' },
  videoClipHeard: { en: 'We heard', fa: 'شنیدیم' },
  videoClipPlayOriginal: { en: 'Original', fa: 'صدای اصلی' },
  videoClipPlayMine: { en: 'My voice', fa: 'صدای من' },
  videoClipPerformAgain: { en: 'Try again', fa: 'دوباره اجرا کن' },
  videoClipOtherCharacter: { en: 'Another character', fa: 'شخصیت دیگر' },
  videoClipPause: { en: 'Pause', fa: 'توقف' },
  videoClipResume: { en: 'Resume', fa: 'ادامه' },

  // تمرین نوشتن (داستان کوتاه + تصحیح با AI)
  writingTitle: { en: 'Write a Short Story', fa: 'نوشتن داستان کوتاه' },
  writingSubtitle: {
    en: 'Write about a topic and get your mistakes corrected',
    fa: 'درباره‌ی یک موضوع بنویس و اشتباه‌هایت را تصحیح‌شده ببین',
  },
  writingEmpty: { en: 'No topics yet. Check back soon!', fa: 'هنوز موضوعی اضافه نشده. به‌زودی!' },
  writingWordRange: { en: '{min}–{max} words', fa: '{min} تا {max} کلمه' },
  writingIdeasTitle: { en: 'Ideas for your story', fa: 'ایده‌هایی برای داستانت' },
  writingPhrasesTitle: { en: 'Try to use these', fa: 'سعی کن از این‌ها استفاده کنی' },
  writingPhrasesHint: { en: 'Tap a phrase to add it to your text.', fa: 'روی هر عبارت بزن تا به متنت اضافه شود.' },
  writingPlaceholder: { en: 'Start writing in English…', fa: 'به انگلیسی شروع به نوشتن کن…' },
  writingWordCount: { en: '{n} words (aim for {min}–{max})', fa: '{n} کلمه (هدف: {min} تا {max})' },
  writingChecking: {
    en: 'Reading your text and preparing corrections…',
    fa: 'در حال خواندن متنت و آماده کردن تصحیح‌ها…',
  },
  writingLockedNoSub: { en: 'Writing correction is for subscribers.', fa: 'تصحیح نوشتن مخصوص مشترک‌هاست.' },
  writingWords: { en: '{n} words', fa: '{n} کلمه' },
  writingStructures: { en: 'Structures to try next time', fa: 'ساختارهایی که دفعه‌ی بعد امتحان کنی' },
  writingWrite: { en: 'Write', fa: 'بنویس' },
  writingImproved: { en: 'A better version of your text', fa: 'نسخه‌ی بهتر متن تو' },
  writingSubmit: { en: 'Check my writing', fa: 'تصحیح کن' },
  writingEditAgain: { en: 'Edit and resubmit', fa: 'ویرایش و ارسال دوباره' },

  // مسیر آموزشی (هفته ← جلسه ← قدم + Checkpoint)
  pathLoadError: { en: 'Could not load the path.', fa: 'مسیر بارگذاری نشد.' },
  pathWeeksProgress: { en: '{done} of {total} weeks done', fa: '{done} از {total} هفته تمام شده' },
  pathWeekN: { en: 'Week {n}', fa: 'هفته‌ی {n}' },
  pathSessionN: { en: 'Session {n}', fa: 'جلسه‌ی {n}' },
  pathFree: { en: 'Free', fa: 'رایگان' },
  pathCheckpointScore: { en: 'Checkpoint: {n}', fa: 'نمره‌ی Checkpoint: {n}' },
  pathCanDoTitle: { en: 'By the end of this week I can:', fa: 'آخر این هفته می‌توانم:' },
  pathKind_scene: { en: 'Scene', fa: 'صحنه' },
  pathKind_podcast: { en: 'Podcast', fa: 'پادکست' },
  pathKind_video_clip: { en: 'Video', fa: 'ویدیو' },
  pathKind_speaking_topic: { en: 'Speaking', fa: 'صحبت درباره‌ی موضوع' },
  pathKind_leitner_review: { en: 'Word review', fa: 'مرور لایتنر' },
  pathKind_weak_lines: { en: 'Tricky sentences', fa: 'جمله‌های سخت' },
  pathKind_checkpoint: { en: 'Weekly checkpoint', fa: 'Checkpoint هفته' },
  pathKind_habit_mission: { en: 'Say it from memory', fa: 'ماموریت از حفظ' },
  pathKind_dictation: { en: 'Dictation & writing', fa: 'دیکته و نوشتن' },
  pathKind_self_intro: { en: 'Before & after', fa: 'قبل و بعد' },
  pathKind_writing: { en: 'Writing', fa: 'تمرین نوشتن' },
  pathKind_verb: { en: 'Verb of the week', fa: 'فعل این هفته' },
  pathKind_idioms: { en: 'Idioms of the week', fa: 'اصطلاح‌های این هفته' },
  pathKind_story: { en: 'Story reading', fa: 'خواندن داستان' },
  pathCefrRange: { en: 'Level {from} → {to}', fa: 'سطح {from} ← {to}' },
  pathCefrMilestone: {
    en: '🎉 You finished {cefr} (approx. level)',
    fa: '🎉 سطح {cefr} را کامل کردی (معادل تقریبی)',
  },
  pathSelfIntroBeforeTitle: { en: 'My “before” recording', fa: 'ضبط «قبل» من' },
  pathSelfIntroAfterTitle: { en: 'Before & after', fa: 'قبل و بعد' },
  pathSelfIntroPrompt: { en: 'Introduce yourself in English.', fa: 'خودت را به انگلیسی معرفی کن.' },
  pathSelfIntroBeforeNote: {
    en: 'Say as much as you can — even just “Hello” and your name is fine. In week 8 you record it again and see the difference.',
    fa: 'هر چقدر بلدی بگو؛ حتی فقط Hello و اسمت کافی است. هفته‌ی ۸ همین را دوباره ضبط می‌کنی و تفاوت را می‌بینی.',
  },
  pathSelfIntroAfterNote: {
    en: 'Do what you did in week 1: introduce yourself. Then we compare it with your week 1 recording.',
    fa: 'همان کاری که هفته‌ی ۱ کردی: خودت را معرفی کن. بعد با ضبط هفته‌ی ۱ مقایسه می‌شود.',
  },
  pathSelfIntroNoBefore: {
    en: 'You have no week 1 recording, but record now to see how much you can say.',
    fa: 'ضبط هفته‌ی ۱ را نداری، ولی الان ضبط کن تا ببینی چقدر می‌توانی بگویی.',
  },
  pathSelfIntroTapToStart: { en: 'Tap and start talking (up to 60 seconds)', fa: 'بزن و شروع کن (حداکثر ۶۰ ثانیه)' },
  pathSelfIntroProcessing: { en: 'Listening to your recording…', fa: 'در حال بررسی ضبطت…' },
  pathSelfIntroError: { en: 'We couldn’t hear you. Please try again.', fa: 'صدایت شنیده نشد. دوباره امتحان کن.' },
  pathSelfIntroSaved: {
    en: 'Saved! Record it again in week 8 to see your progress.',
    fa: 'ذخیره شد! هفته‌ی ۸ دوباره ضبط می‌کنی و پیشرفتت را می‌بینی.',
  },
  pathSelfIntroSavedNoBefore: { en: 'Great job! Here is what you said.', fa: 'آفرین! این چیزی است که گفتی.' },
  pathSelfIntroWeek1: { en: 'Week 1', fa: 'هفته‌ی ۱' },
  pathSelfIntroNow: { en: 'Now', fa: 'الان' },
  pathSelfIntroWords: { en: 'words', fa: 'کلمه' },
  pathSelfIntroUnique: { en: 'different words', fa: 'کلمه‌ی متفاوت' },
  pathSelfIntroSeconds: { en: 'seconds', fa: 'ثانیه' },
  pathSelfIntroListen: { en: 'Listen', fa: 'گوش بده' },
  pathSelfIntroAgain: { en: 'Record again', fa: 'دوباره ضبط کن' },
  pathSelfIntroTimes: { en: '{n}× more words than week 1! 🎉', fa: '{n} برابر هفته‌ی ۱ کلمه گفتی! 🎉' },
  pathSelfIntroMoreWords: { en: '{n} more words than week 1! 🎉', fa: '{n} کلمه بیشتر از هفته‌ی ۱! 🎉' },
  pathSelfIntroKeepGoing: {
    en: 'Listen to both — you sound more confident. Keep going!',
    fa: 'هر دو را گوش بده؛ صدایت مطمئن‌تر شده. ادامه بده!',
  },
  pathDictationListen: { en: 'Listen and type what you hear.', fa: 'گوش بده و همان را بنویس.' },
  pathDictationTranslate: { en: 'Write this in English.', fa: 'این جمله را به انگلیسی بنویس.' },
  pathDictationPlay: { en: 'Play again', fa: 'دوباره پخش کن' },
  pathDictationPlaceholder: { en: 'Type in English…', fa: 'به انگلیسی بنویس…' },
  pathDictationCheck: { en: 'Check', fa: 'بررسی' },
  pathDictationCorrect: { en: 'Correct sentence', fa: 'جمله‌ی درست' },
  pathDictationDone: { en: 'Great writing practice!', fa: 'آفرین! تمرین نوشتن تمام شد' },
  pathOptional: { en: 'optional', fa: 'اختیاری' },
  pathMinutes: { en: '{n} min', fa: '{n} دقیقه' },
  pathBack: { en: 'Back to the path', fa: 'برگشت به مسیر' },
  pathNextSession: { en: 'My next session', fa: 'جلسه‌ی بعدی من' },
  pathAllDone: { en: 'Path complete! 🎉', fa: 'مسیر تمام شد! 🎉' },
  pathStartCta: { en: 'Start the step-by-step path', fa: 'مسیر قدم‌به‌قدم را شروع کن' },
  pathStartCtaSub: {
    en: 'Week by week, with a checkpoint at the end of each week.',
    fa: 'هفته به هفته، با یک Checkpoint آخر هر هفته.',
  },
  pathStartSheetTitle: { en: 'Where should we start?', fa: 'از کجا شروع کنیم؟' },
  pathStartSheetSub: {
    en: 'So the path is neither too easy nor too hard for you.',
    fa: 'تا مسیر نه برایت خیلی آسان باشد نه خیلی سخت.',
  },
  pathStartContinue: { en: 'Continue at my level: {level}', fa: 'ادامه با سطح فعلی‌ام: {level}' },
  pathStartTest: { en: 'Take the placement test', fa: 'تست تعیین سطح' },
  pathStartTestSub: { en: 'About 3 minutes, by speaking', fa: 'حدود ۳ دقیقه، با صحبت کردن' },
  pathStartPick: { en: 'I’ll choose my level', fa: 'خودم سطحم را انتخاب می‌کنم' },
  pathStartFromScratch: { en: 'Start from the very beginning', fa: 'از اول شروع می‌کنم' },
  pathStartBack: { en: 'Back', fa: 'برگشت' },
  pathWeakInstruction: {
    en: 'Read the Persian and say it in English — no peeking!',
    fa: 'فارسی را بخوان و خودت انگلیسی‌اش را بگو، بدون نگاه کردن به متن!',
  },
  pathWeakShowText: { en: 'Show the English', fa: 'متن انگلیسی را نشان بده' },
  pathWeakListen: { en: 'Listen', fa: 'گوش بده' },
  pathWeakSayIt: { en: 'Tap and say it in English', fa: 'بزن و انگلیسی‌اش را بگو' },
  pathWeakDone: { en: 'Nice work on the tricky ones!', fa: 'آفرین! جمله‌های سخت را تمرین کردی' },
  pathWeakAverage: { en: 'Average score: {n}', fa: 'میانگین نمره: {n}' },
  pathWeakEmpty: { en: 'Do this week’s scenes first.', fa: 'اول صحنه‌های این هفته را انجام بده.' },
  pathCheckpointTitle: { en: 'Week {n} checkpoint', fa: 'Checkpoint هفته‌ی {n}' },
  pathCheckpointIntro: {
    en: 'A few short questions to see what you learned this week. It never blocks you — whatever your score, the next week opens.',
    fa: 'چند سؤال کوتاه تا ببینیم این هفته چه یاد گرفتی. راه را نمی‌بندد؛ با هر نمره‌ای هفته‌ی بعد باز می‌شود.',
  },
  pathCheckpointStart: { en: 'Start', fa: 'شروع' },
  pathCheckpointOrder: { en: 'Put the words in order', fa: 'کلمه‌ها را مرتب کن' },
  pathCheckpointReset: { en: 'Start over', fa: 'از اول' },
  pathCheckpointListen: { en: 'Listen to the conversation', fa: 'به این گفتگو گوش بده' },
  pathCheckpointListenAgain: { en: 'You can listen again, then continue.', fa: 'می‌توانی دوباره گوش بدهی یا ادامه بدهی.' },
  pathCheckpointSubmit: { en: 'See my result', fa: 'دیدن نتیجه' },
  pathCheckpointTranscribeError: { en: 'We couldn’t hear that clearly.', fa: 'صدایت واضح شنیده نشد.' },
  pathCheckpointError: { en: 'Could not load the checkpoint.', fa: 'Checkpoint بارگذاری نشد.' },
  pathCheckpointReviewTitle: { en: 'Suggested review', fa: 'مرور پیشنهادی' },
  pathSkill_vocabulary: { en: 'Vocabulary', fa: 'واژگان' },
  pathSkill_grammar: { en: 'Grammar', fa: 'گرامر' },
  pathSkill_listening: { en: 'Listening', fa: 'شنیداری' },
  pathSkill_speaking: { en: 'Speaking', fa: 'گفتاری' },
  pathSkill_real_life: { en: 'Real life', fa: 'موقعیت واقعی' },
  pathReview_vocabulary: { en: 'Review this week’s words in the Leitner box', fa: 'کلمه‌های این هفته را در جعبه‌ی لایتنر مرور کن' },
  pathReview_grammar: { en: 'Practice the tricky sentences again', fa: 'جمله‌های سخت را دوباره تمرین کن' },
  pathReview_listening: { en: 'Listen to this week’s podcasts again', fa: 'پادکست‌های این هفته را دوباره گوش بده' },
  pathReview_speaking: { en: 'Shadow this week’s scenes once more', fa: 'صحنه‌های این هفته را یک بار دیگر شادوینگ کن' },
  pathReview_real_life: { en: 'Redo the week’s last scene without the text', fa: 'آخرین صحنه‌ی هفته را بدون متن دوباره انجام بده' },

  // دوره‌ی شروع (مبتدی‌مبتدی)
  courseTitle: { en: 'First Steps', fa: 'قدم اول' },
  courseSubtitle: {
    en: 'Your first words and sentences, step by step — listen and say it out loud',
    fa: 'اولین کلمه‌ها و جمله‌ها، قدم‌به‌قدم — گوش کن و بلند تکرار کن',
  },
  courseLoadError: { en: 'Could not load the course.', fa: 'دوره بارگذاری نشد.' },
  courseEmpty: { en: 'The course is being prepared. Check back soon!', fa: 'دوره در حال آماده شدن است. به‌زودی!' },
  courseUnitN: { en: 'Unit {n}', fa: 'فصل {n}' },
  courseLessonCards: { en: '{n} cards', fa: '{n} کارت' },
  courseLessonLocked: { en: 'Finish the previous lesson first', fa: 'اول درس قبلی را تمام کن' },
  courseBackToMap: { en: 'Back to the course', fa: 'برگشت به دوره' },
  courseIntroHint: {
    en: 'For each card: listen, then tap the mic and say it.',
    fa: 'برای هر کارت: گوش کن، بعد میکروفون را بزن و بلند بگو.',
  },
  courseStartLesson: { en: "Let's go!", fa: 'بزن بریم!' },
  courseListenAgain: { en: 'Listen again', fa: 'دوباره گوش کن' },
  courseFeedbackGreat: { en: 'Excellent! 🎉', fa: 'عالی بود! 🎉' },
  courseFeedbackGood: { en: 'Good job! One more time?', fa: 'آفرین! یک بار دیگه؟' },
  courseFeedbackTry: {
    en: 'Nice try! Listen again and say it slowly.',
    fa: 'تلاش خوبی بود! دوباره گوش کن و آرام بگو.',
  },
  courseSayAgain: { en: 'Say it again', fa: 'دوباره بگم' },
  courseNext: { en: 'Next', fa: 'بعدی' },
  courseFinish: { en: 'Finish', fa: 'تمام' },
  courseTapWhenDone: { en: 'Tap when you finish', fa: 'وقتی گفتی، بزن' },
  courseNowYouSay: { en: 'Now you say it!', fa: 'حالا تو بگو!' },
  courseDoneTitle: { en: 'Lesson complete!', fa: 'درس تمام شد!' },
  courseDonePerfect: { en: 'Perfect! You are ready for the next lesson.', fa: 'عالی! برای درس بعد آماده‌ای.' },
  courseDoneGood: {
    en: 'Well done! Repeat it anytime to earn more stars.',
    fa: 'آفرین! هر وقت خواستی تکرارش کن تا ستاره‌ی بیشتری بگیری.',
  },
  courseRepeatLesson: { en: 'Repeat this lesson', fa: 'تکرار همین درس' },

  // پادکست
  podcastTitle: { en: 'Podcasts', fa: 'پادکست' },
  podcastSubtitle: {
    en: 'Short episodes with the full text — listen and learn new phrases',
    fa: 'قسمت‌های کوتاه با متن کامل — گوش کن و عبارت‌های تازه یاد بگیر',
  },
  podcastLoadError: { en: 'Could not load the podcast.', fa: 'پادکست بارگذاری نشد.' },
  podcastFeaturedTitle: { en: 'Featured podcasts', fa: 'پادکست‌های منتخب' },
  podcastLessonsTitle: { en: 'Lesson podcasts', fa: 'پادکست‌های درسی' },
  podcastFilterAll: { en: 'All', fa: 'همه' },
  podcastFilterLessons: { en: 'Lessons', fa: 'درسی' },
  podcastFilterFeatured: { en: 'Featured', fa: 'منتخب' },
  pictureStoryBadge: { en: 'Picture story', fa: 'داستان تصویری' },
  pictureStoryHint: {
    en: 'Swipe through the pictures, then tell the story in order: what happens in each picture?',
    fa: 'عکس‌ها را ورق بزن و بعد داستان را به ترتیب تعریف کن: در هر عکس چه اتفاقی می‌افتد؟',
  },
  pictureStoryCovered: { en: 'Pictures you covered: {i} of {n}', fa: 'عکس‌هایی که گفتی: {i} از {n}' },
  pictureStoryBetter: { en: 'A better version of your story', fa: 'نسخه‌ی بهتر داستانت' },
  listenScenePodcast: { en: 'Listen to this scene\'s podcast', fa: 'پادکست همین صحنه را گوش بده' },
  myVersionTitle: { en: 'My version', fa: 'نسخه‌ی من' },
  myVersionButton: { en: 'Record my version', fa: 'نسخه‌ی خودم را بسازم' },
  myVersionPickHint: {
    en: 'Pick a host and read their lines yourself. At the end you hear the podcast in your own voice.',
    fa: 'یکی از مجری‌ها را انتخاب کن و جمله‌هایش را خودت بخوان. آخرش پادکست را با صدای خودت می‌شنوی.',
  },
  myVersionAllLines: { en: 'All lines', fa: 'همه‌ی جمله‌ها' },
  myVersionLines: { en: '{n} lines', fa: '{n} جمله' },
  myVersionOpenSaved: { en: 'Open my saved version', fa: 'نسخه‌ی ذخیره‌شده‌ام' },
  myVersionProgress: { en: 'Line {i} of {n}', fa: 'جمله‌ی {i} از {n}' },
  myVersionListen: { en: 'Original', fa: 'صدای اصلی' },
  myVersionMine: { en: 'My take', fa: 'صدای من' },
  myVersionRecordHint: { en: 'Listen first, then tap the mic and read the line.', fa: 'اول گوش بده، بعد میکروفون را بزن و جمله را بخوان.' },
  myVersionRecording: { en: 'Recording… tap to stop', fa: 'در حال ضبط… برای پایان بزن' },
  myVersionNoScore: { en: 'Saved (no score offline)', fa: 'ذخیره شد (بدون اینترنت نمره ندارد)' },
  myVersionRetry: { en: 'Try again', fa: 'دوباره' },
  myVersionPrev: { en: 'Previous', fa: 'قبلی' },
  myVersionNext: { en: 'Next', fa: 'بعدی' },
  myVersionSkip: { en: 'Skip', fa: 'رد شو' },
  myVersionFinish: { en: 'Finish', fa: 'تمام' },
  myVersionRecorded: { en: '{i} of {n} lines recorded', fa: '{i} از {n} جمله ضبط شد' },
  myVersionPlay: { en: 'Play my version', fa: 'پخش نسخه‌ی من' },
  myVersionPlayHint: {
    en: 'Your lines play in your voice, the rest in the original voice.',
    fa: 'جمله‌های تو با صدای خودت و بقیه با صدای اصلی پخش می‌شوند.',
  },
  myVersionYou: { en: 'you', fa: 'تو' },
  myVersionNotRecorded: { en: 'not recorded', fa: 'ضبط نشده' },
  myVersionChangeRole: { en: 'Choose another host', fa: 'انتخاب مجری دیگر' },
  podcastEmpty: { en: 'No episodes yet. Check back soon!', fa: 'هنوز قسمتی منتشر نشده. به‌زودی!' },
  podcastBack: { en: 'Back to podcasts', fa: 'برگشت به پادکست‌ها' },
  podcastShowTranslation: { en: 'Show Persian translation', fa: 'نمایش ترجمه‌ی فارسی' },
  podcastVocabulary: { en: 'Key words and phrases', fa: 'لغت‌ها و عبارت‌های مهم' },
  storyTitle: { en: 'Reading', fa: 'داستان و خواندن' },
  storySubtitle: { en: 'Short stories at your level — read and listen together', fa: 'داستان‌های کوتاه هم‌سطح خودت — بخوان و هم‌زمان گوش بده' },
  storyEmpty: { en: 'No stories at your level yet. Check back soon!', fa: 'هنوز داستانی برای سطح تو منتشر نشده. به‌زودی!' },
  storyLoadError: { en: 'Could not load the story.', fa: 'داستان باز نشد. اتصال را بررسی کن.' },
  storyChapterN: { en: 'Chapter {n}', fa: 'فصل {n}' },
  storyChaptersProgress: { en: '{done}/{total} chapters', fa: '{done} از {total} فصل' },
  storyAllRead: { en: 'All chapters read', fa: 'همه‌ی فصل‌ها خوانده شد' },
  storyReadHint: { en: 'Tap a sentence to hear it, hold it to see the translation.', fa: 'روی هر جمله بزن تا بشنوی؛ نگه دار تا ترجمه‌اش را ببینی.' },
  storyQuestionsTitle: { en: 'Did you understand?', fa: 'فهمیدی؟' },
  storyQuizResult: { en: '{c} of {n} correct', fa: '{c} از {n} درست' },
  storyNextChapter: { en: 'Next chapter', fa: 'فصل بعد' },
  storyFinish: { en: 'Finish', fa: 'پایان' },
  storyListenAlong: { en: 'Read and listen', fa: 'بخوان و گوش بده' },
  homeStories: { en: 'Stories', fa: 'داستان‌ها' },
  storyGuideListenTitle: { en: 'Listen and read first', fa: 'اول با صدا بخوان' },
  storyGuideListenText: {
    en: 'Press play and follow the highlighted words. Then, if you like, read it again without sound.',
    fa: 'دکمه‌ی پخش را بزن و کلمه‌های رنگی را دنبال کن. بعد اگر خواستی، یک بار هم بی‌صدا بخوان.',
  },
  storyGuideSilentTitle: { en: 'Read silently first, then listen', fa: 'اول بی‌صدا بخوان، بعد گوش بده' },
  storyGuideSilentText: {
    en: 'Read without sound and answer the questions — we measure your reading speed. Then listen to check.',
    fa: 'بدون صدا بخوان و به سؤال‌ها جواب بده؛ سرعت خواندنت اندازه گرفته می‌شود. بعد با صدا گوش بده و مقایسه کن.',
  },
  storySpeedValue: { en: 'Reading speed: {wpm} words per minute', fa: 'سرعت خواندن: {wpm} کلمه در دقیقه' },
  storySpeedFirst: { en: 'Your first measurement. Read more chapters to see your progress.', fa: 'اولین اندازه‌گیری‌ات. با فصل‌های بعد پیشرفتت را می‌بینی.' },
  storySpeedUp: { en: 'Up from your recent average of {avg}. Great progress!', fa: 'از میانگین اخیرت ({avg}) بیشتر است. عالی!' },
  storySpeedDown: { en: 'Your recent average is {avg}. Harder texts are slower — that is normal.', fa: 'میانگین اخیرت {avg} است. متن سخت‌تر کندتر خوانده می‌شود؛ طبیعی است.' },
  interviewTitle: { en: 'Mock interviews', fa: 'مصاحبه‌ی شبیه‌سازی‌شده' },
  interviewSubtitle: { en: 'Answer real interview questions out loud and get feedback', fa: 'به سؤال‌های واقعی مصاحبه بلند جواب بده و بازخورد بگیر' },
  interviewEmpty: { en: 'No interviews at your level yet. Check back soon!', fa: 'هنوز مصاحبه‌ای برای سطح تو منتشر نشده. به‌زودی!' },
  interviewLoadError: { en: 'Could not load the interview.', fa: 'مصاحبه باز نشد. اتصال را بررسی کن.' },
  interviewKind_job: { en: 'Job interview', fa: 'مصاحبه‌ی کاری' },
  interviewKind_admission: { en: 'University admission', fa: 'پذیرش دانشگاه' },
  interviewKind_visa: { en: 'Visa / immigration', fa: 'سفارت و مهاجرت' },
  interviewQuestionCount: { en: '{n} questions', fa: '{n} سؤال' },
  interviewBest: { en: 'Best score {s}', fa: 'بهترین امتیاز {s}' },
  interviewIntroHow: {
    en: 'You will hear each question, get a few seconds to think, then answer out loud. You can answer each question again to improve.',
    fa: 'هر سؤال را می‌شنوی، چند ثانیه وقت فکر داری، بعد بلند جواب می‌دهی. می‌توانی هر سؤال را دوباره جواب بدهی تا بهتر شود.',
  },
  interviewStart: { en: 'Start the interview', fa: 'شروع مصاحبه' },
  interviewQuestionN: { en: 'Question {i} of {n}', fa: 'سؤال {i} از {n}' },
  interviewListen: { en: 'Listen to the question', fa: 'به سؤال گوش بده' },
  interviewReplay: { en: 'Play again', fa: 'پخش دوباره' },
  interviewShowTranslation: { en: 'Show translation', fa: 'نمایش ترجمه' },
  interviewPrep: { en: 'Think about your answer… {s}', fa: 'به جوابت فکر کن… {s}' },
  interviewAnswerNow: { en: 'Answer now', fa: 'الان جواب بده' },
  interviewStopHint: { en: 'Tap to finish your answer', fa: 'برای تمام کردن جواب بزن' },
  interviewMinHint: { en: 'Speak for at least {min} seconds', fa: 'حداقل {min} ثانیه صحبت کن' },
  interviewTryAgain: { en: 'Answer again', fa: 'دوباره جواب بده' },
  interviewNext: { en: 'Next question', fa: 'سؤال بعد' },
  interviewFinish: { en: 'Finish and see the report', fa: 'پایان و دیدن گزارش' },
  interviewSample: { en: 'Sample answer', fa: 'جواب نمونه' },
  interviewTip: { en: 'Tip', fa: 'نکته' },
  interviewReportTitle: { en: 'Your interview report', fa: 'گزارش مصاحبه‌ی تو' },
  interviewReportSummary: { en: '{a} of {n} questions answered', fa: 'به {a} از {n} سؤال جواب دادی' },
  interviewReportImproved: { en: 'Answering again improved {n} answers', fa: 'جواب دوباره {n} جواب را بهتر کرد' },
  interviewTries: { en: '{n} tries · best {s}', fa: '{n} تلاش · بهترین {s}' },
  interviewDone: { en: 'Back to interviews', fa: 'برگشت به مصاحبه‌ها' },
  specialtyTitle: { en: 'English for your field', fa: 'زبان تخصصی' },
  specialtySubtitle: { en: 'Words, scenes and interviews for your profession', fa: 'لغت، صحنه و مصاحبه‌ی رشته‌ی خودت' },
  specialtyEmpty: { en: 'No fields yet. Check back soon!', fa: 'هنوز رشته‌ای منتشر نشده. به‌زودی!' },
  specialtyLocked: { en: 'Opens at {level}. Keep going on your learning path!', fa: 'از سطح {level} باز می‌شود. مسیر آموزشی‌ات را ادامه بده!' },
  specialtyWords: { en: 'Key words', fa: 'لغت‌های رشته' },
  specialtyWordCount: { en: '{n} words', fa: '{n} لغت' },
  specialtyAddAll: { en: 'Add all to Leitner', fa: 'افزودن همه به لایتنر' },
  specialtyAdded: { en: '{n} words added to Leitner', fa: '{n} لغت به لایتنر اضافه شد' },
  specialtyPractice: { en: 'Practise', fa: 'تمرین' },
  specialtyContent_scene: { en: 'Scene', fa: 'صحنه' },
  specialtyContent_podcast: { en: 'Podcast', fa: 'پادکست' },
  specialtyContent_speaking_topic: { en: 'Speaking', fa: 'صحبت' },
  specialtyContent_writing_prompt: { en: 'Writing', fa: 'نوشتن' },
  specialtyContent_interview: { en: 'Interview', fa: 'مصاحبه' },
};

/**
 * translate ترجمه را بیرون از درخت React برمی‌گرداند؛ برای جاهایی مثل
 * سرویس نوتیفیکیشن که به هوک useLanguage دسترسی ندارند و باید متن را با
 * زبانِ دستگاه بسازند.
 */
export const translate = (lang: Language, key: string): string => {
  const entry = translations[key];
  if (!entry) return key;
  return entry[lang] || entry.en;
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
  // دیفالت همیشه فارسی است — مخاطب اصلی LingoFlow کاربر ایرانی است (بخش ۱۹
  // سند محصول)، پس صرف‌نظر از locale دستگاه، اپ با فارسی باز می‌شود. کاربر
  // همچنان می‌تواند از تنظیمات دستی به انگلیسی سوییچ کند.
  const [language, setLanguage] = useState<Language>('fa');

  // t باید پایدار باشد: در سراسر اپ داخل dependency array هوک‌ها می‌نشیند، پس
  // اگر هر رندر تابع تازه‌ای باشد، آن هوک‌ها هم بی‌دلیل دوباره اجرا می‌شوند.
  const t = useCallback(
    (key: string): string => translate(language, key),
    [language]
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
