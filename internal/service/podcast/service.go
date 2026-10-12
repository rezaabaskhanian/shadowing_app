// Package podcastservice «پادکست»: گفتگوی کوتاه دو مجری درباره‌ی یک موضوع یا
// یکی از صحنه‌های اپ. متن با AI نوشته می‌شود؛ صدا در پس‌زمینه جمله‌به‌جمله با
// TTS (هر مجری یک صدا) ساخته، به یک mp3 وصل و زمان‌بندی هر جمله ذخیره می‌شود
// تا اپ متن را هم‌زمان با پخش نشان دهد.
package podcastservice

import (
	"context"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/audio"
	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	postgrespodcast "shadowing-backend/internal/repository/postgres/podcast"
	aiservice "shadowing-backend/internal/service/ai"
	ttsservice "shadowing-backend/internal/service/tts"

	"github.com/google/uuid"
)

type repository interface {
	List(ctx context.Context, activeOnly bool) ([]postgrespodcast.Podcast, error)
	Get(ctx context.Context, id string) (postgrespodcast.Podcast, error)
	Save(ctx context.Context, p postgrespodcast.Podcast, keepAudio bool) (string, error)
	Delete(ctx context.Context, id string) error
	MarkGenerating(ctx context.Context, id string) (bool, error)
	SetAudioReady(ctx context.Context, id, url string, durationSeconds int, timings map[string][2]int) error
	SetAudioFailed(ctx context.Context, id, msg string) error
	ResetGenerating(ctx context.Context) error
}

type Podcast = postgrespodcast.Podcast
type Line = postgrespodcast.Line

type Service struct {
	repo     repository
	ai       aiservice.Service
	tts      ttsservice.Service
	store    filestore.Store
	settings settingsStore
}

func New(repo repository, ai aiservice.Service, tts ttsservice.Service, store filestore.Store, settings settingsStore) *Service {
	// ساختی که با ری‌استارت سرور نیمه‌کاره ماند، برای همیشه «در حال ساخت» نماند
	// (تک‌instance است، پس هر generating موقع بالا آمدن یعنی ساخت قطع‌شده).
	go func() {
		if err := repo.ResetGenerating(context.Background()); err != nil {
			slog.Warn("podcast: reset stuck generations failed", "err", err)
		}
	}()
	return &Service{repo: repo, ai: ai, tts: tts, store: store, settings: settings}
}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

func (s *Service) List(ctx context.Context) ([]Podcast, error) {
	return s.repo.List(ctx, true)
}

func (s *Service) Get(ctx context.Context, id string) (Podcast, error) {
	const op = "podcast.Get"
	if err := parseID(op, id); err != nil {
		return Podcast{}, err
	}
	p, err := s.repo.Get(ctx, id)
	if err != nil {
		return Podcast{}, err
	}
	if !p.IsActive || p.AudioStatus != "ready" {
		return Podcast{}, richerror.New(op).WithMessage("پادکست پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return p, nil
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Podcast, error) {
	return s.repo.List(ctx, false)
}

func (s *Service) AdminGet(ctx context.Context, id string) (Podcast, error) {
	const op = "podcast.AdminGet"
	if err := parseID(op, id); err != nil {
		return Podcast{}, err
	}
	return s.repo.Get(ctx, id)
}

var validLevels = map[string]bool{"starter": true, "beginner": true, "intermediate": true, "advanced": true}

func sameScript(a, b []Line) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i].Speaker != b[i].Speaker || a[i].Text != b[i].Text || a[i].TranslationFa != b[i].TranslationFa {
			return false
		}
	}
	return true
}

// AdminSave پادکست را ذخیره می‌کند. اگر متن (یا صدای مجری‌ها) عوض شده باشد،
// صدای ساخته‌شده‌ی قبلی باطل می‌شود و باید دوباره ساخته شود.
func (s *Service) AdminSave(ctx context.Context, id string, p Podcast) (Podcast, error) {
	const op = "podcast.AdminSave"
	invalid := func(msg string) (Podcast, error) {
		return Podcast{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	p.Title = strings.TrimSpace(p.Title)
	p.DescriptionFa = strings.TrimSpace(p.DescriptionFa)
	if p.Title == "" {
		return invalid("عنوان پادکست الزامی است")
	}
	if !validLevels[p.Level] {
		p.Level = "beginner"
	}
	if p.Kind != "featured" {
		p.Kind = "lesson"
	}
	if p.SceneID != "" {
		if err := parseID(op, p.SceneID); err != nil {
			return Podcast{}, err
		}
	}
	lines := make([]Line, 0, len(p.Lines))
	for i, l := range p.Lines {
		l.Speaker = strings.TrimSpace(l.Speaker)
		l.Text = strings.TrimSpace(l.Text)
		l.TranslationFa = strings.TrimSpace(l.TranslationFa)
		if l.Text == "" {
			continue
		}
		if l.Speaker == "" {
			return invalid(fmt.Sprintf("گوینده‌ی جمله‌ی %d مشخص نیست", i+1))
		}
		lines = append(lines, l)
	}
	p.Lines = lines
	vocab := make([]postgrespodcast.VocabItem, 0, len(p.Vocabulary))
	for _, v := range p.Vocabulary {
		if v.Word = strings.TrimSpace(v.Word); v.Word != "" {
			v.MeaningFa = strings.TrimSpace(v.MeaningFa)
			vocab = append(vocab, v)
		}
	}
	p.Vocabulary = vocab
	if p.Voices == nil {
		p.Voices = map[string]string{}
	}
	// سرعت/مکثِ صفر یعنی «پیش‌فرضِ سطح» (پادکست‌های قدیمی و درخواست‌های بدون این دو).
	preset := s.LevelPresets()[p.Level]
	if p.SpeechSpeed == 0 {
		p.SpeechSpeed = preset.SpeechSpeed
	}
	p.SpeechSpeed = clampFloat(p.SpeechSpeed, 0.7, 1.2)
	if p.LineGapMs <= 0 {
		p.LineGapMs = preset.LineGapMs
	}
	p.LineGapMs = clampInt(p.LineGapMs, 0, 3000)

	keepAudio := false
	if id != "" {
		if err := parseID(op, id); err != nil {
			return Podcast{}, err
		}
		old, err := s.repo.Get(ctx, id)
		if err != nil {
			return Podcast{}, err
		}
		if old.AudioStatus == "generating" {
			return invalid("صدای این پادکست در حال ساخت است؛ چند دقیقه بعد ذخیره کن")
		}
		keepAudio = old.AudioStatus == "ready" && sameScript(old.Lines, p.Lines) && sameVoices(old.Voices, p.Voices) &&
			old.SpeechSpeed == p.SpeechSpeed && old.LineGapMs == p.LineGapMs
		if p.IsActive && !keepAudio {
			p.IsActive = false // بدون صدای آماده نمی‌شود منتشر کرد
		}
	} else {
		p.IsActive = false
	}
	if p.IsActive && len(p.Lines) == 0 {
		return invalid("پادکست بدون متن قابل انتشار نیست")
	}

	p.ID = id
	savedID, err := s.repo.Save(ctx, p, keepAudio)
	if err != nil {
		return Podcast{}, err
	}
	return s.repo.Get(ctx, savedID)
}

func sameVoices(a, b map[string]string) bool {
	if len(a) != len(b) {
		return false
	}
	for k, v := range a {
		if b[k] != v {
			return false
		}
	}
	return true
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "podcast.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

// ScriptRequest ورودیِ نوشتنِ متن: موضوع و/یا زمینه (صحنه‌ی اپ یا یکی از
// فایل‌های کتابخانه‌ی محتوا)، سطح و تنظیماتِ سختی (پیش‌فرضِ سطح، قابل تغییر).
type ScriptRequest struct {
	Topic               string `json:"topic"`
	Scene               string `json:"scene"`
	Source              string `json:"source"`
	Level               string `json:"level"`
	MaxWordsPerSentence int    `json:"max_words_per_sentence"`
	MinLines            int    `json:"min_lines"`
	MaxLines            int    `json:"max_lines"`
	NewVocab            int    `json:"new_vocab"`
	Kind                string `json:"kind"`
}

// maxSourceChars سقفِ متنِ منبع که به AI فرستاده می‌شود (هزینه و طولِ ورودی).
const maxSourceChars = 12000

// AdminGenerateScript متن پادکست را با AI می‌نویسد (چیزی ذخیره نمی‌کند).
func (s *Service) AdminGenerateScript(ctx context.Context, req ScriptRequest) (aiservice.PodcastScript, error) {
	const op = "podcast.AdminGenerateScript"
	req.Source = strings.TrimSpace(req.Source)
	if len(req.Source) > maxSourceChars {
		req.Source = req.Source[:maxSourceChars]
	}
	if strings.TrimSpace(req.Topic) == "" && strings.TrimSpace(req.Scene) == "" && req.Source == "" {
		return aiservice.PodcastScript{}, richerror.New(op).WithMessage("موضوع بنویس، یا یک صحنه یا منبع انتخاب کن").WithKind(richerror.KindInvalid)
	}
	if !validLevels[req.Level] {
		req.Level = "beginner"
	}
	preset := s.LevelPresets()[req.Level]
	if req.MaxWordsPerSentence != 0 || req.MinLines != 0 || req.MaxLines != 0 {
		preset.MaxWordsPerSentence = req.MaxWordsPerSentence
		preset.MinLines, preset.MaxLines = req.MinLines, req.MaxLines
	}
	if req.NewVocab != 0 {
		preset.NewVocab = req.NewVocab
	}
	preset = preset.normalize()
	res, err := s.ai.GeneratePodcastScript(ctx, aiservice.PodcastScriptInput{
		Topic:               req.Topic,
		Scene:               req.Scene,
		Source:              req.Source,
		Level:               req.Level,
		MaxWordsPerSentence: preset.MaxWordsPerSentence,
		MinLines:            preset.MinLines,
		MaxLines:            preset.MaxLines,
		NewVocab:            preset.NewVocab,
		Featured:            req.Kind == "featured",
	})
	if err != nil {
		return res, richerror.New(op).WithErr(err).WithMessage("نوشتن متن پادکست ناموفق بود، دوباره امتحان کن")
	}
	return res, nil
}

// AdminGenerateAudio ساخت صدای پادکست را در پس‌زمینه شروع می‌کند و همان لحظه
// برمی‌گردد (چند ده جمله TTS بیشتر از سقف زمان یک درخواست HTTP طول می‌کشد).
// پنل وضعیت را با AdminGet دنبال می‌کند (audio_status).
func (s *Service) AdminGenerateAudio(ctx context.Context, id string) (Podcast, error) {
	const op = "podcast.AdminGenerateAudio"
	if !s.tts.Enabled() {
		return Podcast{}, richerror.New(op).WithMessage(s.tts.MissingKeyMessage()).WithKind(richerror.KindInvalid)
	}
	p, err := s.AdminGet(ctx, id)
	if err != nil {
		return Podcast{}, err
	}
	if len(p.Lines) == 0 {
		return Podcast{}, richerror.New(op).WithMessage("اول متن پادکست را بساز و ذخیره کن").WithKind(richerror.KindInvalid)
	}
	ok, err := s.repo.MarkGenerating(ctx, id)
	if err != nil {
		return Podcast{}, err
	}
	if !ok {
		return Podcast{}, richerror.New(op).WithMessage("صدای این پادکست همین حالا در حال ساخت است").WithKind(richerror.KindInvalid)
	}

	go s.buildAudio(p)

	p.AudioStatus = "generating"
	p.AudioError = ""
	return p, nil
}

const (
	podcastSampleRate = 24000
	// مکث کوتاه بین جمله‌ها تا گفتگو طبیعی و نفس‌دار شنیده شود.
	podcastGapMs = 350
	// سقف کل ساخت (TTS همه‌ی جمله‌ها + تبدیل‌ها).
	podcastBuildTimeout = 15 * time.Minute
)

// buildAudio جمله‌ها را یکی‌یکی با صدای مجری خودش می‌سازد، به PCM یکسان تبدیل،
// با مکث کوتاه پشت هم می‌چیند و یک mp3 با بیت‌ریت ثابت می‌سازد. زمان شروع/پایان
// هر جمله از طول PCM دقیق حساب می‌شود.
func (s *Service) buildAudio(p Podcast) {
	ctx, cancel := context.WithTimeout(context.Background(), podcastBuildTimeout)
	defer cancel()

	fail := func(msg string, err error) {
		slog.Error("podcast: audio build failed", "podcast", p.ID, "err", err)
		if err != nil {
			msg = msg + ": " + err.Error()
		}
		_ = s.repo.SetAudioFailed(context.Background(), p.ID, msg)
	}

	voices := s.voicesFor(ctx, p)
	bytesPerMs := podcastSampleRate * 2 / 1000
	gapMs := p.LineGapMs
	if gapMs <= 0 {
		gapMs = podcastGapMs
	}
	gap := make([]byte, gapMs*bytesPerMs)

	var pcm []byte
	timings := make(map[string][2]int, len(p.Lines))
	for i, l := range p.Lines {
		a, err := s.tts.GenerateSpeech(ctx, l.Text, voices[l.Speaker], p.SpeechSpeed)
		if err != nil {
			fail(fmt.Sprintf("ساخت صدای جمله‌ی %d ناموفق بود", i+1), err)
			return
		}
		seg, err := audio.DecodeToPCM16(ctx, a.Data, podcastSampleRate)
		if err != nil {
			fail(fmt.Sprintf("تبدیل صدای جمله‌ی %d ناموفق بود", i+1), err)
			return
		}
		if i > 0 {
			pcm = append(pcm, gap...)
		}
		start := len(pcm) / bytesPerMs
		pcm = append(pcm, seg...)
		timings[l.ID] = [2]int{start, len(pcm) / bytesPerMs}
	}

	mp3, err := audio.EncodePCM16ToMP3(ctx, pcm, podcastSampleRate)
	if err != nil {
		fail("ساخت فایل نهایی پادکست ناموفق بود", err)
		return
	}
	url, err := s.store.Save(ctx, "podcasts/"+uuid.NewString()+".mp3", mp3, "audio/mpeg")
	if err != nil {
		fail("ذخیره‌ی فایل پادکست ناموفق بود", err)
		return
	}
	durationSeconds := len(pcm) / bytesPerMs / 1000
	if err := s.repo.SetAudioReady(context.Background(), p.ID, url, durationSeconds, timings); err != nil {
		fail("ثبت صدای پادکست ناموفق بود", err)
		return
	}
	slog.Info("podcast: audio ready", "podcast", p.ID, "lines", len(p.Lines), "seconds", durationSeconds)
}

// voicesFor صدای هر گوینده: اول انتخاب ادمین، وگرنه مجری اول (یا هر گوینده‌ی
// زوجی) صدای زن و بقیه صدای مرد از لیست صداهای provider فعال.
func (s *Service) voicesFor(ctx context.Context, p Podcast) map[string]string {
	out := map[string]string{}
	var female, male string
	if list, err := s.tts.ListVoices(ctx); err == nil {
		for _, v := range list {
			switch strings.ToLower(v.Gender) {
			case "female":
				if female == "" {
					female = v.VoiceID
				}
			case "male":
				if male == "" {
					male = v.VoiceID
				}
			}
		}
	}
	order := 0
	for _, l := range p.Lines {
		if _, ok := out[l.Speaker]; ok {
			continue
		}
		if v := strings.TrimSpace(p.Voices[l.Speaker]); v != "" {
			out[l.Speaker] = v
		} else if l.Speaker == aiservice.PodcastHosts[0] || (l.Speaker != aiservice.PodcastHosts[1] && order%2 == 0) {
			out[l.Speaker] = female
		} else {
			out[l.Speaker] = male
		}
		order++
	}
	return out
}
