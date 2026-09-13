package assessmentservice

import (
	"context"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/google/uuid"
)

// GetProfile پروفایل گفتاری کاربر را برمی‌گرداند. نبودش (KindNotFound) یعنی
// کاربر هنوز تست تعیین سطح نداده — همین سیگنالِ گیت موبایل است.
func (s *Service) GetProfile(ctx context.Context, userID string) (*dto.GetProfileResponse, error) {
	const op = "assessment.GetProfile"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	profile, err := s.profiles.GetByUser(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.GetProfileResponse{
		Level:              string(profile.Level),
		OverallScore:       profile.OverallScore,
		PronunciationScore: profile.PronunciationScore,
		FluencyScore:       profile.FluencyScore,
		IsEstimated:        profile.IsEstimated,
		AssessedAt:         profile.AssessedAt.Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
