package session

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Session represents a shadowing practice session
type Session struct {
	ID          uuid.UUID     `json:"id"`
	UserID      uuid.UUID     `json:"user_id"`
	SceneID     uuid.UUID     `json:"scene_id"`    // سناریو (برای نمایش)
	DialogueID  uuid.UUID     `json:"dialogue_id"` // دیالوگ جاری
	Status      SessionStatus `json:"status"`
	CurrentStep StepType      `json:"current_step"` // مرحله جاری
	Steps       []Step        `json:"steps"`        // لیست مراحل
	TotalSteps  int           `json:"total_steps"`  // تعداد کل مراحل (۴)
	StartedAt   time.Time     `json:"started_at"`
	CompletedAt *time.Time    `json:"completed_at,omitempty"`
	UpdatedAt   time.Time     `json:"updated_at"`
	CreatedAt   time.Time     `json:"created_at"`
}

// ============================================
// سازنده Session جدید
// ============================================
func NewSession(userID, sceneID, dialogueID uuid.UUID) (*Session, error) {
	if userID == uuid.Nil {
		return nil, errors.New("user ID is required")
	}
	if sceneID == uuid.Nil {
		return nil, errors.New("scene ID is required")
	}
	if dialogueID == uuid.Nil {
		return nil, errors.New("dialogue ID is required")
	}

	now := time.Now()
	return &Session{
		ID:          uuid.New(),
		UserID:      userID,
		SceneID:     sceneID,
		DialogueID:  dialogueID,
		Status:      StatusPending,
		CurrentStep: StepListen,
		Steps:       []Step{},
		TotalSteps:  4, // همیشه ۴ مرحله
		StartedAt:   now,
		UpdatedAt:   now,
	}, nil
}

// ============================================
// متدهای Session
// ============================================

// AddStep - افزودن مرحله
func (s *Session) AddStep(step Step) error {
	// بررسی اینکه مرحله تکراری نباشد
	for _, existing := range s.Steps {
		if existing.StepType == step.StepType {
			return errors.New("step type already exists")
		}
	}
	s.Steps = append(s.Steps, step)
	s.UpdatedAt = time.Now()
	return nil
}

// AddSteps - افزودن همه مراحل
func (s *Session) AddSteps(steps []Step) error {
	for _, step := range steps {
		if err := s.AddStep(step); err != nil {
			return err
		}
	}
	return nil
}

// Start - شروع جلسه
func (s *Session) Start() error {
	if s.Status == StatusProgress {
		return errors.New("session already started")
	}
	if s.Status == StatusCompleted {
		return errors.New("session already completed")
	}
	if len(s.Steps) < 4 {
		return errors.New("all 4 steps must be added before starting")
	}

	s.Status = StatusProgress
	s.UpdatedAt = time.Now()
	return nil
}

// GoToNextStep - رفتن به مرحله بعدی
func (s *Session) GoToNextStep() error {
	if s.Status == StatusCompleted {
		return errors.New("session already completed")
	}

	// کامل کردن مرحله فعلی
	currentStep, err := s.GetCurrentStep()
	if err != nil {
		return err
	}
	if !currentStep.IsCompleted() {
		return errors.New("current step must be completed first")
	}

	// رفتن به مرحله بعدی
	if s.CurrentStep == StepRepeat {
		// اگر در مرحله ۴ هستیم، جلسه تمام می‌شود
		return s.Complete()
	}

	s.CurrentStep++
	s.UpdatedAt = time.Now()
	return nil
}

// Complete - تکمیل کل جلسه
func (s *Session) Complete() error {
	if s.Status == StatusCompleted {
		return errors.New("session already completed")
	}

	// کامل کردن مرحله فعلی
	currentStep, err := s.GetCurrentStep()
	if err != nil {
		return err
	}
	if !currentStep.IsCompleted() {
		if err := currentStep.Complete(); err != nil {
			return err
		}
	}

	s.Status = StatusCompleted
	now := time.Now()
	s.CompletedAt = &now
	s.UpdatedAt = now
	return nil
}

// GetCurrentStep - دریافت مرحله جاری
func (s *Session) GetCurrentStep() (*Step, error) {
	for i := range s.Steps {
		if s.Steps[i].StepType == s.CurrentStep {
			return &s.Steps[i], nil
		}
	}
	return nil, errors.New("current step not found")
}

// GetStepByType - دریافت مرحله بر اساس نوع
func (s *Session) GetStepByType(stepType StepType) (*Step, error) {
	for i := range s.Steps {
		if s.Steps[i].StepType == stepType {
			return &s.Steps[i], nil
		}
	}
	return nil, errors.New("step not found")
}

// IsComplete - بررسی کامل بودن جلسه
func (s *Session) IsComplete() bool {
	return s.Status == StatusCompleted
}

// GetProgress - دریافت درصد پیشرفت (۰-۱۰۰)
func (s *Session) GetProgress() int {
	if len(s.Steps) == 0 {
		return 0
	}
	completed := 0
	for _, step := range s.Steps {
		if step.IsCompleted() {
			completed++
		}
	}
	return (completed * 100) / len(s.Steps)
}
