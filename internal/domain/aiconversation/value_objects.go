package aiconversation

// Status - وضعیت یک گفتگوی آزاد با AI
type Status string

const (
	StatusActive    Status = "active"
	StatusCompleted Status = "completed"
)

// Role - گوینده‌ی یک نوبت گفتگو
type Role string

const (
	RoleUser      Role = "user"
	RoleAssistant Role = "assistant"
)

// MaxUserTurns - سقف سختِ نوبت‌های کاربر؛ صرف‌نظر از تصمیمِ مدل، سرور بعد از
// این نوبت گفتگو را می‌بندد.
const MaxUserTurns = 8

// WrapUpFromTurn - از این نوبت به بعد، به مدل گفته می‌شود شروع به جمع‌کردنِ
// گفتگو کند (سیگنال نرم، نه سقفِ اجباری).
const WrapUpFromTurn = 6
