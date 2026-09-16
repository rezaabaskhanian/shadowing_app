package progressservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetProgressTrend روند امتیاز گفتاری کاربر در ۶ هفته‌ی اخیر را برمی‌گرداند
// تا مشخص شود آیا واقعاً در حال پیشرفت است یا نه (بخش ۲۱ سند محصول).
func (s *Service) GetProgressTrend(ctx context.Context, userID string) (*dto.GetProgressTrendResponse, error) {
	const op = "progress.GetProgressTrend"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	weeks, err := s.recordingRepo.TrendByUser(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	out := make([]dto.WeekTrendDTO, 0, len(weeks))
	for _, w := range weeks {
		out = append(out, dto.WeekTrendDTO{
			WeekStart: w.WeekStart,
			Speaking:  w.Speaking,
			Sessions:  w.Sessions,
		})
	}

	return &dto.GetProgressTrendResponse{Weeks: out}, nil
}
