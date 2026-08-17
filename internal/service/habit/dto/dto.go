package dto

// Activity - یک فعالیت روزمره (برای دراپ‌داون انتخاب فعالیت در اپ).
type Activity struct {
	ID     string `json:"id"`
	Code   string `json:"code"`
	NameEN string `json:"name_en"`
	NameFA string `json:"name_fa"`
	Icon   string `json:"icon"`
}

// DialogueLineDTO - یک خط از دیالوگ هدف ماموریت.
type DialogueLineDTO struct {
	Order        int    `json:"order"`
	Speaker      string `json:"speaker"`
	OriginalText string `json:"original_text"`
}

// TodayMissionResponse - ماموریت عادت امروز کاربر، همراه با متن دیالوگی که
// باید در قالب فعالیت روزمره تمرین کند.
type TodayMissionResponse struct {
	MissionID       string            `json:"mission_id"`
	HotspotID       string            `json:"hotspot_id"`
	MissionType     string            `json:"mission_type"`
	Status          string            `json:"status"`
	Activity        Activity          `json:"activity"`
	Dialogues       []DialogueLineDTO `json:"dialogues"`
	EstimatedSecond int               `json:"estimated_duration_seconds"`
}

// SubmitSessionResponse - نتیجه‌ی یک جلسه‌ی تمرین عادت که کاربر ارسال کرده.
type SubmitSessionResponse struct {
	MissionID        string   `json:"mission_id"`
	Transcript       string   `json:"transcript"`
	MatchedSentences int      `json:"matched_sentences"`
	TotalSentences   int      `json:"total_sentences"`
	MatchedWords     int      `json:"matched_words"`
	TotalWords       int      `json:"total_words"`
	Accuracy         float64  `json:"accuracy"`
	DurationSeconds  int      `json:"duration_seconds"`
	Streak           int      `json:"streak"`
	TotalXP          int      `json:"total_xp"`
	NewAchievements  []string `json:"new_achievements"`
	Message          string   `json:"message"`
	SpeechEvaluated  bool     `json:"speech_evaluated"`
}

// HistoryMissionDTO - یک ماموریت در فهرست تاریخچه.
type HistoryMissionDTO struct {
	MissionID       string `json:"mission_id"`
	HotspotID       string `json:"hotspot_id"`
	MissionType     string `json:"mission_type"`
	Status          string `json:"status"`
	DurationSeconds int    `json:"duration_seconds"`
	CompletedAt     string `json:"completed_at,omitempty"`
}

// HistoryResponse - آمار و فهرست تاریخچه‌ی ماموریت‌های عادت کاربر.
type HistoryResponse struct {
	CompletedCount       int                 `json:"completed_count"`
	TotalDurationSeconds int                 `json:"total_duration_seconds"`
	CurrentStreak        int                 `json:"current_streak"`
	Missions             []HistoryMissionDTO `json:"missions"`
}
