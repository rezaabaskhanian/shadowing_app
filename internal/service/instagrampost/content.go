package instagrampost

import (
	"fmt"
	"strings"
	"time"
)

// InstagramLesson ساختار محتوای یک پست اسلایدی اینستاگرام
type InstagramLesson struct {
	ID          int    `json:"id"`
	Theme       string `json:"theme"`
	HookTitle   string `json:"hook_title"`   // عنوان جذاب اسلاید ۱ (کاور)
	Subtitle    string `json:"subtitle"`     // زیرعنوان کاور
	KeyPhrase   string `json:"key_phrase"`   // عبارت یا جمله کلیدی انگلیسی
	Phonetic    string `json:"phonetic"`     // تلفظ فونتیک
	PersianMean string `json:"persian_mean"` // معنی فارسی دقیق
	DialogueA   string `json:"dialogue_a"`   // دیالوگ A
	DialogueAFa string `json:"dialogue_a_fa"` // ترجمه فارسی دیالوگ A
	DialogueB   string `json:"dialogue_b"`   // دیالوگ B
	DialogueBFa string `json:"dialogue_b_fa"` // ترجمه فارسی دیالوگ B
	Tip         string `json:"tip"`          // نکته کاربردی
	AppPractice string `json:"app_practice"` // تمرین پیشنهادی در اپلیکیشن
	AppCTA      string `json:"app_cta"`      // دعوت به اقدام اپلیکیشن
	Caption     string `json:"caption"`      // متن کامل کپشن
	Hashtags    string `json:"hashtags"`     // هشتگ‌های ترند
}

var curatedInstagramLessons = []InstagramLesson{
	{
		ID:          1,
		Theme:       "اصطلاح روزمره (Daily Idiom)",
		HookTitle:   "دیگه حاشیه نرو! ❌",
		Subtitle:    "چطوری به انگلیسی بگیم «برو سر اصل مطلب»؟",
		KeyPhrase:   "Cut to the chase",
		Phonetic:    "/kʌt tuː ðə tʃeɪs/",
		PersianMean: "یک‌راست رفتن سر اصل مطلب، حاشیه نرفتن",
		DialogueA:   "We don't have much time before the meeting.",
		DialogueAFa: "قبل جلسه وقت زیادی نداریم.",
		DialogueB:   "Alright, let's cut to the chase: what's the final price?",
		DialogueBFa: "باشه، بیا بریم سر اصل مطلب: قیمت نهایی چنده؟",
		Tip:         "این اصطلاح از سینمای کلاسیک آمده؛ جایی که صحنه‌های خسته‌کننده کات می‌شد و یک‌راست به صحنه تعقیب‌وگریز (Chase) می‌رفتند.",
		AppPractice: "می‌خوای این عبارت رو با لهجه نیتیو تمرین کنی؟ میکروفون اپلیکیشن لینگوفلو رو باز کن و نمره هوش مصنوعی بگیر!",
	},
	{
		ID:          2,
		Theme:       "مکالمه کاری (Business English)",
		HookTitle:   "شروع حرفه‌ای جلسات کاری 💼",
		Subtitle:    "نیتیوها چطور استارت یک جلسه یا پروژه رو می‌زنن؟",
		KeyPhrase:   "Get the ball rolling",
		Phonetic:    "/ɡet ðə bɔːl ˈroʊ.lɪŋ/",
		PersianMean: "استارت کار را زدن، شروع کردن یک جلسه یا پروژه",
		DialogueA:   "Is everyone here?",
		DialogueAFa: "همه اومدن؟",
		DialogueB:   "Yes, let's get the ball rolling with the first agenda item.",
		DialogueBFa: "بله، بیا با اولین آیتم دستور جلسه استارت کار رو بزنیم.",
		Tip:         "به جای گفتن خشکِ 'Let's start'، این عبارت سطح زبان شما را در محیط‌های بین‌المللی ارتقا می‌دهد.",
		AppPractice: "در بخش ماک اینترویو و مصاحبه‌های تخصصی لینگوفلو، صحبت کردن در محیط اداری رو تمرین کنید.",
	},
	{
		ID:          3,
		Theme:       "تکنیک سایه‌زنی و تلفظ (Shadowing)",
		HookTitle:   "دیگه نگو I agree! ✋",
		Subtitle:    "چطور خیلی طبیعی‌تر بگیم «شدیداً باهات موافقم»؟",
		KeyPhrase:   "I couldn't agree more!",
		Phonetic:    "/aɪ ˈkʊd.ənt əˈɡriː mɔːr/",
		PersianMean: "کاملاً باهات موافقم! (بیشتر از این نمی‌شد موافق باشم)",
		DialogueA:   "This project needs way more focus on user experience.",
		DialogueAFa: "این پروژه به تمرکز خیلی بیشتری روی تجربه کاربری نیاز داره.",
		DialogueB:   "I couldn't agree more! That's our top priority.",
		DialogueBFa: "کاملاً باهات موافقم! اولویت اول ما همینه.",
		Tip:         "استرس اصلی جمله روی کلمه 'more' است. لحن گوینده قاطع و پرانرژی ادا می‌شود.",
		AppPractice: "همین الان با شادوئینگ در لینگوفلو، استرس کلمات و ریتم گوینده رو تقلید کن.",
	},
	{
		ID:          4,
		Theme:       "اصطلاح کاربردی (Everyday Idiom)",
		HookTitle:   "این اصطلاح انگلیسی رو شنیدی؟ 🦷",
		Subtitle:    "وقتی چاره‌ای جز انجام یه کار سخت نداری چی میگی؟",
		KeyPhrase:   "Bite the bullet",
		Phonetic:    "/baɪt ðə ˈbʊl.ɪt/",
		PersianMean: "دندان روی جگر گذاشتن، تن دادن به کاری سخت اما لازم",
		DialogueA:   "The dentist appointment is going to be painful.",
		DialogueAFa: "نوبت دندان‌پزشکی قراره دردناک باشه.",
		DialogueB:   "I know, but you just have to bite the bullet and go.",
		DialogueBFa: "می‌دونم، ولی دیگه باید دندان رو جگر بذاری و بری.",
		Tip:         "در گذشته قبل از عمل‌های جراحی در میدان جنگ گلوله‌ای را بین دندان‌ها می‌گذاشتند تا درد را تحمل کنند.",
		AppPractice: "در سناریوهای داستانی لینگوفلو، لحن کاراکترها را هنگام بیان این اصطلاح گوش بده و تقلید کن.",
	},
	{
		ID:          5,
		Theme:       "مکالمه در کافه و سفر (Travel English)",
		HookTitle:   "مهمون ما هستید! ☕",
		Subtitle:    "وقتی کافه‌دار می‌خواد بگه حساب نمی‌کنیم چی میگه؟",
		KeyPhrase:   "It's on the house!",
		Phonetic:    "/ɪts ɑːn ðə haʊs/",
		PersianMean: "مهمان ما هستید! (رایگان به حساب کافه یا رستوران)",
		DialogueA:   "Excuse me, how much do I owe you for the refill?",
		DialogueAFa: "ببخشید، چقدر بابت قهوه دوم بهتون بدهکارم؟",
		DialogueB:   "Don't worry about it, it's on the house today!",
		DialogueBFa: "نگرانش نباشید، امروز مهمون کافه ما هستید!",
		Tip:         "عبارتی بسیار متداول و خودمانی در کشورهای انگلیسی‌زبان برای پذیرایی بدون دریافت هزینه.",
		AppPractice: "مکالمه کامل کافه و سفارش قهوه را در پادکست‌های سریالی لینگوفلو گوش کن و تکرار کن.",
	},
	{
		ID:          6,
		Theme:       "کار تیمی و هماهنگی (Teamwork)",
		HookTitle:   "یک‌صدا و هم‌نظر بودن 🤝",
		Subtitle:    "چطور بگیم «همه اعضای تیم روی یک موضوع هم‌عقیده‌اند»؟",
		KeyPhrase:   "Be on the same page",
		Phonetic:    "/biː ɑːn ðə seɪm peɪdʒ/",
		PersianMean: "هم‌نظر بودن، درک مشترک داشتن، یک‌صدا بودن",
		DialogueA:   "Before we launch the app, let's review the milestones.",
		DialogueAFa: "قبل از انتشار اپ، بیا فازهای کلیدی رو مرور کنیم.",
		DialogueB:   "Great idea, just to make sure everyone is on the same page.",
		DialogueBFa: "ایده عالیه، فقط برای اینکه مطمئن بشیم همه هم‌نظر و هماهنگیم.",
		Tip:         "در ایمیل‌ها و جلسات اداری برای جلوگیری از ناهماهنگی این عبارت بی‌نظیر است.",
		AppPractice: "با چت هوش مصنوعی لینگوفلو یک جلسه کاری شبیه‌سازی کن و از این اصطلاح استفاده کن.",
	},
	{
		ID:          7,
		Theme:       "پایان روز کاری (Work Routine)",
		HookTitle:   "برای امروز دیگه بسه! 🛑",
		Subtitle:    "نیتیوها وقتی می‌خوان کار رو برای امروز تعطیل کنن چی میگن؟",
		KeyPhrase:   "Call it a day",
		Phonetic:    "/kɔːl ɪt ə deɪ/",
		PersianMean: "دست از کار کشیدن، برای امروز کار را تمام کردن",
		DialogueA:   "We've been coding for eight hours straight.",
		DialogueAFa: "هشت ساعت یکسره داریم کد می‌زنیم.",
		DialogueB:   "You're right. Let's call it a day and continue tomorrow morning.",
		DialogueBFa: "حق با توئه. بیا برای امروز تعطیلش کنیم و فردا صبح ادامه بدیم.",
		Tip:         "طبیعی‌ترین و رایج‌ترین جایگزین برای 'Finish work for today'.",
		AppPractice: "در لیسنینگ و تمرین‌های روزانه لینگوفلو تلفظ سریع و پیوسته این عبارت را بسنجید.",
	},
	{
		ID:          8,
		Theme:       "اصطلاح روزمره و شوخی (Casual Expression)",
		HookTitle:   "حلال‌زاده! 😈",
		Subtitle:    "چطور به انگلیسی بگیم «داشتیم راجع بهت حرف می‌زدیم اومدی»؟",
		KeyPhrase:   "Speak of the devil!",
		Phonetic:    "/spiːk əv ðə ˈdev.əl/",
		PersianMean: "حلال‌زاده! (درست وقتی داشتیم درباره‌ات حرف می‌زدیم رسیدی)",
		DialogueA:   "Have you seen Sarah today?",
		DialogueAFa: "امروز سارا رو دیدی؟",
		DialogueB:   "Speak of the devil! Here she comes right now.",
		DialogueBFa: "حلال‌زاده! ببین خودش هم اومد.",
		Tip:         "کامل این ضرب‌المثل 'Speak of the devil and he doth appear' بوده که امروزه فقط ۳ کلمه اول را می‌گویند.",
		AppPractice: "در بخش نقش‌آفرینی (Roleplay) اپلیکیشن لینگوفلو به جای شخصیت‌ها صحبت کنید.",
	},
}

// BuildInstagramCaption ساخت کپشن استاندارد، جذاب و ایموجی‌دار برای پست اینستاگرام
func BuildInstagramCaption(l InstagramLesson) string {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("🔥 %s\n\n", l.HookTitle))
	sb.WriteString(fmt.Sprintf("🇬🇧 %s\n", l.KeyPhrase))
	sb.WriteString(fmt.Sprintf("🗣 تلفظ: %s\n", l.Phonetic))
	sb.WriteString(fmt.Sprintf("🇮🇷 معنی: %s\n\n", l.PersianMean))

	sb.WriteString("💬 مکالمه در دنیای واقعی:\n")
	sb.WriteString(fmt.Sprintf("🅰️ %s\n", l.DialogueA))
	sb.WriteString(fmt.Sprintf("   ↳ %s\n", l.DialogueAFa))
	sb.WriteString(fmt.Sprintf("🅱️ %s\n", l.DialogueB))
	sb.WriteString(fmt.Sprintf("   ↳ %s\n\n", l.DialogueBFa))

	if l.Tip != "" {
		sb.WriteString(fmt.Sprintf("💡 نکته طلایی:\n%s\n\n", l.Tip))
	}

	sb.WriteString("━━━━━━━━━━━━━━━\n")
	sb.WriteString("🎙️ می‌خوای تلفظت مثل یک نیتیو بشه و لهجه‌ات اصلاح شه؟\n")
	sb.WriteString("همین الان اپلیکیشن «لینگوفلو» رو رایگان از لینک بیو یا کافه‌بازار دانلود کن و با هوش مصنوعی تمرین سایه‌زنی (Shadowing) انجام بده!\n\n")

	sb.WriteString("📌 این پست رو سیو کن تا بعداً گمش نکنی!\n")
	sb.WriteString("❤️ اگر برات مفید بود لایک کن و برای دوستات بفرست.\n\n")

	sb.WriteString(DefaultHashtags)

	return sb.String()
}

const DefaultHashtags = `#آموزش_زبان #اصطلاحات_انگلیسی #زبان_انگلیسی #مکالمه_انگلیسی #تلفظ_انگلیسی #انگلیسی_روزمره #لینگوفلو #سایه_زنی #یادگیری_زبان #shadowing #lingoflow`

// GetLessonByDay بر اساس روز جاری یا شماره اندیس درس مناسب را برمی‌گرداند
func GetLessonByDay(dayOffset int) InstagramLesson {
	now := time.Now().AddDate(0, 0, dayOffset)
	// روز سال برای ایجاد یک تنوع دائمی
	idx := (now.YearDay() + dayOffset) % len(curatedInstagramLessons)
	if idx < 0 {
		idx = (idx + len(curatedInstagramLessons)) % len(curatedInstagramLessons)
	}
	lesson := curatedInstagramLessons[idx]
	if lesson.AppCTA == "" {
		lesson.AppCTA = "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و لینک بیو"
	}
	lesson.Caption = BuildInstagramCaption(lesson)
	lesson.Hashtags = DefaultHashtags
	return lesson
}

// GetAllLessons تمام درس‌های آماده اینستاگرام را برمی‌گرداند
func GetAllLessons() []InstagramLesson {
	result := make([]InstagramLesson, len(curatedInstagramLessons))
	for i, l := range curatedInstagramLessons {
		if l.AppCTA == "" {
			l.AppCTA = "دانلود رایگان اپلیکیشن «لینگوفلو» از کافه‌بازار و لینک بیو"
		}
		l.Caption = BuildInstagramCaption(l)
		l.Hashtags = DefaultHashtags
		result[i] = l
	}
	return result
}
