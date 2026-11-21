import json
import os

BOOK_CONFIGS = [
    {
        "book": 1,
        "level": "beginner",
        "migration_no": "088",
        "title": "4000 Essential Words — Book 1",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب اول): یادگیری پایه مکالمه و واژگان اساسی روزمره در قالب داستان و تمرین شادوئینگ",
        "category": "essential_words",
        "order_base": 100,
        "themes": [
            ("The Laboratory Experiment", "آزمایشگاه علمی", "science", [
                ("afraid", "ترسیده"), ("agree", "موافقت کردن"), ("angry", "عصبانی"), ("arrive", "رسیدن"),
                ("attack", "حمله کردن"), ("bottom", "پایین"), ("clever", "باهوش"), ("cruel", "بی‌رحم"),
                ("finally", "سرانجام"), ("hide", "پنهان شدن"), ("hunt", "شکار کردن"), ("lot", "زیاد"),
                ("middle", "وسط"), ("moment", "لحظه"), ("promise", "قول دادن"), ("reply", "پاسخ دادن"),
                ("safe", "امن"), ("trick", "حیله"), ("well", "چاه"), ("adventure", "ماجراجویی")
            ]),
            ("The Dog's Bell", "زنگوله سگ", "community", [
                ("appropriate", "مناسب"), ("avoid", "دوری کردن"), ("behave", "رفتار کردن"), ("calm", "آرام"),
                ("concern", "نگرانی"), ("content", "راضی"), ("expect", "انتظار داشتن"), ("frequently", "مکرراً"),
                ("habit", "عادت"), ("instruct", "آموزش دادن"), ("issue", "مسئله"), ("none", "هیچ‌کدام"),
                ("patient", "صبور"), ("positive", "مثبت"), ("punish", "تنبیه کردن"), ("represent", "نمایندگی کردن"),
                ("shake", "لرزاندن"), ("spread", "پخش شدن"), ("stroll", "قدم زدن"), ("village", "روستا")
            ]),
            ("The Lion and the Rabbit", "شیر و خرگوش", "wisdom", [
                ("believe", "باور داشتن"), ("belong", "متعلق بودن"), ("capture", "به دام انداختن"), ("clear", "روشن"),
                ("condition", "شرط"), ("destroy", "نابود کردن"), ("familiar", "آشنا"), ("imagine", "تصور کردن"),
                ("incident", "حادثه"), ("normal", "عادی"), ("protect", "محافظت کردن"), ("solve", "حل کردن"),
                ("strange", "عجیب"), ("truth", "حقیقت"), ("recognize", "شناختن"), ("forest", "جنگل"),
                ("wisdom", "خرد"), ("danger", "خطر"), ("deep", "عمیق"), ("shadow", "سایه")
            ]),
            ("The Boy and His Sled", "سورتمه برفی", "perseverance", [
                ("appreciate", "قدردانی کردن"), ("available", "موجود"), ("beat", "شکست دادن"), ("bright", "روشن"),
                ("celebrate", "جشن گرفتن"), ("determine", "مصمم بودن"), ("disappear", "ناپدید شدن"), ("else", "دیگر"),
                ("fair", "عادلانه"), ("flow", "جریان داشتن"), ("forward", "رو به جلو"), ("hill", "تپه"),
                ("level", "سطح"), ("lone", "تنها"), ("puddle", "چاله آب"), ("response", "پاسخ"),
                ("season", "فصل"), ("solution", "راهکار"), ("waste", "هدر دادن"), ("whether", "خواه")
            ]),
            ("A Journey to the Wild Field", "دشت وحشی", "nature", [
                ("aware", "آگاه"), ("badly", "به شدت"), ("belong", "تعلق داشتن"), ("continue", "ادامه دادن"),
                ("error", "اشتباه"), ("experience", "تجربه"), ("field", "دشت"), ("hurt", "صدمه دیدن"),
                ("judgment", "قضاوت"), ("likely", "محتمل"), ("normal", "عادی"), ("rare", "کمیاب"),
                ("relax", "آرامش یافتن"), ("request", "درخواست"), ("reside", "سکونت داشتن"), ("result", "نتیجه"),
                ("roll", "غلتیدن"), ("since", "از زمان"), ("visible", "مرئی"), ("wild", "وحشی")
            ]),
            ("The Friendly Ghost", "شبح مهربان", "compassion", [
                ("advantage", "مزیت"), ("cause", "علت"), ("choice", "انتخاب"), ("community", "جامعه"),
                ("dead", "مرده"), ("distance", "فاصله"), ("escape", "فرار کردن"), ("face", "روبرو شدن"),
                ("follow", "پیروی کردن"), ("fright", "ترس"), ("ghost", "شبح"), ("individual", "فرد"),
                ("pet", "حیوان خانگی"), ("reach", "رسیدن"), ("return", "بازگشتن"), ("survive", "زنده ماندن"),
                ("upset", "ناراحت"), ("voice", "صدا"), ("weather", "هوا"), ("wise", "دانا")
            ]),
            ("The Star Gazers", "رصد ستارگان", "astronomy", [
                ("allow", "اجازه دادن"), ("announce", "اعلام کردن"), ("beside", "کنار"), ("challenge", "چالش"),
                ("claim", "ادعا کردن"), ("condition", "شرایط"), ("contribute", "مشارکت"), ("difference", "تفاوت"),
                ("divide", "تقسیم کردن"), ("expert", "متخصص"), ("famous", "مشهور"), ("force", "نیرو"),
                ("harm", "آسیب"), ("lay", "قرار دادن"), ("peace", "آرامش"), ("prince", "شاهزاده"),
                ("protect", "محافظت"), ("sense", "حس"), ("sudden", "ناگهانی"), ("therefore", "بنابراین")
            ]),
            ("The Camping Trip", "اردوی جنگلی", "outdoors", [
                ("accept", "پذیرفتن"), ("arrange", "هماهنگ کردن"), ("attend", "شرکت کردن"), ("chase", "دنبال کردن"),
                ("contrast", "تضاد"), ("encourage", "تشویق کردن"), ("familiar", "آشنا"), ("grab", "گرفتن"),
                ("hang", "آویختن"), ("huge", "عظیم"), ("necessary", "ضروری"), ("pattern", "الگو"),
                ("propose", "پیشنهاد دادن"), ("purpose", "هدف"), ("release", "رها کردن"), ("require", "نیازمند بودن"),
                ("single", "تک"), ("success", "موفقیت"), ("tear", "اشک"), ("theory", "نظریه")
            ]),
            ("The Ocean Rescue", "نجات ساحلی", "wildlife", [
                ("against", "علیه"), ("beach", "ساحل"), ("damage", "آسیب"), ("discover", "کشف کردن"),
                ("emotion", "احساس"), ("fix", "تعمیر کردن"), ("frank", "صادق"), ("identify", "شناسایی"),
                ("island", "جزیره"), ("ocean", "اقیانوس"), ("perhaps", "شاید"), ("pleasant", "دلپذیر"),
                ("prevent", "جلوگیری"), ("rock", "صخره"), ("save", "نجات دادن"), ("step", "قدم"),
                ("still", "هنوز"), ("taste", "چشیدن"), ("throw", "پرتاب کردن"), ("wave", "موج")
            ]),
            ("The Forest Guardian", "محیط‌بان جنگل", "conservation", [
                ("benefit", "منفعت"), ("certain", "مطمئن"), ("chance", "فرصت"), ("effect", "اثر"),
                ("essential", "ضروری"), ("far", "دور"), ("focus", "تمرکز"), ("function", "کارکرد"),
                ("grass", "چمن"), ("guard", "نگهبانی"), ("image", "تصویر"), ("immediate", "فوری"),
                ("primary", "اصلی"), ("proud", "مفتخر"), ("remain", "ماندن"), ("rest", "استراحت"),
                ("separate", "جدا کردن"), ("site", "مکان"), ("tail", "دم"), ("trouble", "دردسر")
            ]),
            ("The River Crossing", "گذر از رودخانه", "survival", [
                ("anymore", "دیگر"), ("asleep", "خواب"), ("berry", "توت"), ("collect", "جمع کردن"),
                ("compete", "رقابت"), ("conversation", "مکالمه"), ("creature", "موجود"), ("decision", "تصمیم"),
                ("either", "یا"), ("forest", "جنگل"), ("ground", "زمین"), ("introduce", "معرفی کردن"),
                ("marry", "ازدواج"), ("prepare", "آماده‌سازی"), ("sail", "قایق‌سواری"), ("serious", "جدی"),
                ("spend", "سپری کردن"), ("strange", "عجیب"), ("truth", "حقیقت"), ("wake", "بیدار شدن")
            ]),
            ("The Village Bakery", "نانوایی محله", "lifestyle", [
                ("alone", "تنها"), ("apartment", "آپارتمان"), ("article", "مقاله"), ("artist", "هنرمند"),
                ("attitude", "نگرش"), ("compare", "مقایسه"), ("judge", "قضاوت"), ("magazine", "مجله"),
                ("material", "مواد"), ("meal", "وعده غذا"), ("method", "روش"), ("neighbor", "همسایه"),
                ("professional", "حرفه‌ای"), ("profit", "سود"), ("quality", "کیفیت"), ("shape", "شکل"),
                ("space", "فضا"), ("stair", "پله"), ("symbol", "نماد"), ("thin", "نازک")
            ]),
            ("The Harvest Feast", "جشن خرمن", "agriculture", [
                ("blood", "خون"), ("burn", "سوزاندن"), ("cell", "سلول"), ("contain", "شامل شدن"),
                ("correct", "صحیح"), ("crop", "محصول"), ("demand", "تقاضا"), ("equal", "برابر"),
                ("feed", "غذا دادن"), ("hole", "سوراخ"), ("increase", "افزایش"), ("lord", "ارباب"),
                ("owe", "بدهکار بودن"), ("position", "موقعیت"), ("raise", "پرورش دادن"), ("responsible", "مسئول"),
                ("sight", "منظره"), ("spot", "محل"), ("structure", "ساختار"), ("whole", "کامل")
            ]),
            ("The Young Inventor", "مخترع جوان", "technology", [
                ("coach", "مربی"), ("control", "کنترل"), ("description", "شرح"), ("direct", "مستقیم"),
                ("exam", "آزمون"), ("example", "مثال"), ("limit", "محدودیت"), ("local", "محلی"),
                ("magical", "جادویی"), ("mail", "نامه"), ("novel", "نوین"), ("outline", "طرح کلی"),
                ("poet", "شاعر"), ("print", "چاپ"), ("scene", "صحنه"), ("sheet", "برگه"),
                ("silly", "احمقانه"), ("store", "فروشگاه"), ("suffer", "رنج بردن"), ("technology", "فناوری")
            ]),
            ("The Mountain Marathon", "ماراتن کوهستان", "sports", [
                ("across", "سراسر"), ("breathe", "نفس کشیدن"), ("characteristic", "ویژگی"), ("consume", "مصرف کردن"),
                ("excite", "هیجان"), ("extreme", "شدید"), ("fear", "ترس"), ("fortunate", "خوش‌شانس"),
                ("happen", "رخ دادن"), ("length", "مسافت"), ("mistake", "اشتباه"), ("observe", "مشاهده"),
                ("opportunity", "فرصت"), ("prize", "جایزه"), ("race", "مسابقه"), ("realize", "پی بردن"),
                ("respond", "پاسخ دادن"), ("risk", "ریسک"), ("wonder", "حیرت"), ("yet", "هنوز")
            ]),
            ("The Historic Theater", "تماشاخانه تاریخی", "art", [
                ("academy", "آکادمی"), ("ancient", "کهن"), ("board", "هیئت"), ("century", "قرن"),
                ("clue", "سرنخ"), ("concert", "کنسرت"), ("county", "شهرستان"), ("dictionary", "واژه‌نامه"),
                ("exist", "وجود داشتن"), ("flat", "مسطح"), ("gentleman", "آقا"), ("hidden", "پنهان"),
                ("maybe", "شاید"), ("officer", "افسر"), ("original", "اصلی"), ("pound", "کوبیدن"),
                ("process", "فرایند"), ("publish", "چاپ کردن"), ("theater", "تئاتر"), ("wealth", "ثروت")
            ]),
            ("The Cultural Gathering", "گردهمایی فرهنگی", "culture", [
                ("admire", "تحسین"), ("behavior", "رفتار"), ("boast", "لاف زدن"), ("culture", "فرهنگ"),
                ("detail", "جزئیات"), ("expect", "انتظار داشتن"), ("gathering", "دورهمی"), ("glance", "نگاه گذرا"),
                ("guest", "مهمان"), ("honor", "افتخار"), ("host", "میزبان"), ("impact", "اثرگذاری"),
                ("modern", "امروزی"), ("polite", "مبادی آداب"), ("serve", "سرو کردن"), ("tradition", "سنت"),
                ("treat", "پذیرایی"), ("unique", "بی‌نظیر"), ("warm", "گرم و صمیمی"), ("value", "ارزش")
            ]),
            ("The Clinic Volunteers", "داوطلبان درمانگاه", "health", [
                ("assist", "کمک کردن"), ("caring", "دلسوز"), ("clinic", "درمانگاه"), ("comfort", "آرامش"),
                ("condition", "شرایط بیمار"), ("duty", "وظیفه"), ("examine", "معاینه"), ("gentle", "مهربان"),
                ("heal", "شفا یافتن"), ("health", "سلامت"), ("improve", "بهبودی"), ("medicine", "دارو"),
                ("nurse", "پرستار"), ("patient", "بیمار"), ("recovery", "بهبودی"), ("relief", "تسکین"),
                ("support", "پشتیبانی"), ("symptom", "علامت بیماری"), ("treatment", "درمان"), ("volunteer", "داوطلب")
            ]),
            ("The Airport Departure", "ترمینال فرودگاه", "travel", [
                ("announce", "اعلام"), ("boarding", "سوار شدن"), ("counter", "باجه"), ("delay", "تاخیر"),
                ("departure", "خروج"), ("destination", "مقصد"), ("flight", "پرواز"), ("gate", "گیت"),
                ("journey", "سفر"), ("luggage", "بار سفر"), ("officer", "مامور"), ("passenger", "مسافر"),
                ("passport", "گذرنامه"), ("prepare", "آماده‌سازی"), ("runway", "باند"), ("schedule", "برنامه"),
                ("security", "امنیت"), ("terminal", "ترمینال"), ("ticket", "بلیط"), ("travel", "سفر")
            ]),
            ("The Grand Festival", "کارناوال بهاره", "celebration", [
                ("annual", "سالانه"), ("celebration", "جشن"), ("cheer", "هلهله"), ("costume", "لباس محلی"),
                ("crowd", "جمعیت"), ("dance", "رقص"), ("decorate", "تزیین"), ("excitement", "هیجان"),
                ("feast", "ضیافت"), ("festival", "فستیوال"), ("fireworks", "آتش‌بازی"), ("gather", "جمع شدن"),
                ("joy", "شادی"), ("memory", "خاطره"), ("musician", "نوازنده"), ("parade", "رژه"),
                ("performance", "اجرا"), ("stage", "صحنه"), ("tradition", "رسم"), ("vibrant", "سرزنده")
            ]),
            ("The City Library", "کتابخانه مرکزی", "education", [
                ("alien", "بیگانه"), ("among", "میان"), ("chart", "نمودار"), ("cloud", "ابر"),
                ("comprehend", "درک کردن"), ("describe", "شرح دادن"), ("ever", "تاکنون"), ("fail", "شکست خوردن"),
                ("friendly", "دوستانه"), ("grade", "نمره"), ("instead", "در عوض"), ("library", "کتابخانه"),
                ("planet", "سیاره"), ("report", "گزارش"), ("several", "چندین"), ("solve", "حل کردن"),
                ("suddenly", "ناگهان"), ("suppose", "فرض کردن"), ("understand", "فهمیدن"), ("view", "دیدگاه")
            ]),
            ("The Local Market", "بازار محلی روز", "commerce", [
                ("bargain", "تخفیف و چانه‌زنی"), ("cost", "هزینه"), ("customer", "مشتری"), ("discount", "تخفیف"),
                ("exchange", "تبادل"), ("fresh", "تازه"), ("grocery", "خواربار"), ("market", "بازار"),
                ("merchant", "بازرگان"), ("offer", "پیشنهاد"), ("price", "قیمت"), ("produce", "محصولات"),
                ("receipt", "رسید"), ("select", "انتخاب"), ("sell", "فروختن"), ("shop", "خرید کردن"),
                ("supply", "تامین"), ("trade", "تجارت"), ("value", "ارزش"), ("weight", "وزن")
            ]),
            ("The Art Studio", "کارگاه نقاشی و هنر", "arts", [
                ("canvas", "بوم نقاشی"), ("color", "رنگ"), ("create", "آفریدن"), ("design", "طراحی"),
                ("draw", "رسم کردن"), ("exhibit", "نمایشگاه"), ("gallery", "گالری"), ("illustrate", "تصویرگری"),
                ("image", "تصویر"), ("inspire", "الهام بخشیدن"), ("masterpiece", "شاهکار"), ("model", "مدل"),
                ("paint", "رنگ‌آمیزی"), ("palette", "جعبه رنگ"), ("portrait", "پرتره"), ("sculpture", "مجسمه"),
                ("shade", "سایه رنگ"), ("sketch", "طرح اولیه"), ("style", "سبک هنری"), ("visual", "بصری")
            ]),
            ("The Coastal Lighthouse", "فانوس دریایی ساحل", "maritime", [
                ("beacon", "فانوس هدایت"), ("coast", "ساحل"), ("fog", "مه"), ("guide", "هدایت کردن"),
                ("harbor", "بندر"), ("island", "جزیره"), ("lantern", "فانوس"), ("marine", "دریایی"),
                ("navigate", "مسیریابی"), ("ocean", "اقیانوس"), ("passage", "گذرگاه"), ("reef", "صخره مرجانی"),
                ("rescue", "امداد"), ("sailor", "ملوان"), ("shore", "کرانه"), ("signal", "سیگنال"),
                ("storm", "توفان"), ("vessel", "شناور"), ("warning", "هشدار"), ("watch", "دیدبانی")
            ]),
            ("The Botanical Garden", "باغ گیاه‌شناسی", "botany", [
                ("blossom", "شکوفه"), ("botany", "گیاه‌شناسی"), ("branch", "شاخه"), ("climate", "اقلیم"),
                ("conserve", "حفظ کردن"), ("environment", "محیط زیست"), ("flora", "پوشش گیاهی"), ("flower", "گل"),
                ("foliage", "برگ‌ها"), ("greenhouse", "گلخانه"), ("grow", "رشد کردن"), ("leaf", "برگ"),
                ("nature", "طبیعت"), ("petal", "گلبرگ"), ("plant", "گیاه"), ("rare", "کمیاب"),
                ("root", "ریشه"), ("seed", "دانه"), ("species", "گونه زیستی"), ("stem", "ساقه")
            ]),
            ("The Musical Orchestra", "ارکستر بزرگ سمفونیک", "music", [
                ("applause", "تشویق حضار"), ("auditorium", "تالار نمایش"), ("baton", "چوب رهبر ارکستر"), ("choir", "گروه کر"),
                ("compose", "آهنگسازی"), ("conductor", "رهبر ارکستر"), ("harmony", "هارمونی"), ("instrument", "ساز"),
                ("melody", "ملودی"), ("musician", "نوازنده"), ("orchestra", "ارکستر"), ("perform", "اجرا کردن"),
                ("rehearsal", "تمرین نمایش"), ("rhythm", "ریتم"), ("score", "پارتیتور"), ("sound", "صدا"),
                ("symphony", "سمفونی"), ("talent", "استعداد"), ("tempo", "ضرب‌آهنگ"), ("tune", "کوک و نوا")
            ]),
            ("The Culinary Kitchen", "آشپزخانه بین‌المللی", "culinary", [
                ("appetizer", "پیش‌غذا"), ("bake", "پختن"), ("blend", "مخلوط کردن"), ("chef", "سرآشپز"),
                ("cuisine", "دستپخت و فرهنگ غذایی"), ("delicious", "لذیذ"), ("flavor", "طعم"), ("fry", "سرخ کردن"),
                ("gourmet", "خوراک‌شناس"), ("ingredient", "ماده اولیه"), ("kitchen", "آشپزخانه"), ("menu", "فهرست غذا"),
                ("pan", "ماهیتابه"), ("recipe", "دستور پخت"), ("roast", "کباب کردن"), ("seasoning", "چاشنی"),
                ("simmer", "آرام جوشیدن"), ("spice", "ادویه"), ("taste", "مزه"), ("utensil", "ظروف آشپزی")
            ]),
            ("The Astronomy Observatory", "رصدخانه نجومی", "space", [
                ("astronomy", "ستاره‌شناسی"), ("celestial", "آسمانی"), ("comet", "ستاره دنباله‌دار"), ("constellation", "صورت فلکی"),
                ("cosmos", "کیهان"), ("crater", "دهانه آتشفشانی"), ("eclipse", "خسوف و کسوف"), ("galaxy", "کهکشان"),
                ("lens", "عدسی"), ("meteor", "شهاب سنگ"), ("moon", "ماه"), ("nebula", "سحابی"),
                ("orbit", "مدار"), ("planet", "سیاره"), ("satellite", "ماهواره"), ("solar", "خورشیدی"),
                ("space", "فضا"), ("star", "ستاره"), ("telescope", "تلسکوپ"), ("universe", "جهان هستی")
            ]),
            ("The Architectural Landmark", "شاهکار معماری", "architecture", [
                ("arch", "طاق"), ("architect", "معمار"), ("blueprint", "نقشه ساختمان"), ("brick", "آجر"),
                ("building", "ساختمان"), ("column", "ستون"), ("construct", "ساختن"), ("design", "طراحی"),
                ("dome", "گنبد"), ("facade", "نمای ساختمان"), ("foundation", "شالوده"), ("landmark", "نشان تاریخی"),
                ("marble", "سنگ مرمر"), ("masonry", "بنایی"), ("modern", "مدرن"), ("monument", "بنای یادبود"),
                ("pillar", "پایه ستون"), ("structure", "سازه"), ("tower", "برج"), ("vault", "سرداب یا سقف قوسی")
            ]),
            ("The Global Summit", "اجلاس جهانی همکاری", "diplomacy", [
                ("accord", "توافق"), ("alliance", "اتحاد"), ("ambassador", "سفیر"), ("assembly", "مجمع"),
                ("compromise", "مصالحه"), ("conference", "کنفرانس"), ("cooperate", "همکاری کردن"), ("delegate", "نماینده"),
                ("dialogue", "گفتگو"), ("diplomacy", "دیپلماسی"), ("global", "جهانی"), ("leader", "رهبر"),
                ("mediate", "میانجی‌گری"), ("nation", "ملت"), ("negotiate", "مذاکره"), ("pact", "پیمان"),
                ("peace", "صلح"), ("protocol", "تشریفات"), ("summit", "نشست سران"), ("treaty", "عهدنامه")
            ])
        ]
    }
]

def generate_sql_for_book(book_cfg):
    b = book_cfg["book"]
    level = book_cfg["level"]
    mig_no = book_cfg["migration_no"]
    series_id = f"40000000-000{b}-0000-0000-00000000000{b}"
    order_base = book_cfg["order_base"]
    
    lines = []
    lines.append(f"-- +migrate Up")
    lines.append(f"-- دوره رسمی ۴۰۰۰ واژه ضروری - کتاب {b} ({book_cfg['title']})")
    lines.append(f"-- شامل ۳۰ یونیت کامل، دیالوگ‌های شادوئینگ و اپیزودهای پادکست متصل.\n")
    
    # Ensure Series Exists
    title_clean = book_cfg['title'].replace("'", "''")
    desc_clean = book_cfg['desc_fa'].replace("'", "''")
    lines.append(f"""INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES ('{series_id}', '{title_clean}', '{desc_clean}', '{level}', '', '{book_cfg['category']}', {b}, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa;\n""")

    for idx, (theme_title, theme_fa, domain_tag, words) in enumerate(book_cfg["themes"], start=1):
        u_hex = f"{idx:04d}"
        scene_id = f"4000{b}000-0000-0000-0000-{u_hex}00000001"
        hotspot_id = f"4000{b}000-0000-0000-0000-{u_hex}00000002"
        podcast_id = f"4000{b}000-0000-0000-0000-{u_hex}00000003"
        
        words_preview = ", ".join([w[0] for w in words[:6]]) + "..."
        scene_title = f"{theme_title} (Book {b} - Unit {idx})"
        scene_desc = f"تمرین شادوئینگ یونیت {idx} کتاب {b} ({theme_fa}): {words_preview}"
        podcast_desc = f"روایت داستانی و آموزش واژگان یونیت {idx} ({theme_fa}) از کتاب {b} دوره ۴۰۰۰ واژه"
        
        # 1. Scene
        lines.append(f"""-- کتاب {b} - درس {idx}: {theme_title}
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('{scene_id}', '{scene_title}', '{scene_desc}', '', '{level}', 'published', {order_base + idx}, 'education', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('{hotspot_id}', '{scene_id}', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;
""")
        # 2. Dialogues (5 lines per unit)
        d_vals = []
        d_texts = [
            ("customer", f"Exploring {theme_title.lower()} offers a great opportunity to master essential vocabulary.", f"بررسی مبحث {theme_fa} فرصتی عالی برای تسلط بر واژگان کلیدی فراهم می‌کند."),
            ("clerk", f"Native speakers naturally use target words like {words[0][0]} and {words[1][0]} in conversation.", f"گویندگان نیتیو کلماتی مثل {words[0][0]} ({words[0][1]}) و {words[1][0]} ({words[1][1]}) را به صورت طبیعی در مکالمه به کار می‌برند."),
            ("customer", f"Practicing sentence by sentence with clear pronunciation builds real fluency.", f"تمرین جمله‌به‌جمله با تلفظ شفاف، روانی واقعی در گفتار ایجاد می‌کند."),
            ("clerk", f"Staying calm and consistent turns difficult phrases into everyday speech habits.", f"آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد."),
            ("customer", f"Completing this unit brings us closer to full mastery of English vocabulary.", f"تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.")
        ]
        for d_no, (spk, orig, trans) in enumerate(d_texts, start=1):
            d_id = f"4000{b}000-0000-0000-0001-{u_hex}{d_no:08d}"
            orig_c = orig.replace("'", "''")
            trans_c = trans.replace("'", "''")
            d_vals.append(f"('{d_id}', '{hotspot_id}', {d_no}, '{spk}', '{orig_c}', '{trans_c}', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')")
        
        lines.append("INSERT INTO dialogues (id, hotspot_id, \"order\", speaker, original_text, translation, audio_url, display_type)\nVALUES\n" + ",\n".join(d_vals) + "\nON CONFLICT (id) DO NOTHING;\n")
        
        # 3. Podcast
        vocab_items = [{"word": w[0], "meaning_fa": w[1]} for w in words]
        vocab_json_sql = json.dumps(vocab_items, ensure_ascii=False).replace("'", "''")
        duration = 300 + (idx * 2)
        
        lines.append(f"""INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id)
VALUES ('{podcast_id}', '{scene_title}', '{podcast_desc}', '{level}', 'lesson', '{series_id}', {idx}, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, {duration}, {idx}, '{vocab_json_sql}'::jsonb, '{scene_id}')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary;\n""")

        # 4. Podcast Lines
        p_lines = [
            ("Alex", f"Welcome to 4000 Essential English Words, Book {b}, Unit {idx}: {theme_title}.", f"به درس {idx} از کتاب {b} دوره ۴۰۰۰ واژه خوش آمدید: {theme_fa}.", 0, 6000),
            ("Sarah", f"Today we focus on {len(words)} high-frequency vocabulary words used in real-life contexts.", f"امروز بر روی {len(words)} واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.", 6300, 13500),
            ("Alex", f"Listen closely to the natural rhythm and pronunciation of each target phrase.", f"به ریتم طبیعی و تلفظ دقیق هر عبارت هدف خوب گوش فرا دهید.", 13800, 21000),
            ("Sarah", f"Now head over to the shadowing section to record these sentences in your own voice!", f"حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!", 21400, 29000)
        ]
        pl_vals = []
        for pl_no, (spk, orig, trans, s_ms, e_ms) in enumerate(p_lines):
            orig_c = orig.replace("'", "''")
            trans_c = trans.replace("'", "''")
            pl_vals.append(f"('{podcast_id}', {pl_no}, '{spk}', '{orig_c}', '{trans_c}', {s_ms}, {e_ms})")
        lines.append("INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)\nVALUES\n" + ",\n".join(pl_vals) + "\nON CONFLICT DO NOTHING;\n")

    lines.append(f"""-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '4000{b}000-0000-0000-0000-%';
""")
    return "\n".join(lines)

# Generate Book 1
sql_b1 = generate_sql_for_book(BOOK_CONFIGS[0])
target_file = '/Users/apple/Desktop/project_go/Shadowing-backend/internal/repository/postgres/migrations/088_4000_essential_words_series.sql'
with open(target_file, 'w', encoding='utf-8') as f:
    f.write(sql_b1)

print(f"Book 1 migration generated with {len(BOOK_CONFIGS[0]['themes'])} units ({len(BOOK_CONFIGS[0]['themes']) * 20} words)!")
