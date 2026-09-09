package learningservice

import (
	"context"
	"math/rand"

	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/google/uuid"
)

// حداکثر تعداد سوال هر کوئیز، و تعداد گزینه‌ی هر سوال (۱ گزینه‌ی درست +
// حداکثر ۳ گزینه‌ی غلط). اگر صحنه/دیتابیس محتوای کافی برای این تعداد گزینه
// نداشته باشد، سوال با گزینه‌های کمتر ساخته می‌شود، نه اینکه کلا حذف شود.
const (
	maxQuizQuestions = 5
	maxQuizOptions   = 4
)

// GenerateSceneQuiz چند سوال چهارگزینه‌ی درک شنیداری از روی دیالوگ‌های
// واقعیِ همین صحنه می‌سازد: متن فارسی به‌عنوان سوال، و جمله‌ی انگلیسیِ درست
// در میان چند گزینه‌ی غلط که از دیالوگ‌های صحنه‌های دیگر (هم‌سطح) گرفته
// می‌شوند. محتوای دستیِ جداگانه لازم نیست — با هر صحنه‌ی جدید خودکار کار
// می‌کند.
func (s Service) GenerateSceneQuiz(ctx context.Context, sceneID string) ([]dto.QuizQuestion, error) {
	const op = "learningservice.GenerateSceneQuiz"

	scene, err := s.repo.GetByID(ctx, sceneID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	type candidate struct {
		dialogueID  string
		original    string
		translation string
	}

	var candidates []candidate
	for _, h := range scene.Hotspots {
		for _, d := range h.Dialogues {
			if d.OriginalText == "" || d.Translation == "" {
				continue
			}
			candidates = append(candidates, candidate{
				dialogueID:  string(d.ID),
				original:    d.OriginalText,
				translation: d.Translation,
			})
		}
	}

	if len(candidates) == 0 {
		return []dto.QuizQuestion{}, nil
	}

	rand.Shuffle(len(candidates), func(i, j int) { candidates[i], candidates[j] = candidates[j], candidates[i] })
	if len(candidates) > maxQuizQuestions {
		candidates = candidates[:maxQuizQuestions]
	}

	// یک استخر مشترک از گزینه‌های غلط برای کل کوئیز کافی است — نیازی به
	// یک کوئری جدا برای هر سوال نیست.
	pool, err := s.repo.RandomDialogueTexts(ctx, sceneID, string(scene.Difficulty), maxQuizQuestions*8)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	questions := make([]dto.QuizQuestion, 0, len(candidates))
	poolCursor := 0
	for _, c := range candidates {
		options := []string{c.original}
		seen := map[string]bool{c.original: true}

		for len(options) < maxQuizOptions && poolCursor < len(pool) {
			text := pool[poolCursor]
			poolCursor++
			if seen[text] {
				continue
			}
			seen[text] = true
			options = append(options, text)
		}

		rand.Shuffle(len(options), func(i, j int) { options[i], options[j] = options[j], options[i] })

		questions = append(questions, dto.QuizQuestion{
			DialogueID: c.dialogueID,
			Prompt:     c.translation,
			Options:    options,
		})
	}

	return questions, nil
}

// CheckSceneQuizAnswers پاسخ‌های ارسالی را با متن واقعیِ دیالوگ‌ها مقایسه
// می‌کند — سمت سرور، نه کلاینت، چون گزینه‌ها هر بار تصادفی ساخته می‌شوند و
// اعتماد به نمره‌ی خودِ کلاینت امن نیست. دیالوگِ نامعتبر/حذف‌شده به‌سادگی
// غلط شمرده می‌شود، نه خطای کل درخواست.
func (s Service) CheckSceneQuizAnswers(ctx context.Context, answers []dto.QuizAnswer) (correct, total int) {
	for _, a := range answers {
		total++
		id, err := uuid.Parse(a.DialogueID)
		if err != nil {
			continue
		}
		d, err := s.repo.GetDialogueByID(ctx, id)
		if err != nil {
			continue
		}
		if d.OriginalText == a.SelectedText {
			correct++
		}
	}

	return correct, total
}
