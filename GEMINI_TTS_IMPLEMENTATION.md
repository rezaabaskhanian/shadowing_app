# پیاده‌سازی Gemini 3.8 Flash TTS

تاریخ: ۲۰۲۶-۰۹-۲۷

## هدف
ElevenLabs به‌خاطر خطای 402 و بلاک 401 `unusual_activity` عملاً از کار افتاده بود. Gemini TTS
به‌عنوان provider دوم اضافه شد که از همان `GEMINI_API_KEY` فعلی استفاده می‌کند و از پنل
ادمین، بدون ری‌استارت، قابل سوییچ است. ElevenLabs حذف نشده و هنوز پیش‌فرض است.

## محدوده
- TTS فقط در **پنل ادمین** استفاده می‌شود: صدای دیالوگ‌های صحنه، grammar note و آیتم‌های Assessment.
- AI Conversation طبق تصمیم قبلی محصول صدا تولید نمی‌کند
  ([synthesize.go](internal/service/aiconversation/synthesize.go)). این رفتار **عمداً تغییر نکرد**.

## تغییرات بک‌اند

| فایل | تغییر |
|---|---|
| [internal/service/tts/service.go](internal/service/tts/service.go) | **جدید.** `Service` حالا dispatcher است. طبق `TTS_PROVIDER` بین `elevenlabs` و `gemini` سوییچ می‌کند و پیش‌فرض `elevenlabs` است. خروجی `GenerateSpeech` از `[]byte` به `Audio{Data, ContentType, Ext}` تغییر کرد. متدهای `ProviderName()` و `MissingKeyMessage()` اضافه شدند. |
| [internal/service/tts/elevenlabs.go](internal/service/tts/elevenlabs.go) | به `elevenLabsProvider` (خصوصی) تبدیل شد. منطق فراخوانی تغییری نکرد. |
| [internal/service/tts/gemini.go](internal/service/tts/gemini.go) | **جدید.** این فایل REST `generateContent` را با `responseModalities: ["AUDIO"]` و `prebuiltVoiceConfig` صدا می‌زند و از همان پراکسی خروجی (`outboundhttp`) رد می‌شود. |
| [internal/service/tts/audio.go](internal/service/tts/audio.go) | **جدید.** تابع `isWAV`، تابع `pcmToWAV` (برای مدل‌های قدیمی که PCM خام می‌دهند) و تابع `wavToMP3` با ffmpeg. |
| [internal/service/tts/audio_test.go](internal/service/tts/audio_test.go) | **جدید.** تست هدر WAV، پارس نرخ نمونه، دستور سرعت و تبدیل واقعی mp3. |
| [internal/service/settings/service.go](internal/service/settings/service.go) | سه کلید جدید: `TTS_PROVIDER`، `GEMINI_TTS_MODEL` و `GEMINI_TTS_VOICE`. |
| [internal/delivery/httpserver/admin/settings.go](internal/delivery/httpserver/admin/settings.go) | پاسخ تنظیمات حالا `tts_provider`، `gemini_tts_model` و `gemini_tts_voice` را هم برمی‌گرداند. |
| [internal/delivery/httpserver/admin/generate_audio.go](internal/delivery/httpserver/admin/generate_audio.go) | پسوند و content-type فایل از خروجی provider گرفته می‌شود. پیام «کلید تنظیم نشده» هم حالا به provider فعال بستگی دارد. |
| [internal/delivery/httpserver/admin/tts_voices.go](internal/delivery/httpserver/admin/tts_voices.go) | پیام «کلید تنظیم نشده» به provider فعال بستگی دارد. |

### تصمیم‌های فنی
- **مدل پیش‌فرض:** `gemini-3.8-flash-tts`. برای سرعت بیشتر و هزینه‌ی کمتر می‌شود `GEMINI_TTS_MODEL=gemini-3.8-flash-lite-tts` گذاشت. schema هر دو یکی است.
- **صدای پیش‌فرض:** `Kore` (زن). endpoint لیست صدا در Gemini وجود ندارد، برای همین لیست ثابتِ ۳۰ صدای آماده
  (۱۴ زن و ۱۶ مرد) در `gemini.go` آمده. endpoint `/v1/admin/tts-voices` همان فرمت قبلی را برمی‌گرداند
  و فرانت برای انتخاب صدا تغییری لازم نداشت.
- **سرعت:** Gemini پارامتر عددی سرعت ندارد. عدد سرعت پنل (۰٫۷ تا ۱٫۲) به یک دستور متنی تبدیل
  می‌شود، مثل `Speak at a slow, careful pace.`. در سرعت عادی هیچ دستوری فرستاده نمی‌شود.
  - **Gemini 3.8:** متن دیالوگ **دست‌نخورده** در `text` می‌رود و دستور سرعت جدا در `speechMetadata.style` قرار می‌گیرد
    (بخش «اصلاح» پایین را ببینید).
  - **مدل‌های قدیمی‌تر (2.5/3.1):** دستور به روش مستند `... Say the following:` جلوی متن می‌آید.
- **فرمت خروجی:** نسخه‌ی 3.8 فایل WAV با هدر RIFF می‌دهد و نسخه‌های قبلی PCM خام 24kHz. هر دو حالت پشتیبانی می‌شوند.
  خروجی بعد با **ffmpeg** (که از قبل در ایمیج Docker برای Whisper نصب است) به **mp3** تبدیل می‌شود.
  با این کار فرمت با فایل‌های قبلی یکی می‌ماند و حجم حدود ۱۰ برابر کمتر می‌شود. اگر ffmpeg خطا بدهد، همان WAV
  ذخیره می‌شود و یک warning در لاگ ثبت می‌شود.

## تغییرات پنل ادمین
| فایل | تغییر |
|---|---|
| [admin-panel/app/dashboard/SettingsPanel.tsx](admin-panel/app/dashboard/SettingsPanel.tsx) | کارت جدید «🔊 ارائه‌دهنده‌ی تولید صدا (TTS)» با دو دکمه‌ی ElevenLabs و Gemini TTS. دو فیلد جدید هم اضافه شد: `GEMINI_TTS_MODEL` و `GEMINI_TTS_VOICE`. |
| [admin-panel/lib/types.ts](admin-panel/lib/types.ts) | سه فیلد جدید به `SettingsResp` اضافه شد. |
| [admin-panel/lib/api.ts](admin-panel/lib/api.ts) | فقط کامنت اصلاح شد. |

نکته: لیست صداها در صفحه‌ی صحنه و Assessment یک بار موقع باز شدن صفحه بارگذاری می‌شود. بعد از
سوییچ provider باید آن صفحه را رفرش کرد.

## وضعیت تست
- ✅ `go build ./...` بدون خطا اجرا شد.
- ✅ `go test ./internal/service/tts/` پاس شد، شامل تبدیل واقعی WAV به mp3 با ffmpeg محلی.
- ✅ `npx tsc --noEmit` در admin-panel بدون خطا اجرا شد.
- ⏳ **تست واقعی با API گوگل هنوز انجام نشده** (به کلید و پراکسی سرور نیاز دارد). مراحل تست در بخش بعد آمده.

## مراحل دیپلوی و تست روی سرور
1. کامیت، push و pull روی VPS.
2. ساخت ایمیج‌ها **جدا از هم**، چون RAM سرور کم است:
   ```bash
   docker compose -f docker-compose.prod.yaml build backend
   docker compose -f docker-compose.prod.yaml build admin
   docker compose -f docker-compose.prod.yaml up -d
   ```
3. در پنل ادمین، بخش تنظیمات:
   - مطمئن شوید «کلید Gemini» ست شده و پراکسی خروجی وصل است.
   - در کارت «ارائه‌دهنده‌ی تولید صدا» گزینه‌ی **Gemini TTS** را بزنید.
4. صفحه‌ی ساخت صحنه را رفرش کنید. در لیست صداها باید اسم‌هایی مثل Kore و Puck دیده شود.
5. برای یک دیالوگ صدا بسازید و چک کنید:
   - فایل `.mp3` ذخیره شده باشد.
   - صدا در اپ اندروید پخش شود.
   - سرعت‌های ۰٫۷ و ۱٫۲ فرق محسوسی داشته باشند.
6. اگر خطا گرفتید، پیام کامل خطا در پنل نمایش داده می‌شود (status code و body گوگل). خطاهای محتمل:
   - `403` / `PERMISSION_DENIED` → این کلید به مدل TTS دسترسی ندارد یا billing فعال نیست (free tier برای این مدل اعلام نشده).
   - `400 location not supported` → پراکسی وصل نیست یا IP آن در منطقه‌ی مجاز نیست.
   - `404` → اسم مدل در `GEMINI_TTS_MODEL` اشتباه است.

## هزینه (قیمت‌های اعلام‌شده تا پایان ۲۰۲۶)
- Flash TTS: ورودی ۰٫۵ دلار و خروجی صوتی ۹ دلار برای هر یک میلیون توکن.
- Flash-Lite TTS: ورودی ۰٫۵ دلار و خروجی ۶ دلار برای هر یک میلیون توکن.
- هزینه‌ی هر دقیقه صدا تقریباً یک سنت است. این تخمین فرض می‌کند حدود ۲۵ توکن صوتی برای هر ثانیه تولید می‌شود و هنوز تأیید نشده است.

## کارهای باقی‌مانده / ایده‌ها
- [ ] تست واقعی روی سرور (مراحل بالا).
- [ ] اگر کیفیت و قیمت خوب بود، `TTS_PROVIDER=gemini` را به‌عنوان پیش‌فرض بگذاریم.
- [ ] (اختیاری) Gemini 3.8 بیش از ۲۰۰۰ صدا و Voice Design دارد. اگر لازم شد، `GEMINI_TTS_VOICE` هر اسم صدای
  معتبری را قبول می‌کند، حتی اگر در لیست ثابت نباشد.
- [ ] (اختیاری) تولید صدای یک دیالوگ چندنفره در یک درخواست با `multiSpeakerVoiceConfig`.

---

## تغییر جانبی: باکس «تولید با هوش مصنوعی» در ساخت صحنه (۲۰۲۶-۰۹-۲۷)
- در [SceneCreator.tsx](admin-panel/app/dashboard/SceneCreator.tsx) فیلد پرامپت از `input` یک‌خطی به `textarea` چندخطی تغییر کرد: ۶ خط، ارتفاع قابل تغییر با کشیدن گوشه.
- حالا `Enter` خط جدید می‌سازد و **Ctrl/⌘ + Enter** تولید را شروع می‌کند. دکمه‌ی «✨ تولید» زیر باکس قرار گرفت.
- بک‌اند محدودیت طول برای پرامپت ندارد، پس تغییری در بک‌اند لازم نبود.

---

## اصلاح: خوانده شدن «Read the following…» در ابتدای صدا (۲۰۲۶-۰۹-۲۷)
**مشکل:** در تست واقعی، Gemini 3.8 ابتدای صدا جمله‌ی «Read the following text aloud clearly and naturally…» را هم خواند.

**علت:** در Gemini 3.8 فیلد `text` کلمه‌به‌کلمه خوانده می‌شود. فقط تگ‌هایی مثل `<laugh>` و `<short pause>` خوانده نمی‌شوند.
دستورِ سبک و سرعت باید در فیلد جداگانه‌ی `speechMetadata.style` بیاید. مدل‌های 2.5 و 3.1 این فیلد را قبول نمی‌کنند و
خطای 400 می‌دهند.

**راه‌حل:** در [gemini.go](internal/service/tts/gemini.go):
- تابع `buildTTSPart`: برای مدل‌های `gemini-3.8*`، متن دیالوگ بدون هیچ پیشوندی فرستاده می‌شود. اگر سرعت غیرعادی
  انتخاب شده باشد، `speechMetadata: {style: "..."}` هم اضافه می‌شود. برای مدل‌های قدیمی‌تر، پیشوند فقط وقتی اضافه
  می‌شود که سرعت غیرعادی باشد.
- اگر Gemini درخواست دارای دستور سرعت را با 400 رد کند، **یک بار بدون دستور سرعت** دوباره تلاش می‌شود و یک warning
  در لاگ ثبت می‌شود. به این ترتیب ساخت صدا به‌خاطر سرعت شکست نمی‌خورد.
- فراخوانی HTTP به تابع `call` منتقل شد تا بشود دوباره تلاش کرد.
- تست `TestBuildTTSPart` اضافه شد. همه‌ی تست‌ها پاس شدند.

**باید روی سرور چک شود:**
- صدای یک دیالوگ با سرعت پیش‌فرض دوباره ساخته شود و فقط خود متن خوانده شود.
- صدای دیالوگ با سرعت ۰٫۷ ساخته شود و دیده شود که کندتر است، یا در لاگ backend پیام
  `gemini rejected pace style` آمده است. آمدن این پیام یعنی `speechMetadata` پذیرفته نشده و سرعت اعمال نمی‌شود.
- صداهایی که قبل از این اصلاح ساخته شده‌اند، جمله‌ی اضافه را دارند و باید دوباره ساخته شوند.

---

## افزودن OpenRouter به‌عنوان provider سوم TTS (۲۰۲۶-۰۹-۲۷)
**مشکل:** کلید Gemini روی free tier است. سقف مدل `gemini-3.8-flash-tts` در این حالت **۱۰ درخواست در روز** است و
خطای `429 RESOURCE_EXHAUSTED` با پیام `GenerateRequestsPerDayPerProjectPerModel-FreeTier` برگشت. هر بار زدن دکمه‌ی ساخت صدا
برای یک دیالوگ یک درخواست حساب می‌شود.

**راه‌حل:** provider جدید `openrouter` با کلید `OPENROUTER_API_KEY` که از قبل داشتیم. مدل پیش‌فرض همان
`google/gemini-3.8-flash-tts` است، ولی از اعتبار پرداختی OpenRouter استفاده می‌کند و سقف free tier گوگل را ندارد.
قیمت آن همان قیمت گوگل است: ورودی ۰٫۵ دلار و خروجی ۹ دلار برای هر یک میلیون توکن.

| فایل | تغییر |
|---|---|
| [internal/service/tts/openrouter.go](internal/service/tts/openrouter.go) | **جدید.** `POST https://openrouter.ai/api/v1/audio/speech` با `model`، `input` (متن دست‌نخورده)، `voice` و `response_format: pcm`. خروجی PCM خام 24kHz است که به WAV و بعد به mp3 تبدیل می‌شود. برای مدل‌های `google/*`، سرعت در `provider.options["google-ai-studio"].speech_metadata.style` می‌رود. برای بقیه‌ی مدل‌ها (مثلاً OpenAI) پارامتر عددی `speed` فرستاده می‌شود. اگر درخواست دارای دستور سرعت با 400 رد شود، یک بار بدون آن دوباره تلاش می‌شود. |
| [internal/service/tts/openrouter_test.go](internal/service/tts/openrouter_test.go) | **جدید.** تست بدنه‌ی درخواست برای مدل Google و مدل غیر Google. |
| [internal/service/tts/service.go](internal/service/tts/service.go) | `TTS_PROVIDER` حالا مقدار `openrouter` را هم قبول می‌کند. |
| [internal/service/settings/service.go](internal/service/settings/service.go) | کلید جدید `OPENROUTER_TTS_MODEL`. |
| [internal/delivery/httpserver/admin/settings.go](internal/delivery/httpserver/admin/settings.go) | فیلد `openrouter_tts_model` به پاسخ تنظیمات اضافه شد. |
| [admin-panel/app/dashboard/SettingsPanel.tsx](admin-panel/app/dashboard/SettingsPanel.tsx) | دکمه‌ی سوم **OpenRouter** در کارت «🔊 ارائه‌دهنده‌ی تولید صدا» و فیلد «مدل TTS در OpenRouter» اضافه شد. |
| [admin-panel/lib/types.ts](admin-panel/lib/types.ts) | فیلد `openrouter_tts_model` اضافه شد. |

- صدای پیش‌فرض برای مدل‌های Gemini از همان تنظیم `GEMINI_TTS_VOICE` خوانده می‌شود (پیش‌فرض `Kore`). لیست صداهای Gemini در پنل
  هم مثل قبل نمایش داده می‌شود.
- مستند مرجع: https://openrouter.ai/docs/guides/overview/multimodal/tts. در این مستند صریحاً آمده که Gemini 3.8 فیلد input را کلمه‌به‌کلمه
  می‌خواند و style باید در `speech_metadata` بیاید. پس اصلاح قبلی هم تأیید شد.
- ✅ `go build`، `go test ./internal/service/tts/` و `tsc --noEmit` بدون خطا اجرا شدند. ⏳ تست واقعی روی سرور هنوز انجام نشده.

**تست روی سرور:**
1. `backend` و بعد `admin` را جدا از هم build کنید.
2. در پنل، بخش تنظیمات، کارت «🔊 ارائه‌دهنده‌ی تولید صدا» را پیدا کنید و **OpenRouter** را بزنید.
3. صفحه‌ی ساخت صحنه را رفرش کنید و صدای یک دیالوگ را بسازید.

**یادداشت درباره‌ی یک توصیه‌ی بیرونی:** یک پیشنهاد گفته بود «صدا را زمان اجرای اپ نساز، یک بار روی سرور بساز و روی CDN بگذار».
معماری فعلی از قبل همین است:
- TTS فقط با کلیک ادمین در پنل صدا زده می‌شود.
- فایل یک بار ساخته و در filestore ذخیره می‌شود: دیسک سرور، یا object storage اگر `OBJECT_STORAGE_*` ست شده باشد.
- اپ فقط URL فایل را پخش می‌کند و هیچ‌وقت به API گوگل وصل نمی‌شود.

همچنین برای کلمه‌های تکی (مثل «ran out») درخواست TTS فرستاده نمی‌شود. آن متن در اسکرین‌شات فقط فیلد واژه‌های فرم بود که پشت پیام خطا
دیده می‌شد.
