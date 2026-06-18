package shadowingservice

import (
	"context"
	"shadowing-backend/internal/domain/shadowing/session"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

// ResetSession - بازنشانی جلسه تمرین به مرحله اول
func (s *Service) ResetSession(ctx context.Context, sessionID string) error {
	const op = "shadowing.ResetSession"

	// 1️⃣ تبدیل ID
	id, err := uuid.Parse(sessionID)
	if err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("شناسه جلسه نامعتبر است").
			WithKind(richerror.KindInvalid)
	}

	// 2️⃣ دریافت جلسه
	sess, err := s.sessionRepo.GetByID(ctx, id)
	if err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("جلسه تمرین یافت نشد").
			WithKind(richerror.KindNotFound)
	}

	// 3️⃣ بررسی اینکه جلسه کامل نشده باشد
	if sess.Status == session.StatusCompleted {
		return richerror.New(op).
			WithMessage("جلسه تمرین قبلاً کامل شده است و نمی‌توان آن را بازنشانی کرد").
			WithKind(richerror.KindInvalid)
	}

	// 4️⃣ بازنشانی مراحل
	for i := range sess.Steps {
		// بازنشانی وضعیت هر مرحله به pending
		sess.Steps[i].Status = session.StepStatusPending
		sess.Steps[i].StartedAt = nil
		sess.Steps[i].CompletedAt = nil
		sess.Steps[i].UpdatedAt = sess.Steps[i].CreatedAt
	}

	// 5️⃣ بازنشانی جلسه
	sess.CurrentStep = session.StepListen // مرحله اول (گوش بده)
	sess.Status = session.StatusPending   // وضعیت به در انتظار
	sess.CompletedAt = nil
	sess.UpdatedAt = sess.CreatedAt

	// 6️⃣ ذخیره در دیتابیس
	if err := s.sessionRepo.Update(ctx, sess); err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("خطا در بازنشانی جلسه").
			WithKind(richerror.KindUnexpected)
	}

	// 7️⃣ (اختیاری) حذف ضبط‌های قبلی
	if err := s.recordingRepo.DeleteBySession(ctx, sess.ID); err != nil {
		// خطا را نادیده می‌گیریم چون ضبط‌ها اهمیت حیاتی ندارند
		// اما لاگ می‌کنیم
		// log.Printf("failed to delete recordings for session %s: %v", sess.ID, err)
	}

	return nil
}
