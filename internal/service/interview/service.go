// Package interviewservice «مصاحبه‌ی شبیه‌سازی‌شده»: کاربر سؤال‌های صداگذاری‌شده‌ی
// یک مصاحبه‌ی کاری، پذیرش دانشگاه یا سفارت را می‌شنود، بعد از چند ثانیه آماده‌شدن
// جواب می‌دهد و می‌تواند هر سؤال را دوباره جواب دهد (تکرار تکلیف). هر جواب
// رونویسی و با همان بررسیِ «صحبت درباره‌ی یک موضوع» نقد می‌شود؛ گزارش آخر از
// بهترین تلاشِ هر سؤال ساخته می‌شود. مثل بقیه‌ی بخش‌های AI فقط برای مشترک‌ها و
// با سقف توکن روزانه، و پشت کلید FEATURE_INTERVIEW_ENABLED.
package interviewservice

import (
	"context"
	"encoding/json"
	"os"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgresinterview "shadowing-backend/internal/repository/postgres/interview"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

type repository interface {
	ListAll(ctx context.Context) ([]postgresinterview.Set, error)
	ListActiveForUser(ctx context.Context, userID string) ([]postgresinterview.UserSet, error)
	Get(ctx context.Context, id string) (postgresinterview.Set, error)
	Save(ctx context.Context, s postgresinterview.Set) (string, error)
	Delete(ctx context.Context, id string) error
	StartAttempt(ctx context.Context, userID, setID string) (string, error)
	AttemptOwner(ctx context.Context, attemptID, userID string) (string, bool, error)
	NextTryNo(ctx context.Context, attemptID, questionID string) (int, error)
	InsertAnswer(ctx context.Context, a postgresinterview.Answer) error
	Answers(ctx context.Context, attemptID string) ([]postgresinterview.AnswerRow, error)
	FinishAttempt(ctx context.Context, attemptID string, score int, report any) error
}

// reviewer همان بررسیِ صحبت آزاد؛ برای تست جدا شده.
type reviewer interface {
	ReviewTopicSpeech(ctx context.Context, title, promptFa string, guideQuestions, usefulPhrases, pictures []string, level string, durationSeconds int, transcript string) (aiservice.TopicSpeechReview, error)
}

// flags کلید روشن/خاموش بخش در تنظیمات پنل.
type flags interface {
	Get(key string) string
}

// KeyEnabled کلید تنظیماتی که این بخش را برای کاربرها باز می‌کند.
const KeyEnabled = "FEATURE_INTERVIEW_ENABLED"

type (
	Set      = postgresinterview.Set
	Question = postgresinterview.Question
	UserSet  = postgresinterview.UserSet
)

type Service struct {
	repo        repository
	ai          reviewer
	access      *aiaccessservice.Service
	transcriber speecheval.LongTranscriber
	flags       flags
}

func New(repo repository, ai reviewer, access *aiaccessservice.Service, transcriber speecheval.LongTranscriber, flags flags) *Service {
	return &Service{repo: repo, ai: ai, access: access, transcriber: transcriber, flags: flags}
}

// minAnswerSeconds کمتر از این، جوابی برای بررسی نیست.
const minAnswerSeconds = 5

var (
	validKinds  = map[string]bool{"job": true, "admission": true, "visa": true}
	validLevels = map[string]bool{"starter": true, "beginner": true, "intermediate": true, "advanced": true, "proficient": true}
)

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// Enabled یعنی بخش برای کاربرها باز است (کلید پنل روشن است).
func (s *Service) Enabled() bool {
	return isOn(s.flags.Get(KeyEnabled))
}

func isOn(v string) bool {
	switch strings.ToLower(strings.TrimSpace(v)) {
	case "1", "true", "on", "yes":
		return true
	}
	return false
}

func (s *Service) checkEnabled(op richerror.Op) error {
	if !s.Enabled() {
		return richerror.New(op).WithMessage("این بخش هنوز فعال نشده است").WithKind(richerror.KindForbidden)
	}
	return nil
}

// ---------- اپ ----------

func (s *Service) ListSets(ctx context.Context, userID string) ([]UserSet, error) {
	const op = "interview.ListSets"
	if err := s.checkEnabled(op); err != nil {
		return nil, err
	}
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	return s.repo.ListActiveForUser(ctx, userID)
}

// GetSet یک مجموعه با سؤال‌ها. جواب نمونه هم فرستاده می‌شود؛ اپ آن را فقط بعد از
// جواب دادنِ کاربر نشان می‌دهد.
func (s *Service) GetSet(ctx context.Context, id string) (Set, error) {
	const op = "interview.GetSet"
	if err := s.checkEnabled(op); err != nil {
		return Set{}, err
	}
	if err := parseID(op, id); err != nil {
		return Set{}, err
	}
	set, err := s.repo.Get(ctx, id)
	if err != nil {
		return Set{}, err
	}
	if !set.IsActive {
		return Set{}, richerror.New(op).WithMessage("مصاحبه پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return set, nil
}

// Start یک تلاش تازه می‌سازد. دسترسی AI همین‌جا چک می‌شود تا کاربرِ بدون اشتراک
// بعد از جواب دادن به سؤال اول ناامید نشود.
func (s *Service) Start(ctx context.Context, userID, setID string) (string, error) {
	const op = "interview.Start"
	if _, err := s.GetSet(ctx, setID); err != nil {
		return "", err
	}
	if err := parseID(op, userID); err != nil {
		return "", err
	}
	if err := s.access.CheckAllowed(ctx, op, userID); err != nil {
		return "", err
	}
	return s.repo.StartAttempt(ctx, userID, setID)
}

type AnswerResult struct {
	QuestionID      string `json:"question_id"`
	TryNo           int    `json:"try_no"`
	Transcript      string `json:"transcript"`
	DurationSeconds int    `json:"duration_seconds"`
	WordCount       int    `json:"word_count"`
	// WordsPerMinute سرعت صحبت؛ معیار ساده و واقعیِ روانی (عدد ساختگی نمی‌سازیم).
	WordsPerMinute int `json:"words_per_minute"`
	aiservice.TopicSpeechReview
}

// Answer جواب صوتی یک سؤال را رونویسی و بررسی و ثبت می‌کند. فایل صدا در هر حالتی پاک می‌شود.
func (s *Service) Answer(ctx context.Context, userID, attemptID, questionID, audioPath string, durationSeconds int) (*AnswerResult, error) {
	const op = "interview.Answer"
	defer func() {
		if audioPath != "" {
			_ = os.Remove(audioPath)
		}
	}()
	if err := s.checkEnabled(op); err != nil {
		return nil, err
	}
	for _, id := range []string{userID, attemptID, questionID} {
		if err := parseID(op, id); err != nil {
			return nil, err
		}
	}
	setID, finished, err := s.repo.AttemptOwner(ctx, attemptID, userID)
	if err != nil {
		return nil, err
	}
	if finished {
		return nil, richerror.New(op).WithMessage("این مصاحبه تمام شده؛ یک مصاحبه‌ی تازه شروع کن").WithKind(richerror.KindConflict)
	}
	set, err := s.repo.Get(ctx, setID)
	if err != nil {
		return nil, err
	}
	q, ok := findQuestion(set, questionID)
	if !ok {
		return nil, richerror.New(op).WithMessage("سؤال پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if durationSeconds < minAnswerSeconds {
		return nil, richerror.New(op).WithMessage("جوابت خیلی کوتاه بود؛ کمی بیشتر توضیح بده").WithKind(richerror.KindInvalid)
	}
	if durationSeconds > q.AnswerSeconds+10 {
		durationSeconds = q.AnswerSeconds
	}
	if err := s.access.CheckAllowed(ctx, op, userID); err != nil {
		return nil, err
	}

	transcript, err := s.transcriber.TranscribeLong(ctx, audioPath)
	transcript = strings.TrimSpace(transcript)
	if err != nil || transcript == "" {
		return nil, richerror.New(op).WithErr(err).WithMessage("صدایت واضح شنیده نشد، دوباره امتحان کن").WithKind(richerror.KindInvalid)
	}

	review, err := s.ai.ReviewTopicSpeech(ctx, interviewTopic(set, q), interviewInstruction(set, q), nil, q.KeyPhrases,
		nil, set.Level, durationSeconds, transcript)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("بررسی جوابت ناموفق بود، دوباره امتحان کن")
	}
	s.access.RecordUsage(ctx, userID, review.Usage.InputTokens, review.Usage.OutputTokens)
	normalizeReview(&review)

	tryNo, err := s.repo.NextTryNo(ctx, attemptID, questionID)
	if err != nil {
		return nil, err
	}
	words := len(strings.Fields(transcript))
	res := &AnswerResult{
		QuestionID: questionID, TryNo: tryNo, Transcript: transcript, DurationSeconds: durationSeconds,
		WordCount: words, WordsPerMinute: words * 60 / durationSeconds, TopicSpeechReview: review,
	}
	if err := s.repo.InsertAnswer(ctx, postgresinterview.Answer{
		AttemptID: attemptID, QuestionID: questionID, TryNo: tryNo, Transcript: transcript,
		DurationSeconds: durationSeconds, Score: review.Score, Review: res,
	}); err != nil {
		return nil, err
	}
	return res, nil
}

func findQuestion(set Set, id string) (Question, bool) {
	for _, q := range set.Questions {
		if q.ID == id {
			return q, true
		}
	}
	return Question{}, false
}

var kindLabel = map[string]string{"job": "job interview", "admission": "university admission interview", "visa": "visa / immigration interview"}

func interviewTopic(set Set, q Question) string {
	return "Answer to the " + kindLabel[set.Kind] + " question: \"" + q.Text + "\""
}

// interviewInstruction برای AI روشن می‌کند که این جواب مصاحبه است، نه صحبت آزاد:
// باید مستقیم به سؤال جواب بدهد، کوتاه و حرفه‌ای باشد.
func interviewInstruction(set Set, q Question) string {
	s := "این یک " + map[string]string{"job": "مصاحبه‌ی کاری", "admission": "مصاحبه‌ی پذیرش دانشگاه", "visa": "مصاحبه‌ی سفارت"}[set.Kind] +
		" است؛ جواب باید مستقیم به همین سؤال باشد، حرفه‌ای و مؤدب، با یک مثال یا دلیل مشخص."
	if q.TipFa != "" {
		s += " " + q.TipFa
	}
	return s
}

func normalizeReview(r *aiservice.TopicSpeechReview) {
	if r.Score < 0 {
		r.Score = 0
	}
	if r.Score > 100 {
		r.Score = 100
	}
	// مدل گاهی لیست خالی را null برمی‌گرداند؛ اپ همیشه آرایه می‌گیرد.
	if r.StrengthsFa == nil {
		r.StrengthsFa = []string{}
	}
	if r.Mistakes == nil {
		r.Mistakes = []aiservice.TopicSpeechMistake{}
	}
	if r.BetterPhrases == nil {
		r.BetterPhrases = []aiservice.TopicSpeechPhrase{}
	}
	if r.UsedPhrases == nil {
		r.UsedPhrases = []string{}
	}
	r.PicturesCovered = []int{}
}

// QuestionReport خلاصه‌ی یک سؤال در گزارش آخر: بهترین تلاش و تعداد تلاش‌ها.
type QuestionReport struct {
	QuestionID     string          `json:"question_id"`
	Tries          int             `json:"tries"`
	BestScore      int             `json:"best_score"`
	FirstScore     int             `json:"first_score"`
	BestTranscript string          `json:"best_transcript"`
	WordsPerMinute int             `json:"words_per_minute"`
	BestReview     json.RawMessage `json:"best_review"`
	SampleAnswer   string          `json:"sample_answer"`
	SampleAnswerFa string          `json:"sample_answer_fa"`
}

type Report struct {
	AttemptID string `json:"attempt_id"`
	SetID     string `json:"set_id"`
	// Score میانگین بهترین امتیازِ سؤال‌هایی که جواب داده شده‌اند.
	Score    int `json:"score"`
	Answered int `json:"answered"`
	Total    int `json:"total"`
	// Improved تعداد سؤال‌هایی که تلاش دوباره امتیازشان را بالا برد.
	Improved  int              `json:"improved"`
	Questions []QuestionReport `json:"questions"`
}

// Finish گزارش آخر را از جواب‌های ثبت‌شده می‌سازد و تلاش را می‌بندد.
func (s *Service) Finish(ctx context.Context, userID, attemptID string) (*Report, error) {
	const op = "interview.Finish"
	if err := s.checkEnabled(op); err != nil {
		return nil, err
	}
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	if err := parseID(op, attemptID); err != nil {
		return nil, err
	}
	setID, _, err := s.repo.AttemptOwner(ctx, attemptID, userID)
	if err != nil {
		return nil, err
	}
	set, err := s.repo.Get(ctx, setID)
	if err != nil {
		return nil, err
	}
	answers, err := s.repo.Answers(ctx, attemptID)
	if err != nil {
		return nil, err
	}
	if len(answers) == 0 {
		return nil, richerror.New(op).WithMessage("هنوز به هیچ سؤالی جواب نداده‌ای").WithKind(richerror.KindInvalid)
	}
	report := BuildReport(set, answers)
	report.AttemptID = attemptID
	if err := s.repo.FinishAttempt(ctx, attemptID, report.Score, report); err != nil {
		return nil, err
	}
	return &report, nil
}

// BuildReport برای هر سؤال بهترین تلاش را برمی‌دارد (تکرار تکلیف باید پاداش بگیرد،
// نه اینکه تلاش اولِ ضعیف میانگین را پایین بکشد).
func BuildReport(set Set, answers []postgresinterview.AnswerRow) Report {
	byQ := map[string][]postgresinterview.AnswerRow{}
	for _, a := range answers {
		byQ[a.QuestionID] = append(byQ[a.QuestionID], a)
	}
	rep := Report{SetID: set.ID, Total: len(set.Questions), Questions: make([]QuestionReport, 0, len(byQ))}
	sum := 0
	for _, q := range set.Questions {
		tries := byQ[q.ID]
		if len(tries) == 0 {
			continue
		}
		best := tries[0]
		for _, t := range tries[1:] {
			if t.Score > best.Score {
				best = t
			}
		}
		wpm := 0
		if best.DurationSeconds > 0 {
			wpm = len(strings.Fields(best.Transcript)) * 60 / best.DurationSeconds
		}
		qr := QuestionReport{
			QuestionID: q.ID, Tries: len(tries), BestScore: best.Score, FirstScore: tries[0].Score,
			BestTranscript: best.Transcript, WordsPerMinute: wpm, BestReview: best.Review,
			SampleAnswer: q.SampleAnswer, SampleAnswerFa: q.SampleAnswerFa,
		}
		if len(tries) > 1 && qr.BestScore > qr.FirstScore {
			rep.Improved++
		}
		rep.Questions = append(rep.Questions, qr)
		sum += best.Score
	}
	rep.Answered = len(rep.Questions)
	if rep.Answered > 0 {
		rep.Score = sum / rep.Answered
	}
	return rep
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Set, error) {
	return s.repo.ListAll(ctx)
}

func (s *Service) AdminGet(ctx context.Context, id string) (Set, error) {
	const op = "interview.AdminGet"
	if err := parseID(op, id); err != nil {
		return Set{}, err
	}
	return s.repo.Get(ctx, id)
}

func clean(list []string) []string {
	out := make([]string, 0, len(list))
	for _, v := range list {
		if v = strings.TrimSpace(v); v != "" {
			out = append(out, v)
		}
	}
	return out
}

// AdminSave مجموعه و سؤال‌هایش را اعتبارسنجی و ذخیره می‌کند (id خالی = ساختن).
func (s *Service) AdminSave(ctx context.Context, id string, set Set) (Set, error) {
	const op = "interview.AdminSave"
	if err := NormalizeSet(&set); err != nil {
		return Set{}, richerror.New(op).WithMessage(err.Error()).WithKind(richerror.KindInvalid)
	}
	if id != "" {
		if err := parseID(op, id); err != nil {
			return Set{}, err
		}
	}
	set.ID = id
	for _, q := range set.Questions {
		if q.ID != "" {
			if err := parseID(op, q.ID); err != nil {
				return Set{}, err
			}
		}
	}
	newID, err := s.repo.Save(ctx, set)
	if err != nil {
		return Set{}, err
	}
	return s.repo.Get(ctx, newID)
}

type validationError string

func (e validationError) Error() string { return string(e) }

// maxQuestions سقف سؤال‌های یک مصاحبه؛ مصاحبه‌ی واقعیِ کوتاه ۵ تا ۱۰ سؤال است.
const maxQuestions = 15

// NormalizeSet مقدارهای پیش‌فرض را می‌گذارد و ورودیِ نامعتبر را رد می‌کند.
func NormalizeSet(set *Set) error {
	set.Title = strings.TrimSpace(set.Title)
	set.TitleFa = strings.TrimSpace(set.TitleFa)
	set.FieldKey = strings.TrimSpace(set.FieldKey)
	if set.Title == "" {
		return validationError("عنوان مصاحبه الزامی است")
	}
	if !validKinds[set.Kind] {
		return validationError("نوع مصاحبه باید job، admission یا visa باشد")
	}
	if !validLevels[set.Level] {
		set.Level = "intermediate"
	}
	if len(set.Questions) > maxQuestions {
		return validationError("حداکثر ۱۵ سؤال برای هر مصاحبه")
	}
	qs := make([]Question, 0, len(set.Questions))
	for _, q := range set.Questions {
		q.Text = strings.TrimSpace(q.Text)
		if q.Text == "" {
			continue
		}
		if q.PrepSeconds <= 0 {
			q.PrepSeconds = 10
		}
		if q.PrepSeconds > 60 {
			q.PrepSeconds = 60
		}
		if q.AnswerSeconds <= 0 {
			q.AnswerSeconds = 60
		}
		if q.AnswerSeconds < 15 || q.AnswerSeconds > 180 {
			return validationError("زمان جواب هر سؤال باید بین ۱۵ تا ۱۸۰ ثانیه باشد")
		}
		q.KeyPhrases = clean(q.KeyPhrases)
		qs = append(qs, q)
	}
	set.Questions = qs
	if set.IsActive && len(qs) == 0 {
		return validationError("مصاحبه‌ی بدون سؤال را نمی‌شود فعال کرد")
	}
	return nil
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "interview.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
