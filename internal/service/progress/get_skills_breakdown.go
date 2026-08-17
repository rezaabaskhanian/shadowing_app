package progressservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetSkillsBreakdown درصد مهارت‌های واقعی کاربر را برمی‌گرداند:
// Pronunciation/Fluency از میانگین نمره‌ی ضبط‌های واقعی شدوئینگ، و
// Vocabulary از میانگین سطح لایتنر (نرمال‌شده روی سقف ۵). مهارت Listening
// چون هیچ سیگنال واقعی‌ای نداریم عمداً حذف شده.
func (s *Service) GetSkillsBreakdown(ctx context.Context, userID string) (*dto.GetSkillsBreakdownResponse, error) {
	const op = "progress.GetSkillsBreakdown"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	avgPronunciation, avgFluency, err := s.recordingRepo.AvgScoresByUser(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	vocabulary := 0
	if avgLevel, wordCount, err := s.leitnerRepo.AvgLevelByUser(ctx, uid); err == nil && wordCount > 0 {
		const maxLeitnerLevel = 5
		vocabulary = int(avgLevel / maxLeitnerLevel * 100)
	}

	return &dto.GetSkillsBreakdownResponse{
		Pronunciation: int(avgPronunciation),
		Fluency:       int(avgFluency),
		Vocabulary:    vocabulary,
	}, nil
}
