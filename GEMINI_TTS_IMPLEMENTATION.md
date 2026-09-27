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
  می‌شود، مثل `at a slow, careful pace`. متن همیشه داخل دستور کوتاه
  `Read the following text aloud clearly and naturally:` قرار می‌گیرد، چون بدون آن مدل روی متن‌های
  خیلی کوتاه ممکن است به‌جای خواندن، «جواب» بدهد.
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
