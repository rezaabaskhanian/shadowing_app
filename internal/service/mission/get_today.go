package missionservice

import (
	"context"
	"log/slog"
	"math"
	"time"

	"shadowing-backend/internal/domain/assessment"
	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/mission/dto"

	"github.com/google/uuid"
)

// secondsPerDialogue تخمینِ زمانِ لازم برای هر دیالوگ (گوش‌دادن + shadow +
// ضبط + احتمالِ یک تلاشِ دوباره) است — یک placeholder قابل‌تنظیم، دقیقاً به
// همان سیاقِ آستانه‌های CEFR در internal/domain/assessment/level_mapping.go.
const secondsPerDialogue = 35

const minEstimatedMinutes = 3

func difficultyForLevel(level assessment.Level) scene.DifficultyLevel {
	switch level {
	case assessment.LevelB1:
		return scene.DifficultyIntermediate
	case assessment.LevelB2, assessment.LevelC1:
		return scene.DifficultyAdvanced
	default: // A1، A2 یا نامشخص
		return scene.DifficultyBeginner
	}
}

func capitalize(s string) string {
	if s == "" {
		return s
	}
	return string(s[0]-32) + s[1:]
}

// GetTodaysMission یک صحنه‌ی پیشنهادی برای «امروز» انتخاب می‌کند: بر اساس
// سطح گفتاریِ کاربر (اگر تست تعیین سطح را داده) یک صحنه‌ی ناتمام در همان
// سطح دشواری پیدا می‌کند؛ در نبودِ آن به هر صحنه‌ی ناتمامِ دیگر برمی‌گردد؛
// اگر همه تمام شده باشند، آخرین صحنه‌ی تمام‌شده در همان سطح را دوباره
// پیشنهاد می‌دهد تا کارت هیچ‌وقت خالی نماند. هیچ‌کدام از مراحلِ پروفایل/
// مهارت کاربر را مسدود نمی‌کنند — نبودشان فقط باعثِ برگشت به پیش‌فرض می‌شود.
func (s *Service) GetTodaysMission(ctx context.Context, userID string) (*dto.TodaysMissionResponse, error) {
	const op = "mission.GetTodaysMission"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	allScenes, err := s.scenes.GetAll(ctx)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	candidates := make([]scene.Scene, 0, len(allScenes))
	for _, sc := range allScenes {
		if sc.Status == scene.StatusPublished && !sc.IsLocked {
			candidates = append(candidates, sc)
		}
	}
	if len(candidates) == 0 {
		return nil, richerror.New(op).WithMessage("no published scenes available").WithKind(richerror.KindNotFound)
	}

	level := ""
	isEstimated := true
	targetDifficulty := scene.DifficultyBeginner
	if profile, profileErr := s.profiles.GetByUser(ctx, uid); profileErr == nil && profile != nil {
		level = string(profile.Level)
		isEstimated = false
		targetDifficulty = difficultyForLevel(profile.Level)
	} else if re, ok := profileErr.(richerror.RichError); profileErr != nil && !(ok && re.Kind() == richerror.KindNotFound) {
		slog.Warn("mission: failed to load speaking profile, defaulting to beginner", "err", profileErr)
	}

	progress, err := s.sceneProgress.GetByUser(ctx, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	completed := make(map[string]bool, len(progress))
	completedAt := make(map[string]time.Time, len(progress))
	for _, p := range progress {
		if p.IsCompleted {
			completed[p.SceneID.String()] = true
			if p.CompletedAt != nil {
				completedAt[p.SceneID.String()] = *p.CompletedAt
			}
		}
	}

	chosen := pickScene(candidates, targetDifficulty, completed, completedAt)

	if isEstimated {
		level = capitalize(string(chosen.Difficulty))
	}

	focusSkill := "speaking"
	if pron, flu, skillErr := s.skills.AvgScoresByUser(ctx, uid); skillErr == nil {
		switch {
		case pron == 0 && flu == 0:
			// هیچ ضبطی هنوز ثبت نشده — ادعای «مهارت ضعیف» از روی داده‌ی صفر
			// جعلی است، پس برچسب عمومی نگه داشته می‌شود.
		case pron <= flu:
			focusSkill = "pronunciation"
		default:
			focusSkill = "fluency"
		}
	} else {
		slog.Warn("mission: failed to load skill scores, using generic focus skill", "err", skillErr)
	}

	estimatedMinutes := minEstimatedMinutes
	if sceneUUID, parseErr := uuid.Parse(string(chosen.ID)); parseErr == nil {
		if totalDialogues, countErr := s.sceneProgress.CountTotalDialogues(ctx, sceneUUID); countErr == nil && totalDialogues > 0 {
			estimatedMinutes = int(math.Round(float64(totalDialogues*secondsPerDialogue) / 60))
			if estimatedMinutes < minEstimatedMinutes {
				estimatedMinutes = minEstimatedMinutes
			}
		}
	}

	return &dto.TodaysMissionResponse{
		SceneID:          string(chosen.ID),
		Title:            chosen.Title,
		Category:         chosen.Category,
		Difficulty:       string(chosen.Difficulty),
		Level:            level,
		IsEstimatedLevel: isEstimated,
		FocusSkill:       focusSkill,
		EstimatedMinutes: estimatedMinutes,
	}, nil
}

// pickScene به ترتیبِ اولویت: صحنه‌ی ناتمام در سطحِ هدف → هر صحنه‌ی ناتمامِ
// دیگر → آخرین صحنه‌ی تمام‌شده در سطحِ هدف (وقتی همه تمام شده‌اند) → اولین
// کاندیدا (fallback نهاییِ نظری، عملاً هیچ‌وقت نباید به اینجا برسد چون
// candidates خالی نیست).
func pickScene(candidates []scene.Scene, target scene.DifficultyLevel, completed map[string]bool, completedAt map[string]time.Time) scene.Scene {
	for _, sc := range candidates {
		if sc.Difficulty == target && !completed[string(sc.ID)] {
			return sc
		}
	}
	for _, sc := range candidates {
		if !completed[string(sc.ID)] {
			return sc
		}
	}

	var best scene.Scene
	var bestTime time.Time
	found := false
	for _, sc := range candidates {
		if sc.Difficulty != target {
			continue
		}
		t, ok := completedAt[string(sc.ID)]
		if !ok {
			continue
		}
		if !found || t.Before(bestTime) {
			best, bestTime, found = sc, t, true
		}
	}
	if found {
		return best
	}
	return candidates[0]
}
