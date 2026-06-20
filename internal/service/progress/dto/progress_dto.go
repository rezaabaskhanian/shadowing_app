package dto

// ============================================
// AddDailyProgress
// ============================================
type AddDailyProgressRequest struct {
	UserID     string  `json:"user_id"`
	DialogueID string  `json:"dialogue_id"`
	Score      float64 `json:"score"` // نمره تمرین (0-100)
	XP         int     `json:"xp"`    // امتیاز کسب‌شده
}

type AddDailyProgressResponse struct {
	Streak          int      `json:"streak"`           // استریک فعلی
	TotalXP         int      `json:"total_xp"`         // کل امتیازها
	Level           int      `json:"level"`            // سطح کاربر
	NewAchievements []string `json:"new_achievements"` // دستاوردهای جدید
	Message         string   `json:"message"`          // پیام تشویقی
}

// ============================================
// GetUserStreak
// ============================================
type GetUserStreakResponse struct {
	CurrentStreak int    `json:"current_streak"`
	LongestStreak int    `json:"longest_streak"`
	Freezes       int    `json:"freezes"`
	Status        string `json:"status"`         // "active", "broken"
	NextMilestone int    `json:"next_milestone"` // استریک بعدی (مثلاً ۱۰)
}

// ============================================
// GetUserLevel
// ============================================
type GetUserLevelResponse struct {
	Level     int    `json:"level"`
	LevelName string `json:"level_name"`
	TotalXP   int    `json:"total_xp"`
	XPToNext  int    `json:"xp_to_next"`
	Progress  int    `json:"progress"` // درصد پیشرفت به سطح بعدی (0-100)
}

// ============================================
// UnlockAchievement
// ============================================
type UnlockAchievementRequest struct {
	UserID string `json:"user_id"`
	Type   string `json:"type"` // "first_lesson", "streak_7", ...
}

type UnlockAchievementResponse struct {
	AchievementID string `json:"achievement_id"`
	Name          string `json:"name"`
	Icon          string `json:"icon"`
	Description   string `json:"description"`
	XP            int    `json:"xp"`
}

// ============================================
// GetUserAchievements
// ============================================
type GetUserAchievementsResponse struct {
	Achievements []AchievementDTO `json:"achievements"`
	Total        int              `json:"total"`
}

type AchievementDTO struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Icon        string `json:"icon"`
	Rarity      string `json:"rarity"` // "common", "rare", "epic"
	XP          int    `json:"xp"`
	UnlockedAt  string `json:"unlocked_at"`
}

// ============================================
// UpdateSceneProgress
// ============================================
type UpdateSceneProgressRequest struct {
	UserID  string  `json:"user_id"`
	SceneID string  `json:"scene_id"`
	Score   float64 `json:"score"`
}

type UpdateSceneProgressResponse struct {
	SceneID     string `json:"scene_id"`
	Progress    int    `json:"progress"` // درصد پیشرفت (0-100)
	IsCompleted bool   `json:"is_completed"`
	TotalXP     int    `json:"total_xp"`
}

// ============================================
// GetUserSummary
// ============================================
type GetUserSummaryResponse struct {
	Streak            int    `json:"streak"`
	TotalXP           int    `json:"total_xp"`
	Level             int    `json:"level"`
	LevelName         string `json:"level_name"`
	TotalAchievements int    `json:"total_achievements"`
	CompletedScenes   int    `json:"completed_scenes"`
	TotalScenes       int    `json:"total_scenes"`
	OverallProgress   int    `json:"overall_progress"` // 0-100
}
