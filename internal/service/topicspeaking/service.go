// Package topicspeakingservice «صحبت درباره‌ی یک موضوع»: کاربر ۱ تا ۲ دقیقه
// درباره‌ی موضوعی که ادمین ساخته صحبت می‌کند؛ صدا رونویسی و با AI بررسی
// می‌شود (ربط به موضوع، اشتباه‌ها با توضیح گرامری، عبارت‌های بهتر، نسخه‌ی
// بهترشده). مثل گفتگو با AI فقط برای مشترک‌ها و با سقف توکن روزانه.
package topicspeakingservice

import (
	"context"
	"os"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgrestopicspeaking "shadowing-backend/internal/repository/postgres/topicspeaking"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

type repository interface {
	ListAll(ctx context.Context) ([]postgrestopicspeaking.Topic, error)
	ListActiveForUser(ctx context.Context, userID string) ([]postgrestopicspeaking.UserTopic, error)
	Get(ctx context.Context, id string) (postgrestopicspeaking.Topic, error)
	Create(ctx context.Context, t postgrestopicspeaking.Topic) (postgrestopicspeaking.Topic, error)
	Update(ctx context.Context, t postgrestopicspeaking.Topic) (postgrestopicspeaking.Topic, error)
	Delete(ctx context.Context, id string) error
	InsertAttempt(ctx context.Context, a postgrestopicspeaking.Attempt) error
}

type Topic = postgrestopicspeaking.Topic
type UserTopic = postgrestopicspeaking.UserTopic

type Service struct {
	repo        repository
	ai          aiservice.Service
	access      *aiaccessservice.Service
	transcriber speecheval.LongTranscriber
}

func New(repo repository, ai aiservice.Service, access *aiaccessservice.Service, transcriber speecheval.LongTranscriber) *Service {
	return &Service{repo: repo, ai: ai, access: access, transcriber: transcriber}
}

// minSpeakSeconds کمتر از این، صحبتی برای بررسی وجود ندارد (اپ هم دکمه‌ی پایان
// را قبل از آن غیرفعال نگه می‌دارد).
const minSpeakSeconds = 15

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

func (s *Service) ListTopics(ctx context.Context, userID string) ([]UserTopic, error) {
	const op = "topicspeaking.ListTopics"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	return s.repo.ListActiveForUser(ctx, userID)
}

type AttemptResult struct {
	Transcript      string `json:"transcript"`
	DurationSeconds int    `json:"duration_seconds"`
	WordCount       int    `json:"word_count"`
	// WordsPerMinute سرعت صحبت (از روی تعداد کلمه و مدت ضبط) — معیار ساده‌ی روانی.
	WordsPerMinute int `json:"words_per_minute"`
	aiservice.TopicSpeechReview
}

// Attempt صدای کاربر را رونویسی و بررسی می‌کند و تلاش را ثبت می‌کند. فایل صدا
// در هر حالتی پاک می‌شود.
func (s *Service) Attempt(ctx context.Context, userID, topicID, audioPath string, durationSeconds int) (*AttemptResult, error) {
	const op = "topicspeaking.Attempt"
	defer func() {
		if audioPath != "" {
			_ = os.Remove(audioPath)
		}
	}()

	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	if err := parseID(op, topicID); err != nil {
		return nil, err
	}
	if durationSeconds < minSpeakSeconds {
		return nil, richerror.New(op).WithMessage("صحبتت خیلی کوتاه بود؛ حداقل ۱۵ ثانیه صحبت کن").WithKind(richerror.KindInvalid)
	}
	if err := s.access.CheckAllowed(ctx, op, userID); err != nil {
		return nil, err
	}
	topic, err := s.repo.Get(ctx, topicID)
	if err != nil {
		return nil, err
	}
	if durationSeconds > topic.DurationSeconds+10 {
		durationSeconds = topic.DurationSeconds
	}

	transcript, err := s.transcriber.TranscribeLong(ctx, audioPath)
	transcript = strings.TrimSpace(transcript)
	if err != nil || transcript == "" {
		return nil, richerror.New(op).WithErr(err).WithMessage("صدایت واضح شنیده نشد، دوباره امتحان کن").WithKind(richerror.KindInvalid)
	}

	review, err := s.ai.ReviewTopicSpeech(ctx, topic.Title, topic.PromptFa, topic.GuideQuestions, topic.UsefulPhrases,
		topic.Level, durationSeconds, transcript)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("بررسی صحبتت ناموفق بود، دوباره امتحان کن")
	}
	s.access.RecordUsage(ctx, userID, review.Usage.InputTokens, review.Usage.OutputTokens)
	if review.Score < 0 {
		review.Score = 0
	}
	if review.Score > 100 {
		review.Score = 100
	}
	// مدل گاهی لیست خالی را null برمی‌گرداند؛ اپ همیشه آرایه می‌گیرد.
	if review.StrengthsFa == nil {
		review.StrengthsFa = []string{}
	}
	if review.Mistakes == nil {
		review.Mistakes = []aiservice.TopicSpeechMistake{}
	}
	if review.BetterPhrases == nil {
		review.BetterPhrases = []aiservice.TopicSpeechPhrase{}
	}
	if review.UsedPhrases == nil {
		review.UsedPhrases = []string{}
	}

	words := len(strings.Fields(transcript))
	res := &AttemptResult{
		Transcript:        transcript,
		DurationSeconds:   durationSeconds,
		WordCount:         words,
		WordsPerMinute:    words * 60 / durationSeconds,
		TopicSpeechReview: review,
	}
	if err := s.repo.InsertAttempt(ctx, postgrestopicspeaking.Attempt{
		UserID: userID, TopicID: topicID, Transcript: transcript,
		DurationSeconds: durationSeconds, Score: review.Score, Review: res,
	}); err != nil {
		// ثبت تاریخچه نباید نتیجه‌ای را که کاربر منتظرش است از بین ببرد.
		return res, nil
	}
	return res, nil
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Topic, error) {
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
func (s *Service) AdminSave(ctx context.Context, id string, t Topic) (Topic, error) {
	const op = "topicspeaking.AdminSave"
	t.Title = strings.TrimSpace(t.Title)
	t.PromptFa = strings.TrimSpace(t.PromptFa)
	t.GuideQuestions = clean(t.GuideQuestions)
	t.UsefulPhrases = clean(t.UsefulPhrases)
	if t.Title == "" {
		return Topic{}, richerror.New(op).WithMessage("عنوان موضوع الزامی است").WithKind(richerror.KindInvalid)
	}
	if !validLevels[t.Level] {
		t.Level = "beginner"
	}
	if t.DurationSeconds < 30 || t.DurationSeconds > 120 {
		return Topic{}, richerror.New(op).WithMessage("مدت صحبت باید بین ۳۰ تا ۱۲۰ ثانیه باشد").WithKind(richerror.KindInvalid)
	}
	if id == "" {
		return s.repo.Create(ctx, t)
	}
	if err := parseID(op, id); err != nil {
		return Topic{}, err
	}
	t.ID = id
	return s.repo.Update(ctx, t)
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "topicspeaking.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

// AdminSuggest از یک ایده‌ی کوتاه، محتوای موضوع را با AI پیشنهاد می‌دهد (چیزی ذخیره نمی‌کند).
func (s *Service) AdminSuggest(ctx context.Context, idea, level string) (aiservice.SpeakingTopicSuggestion, error) {
	const op = "topicspeaking.AdminSuggest"
	if strings.TrimSpace(idea) == "" {
		return aiservice.SpeakingTopicSuggestion{}, richerror.New(op).WithMessage("ایده‌ی موضوع را بنویس").WithKind(richerror.KindInvalid)
	}
	if !validLevels[level] {
		level = "beginner"
	}
	return s.ai.SuggestSpeakingTopic(ctx, idea, level)
}
