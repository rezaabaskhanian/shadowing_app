package streak

// StreakStatus - وضعیت استریک
type StreakStatus string

const (
	StreakActive    StreakStatus = "active"    // فعال
	StreakBroken    StreakStatus = "broken"    // شکسته شده
	StreakRecovered StreakStatus = "recovered" // بازیابی شده
)
