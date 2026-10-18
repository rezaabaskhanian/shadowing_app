// Package adminnotice قرارداد مشترک «خبر دادن به ادمین» است: هر سرویسی که
// کاربر از طریقش با ادمین تعامل می‌کند (پیشنهاد و انتقاد، پیشنهاد صحنه و
// موضوع، خرید) یک Notice می‌فرستد و adminbotservice آن را به تلگرام/بله
// می‌رساند. جدا از adminbot است تا سرویس‌ها به آن وابسته نشوند.
package adminnotice

import (
	"strconv"
	"strings"
)

// انواع تعامل؛ در پیام ربات هم می‌آید تا جواب ادمین به همان بخش برگردد.
const (
	KindFeedback     = "feedback"
	KindSubmission   = "submission"
	KindTopic        = "topic"
	KindSubscription = "subscription"
	KindTopup        = "topup"
)

// Notice یک خبر برای ادمین. Section عنوان بخشی است که کاربر از آن پیام داده.
type Notice struct {
	Kind    string
	Section string
	Body    string
	UserID  string
	RefID   string
}

// Notifier خبر را بدون معطل کردن درخواست کاربر می‌فرستد.
type Notifier interface {
	Notify(n Notice)
}

// Nop وقتی ربات تنظیم نشده.
type Nop struct{}

func (Nop) Notify(Notice) {}

// Toman عدد را با جداکننده‌ی هزارگان می‌نویسد: 129000 ← «129,000 تومان».
func Toman(n int) string {
	s := strconv.Itoa(n)
	var b strings.Builder
	for i, c := range s {
		if i > 0 && (len(s)-i)%3 == 0 {
			b.WriteByte(',')
		}
		b.WriteRune(c)
	}
	return b.String() + " تومان"
}
