package assessmentservice

import (
	"context"
	"log/slog"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/google/uuid"
)

// LevelOverrideRepository - سطحی که کاربر خودش دستی انتخاب کرده؛ رشته‌ی خالی = ندارد.
type LevelOverrideRepository interface {
	Get(ctx context.Context, userID uuid.UUID) (string, error)
	Set(ctx context.Context, userID uuid.UUID, difficulty string) error
	Clear(ctx context.Context, userID uuid.UUID) error
}

var validSceneLevels = map[string]bool{"beginner": true, "intermediate": true, "advanced": true}

// testSceneLevel سطح صحنه‌ی حاصل از تست تعیین سطح؛ رشته‌ی خالی اگر تست نداده.
func (s *Service) testSceneLevel(ctx context.Context, uid uuid.UUID) (string, error) {
	profile, err := s.profiles.GetByUser(ctx, uid)
	if err != nil {
		if re, ok := err.(richerror.RichError); ok && re.Kind() == richerror.KindNotFound {
			return "", nil
		}
		return "", err
	}
	return assessment.SceneDifficulty(profile.Level), nil
}

// GetLevel سطح مؤثر کاربر و منبعش را برمی‌گرداند: انتخاب دستی، بعد نتیجه‌ی
// تست، و در نبود هر دو مبتدی (source=default).
func (s *Service) GetLevel(ctx context.Context, userID string) (*dto.LevelResponse, error) {
	const op = "assessment.GetLevel"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	testLevel, err := s.testSceneLevel(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	manual, err := s.overrides.Get(ctx, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	resp := &dto.LevelResponse{SceneLevel: "beginner", Source: "default", TestSceneLevel: testLevel}
	switch {
	case manual != "":
		resp.SceneLevel, resp.Source = manual, "manual"
	case testLevel != "":
		resp.SceneLevel, resp.Source = testLevel, "test"
	}
	return resp, nil
}

// EffectiveSceneLevel فقط سطح مؤثر را برمی‌گرداند (برای فیلتر صحنه‌ها).
func (s *Service) EffectiveSceneLevel(ctx context.Context, userID string) (string, error) {
	resp, err := s.GetLevel(ctx, userID)
	if err != nil {
		return "", err
	}
	return resp.SceneLevel, nil
}

// SetLevel سطح دستی کاربر را ذخیره می‌کند؛ رشته‌ی خالی انتخاب دستی را پاک
// می‌کند (برگشت به نتیجه‌ی تست).
func (s *Service) SetLevel(ctx context.Context, userID, sceneLevel string) (*dto.LevelResponse, error) {
	const op = "assessment.SetLevel"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	if sceneLevel == "" {
		err = s.overrides.Clear(ctx, uid)
	} else if !validSceneLevels[sceneLevel] {
		return nil, richerror.New(op).WithMessage("سطح نامعتبر است. مقادیر مجاز: beginner, intermediate, advanced").WithKind(richerror.KindInvalid)
	} else {
		err = s.overrides.Set(ctx, uid, sceneLevel)
	}
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	return s.GetLevel(ctx, userID)
}

// clearManualLevel بعد از هر تست تعیین سطح صدا زده می‌شود: نتیجه‌ی تازه‌ی تست
// جای انتخاب دستی قبلی را می‌گیرد. شکستش تست را خراب نمی‌کند.
func (s *Service) clearManualLevel(ctx context.Context, uid uuid.UUID) {
	if err := s.overrides.Clear(ctx, uid); err != nil {
		slog.Warn("assessment: failed to clear manual level after test", "err", err)
	}
}
