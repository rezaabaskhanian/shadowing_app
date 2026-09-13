package assessment

// Kind - نوع آیتم تست تعیین سطح
type Kind string

const (
	KindShadow     Kind = "shadow"      // تکرار جمله‌ی مرجع، نمره‌ی واقعی می‌گیرد
	KindFreeSpeech Kind = "free_speech" // پاسخ آزاد، فقط رونویسی + بررسی ربط
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
