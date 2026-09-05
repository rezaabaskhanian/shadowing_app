# راه‌اندازی سرور اختصاصی Xray (VLESS + Reality) برای پراکسی خروجی بک‌اند

## چرا این کار لازم شد

سابسکریپشن رایگان `irnova_proxy` (روی Cloudflare Worker) از IP دیتاسنتر VPS `aramina` بلاک می‌شه:
هندشیک بیرونی TLS به کلادفلر موفق می‌شه، ولی هرموقع xray می‌خواد دیتای واقعی (ترافیک vless) رو
از روی تونل رد کنه، اتصال با `unexpected eof` قطع می‌شه. این رفتار مشخصهٔ فیلتر بر اساس ASN مبدأ روی
سرویس‌های رایگان vless-over-worker ـه — برای مصرف موبایل/رزیدنشیال طراحی شدن، نه سرور-به-سرور.

راه‌حل: یه سرور Xray اختصاصی خودمون (VLESS + **Reality**، بدون نیاز به CDN/دامنه) که چون کاملاً
تحت کنترل خودمونه، این فیلترها روش اعمال نمی‌شه.

مرجع کد مرتبط در این ریپو:
- [internal/service/proxy/vless.go](internal/service/proxy/vless.go) — پارس لینک vless و ساخت کانفیگ Xray
- [internal/service/proxy/service.go](internal/service/proxy/service.go) — نوشتن کانفیگ + تست اتصال
- [internal/pkg/outboundhttp/client.go](internal/pkg/outboundhttp/client.go) — کلاینت HTTP که از `AI_OUTBOUND_PROXY` (socks5://xray:1080) استفاده می‌کنه
- [docker-compose.prod.yaml](docker-compose.prod.yaml) — سرویس `xray` (سایدکار) و env بک‌اند
- [deploy/xray/](deploy/xray/) — Dockerfile و watch.sh سایدکار

## پیش‌نیاز

- [ ] یه VPS خارج از ایران (آلمان/فنلاند/هلند ترجیحاً برای تاخیر کمتر)، حداقل ۱ vCPU / ۱GB RAM، Ubuntu 22.04 یا 24.04.
- [ ] دسترسی SSH root (یا sudo) به اون VPS.
- [ ] IP عمومی اون VPS رو یادداشت کن — لازم می‌شه.

## مرحله ۱ — آماده‌سازی اولیهٔ سرور جدید

```bash
ssh root@<IP_VPS_JADID>
apt update && apt upgrade -y
```

فایروال پایه (فقط SSH + پورت Xray که بعداً انتخاب می‌کنیم، مثلاً 443):

```bash
ufw allow 22/tcp
ufw allow 443/tcp
ufw --force enable
```

## مرحله ۲ — نصب Xray-core

اسکریپت نصب رسمی پروژه XTLS:

```bash
bash -c "$(curl -L https://github.com/XTLS/Xray-install/raw/main/install-release.sh)" @ install
```

بعد از نصب، سرویس systemd به اسم `xray` ساخته می‌شه (فعلاً کانفیگ نداره، در مرحلهٔ بعد می‌سازیمش).

## مرحله ۳ — ساخت کلید Reality

```bash
xray x25519
```

خروجی دو خط می‌ده:
```
PrivateKey: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Password:   yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy   ← این همون Public Key ـه
```
هر دو رو یادداشت کن. یه UUID هم بساز:

```bash
xray uuid
```

## مرحله ۴ — نوشتن کانفیگ سرور

فایل `/usr/local/etc/xray/config.json` رو با این محتوا جایگزین کن (جاهایی که با `<...>` مشخص شده رو
با مقادیر خودت پر کن؛ `dest`/`serverNames` یه سایت واقعی و پرترافیکه که Reality رفتارش رو تقلید می‌کنه —
`www.microsoft.com` یه انتخاب رایج و مطمئنه):

```json
{
  "log": { "loglevel": "warning" },
  "inbounds": [
    {
      "listen": "0.0.0.0",
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          { "id": "<UUID_MRHALE_3>", "flow": "xtls-rprx-vision" }
        ],
        "decryption": "none"
      },
      "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
          "show": false,
          "dest": "www.microsoft.com:443",
          "xver": 0,
          "serverNames": ["www.microsoft.com"],
          "privateKey": "<PRIVATE_KEY_MRHALE_3>",
          "shortIds": [""]
        }
      }
    }
  ],
  "outbounds": [
    { "protocol": "freedom", "tag": "direct" }
  ]
}
```

اعتبارسنجی و ری‌استارت:

```bash
xray -test -c /usr/local/etc/xray/config.json
systemctl restart xray
systemctl enable xray
systemctl status xray --no-pager
```

## مرحله ۵ — ساخت لینک vless برای استفاده در پنل ادمین

قالب لینک (با مقادیر خودت پر کن):

```
vless://<UUID>@<IP_VPS_JADID>:443?security=reality&sni=www.microsoft.com&fp=chrome&pbk=<PUBLIC_KEY>&sid=&type=tcp&flow=xtls-rprx-vision#shadowing-outbound
```

نکته: چون `type=tcp` و `security=reality`، تابع [parseVlessLink](internal/service/proxy/vless.go#L45) توی
شاخهٔ `case "reality"` بهش `serverName`/`fingerprint`/`publicKey`/`shortId` رو از کوئری‌استرینگ می‌گیره — پس
پارامترهای `sni`، `fp`، `pbk`، `sid` باید دقیقاً همینا باشن.

## مرحله ۶ — تست از خودِ VPS جدید (قبل از وصل کردن به بک‌اند)

```bash
apt install -y curl
curl -x socks5h://... # فعلاً skip؛ می‌تونی مستقیم با یه کلاینت xray لوکال تست کنی، یا مستقیم بریم مرحله ۷
```

## مرحله ۷ — پیست کردن لینک در پنل ادمین و تست واقعی

1. وارد پنل ادمین (`admin.lingoflow.ir`) بشو → تب تنظیمات پراکسی.
2. لینک ساخته‌شده در مرحلهٔ ۵ رو پیست کن و «اتصال» رو بزن.
3. طبق [service.go](internal/service/proxy/service.go#L69) بک‌اند کانفیگ Xray سایدکار رو می‌نویسه، ۵ ثانیه صبر می‌کنه
   (تا [watch.sh](deploy/xray/watch.sh) ری‌لودش کنه)، بعد یه GET به `https://ipinfo.io/json` از طریق تونل می‌زنه.
4. اگه `connected: true` با IP همون VPS جدید برگشت، تمومه.

## عیب‌یابی

اگه بازم وصل نشد، همون دستورایی که قبلاً زدیم رو دوباره بزن:

```bash
docker logs shadowing_xray_prod --tail 60
docker exec shadowing_backend_prod curl -v -x socks5h://xray:1080 https://ipinfo.io/json --max-time 15
```

و روی خودِ VPS جدید:

```bash
journalctl -u xray -n 60 --no-pager
ss -tlnp | grep 443
```

## چک‌لیست کلی

- [ ] VPS خارج تهیه شد
- [ ] Xray نصب و کلید Reality ساخته شد
- [ ] کانفیگ سرور نوشته و سرویس ری‌استارت شد (`systemctl status xray` سبزه)
- [ ] فایروال پورت 443 باز شد
- [ ] لینک vless ساخته شد
- [ ] لینک در پنل ادمین پیست و «اتصال» تست شد (`connected: true`)
- [ ] یه درخواست واقعی (مثلاً یه دیالوگ AI که Gemini/Anthropic/ElevenLabs صدا می‌زنه) از اپ تست شد
