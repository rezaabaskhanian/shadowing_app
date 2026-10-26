// Package phone شماره موبایل ایران را به یک شکل واحد (09xxxxxxxxx با ارقام
// انگلیسی) درمی‌آورد. کیبورد فارسی ارقام ۰-۹ می‌فرستد و بعضی کاربرها شماره را
// بی ۰ یا با +98 می‌نویسند؛ بدون یکسان‌سازی، کاربری که با یک شکل ثبت‌نام کرده
// در فراموشی رمز یا ورود با شکل دیگر «پیدا نمی‌شد».
package phone

import "strings"

// Normalize ارقام فارسی/عربی را انگلیسی می‌کند، فاصله و خط تیره و پرانتز را
// حذف می‌کند و پیشوند +98 / 0098 / 98 یا نبودِ ۰ را به 09… برمی‌گرداند.
// ورودیِ نامعتبر بعد از تمیزکاری همان‌طور برمی‌گردد تا اعتبارسنجی بعدی ردش کند.
func Normalize(s string) string {
	var b strings.Builder
	for _, r := range strings.TrimSpace(s) {
		switch {
		case r >= '۰' && r <= '۹':
			b.WriteRune('0' + (r - '۰'))
		case r >= '٠' && r <= '٩':
			b.WriteRune('0' + (r - '٠'))
		case r >= '0' && r <= '9', r == '+':
			b.WriteRune(r)
		}
	}
	p := b.String()
	switch {
	case strings.HasPrefix(p, "+98"):
		p = "0" + p[3:]
	case strings.HasPrefix(p, "0098"):
		p = "0" + p[4:]
	case strings.HasPrefix(p, "98") && len(p) == 12:
		p = "0" + p[2:]
	case strings.HasPrefix(p, "9") && len(p) == 10:
		p = "0" + p
	}
	return p
}

// Variants شکل‌هایی است که یک شماره ممکن است قبل از یکسان‌سازی در دیتابیس
// ذخیره شده باشد (۰۹… فارسی، بی ۰، با +98)، تا کاربرهای قدیمی هم پیدا شوند.
func Variants(s string) []string {
	n := Normalize(s)
	out := []string{n}
	if strings.HasPrefix(n, "0") && len(n) == 11 {
		rest := n[1:]
		out = append(out, rest, "+98"+rest, "98"+rest, toPersian(n))
	}
	if raw := strings.TrimSpace(s); raw != n {
		out = append(out, raw)
	}
	return out
}

func toPersian(s string) string {
	var b strings.Builder
	for _, r := range s {
		if r >= '0' && r <= '9' {
			b.WriteRune('۰' + (r - '0'))
		} else {
			b.WriteRune(r)
		}
	}
	return b.String()
}
