import json
import os

BOOK_DATA = [
    {
        "book": 1,
        "mig": "088",
        "file": "088_4000_essential_words_series.sql",
        "level": "beginner",
        "title": "4000 Essential Words — Book 1",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب اول): یادگیری پایه مکالمه و واژگان اساسی روزمره در قالب داستان و تمرین شادوئینگ",
        "category": "essential_words",
        "order_base": 100,
        "unit_names": [
            ("The Laboratory Experiment", "آزمایشگاه علمی"),
            ("The Dog's Bell", "زنگوله سگ"),
            ("The Lion and the Rabbit", "شیر و خرگوش"),
            ("The Boy and His Sled", "سورتمه برفی"),
            ("A Journey to the Wild Field", "دشت وحشی"),
            ("The Friendly Ghost", "شبح مهربان"),
            ("The Star Gazers", "رصد ستارگان"),
            ("The Camping Trip", "اردوی جنگلی"),
            ("The Ocean Rescue", "نجات ساحلی"),
            ("The Forest Guardian", "محیط‌بان جنگل"),
            ("The River Crossing", "گذر از رودخانه"),
            ("The Village Bakery", "نانوایی محله"),
            ("The Harvest Feast", "جشن خرمن"),
            ("The Young Inventor", "مخترع جوان"),
            ("The Mountain Marathon", "ماراتن کوهستان"),
            ("The Historic Theater", "تماشاخانه تاریخی"),
            ("The Cultural Gathering", "گردهمایی فرهنگی"),
            ("The Clinic Volunteers", "داوطلبان درمانگاه"),
            ("The Airport Departure", "ترمینال فرودگاه"),
            ("The Grand Festival", "کارناوال بهاره"),
            ("The City Library", "کتابخانه مرکزی"),
            ("The Local Market", "بازار محلی روز"),
            ("The Art Studio", "کارگاه نقاشی و هنر"),
            ("The Coastal Lighthouse", "فانوس دریایی ساحل"),
            ("The Botanical Garden", "باغ گیاه‌شناسی"),
            ("The Musical Orchestra", "ارکستر بزرگ سمفونیک"),
            ("The Culinary Kitchen", "آشپزخانه بین‌المللی"),
            ("The Astronomy Observatory", "رصدخانه نجومی"),
            ("The Architectural Landmark", "شاهکار معماری"),
            ("The Global Summit", "اجلاس جهانی همکاری")
        ]
    },
    {
        "book": 2,
        "mig": "089",
        "file": "089_4000_words_book2.sql",
        "level": "intermediate",
        "title": "4000 Essential Words — Book 2",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب دوم): توسعه دایره لغات عمومی و مکالمات کاربردی در سفر و اجتماع",
        "category": "essential_words",
        "order_base": 200,
        "unit_names": [
            ("The Secret Recipe", "دستور پخت سرّی"),
            ("The Morning Commute", "رفت و آمد صبحگاهی"),
            ("The Job Interview", "مصاحبه شغلی کاری"),
            ("The Doctor's Appointment", "ویزیت در مطب پزشک"),
            ("The Bank Account", "افتتاح حساب بانکی"),
            ("The Hotel Check-in", "پذیرش در هتل"),
            ("The Train Journey", "سفر با قطار سریع‌السیر"),
            ("The Tech Startup", "توسعه استارتاپ فناوری"),
            ("The Supermarket Shopping", "خرید از سوپرمارکت"),
            ("The Team Project", "پروژه تیمی در شرکت"),
            ("The Apartment Rental", "اجاره آپارتمان مسکونی"),
            ("The University Seminar", "سمینار دانشگاهی"),
            ("The Car Repair", "تعمیر خودرو در مکانیکی"),
            ("The Photography Studio", "عکاسی پرتره و طبیعت"),
            ("The Fitness Routine", "برنامه تمرینی باشگاه"),
            ("The Family Vacation", "تعطیلات خانوادگی ساحلی"),
            ("The Coffee Roastery", "کارگاه برشته‌کاری قهوه"),
            ("The Book Club Meeting", "جلسه حلقه مطالعه کتاب"),
            ("The City Museum Tour", "بازدید از موزه تاریخ"),
            ("The Flight Layover", "توقف پرواز در ترانزیت"),
            ("The Weather Forecast", "پیش‌بینی وضعیت جوی"),
            ("The Career Promotion", "ارتقای شغلی سازمانی"),
            ("The Neighborhood Safety", "امنیت و همکاری محله"),
            ("The Outdoor Concert", "کنسرت فضای باز"),
            ("The Mobile Application", "کار با اپلیکیشن هوشمند"),
            ("The Emergency Service", "تماس با خدمات اورژانس"),
            ("The Wildlife Sanctuary", "پناهگاه حیات وحش"),
            ("The Pet Adoption", "سرپرستی حیوان خانگی"),
            ("The Science Fair", "نمایشگاه دستاوردهای علمی"),
            ("The Graduation Ceremony", "جشن فارغ‌التحصیلی")
        ]
    },
    {
        "book": 3,
        "mig": "090",
        "file": "090_4000_words_book3.sql",
        "level": "intermediate",
        "title": "4000 Essential Words — Book 3",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب سوم): واژگان کاربردی در محیط‌های کاری، روابط اجتماعی و توصیف تجربیات",
        "category": "essential_words",
        "order_base": 300,
        "unit_names": [
            ("Business Negotiation", "مذاکره تجاری و قرارداد"),
            ("International Logistics", "حمل و نقل بین‌المللی"),
            ("Digital Marketing Campaign", "کمپین بازاریابی دیجیتال"),
            ("Agile Project Management", "مدیریت پروژه چابک"),
            ("Environmental Protection", "حفاظت از محیط زیست"),
            ("Renewable Solar Energy", "انرژی پاک و خورشیدی"),
            ("Smart Urban Planning", "شهرسازی هوشمند مدرن"),
            ("Public Presentation", "ارائه عمومی و سخنرانی"),
            ("Customer Support Strategy", "پشتیبانی و رضایت مشتری"),
            ("Personal Finance Planning", "سرمایه‌گذاری مالی شخصی"),
            ("Media Ethics and News", "اخلاق رسانه‌ای و اخبار"),
            ("Healthcare Innovations", "نوآوری‌های بهداشت و سلامت"),
            ("Machine Learning Models", "کاربردهای یادگیری ماشین"),
            ("Network Cybersecurity", "امنیت سایبری شبکه‌ها"),
            ("Academic Research Methods", "روش‌های پژوهش علمی"),
            ("Investigative Journalism", "روزنامه‌نگاری تحقیقی"),
            ("E-Commerce Fulfillment", "لجستیک فروشگاه آنلاین"),
            ("Cross-Cultural Dialogue", "گفتگوی میان‌فرهنگی"),
            ("Modern Architecture Trends", "معماری سبز و پایدار"),
            ("Deep Space Missions", "کاوش‌های فضایی عمیق"),
            ("Creative Fiction Writing", "نگارش داستان خلاقانه"),
            ("Sustainable Farming", "کشاورزی مدرن و ارگانیک"),
            ("Civic Engagement", "مشارکت شهروندی فعال"),
            ("Eco-Tourism Destinations", "اکوتوریسم و طبیعت‌گردی"),
            ("Independent Film Production", "تولید فیلم مستقل"),
            ("Commercial Contract Law", "حقوق قراردادهای تجاری"),
            ("Online Education Systems", "سامانه‌های آموزش مجازی"),
            ("Cognitive Behavioral Habits", "شکل‌گیری عادت‌های رفتاری"),
            ("Global Supply Chains", "زنجیره تامین جهانی"),
            ("Ethical Leadership", "اصول رهبری اخلاق‌مدار")
        ]
    },
    {
        "book": 4,
        "mig": "091",
        "file": "091_4000_words_book4.sql",
        "level": "advanced",
        "title": "4000 Essential Words — Book 4",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب چهارم): لغات نیمه‌تخصصی، تحلیل رویدادها، استدلال و مهارت‌های شغلی",
        "category": "essential_words",
        "order_base": 400,
        "unit_names": [
            ("Macroeconomic Analysis", "تحلیل اقتصاد کلان و تورم"),
            ("Corporate Governance", "حاکمیت شرکتی و شفافیت"),
            ("Geopolitical Dynamics", "تحولات ژئوپلیتیک بین‌الملل"),
            ("Biotechnology Frontiers", "مرزهای زیست‌فناوری نوین"),
            ("Ethical Data Governance", "حکمرانی اخلاقی داده‌ها"),
            ("Philosophical Argumentation", "استدلال فلسفی و منطق"),
            ("Climate Resilience Strategies", "راهبردهای تاب‌آوری اقلیمی"),
            ("Behavioral Neurobiology", "زیست‌شناسی رفتار و مغز"),
            ("Autonomous Driving Systems", "سامانه‌های خودران هوشمند"),
            ("Central Banking Policy", "سیاست‌گذاری بانک مرکزی"),
            ("Clinical Trial Protocols", "پروتکل‌های کارآزمایی بالینی"),
            ("Constitutional Principles", "اصول بنیادین قانون اساسی"),
            ("Diplomatic Mediation", "میانجی‌گری دیپلماتیک صلح"),
            ("Venture Capital Ecosystem", "اکوسیستم سرمایه‌گذاری جسورانه"),
            ("Aerospace Engineering", "مهندسی هوافضا و پرواز"),
            ("Quantum Information Science", "مفاهیم پردازش کوانتومی"),
            ("Literary Criticism", "نقد و تحلیل ادبیات جهان"),
            ("Sociological Paradigm", "الگوهای جامعه‌شناسی معاصر"),
            ("Organizational Crisis Response", "مدیریت بحران سازمانی"),
            ("Public Policy Assessment", "ارزیابی سیاست‌های عمومی"),
            ("Industrial Robotics", "اتوماسیون و رباتیک صنعتی"),
            ("Bioethics and Genetics", "اخلاق زیستی و ژنتیک"),
            ("Global Maritime Trade", "تجارت دریایی بین‌المللی"),
            ("Clean Infrastructure Finance", "تامین مالی زیرساخت سبز"),
            ("Forensic Science Standards", "استانداردهای جرم‌شناسی علمی"),
            ("Decision Theory Analytics", "تحلیل نظریه تصمیم‌گیری"),
            ("Mergers and Acquisitions", "ادغام و تملیک شرکت‌ها"),
            ("Urban Mobility Transition", "حمل‌ونقل پاک شهری"),
            ("Crisis Communications", "ارتباطات استراتژیک در بحران"),
            ("Disruptive Market Models", "مدل‌های تحول‌آفرین بازار")
        ]
    },
    {
        "book": 5,
        "mig": "092",
        "file": "092_4000_words_book5.sql",
        "level": "advanced",
        "title": "4000 Essential Words — Book 5",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب پنجم): واژگان آکادمیک و پیشرفته، درک متون پیچیده و تفکر نقادانه",
        "category": "essential_words",
        "order_base": 500,
        "unit_names": [
            ("Epistemology and Knowledge", "معرفت‌شناسی و مرزهای دانش"),
            ("Theoretical Physics Horizons", "افق‌های فیزیک نظری"),
            ("Genomic Sequencing Insights", "توالی‌یابی ژنوم انسانی"),
            ("Macro-Financial Stability", "ثبات سیستم‌های کلان مالی"),
            ("International Humanitarian Law", "حقوق بین‌الملل بشردوستانه"),
            ("Advanced Cognitive Science", "علوم شناختی و ادراک ذهن"),
            ("Complex Systems Dynamics", "دینامیک سیستم‌های پیچیده"),
            ("Bioinformatics Analytics", "تحلیل داده‌های بیوانفورماتیک"),
            ("Artificial General Intelligence", "مباحث هوش عمومی مصنوعی"),
            ("Fiscal Policy Implementation", "اجرای سیاست‌های مالی دولت"),
            ("Epidemiological Modeling", "مدل‌سازی همه‌گیرشناسی"),
            ("Jurisprudence Foundations", "فلسفه حقوق و دادگستری"),
            ("Multilateral Strategic Treaties", "معاهدات استراتژیک چندجانبه"),
            ("Private Equity Portfolios", "صندوق‌های سهام اختصاصی"),
            ("Nanomaterials Synthesis", "سنتز نانومواد و کاربردها"),
            ("Quantum Cryptography", "رمزنگاری ایمن کوانتومی"),
            ("Comparative Semiotics", "نشانه‌شناسی تطبیقی متن"),
            ("Demographic Transitions", "انتقال‌های جمعیت‌شناختی"),
            ("High-Stakes Negotiations", "مذاکرات سرنوشت‌ساز بین‌المللی"),
            ("Environmental Regulation", "قوانین و استانداردهای زیست‌محیطی"),
            ("Cyber-Physical Integration", "سیستم‌های سایبری-فیزیکی"),
            ("Genetic Engineering Ethics", "اخلاق مهندسی ژنتیک نوین"),
            ("Supply Chain Resiliency", "تاب‌آوری زنجیره‌های تامین"),
            ("Global Carbon Markets", "بازارهای جهانی تجارت کربن"),
            ("Digital Forensics Verification", "راستی‌آزمایی جرائم دیجیتال"),
            ("Behavioral Economics Research", "پژوهش‌های اقتصاد رفتاری"),
            ("Cross-Border Corporate Law", "حقوق فرامرزی شرکت‌ها"),
            ("Sustainable Urban Agronomy", "کشاورزی ارگانیک شهری"),
            ("Strategic Enterprise Audit", "حسابرسی راهبردی سازمان‌ها"),
            ("Exponential Tech Adoption", "پذیرش فناوری‌های تصاعدی")
        ]
    },
    {
        "book": 6,
        "mig": "093",
        "file": "093_4000_words_book6.sql",
        "level": "proficient",
        "title": "4000 Essential Words — Book 6",
        "desc_fa": "۴۰۰۰ واژه پرکاربرد (کتاب ششم): تسلط کامل زبان انگلیسی، لغات پیشرفته ادبی، اصطلاحات انتزاعی و بحث‌های تخصصی",
        "category": "essential_words",
        "order_base": 600,
        "unit_names": [
            ("Mastery of Rhetoric", "تسلط بر فن بیان و بلاغت"),
            ("Philosophical Dialectics", "دیالکتیک و استدلال عمیق"),
            ("Advanced Hermeneutics", "هرمنوتیک و تفسیر متون کهن"),
            ("Constitutional Jurisprudence", "فلسفه حقوق اساسی دادگاه‌ها"),
            ("Cosmological Theories", "نظریه‌های کیهان‌شناسی مدرن"),
            ("Neuroethics and Consciousness", "اخلاق عصبی و راز آگاهی"),
            ("Socio-Political Discourse", "گفتمان جامعه‌شناختی انتقادی"),
            ("Economic Equilibrium", "تعادل عمومی در اقتصاد کلان"),
            ("Diplomatic Statecraft", "هنر کشورداری و دیپلماسی ارشد"),
            ("Aesthetic Philosophy", "فلسفه هنر و زیبایی‌شناسی"),
            ("Linguistic Anthropology", "انسان‌شناسی زبان و فرهنگ"),
            ("Mathematical Logic Systems", "سیستم‌های منطق ریاضی صوری"),
            ("Strategic Foresight Analysis", "آینده‌پژوهی راهبردی سازمان‌ها"),
            ("Epistemic Uncertainty", "عدم قطعیت در شناخت علمی"),
            ("Comparative Literature Canons", "شاهکارهای ادبیات تطبیقی"),
            ("Global Institutional Governance", "حکمرانی نهادهای بین‌المللی"),
            ("Cognitive Linguistics Paradigms", "زبان‌شناسی شناختی پیشرفته"),
            ("Bio-Evolutionary Dynamics", "دینامیک فرگشت زیستی"),
            ("Crisis Leadership Mastery", "تسلط بر رهبری در شرایط بحران"),
            ("Advanced Strategic Synthesis", "سنتز راهبردی چندرشته‌ای"),
            ("Computational Semantics", "معناشناسی محاسباتی هوشمند"),
            ("Civilizational History Insights", "تاریخ تمدن و تحول جوامع"),
            ("Ethical Governance Frameworks", "چارچوب‌های اخلاقی حکمرانی"),
            ("Planetary Biosphere Stewardship", "نگهبانی از زیست‌کره سیاره"),
            ("Advanced Analytical Reasoning", "استدلال تحلیلی سطح بالا"),
            ("Cross-Cultural Pragmatics", "کاربردشناسی زبان در فرهنگ‌ها"),
            ("International Arbitration Law", "داوری بین‌المللی اختلافات تجاری"),
            ("Eco-Systemic Restoration", "احیای اکوسیستم‌های طبیعی"),
            ("Transdisciplinary Research", "پژوهش‌های فرارشته‌ای پیشرفته"),
            ("The Zenith of English Mastery", "اوج تسلط و روانی در انگلیسی")
        ]
    }
]

# Thematic cover images available in uploads
THEMATIC_COVERS = [
    "/uploads/clothes_shopping.png",
    "/uploads/hotel_reception.png",
    "/uploads/driving_lesson.png",
    "/uploads/weight_loss.png",
    "/uploads/001a7148-0f94-4cf5-8bb7-619144be75b7.jpeg",
    "/uploads/6519525d-b5e4-47e9-b52a-f4fbb2da612f.jpeg",
    "/uploads/7ac3cd84-031b-4e59-8fc2-b1e18ef5e221.jpeg",
    "/uploads/dccdb46e-5874-4486-be42-b74fdf596700.jpeg"
]

SAMPLE_VOCABS_WITH_COLLOCATIONS = {
    "beginner": [
        ("achieve", "دست یافتن به", "achieve a goal"),
        ("balance", "تعادل برقرار کردن", "strike a balance"),
        ("certain", "مطمئن و قطعی", "feel certain"),
        ("develop", "توسعه دادن", "develop skills"),
        ("effort", "تلاش و کوشش", "make an effort"),
        ("focus", "تمرکز کردن", "focus attention"),
        ("gain", "به دست آوردن", "gain experience"),
        ("helpful", "مفید و سودمند", "extremely helpful"),
        ("improve", "بهبود بخشیدن", "improve quality"),
        ("journey", "سفر پرماجرا", "safe journey"),
        ("knowledge", "دانش و آگاهی", "acquire knowledge"),
        ("learn", "یاد گرفتن", "eager to learn"),
        ("manage", "مدیریت کردن", "manage time"),
        ("notice", "توجه کردن به", "notice a difference"),
        ("organize", "ساماندهی کردن", "organize an event"),
        ("practice", "تمرین مداوم", "daily practice"),
        ("quality", "کیفیت عالی", "high quality"),
        ("result", "نتیجه مثبت", "positive result"),
        ("success", "موفقیت چشمگیر", "great success"),
        ("talent", "استعداد ذاتی", "natural talent")
    ],
    "intermediate": [
        ("accurate", "دقیق و بی‌نقص", "accurate data"),
        ("broaden", "گسترش دادن", "broaden horizons"),
        ("collaborate", "همکاری سازنده", "collaborate closely"),
        ("distinguish", "تمایز قائل شدن", "distinguish clearly"),
        ("efficient", "کارآمد و موثر", "highly efficient"),
        ("facilitate", "تسهیل نمودن", "facilitate growth"),
        ("generate", "تولید و خلق کردن", "generate ideas"),
        ("highlight", "برجسته ساختن", "highlight key points"),
        ("implement", "پیاده‌سازی کردن", "implement a strategy"),
        ("justify", "توجیه منطقی داشتن", "justify a decision"),
        ("maintain", "حفظ و نگهداری", "maintain standards"),
        ("negotiate", "مذاکره کردن", "negotiate terms"),
        ("optimize", "بهینه‌سازی", "optimize performance"),
        ("participate", "مشارکت فعال", "participate actively"),
        ("reinforce", "تقویت و استحکام", "reinforce learning"),
        ("streamline", "ساده‌سازی فرایند", "streamline processes"),
        ("transform", "تحول بنیادین", "transform completely"),
        ("utilize", "بهره‌گیری مناسب", "utilize resources"),
        ("validate", "اعتبارسنجی", "validate findings"),
        ("withstand", "تاب آوردن در برابر", "withstand pressure")
    ],
    "advanced": [
        ("allocate", "تخصیص بهینه منابع", "allocate budget"),
        ("benchmark", "معیار سنجش مرجع", "set a benchmark"),
        ("catalyze", "شتاب‌بخشی تحول", "catalyze change"),
        ("differentiate", "متمایزسازی رقابتی", "differentiate sharply"),
        ("exemplify", "نمونه بارز بودن", "exemplify excellence"),
        ("formulate", "تدوین منسجم", "formulate policy"),
        ("gauge", "سنجش و برآورد دقیق", "gauge sentiment"),
        ("harmonize", "هماهنگ‌سازی چندبعدی", "harmonize relations"),
        ("innovate", "نوآوری ارزش‌آفرین", "innovate continuously"),
        ("leverage", "اهرم قرار دادن مزیت", "leverage advantage"),
        ("mitigate", "کاهش اثرات ریسک", "mitigate risk"),
        ("navigate", "هدایت در شرایط عدم قطعیت", "navigate complexity"),
        ("orchestrate", "هماهنگی دقیق فرایندها", "orchestrate effort"),
        ("pioneer", "پیشگامی در عرصه", "pioneer new methods"),
        ("quantify", "محاسبه کمی دقیق", "quantify impact"),
        ("reconcile", "وفاق دادن دیدگاه‌ها", "reconcile differences"),
        ("substantiate", "مستندسازی و اثبات", "substantiate claims"),
        ("synthesize", "ترکیب و تلفیق نظام‌مند", "synthesize information"),
        ("underpin", "تقویت شالوده فکری", "underpin success"),
        ("yield", "بازدهی و ثمردهی بالا", "yield positive returns")
    ],
    "proficient": [
        ("amalgamate", "ادغام و یکپارچه‌سازی متعالی", "amalgamate traditions"),
        ("bolster", "تقویت بنیادین ارکان", "bolster confidence"),
        ("circumscribe", "تعیین دقیق حدود و ثغور", "circumscribe authority"),
        ("delineate", "تبیین موشکافانه ابعاد", "delineate clearly"),
        ("elucidate", "روشنگری عمیق مفهومی", "elucidate concepts"),
        ("foster", "پرورش نظام‌مند استعدادها", "foster innovation"),
        ("galvanize", "برانگیختن انگیزه فراگیر", "galvanize support"),
        ("herald", "بشارت‌دهنده افق‌های نوین", "herald a new era"),
        ("instigate", "آغازگری تحولات ساختاری", "instigate reforms"),
        ("juxtapose", "هم‌نشینی و مقایسه تطبیقی", "juxtapose elements"),
        ("manifest", "تبلور عینی ارزش‌ها", "manifest clearly"),
        ("promulgate", "اشاعه و ترویج رسمی اندیشه", "promulgate ideas"),
        ("reverberate", "بازتاب گسترده در جامعه", "reverberate widely"),
        ("scrutinize", "بررسی موشکافانه و دقیق", "scrutinize details"),
        ("transcend", "فراتر رفتن از محدودیت‌ها", "transcend boundaries"),
        ("unravel", "گشودن گره‌های پیچیده", "unravel mysteries"),
        ("venerate", "ارج نهادن و پاسداشت مقام", "venerate legacy"),
        ("warrant", "تضمین و توجیه شایسته", "warrant attention"),
        ("crystallize", "تبلور شفاف دیدگاه", "crystallize opinion"),
        ("culminate", "به اوج تکامل رسیدن", "culminate in triumph")
    ]
}

def build_sql(cfg):
    b = cfg["book"]
    level = cfg["level"]
    series_id = f"40000000-000{b}-0000-0000-00000000000{b}"
    order_base = cfg["order_base"]
    
    vocab_pool = SAMPLE_VOCABS_WITH_COLLOCATIONS.get(level, SAMPLE_VOCABS_WITH_COLLOCATIONS["intermediate"])
    
    parts = []
    parts.append("-- +migrate Up")
    parts.append(f"-- دوره رسمی ۴۰۰۰ واژه ضروری - کتاب {b} ({cfg['title']})")
    parts.append(f"-- سطح: {level} | ۳۰ درس کامل شامل شادوئینگ، پادکست، کالوکیشن‌ها و کاورهای تصویری.\n")
    
    title_c = cfg['title'].replace("'", "''")
    desc_c = cfg['desc_fa'].replace("'", "''")
    series_cover = THEMATIC_COVERS[(b - 1) % len(THEMATIC_COVERS)]
    parts.append(f"""INSERT INTO podcast_series (id, title, description_fa, level, cover_url, category, position, is_active)
VALUES ('{series_id}', '{title_c}', '{desc_c}', '{level}', '{series_cover}', '{cfg['category']}', {b}, TRUE)
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description_fa = EXCLUDED.description_fa, cover_url = EXCLUDED.cover_url;\n""")

    for idx, (theme_en, theme_fa) in enumerate(cfg["unit_names"], start=1):
        u_hex = f"{idx:04d}"
        scene_id = f"4000{b}000-0000-0000-0000-{u_hex}00000001"
        hotspot_id = f"4000{b}000-0000-0000-0000-{u_hex}00000002"
        podcast_id = f"4000{b}000-0000-0000-0000-{u_hex}00000003"
        cover_img = THEMATIC_COVERS[(b * 3 + idx) % len(THEMATIC_COVERS)]
        
        words = []
        for w_i in range(20):
            w_idx = (idx * 3 + w_i) % len(vocab_pool)
            base_w, base_fa, colloc = vocab_pool[w_idx]
            words.append((base_w, base_fa, colloc))
        
        words_preview = ", ".join([w[0] for w in words[:6]]) + "..."
        scene_title = f"{theme_en} (Book {b} - Unit {idx})"
        scene_desc = f"تمرین شادوئینگ یونیت {idx} کتاب {b} ({theme_fa}): {words_preview}"
        podcast_desc = f"روایت داستانی و آموزش واژگان یونیت {idx} ({theme_fa}) از کتاب {b} دوره ۴۰۰۰ واژه"
        
        # 1. Scene & Hotspot with Thematic Visual
        parts.append(f"""-- کتاب {b} - درس {idx}: {theme_en}
INSERT INTO scenes (id, title, description, background_image_url, difficulty, status, "order", category, is_custom)
VALUES ('{scene_id}', '{scene_title}', '{scene_desc}', '{cover_img}', '{level}', 'published', {order_base + idx}, 'education', false)
ON CONFLICT (id) DO UPDATE SET background_image_url = EXCLUDED.background_image_url, title = EXCLUDED.title;

INSERT INTO hotspots (id, scene_id, name, x_position, y_position, order_index)
VALUES ('{hotspot_id}', '{scene_id}', 'Dialogue', 50.0, 50.0, 1)
ON CONFLICT (id) DO NOTHING;
""")
        # 2. Dialogues
        d_vals = []
        d_templates = [
            ("customer", f"Exploring {theme_en.lower()} offers a great opportunity to master essential vocabulary.", f"بررسی موضوع {theme_fa} فرصتی عالی برای تسلط بر واژگان ضروری به شمار می‌رود."),
            ("clerk", f"Native speakers naturally use target words like {words[0][0]} and {words[1][0]} in conversation.", f"گویندگان نیتیو کلماتی چون {words[0][0]} ({words[0][1]}) و {words[1][0]} ({words[1][1]}) را به صورت طبیعی در مکالمه به کار می‌برند."),
            ("customer", f"Practicing sentence by sentence with clear pronunciation builds real conversational fluency.", f"تمرین جمله‌به‌جمله با تلفظ شفاف، تسلط و روانی واقعی در گفتار ایجاد می‌کند."),
            ("clerk", f"Staying calm and consistent turns difficult phrases into everyday speech habits.", f"آرامش و استمرار در تمرین، عبارات دشوار را به عادت‌های گفتاری روزمره بدل می‌سازد."),
            ("customer", f"Completing this unit brings us closer to full mastery of English vocabulary.", f"تکمیل این درس ما را به تسلط کامل بر دایره واژگان انگلیسی نزدیک‌تر می‌کند.")
        ]
        for d_no, (spk, orig, trans) in enumerate(d_templates, start=1):
            d_id = f"4000{b}000-0000-0000-0001-{u_hex}{d_no:08d}"
            orig_c = orig.replace("'", "''")
            trans_c = trans.replace("'", "''")
            d_vals.append(f"('{d_id}', '{hotspot_id}', {d_no}, '{spk}', '{orig_c}', '{trans_c}', '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'full')")
        
        parts.append("INSERT INTO dialogues (id, hotspot_id, \"order\", speaker, original_text, translation, audio_url, display_type)\nVALUES\n" + ",\n".join(d_vals) + "\nON CONFLICT (id) DO NOTHING;\n")
        
        # 3. Podcast with Collocations & Cover Image
        vocab_json = json.dumps([{"word": w[0], "meaning_fa": w[1], "collocation": w[2]} for w in words], ensure_ascii=False).replace("'", "''")
        duration = 300 + (idx * 2)
        parts.append(f"""INSERT INTO podcasts (id, title, description_fa, level, kind, series_id, episode_no, audio_url, audio_status, is_active, duration_seconds, position, vocabulary, scene_id, image_url)
VALUES ('{podcast_id}', '{scene_title}', '{podcast_desc}', '{level}', 'lesson', '{series_id}', {idx}, '/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3', 'ready', TRUE, {duration}, {idx}, '{vocab_json}'::jsonb, '{scene_id}', '{cover_img}')
ON CONFLICT (id) DO UPDATE SET scene_id = EXCLUDED.scene_id, vocabulary = EXCLUDED.vocabulary, image_url = EXCLUDED.image_url;\n""")

        # 4. Podcast Lines
        pl_vals = []
        p_lines = [
            ("Alex", f"Welcome to 4000 Essential English Words, Book {b}, Unit {idx}: {theme_en}.", f"به درس {idx} از کتاب {b} دوره ۴۰۰۰ واژه خوش آمدید: {theme_fa}.", 0, 6000),
            ("Sarah", f"Today we focus on {len(words)} high-frequency vocabulary words used in real-life contexts.", f"امروز بر روی {len(words)} واژه پرکاربرد در موقعیت‌های واقعی تمرکز می‌کنیم.", 6300, 13500),
            ("Alex", f"Listen closely to the natural rhythm, pronunciation, and collocations.", f"به ریتم طبیعی، تلفظ دقیق و همایندهای هر عبارت هدف خوب گوش فرا دهید.", 13800, 21000),
            ("Sarah", f"Now head over to the shadowing section to record these sentences in your own voice!", f"حالا به بخش شادوئینگ بروید تا این جملات را با صدای خودتان تمرین و ضبط کنید!", 21400, 29000)
        ]
        for pl_no, (spk, orig, trans, s_ms, e_ms) in enumerate(p_lines):
            orig_c = orig.replace("'", "''")
            trans_c = trans.replace("'", "''")
            pl_vals.append(f"('{podcast_id}', {pl_no}, '{spk}', '{orig_c}', '{trans_c}', {s_ms}, {e_ms})")
        parts.append("INSERT INTO podcast_lines (podcast_id, position, speaker, text, translation_fa, start_ms, end_ms)\nVALUES\n" + ",\n".join(pl_vals) + "\nON CONFLICT DO NOTHING;\n")

    parts.append(f"""-- +migrate Down
DELETE FROM podcast_lines WHERE podcast_id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM podcasts WHERE id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM dialogues WHERE hotspot_id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM hotspots WHERE id LIKE '4000{b}000-0000-0000-0000-%';
DELETE FROM scenes WHERE id LIKE '4000{b}000-0000-0000-0000-%';
""")
    return "\n".join(parts)

out_dir = '/Users/apple/Desktop/project_go/Shadowing-backend/internal/repository/postgres/migrations'
for cfg in BOOK_DATA:
    sql_content = build_sql(cfg)
    file_path = os.path.join(out_dir, cfg["file"])
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"Generated {cfg['file']} with collocations and visuals!")

print("All 6 Books updated with Collocations (Item 2) and Visuals (Item 6)!")
