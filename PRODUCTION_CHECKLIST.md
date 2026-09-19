# چک‌لیست قبل از build پروداکشن

## اپ موبایل (app/)

- [ ] **آدرس بک‌اند** — `PROD_API_BASE` در [app/src/api/config.ts](app/src/api/config.ts) رو با دامنه واقعی سرور جایگزین کنید (الان placeholder با کامنت TODO هست: `https://api.yourdomain.com`).
- [ ] **`DEV_LAN_IP`** — در همون فایل، IP دستی `192.168.43.238` فقط برای dev روی گوشی واقعیه؛ چک کنید که با `__DEV__` درست از prod جدا میشه و توی build ریلیز استفاده نمیشه.
- [ ] **`BASE_URL` تکراری** در [app/src/data/scenarios.ts:5](app/src/data/scenarios.ts#L5) — هارد-کد شده و به `config.ts` وصل نیست؛ باید از همون `API_BASE` مرکزی استفاده کنه تا با تغییر آدرس prod هماهنگ بمونه.
- [ ] جستجوی کلی برای هرگونه IP/`localhost` هارد-کد باقی‌مونده دیگه (`grep -rn "localhost\|10.0.2.2\|192.168." app/src`).

## بک‌اند (Go)

- [ ] `ANTHROPIC_API_KEY` و `CLAUDE_MODEL` برای فیچر AI scene generation در env پروداکشن ست بشه.
- [ ] اتصال دیتابیس پروداکشن (نه Docker Postgres پورت 5435 لوکال) در env تنظیم بشه.
- [ ] بررسی CORS/آدرس‌های مجاز برای دامنه prod اپ.
- [ ] **صحنه‌های Draft در لیست عمومی دیده می‌شوند** — `GetAll` در [internal/repository/postgres/learning/learning_repo.go:177](internal/repository/postgres/learning/learning_repo.go#L177) (پشتِ `ListScene`/`GET /v1/scenes`) هیچ فیلتر `status`ی ندارد، یعنی صحنه‌ای که ادمین تازه ساخته و هنوز Publish نکرده هم فوراً در اپ به همه‌ی کاربران نشان داده می‌شود. `GetPublished` هم برای همین منظور در همان فایل تعریف شده ولی `panic("unimplemented")` است — پیاده نشده. اگر قرار است Draft واقعاً مخفی بماند، `ListScene`/`GetAll` (یا هندلر عمومی) باید `WHERE status = 'published'` بگیرد (یا `GetPublished` پیاده و جایگزین `GetAll` شود در مسیر عمومی)، جدا از مسیر ادمین که باید همه‌ی وضعیت‌ها را ببیند.

## سایر

- [ ] Push notification واقعی (FCM) هنوز به‌طور کامل وایر نشده — قبل از prod تکمیل و تست بشه.
- [ ] whisper-service (ارزیابی تلفظ) هنوز به اپ وصل نیست — وضعیتش قبل از prod مشخص بشه (فعال/غیرفعال).

## ظرفیت و مقیاس (Capacity / Scaling) — گفتگوی آزاد با AI

بخش گفتگوی آزاد (`aiconversation`) به ازای هر نوبت سه تا سرویس خارجی/سایدکار را صدا می‌زند: Whisper (رونویسی)، provider AI فعال (Claude/Gemini/DeepSeek)، و TTS (ElevenLabs). این سه‌تا گلوگاه واقعی زیر بار هم‌زمان هستند، نه خودِ Go runtime.

- [x] **محدودیت هم‌زمانیِ فراخوانی AI provider** — اضافه شد ([internal/service/ai/concurrency.go](internal/service/ai/concurrency.go)): یک سمافورِ سراسری (سطح پروسه، مشترک بین همه‌ی سرویس‌هایی که `aiservice.New` می‌سازند) تعداد فراخوانی هم‌زمان به provider را محدود می‌کند تا rate-limit/هزینه‌ی provider یهو نترکد. پیش‌فرض ۸، با env var `AI_MAX_CONCURRENT_REQUESTS` قابل تنظیم.
- [x] **افزایش سقف connection pool پستگرس** — اضافه شد ([internal/repository/postgres/db.go](internal/repository/postgres/db.go)): با env var `DB_MAX_CONNS` (پیش‌فرض ۱۰؛ قبلاً هیچ مقداری ست نمی‌شد و pgxpool روی پیش‌فرضِ خودش — معمولاً ۴ — می‌ماند).
- [ ] **Whisper و TTS هنوز محدودیت هم‌زمانی ندارند** — سمافورِ بالا فقط جلوی provider AI را می‌گیرد؛ اگر قرار است بار واقعی تست شود، رونویسی (Whisper sidecar) و synth صدا (ElevenLabs) هم باید یا صف/سقف بگیرند یا ظرفیتشان جدا سنجیده شود.
- [x] **کشِ تنظیمات بینِ چند instance سینک نمی‌شد** — حل شد ([settingsservice/service.go](internal/service/settings/service.go)): `StartAutoRefresh` هر ۳۰ ثانیه کش را دوباره از دیتابیس می‌خواند تا تغییرِ کلید/provider از پنل ادمین روی یک instance، با حداکثر تاخیرِ ۳۰ ثانیه به instanceهای دیگر هم برسد (قبلاً فقط instanceای که خودِ درخواست بهش رسیده بود آپدیت می‌شد).
- [x] **فایل‌های آپلودی روی دیسک محلی بودند، بین instanceها به اشتراک گذاشته نمی‌شدند** — حل شد با لایه‌ی انتزاعیِ [internal/pkg/filestore](internal/pkg/filestore): پیش‌فرض دقیقاً همان رفتارِ قبلی (دیسکِ محلی، تک-instance). با تنظیمِ `OBJECT_STORAGE_ENDPOINT` + `OBJECT_STORAGE_BUCKET` + `OBJECT_STORAGE_ACCESS_KEY` + `OBJECT_STORAGE_SECRET_KEY` (و اختیاری `OBJECT_STORAGE_PUBLIC_BASE_URL`, `OBJECT_STORAGE_USE_SSL`) به یک object storage سازگار با S3 (مثلاً Arvan/Liara) سوییچ می‌کند — تا آن موقع تنظیم نشوند، اپ دقیقاً مثل قبل روی دیسک محلی کار می‌کند. مسیرهایی که migrate شدند: TTS گفتگوی AI ([synthesize.go](internal/service/aiconversation/synthesize.go))، آپلود/تولید صدای دیالوگ در پنل ادمین، آپلود تصویر صحنه (ادمین + پیشنهاد کاربر). فایل‌های موقتِ صدای کاربر (که بعد از رونویسی پاک می‌شوند) عمداً migrate نشدند — چون هیچ‌وقت از یک instance به instance دیگر خوانده نمی‌شوند.
  - **هنوز باقی مونده:** واقعاً یک باکت (Arvan/Liara/...) تهیه و env varهای بالا ست بشن؛ کد آماده‌ست ولی تا این کار انجام نشه، چند-instance کردنِ backend همچنان با ازدست‌رفتنِ فایل‌های قدیمی (روی دیسکِ instanceِ قبلی) روبرو می‌شه.

### تصمیمِ معماریِ آینده: Realtime Voice API برای گفتگوی AI

فعلاً معماریِ گفتگوی آزاد همون cascade سه‌مرحله‌ای فعلیه: کاربر صدا آپلود می‌کنه → Whisper رونویسی → Claude/Gemini/DeepSeek پاسخ متنی → ElevenLabs TTS. **این عمداً عوض نشده** — همه‌ی کارهای امروز (توکن، سمافور، DB pool، سینک تنظیمات، filestore) فقط blockerهای چند-instance شدنِ همین معماری رو برداشتن، نه اینکه خودِ معماری رو تغییر بدن.

یه پیشنهادِ جایگزین هم مطرح شد (۲۰۲۶-۰۹-۱۸): بردنِ گفتگوی صوتی به یک Realtime Voice API (مثل OpenAI Realtime یا Gemini Live) که audio مستقیم بینِ اپ و سرویسِ AI رد و بدل بشه، بدون عبور از Go — latency خیلی کمتر، و بارِ Whisper/TTS از رویِ سرورِ خودمون برداشته می‌شه. تصمیم گرفته شد **الان** این کار انجام نشه، چون:
- تغییرِ معماریِ بزرگیه (streaming واقعی سمتِ اپ، provider جدید فقط برای این فیچر، چون Claude realtime voice نداره).
- هنوز مقیاسی نیستیم که مشکلِ واقعیِ latency/ظرفیت را با چشم دیده باشیم.

**اگه به این مشکلات برخوردیم، برگردیم و این تصمیم رو بازبینی کنیم:**
- کاربرها از تاخیرِ گفتگو (چند ثانیه بینِ حرف‌زدن و شنیدنِ پاسخ) شکایت کردن.
- RAM/CPU سرور به‌خاطرِ Whisper+TTس همزمان (نه بقیه‌ی فیچرها) واقعاً تنگنا شد، حتی بعد از افزایش RAM طبق بخشِ بالا.
- تصمیم گرفتیم روی مقیاسِ واقعاً بزرگ (چند صد کاربرِ همزمانِ گفتگو) بریم، نه فقط چند ده نفر.

اگه هرکدوم از این‌ها پیش اومد، این بخش رو دوباره باز کنیم — گزینه‌ی جدی‌ترش احتمالاً Gemini Live API‌ه چون Gemini همین الان provider دومِ پروژه‌ست.

### باید حتماً RAM سرور را افزایش بدیم

سرور فعلی (aramina) طبق یادداشت‌های قبلی پروژه **~۱.۹GB RAM** دارد و بین چند پروژه‌ی غیرمرتبط (`trarium-app`، `wallpaper-*`) مشترک است. طبق [docker-compose.prod.yaml](docker-compose.prod.yaml) فقط استک همین پروژه (Shadowing) شامل ۶ کانتینر است — `postgres`، `xray`، `whisper`، `backend`، `admin` (Next.js)، `landing` (Next.js) — و هیچ‌کدام `mem_limit`/`deploy.resources.limits` ندارند، یعنی هرکدام می‌توانند تا جایی که host اجازه بدهد رم بگیرند.

تخمینِ مهندسیِ مصرفِ idle/سبک هر سرویس (نه اندازه‌گیری‌شده، تخمین بر اساس نوع سرویس):

| سرویس | تخمین RAM idle |
|---|---|
| postgres:15-alpine | ~۸۰–۱۵۰MB |
| xray (سایدکار پراکسی) | ~۲۰–۴۰MB |
| whisper (faster-whisper base.en, cpu, int8) | ~۳۰۰–۵۰۰MB (+ اسپایک به‌ازای هر رونویسیِ هم‌زمان) |
| backend (Go) | ~۳۰–۸۰MB (+ بافرِ آپلودِ صوت زیرِ بار) |
| admin (Next.js prod server) | ~۱۵۰–۲۵۰MB |
| landing (Next.js prod server) | ~۱۵۰–۲۵۰MB |
| **جمع، فقط استکِ این پروژه** | **~۷۳۰MB–۱.۲۷GB** |

یعنی حتی قبل از هر ترافیک واقعی، فقط استکِ خودِ این پروژه رویِ ۱.۹GB سرور جا تنگ می‌کند — چه برسد به پروژه‌های دیگری که رویِ همین سرور هستند. همین موضوع دلیلِ اصلیِ قاعده‌ی «هیچ‌وقت چند سرویس را با هم `--build` نکن روی این VPS» بود (سابقه‌ی swap-thrashing).

**پیشنهاد (به ترتیب اولویت):**
1. **حداقلِ فوری برای پایداریِ وضعِ فعلی (ترافیک کم):** یک VPS **۴GB اختصاصی** (نه مشترک با `trarium-app`/`wallpaper-*`) — همین الان هم عملاً لازم است، صرف‌نظر از تعداد کاربر گفتگوی AI.
2. **برای چند ده کاربرِ هم‌زمانِ گفتگوی AI:** **۸GB** — چون هر نوبتِ گفتگو یک رونویسیِ Whisper (سنگین‌ترین مصرف‌کننده‌ی رم به ازای هر درخواست) را هم‌زمان با فراخوانی AI/TTS بار می‌کند.
3. **برای مقیاسِ واقعیِ هزاران کاربرِ هم‌زمان:** دیگر مسئله‌ی «یک VPS بزرگ‌تر» نیست — نیاز به **مقیاس افقی** دارد: چند نمونه از `backend`/`whisper` پشتِ یک لودبالانسر، Postgres مدیریت‌شده/جدا از سرورِ اپ، و به‌احتمال زیاد جدا کردنِ Whisper روی سرورِ (یا سرورهای) اختصاصیِ خودش. این یک تصمیمِ زیرساختیِ جدا است، نه صرفاً افزایشِ RAM یک سرور.
