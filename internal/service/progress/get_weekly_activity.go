package progressservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/progress/dto"

	"github.com/google/uuid"
)

// GetWeeklyActivity فعالیت ۷ روز اخیر کاربر (دقیقه/تعداد جلسه به‌ازای هر
// روز) را برمی‌گرداند.
func (s *Service) GetWeeklyActivity(ctx context.Context, userID string) (*dto.GetWeeklyActivityResponse, error) {
	const op = "progress.GetWeeklyActivity"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	days, err := s.activityRepo.WeeklyActivity(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	out := make([]dto.DayActivityDTO, 0, len(days))
	for _, d := range days {
		out = append(out, dto.DayActivityDTO{
			Date:     d.Date,
			Minutes:  d.Minutes,
			Sessions: d.Sessions,
		})
	}

	return &dto.GetWeeklyActivityResponse{Days: out}, nil
}
