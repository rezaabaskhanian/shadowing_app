package dto

// ============================================
// GetTest
// ============================================

type ItemDTO struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Category   string `json:"category,omitempty"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text,omitempty"` // فقط برای kind=shadow
	AudioURL   string `json:"audio_url,omitempty"`   // فقط برای kind=shadow
	Difficulty string `json:"difficulty,omitempty"`
}

type GetTestResponse struct {
	Items []ItemDTO `json:"items"`
}

// ============================================
// SubmitAssessment
// ============================================

// SubmitItem - یک آیتم ارسالی؛ LocalAudioPath مسیر فایل روی دیسک سرور است،
// هندلر پرش می‌کند نه کلاینت (مثل الگوی shadowing).
type SubmitItem struct {
	ItemID         string `json:"item_id"`
	LocalAudioPath string `json:"-"`
	Duration       int    `json:"duration"`
}

type ItemResultDTO struct {
	ItemID   string `json:"item_id"`
	Kind     string `json:"kind"`
	// Transcript فقط برای free_speech پر می‌شود.
	Transcript string `json:"transcript,omitempty"`
	// RelevanceAnswered/RelevanceFeedback فقط برای free_speech.
	RelevanceAnswered string `json:"relevance_answered,omitempty"`
	RelevanceFeedback string `json:"relevance_feedback,omitempty"`
	// امتیازها فقط برای shadow پر می‌شوند؛ برای free_speech عمداً nil می‌مانند
	// تا نمره‌ی ساختگی نمایش داده نشود.
	PronunciationScore *float64 `json:"pronunciation_score,omitempty"`
	FluencyScore       *float64 `json:"fluency_score,omitempty"`
	OverallScore       *float64 `json:"overall_score,omitempty"`
}

type SubmitAssessmentResponse struct {
	Level              string          `json:"level"`
	OverallScore       float64         `json:"overall_score"`
	PronunciationScore float64         `json:"pronunciation_score"`
	FluencyScore       float64         `json:"fluency_score"`
	IsEstimated        bool            `json:"is_estimated"`
	Items              []ItemResultDTO `json:"items"`
}

// ============================================
// GetProfile
// ============================================

type GetProfileResponse struct {
	Level              string  `json:"level"`
	OverallScore       float64 `json:"overall_score"`
	PronunciationScore float64 `json:"pronunciation_score"`
	FluencyScore       float64 `json:"fluency_score"`
	IsEstimated        bool    `json:"is_estimated"`
	AssessedAt         string  `json:"assessed_at"`
}

// ============================================
// Admin CRUD
// ============================================

type CreateItemRequest struct {
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text"`
	AudioURL   string `json:"audio_url"`
	Difficulty string `json:"difficulty"`
}

type UpdateItemRequest struct {
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text"`
	AudioURL   string `json:"audio_url"`
	Difficulty string `json:"difficulty"`
	IsActive   bool   `json:"is_active"`
}

type ItemAdminDTO struct {
	ID         string `json:"id"`
	Kind       string `json:"kind"`
	Category   string `json:"category"`
	PromptText string `json:"prompt_text"`
	TargetText string `json:"target_text,omitempty"`
	AudioURL   string `json:"audio_url,omitempty"`
	Difficulty string `json:"difficulty,omitempty"`
	IsActive   bool   `json:"is_active"`
	CreatedAt  string `json:"created_at"`
}

type ListItemsResponse struct {
	Items []ItemAdminDTO `json:"items"`
}
