package xp

// XPType - نوع امتیاز
type XPType string

const (
	XPTypeDaily       XPType = "daily"       // تمرین روزانه
	XPTypeLesson      XPType = "lesson"      // تکمیل درس
	XPTypeAchievement XPType = "achievement" // دستاورد
	XPTypeStreak      XPType = "streak"      // استریک
)

// XPLevel - سطح XP
type XPLevel int

const (
	LevelBronze XPLevel = iota + 1
	LevelSilver
	LevelGold
	LevelPlatinum
	LevelDiamond
)

// XPLevels - XP مورد نیاز برای هر سطح
var XPLevels = map[XPLevel]int{
	LevelBronze:   0,
	LevelSilver:   500,
	LevelGold:     1500,
	LevelPlatinum: 3000,
	LevelDiamond:  5000,
}
