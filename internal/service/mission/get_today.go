package missionservice

import (
	"context"
	"log/slog"
	"math"
	"strings"
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

	goal := ""
	if g, goalErr := s.goals.GetLearningGoal(ctx, userID); goalErr == nil {
		goal = g
	} else {
		slog.Warn("mission: failed to load learning goal, skipping goal-based bias", "err", goalErr)
	}

	chosen := pickScene(candidates, targetDifficulty, completed, completedAt, goal)

	if isEstimated {
		level = capitalize(string(chosen.Difficulty))
	}

	focusSkill := computeFocusSkill(ctx, s, uid)

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
// candidates خالی نیست). داخل دو لایه‌ی اول، اگر کاربر goal انتخاب کرده باشد
// و صحنه‌ای با Category هم‌راستا با آن در همان لایه موجود باشد، همان ترجیح
// داده می‌شود — این یک اولویت‌دهیِ نرم است، هیچ صحنه‌ای هرگز به‌خاطر
// نامرتبط‌بودنِ Category کنار گذاشته (filter) نمی‌شود.
func pickScene(candidates []scene.Scene, target scene.DifficultyLevel, completed map[string]bool, completedAt map[string]time.Time, goal string) scene.Scene {
	if sc, ok := pickPreferred(candidates, goal, func(sc scene.Scene) bool {
		return sc.Difficulty == target && !completed[string(sc.ID)]
	}); ok {
		return sc
	}
	if sc, ok := pickPreferred(candidates, goal, func(sc scene.Scene) bool {
		return !completed[string(sc.ID)]
	}); ok {
		return sc
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

// matchesGoal بررسی می‌کند آیا Category صحنه با goal کاربر هم‌راستاست —
// چون Category یک رشته‌ی آزاد است که هر صحنه توسط ادمین دستی وارد می‌شود
// (نه یک enum ثابت)، مقایسه با substring دوطرفه و case-insensitive انجام
// می‌شود تا هم "Travel" با category "Travel" و هم با چیزی مثل "Airport &
// Travel" مچ شود.
func matchesGoal(sc scene.Scene, goal string) bool {
	if goal == "" {
		return false
	}
	category := strings.TrimSpace(sc.Category)
	if category == "" {
		return false
	}
	g, c := strings.ToLower(goal), strings.ToLower(category)
	return strings.Contains(c, g) || strings.Contains(g, c)
}

// pickPreferred اولین صحنه‌ی برآورده‌کننده‌ی filter را برمی‌گرداند، مگر
// اینکه در همان مجموعه صحنه‌ای با Category هم‌راستا با goal پیدا شود که در
// آن صورت آن ترجیح داده می‌شود. ترتیبِ candidates حفظ می‌شود، پس رفتار برای
// goal خالی (پیش‌فرضِ همه‌ی کاربرانِ فعلی) دقیقاً همان رفتار قبلی است.
func pickPreferred(candidates []scene.Scene, goal string, filter func(scene.Scene) bool) (scene.Scene, bool) {
	var first scene.Scene
	foundFirst := false
	for _, sc := range candidates {
		if !filter(sc) {
			continue
		}
		if !foundFirst {
			first, foundFirst = sc, true
		}
		if matchesGoal(sc, goal) {
			return sc, true
		}
	}
	return first, foundFirst
}

const maxLeitnerLevel = 5

type skillScore struct {
	name  string
	score float64
}

// computeFocusSkill ضعیف‌ترین مهارت کاربر را از میان چهار مهارتِ واقعاً
// اندازه‌گیری‌شده (Pronunciation/Fluency/Vocabulary/Grammar — همان چهارتایی
// که GetSkillsBreakdown نشان می‌دهد) انتخاب می‌کند. هر مهارت فقط وقتی وارد
// مقایسه می‌شود که داده‌ی واقعی پشتش باشد، تا یک صفرِ ناشی از «هنوز داده‌ای
// نیست» به‌غلط به‌عنوان «مهارت ضعیف» برچسب نخورد؛ اگر هیچ مهارتی داده نداشت
// برچسبِ عمومی «speaking» باقی می‌ماند.
func computeFocusSkill(ctx context.Context, s *Service, uid uuid.UUID) string {
	var available []skillScore

	if pron, flu, skillErr := s.skills.AvgScoresByUser(ctx, uid); skillErr == nil {
		if !(pron == 0 && flu == 0) {
			available = append(available, skillScore{"pronunciation", pron}, skillScore{"fluency", flu})
		}
	} else {
		slog.Warn("mission: failed to load skill scores, using generic focus skill", "err", skillErr)
	}

	if avgLevel, wordCount, err := s.leitner.AvgLevelByUser(ctx, uid); err == nil && wordCount > 0 {
		available = append(available, skillScore{"vocabulary", avgLevel / maxLeitnerLevel * 100})
	}

	if clean, total, err := s.grammar.CleanRate(ctx, uid); err == nil && total > 0 {
		available = append(available, skillScore{"grammar", float64(clean) / float64(total) * 100})
	}

	if len(available) == 0 {
		return "speaking"
	}

	weakest := available[0]
	for _, sk := range available[1:] {
		if sk.score < weakest.score {
			weakest = sk
		}
	}
	return weakest.name
}
