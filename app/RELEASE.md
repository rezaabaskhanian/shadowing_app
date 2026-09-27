# انتشار نسخه‌ی اندروید (کافه‌بازار)

## ۱. تنظیم نسخه
فقط این دو خط در [android/gradle.properties](android/gradle.properties) را عوض کنید:
```properties
APP_VERSION_NAME=1.0.0   # نسخه‌ای که کاربر می‌بیند
APP_VERSION_CODE=1       # در هر بارگذاری روی بازار حداقل ۱ واحد بیشتر شود
```
هر APK معماری versionCode جداگانه می‌گیرد: `versionCode × 1000 + (1 برای armeabi-v7a، 2 برای arm64-v8a)`.
مثلاً برای نسخه‌ی ۱ این دو عدد 1001 و 1002 می‌شوند.

## ۲. کلید امضای انتشار (فقط یک بار)
> ⚠️ کافه‌بازار آپدیت‌ها را **فقط با همان کلیدی** قبول می‌کند که اولین نسخه با آن امضا شده. اگر این کلید یا رمزش گم شود،
> دیگر نمی‌شود آپدیت داد. از فایل keystore و رمزها در جای امنی بیرون از git نسخه‌ی پشتیبان بگیرید.

```bash
cd app/android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore lingoflow-release.keystore -alias lingoflow \
  -keyalg RSA -keysize 2048 -validity 10000
```

بعد فایل `app/android/keystore.properties` را بسازید. این فایل در git نیست و نباید کامیت شود:
```properties
storeFile=lingoflow-release.keystore
storePassword=رمزی_که_وارد_کردید
keyAlias=lingoflow
keyPassword=رمزی_که_وارد_کردید
```
مسیر `storeFile` نسبت به پوشه‌ی `android/app` حساب می‌شود.

اگر این فایل نباشد، build نسخه‌ی release عمداً خطا می‌دهد تا نسخه‌ای که با کلید debug امضا شده به بازار نرود.

## ۳. ساخت خروجی
```bash
cd app/android
./gradlew clean assembleRelease
```
خروجی در `app/android/app/build/outputs/apk/release/` ساخته می‌شود:
- `LingoFlow-v1.0.0-1-arm64-v8a-release.apk` برای گوشی‌های جدید
- `LingoFlow-v1.0.0-1-armeabi-v7a-release.apk` برای گوشی‌های قدیمی ۳۲ بیتی

## ۴. مراحل کافه‌بازار
1. **نسخه‌ی ۱** (`APP_VERSION_CODE=1`): فقط برای ثبت برنامه بارگذاری می‌شود. `CAFEBAZAAR_RSA_KEY` می‌تواند خالی باشد.
2. در پنل بازار، در بخش پرداخت درون‌برنامه‌ای:
   - کلید RSA را بردارید.
   - ۴ محصول **in-app** بسازید: `shadowing_1m`، `shadowing_3m`، `shadowing_6m` و `shadowing_12m`.
   - از منوی «API پیشخان بازار» گزینه‌ی «دریافت توکن جدید» را بزنید و توکن را در `.env` سرور بگذارید:
     `CAFEBAZAAR_PACKAGE_NAME=com.shadowingapp` و `CAFEBAZAAR_API_SECRET=<توکن>`.
     روش قدیمی client id، secret و refresh token دیگر لازم نیست.
3. کلید RSA را در [src/api/config.ts](src/api/config.ts) بگذارید.
4. `APP_VERSION_CODE=2` کنید، دوباره build بگیرید و **نسخه‌ی ۲** را برای بررسی بفرستید.
