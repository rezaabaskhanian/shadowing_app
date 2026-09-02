package sceneprogress

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// SceneProgress - پیشرفت کاربر در یک سناریو
type SceneProgress struct {
	ID                 uuid.UUID  `json:"id"`
	UserID             uuid.UUID  `json:"user_id"`
	SceneID            uuid.UUID  `json:"scene_id"`
	ProgressPercentage int        `json:"progress_percentage"` // 0-100
	CompletedDialogues int        `json:"completed_dialogues"`
	TotalDialogues     int        `json:"total_dialogues"`
	Score              float64    `json:"score"` // میانگین نمره
	XP                 int        `json:"xp"`    // امتیاز کسب‌شده از این سناریو
	IsCompleted        bool       `json:"is_completed"`
	LastAccessedAt     time.Time  `json:"last_accessed_at"`
	CompletedAt        *time.Time `json:"completed_at,omitempty"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

// ============================================
// سازنده SceneProgress جدید
// ============================================
func NewSceneProgress(userID, sceneID uuid.UUID, totalDialogues int) (*SceneProgress, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}
	if sceneID == uuid.Nil {
		return nil, errors.New("scene ID is required")
	}
	if totalDialogues <= 0 {
		return nil, errors.New("total dialogues must be positive")
	}

	now := time.Now()
	return &SceneProgress{
		ID:                 uuid.New(),
		UserID:             userID,
		SceneID:            sceneID,
		ProgressPercentage: 0,
		CompletedDialogues: 0,
		TotalDialogues:     totalDialogues,
		Score:              0,
		XP:                 0,
		IsCompleted:        false,
		LastAccessedAt:     now,
		CreatedAt:          now,
		UpdatedAt:          now,
	}, nil
}

// ============================================
// متدهای SceneProgress
// ============================================

// AddProgress - اضافه کردن پیشرفت
func (sp *SceneProgress) AddProgress(dialogueScore float64) {
	sp.CompletedDialogues++
	sp.ProgressPercentage = (sp.CompletedDialogues * 100) / sp.TotalDialogues

	// به‌روزرسانی نمره میانگین
	sp.Score = ((sp.Score * float64(sp.CompletedDialogues-1)) + dialogueScore) / float64(sp.CompletedDialogues)

	// اگر کامل شد
	if sp.CompletedDialogues >= sp.TotalDialogues {
		sp.IsCompleted = true
		now := time.Now()
		sp.CompletedAt = &now
		sp.XP += 50 // پاداش تکمیل
	}

	sp.UpdatedAt = time.Now()
}

// AddXP - اضافه کردن XP
func (sp *SceneProgress) AddXP(amount int) {
	sp.XP += amount
	sp.UpdatedAt = time.Now()
}

// DialogueProgress - رکورد تکمیل یک دیالوگ مشخص توسط کاربر (از جدول
// scene_dialogue_progress)، برای نمایش وضعیت «قبلاً ضبط شده» هنگام بازگشت
// به صحنه.
type DialogueProgress struct {
	DialogueID  uuid.UUID `json:"dialogue_id"`
	Score       float64   `json:"score"`
	CompletedAt time.Time `json:"completed_at"`
}
