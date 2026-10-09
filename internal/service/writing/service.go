// Package writingservice «تمرین نوشتن»: کاربر درباره‌ی موضوعی که ادمین داده یک
// داستان/متن کوتاه می‌نویسد و AI آن را تصحیح می‌کند (اشتباه‌ها با توضیح
// گرامری، عبارت‌های بهتر، ساختارهای پیشنهادی، نسخه‌ی بهترشده). مثل بقیه‌ی
// قابلیت‌های AI فقط برای مشترک‌ها و با سقف توکن روزانه.
package writingservice

import (
	"context"
	"fmt"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgreswriting "shadowing-backend/internal/repository/postgres/writing"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"

	"github.com/google/uuid"
)

type repository interface {
	ListAll(ctx context.Context) ([]postgreswriting.Prompt, error)
	ListActiveForUser(ctx context.Context, userID string) ([]postgreswriting.UserPrompt, error)
	Get(ctx context.Context, id string) (postgreswriting.Prompt, error)
	Create(ctx context.Context, t postgreswriting.Prompt) (postgreswriting.Prompt, error)
	Update(ctx context.Context, t postgreswriting.Prompt) (postgreswriting.Prompt, error)
	Delete(ctx context.Context, id string) error
	InsertAttempt(ctx context.Context, a postgreswriting.Attempt) error
}

type Prompt = postgreswriting.Prompt
type UserPrompt = postgreswriting.UserPrompt

type Service struct {
	repo   repository
	ai     aiservice.Service
	access *aiaccessservice.Service
}

func New(repo repository, ai aiservice.Service, access *aiaccessservice.Service) *Service {
	return &Service{repo: repo, ai: ai, access: access}
}

// maxTextChars سقف طول متن ارسالی — جلوی خرج توکن روی متن‌های خیلی بلند را می‌گیرد.
const maxTextChars = 6000

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

func (s *Service) ListPrompts(ctx context.Context, userID string) ([]UserPrompt, error) {
	const op = "writing.ListPrompts"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	return s.repo.ListActiveForUser(ctx, userID)
}

type SubmitResult struct {
	WordCount int `json:"word_count"`
	aiservice.WritingReview
}

// Submit متن کاربر را تصحیح و ثبت می‌کند.
func (s *Service) Submit(ctx context.Context, userID, promptID, text string) (*SubmitResult, error) {
	const op = "writing.Submit"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	if err := parseID(op, promptID); err != nil {
		return nil, err
	}
	text = strings.TrimSpace(text)
	if len(text) > maxTextChars {
		return nil, richerror.New(op).WithMessage("متن خیلی طولانی است").WithKind(richerror.KindInvalid)
	}
	prompt, err := s.repo.Get(ctx, promptID)
	if err != nil {
		return nil, err
	}
	words := len(strings.Fields(text))
	// کمی اغماض نسبت به حداقل، تا یکی دو کلمه کمتر کاربر را رد نکند.
	if minWords := prompt.MinWords * 8 / 10; words < minWords {
		return nil, richerror.New(op).WithMessage(fmt.Sprintf("متنت خیلی کوتاه است؛ حداقل حدود %d کلمه بنویس", prompt.MinWords)).WithKind(richerror.KindInvalid)
	}
	if err := s.access.CheckAllowed(ctx, op, userID); err != nil {
		return nil, err
	}

	review, err := s.ai.ReviewWriting(ctx, prompt.Title, prompt.PromptFa, prompt.GuideQuestions, prompt.UsefulPhrases, prompt.Level, text)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("تصحیح متن ناموفق بود، دوباره امتحان کن")
	}
	s.access.RecordUsage(ctx, userID, review.Usage.InputTokens, review.Usage.OutputTokens)
	normalize(&review)

	res := &SubmitResult{WordCount: words, WritingReview: review}
	// ثبت تاریخچه نباید نتیجه‌ای را که کاربر منتظرش است از بین ببرد.
	_ = s.repo.InsertAttempt(ctx, postgreswriting.Attempt{
		UserID: userID, PromptID: promptID, Text: text, Score: review.Score, Review: res,
	})
	return res, nil
}

// normalize امتیاز را به بازه‌ی ۰..۱۰۰ می‌برد و لیست‌های null مدل را خالی می‌کند.
func normalize(r *aiservice.WritingReview) {
	if r.Score < 0 {
		r.Score = 0
	}
	if r.Score > 100 {
		r.Score = 100
	}
	if r.StrengthsFa == nil {
		r.StrengthsFa = []string{}
	}
	if r.Mistakes == nil {
		r.Mistakes = []aiservice.TopicSpeechMistake{}
	}
	if r.BetterPhrases == nil {
		r.BetterPhrases = []aiservice.TopicSpeechPhrase{}
	}
	if r.Structures == nil {
		r.Structures = []aiservice.WritingStructure{}
	}
	if r.UsedPhrases == nil {
		r.UsedPhrases = []string{}
	}
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Prompt, error) {
	return s.repo.ListAll(ctx)
}

var validLevels = map[string]bool{"beginner": true, "intermediate": true, "advanced": true}

func clean(list []string) []string {
	out := make([]string, 0, len(list))
	for _, v := range list {
		if v = strings.TrimSpace(v); v != "" {
			out = append(out, v)
		}
	}
	return out
}

// AdminSave موضوع را می‌سازد (id خالی) یا به‌روز می‌کند.
func (s *Service) AdminSave(ctx context.Context, id string, p Prompt) (Prompt, error) {
	const op = "writing.AdminSave"
	invalid := func(msg string) (Prompt, error) {
		return Prompt{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	p.Title = strings.TrimSpace(p.Title)
	p.PromptFa = strings.TrimSpace(p.PromptFa)
	p.GuideQuestions = clean(p.GuideQuestions)
	p.UsefulPhrases = clean(p.UsefulPhrases)
	if p.Title == "" {
		return invalid("عنوان موضوع الزامی است")
	}
	if !validLevels[p.Level] {
		p.Level = "beginner"
	}
	if p.MinWords < 10 || p.MinWords > 500 {
		return invalid("حداقل کلمه باید بین ۱۰ تا ۵۰۰ باشد")
	}
	if p.MaxWords < p.MinWords || p.MaxWords > 800 {
		return invalid("حداکثر کلمه باید بیشتر از حداقل و حداکثر ۸۰۰ باشد")
	}
	if id == "" {
		return s.repo.Create(ctx, p)
	}
	if err := parseID(op, id); err != nil {
		return Prompt{}, err
	}
	p.ID = id
	return s.repo.Update(ctx, p)
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "writing.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

// AdminSuggest از یک ایده‌ی کوتاه، محتوای موضوع را با AI پیشنهاد می‌دهد (چیزی ذخیره نمی‌کند).
func (s *Service) AdminSuggest(ctx context.Context, idea, level string) (aiservice.SpeakingTopicSuggestion, error) {
	const op = "writing.AdminSuggest"
	if strings.TrimSpace(idea) == "" {
		return aiservice.SpeakingTopicSuggestion{}, richerror.New(op).WithMessage("ایده‌ی موضوع را بنویس").WithKind(richerror.KindInvalid)
	}
	if !validLevels[level] {
		level = "beginner"
	}
	return s.ai.SuggestWritingPrompt(ctx, idea, level)
}
