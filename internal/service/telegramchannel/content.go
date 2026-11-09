package telegramchannel

import (
	"fmt"
	"html"
	"strings"
	"time"
)

// DailyLesson ساختار یک درس/نکته‌ی کوتاه روزانه برای کانال تلگرام
type DailyLesson struct {
	Theme       string // موضوع (مثلاً: اصطلاح روزمره، انگلیسی کاری، تلفظ و سایه‌زنی)
	KeyPhrase   string // عبارت یا جمله کلیدی انگلیسی
	Phonetic    string // راهنمای تلفظ روان
	PersianMean string // معنی فارسی دقیق و کاربرد
	DialogueA   string // دیالوگ گوینده اول
	DialogueB   string // دیالوگ گوینده دوم
	Tip         string // نکته آموزشی یا گرامری
	AppPractice string // راهنمای تمرین در اپلیکیشن لینگوفلو
}

// curatedLessons لیست دروس کاربردی و گلچین‌شده
var curatedLessons = []DailyLesson{
	{
		Theme:       "اصطلاح روزمره (Daily Idiom)",
		KeyPhrase:   "Cut to the chase",
		Phonetic:    "/kʌt tuː ðə tʃeɪs/",
		PersianMean: "یک‌راست رفتن سر اصل مطلب، حاشیه نرفتن",
		DialogueA:   "We don't have much time before the meeting.",
		DialogueB:   "Alright, let's cut to the chase: what's the final price?",
		Tip:         "این اصطلاح از سینما آمده؛ جایی که صحنه‌های خسته‌کننده کات می‌شد و مستقیماً به صحنه تعقیب و گریز (chase) می‌رفتند.",
		AppPractice: "این عبارت را امروز در بخش «سایه‌زنی (Shadowing)» با لهجه نیتیو تمرین کنید و نمره تلفظ بگیرید!",
	},
	{
		Theme:       "مکالمه کاری و جلسات (Business English)",
		KeyPhrase:   "Get the ball rolling",
		Phonetic:    "/ɡet ðə bɔːl ˈroʊ.lɪŋ/",
		PersianMean: "شروع کردن یک فعالیت یا جلسه، استارت کار را زدن",
		DialogueA:   "Is everyone here?",
		DialogueB:   "Yes, let's get the ball rolling with the first agenda item.",
		Tip:         "یکی از طبیعی‌ترین جملات برای شروع یک جلسه رسمی یا دوستانه در شرکت‌ها و استارتاپ‌ها.",
		AppPractice: "در ماک اینترویو و تمرین‌های آزاد اپلیکیشن لینگوفلو این جمله را در شروع صحبت خود به کار ببرید.",
	},
	{
		Theme:       "تکنیک سایه‌زنی و تلفظ (Shadowing Technique)",
		KeyPhrase:   "I couldn't agree more!",
		Phonetic:    "/aɪ ˈkʊd.ənt əˈɡriː mɔːr/",
		PersianMean: "کاملاً باهات موافقم! (بیشتر از این نمی‌شد موافق باشم)",
		DialogueA:   "This project needs way more focus on user experience.",
		DialogueB:   "I couldn't agree more! That's our top priority.",
		Tip:         "به جای گفتن ساده‌ی 'I agree'، استفاده از این جمله سطح زبان شما را از متوسط به پیشرفته ارتقا می‌دهد.",
		AppPractice: "همین الان میکروفون اپلیکیشن لینگوفلو را باز کنید و استرس کلمات را بسنجید.",
	},
	{
		Theme:       "اصطلاح در شرایط استرس یا سختی (Resilience)",
		KeyPhrase:   "Bite the bullet",
		Phonetic:    "/baɪt ðə ˈbʊl.ɪt/",
		PersianMean: "دندان روی جگر گذاشتن، کار سخت اما اجتناب‌ناپذیر را دلیرانه انجام دادن",
		DialogueA:   "The dentist appointment is going to be painful.",
		DialogueB:   "I know, but you just have to bite the bullet and go.",
		Tip:         "وقتی می‌دانید انجام کاری سخت است اما راه فراری نیست، از این اصطلاح استفاده کنید.",
		AppPractice: "در سناریوهای داستانی لینگوفلو، احساس و لحن کاراکترها را هنگام بیان این اصطلاح تقلید کنید.",
	},
	{
		Theme:       "مکالمه روزمره در سفر و کافه (Spoken Fluency)",
		KeyPhrase:   "It's on the house!",
		Phonetic:    "/ɪts ɑːn ðə haʊs/",
		PersianMean: "مهمان ما هستید! (رایگان به حساب کافه یا رستوران)",
		DialogueA:   "Excuse me, how much do I owe you for the refill?",
		DialogueB:   "Don't worry about it, it's on the house today!",
		Tip:         "عبارت بسیار متداول در کشورهای انگلیسی‌زبان وقتی صاحب کسب‌وکار نمی‌خواهد هزینه‌ای بگیرد.",
		AppPractice: "مکالمه کامل Ordering Coffee را در بخش سناریوهای رستوران در لینگوفلو مرور کنید.",
	},
	{
		Theme:       "هماهنگی و کار تیمی (Teamwork Collocation)",
		KeyPhrase:   "Be on the same page",
		Phonetic:    "/biː ɑːn ðə seɪm peɪdʒ/",
		PersianMean: "هم‌نظر بودن، درک مشترک داشتن، یک‌صدا بودن",
		DialogueA:   "Before we launch the app, let's review the milestones.",
		DialogueB:   "Great idea, just to make sure everyone is on the same page.",
		Tip:         "در ایمیل‌ها و مکالمات اداری برای جلوگیری از ناهماهنگی این عبارت فوق‌العاده کاربردی است.",
		AppPractice: "در بخش مکالمه هوش مصنوعی اپ لینگوفلو با هوش مصنوعی درباره پروژه‌تان بحث کنید.",
	},
	{
		Theme:       "پایان دادن به کار یا روز کاری (Work-Life Balance)",
		KeyPhrase:   "Call it a day",
		Phonetic:    "/kɔːl ɪt ə deɪ/",
		PersianMean: "برای امروز کار را تعطیل کردن، دست از کار کشیدن",
		DialogueA:   "We've been coding for eight hours straight.",
		DialogueB:   "You're right. Let's call it a day and continue tomorrow morning.",
		Tip:         "مترادف صمیمی و طبیعی برای 'Finish work for today'.",
		AppPractice: "تمرین صوتی این عبارت را در لیسنینگ اپ گوش داده و تمرین کنید.",
	},
	{
		Theme:       "اصطلاح ابراز تعجب یا اتفاق خوب (Casual Expressions)",
		KeyPhrase:   "Speak of the devil!",
		Phonetic:    "/spiːk əv ðə ˈdev.əl/",
		PersianMean: "حلال‌زاده! (درست وقتی داشتیم راجبت حرف می‌زدیم اومدی)",
		DialogueA:   "Have you seen Sarah today?",
		DialogueB:   "Speak of the devil! Here she comes right now.",
		Tip:         "معادل ضرب‌المثل حلال‌زاده در فارسی.",
		AppPractice: "در بخش Roleplay اپلیکیشن نقش نفر B را بازی کنید.",
	},
	{
		Theme:       "سلامت و حال جسمی (Daily Wellbeing)",
		KeyPhrase:   "Under the weather",
		Phonetic:    "/ˈʌn.dɚ ðə ˈweð.ɚ/",
		PersianMean: "کمی ناخوش بودن، کسل یا سرماخورده بودن",
		DialogueA:   "Are you coming to the party tonight?",
		DialogueB:   "I feel a bit under the weather, so I think I'll stay home and rest.",
		Tip:         "به جای گفتن مستقیم 'I am sick'، نیتیوها معمولاً ملایم‌تر می‌گویند 'I'm a bit under the weather'.",
		AppPractice: "درس مکالمات پزشکی و مطب دکتر را در دوره‌های تخصصی لینگوفلو سایه‌زنی کنید.",
	},
	{
		Theme:       "دقت و درست به هدف زدن (Accuracy & Feedback)",
		KeyPhrase:   "Hit the nail on the head",
		Phonetic:    "/hɪt ðə neɪl ɑːn ðə hed/",
		PersianMean: "دقیقاً درست گفتن، به خال زدن، حرف حساب زدن",
		DialogueA:   "I think the real reason users love the app is its shadowing scoring system.",
		DialogueB:   "You hit the nail on the head! That's exactly our key advantage.",
		Tip:         "برای تایید قاطعانه و تشویق نظر یک نفر بسیار حرفه‌ای و طبیعی است.",
		AppPractice: "تلفظ ضربه محکم روی کلمات 'nail' و 'head' را در سنجش صوت اپ بسنجید.",
	},
	{
		Theme:       "تصمیم‌گیری (Decision Making)",
		KeyPhrase:   "Make up your mind",
		Phonetic:    "/meɪk ʌp jʊr maɪnd/",
		PersianMean: "تصمیمت را بگیر، مردد نباش",
		DialogueA:   "Should I practice English speaking or reading tonight?",
		DialogueB:   "Make up your mind! Or even better, do both for 15 minutes in LingoFlow.",
		Tip:         "مترادف روزمره و طبیعی‌ترِ فعل 'Decide'.",
		AppPractice: "با تمرین روزانه حداقل ۱۵ دقیقه در اپلیکیشن زنجیره تمرین (Streak) خود را حفظ کنید.",
	},
	{
		Theme:       "مصاحبه کاری و شغلی (Job Interview Prep)",
		KeyPhrase:   "Think outside the box",
		Phonetic:    "/θɪŋk ˌaʊtˈsaɪd ðə bɑːks/",
		PersianMean: "خلاقانه فکر کردن، خارج از چارچوب‌های سنتی اندیشیدن",
		DialogueA:   "How did you solve that client retention challenge?",
		DialogueB:   "We had to think outside the box and redesign our onboarding experience.",
		Tip:         "یک عبارت کلیدی در رزومه و مصاحبه‌های استخدامی شرکت‌های بین‌المللی.",
		AppPractice: "در بخش جدید «ماک اینترویو (Mock Interview)» اپلیکیشن به این سبک سوالات پاسخ صوتی بدهید.",
	},
	{
		Theme:       "هزینه و ارزش (Everyday Shopping)",
		KeyPhrase:   "Cost an arm and a leg",
		Phonetic:    "/kɑːst ən ɑːrm ənd ə leɡ/",
		PersianMean: "خیلی گران بودن، سر به فلک کشیدن قیمت",
		DialogueA:   "Did you buy that flagship laptop?",
		DialogueB:   "No way, it costs an arm and a leg! I found a reasonable alternative.",
		Tip:         "کنایه طنزآمیز برای چیزهایی که بیش از حد گران‌قیمت هستند.",
		AppPractice: "در بخش سناریوهای خرید اپ لینگوفلو تفاوت‌های اصطلاحات چانه‌زنی را تمرین کنید.",
	},
	{
		Theme:       "یادگیری و مطالعه عمیق (Study Habit)",
		KeyPhrase:   "Hit the books",
		Phonetic:    "/hɪt ðə bʊks/",
		PersianMean: "شروع به درس خواندن جدی، مطالعه کردن",
		DialogueA:   "Wanna hang out this afternoon?",
		DialogueB:   "I wish I could, but I have an English exam tomorrow. Time to hit the books!",
		Tip:         "اصطلاح غیررسمی بسیار پرطرفدار در دانشگاه‌ها و بین دانش‌آموزان.",
		AppPractice: "امروز ۱۰ لغت جدید جعبه لایتنر اپلیکیشن را مرور و تلفظ کنید.",
	},
	{
		Theme:       "آسانی و سهولت کاری (Ease & Confidence)",
		KeyPhrase:   "A piece of cake",
		Phonetic:    "/ə piːs əv keɪk/",
		PersianMean: "مثل آب خوردن، خیلی آسان و بی‌دردسر",
		DialogueA:   "Was the driving test difficult?",
		DialogueB:   "Not at all! After all the practice, it was a piece of cake.",
		Tip:         "وقتی تسلط پیدا کنید، انگلیسی صحبت کردن هم براتون Piece of cake خواهد شد!",
		AppPractice: "با تمرین مکرر سایه‌زنی جملات را روان مانند زبان مادری ادا کنید.",
	},
	{
		Theme:       "به یاد داشتن نکته مهم (Mental Reminder)",
		KeyPhrase:   "Bear in mind",
		Phonetic:    "/ber ɪn maɪnd/",
		PersianMean: "به خاطر سپردن، مد نظر داشتن، حواست باشه که...",
		DialogueA:   "I'm starting my IELTS preparation this week.",
		DialogueB:   "Bear in mind that consistency matters way more than long study hours.",
		Tip:         "تفاوت اصلی زبان‌آموزان موفق در تداوم روزانه است؛ روزی ۱۵ دقیقه تمرین معجزه می‌کند.",
		AppPractice: "نوتیفیکیشن تمرین صبحگاهی اپلیکیشن را فعال نگه دارید تا عادت روزانه‌تان تثبیت شود.",
	},
}

// FormatTelegramMessageHTML پیام را با قالب رسمی و امن HTML تلگرام تولید می‌کند تا هیچ خطای Parse رخ ندهد.
func FormatTelegramMessageHTML(lesson DailyLesson, channelID, appURL string) string {
	var b strings.Builder

	now := time.Now()
	dateStr := now.Format("Monday, 02 Jan 2006")

	b.WriteString("☀️ <b>صبح بخیر همراهان گرامی | Good Morning!</b>\n")
	b.WriteString(fmt.Sprintf("📅 <i>%s</i>\n\n", html.EscapeString(dateStr)))

	b.WriteString(fmt.Sprintf("🏷 <b>موضوع امروز:</b> %s\n\n", html.EscapeString(lesson.Theme)))

	b.WriteString("🎯 <b>عبارت کلیدی (Key Phrase):</b>\n")
	b.WriteString(fmt.Sprintf("▫️ <code>%s</code>\n", html.EscapeString(lesson.KeyPhrase)))
	if lesson.Phonetic != "" {
		b.WriteString(fmt.Sprintf("🗣 <i>تلفظ:</i> <code>%s</code>\n", html.EscapeString(lesson.Phonetic)))
	}
	b.WriteString(fmt.Sprintf("🇮🇷 <b>معنی فارسی:</b> %s\n\n", html.EscapeString(lesson.PersianMean)))

	b.WriteString("💬 <b>مکالمه واقعی (Mini Dialogue):</b>\n")
	b.WriteString(fmt.Sprintf("▫️ <b>A:</b> \"%s\"\n", html.EscapeString(lesson.DialogueA)))
	b.WriteString(fmt.Sprintf("▫️ <b>B:</b> \"%s\"\n\n", html.EscapeString(lesson.DialogueB)))

	if lesson.Tip != "" {
		b.WriteString("💡 <b>نکته یادگیری:</b>\n")
		b.WriteString(fmt.Sprintf("%s\n\n", html.EscapeString(lesson.Tip)))
	}

	b.WriteString("🎙 <b>تمرین امروز در اپلیکیشن LingoFlow:</b>\n")
	b.WriteString(fmt.Sprintf("«%s»\n\n", html.EscapeString(lesson.AppPractice)))

	b.WriteString("━━━━━━━━━━━━━━━━━━━━\n")
	b.WriteString("📲 <b>همین حالا در اپلیکیشن لینگوفلو تمرین کنید:</b>\n")
	if appURL == "" {
		appURL = "https://lingoflow.ir"
	}
	b.WriteString(fmt.Sprintf("🔗 <a href=\"%s\">ورود به اپلیکیشن و شروع تمرین</a>\n", html.EscapeString(appURL)))

	if channelID != "" {
		cleanChan := strings.TrimPrefix(channelID, "@")
		if !strings.HasPrefix(cleanChan, "-") {
			b.WriteString(fmt.Sprintf("🆔 @%s\n", html.EscapeString(cleanChan)))
		}
	}

	return b.String()
}

// GetLessonForToday یک درس بر اساس روز سال انتخاب می‌کند تا هر روز متفاوت و متنوع باشد
func GetLessonForToday(date time.Time) DailyLesson {
	day := date.YearDay()
	idx := day % len(curatedLessons)
	return curatedLessons[idx]
}
