package aiconversationservice

import "shadowing-backend/internal/domain/aiconversation"

// متن‌های جایگزین وقتی AI در دسترس نیست یا جوابِ قابل‌استفاده نمی‌دهد — هر کدام
// با ترجمه‌ی فارسیِ ثابت، تا دکمه‌ی «ترجمه» در اپ برایشان هم کار کند.
const (
	defaultOpeningText   = "Hi! Let's practice a conversation. Ready when you are!"
	defaultOpeningTextFA = "سلام! بیا یه گفتگو رو تمرین کنیم. هر وقت آماده بودی شروع کن!"

	defaultWrapUpText   = "Thanks for practicing! Let's wrap up here."
	defaultWrapUpTextFA = "ممنون که تمرین کردی! همین‌جا جمع‌بندی می‌کنیم."

	defaultRetryText   = "Sorry, I didn't catch that. Could you say it again?"
	defaultRetryTextFA = "ببخشید، متوجه نشدم. می‌شه دوباره بگی؟"
)

// fallbackReply جوابِ جایگزین یک نوبت را برمی‌گرداند. جمله‌ی «جمع‌بندی» فقط از
// نوبتِ WrapUpFromTurn به بعد (که گفتگو واقعاً تمام می‌شود) درست است؛ قبل از آن
// اگر AI خطا بدهد، کاربر نباید وسط گفتگو «wrap up» ببیند و گفتگو ادامه پیدا کند،
// پس یک جمله‌ی خنثی می‌آید که از او می‌خواهد دوباره بگوید.
func fallbackReply(turnNumber int) (text, textFA string, shouldEnd bool) {
	if turnNumber >= aiconversation.WrapUpFromTurn {
		return defaultWrapUpText, defaultWrapUpTextFA, true
	}
	return defaultRetryText, defaultRetryTextFA, false
}
