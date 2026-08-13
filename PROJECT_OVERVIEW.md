# مستندات پروژه Shadowing (اپلیکیشن یادگیری زبان انگلیسی)

> این سند ساختار، معماری و جریان کاری پروژه را توضیح می‌دهد و پس از افزودن پنل ادمین و اتصال اپ موبایل به بک‌اند به‌روزرسانی شده است.

---

## ۱. پروژه چیست؟

**Shadowing** یک اپلیکیشن یادگیری مکالمه‌ی زبان انگلیسی با روش «شادوئینگ» (تکرار همزمان صدا) است. کاربر وارد یک **صحنه/سناریو** (مثلاً سوپرمارکت، فرودگاه، کافه، هتل، بیمارستان، بانک) می‌شود، روی نقاط تعاملی (**Hotspot**) روی تصویر ضربه می‌زند و **دیالوگ‌ها** را همراه با صدا در چند مرحله تمرین می‌کند.

پروژه از سه بخش تشکیل شده است:

| بخش | فناوری | مسیر |
|-----|--------|------|
| **Backend** (سرور API) | Go 1.25 + Echo + PostgreSQL | [internal/](internal/) و [cmd/](cmd/) |
| **Admin Panel** (پنل مدیریت) | Next.js 14 + TypeScript | [admin-panel/](admin-panel/) |
| **Mobile App** (اپ کاربر) | React Native 0.86 + TypeScript | [app/](app/) |

جریان کلی محتوا:
> **ادمین** در پنل Next تصویر صحنه را آپلود می‌کند، روی آن نقاط هات‌اسپات می‌گذارد و برای هر نقطه دیالوگ‌هایی با **متن + ویس** تعریف می‌کند → داده در **PostgreSQL** ذخیره می‌شود → **اپ موبایل** از API عمومی می‌خواند و همان صحنه، نقاط و صداها را در تجربه‌ی شادوئینگ نمایش/پخش می‌کند.

---

## ۲. متد آموزشی: چرخه‌ی ۴ مرحله‌ای شادوئینگ

قلب اپلیکیشن یک جلسه‌ی تمرین (`Session`) است که همیشه از **۴ مرحله‌ی ثابت** تشکیل می‌شود ([session/value_objects.go](internal/domain/shadowing/session/value_objects.go)):

| # | مرحله | نام فارسی | توضیح |
|---|-------|-----------|-------|
| ۱ | `StepListen` | گوش بده | به صدای اصلی گوش کن و به تلفظ دقت کن |
| ۲ | `StepShadow` | تکرار همزمان | همزمان با صدای اصلی تکرار کن (**قابل ضبط**) |
| ۳ | `StepRecord` | ضبط مستقل | بدون صدای اصلی جمله را بگو و ضبط کن (**قابل ضبط**) |
| ۴ | `StepRepeat` | تکرار تا تسلط | تا روان شدن تمرین کن |

منطق پیشرفت در موجودیت دامنه است ([session/entity.go](internal/domain/shadowing/session/entity.go))؛ فقط مراحل ۲ و ۳ امکان ارسال ضبط دارند ([submit_recording.go](internal/service/shadowing/submit_recording.go)).

---

## ۳. معماری Backend

معماری **لایه‌ای/تمیز (Clean Architecture)**:

```
cmd/main.go                → نقطه‌ی ورود، پیکربندی، تزریق وابستگی (DI)
internal/
├── config/                → پیکربندی برنامه
├── domain/                → موجودیت‌ها و منطق تجاری خالص
│   ├── user/  learning/scene/  shadowing/  progress/
├── service/               → منطق کاربردی (Use Case) + DTOها
│   ├── auth/ user/ learning/ shadowing/ progress/
├── repository/postgres/   → مخازن + migrations (pgx)
├── delivery/httpserver/   → لایه‌ی HTTP (Echo handlers + routes)
│   ├── user/ learning/ shadowing/ progress/ admin/   ← admin جدید
│   └── middlware/         → میدل‌ور احراز هویت JWT + AdminOnly
└── pkg/                   → ابزارهای مشترک (richerror, claims, errmesg)
```

جریان درخواست: `HTTP Handler → Service → Repository → PostgreSQL`.
مدیریت خطا با الگوی سفارشی `richerror` ([pkg/richerror](internal/pkg/richerror/richerror.go)).

---

## ۴. ماژول‌ها و APIها

سرور روی پورت **8088** اجرا می‌شود. مسیرهای 🔒 نیاز به JWT دارند؛ 👑 نیاز به نقش `admin`.

### 👤 کاربر — [user/route.go](internal/delivery/httpserver/user/route.go)
`POST /v1/users/register`، `POST /v1/users/login`، `POST /v1/users/reset-pass`، `GET 🔒 /v1/users/profile`

### 📚 یادگیری/صحنه (مدیریتی) — [learning/route.go](internal/delivery/httpserver/learning/route.go)
CRUD صحنه‌ها زیر `/v1/learning/*` (همگی 🔒).

### 🌐 صحنه‌های عمومی (برای اپ موبایل) — [learning/public_route.go](internal/delivery/httpserver/learning/public_route.go)
بدون احراز هویت، فقط-خواندنی:
| متد | مسیر | کار |
|-----|------|-----|
| GET | `/v1/scenes` | لیست صحنه‌ها (سبک، بدون هات‌اسپات) |
| GET | `/v1/scenes/:id` | یک صحنه با هات‌اسپات‌ها و دیالوگ‌ها |

### 🛠️ پنل ادمین — [admin/route.go](internal/delivery/httpserver/admin/route.go)
همه زیر `/v1/admin/*` و پشت **JWT + AdminOnly** (👑):
| متد | مسیر | کار |
|-----|------|-----|
| POST | `/v1/admin/upload` | آپلود تصویر پس‌زمینه → `{url}` |
| POST | `/v1/admin/upload-audio` | آپلود **ویس** دیالوگ → `{url}` |
| POST | `/v1/admin/scenes` | ساخت صحنه با هات‌اسپات‌ها و دیالوگ‌ها |
| GET | `/v1/admin/scenes` | لیست |
| GET | `/v1/admin/scenes/:id` | جزئیات |
| DELETE | `/v1/admin/scenes/:id` | حذف |

فایل‌های آپلودشده روی دیسک در پوشه‌ی `uploads/` ذخیره و به‌صورت استاتیک از مسیر `/uploads/*` سرو می‌شوند.

### 🎙️ شادوئینگ — [shadowing/route.go](internal/delivery/httpserver/shadowing/route.go)
شروع جلسه، مرحله‌ی جاری، ارسال ضبط، وضعیت، ریست (زیر `/v1/shadowing/session*`).

### 🏆 پیشرفت — [progress/route.go](internal/delivery/httpserver/progress/route.go)
استریک، دستاورد، XP و خلاصه (زیر `/v1/progress/*`، همگی 🔒).

---

## ۵. احراز هویت و نقش ادمین

- مبتنی بر **JWT** (`HS256`) ([service/auth/auth.go](internal/service/auth/auth.go))؛ Access Token (۲۴ ساعت) و Refresh Token (۷ روز). Claims شامل `UserID` و `Role`.
- میدل‌ور [Auth](internal/delivery/middlware/middlware.go) توکن را اعتبارسنجی و `AdminOnly` نقش `admin` را بررسی می‌کند.
- رمز عبور با **bcrypt** هش می‌شود.
- **کاربر ادمین پیش‌فرض** توسط migration [006_seed_admin_user.sql](internal/repository/postgres/migrations/006_seed_admin_user.sql) ساخته می‌شود:
  - تلفن: `09000000000` — رمز: `admin123`

---

## ۶. پایگاه داده و Migrations

- **PostgreSQL** با درایور `pgx/v5` (pool). مهاجرت‌ها با `sql-migrate`؛ در حالت غیر production هنگام استارت **خودکار** اجرا می‌شوند ([cmd/main.go](cmd/main.go)).
- فایل‌ها در [migrations/](internal/repository/postgres/migrations/): `001` کاربران، `002` صحنه/هات‌اسپات/دیالوگ، `003` پیشرفت + seed سوپرمارکت، `004` شادوئینگ، `005` پیشرفت، `006` seed ادمین.
- جدول `dialogues` شامل ستون `audio_url` است که آدرس ویس هر دیالوگ را نگه می‌دارد.

---

## ۷. پنل ادمین (Next.js) — پوشه‌ی [admin-panel/](admin-panel/)

اپ Next.js 14 (App Router + TypeScript، RTL فارسی):
- [app/login/page.tsx](admin-panel/app/login/page.tsx) — ورود؛ فقط نقش `admin`. توکن در localStorage.
- [app/dashboard/page.tsx](admin-panel/app/dashboard/page.tsx) — نگهبان احراز هویت + تب‌ها.
- [app/dashboard/SceneCreator.tsx](admin-panel/app/dashboard/SceneCreator.tsx) — آپلود تصویر، **کلیک روی تصویر برای گذاشتن هات‌اسپات**، و برای هر هات‌اسپات چند دیالوگ (گوینده، متن انگلیسی، ترجمه، نوع نمایش، مدت انتظار، و **آپلود ویس** با پخش).
- [app/dashboard/SceneList.tsx](admin-panel/app/dashboard/SceneList.tsx) — لیست/جزئیات صحنه‌ها با نمایش نقاط و پخش صداها و حذف.
- [lib/api.ts](admin-panel/lib/api.ts) — فراخوانی API + مدیریت توکن.

اجرا: `cd admin-panel && npm install && npm run dev` → `http://localhost:3000` (پورت‌های 3000/3001 در CORS بک‌اند مجازند).

---

## ۸. اپ موبایل (React Native) — پوشه‌ی [app/](app/)

- **ناوبری**: Bottom Tab با ۵ تب (Home، Scenes، Shadowing، Progress، Profile) ([AppNavigator.tsx](app/src/navigation/AppNavigator.tsx)).
- **اتصال به بک‌اند** (جدید):
  - [app/src/api/config.ts](app/src/api/config.ts) — آدرس بک‌اند بر اساس پلتفرم (اندروید امولاتور `10.0.2.2:8088`، iOS `localhost:8088`) + `absUrl`.
  - [app/src/api/scenes.ts](app/src/api/scenes.ts) — دریافت صحنه‌ها و **نگاشت مدل بک‌اند به مدل اپ** (مختصات ۰..۱۰۰ → ۰..۱، دیالوگ‌ها به `conversation`، صدا/تصویر به URL مطلق).
  - [app/src/data/ScenesContext.tsx](app/src/data/ScenesContext.tsx) — `ScenesProvider`: لیست را یک بار می‌گیرد و جزئیات هر صحنه را با کش تأمین می‌کند؛ **در صورت خطا به داده‌ی محلی `scenarios.ts` برمی‌گردد** تا اپ همیشه کار کند.
- صفحات `Home`، `Scenes` و `SceneScreen` به‌جای داده‌ی محلی از `useScenes()` می‌خوانند.
- پخش صدا با کامپوننت [AudioPlayer](app/src/components/AudioPlayer.tsx) (WebView).

### رفتار خودکار پخش صحنه ([SceneScreen.tsx](app/src/screens/SceneScreen.tsx))
با ورود به یک صحنه، برای هر دیالوگ به‌ترتیب: صفحه **زوم/جابه‌جا** می‌شود تا هات‌اسپات مربوطه وسط بیاید، سپس صدای همان دیالوگ **پخش** می‌شود و بعد به دیالوگ بعدی می‌رود. منطق پیشرفت:
- **دیالوگ دارای ویس**: پس از پایان پخش صدا (رویداد `finished`) خودکار جلو می‌رود.
- **دیالوگ بدون ویس**: بعد از مکثی متناسب با طول متن (۲٫۵ تا ۶ ثانیه) خودکار جلو می‌رود تا صفحه گیر نکند.
- **خطای پخش صدا** (`error`): مانند پایان صدا رفتار می‌کند و جلو می‌رود.
- پیاده‌سازی با یک تابع پیشرفت مشترک (`advanceToNext`) و رفرنس‌های به‌روز (`playingRef`/`hotspotsLenRef`) تا از closure کهنه و تداخل تایمرها جلوگیری شود.

---

## ۹. راه‌اندازی و استقرار

```bash
# بک‌اند (پورت 8088؛ migration ها خودکار اجرا می‌شوند)
go run ./cmd/main.go

# پنل ادمین (پورت 3000)
cd admin-panel && npm install && npm run dev

# اپ موبایل
cd app && npm install && npm run ios   # یا npm run android
```
- **Dockerfile**: بیلد چندمرحله‌ای بک‌اند. `docker-compose.yaml` هنوز تکمیل نشده.

---

## ۱۰. باگ‌های رفع‌شده و نکات باقی‌مانده

### ✅ رفع شد
1. **Pointer receiver**: متدهای `Scene.AddHotspot/Publish`، `Hotspot.AddDialogue`، `Dialogue.Set*` به pointer receiver تبدیل شدند — پیش‌تر هات‌اسپات‌ها/دیالوگ‌ها اصلاً ذخیره نمی‌شدند.
2. **ذخیره‌ی `audio_url` دیالوگ**: در [create_scene.go](internal/service/learning/create_scene.go) اضافه شد (قبلاً نادیده گرفته می‌شد).
3. **احراز هویت پنل**: روت‌های `/v1/admin/*` پشت JWT + AdminOnly قرار گرفتند.
4. **register باز**: نقش کاربر در [register.go](internal/service/user/register.go) همیشه ثابت `"user"` است؛ فیلد `role` ارسالی از کلاینت دیگر نادیده گرفته می‌شود.
5. **باگ توکن**: `CreateRefreshToken` در [auth.go](internal/service/auth/auth.go) اصلاح شد تا از `RefreshSubject`/`RefreshExpirationTime` (به‌جای مقادیر access token) استفاده کند.
6. **مسیرهای shadowing** پشت میدل‌ور JWT قرار گرفتند ([shadowing/route.go](internal/delivery/httpserver/shadowing/route.go)).
7. **اعتماد به `user_id` ارسالی در بدنه‌ی درخواست shadowing**: [start_session.go](internal/delivery/httpserver/shadowing/start_session.go) حالا `UserID` را از claims توکن (`claims.GetClaims(c)`) می‌خواند، نه از بدنه‌ی درخواست.
8. **اطلاعات حساس hard-code** در [cmd/main.go](cmd/main.go): رمز/یوزر DB و `JwtSignKey` به env منتقل شدند (`DB_USERNAME`, `DB_PASSWORD`, `DB_PORT`, `DB_HOST`, `DB_NAME`, `JWT_SIGN_KEY` در [.env](.env))؛ کد فقط مقادیر دیفالت local dev را به‌عنوان fallback نگه می‌دارد.

### ⚠️ باقی‌مانده برای بهبود
1. **صداهای seed سوپرمارکت** هنوز لینک voca.ro (غیرقابل‌پخش) هستند.
2. **غلط‌های املایی نام‌گذاری**: پوشه‌ی `middlware`، متغیر `MyPostgresgresRepo`.
3. **کلید Anthropic لو‌رفته** در [.env](.env) هنوز Revoke نشده — باید در پنل Anthropic باطل و با کلید جدید جایگزین شود.

---

## ۱۱. خلاصه‌ی یک‌خطی

یک سیستم آموزش مکالمه‌ی انگلیسی مبتنی بر شادوئینگ با **بک‌اند Go لایه‌ای (Echo + PostgreSQL + JWT)**، یک **پنل ادمین Next.js** برای ساخت صحنه/هات‌اسپات/دیالوگِ صوتی، و یک **اپ موبایل React Native** که محتوا را به‌صورت زنده از بک‌اند می‌خواند.
