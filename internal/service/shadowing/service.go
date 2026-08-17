package shadowingservice

import (
	"context"

	scene "shadowing-backend/internal/domain/learning/scene"
	domainRecord "shadowing-backend/internal/domain/shadowing/recording"
	domainSession "shadowing-backend/internal/domain/shadowing/session"
	progressservice "shadowing-backend/internal/service/progress"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// ============================================
// SessionRepository - اینترفیس با Pointer
// ============================================
type SessionRepository interface {
	// Create - ایجاد جلسه جدید
	Create(ctx context.Context, session *domainSession.Session) error

	// GetByID - دریافت جلسه با شناسه
	GetByID(ctx context.Context, id uuid.UUID) (*domainSession.Session, error)

	// GetByUserID - دریافت جلسات یک کاربر
	GetByUserID(ctx context.Context, userID uuid.UUID) ([]domainSession.Session, error)

	// GetActiveByUser - دریافت جلسات فعال یک کاربر
	GetActiveByUser(ctx context.Context, userID uuid.UUID) ([]domainSession.Session, error)

	// GetByUserAndDialogue - دریافت جلسه کاربر برای یک دیالوگ
	GetByUserAndDialogue(ctx context.Context, userID, dialogueID uuid.UUID) (*domainSession.Session, error)

	// Update - به‌روزرسانی جلسه
	Update(ctx context.Context, session *domainSession.Session) error

	// Delete - حذف جلسه
	Delete(ctx context.Context, id uuid.UUID) error
}

// ============================================
// RecordingRepository - اینترفیس با Pointer
// ============================================
type RecordingRepository interface {
	// Create - ذخیره ضبط جدید
	Create(ctx context.Context, recording *domainRecord.Recording) error

	// GetByID - دریافت ضبط با شناسه
	GetByID(ctx context.Context, id uuid.UUID) (*domainRecord.Recording, error)

	// GetBySessionID - دریافت ضبط‌های یک جلسه
	GetBySessionID(ctx context.Context, sessionID uuid.UUID) ([]domainRecord.Recording, error)

	// GetByUserAndDialogue - دریافت ضبط‌های کاربر برای یک دیالوگ
	GetByUserAndDialogue(ctx context.Context, userID, dialogueID uuid.UUID) ([]domainRecord.Recording, error)

	// Delete - حذف ضبط
	Delete(ctx context.Context, id uuid.UUID) error

	// DeleteBySession - حذف همه ضبط‌های یک جلسه
	DeleteBySession(ctx context.Context, sessionID uuid.UUID) error
}

// ============================================
// Service - با Pointer
// ============================================
// ============================================
// DialogueRepository - خواندن متن دیالوگ
// ============================================
type DialogueRepository interface {
	// GetDialogueByID - متن و صدای مرجع یک دیالوگ، برای ساختن مراحل جلسه
	GetDialogueByID(ctx context.Context, id uuid.UUID) (scene.Dialogue, error)
}

// ============================================
// Service - با Pointer
// ============================================
type Service struct {
	sessionRepo   SessionRepository
	recordingRepo RecordingRepository
	dialogueRepo  DialogueRepository
	evaluator     speecheval.Evaluator
	progressSvc   *progressservice.Service
}

// New - سازنده با بازگشت Pointer
//
// evaluator می‌تواند nil باشد؛ در آن صورت ارزیابی تخمینی (بدون تشخیص گفتار)
// انجام می‌شود تا سرویس بدون سایدکار STT هم بالا بیاید.
func New(
	sessionRepo SessionRepository,
	recordingRepo RecordingRepository,
	dialogueRepo DialogueRepository,
	evaluator speecheval.Evaluator,
	progressSvc *progressservice.Service,
) *Service {
	if evaluator == nil {
		evaluator = speecheval.NewHybridEvaluator()
	}
	return &Service{
		sessionRepo:   sessionRepo,
		recordingRepo: recordingRepo,
		dialogueRepo:  dialogueRepo,
		evaluator:     evaluator,
		progressSvc:   progressSvc,
	}
}
