package achievement

// AchievementType - نوع دستاورد
type AchievementType string

const (
	AchievementFirstLesson  AchievementType = "first_lesson"  // اولین درس
	AchievementPerfectScore AchievementType = "perfect_score" // نمره کامل
	AchievementStreak7      AchievementType = "streak_7"      // استریک ۷ روزه
	AchievementStreak30     AchievementType = "streak_30"     // استریک ۳۰ روزه
	AchievementMastery      AchievementType = "mastery"       // استاد شدن
	AchievementSpeed        AchievementType = "speed"         // سرعت در پاسخ
)

// AchievementRarity - نادر بودن دستاورد
type AchievementRarity string

const (
	RarityCommon    AchievementRarity = "common"    // معمولی
	RarityUncommon  AchievementRarity = "uncommon"  // نسبتاً نادر
	RarityRare      AchievementRarity = "rare"      // نادر
	RarityEpic      AchievementRarity = "epic"      // حماسی
	RarityLegendary AchievementRarity = "legendary" // افسانه‌ای
)
