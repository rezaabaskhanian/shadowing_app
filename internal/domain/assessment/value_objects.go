package assessment

// Kind - نوع آیتم تست تعیین سطح
type Kind string

const (
	KindShadow     Kind = "shadow"      // تکرار جمله‌ی مرجع، نمره‌ی واقعی می‌گیرد
	KindFreeSpeech Kind = "free_speech" // پاسخ آزاد، فقط رونویسی + بررسی ربط

	// نسخه‌ی ۲ تست (document_placement/placement_design.md)
	KindVocabYesNo   Kind = "vocab_yesno"   // «این کلمه را می‌شناسی؟» از یک لایه‌ی بسامدی
	KindListenChoice Kind = "listen_choice" // شنیدن یک جمله و انتخاب معنی درست
	KindImitation    Kind = "imitation"     // تکرار جمله‌ی بلندشونده؛ نمره = دقت کلمه
)

// Category - زیرنوع آیتم‌های free_speech (برای shadow بی‌معناست)
type Category string

const (
	CategoryIntro       Category = "intro"       // معرفی خود
	CategorySituational Category = "situational" // پاسخ به یک موقعیت
)

// Difficulty - مطابق DifficultyLevel در internal/domain/learning/scene
type Difficulty string

const (
	DifficultyBeginner     Difficulty = "beginner"
	DifficultyIntermediate Difficulty = "intermediate"
	DifficultyAdvanced     Difficulty = "advanced"
)

// Level - سطح گفتاری برآوردشده (شبیه CEFR)
type Level string

const (
	LevelA1 Level = "A1"
	LevelA2 Level = "A2"
	LevelB1 Level = "B1"
	LevelB2 Level = "B2"
	LevelC1 Level = "C1"
)

// Levels سطح‌ها به ترتیب، از پایین به بالا.
var Levels = []Level{LevelA1, LevelA2, LevelB1, LevelB2, LevelC1}

// Rank جایگاه سطح در Levels؛ سطح نامعتبر ‎-1.
func (l Level) Rank() int {
	for i, v := range Levels {
		if v == l {
			return i
		}
	}
	return -1
}

// ValidLevel آیا رشته یکی از A1..C1 است.
func ValidLevel(s string) bool { return Level(s).Rank() >= 0 }
