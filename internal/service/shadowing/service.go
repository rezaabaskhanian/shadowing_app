package shadowingservice

import (
	"context"

	domainRecord "shadowing-backend/internal/domain/shadowing/recording"
	domainSession "shadowing-backend/internal/domain/shadowing/session"

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
type Service struct {
	sessionRepo   SessionRepository
	recordingRepo RecordingRepository
}

// New - سازنده با بازگشت Pointer
func New(sessionRepo SessionRepository, recordingRepo RecordingRepository) *Service {
	return &Service{
		sessionRepo:   sessionRepo,
		recordingRepo: recordingRepo,
	}
}
