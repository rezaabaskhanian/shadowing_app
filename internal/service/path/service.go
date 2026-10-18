// Package pathservice «مسیر آموزشی» اختیاری: هر سطح یک مسیر چندهفته‌ای که
// محتوای موجود (صحنه، پادکست، مرور لایتنر، ...) را با یک ترتیب و هدف روشن کنار
// هم می‌گذارد و هر هفته با یک Checkpoint تمام می‌شود.
//
// قاعده‌ها (از تصمیم‌های محصول، ببینید starter_8_week_path.md):
//   - جلسه‌ها با انجام دادن باز می‌شوند، نه با گذشت روز؛ «عقب افتادن» وجود ندارد.
//   - Checkpoint هیچ‌وقت راه را نمی‌بندد: با هر نمره‌ای هفته‌ی بعد باز می‌شود و
//     برای مهارت‌های ضعیف مرور پیشنهاد می‌شود.
//   - صحنه‌ای که کاربر هر جای اپ تمام کرده، در مسیر هم تمام‌شده حساب می‌شود.
package pathservice

import (
	"context"
	"encoding/json"
	"fmt"
	"sort"
	"strings"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	postgrespath "shadowing-backend/internal/repository/postgres/path"
	ttsservice "shadowing-backend/internal/service/tts"

	"github.com/google/uuid"
)

type repository interface {
	ListPaths(ctx context.Context, activeOnly bool) ([]postgrespath.Path, error)
	GetPathByLevel(ctx context.Context, level string) (postgrespath.Path, error)
	GetWeek(ctx context.Context, id string) (postgrespath.Week, error)
	UpsertPath(ctx context.Context, p postgrespath.Path) (string, error)
	SetCheckpoint(ctx context.Context, weekID string, checkpoint json.RawMessage) error
	SetActive(ctx context.Context, level string, active bool) error
	SaveSelfIntro(ctx context.Context, userID, level string, in postgrespath.SelfIntro) error
	SelfIntros(ctx context.Context, userID, level string) (map[string]postgrespath.SelfIntro, error)
	DoneItems(ctx context.Context, userID string, weekIDs []string) (map[string]map[string]bool, error)
	CompletedScenes(ctx context.Context, userID string, sceneIDs []string) (map[string]bool, error)
	MarkItem(ctx context.Context, userID, weekID, key string) error
	SaveCheckpointResult(ctx context.Context, userID, weekID string, scores map[string]int, total int) error
	BestCheckpoints(ctx context.Context, userID string, weekIDs []string) (map[string]int, error)
}

type Path = postgrespath.Path
type Week = postgrespath.Week
type Session = postgrespath.Session
type Item = postgrespath.Item

// انواع قدم. scene/podcast/video_clip/speaking_topic به ref_id نیاز دارند.
// habit_mission = ماموریت «از حفظ بگو» (بخش عادت زبانی)؛ dictation = دیکته و
// نوشتن از روی فارسی با جمله‌های صحنه‌های همان هفته؛ self_intro = ضبط «قبل»
// (هفته‌ی اول) یا «بعد» و مقایسه (هفته‌ی آخر) — کلیدی که با after تمام شود «بعد» است.
const (
	KindScene         = "scene"
	KindPodcast       = "podcast"
	KindVideoClip     = "video_clip"
	KindSpeakingTopic = "speaking_topic"
	KindLeitner       = "leitner_review"
	KindWeakLines     = "weak_lines"
	KindCheckpoint    = "checkpoint"
	KindHabitMission  = "habit_mission"
	KindDictation     = "dictation"
	KindSelfIntro     = "self_intro"
)

var validKinds = map[string]bool{
	KindScene: true, KindPodcast: true, KindVideoClip: true, KindSpeakingTopic: true,
	KindLeitner: true, KindWeakLines: true, KindCheckpoint: true, KindHabitMission: true, KindDictation: true, KindSelfIntro: true,
}

var needsRef = map[string]bool{KindScene: true, KindPodcast: true, KindVideoClip: true, KindSpeakingTopic: true}

// مهارت‌های Checkpoint؛ نمره‌ی کل میانگین همین‌هاست (هر کدام که فرستاده شده).
var skills = []string{"vocabulary", "grammar", "listening", "speaking", "real_life"}

// checkpointSpeechSpeed کمی کندتر از عادی، مثل پادکست‌های starter.
const checkpointSpeechSpeed = 0.85

type Service struct {
	repo  repository
	tts   ttsservice.Service
	store filestore.Store
}

func New(repo repository, tts ttsservice.Service, store filestore.Store) *Service {
	return &Service{repo: repo, tts: tts, store: store}
}

func invalid(op richerror.Op, msg string) error {
	return richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

// NextStep اولین جلسه‌ی بازِ تمام‌نشده — برای کارت «جلسه‌ی بعدی من» در خانه.
type NextStep struct {
	WeekID       string `json:"week_id"`
	WeekPosition int    `json:"week_position"`
	WeekTitleFa  string `json:"week_title_fa"`
	SessionNo    int    `json:"session_no"`
	SessionTitle string `json:"session_title_fa"`
	IsCheckpoint bool   `json:"is_checkpoint"`
}

type PathSummary struct {
	Path
	WeeksTotal int       `json:"weeks_total"`
	WeeksDone  int       `json:"weeks_done"`
	Started    bool      `json:"started"`
	Next       *NextStep `json:"next,omitempty"`
}

// Paths همه‌ی مسیرهای فعال با خلاصه‌ی پیشرفت کاربر.
func (s *Service) Paths(ctx context.Context, userID string) ([]PathSummary, error) {
	const op = "path.Paths"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	paths, err := s.repo.ListPaths(ctx, true)
	if err != nil {
		return nil, err
	}
	out := make([]PathSummary, 0, len(paths))
	for _, p := range paths {
		full, err := s.Path(ctx, userID, p.Level)
		if err != nil {
			return nil, err
		}
		out = append(out, summarize(full))
	}
	return out, nil
}

func summarize(p Path) PathSummary {
	sum := PathSummary{Path: p, WeeksTotal: len(p.Weeks)}
	sum.Weeks = nil
	for _, w := range p.Weeks {
		if w.Done {
			sum.WeeksDone++
		}
		for _, se := range w.Sessions {
			for _, it := range se.Items {
				if it.Done {
					sum.Started = true
				}
			}
			if sum.Next == nil && se.Unlocked && !se.Done {
				sum.Next = &NextStep{
					WeekID: w.ID, WeekPosition: w.Position, WeekTitleFa: w.TitleFa,
					SessionNo: se.No, SessionTitle: se.TitleFa, IsCheckpoint: isCheckpointSession(se),
				}
			}
		}
	}
	return sum
}

func isCheckpointSession(se Session) bool {
	for _, it := range se.Items {
		if it.Kind == KindCheckpoint {
			return true
		}
	}
	return false
}

// Path یک مسیر با همه‌ی هفته‌ها و جلسه‌ها و وضعیت هر قدم برای کاربر. محتوای
// Checkpoint اینجا فرستاده نمی‌شود (جدا با Checkpoint).
func (s *Service) Path(ctx context.Context, userID, level string) (Path, error) {
	const op = "path.Path"
	if err := parseID(op, userID); err != nil {
		return Path{}, err
	}
	p, err := s.repo.GetPathByLevel(ctx, strings.TrimSpace(level))
	if err != nil {
		return Path{}, err
	}
	if !p.IsActive {
		return Path{}, richerror.New(op).WithMessage("مسیر پیدا نشد").WithKind(richerror.KindNotFound)
	}

	weekIDs := make([]string, 0, len(p.Weeks))
	sceneIDs := make([]string, 0)
	for _, w := range p.Weeks {
		weekIDs = append(weekIDs, w.ID)
		for _, se := range w.Sessions {
			for _, it := range se.Items {
				if it.Kind == KindScene && it.RefID != "" {
					sceneIDs = append(sceneIDs, it.RefID)
				}
			}
		}
	}
	done, err := s.repo.DoneItems(ctx, userID, weekIDs)
	if err != nil {
		return Path{}, err
	}
	scenes, err := s.repo.CompletedScenes(ctx, userID, sceneIDs)
	if err != nil {
		return Path{}, err
	}
	best, err := s.repo.BestCheckpoints(ctx, userID, weekIDs)
	if err != nil {
		return Path{}, err
	}
	applyProgress(&p, done, scenes, best)
	return p, nil
}

// applyProgress وضعیت done/unlocked همه‌ی قدم‌ها، جلسه‌ها و هفته‌ها را پر می‌کند.
func applyProgress(p *Path, done map[string]map[string]bool, scenes map[string]bool, best map[string]int) {
	prevWeekDone := true
	for wi := range p.Weeks {
		w := &p.Weeks[wi]
		w.Checkpoint = nil
		if score, ok := best[w.ID]; ok {
			sc := score
			w.BestScore = &sc
			w.CheckpointDone = true
		}
		w.Unlocked = prevWeekDone
		prevSessionDone := true
		hasCheckpoint := false
		allSessionsDone := true
		for si := range w.Sessions {
			se := &w.Sessions[si]
			se.Done = true
			for ii := range se.Items {
				it := &se.Items[ii]
				switch it.Kind {
				case KindCheckpoint:
					hasCheckpoint = true
					it.Done = w.CheckpointDone
				case KindScene:
					it.Done = scenes[it.RefID] || done[w.ID][it.Key]
				default:
					it.Done = done[w.ID][it.Key]
				}
				if it.Required && !it.Done {
					se.Done = false
				}
			}
			se.Unlocked = w.Unlocked && prevSessionDone
			prevSessionDone = se.Done
			if !se.Done {
				allSessionsDone = false
			}
		}
		if hasCheckpoint {
			w.Done = w.CheckpointDone
		} else {
			w.Done = allSessionsDone && len(w.Sessions) > 0
		}
		prevWeekDone = w.Done
	}
}

// CompleteItem یک قدم را برای کاربر تمام‌شده ثبت می‌کند (بعد از برگشتن از صفحه‌ی
// آن قدم). Checkpoint از این راه ثبت نمی‌شود؛ با SubmitCheckpoint.
func (s *Service) CompleteItem(ctx context.Context, userID, weekID, key string) error {
	const op = "path.CompleteItem"
	if err := parseID(op, userID); err != nil {
		return err
	}
	if err := parseID(op, weekID); err != nil {
		return err
	}
	w, err := s.repo.GetWeek(ctx, weekID)
	if err != nil {
		return err
	}
	for _, se := range w.Sessions {
		for _, it := range se.Items {
			if it.Key != key {
				continue
			}
			if it.Kind == KindCheckpoint {
				return invalid(op, "Checkpoint با ارسال نتیجه ثبت می‌شود")
			}
			return s.repo.MarkItem(ctx, userID, weekID, key)
		}
	}
	return richerror.New(op).WithMessage("قدم پیدا نشد").WithKind(richerror.KindNotFound)
}

// Checkpoint محتوای آزمون یک هفته (شامل جواب‌ها؛ نمره‌دهی سمت اپ است چون
// آزمون پرریسک نیست و بخش گفتاری با ارزیاب شدوئینگ نمره می‌گیرد).
func (s *Service) Checkpoint(ctx context.Context, weekID string) (json.RawMessage, error) {
	const op = "path.Checkpoint"
	if err := parseID(op, weekID); err != nil {
		return nil, err
	}
	w, err := s.repo.GetWeek(ctx, weekID)
	if err != nil {
		return nil, err
	}
	if len(w.Checkpoint) == 0 || string(w.Checkpoint) == "{}" {
		return nil, richerror.New(op).WithMessage("این هفته Checkpoint ندارد").WithKind(richerror.KindNotFound)
	}
	return w.Checkpoint, nil
}

type CheckpointResult struct {
	Total      int            `json:"total"`
	Scores     map[string]int `json:"scores"`
	Action     string         `json:"action"`
	LabelFa    string         `json:"label_fa"`
	WeakSkills []string       `json:"weak_skills"`
}

// weakSkillThreshold زیر این نمره، برای آن مهارت مرور پیشنهاد می‌شود.
const weakSkillThreshold = 60

// SubmitCheckpoint نتیجه‌ی آزمون را ثبت می‌کند. نمره‌ی کل میانگین مهارت‌هایی است
// که فرستاده شده؛ با هر نمره‌ای هفته‌ی بعد باز می‌شود.
func (s *Service) SubmitCheckpoint(ctx context.Context, userID, weekID string, scores map[string]int) (CheckpointResult, error) {
	const op = "path.SubmitCheckpoint"
	if err := parseID(op, userID); err != nil {
		return CheckpointResult{}, err
	}
	if err := parseID(op, weekID); err != nil {
		return CheckpointResult{}, err
	}
	if _, err := s.repo.GetWeek(ctx, weekID); err != nil {
		return CheckpointResult{}, err
	}
	res := CheckpointResult{Scores: map[string]int{}, WeakSkills: []string{}}
	sum, n := 0, 0
	for _, sk := range skills {
		v, ok := scores[sk]
		if !ok {
			continue
		}
		if v < 0 || v > 100 {
			return CheckpointResult{}, invalid(op, fmt.Sprintf("نمره‌ی %s باید بین ۰ و ۱۰۰ باشد", sk))
		}
		res.Scores[sk] = v
		sum += v
		n++
		if v < weakSkillThreshold {
			res.WeakSkills = append(res.WeakSkills, sk)
		}
	}
	if n == 0 {
		return CheckpointResult{}, invalid(op, "هیچ نمره‌ای فرستاده نشده")
	}
	res.Total = (sum + n/2) / n
	switch {
	case res.Total >= 80:
		res.Action, res.LabelFa = "next_week", "عالی! آماده‌ی هفته‌ی بعدی"
	case res.Total >= 50:
		res.Action, res.LabelFa = "next_week_with_review", "خوب بود! هفته‌ی بعد باز شد. چند تمرین مرور هم پیشنهاد می‌کنیم"
	default:
		res.Action, res.LabelFa = "next_week_with_review", "هفته‌ی بعد باز است، ولی اول این مرورها را پیشنهاد می‌کنیم"
	}
	if err := s.repo.SaveCheckpointResult(ctx, userID, weekID, res.Scores, res.Total); err != nil {
		return CheckpointResult{}, err
	}
	return res, nil
}

// ---------- ادمین ----------

func (s *Service) AdminPaths(ctx context.Context) ([]Path, error) {
	return s.repo.ListPaths(ctx, false)
}

func (s *Service) AdminPath(ctx context.Context, level string) (Path, error) {
	return s.repo.GetPathByLevel(ctx, strings.TrimSpace(level))
}

// AdminSetActive مسیر یک سطح را در اپ نشان می‌دهد یا پنهان می‌کند.
func (s *Service) AdminSetActive(ctx context.Context, level string, active bool) error {
	return s.repo.SetActive(ctx, strings.TrimSpace(level), active)
}

// AdminSavePath کل مسیر یک سطح را (از JSON) ذخیره می‌کند. کلید قدم‌هایی که کلید
// ندارند ساخته می‌شود؛ کلید ثابت می‌ماند تا پیشرفت کاربرها بعد از ویرایش بماند.
func (s *Service) AdminSavePath(ctx context.Context, p Path) (Path, error) {
	const op = "path.AdminSavePath"
	p.Level = strings.TrimSpace(p.Level)
	if p.Level == "" || strings.TrimSpace(p.TitleFa) == "" {
		return Path{}, invalid(op, "level و title_fa الزامی است")
	}
	sort.SliceStable(p.Weeks, func(i, j int) bool { return p.Weeks[i].Position < p.Weeks[j].Position })
	seenPos := map[int]bool{}
	for wi := range p.Weeks {
		w := &p.Weeks[wi]
		if w.Position < 1 || seenPos[w.Position] {
			return Path{}, invalid(op, fmt.Sprintf("position هفته‌ها باید از ۱ و یکتا باشد (%d)", w.Position))
		}
		seenPos[w.Position] = true
		if strings.TrimSpace(w.TitleFa) == "" {
			return Path{}, invalid(op, fmt.Sprintf("هفته‌ی %d عنوان ندارد", w.Position))
		}
		if w.CanDo == nil {
			w.CanDo = []string{}
		}
		if len(w.Checkpoint) > 0 && !json.Valid(w.Checkpoint) {
			return Path{}, invalid(op, fmt.Sprintf("Checkpoint هفته‌ی %d JSON معتبر نیست", w.Position))
		}
		seenKey := map[string]bool{}
		for si := range w.Sessions {
			se := &w.Sessions[si]
			if se.No == 0 {
				se.No = si + 1
			}
			for ii := range se.Items {
				it := &se.Items[ii]
				if !validKinds[it.Kind] {
					return Path{}, invalid(op, fmt.Sprintf("هفته‌ی %d: نوع قدم نامعتبر %q", w.Position, it.Kind))
				}
				if needsRef[it.Kind] {
					if _, err := uuid.Parse(it.RefID); err != nil {
						return Path{}, invalid(op, fmt.Sprintf("هفته‌ی %d جلسه‌ی %d: ref_id برای %s لازم است", w.Position, se.No, it.Kind))
					}
				}
				if it.Key == "" {
					it.Key = fmt.Sprintf("s%d-%s-%d", se.No, it.Kind, ii+1)
				}
				if seenKey[it.Key] {
					return Path{}, invalid(op, fmt.Sprintf("هفته‌ی %d: کلید تکراری %q", w.Position, it.Key))
				}
				seenKey[it.Key] = true
				it.Done = false
			}
			se.Done, se.Unlocked = false, false
		}
	}
	if _, err := s.repo.UpsertPath(ctx, p); err != nil {
		return Path{}, err
	}
	return s.repo.GetPathByLevel(ctx, p.Level)
}

// AdminGenerateCheckpointAudio برای خط‌های بی‌صدای دیالوگ شنیداریِ Checkpoint
// همه‌ی هفته‌های یک مسیر صدا می‌سازد. voices گوینده‌ی هر خط (مثلاً A/B) را به
// صدای TTS نگاشت می‌کند. خط‌هایی که audio_url دارند دست نمی‌خورند.
func (s *Service) AdminGenerateCheckpointAudio(ctx context.Context, level string, voices map[string]string) (int, error) {
	const op = "path.AdminGenerateCheckpointAudio"
	if !s.tts.Enabled() {
		return 0, invalid(op, s.tts.MissingKeyMessage())
	}
	p, err := s.repo.GetPathByLevel(ctx, strings.TrimSpace(level))
	if err != nil {
		return 0, err
	}
	made := 0
	for _, w := range p.Weeks {
		if len(w.Checkpoint) == 0 {
			continue
		}
		var cp map[string]any
		if err := json.Unmarshal(w.Checkpoint, &cp); err != nil {
			return made, richerror.New(op).WithErr(err).WithMessage(fmt.Sprintf("Checkpoint هفته‌ی %d خوانده نشد", w.Position))
		}
		listening, _ := cp["listening"].(map[string]any)
		lines, _ := listening["dialogue"].([]any)
		changed := false
		for _, raw := range lines {
			line, _ := raw.(map[string]any)
			text, _ := line["text"].(string)
			if url, _ := line["audio_url"].(string); url != "" || strings.TrimSpace(text) == "" {
				continue
			}
			speaker, _ := line["speaker"].(string)
			audio, err := s.tts.GenerateSpeech(ctx, text, voices[speaker], checkpointSpeechSpeed)
			if err != nil {
				if changed {
					_ = s.saveCheckpoint(ctx, w.ID, cp)
				}
				return made, richerror.New(op).WithErr(err).WithMessage("ساخت صدای «" + text + "» ناموفق بود: " + err.Error())
			}
			url, err := s.store.Save(ctx, "path/"+uuid.NewString()+audio.Ext, audio.Data, audio.ContentType)
			if err != nil {
				return made, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی فایل صدا")
			}
			line["audio_url"] = url
			changed = true
			made++
		}
		if changed {
			if err := s.saveCheckpoint(ctx, w.ID, cp); err != nil {
				return made, err
			}
		}
	}
	return made, nil
}

func (s *Service) saveCheckpoint(ctx context.Context, weekID string, cp map[string]any) error {
	b, err := json.Marshal(cp)
	if err != nil {
		return err
	}
	return s.repo.SetCheckpoint(ctx, weekID, b)
}

type SelfIntro = postgrespath.SelfIntro

// maxSelfIntroSeconds سقف طول ضبط «قبل و بعد».
const maxSelfIntroSeconds = 120

var selfIntroStages = map[string]bool{"before": true, "after": true}

// SaveSelfIntro متن رونویسی‌شده‌ی ضبط «قبل» یا «بعد» را با آمارش ذخیره می‌کند.
// تعداد کلمه‌ها همین‌جا از روی متن شمرده می‌شود، نه از روی ورودی اپ.
func (s *Service) SaveSelfIntro(ctx context.Context, userID, level, stage, transcript string, durationSeconds int) (map[string]SelfIntro, error) {
	const op = "path.SaveSelfIntro"
	level = strings.TrimSpace(level)
	if !selfIntroStages[stage] {
		return nil, invalid(op, "مرحله باید before یا after باشد")
	}
	if _, err := s.repo.GetPathByLevel(ctx, level); err != nil {
		return nil, err
	}
	transcript = strings.TrimSpace(transcript)
	if len([]rune(transcript)) > 3000 {
		return nil, invalid(op, "متن خیلی طولانی است")
	}
	durationSeconds = min(max(durationSeconds, 0), maxSelfIntroSeconds)
	words, unique := countWords(transcript)
	if err := s.repo.SaveSelfIntro(ctx, userID, level, SelfIntro{
		Stage: stage, Transcript: transcript, DurationSeconds: durationSeconds, WordCount: words, UniqueWords: unique,
	}); err != nil {
		return nil, err
	}
	return s.repo.SelfIntros(ctx, userID, level)
}

func (s *Service) SelfIntros(ctx context.Context, userID, level string) (map[string]SelfIntro, error) {
	return s.repo.SelfIntros(ctx, userID, strings.TrimSpace(level))
}

// countWords کلمه‌های انگلیسی متن و تعداد کلمه‌های متفاوت (بدون حساسیت به حروف).
func countWords(text string) (total, unique int) {
	seen := map[string]bool{}
	for _, w := range strings.FieldsFunc(strings.ToLower(text), func(r rune) bool {
		return !(r >= 'a' && r <= 'z' || r >= '0' && r <= '9' || r == '\'')
	}) {
		w = strings.Trim(w, "'")
		if w == "" {
			continue
		}
		total++
		seen[w] = true
	}
	return total, len(seen)
}
