package dto

// ============================================
// StartSession
// ============================================
type StartSessionRequest struct {
	UserID     string `json:"user_id"`
	SceneID    string `json:"scene_id"`
	DialogueID string `json:"dialogue_id"`
}

type StartSessionResponse struct {
	SessionID   string `json:"session_id"`
	DialogueID  string `json:"dialogue_id"`
	CurrentStep int    `json:"current_step"`
	TotalSteps  int    `json:"total_steps"`
	Status      string `json:"status"`
}

// ============================================
// GetCurrentStep
// ============================================
type GetCurrentStepRequest struct {
	SessionID string `json:"session_id"`
}

type GetCurrentStepResponse struct {
	StepNumber  int    `json:"step_number"`
	StepName    string `json:"step_name"`
	Description string `json:"description"`
	DisplayText string `json:"display_text"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audio_url"`
	IsCompleted bool   `json:"is_completed"`
}

// ============================================
// SubmitRecording (برای هر دو مرحله ۲ و ۳)
// ============================================
type SubmitRecordingRequest struct {
	SessionID     string `json:"session_id"`
	RecordingType string `json:"recording_type"` // "shadow" یا "record"
	AudioPath     string `json:"audio_path"`
	Duration      int    `json:"duration"`

	// ExpectedDuration مدت صدای مرجع به ثانیه، برای سنجش روانی. اگر صفر باشد
	// مقدار پیش‌فرض در نظر گرفته می‌شود.
	ExpectedDuration int `json:"expected_duration"`

	// LocalAudioPath مسیر فایل صوتی آپلودشده روی دیسک سرور. از بدنه‌ی JSON
	// خوانده نمی‌شود — هندلر بعد از ذخیره‌ی فایل multipart پرش می‌کند. بعد از
	// نمره‌دهی این فایل پاک می‌شود.
	LocalAudioPath string `json:"-"`
}

// WordScore - نمره‌ی یک کلمه از جمله‌ی هدف برای نمایش در مرحله‌ی Compare
type WordScore struct {
	Word  string  `json:"word"`
	Index int     `json:"index"`
	Score float64 `json:"score"`
	// Status یکی از ok / weak / missing — مبنای رنگ‌آمیزی کلمه در اپ
	Status string `json:"status"`
	// Heard چیزی که واقعاً شنیده شده؛ برای کلمه‌های گفته‌نشده خالی است
	Heard string `json:"heard,omitempty"`
}

type SubmitRecordingResponse struct {
	RecordingID        string  `json:"recording_id"`
	StepNumber         int     `json:"step_number"`
	NextStep           int     `json:"next_step"`
	IsComplete         bool    `json:"is_complete"`
	PronunciationScore float64 `json:"pronunciation_score"`
	FluencyScore       float64 `json:"fluency_score"`
	OverallScore       float64 `json:"overall_score"`

	// Transcript متنی که واقعاً از کاربر شنیده شده
	Transcript string `json:"transcript,omitempty"`

	// Words نمره‌ی کلمه‌به‌کلمه. اگر IsEstimated باشد خالی است.
	Words []WordScore `json:"words,omitempty"`

	// IsEstimated یعنی سرویس تشخیص گفتار در دسترس نبوده و نمره فقط تخمینی
	// از روی مدت ضبط است — اپ باید آن را با احتیاط نشان دهد.
	IsEstimated bool `json:"is_estimated"`
}

// ============================================
// EvaluateRecording - نمره‌دهی بدون جلسه
// ============================================

type EvaluateRecordingRequest struct {
	// DialogueID شناسه‌ی جمله‌ای که کاربر تمرین کرده. اگر داده شود، متن هدف از
	// دیتابیس خوانده می‌شود (مطمئن‌تر از اینکه کلاینت متن را بفرستد).
	DialogueID string `json:"dialogue_id"`

	// TargetText جایگزین DialogueID برای وقتی که جمله در دیتابیس نیست.
	TargetText string `json:"target_text"`

	Duration         int `json:"duration"`
	ExpectedDuration int `json:"expected_duration"`

	// LocalAudioPath مسیر فایل روی دیسک سرور؛ هندلر پرش می‌کند، نه کلاینت.
	LocalAudioPath string `json:"-"`
}

type EvaluateRecordingResponse struct {
	// TargetText متنی که نمره بر اساس آن حساب شده — تا اپ مطمئن شود جمله‌ی
	// درستی مقایسه شده است.
	TargetText         string      `json:"target_text"`
	PronunciationScore float64     `json:"pronunciation_score"`
	FluencyScore       float64     `json:"fluency_score"`
	OverallScore       float64     `json:"overall_score"`
	Transcript         string      `json:"transcript,omitempty"`
	Words              []WordScore `json:"words,omitempty"`
	IsEstimated        bool        `json:"is_estimated"`
}

// ============================================
// CompleteStep
// ============================================
type CompleteStepRequest struct {
	SessionID string `json:"session_id"`
}

type CompleteStepResponse struct {
	SessionID   string `json:"session_id"`
	CurrentStep int    `json:"current_step"`
	TotalSteps  int    `json:"total_steps"`
	IsComplete  bool   `json:"is_complete"`
	Progress    int    `json:"progress"` // درصد پیشرفت
}

// ============================================
// GetSessionStatus
// ============================================
type GetSessionStatusResponse struct {
	SessionID   string          `json:"session_id"`
	Status      string          `json:"status"`
	CurrentStep int             `json:"current_step"`
	TotalSteps  int             `json:"total_steps"`
	Progress    int             `json:"progress"`
	Steps       []StepStatusDTO `json:"steps"`
	StartedAt   string          `json:"started_at"`
	CompletedAt *string         `json:"completed_at,omitempty"`
}

type StepStatusDTO struct {
	StepNumber  int    `json:"step_number"`
	StepName    string `json:"step_name"`
	Status      string `json:"status"` // pending, in_progress, completed
	IsCompleted bool   `json:"is_completed"`
}
