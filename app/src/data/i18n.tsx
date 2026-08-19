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
  tapToReveal: { en: 'Tap card to reveal meaning', fa: 'برای دیدن معنی، کارت را لمس کن' },
  leitnerDoneTitle: { en: 'Review complete! 🎉', fa: 'مرور تمام شد! 🎉' },
  leitnerDoneText: {
    en: 'You went through all the cards in this list.',
    fa: 'همه‌ی کارت‌های این لیست را مرور کردی.',
  },
  reviewAgain: { en: 'Review Again', fa: 'مرور دوباره' },
  removeWord: { en: 'Remove from box', fa: 'حذف از جعبه' },
  level: { en: 'Level', fa: 'سطح' },
  levelBeginner: { en: 'Easy', fa: 'آسان' },
  levelIntermediate: { en: 'Medium', fa: 'متوسط' },
  levelAdvanced: { en: 'Professional', fa: 'حرفه‌ای' },
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
  categoryBusiness: { en: 'Business', fa: 'کاری' },
  categoryTravel: { en: 'Travel', fa: 'سفر' },
  categoryDaily: { en: 'Daily', fa: 'روزمره' },
  noScenariosInCategory: { en: 'No scenarios in this category yet.', fa: 'هنوز سناریویی در این دسته نیست.' },

  // Progress Screen
  greatJobTitle: { en: 'Great Job!', fa: 'عالی بود!' },
  greatJobSub: { en: 'You did amazing on today\'s practice.', fa: 'عملکرد فوق‌العاده‌ای در تمرین امروز داشتید.' },
  overallScore: { en: 'Overall Score', fa: 'نمره کل' },
  pronunciation: { en: 'Pronunciation', fa: 'تلفظ' },
  compareAudio: { en: 'Compare Audio', fa: 'مقایسه صدا' },
  vocabulary: { en: 'Vocabulary', fa: 'دایره واژگان' },
  listening: { en: 'Listening', fa: 'شنیداری' },
  weeklyActivity: { en: 'Weekly Activity', fa: 'فعالیت هفتگی' },
  weeklyActivitySub: { en: 'Minutes practiced per day', fa: 'دقیقه‌های تمرین در هر روز' },
  skillBreakdown: { en: 'Skill Breakdown', fa: 'تفکیک مهارت‌ها' },
  achievementsTitle: { en: 'Achievements', fa: 'دستاوردها' },
  achievementsEmpty: {
    en: "No achievements yet — keep practicing to unlock your first one!",
    fa: 'هنوز دستاوردی نداری — به تمرین ادامه بده تا اولینش رو باز کنی!',
  },

  // Profile Screen
  profileTitle: { en: 'Profile', fa: 'حساب کاربری' },
  profileSub: { en: 'Manage your account and preferences.', fa: 'مدیریت حساب و تنظیمات' },
  learnerLevel: { en: 'Level A2 Learner', fa: 'زبان‌آموز سطح A2' },
  appLanguage: { en: 'App Language', fa: 'زبان برنامه' },
  helpFaq: { en: 'Help & FAQ', fa: 'راهنما و سوالات متداول' },
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
    en: 'Every 100 points = 20,000 Toman off a subscription',
    fa: 'هر ۱۰۰ امتیاز = ۲۰,۰۰۰ تومان تخفیف اشتراک',
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
  nextStep: { en: 'Next step', fa: 'مرحله بعد' },
  startShadowing: { en: 'Start Shadowing', fa: 'شروع سایه‌زنی' },
  stopShadowing: { en: 'Stop Shadowing', fa: 'توقف سایه‌زنی' },
  replayMaster: { en: 'Replay Master', fa: 'پخش دوباره صدای اصلی' },
  holdToRecord: { en: 'Hold to Record', fa: 'برای ضبط نگه دارید' },
  masterAudio: { en: 'Master Audio', fa: 'صدای اصلی' },
  yourRecording: { en: 'Your Recording', fa: 'صدای شما' },

  // ---- نمره‌دهی تلفظ ----
  scoringInProgress: { en: 'Scoring your pronunciation…', fa: 'در حال بررسی تلفظ شما…' },
  scoringFailed: {
    en: "Couldn't score this recording. Check your connection.",
    fa: 'نمره‌دهی انجام نشد. اتصال اینترنت را بررسی کنید.',
  },
  recordToSeeScore: {
    en: 'Record yourself to see your pronunciation score',
    fa: 'صدایت را ضبط کن تا نمره‌ی تلفظت را ببینی',
  },
  scoreEstimatedNote: {
    en: 'Rough estimate — pronunciation service unavailable, so words are not checked.',
    fa: 'نمره تقریبی است — سرویس بررسی تلفظ در دسترس نبود، پس کلمه‌ها بررسی نشده‌اند.',
  },
  scoreOverall: { en: 'Overall', fa: 'کل' },
  scorePronunciation: { en: 'Pronunciation', fa: 'تلفظ' },
  scoreFluency: { en: 'Fluency', fa: 'روانی' },
  weHeard: { en: 'We heard:', fa: 'آنچه شنیدیم:' },
  checkPronunciation: { en: 'Check my pronunciation', fa: 'تلفظم را بررسی کن' },
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
  nextLesson: { en: 'Next Lesson', fa: 'درس بعدی' },
  wordExcellent: { en: 'Excellent', fa: 'عالی' },
  wordGood: { en: 'Good', fa: 'خوب' },
  wordNeedsPractice: { en: 'Needs practice', fa: 'نیاز به تمرین' },
  
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
  reminderTime: { en: 'Reminder Time', fa: 'زمان یادآوری روزانه' },
  contentNotification: { en: 'Sentence & Vocab Alerts', fa: 'نوتیفیکیشن واژه‌ها و جملات' },
  contentNotificationSub: {
    en: 'Receive banner notifications featuring your Leitner words or lesson sentences.',
    fa: 'نمایش بنر نوتیفیکیشن حاوی واژگان جعبه لایتنر یا جملات مکالمات.'
  },
  notificationSource: { en: 'Notification Content Source', fa: 'منبع محتوای نوتیفیکیشن' },
  sourceLeitner: { en: 'Leitner Words', fa: 'واژگان لایتنر' },
  sourceSentences: { en: 'Lesson Sentences', fa: 'جملات درس‌ها' },
  sourceMixed: { en: 'Both (Mixed)', fa: 'ترکیب واژه‌ها و جملات' },
  sendTestNotification: { en: 'Send Test Notification Banner', fa: 'ارسال نوتیفیکیشن آزمایشی' },
  testNotificationSent: { en: 'Test notification displayed!', fa: 'نوتیفیکیشن آزمایشی نمایش داده شد!' },
  viewContent: { en: 'Review Now', fa: 'مشاهده و مرور' },

  // ---- Language Habit ----
  habitCardTitle: { en: 'Language Habit', fa: 'عادت زبانی' },
  habitRealSituations: { en: 'Real Situations', fa: 'موقعیت‌های واقعی' },
  habitSuggestTopic: { en: 'Suggest a Topic', fa: 'پیشنهاد موضوع' },
  habitContactUs: { en: 'Contact Us', fa: 'ارتباط با ما' },

  habitScreenTitle: { en: 'Real Situations', fa: 'موقعیت‌های واقعی' },
  habitTodaysMission: { en: "Today's Mission", fa: 'ماموریت امروز' },
  habitPracticeWhile: { en: 'Practice this dialogue while', fa: 'این دیالوگ را همزمان با' },
  habitStartMission: { en: 'Start Mission', fa: 'شروع ماموریت' },
  habitHistoryTitle: { en: 'Your Progress', fa: 'پیشرفت شما' },
  habitCompletedMissions: { en: 'Completed missions', fa: 'ماموریت‌های انجام‌شده' },
  habitCurrentStreak: { en: 'Current streak', fa: 'استریک فعلی' },
  habitTotalPracticeTime: { en: 'Total practice time', fa: 'کل زمان تمرین' },
  habitNoMissionToday: {
    en: 'No mission today. Check back tomorrow!',
    fa: 'امروز ماموریتی نیست. فردا دوباره سر بزن!',
  },
  habitDaysStreakSuffix: { en: 'day streak', fa: 'روز استریک' },
  habitMissionKicker: {
    en: "Today's Real Situation",
    fa: 'موقعیت واقعی امروز',
  },
  habitPurposeText: {
    en: "This is a real situation you'll actually run into — say this dialogue from memory while you're in it. The more you practice it, the more automatic it gets, until it comes out without thinking.",
    fa: 'این یک موقعیت واقعیه — باید این دیالوگ را از حفظ، توی همون موقعیت بگی. هرچی بیشتر تمرینش کنی، خودکارتر می‌شه، تا جایی که بدون فکر کردن از دهنت میاد بیرون.',
  },
  habitHowItWorksTitle: { en: 'How this mission works', fa: 'این ماموریت چطور کار می‌کند' },
  habitHowItWorks1: {
    en: 'First you get to see the full dialogue and memorize it.',
    fa: 'اول متن کامل دیالوگ را می‌بینی و فرصت داری حفظش کنی.',
  },
  habitHowItWorks2: {
    en: "Then the text is hidden and you say it from memory while you record.",
    fa: 'بعد متن مخفی می‌شود و باید حین ضبط، آن را از حفظ بگویی.',
  },
  habitHowItWorks3: {
    en: "At the end, you'll see your accuracy and earn points.",
    fa: 'در پایان، دقت گفتارت و امتیازی که گرفتی را می‌بینی.',
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
  habitPracticeAgainBtn: { en: 'Practice Again', fa: 'دوباره تمرین کن' },

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

  // ---- Paywall (خرید کافه‌بازاری / باز کردن صحنه‌های قفل) ----
  paywallTitle: { en: 'Unlock All Scenes', fa: 'باز کردن همه‌ی صحنه‌ها' },
  paywallSubtitle: {
    en: 'The first 30 scenes are always free. Get every scene for a full year with one payment.',
    fa: 'سی صحنه‌ی اول همیشه رایگانه. با یه پرداخت، همه‌ی صحنه‌ها رو یک سال کامل باز کن.',
  },
  paywallYourPoints: { en: 'Your points', fa: 'امتیازهای تو' },
  paywallPriceLabel: { en: 'Price', fa: 'قیمت' },
  paywallDiscountApplied: {
    en: 'Discount applied from your points',
    fa: 'تخفیف امتیازهات اعمال شد',
  },
  paywallBuyButton: { en: 'Buy — 1 Year Access', fa: 'خرید — دسترسی یک‌ساله' },
  paywallProcessing: { en: 'Processing your purchase…', fa: 'در حال پردازش خرید…' },
  paywallSuccessTitle: { en: 'Subscription activated!', fa: 'اشتراک فعال شد!' },
  paywallSuccessSub: {
    en: 'All scenes are unlocked for the next year.',
    fa: 'همه‌ی صحنه‌ها برای یک سال آینده باز شدن.',
  },
  paywallSuccessBtn: { en: "Great, let's go", fa: 'عالی، بریم' },
  paywallErrorGeneric: {
    en: "Couldn't complete the purchase. Please try again.",
    fa: 'خرید کامل نشد. دوباره امتحان کن.',
  },
  lockedBadge: { en: 'Locked', fa: 'قفل' },

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
