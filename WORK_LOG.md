# گزارش کار — جلسه‌ی توسعه

> این سند خلاصه‌ی کارهایی است که در این جلسه روی پروژه‌ی Shadowing انجام شد
> (بک‌اند Go + پنل ادمین Next.js + اپ React Native).

---

## ۱. راه‌اندازی لوکال

- **PostgreSQL** با Docker بالا آمد (مطابق تنظیمات هاردکدِ [cmd/main.go](cmd/main.go)):
  - کانتینر: `shadowing-pg` — پورت **5435** (بیرون) → 5432 (داخل)
  - کاربر: `reza_abasi` — رمز: `r1367R1367` — دیتابیس: `shadowing-backend_db`
  ```bash
  docker run --name shadowing-pg \
    -e POSTGRES_USER=reza_abasi -e POSTGRES_PASSWORD=r1367R1367 \
    -e POSTGRES_DB=shadowing-backend_db -p 5435:5432 -d postgres:15
  ```
- **بک‌اند از ریشه‌ی پروژه** اجرا می‌شود (نه از داخل `cmd/`):
  ```bash
  go run ./cmd/main.go   # روی پورت 8088
  ```
- ورود ادمین: تلفن `09000000000` / رمز `admin123`.

### اصلاح مسیرِ اجرا
- مسیر migration در [migrator.go](internal/repository/migrator/migrator.go) از `../internal/...` به `internal/...` تغییر کرد تا هم migration و هم پوشه‌ی `uploads/` نسبت به **ریشه** درست حل شوند.

---

## ۲. رفع باگ‌های بک‌اند

- **migration 004**: تابع `update_updated_at_column()` که تریگرها به آن نیاز داشتند اما هیچ‌جا تعریف نشده بود، اضافه شد (داخل `StatementBegin/End`).
- **خطای ۵۰۰ در `GET /v1/scenes/:id`** ([learning_repo.go](internal/repository/postgres/learning/learning_repo.go) → `GetByID`):
  1. اسکن هات‌اسپات ۲ ستون کم داشت → `created_at, updated_at` اضافه شد.
  2. اسکن دیالوگ ۱ ستون اضافه داشت → `updated_at` از SELECT حذف شد.
  3. **علت اصلی**: `partial_hint` در seed مقدار `NULL` بود و به `string` اسکن می‌شد → با `COALESCE(...,'')` روی `translation`/`audio_url`/`partial_hint` حل شد.
  4. چک‌های `rows.Err()` اضافه شد.

---

## ۳. صحنه‌ی کافه (نمونه با صدای واقعی)

- صحنه‌ی **«At the Coffee Shop»** (`id: 660e8400-...0000`) در DB ساخته شد: عکس Unsplash + ۲ هات‌اسپات (Counter, Pickup) + ۱۲ دیالوگ.
- برای هر دیالوگ **mp3 واقعی** با TTS مک (`say -v Samantha` + `lame`) ساخته و در [uploads/cafe/](uploads/cafe/) گذاشته شد؛ `audio_url` = `/uploads/cafe/*.mp3`.
- SQLها: [uploads/cafe/seed_cafe.sql](uploads/cafe/seed_cafe.sql) و `seed_cafe_words.sql`.
- نکته: صداهای seedِ **سوپرمارکت** هنوز لینک voca.ro (غیرقابل‌پخش) هستند.

---

## ۴. اصلاحات اپ موبایل ([SceneScreen.tsx](app/src/screens/SceneScreen.tsx))

- **پخش خودکار دیالوگ‌ها**: با پایان صدای هر دیالوگ خودکار به بعدی می‌رود.
- **دکمه‌های کنترل**: ردیف «قبلی / پخش‌ومکث / بعدی» جایگزین دکمه‌های مبهم شد.
- **رفع نبود صدا (اندروید)** ([AudioPlayer.tsx](app/src/components/AudioPlayer.tsx)):
  - `mediaPlaybackRequiresUserAction={false}` + `mixedContentMode="always"`.
  - HTML بازنویسی شد تا **روی لود خودکار پخش کند** (رفع ریسِ postMessage).
- **رفع نبود دکمه‌ها**: `marginBottom/paddingBottom` به کارت دیالوگ اضافه شد تا پشت نوار ناوبری اندروید نرود.
- **مخفی‌کردن تب‌بار** روی صفحه‌ی صحنه ([AppNavigator.tsx](app/src/navigation/AppNavigator.tsx) → `tabBarStyle: { display: 'none' }`).
- **زوم/سنترکردن**: تصویر داخل `Animated.View` با `transform: [translateX, translateY, scale]` قرار گرفت و فرمول درست شد تا نقطه‌ی فعال نزدیک مرکز بیاید؛ **آیکون‌های هات‌اسپات حذف شدند** (فقط زوم/جابه‌جایی).

---

## ۵. واژه‌ها + جعبه‌ی لایتنر (اپ)

- **نمایش واژه‌ها**: دکمه‌ی «واژه‌ها» در کارت دیالوگ → شیت [WordsSheet.tsx](app/src/components/WordsSheet.tsx) با واژه‌ها و معنی.
- **جعبه‌ی لایتنر** ([VocabContext.tsx](app/src/data/VocabContext.tsx) + [LeitnerBoxModal.tsx](app/src/components/LeitnerBoxModal.tsx)):
  - ۵ سطح؛ دکمه‌ی `+` برای افزودن.
  - **فلش‌کارت**: معنی پیش‌فرض مخفی، دکمه‌ی کوچک «معنی»، هر بار باز شدن دوباره مخفی.
  - **ماندگاری با AsyncStorage** (پکیج `@react-native-async-storage/async-storage` نصب شد — نیاز به **بیلد نیتیو مجدد**).
  - **زمان‌بندی مرور**: هر واژه `nextReview` بر اساس سطح (۱/۲/۴/۷/۱۵ روز)؛ تب «امروز/همه» + برچسب موعد.
- واژه‌نامه‌ی محلی: [vocabulary.ts](app/src/data/vocabulary.ts) (fallback وقتی بک‌اند واژه ندارد).

---

## ۶. واژه‌ها در بک‌اند (سرتاسر)

- **migration 007**: ستون `words JSONB` روی جدول `dialogues`.
- دامنه `DialogueWord`، DTO `Word`، درج/خواندن JSON در repo، نگاشت در سرویس (`toWordDTOs`).
- در `POST /admin/scenes` ذخیره و در `GET /v1/scenes/:id` برگردانده می‌شود.
- **پنل ادمین**: بخش «📚 واژه‌های این دیالوگ» در [SceneCreator.tsx](admin-panel/app/dashboard/SceneCreator.tsx).
- **اپ**: [WordsSheet](app/src/components/WordsSheet.tsx) اول واژه‌های بک‌اند را نشان می‌دهد، در نبودشان واژه‌نامه‌ی محلی.
- واژه‌های صحنه‌ی کافه در DB پر شدند.

---

## ۷. تولید صحنه با هوش مصنوعی (Claude)

- **SDK رسمی Go** (`anthropic-sdk-go`) اضافه شد.
- سرویس [internal/service/ai](internal/service/ai/generate_scene.go): با یک پرامپت ساده، کل JSON صحنه (دیالوگ + ترجمه + واژه‌ها + `image_prompt`) را می‌سازد.
  - env: `ANTHROPIC_API_KEY` (الزامی) و `CLAUDE_MODEL` (پیش‌فرض `claude-opus-4-8`؛ برای تست ارزان `claude-haiku-4-5`).
- endpoint جدید: **`POST /v1/admin/generate-scene`** (پشت JWT+Admin) — چیزی ذخیره نمی‌کند، فقط فرم را پر می‌کند. **مسیر دستی دست‌نخورده ماند.**
- **پنل ادمین**: کارت «🤖 تولید با هوش مصنوعی» بالای فرم.
- اجرا با کلید:
  ```bash
  ANTHROPIC_API_KEY=sk-ant-... CLAUDE_MODEL=claude-haiku-4-5 go run ./cmd/main.go
  ```

### وضعیت تست
- کد/اتصال/کلید/مدل ✅ درست — ولی اکانت Anthropic **۰ اعتبار** داشت (خطای billing). باید در Plans & Billing شارژ شود.
- ⚠️ کلیدی که در چت پیست شد **لو رفته و باید Revoke شود**.

---

## کارهای باقی‌مانده / پیشنهادها
- شارژ اعتبار Anthropic و تست واقعی تولید صحنه.
- افزودن **تولید خودکار عکس** (از `image_prompt` با Gemini/GPT-image) و **تولید صدا** (ElevenLabs) به همان خط لوله.
- جایگزینی صداهای voca.ro صحنه‌ی سوپرمارکت با mp3 واقعی.
- انتقال seedِ کافه به یک migration دائمی (مثل `008_seed_cafe_scene.sql`).
