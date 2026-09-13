package assessment

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// SpeakingProfile - نتیجه‌ی نهایی تست تعیین سطح یک کاربر (upsert، بدون نسخه‌بندی)
type SpeakingProfile struct {
	ID                 uuid.UUID
	UserID             uuid.UUID
	Level              Level
	OverallScore       float64
	PronunciationScore float64
	FluencyScore       float64
	IsEstimated        bool
	AssessedAt         time.Time
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// NewSpeakingProfile یک پروفایل جدید می‌سازد؛ Level همیشه از روی OverallScore
// محاسبه می‌شود، هیچ‌وقت مستقیم از بیرون ست نمی‌شود.
func NewSpeakingProfile(userID uuid.UUID, overall, pronunciation, fluency float64, estimated bool) (*SpeakingProfile, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}

	now := time.Now()
	return &SpeakingProfile{
		ID:                 uuid.New(),
		UserID:             userID,
		Level:              ScoreToLevel(overall),
		OverallScore:       overall,
		PronunciationScore: pronunciation,
		FluencyScore:       fluency,
		IsEstimated:        estimated,
		AssessedAt:         now,
		CreatedAt:          now,
		UpdatedAt:          now,
	}, nil
}
