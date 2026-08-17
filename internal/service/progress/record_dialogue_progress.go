package progressservice

import (
	"context"

	sceneprogress "shadowing-backend/internal/domain/progress/scene_progress"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// RecordDialogueProgress یک دیالوگ کامل‌شده را برای یک کاربر/صحنه ثبت
// می‌کند. idempotent است: تکرار همان دیالوگ (مثلاً تمرین دوباره‌ی یک جلسه)
// دوباره شمارش نمی‌شود چون شمارش از روی لجر یکتای scene_dialogue_progress
// محاسبه می‌شود، نه یک شمارنده‌ی خام.
func (s *Service) RecordDialogueProgress(ctx context.Context, userID, sceneID, dialogueID string, score float64) (*dto.UpdateSceneProgressResponse, error) {
	const op = "progress.RecordDialogueProgress"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}
	sid, err := uuid.Parse(sceneID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID")
	}
	did, err := uuid.Parse(dialogueID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid dialogue ID")
	}

	if err := s.sceneProRepo.RecordDialogueCompletion(ctx, uid, sid, did, score); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	completed, avgScore, err := s.sceneProRepo.CountCompletedDialogues(ctx, uid, sid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	total, err := s.sceneProRepo.CountTotalDialogues(ctx, sid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	percentage := 0
	if total > 0 {
		percentage = completed * 100 / total
	}
	isCompleted := total > 0 && completed >= total

	existing, err := s.sceneProRepo.GetByUserAndScene(ctx, userID, sceneID)
	notFound := isNotFoundErr(err)
	if err != nil && !notFound {
		return nil, richerror.New(op).WithErr(err)
	}

	if existing == nil || notFound {
		xp := 0
		if isCompleted {
			xp = 50
		}
		newProgress, err := sceneprogress.NewSceneProgress(uid, sid, total)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		newProgress.ProgressPercentage = percentage
		newProgress.CompletedDialogues = completed
		newProgress.Score = avgScore
		newProgress.IsCompleted = isCompleted
		newProgress.XP = xp
		if err := s.sceneProRepo.Create(ctx, newProgress); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		return &dto.UpdateSceneProgressResponse{
			SceneID:     sceneID,
			Progress:    percentage,
			IsCompleted: isCompleted,
			TotalXP:     newProgress.XP,
		}, nil
	}

	wasCompleted := existing.IsCompleted
	existing.ProgressPercentage = percentage
	existing.CompletedDialogues = completed
	existing.Score = avgScore
	existing.IsCompleted = isCompleted
	if isCompleted && !wasCompleted {
		existing.XP += 50
	}

	if err := s.sceneProRepo.Update(ctx, existing); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.UpdateSceneProgressResponse{
		SceneID:     sceneID,
		Progress:    percentage,
		IsCompleted: isCompleted,
		TotalXP:     existing.XP,
	}, nil
}

// GetSceneProgress پیشرفت کاربر در یک صحنه را برمی‌گرداند؛ نبودن رکورد یعنی
// کاربر هنوز چیزی از این صحنه تمرین نکرده (خطا نیست).
func (s *Service) GetSceneProgress(ctx context.Context, userID, sceneID string) (progress int, isCompleted bool, err error) {
	p, err := s.sceneProRepo.GetByUserAndScene(ctx, userID, sceneID)
	if err != nil {
		if isNotFoundErr(err) {
			return 0, false, nil
		}
		return 0, false, err
	}
	return p.ProgressPercentage, p.IsCompleted, nil
}

func isNotFoundErr(err error) bool {
	if err == nil {
		return false
	}
	re, ok := err.(richerror.RichError)
	return ok && re.Kind() == richerror.KindNotFound
}
