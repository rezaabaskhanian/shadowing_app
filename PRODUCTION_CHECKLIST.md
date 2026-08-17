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

## سایر

- [ ] Push notification واقعی (FCM) هنوز به‌طور کامل وایر نشده — قبل از prod تکمیل و تست بشه.
- [ ] whisper-service (ارزیابی تلفظ) هنوز به اپ وصل نیست — وضعیتش قبل از prod مشخص بشه (فعال/غیرفعال).
