package recording

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// RecordingType - نوع ضبط
type RecordingType string

const (
	RecordingTypeShadow RecordingType = "shadow" // ضبط مرحله شادو (همزمان)
	RecordingTypeRecord RecordingType = "record" // ضبط مرحله مستقل
)

// WordScore - نمره‌ی یک کلمه از جمله‌ی هدف، برای نمایش کلمه‌به‌کلمه در
// مرحله‌ی مقایسه (Compare). Status یکی از ok / weak / missing است.
type WordScore struct {
	Word   string  `json:"word"`
	Index  int     `json:"index"`
	Score  float64 `json:"score"`
	Status string  `json:"status"`
	Heard  string  `json:"heard,omitempty"`
}

// Recording - ضبط صدا
type Recording struct {
	ID                 uuid.UUID     `json:"id"`
	UserID             uuid.UUID     `json:"user_id"`
	SessionID          uuid.UUID     `json:"session_id"`
	DialogueID         uuid.UUID     `json:"dialogue_id"`
	StepType           int           `json:"step_type"`           // 1-4
	RecordingType      RecordingType `json:"recording_type"`      // shadow / record
	AudioPath          string        `json:"audio_path"`          // مسیر محلی
	Duration           int           `json:"duration"`            // ثانیه
	PronunciationScore float64       `json:"pronunciation_score"` // 0-100
	FluencyScore       float64       `json:"fluency_score"`       // 0-100
	OverallScore       float64       `json:"overall_score"`       // 0-100

	// Transcript متنی که واقعاً از کاربر شنیده شده؛ اگر تشخیص گفتار در دسترس
	// نبوده خالی است.
	Transcript string `json:"transcript,omitempty"`

	// WordScores نمره‌ی تک‌تک کلمه‌های جمله‌ی هدف
	WordScores []WordScore `json:"word_scores,omitempty"`

	// IsEstimated یعنی نمره از روی صدای واقعی نیست و فقط تخمینی از مدت ضبط
	// است (سرویس تشخیص گفتار در دسترس نبوده).
	IsEstimated bool `json:"is_estimated"`

	CreatedAt time.Time `json:"created_at"`
}

// ============================================
// سازنده Recording جدید
// ============================================
func NewRecording(userID, sessionID, dialogueID uuid.UUID, stepType int, recType RecordingType, audioPath string, duration int) (*Recording, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}
	if sessionID == uuid.Nil {
		return nil, errors.New("session ID is required")
	}
	if dialogueID == uuid.Nil {
		return nil, errors.New("dialogue ID is required")
	}
	if stepType < 1 || stepType > 4 {
		return nil, errors.New("invalid step type")
	}
	if audioPath == "" {
		return nil, errors.New("audio path is required")
	}
	if duration <= 0 {
		return nil, errors.New("duration must be positive")
	}

	return &Recording{
		ID:            uuid.New(),
		UserID:        userID,
		SessionID:     sessionID,
		DialogueID:    dialogueID,
		StepType:      stepType,
		RecordingType: recType,
		AudioPath:     audioPath,
		Duration:      duration,
		// تا وقتی ارزیابی واقعی روی این ضبط انجام نشده، نمره‌اش تخمینی است.
		IsEstimated: true,
		WordScores:  []WordScore{},
		CreatedAt:   time.Now(),
	}, nil
}
