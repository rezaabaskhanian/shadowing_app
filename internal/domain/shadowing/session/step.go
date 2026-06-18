package session

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

type Step struct {
	ID          uuid.UUID  `json:"id"`
	SessionID   uuid.UUID  `json:"session_id"`
	StepType    StepType   `json:"step_type"`
	Status      StepStatus `json:"status"`
	DialogueID  uuid.UUID  `json:"dialogue_id"`  // دیالوگ مرتبط
	DisplayText string     `json:"display_text"` // متن نمایشی
	Translation string     `json:"translation"`  // ترجمه (اختیاری)
	AudioURL    string     `json:"audio_url"`    // صدای اصلی
	StartedAt   *time.Time `json:"started_at,omitempty"`
	CompletedAt *time.Time `json:"completed_at,omitempty"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

// ============================================
// سازنده Step جدید
// ============================================
func NewStep(sessionID, dialogueID uuid.UUID, stepType StepType, displayText, translation, audioURL string) (*Step, error) {
	if sessionID == uuid.Nil {
		return nil, errors.New("session ID is required")
	}
	if dialogueID == uuid.Nil {
		return nil, errors.New("dialogue ID is required")
	}
	if displayText == "" {
		return nil, errors.New("display text is required")
	}
	if audioURL == "" {
		return nil, errors.New("audio URL is required")
	}
	if !isValidStepType(stepType) {
		return nil, errors.New("invalid step type")
	}

	now := time.Now()
	return &Step{
		ID:          uuid.New(),
		SessionID:   sessionID,
		DialogueID:  dialogueID,
		StepType:    stepType,
		Status:      StepStatusPending,
		DisplayText: displayText,
		Translation: translation,
		AudioURL:    audioURL,
		CreatedAt:   now,
		UpdatedAt:   now,
	}, nil
}

func isValidStepType(st StepType) bool {
	return st >= StepListen && st <= StepRepeat
}

// ============================================
// متدهای Step
// ============================================

// Start - شروع مرحله
func (s *Step) Start() error {
	if s.Status == StepStatusCompleted {
		return errors.New("step already completed")
	}
	now := time.Now()
	s.Status = StepStatusInProgress
	s.StartedAt = &now
	s.UpdatedAt = now
	return nil
}

// Complete - تکمیل مرحله
func (s *Step) Complete() error {
	if s.Status == StepStatusCompleted {
		return errors.New("step already completed")
	}
	now := time.Now()
	s.Status = StepStatusCompleted
	s.CompletedAt = &now
	s.UpdatedAt = now
	return nil
}

// IsCompleted - بررسی کامل شدن
func (s *Step) IsCompleted() bool {
	return s.Status == StepStatusCompleted
}

// GetDisplayName - دریافت نام نمایشی
func (s *Step) GetDisplayName() string {
	return s.StepType.GetStepName()
}

// GetDescription - دریافت توضیح
func (s *Step) GetDescription() string {
	return s.StepType.GetStepDescription()
}
