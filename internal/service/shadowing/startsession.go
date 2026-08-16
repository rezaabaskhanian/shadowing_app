package shadowingservice

import (
	"context"
	"shadowing-backend/internal/domain/shadowing/session"
	"shadowing-backend/internal/service/shadowing/dto"

	"github.com/google/uuid"

	"shadowing-backend/internal/pkg/richerror"
)

func (s Service) StartSession(ctx context.Context, req dto.StartSessionRequest) (*dto.StartSessionResponse, error) {

	const op = "shadowing.StartSession"

	// 1️⃣ تبدیل IDها
	userID, err := uuid.Parse(req.UserID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	sceneID, err := uuid.Parse(req.SceneID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID")
	}

	dialogueID, err := uuid.Parse(req.DialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid dialogue ID")
	}

	// 2️⃣ بررسی اینکه جلسه فعال قبلی وجود نداشته باشد
	existingSession, _ := s.sessionRepo.GetByUserAndDialogue(ctx, userID, dialogueID)
	if existingSession != nil && existingSession.Status != session.StatusCompleted {
		return nil, richerror.New(op).
			WithMessage("an active session already exists for this dialogue").
			WithKind(richerror.KindConflict)
	}

	// 3️⃣ ساخت Session جدید
	newSession, err := session.NewSession(userID, sceneID, dialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 4️⃣ ایجاد ۴ مرحله از روی متن واقعی دیالوگ
	steps, err := s.createSteps(ctx, newSession.ID, dialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := newSession.AddSteps(steps); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 5️⃣ شروع جلسه
	if err := newSession.Start(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// 6️⃣ ذخیره در دیتابیس
	if err := s.sessionRepo.Create(ctx, newSession); err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to save session")
	}

	// 7️⃣ ساخت پاسخ
	return &dto.StartSessionResponse{
		SessionID:   newSession.ID.String(),
		DialogueID:  newSession.DialogueID.String(),
		CurrentStep: int(newSession.CurrentStep),
		TotalSteps:  newSession.TotalSteps,
		Status:      string(newSession.Status),
	}, nil
}

// createSteps - ایجاد ۴ مرحله برای جلسه از روی متن واقعی دیالوگ.
//
// قبلاً این متن هاردکد بود ("can of tuna")، یعنی همه‌ی جلسه‌ها صرف‌نظر از
// صحنه همان یک جمله را نشان می‌دادند — و از وقتی نمره‌دهی تلفظ اضافه شد این
// دیگر فقط یک اشکال نمایشی نیست: ارزیاب صدای کاربر را با جمله‌ی اشتباه
// مقایسه می‌کرد.
func (s *Service) createSteps(ctx context.Context, sessionID, dialogueID uuid.UUID) ([]session.Step, error) {
	const op = "shadowing.createSteps"

	dialogue, err := s.dialogueRepo.GetDialogueByID(ctx, dialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("dialogue not found")
	}

	displayText := dialogue.OriginalText
	translation := dialogue.Translation
	audioURL := dialogue.AudioURL

	steps := make([]session.Step, 0, 4)

	stepTypes := []session.StepType{
		session.StepListen,
		session.StepShadow,
		session.StepRecord,
		session.StepRepeat,
	}

	for _, stepType := range stepTypes {
		step, _ := session.NewStep(
			sessionID,
			dialogueID,
			stepType,
			displayText,
			translation,
			audioURL,
		)
		steps = append(steps, *step)
	}

	return steps, nil
}
