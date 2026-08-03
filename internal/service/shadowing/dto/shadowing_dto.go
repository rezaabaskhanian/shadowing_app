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
}

type SubmitRecordingResponse struct {
	RecordingID        string  `json:"recording_id"`
	StepNumber         int     `json:"step_number"`
	NextStep           int     `json:"next_step"`
	IsComplete         bool    `json:"is_complete"`
	PronunciationScore float64 `json:"pronunciation_score"`
	FluencyScore       float64 `json:"fluency_score"`
	OverallScore       float64 `json:"overall_score"`
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
