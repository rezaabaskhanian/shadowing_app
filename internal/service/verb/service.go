package verbservice

import (
	"context"
	"log/slog"
	"math/rand"
	"os"
	"regexp"
	"sort"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgresverb "shadowing-backend/internal/repository/postgres/verb"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// Service افعال چندمعنایی: مدیریت ادمین (معناها، جست‌وجو در درس‌ها با کمک AI،
// صف تأیید) و تجربه‌ی اپ (صفحه‌ی فعل، نشانه‌گذاری داخل درس، آزمون تشخیص،
// تمرین صوتی). امتیاز (XP) عمداً ندارد.
type Service struct {
	repo        postgresverb.DB
	ai          aiservice.Service
	access      *aiaccessservice.Service
	transcriber speecheval.Transcriber
}

func New(repo postgresverb.DB, ai aiservice.Service, access *aiaccessservice.Service, transcriber speecheval.Transcriber) *Service {
	return &Service{repo: repo, ai: ai, access: access, transcriber: transcriber}
}

// «یادگرفته»: دو جواب درست آزمون تشخیص در دو روز متفاوت، به‌علاوه‌ی یا تمرین
// صوتی موفق یا دو مرور موفق لایتنر (کارت از سطح ۱ به ۳ رسیده باشد).
const (
	recognitionTarget      = 2
	leitnerLevelForLearned = 3
	quizSize               = 8
	classifyBatchSize      = 40
)

func isLearned(p postgresverb.Progress) bool {
	return p.RecognitionCorrect >= recognitionTarget && (p.SpokenOK || p.LeitnerLevel >= leitnerLevelForLearned)
}

func parseID(op richerror.Op, id string) (uuid.UUID, error) {
	u, err := uuid.Parse(id)
	if err != nil {
		return uuid.Nil, richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return u, nil
}

// ============================================================
// ادمین
// ============================================================

type AdminVerbSummary struct {
	postgresverb.Verb
	MeaningCount   int `json:"meaning_count"`
	ApprovedCount  int `json:"approved_count"`
	SuggestedCount int `json:"suggested_count"`
}

func (s *Service) AdminListVerbs(ctx context.Context) ([]AdminVerbSummary, error) {
	verbs, err := s.repo.ListVerbs(ctx, false)
	if err != nil {
		return nil, err
	}
	out := make([]AdminVerbSummary, 0, len(verbs))
	for _, v := range verbs {
		meanings, err := s.repo.ListMeanings(ctx, v.ID)
		if err != nil {
			return nil, err
		}
		occ, err := s.repo.ListOccurrences(ctx, v.ID)
		if err != nil {
			return nil, err
		}
		sum := AdminVerbSummary{Verb: v, MeaningCount: len(meanings)}
		for _, o := range occ {
			switch o.Status {
			case "approved":
				sum.ApprovedCount++
			case "suggested":
				sum.SuggestedCount++
			}
		}
		out = append(out, sum)
	}
	return out, nil
}

type AdminVerbDetail struct {
	Verb        postgresverb.Verb         `json:"verb"`
	Meanings    []postgresverb.Meaning    `json:"meanings"`
	Occurrences []postgresverb.Occurrence `json:"occurrences"`
}

func (s *Service) AdminGetVerb(ctx context.Context, id string) (*AdminVerbDetail, error) {
	const op = "verb.AdminGetVerb"
	vid, err := parseID(op, id)
	if err != nil {
		return nil, err
	}
	v, err := s.repo.GetVerb(ctx, vid)
	if err != nil {
		return nil, err
	}
	meanings, err := s.repo.ListMeanings(ctx, vid)
	if err != nil {
		return nil, err
	}
	occ, err := s.repo.ListOccurrences(ctx, vid)
	if err != nil {
		return nil, err
	}
	return &AdminVerbDetail{Verb: v, Meanings: nonNil(meanings), Occurrences: nonNil(occ)}, nil
}

func nonNil[T any](s []T) []T {
	if s == nil {
		return []T{}
	}
	return s
}

func normalizeForms(lemma string, forms []string) []string {
	seen := map[string]bool{}
	out := []string{}
	for _, f := range append([]string{lemma}, forms...) {
		f = strings.ToLower(strings.TrimSpace(f))
		if f != "" && !seen[f] {
			seen[f] = true
			out = append(out, f)
		}
	}
	return out
}

func (s *Service) AdminSaveVerb(ctx context.Context, id string, v postgresverb.Verb) (postgresverb.Verb, error) {
	const op = "verb.AdminSaveVerb"
	v.Lemma = strings.ToLower(strings.TrimSpace(v.Lemma))
	if v.Lemma == "" {
		return postgresverb.Verb{}, richerror.New(op).WithMessage("فعل الزامی است").WithKind(richerror.KindInvalid)
	}
	v.Forms = normalizeForms(v.Lemma, v.Forms)
	if id == "" {
		return s.repo.CreateVerb(ctx, v)
	}
	vid, err := parseID(op, id)
	if err != nil {
		return postgresverb.Verb{}, err
	}
	v.ID = vid
	if err := s.repo.UpdateVerb(ctx, v); err != nil {
		return postgresverb.Verb{}, err
	}
	return v, nil
}

func (s *Service) AdminDeleteVerb(ctx context.Context, id string) error {
	vid, err := parseID("verb.AdminDeleteVerb", id)
	if err != nil {
		return err
	}
	return s.repo.DeleteVerb(ctx, vid)
}

func (s *Service) AdminSaveMeaning(ctx context.Context, verbID, meaningID string, m postgresverb.Meaning) (postgresverb.Meaning, error) {
	const op = "verb.AdminSaveMeaning"
	m.MeaningFa = strings.TrimSpace(m.MeaningFa)
	if m.MeaningFa == "" {
		return postgresverb.Meaning{}, richerror.New(op).WithMessage("معنای فارسی الزامی است").WithKind(richerror.KindInvalid)
	}
	if meaningID == "" {
		vid, err := parseID(op, verbID)
		if err != nil {
			return postgresverb.Meaning{}, err
		}
		m.VerbID = vid
		return s.repo.CreateMeaning(ctx, m)
	}
	mid, err := parseID(op, meaningID)
	if err != nil {
		return postgresverb.Meaning{}, err
	}
	m.ID = mid
	if err := s.repo.UpdateMeaning(ctx, m); err != nil {
		return postgresverb.Meaning{}, err
	}
	return m, nil
}

func (s *Service) AdminDeleteMeaning(ctx context.Context, meaningID string) error {
	mid, err := parseID("verb.AdminDeleteMeaning", meaningID)
	if err != nil {
		return err
	}
	return s.repo.DeleteMeaning(ctx, mid)
}

func (s *Service) AdminSuggestMeanings(ctx context.Context, verbID string) ([]aiservice.VerbMeaningSuggestion, error) {
	const op = "verb.AdminSuggestMeanings"
	vid, err := parseID(op, verbID)
	if err != nil {
		return nil, err
	}
	v, err := s.repo.GetVerb(ctx, vid)
	if err != nil {
		return nil, err
	}
	suggestions, err := s.ai.SuggestVerbMeanings(ctx, v.Lemma)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("پیشنهاد معناها با هوش مصنوعی ناموفق بود")
	}
	return nonNil(suggestions), nil
}

// AdminReviewOccurrence وضعیت یک جمله را تعیین می‌کند (تأیید با معنا، یا رد).
func (s *Service) AdminReviewOccurrence(ctx context.Context, occurrenceID, status, meaningID string) error {
	const op = "verb.AdminReviewOccurrence"
	oid, err := parseID(op, occurrenceID)
	if err != nil {
		return err
	}
	var mid *uuid.UUID
	if meaningID != "" {
		u, err := parseID(op, meaningID)
		if err != nil {
			return err
		}
		mid = &u
	}
	switch status {
	case "approved":
		if mid == nil {
			return richerror.New(op).WithMessage("برای تأیید باید معنا انتخاب شود").WithKind(richerror.KindInvalid)
		}
	case "rejected", "suggested":
	default:
		return richerror.New(op).WithMessage("وضعیت نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return s.repo.UpdateOccurrence(ctx, oid, status, mid)
}

type ScanResult struct {
	Found      int  `json:"found"`
	Classified bool `json:"classified"`
}

// AdminScan همه‌ی دیالوگ‌ها را برای شکل‌های این فعل می‌گردد و جمله‌های تازه را با
// حدسِ معنای AI به‌صورت «پیشنهاد» ثبت می‌کند. جمله‌هایی که قبلاً (با هر
// وضعیتی) ثبت شده‌اند دوباره اضافه نمی‌شوند.
func (s *Service) AdminScan(ctx context.Context, verbID string) (ScanResult, error) {
	vid, err := parseID("verb.AdminScan", verbID)
	if err != nil {
		return ScanResult{}, err
	}
	return s.scan(ctx, vid, nil)
}

// ScanScene بعد از ساخت/ویرایش یک صحنه برای همه‌ی افعالی که معنا دارند اجرا
// می‌شود تا جمله‌های تازه‌ی آن صحنه به صف بررسی ادمین اضافه شوند.
func (s *Service) ScanScene(ctx context.Context, sceneID string) {
	sid, err := uuid.Parse(sceneID)
	if err != nil {
		return
	}
	verbs, err := s.repo.ListVerbs(ctx, false)
	if err != nil {
		slog.Warn("verb: scan scene failed", "err", err)
		return
	}
	for _, v := range verbs {
		if _, err := s.scan(ctx, v.ID, &sid); err != nil {
			slog.Warn("verb: scan scene failed", "verb", v.Lemma, "err", err)
		}
	}
}

func formsRegexp(forms []string) *regexp.Regexp {
	quoted := make([]string, len(forms))
	for i, f := range forms {
		quoted[i] = regexp.QuoteMeta(f)
	}
	// مرز کلمه + خط تیره‌ی بعدش ممنوع نیست؛ AI موارد غیرفعلی مثل get-together را کنار می‌گذارد.
	return regexp.MustCompile(`(?i)\b(` + strings.Join(quoted, "|") + `)\b`)
}

func (s *Service) scan(ctx context.Context, verbID uuid.UUID, sceneID *uuid.UUID) (ScanResult, error) {
	const op = "verb.scan"
	v, err := s.repo.GetVerb(ctx, verbID)
	if err != nil {
		return ScanResult{}, err
	}
	meanings, err := s.repo.ListMeanings(ctx, verbID)
	if err != nil {
		return ScanResult{}, err
	}
	if len(meanings) == 0 {
		return ScanResult{}, richerror.New(op).WithMessage("اول معناهای این فعل را تعریف کن").WithKind(richerror.KindInvalid)
	}
	sentences, err := s.repo.SceneSentences(ctx, sceneID)
	if err != nil {
		return ScanResult{}, err
	}
	existing, err := s.repo.ExistingSentences(ctx, verbID)
	if err != nil {
		return ScanResult{}, err
	}

	re := formsRegexp(v.Forms)
	type hit struct {
		sentence postgresverb.SceneSentence
		form     string
	}
	var hits []hit
	for _, sn := range sentences {
		if existing[sn.SceneID.String()+"|"+sn.Sentence] {
			continue
		}
		if m := re.FindString(sn.Sentence); m != "" {
			hits = append(hits, hit{sn, strings.ToLower(m)})
		}
	}

	meaningLabels := make([]string, len(meanings))
	for i, m := range meanings {
		meaningLabels[i] = m.MeaningFa
		if m.ExplanationFa != "" {
			meaningLabels[i] += " — " + m.ExplanationFa
		}
	}

	result := ScanResult{Found: len(hits), Classified: true}
	for start := 0; start < len(hits); start += classifyBatchSize {
		batch := hits[start:min(start+classifyBatchSize, len(hits))]
		texts := make([]string, len(batch))
		for i, h := range batch {
			texts[i] = h.sentence.Sentence
		}
		guess := map[int]int{}
		if classified, err := s.ai.ClassifyVerbUsages(ctx, v.Lemma, meaningLabels, texts); err != nil {
			// بدون AI هم جمله‌ها بدون معنای پیشنهادی به صف می‌روند؛ ادمین دستی انتخاب می‌کند.
			slog.Warn("verb: AI classification failed, saving without meaning", "verb", v.Lemma, "err", err)
			result.Classified = false
		} else {
			for _, c := range classified {
				guess[c.Index] = c.MeaningIndex
			}
		}
		for i, h := range batch {
			var mid *uuid.UUID
			if idx, ok := guess[i]; ok && idx >= 0 && idx < len(meanings) {
				mid = &meanings[idx].ID
			}
			if err := s.repo.InsertSuggestion(ctx, verbID, mid, h.sentence.SceneID, h.sentence.Sentence, h.form); err != nil {
				return result, err
			}
		}
	}
	return result, nil
}

// ============================================================
// اپ
// ============================================================

type VerbListItem struct {
	ID           string `json:"id"`
	Lemma        string `json:"lemma"`
	MeaningCount int    `json:"meaning_count"`
	LearnedCount int    `json:"learned_count"`
}

func (s *Service) ListVerbs(ctx context.Context, userID string) ([]VerbListItem, error) {
	const op = "verb.ListVerbs"
	uid, err := parseID(op, userID)
	if err != nil {
		return nil, err
	}
	verbs, err := s.repo.ListVerbs(ctx, true)
	if err != nil {
		return nil, err
	}
	progress, err := s.repo.UserProgress(ctx, uid)
	if err != nil {
		return nil, err
	}
	out := []VerbListItem{}
	for _, v := range verbs {
		meanings, err := s.repo.ListMeanings(ctx, v.ID)
		if err != nil {
			return nil, err
		}
		if len(meanings) == 0 {
			continue
		}
		item := VerbListItem{ID: v.ID.String(), Lemma: v.Lemma, MeaningCount: len(meanings)}
		for _, m := range meanings {
			if isLearned(progress[m.ID]) {
				item.LearnedCount++
			}
		}
		out = append(out, item)
	}
	return out, nil
}

type Example struct {
	Sentence    string `json:"sentence"`
	Form        string `json:"form"`
	Translation string `json:"translation"`
	AudioURL    string `json:"audio_url"`
	SceneID     string `json:"scene_id"`
	SceneTitle  string `json:"scene_title"`
	DialogueID  string `json:"dialogue_id"`
}

type MeaningView struct {
	ID                 string    `json:"id"`
	MeaningFa          string    `json:"meaning_fa"`
	ExplanationFa      string    `json:"explanation_fa"`
	PracticePromptFa   string    `json:"practice_prompt_fa"`
	FallbackExample    string    `json:"fallback_example"`
	Examples           []Example `json:"examples"`
	Seen               bool      `json:"seen"`
	RecognitionCorrect int       `json:"recognition_correct"`
	RecognitionTarget  int       `json:"recognition_target"`
	SpokenOK           bool      `json:"spoken_ok"`
	InLeitner          bool      `json:"in_leitner"`
	Learned            bool      `json:"learned"`
}

type VerbView struct {
	ID       string        `json:"id"`
	Lemma    string        `json:"lemma"`
	Meanings []MeaningView `json:"meanings"`
}

func (s *Service) GetVerb(ctx context.Context, userID, verbID string) (*VerbView, error) {
	const op = "verb.GetVerb"
	uid, err := parseID(op, userID)
	if err != nil {
		return nil, err
	}
	vid, err := parseID(op, verbID)
	if err != nil {
		return nil, err
	}
	v, err := s.repo.GetVerb(ctx, vid)
	if err != nil {
		return nil, err
	}
	if !v.IsPublished {
		return nil, richerror.New(op).WithMessage("فعل پیدا نشد").WithKind(richerror.KindNotFound)
	}
	meanings, err := s.repo.ListMeanings(ctx, vid)
	if err != nil {
		return nil, err
	}
	occ, err := s.repo.ApprovedOccurrences(ctx, vid)
	if err != nil {
		return nil, err
	}
	progress, err := s.repo.UserProgress(ctx, uid)
	if err != nil {
		return nil, err
	}

	byMeaning := map[uuid.UUID][]Example{}
	for _, o := range occ {
		byMeaning[*o.MeaningID] = append(byMeaning[*o.MeaningID], Example{
			Sentence: o.Sentence, Form: o.MatchedForm, Translation: o.Translation, AudioURL: o.AudioURL,
			SceneID: o.SceneID.String(), SceneTitle: o.SceneTitle, DialogueID: o.DialogueID,
		})
	}

	view := &VerbView{ID: v.ID.String(), Lemma: v.Lemma, Meanings: []MeaningView{}}
	for _, m := range meanings {
		p := progress[m.ID]
		view.Meanings = append(view.Meanings, MeaningView{
			ID: m.ID.String(), MeaningFa: m.MeaningFa, ExplanationFa: m.ExplanationFa,
			PracticePromptFa: m.PracticePromptFa, FallbackExample: m.FallbackExample,
			Examples: nonNil(byMeaning[m.ID]), Seen: p.SeenAt != nil,
			RecognitionCorrect: p.RecognitionCorrect, RecognitionTarget: recognitionTarget,
			SpokenOK: p.SpokenOK, InLeitner: p.LeitnerLevel > 0, Learned: isLearned(p),
		})
	}
	return view, nil
}

type SceneTag struct {
	DialogueID string `json:"dialogue_id"`
	Form       string `json:"form"`
	VerbID     string `json:"verb_id"`
	Lemma      string `json:"lemma"`
	MeaningID  string `json:"meaning_id"`
	MeaningFa  string `json:"meaning_fa"`
	// OtherMeaningCount تعداد بقیه‌ی معناهای این فعل (برای «N معنای دیگر»)
	OtherMeaningCount int `json:"other_meaning_count"`
}

func (s *Service) SceneTags(ctx context.Context, sceneID string) ([]SceneTag, error) {
	const op = "verb.SceneTags"
	sid, err := parseID(op, sceneID)
	if err != nil {
		return nil, err
	}
	occ, err := s.repo.SceneTags(ctx, sid)
	if err != nil {
		return nil, err
	}
	verbs := map[uuid.UUID]postgresverb.Verb{}
	meanings := map[uuid.UUID][]postgresverb.Meaning{}
	out := []SceneTag{}
	for _, o := range occ {
		if o.DialogueID == "" {
			continue
		}
		if _, ok := verbs[o.VerbID]; !ok {
			v, err := s.repo.GetVerb(ctx, o.VerbID)
			if err != nil {
				return nil, err
			}
			ms, err := s.repo.ListMeanings(ctx, o.VerbID)
			if err != nil {
				return nil, err
			}
			verbs[o.VerbID], meanings[o.VerbID] = v, ms
		}
		tag := SceneTag{
			DialogueID: o.DialogueID, Form: o.MatchedForm, VerbID: o.VerbID.String(), Lemma: verbs[o.VerbID].Lemma,
			MeaningID: o.MeaningID.String(), OtherMeaningCount: max(0, len(meanings[o.VerbID])-1),
		}
		for _, m := range meanings[o.VerbID] {
			if m.ID == *o.MeaningID {
				tag.MeaningFa = m.MeaningFa
			}
		}
		out = append(out, tag)
	}
	return out, nil
}

func (s *Service) MarkSeen(ctx context.Context, userID, meaningID string) error {
	const op = "verb.MarkSeen"
	uid, err := parseID(op, userID)
	if err != nil {
		return err
	}
	mid, err := parseID(op, meaningID)
	if err != nil {
		return err
	}
	return s.repo.MarkSeen(ctx, uid, mid)
}

// ---------- آزمون تشخیص ----------

type QuizOption struct {
	MeaningID string `json:"meaning_id"`
	MeaningFa string `json:"meaning_fa"`
}

type QuizQuestion struct {
	MeaningID string       `json:"meaning_id"`
	Sentence  string       `json:"sentence"`
	Form      string       `json:"form"`
	AudioURL  string       `json:"audio_url"`
	Options   []QuizOption `json:"options"`
}

// Quiz برای معناهایی که مثال دارند یک سؤال «این‌جا فعل یعنی چه؟» می‌سازد؛
// گزینه‌های غلط بقیه‌ی معناهای همین فعل‌اند. معناهایی که هنوز به هدف تشخیص
// نرسیده‌اند اول می‌آیند.
func (s *Service) Quiz(ctx context.Context, userID, verbID string) ([]QuizQuestion, error) {
	view, err := s.GetVerb(ctx, userID, verbID)
	if err != nil {
		return nil, err
	}
	if len(view.Meanings) < 2 {
		return []QuizQuestion{}, nil
	}
	candidates := make([]MeaningView, 0, len(view.Meanings))
	for _, m := range view.Meanings {
		if len(m.Examples) > 0 || m.FallbackExample != "" {
			candidates = append(candidates, m)
		}
	}
	rand.Shuffle(len(candidates), func(i, j int) { candidates[i], candidates[j] = candidates[j], candidates[i] })
	sort.SliceStable(candidates, func(i, j int) bool {
		return candidates[i].RecognitionCorrect < recognitionTarget && candidates[j].RecognitionCorrect >= recognitionTarget
	})
	if len(candidates) > quizSize {
		candidates = candidates[:quizSize]
	}

	re := formsRegexp([]string{view.Lemma})
	questions := []QuizQuestion{}
	for _, m := range candidates {
		q := QuizQuestion{MeaningID: m.ID}
		if len(m.Examples) > 0 {
			ex := m.Examples[rand.Intn(len(m.Examples))]
			q.Sentence, q.Form, q.AudioURL = ex.Sentence, ex.Form, ex.AudioURL
		} else {
			q.Sentence = m.FallbackExample
			q.Form = strings.ToLower(re.FindString(m.FallbackExample))
		}

		others := make([]MeaningView, 0, len(view.Meanings)-1)
		for _, o := range view.Meanings {
			if o.ID != m.ID {
				others = append(others, o)
			}
		}
		rand.Shuffle(len(others), func(i, j int) { others[i], others[j] = others[j], others[i] })
		if len(others) > 3 {
			others = others[:3]
		}
		q.Options = append(q.Options, QuizOption{MeaningID: m.ID, MeaningFa: m.MeaningFa})
		for _, o := range others {
			q.Options = append(q.Options, QuizOption{MeaningID: o.ID, MeaningFa: o.MeaningFa})
		}
		rand.Shuffle(len(q.Options), func(i, j int) { q.Options[i], q.Options[j] = q.Options[j], q.Options[i] })
		questions = append(questions, q)
	}
	return questions, nil
}

type AnswerResult struct {
	Correct          bool   `json:"correct"`
	CorrectMeaningFa string `json:"correct_meaning_fa"`
}

func (s *Service) Answer(ctx context.Context, userID, meaningID, chosenMeaningID string) (AnswerResult, error) {
	const op = "verb.Answer"
	uid, err := parseID(op, userID)
	if err != nil {
		return AnswerResult{}, err
	}
	mid, err := parseID(op, meaningID)
	if err != nil {
		return AnswerResult{}, err
	}
	m, err := s.repo.GetMeaning(ctx, mid)
	if err != nil {
		return AnswerResult{}, err
	}
	res := AnswerResult{Correct: meaningID == chosenMeaningID, CorrectMeaningFa: m.MeaningFa}
	if res.Correct {
		err = s.repo.RecordRecognitionCorrect(ctx, uid, mid)
	} else {
		err = s.repo.MarkSeen(ctx, uid, mid)
	}
	return res, err
}

// ---------- تمرین صوتی (فقط با اشتراک) ----------

type SpeakResult struct {
	Transcript     string `json:"transcript"`
	UsedVerb       bool   `json:"used_verb"`
	CorrectMeaning bool   `json:"correct_meaning"`
	Grammatical    bool   `json:"grammatical"`
	FeedbackFa     string `json:"feedback_fa"`
	BetterSentence string `json:"better_sentence"`
	Passed         bool   `json:"passed"`
}

func (s *Service) Speak(ctx context.Context, userID, meaningID, audioPath string) (*SpeakResult, error) {
	const op = "verb.Speak"
	defer func() {
		if audioPath != "" {
			_ = os.Remove(audioPath)
		}
	}()

	uid, err := parseID(op, userID)
	if err != nil {
		return nil, err
	}
	mid, err := parseID(op, meaningID)
	if err != nil {
		return nil, err
	}
	if err := s.access.CheckAllowed(ctx, op, userID); err != nil {
		return nil, err
	}
	m, err := s.repo.GetMeaning(ctx, mid)
	if err != nil {
		return nil, err
	}
	v, err := s.repo.GetVerb(ctx, m.VerbID)
	if err != nil {
		return nil, err
	}

	transcript, err := s.transcriber.TranscribeOnly(ctx, audioPath)
	if err != nil || strings.TrimSpace(transcript) == "" {
		return nil, richerror.New(op).WithErr(err).WithMessage("صدایت واضح شنیده نشد، دوباره امتحان کن").WithKind(richerror.KindInvalid)
	}

	check, err := s.ai.CheckVerbUsage(ctx, v.Lemma, m.MeaningFa, m.PracticePromptFa, transcript)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("بررسی جمله ناموفق بود، دوباره امتحان کن")
	}
	s.access.RecordUsage(ctx, userID, check.Usage.InputTokens, check.Usage.OutputTokens)

	res := &SpeakResult{
		Transcript: transcript, UsedVerb: check.UsedVerb, CorrectMeaning: check.CorrectMeaning,
		Grammatical: check.Grammatical, FeedbackFa: check.FeedbackFa, BetterSentence: check.BetterSentence,
		Passed: check.UsedVerb && check.CorrectMeaning,
	}
	if res.Passed {
		if err := s.repo.MarkSpokenOK(ctx, uid, mid); err != nil {
			return nil, err
		}
	}
	return res, nil
}

// ---------- یادآوری صفحه‌ی خانه ----------

type Pending struct {
	VerbID    string `json:"verb_id"`
	Lemma     string `json:"lemma"`
	MeaningFa string `json:"meaning_fa"`
}

// PendingPractice اولین معنایی که کاربر در درس‌ها دیده ولی هنوز هیچ جواب
// درستی در آزمون تشخیص نداده؛ nil یعنی کاری نمانده (کارت خانه نشان داده نمی‌شود).
func (s *Service) PendingPractice(ctx context.Context, userID string) (*Pending, error) {
	const op = "verb.PendingPractice"
	uid, err := parseID(op, userID)
	if err != nil {
		return nil, err
	}
	verbs, err := s.repo.ListVerbs(ctx, true)
	if err != nil {
		return nil, err
	}
	progress, err := s.repo.UserProgress(ctx, uid)
	if err != nil {
		return nil, err
	}
	for _, v := range verbs {
		meanings, err := s.repo.ListMeanings(ctx, v.ID)
		if err != nil {
			return nil, err
		}
		if len(meanings) < 2 {
			continue
		}
		for _, m := range meanings {
			if p := progress[m.ID]; p.SeenAt != nil && p.RecognitionCorrect == 0 {
				return &Pending{VerbID: v.ID.String(), Lemma: v.Lemma, MeaningFa: m.MeaningFa}, nil
			}
		}
	}
	return nil, nil
}
