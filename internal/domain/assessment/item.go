package assessment

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// AssessmentItem - یک آیتم تست تعیین سطح (مدیریت‌شده در پنل ادمین)
type AssessmentItem struct {
	ID         uuid.UUID
	Kind       Kind
	Category   Category
	PromptText string
	TargetText string // فقط برای kind=shadow
	AudioURL   string // فقط برای kind=shadow
	Difficulty Difficulty
	IsActive   bool
	CreatedAt  time.Time
	UpdatedAt  time.Time
}

// NewAssessmentItem یک آیتم جدید می‌سازد و الزامات هر kind را بررسی می‌کند.
func NewAssessmentItem(kind Kind, category Category, promptText, targetText, audioURL string, difficulty Difficulty) (*AssessmentItem, error) {
	if promptText == "" {
		return nil, errors.New("prompt text is required")
	}

	switch kind {
	case KindShadow:
		if targetText == "" {
			return nil, errors.New("shadow items require target text")
		}
		if audioURL == "" {
			return nil, errors.New("shadow items require a reference audio")
		}
	case KindFreeSpeech:
		if category != CategoryIntro && category != CategorySituational {
			return nil, errors.New("free_speech items require a valid category")
		}
	default:
		return nil, errors.New("invalid assessment item kind")
	}

	now := time.Now()
	return &AssessmentItem{
		ID:         uuid.New(),
		Kind:       kind,
		Category:   category,
		PromptText: promptText,
		TargetText: targetText,
		AudioURL:   audioURL,
		Difficulty: difficulty,
		IsActive:   true,
		CreatedAt:  now,
		UpdatedAt:  now,
	}, nil
}
