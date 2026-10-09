// Package videoclipservice «تمرین با ویدیو»: کلیپ کوتاه (ساخته‌شده با Google
// Flow یا تکه‌ای از فیلم‌های معروف) با دیالوگ‌های زمان‌بندی‌شده. کاربر کلیپ را
// می‌بیند، به سؤال‌های فهم جواب می‌دهد، یک شخصیت را انتخاب می‌کند و سر نوبت
// آن شخصیت (که صدای ویدیو قطع می‌شود) جای او حرف می‌زند. نمره‌ی تلفظ هر خط
// با همان ارزیاب شدوئینگ (/v1/shadowing/evaluate با target_text) گرفته می‌شود؛
// اینجا فقط کلیپ‌ها، ابزارهای ادمین و ثبت نتیجه است.
package videoclipservice

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"shadowing-backend/internal/pkg/audio"
	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	postgresvideoclip "shadowing-backend/internal/repository/postgres/videoclip"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

type repository interface {
	ListAll(ctx context.Context) ([]postgresvideoclip.UserClip, error)
	ListActiveForUser(ctx context.Context, userID string) ([]postgresvideoclip.UserClip, error)
	Get(ctx context.Context, id string) (postgresvideoclip.Clip, error)
	Save(ctx context.Context, c postgresvideoclip.Clip) (string, error)
	Delete(ctx context.Context, id string) error
	InsertAttempt(ctx context.Context, userID, clipID, speaker string, score int) error
}

// segmentTranscriber همان GroqClient — رونویسیِ تکه‌تکه با زمان‌بندی.
type segmentTranscriber interface {
	Enabled() bool
	TranscribeSegments(ctx context.Context, audioPath string) ([]speecheval.Segment, error)
}

type Clip = postgresvideoclip.Clip
type UserClip = postgresvideoclip.UserClip
type Line = postgresvideoclip.Line
type Question = postgresvideoclip.Question

type Service struct {
	repo  repository
	ai    aiservice.Service
	store filestore.Store
	groq  segmentTranscriber
}

func New(repo repository, ai aiservice.Service, store filestore.Store, groq segmentTranscriber) *Service {
	return &Service{repo: repo, ai: ai, store: store, groq: groq}
}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

func (s *Service) ListClips(ctx context.Context, userID string) ([]UserClip, error) {
	const op = "videoclip.ListClips"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	return s.repo.ListActiveForUser(ctx, userID)
}

// GetClip کلیپ با خطوطش برای اپ؛ کلیپ غیرفعال برای کاربر پیدا نمی‌شود.
func (s *Service) GetClip(ctx context.Context, id string) (Clip, error) {
	const op = "videoclip.GetClip"
	if err := parseID(op, id); err != nil {
		return Clip{}, err
	}
	c, err := s.repo.Get(ctx, id)
	if err != nil {
		return Clip{}, err
	}
	if !c.IsActive {
		return Clip{}, richerror.New(op).WithMessage("کلیپ پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return c, nil
}

// RecordAttempt نتیجه‌ی یک اجرا (میانگین نمره‌ی تلفظ خطوط شخصیت انتخابی) را ثبت می‌کند.
func (s *Service) RecordAttempt(ctx context.Context, userID, clipID, speaker string, score int) error {
	const op = "videoclip.RecordAttempt"
	if err := parseID(op, userID); err != nil {
		return err
	}
	if err := parseID(op, clipID); err != nil {
		return err
	}
	speaker = strings.TrimSpace(speaker)
	if speaker == "" {
		return richerror.New(op).WithMessage("شخصیت مشخص نیست").WithKind(richerror.KindInvalid)
	}
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	return s.repo.InsertAttempt(ctx, userID, clipID, speaker, score)
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]UserClip, error) {
	return s.repo.ListAll(ctx)
}

func (s *Service) AdminGet(ctx context.Context, id string) (Clip, error) {
	const op = "videoclip.AdminGet"
	if err := parseID(op, id); err != nil {
		return Clip{}, err
	}
	return s.repo.Get(ctx, id)
}

var (
	validLevels  = map[string]bool{"beginner": true, "intermediate": true, "advanced": true}
	validSources = map[string]bool{"flow": true, "movie": true}
)

// AdminSave کلیپ و خطوطش را اعتبارسنجی و ذخیره می‌کند؛ کلیپ با خطوطش برمی‌گردد.
func (s *Service) AdminSave(ctx context.Context, id string, c Clip) (Clip, error) {
	const op = "videoclip.AdminSave"
	invalid := func(msg string) (Clip, error) {
		return Clip{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}

	c.Title = strings.TrimSpace(c.Title)
	c.DescriptionFa = strings.TrimSpace(c.DescriptionFa)
	if c.Title == "" {
		return invalid("عنوان کلیپ الزامی است")
	}
	if !validSources[c.Source] {
		c.Source = "flow"
	}
	if !validLevels[c.Level] {
		c.Level = "beginner"
	}

	lines := make([]Line, 0, len(c.Lines))
	for i, l := range c.Lines {
		l.Speaker = strings.TrimSpace(l.Speaker)
		l.Text = strings.TrimSpace(l.Text)
		l.TranslationFa = strings.TrimSpace(l.TranslationFa)
		if l.Text == "" {
			continue
		}
		if l.Speaker == "" {
			return invalid(fmt.Sprintf("گوینده‌ی دیالوگ %d مشخص نیست", i+1))
		}
		if l.StartMs < 0 || l.EndMs <= l.StartMs {
			return invalid(fmt.Sprintf("زمان شروع/پایان دیالوگ %d درست نیست", i+1))
		}
		lines = append(lines, l)
	}
	sort.SliceStable(lines, func(i, j int) bool { return lines[i].StartMs < lines[j].StartMs })
	c.Lines = lines

	questions := make([]Question, 0, len(c.Questions))
	for i, q := range c.Questions {
		q.QuestionFa = strings.TrimSpace(q.QuestionFa)
		if q.QuestionFa == "" {
			continue
		}
		opts := make([]string, 0, len(q.Options))
		for _, o := range q.Options {
			if o = strings.TrimSpace(o); o != "" {
				opts = append(opts, o)
			}
		}
		if len(opts) < 2 || q.AnswerIndex < 0 || q.AnswerIndex >= len(opts) {
			return invalid(fmt.Sprintf("سؤال %d باید حداقل دو گزینه و یک جواب درست داشته باشد", i+1))
		}
		q.Options = opts
		questions = append(questions, q)
	}
	c.Questions = questions

	if c.IsActive && (c.VideoURL == "" || len(c.Lines) == 0) {
		return invalid("برای فعال کردن کلیپ، ویدیو و حداقل یک دیالوگ لازم است")
	}

	if id != "" {
		if err := parseID(op, id); err != nil {
			return Clip{}, err
		}
	}
	c.ID = id
	savedID, err := s.repo.Save(ctx, c)
	if err != nil {
		return Clip{}, err
	}
	return s.repo.Get(ctx, savedID)
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "videoclip.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}

// maxDetectSeconds بیشتر از این از صدای کلیپ برای تشخیص دیالوگ فرستاده نمی‌شود.
const maxDetectSeconds = 300

// AdminDetectLines صدای ویدیوی آپلودشده را جدا و با Groq تکه‌تکه (با زمان‌بندی)
// رونویسی می‌کند تا ادمین مجبور نباشد شروع/پایان هر دیالوگ را دستی بزند.
// گوینده‌ها خالی می‌مانند (با «تکمیل با AI» یا دستی پر می‌شوند).
func (s *Service) AdminDetectLines(ctx context.Context, videoURL string) ([]Line, error) {
	const op = "videoclip.AdminDetectLines"
	if s.groq == nil || !s.groq.Enabled() {
		return nil, richerror.New(op).WithMessage("برای تشخیص خودکار دیالوگ، کلید Groq (GROQ_API_KEY) را در تنظیمات وارد کن").WithKind(richerror.KindInvalid)
	}

	videoPath, cleanup, err := s.localVideo(ctx, videoURL)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("فایل ویدیو در دسترس نیست").WithKind(richerror.KindInvalid)
	}
	defer cleanup()

	wavPath, err := audio.ToWAV16kMonoMax(ctx, videoPath, maxDetectSeconds)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("جدا کردن صدای ویدیو ناموفق بود")
	}
	defer os.Remove(wavPath)

	segs, err := s.groq.TranscribeSegments(ctx, wavPath)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("تشخیص دیالوگ‌ها ناموفق بود، دوباره امتحان کن")
	}
	lines := make([]Line, 0, len(segs))
	for i, sg := range segs {
		start, end := int(sg.Start*1000), int(sg.End*1000)
		if end <= start {
			end = start + 500
		}
		lines = append(lines, Line{Position: i, Text: sg.Text, StartMs: start, EndMs: end})
	}
	return lines, nil
}

// localVideo مسیر دیسکی فایل ویدیو را برمی‌گرداند: فایل‌های خودمان از store
// (دیسک محلی یا object storage)، و هر آدرس دیگر با دانلود موقت.
func (s *Service) localVideo(ctx context.Context, videoURL string) (string, func(), error) {
	videoURL = strings.TrimSpace(videoURL)
	if videoURL == "" {
		return "", nil, fmt.Errorf("empty video url")
	}
	if p, cleanup, err := s.store.Open(ctx, path.Base(videoURL)); err == nil {
		if _, statErr := os.Stat(p); statErr == nil {
			return p, cleanup, nil
		}
		cleanup()
	}
	if !strings.HasPrefix(videoURL, "http://") && !strings.HasPrefix(videoURL, "https://") {
		return "", nil, fmt.Errorf("video not found in store: %s", videoURL)
	}

	dctx, cancel := context.WithTimeout(ctx, 2*time.Minute)
	defer cancel()
	req, err := http.NewRequestWithContext(dctx, http.MethodGet, videoURL, nil)
	if err != nil {
		return "", nil, err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", nil, fmt.Errorf("download video: status %d", resp.StatusCode)
	}
	tmp, err := os.CreateTemp("", "clip-*"+filepath.Ext(path.Base(videoURL)))
	if err != nil {
		return "", nil, err
	}
	if _, err := io.Copy(tmp, io.LimitReader(resp.Body, MaxVideoSize)); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return "", nil, err
	}
	tmp.Close()
	return tmp.Name(), func() { os.Remove(tmp.Name()) }, nil
}

// AdminComplete گوینده‌ی خطوط بی‌گوینده، ترجمه‌ی فارسی و سؤال‌های فهم را با AI
// پیشنهاد می‌دهد (چیزی ذخیره نمی‌کند؛ ادمین بررسی و ذخیره می‌کند).
func (s *Service) AdminComplete(ctx context.Context, title, descriptionFa, level string, lines []Line) (aiservice.VideoClipCompletion, error) {
	const op = "videoclip.AdminComplete"
	if len(lines) == 0 {
		return aiservice.VideoClipCompletion{}, richerror.New(op).WithMessage("اول دیالوگ‌ها را اضافه کن").WithKind(richerror.KindInvalid)
	}
	drafts := make([]aiservice.VideoClipLineDraft, 0, len(lines))
	for _, l := range lines {
		drafts = append(drafts, aiservice.VideoClipLineDraft{Speaker: l.Speaker, Text: l.Text})
	}
	res, err := s.ai.CompleteVideoClip(ctx, title, descriptionFa, level, drafts)
	if err != nil {
		return aiservice.VideoClipCompletion{}, richerror.New(op).WithErr(err).WithMessage("تکمیل با AI ناموفق بود، دوباره امتحان کن")
	}
	return res, nil
}

// ---------- آپلود ویدیو ----------

// MaxVideoSize سقف حجم ویدیوی کلیپ. کلیپ‌ها ۱۵ ثانیه تا ۲ دقیقه‌اند؛ 720p
// با بیت‌ریت معمول زیر ۴۰ مگابایت می‌ماند.
const MaxVideoSize = 80 << 20

var videoContentTypeByExt = map[string]string{
	".mp4":  "video/mp4",
	".m4v":  "video/mp4",
	".mov":  "video/quicktime",
	".webm": "video/webm",
}

// SaveVideo فایل ویدیو را ذخیره و URL عمومی‌اش را برمی‌گرداند.
func (s *Service) SaveVideo(ctx context.Context, originalName string, size int64, r io.Reader) (string, error) {
	const op = "videoclip.SaveVideo"
	if size > MaxVideoSize {
		return "", richerror.New(op).WithMessage("حجم ویدیو نباید بیشتر از ۸۰ مگابایت باشد").WithKind(richerror.KindInvalid)
	}
	ext := strings.ToLower(filepath.Ext(originalName))
	ct, ok := videoContentTypeByExt[ext]
	if !ok {
		return "", richerror.New(op).WithMessage("فرمت ویدیو مجاز نیست. مجاز: mp4, mov, webm").WithKind(richerror.KindInvalid)
	}
	data, err := io.ReadAll(io.LimitReader(r, MaxVideoSize+1))
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فایل")
	}
	url, err := s.store.Save(ctx, uuid.NewString()+ext, data, ct)
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی ویدیو")
	}
	return url, nil
}
