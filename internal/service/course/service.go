// Package courseservice «دوره‌ی شروع» برای مبتدی‌مبتدی‌ها: فصل ← درس ← کارت.
// کاربر هر کارت (کلمه/عبارت/جمله‌ی خیلی کوتاه با ایموجی و معنی فارسی) را
// گوش می‌دهد و تکرار می‌کند؛ نمره‌ی تلفظ هر کارت با همان ارزیاب شدوئینگ
// (/v1/shadowing/evaluate با target_text) گرفته می‌شود و اینجا فقط ستاره‌ی
// درس ثبت می‌شود. درس‌ها به ترتیب باز می‌شوند. رایگان است (بدون اشتراک) تا
// مبتدی‌ها بدون مانع شروع کنند.
package courseservice

import (
	"context"
	"strings"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	postgrescourse "shadowing-backend/internal/repository/postgres/course"
	aiservice "shadowing-backend/internal/service/ai"
	ttsservice "shadowing-backend/internal/service/tts"

	"github.com/google/uuid"
)

type repository interface {
	Tree(ctx context.Context, activeOnly bool, userID string) ([]postgrescourse.Unit, error)
	GetLesson(ctx context.Context, id string) (postgrescourse.Lesson, error)
	SaveUnit(ctx context.Context, u postgrescourse.Unit) (string, error)
	DeleteUnit(ctx context.Context, id string) error
	SaveLesson(ctx context.Context, l postgrescourse.Lesson) (string, error)
	DeleteLesson(ctx context.Context, id string) error
	SetItemAudio(ctx context.Context, itemID, audioURL string) error
	SaveProgress(ctx context.Context, userID, lessonID string, stars, score int) error
}

type Unit = postgrescourse.Unit
type Lesson = postgrescourse.Lesson
type Item = postgrescourse.Item

type Service struct {
	repo  repository
	ai    aiservice.Service
	tts   ttsservice.Service
	store filestore.Store
}

func New(repo repository, ai aiservice.Service, tts ttsservice.Service, store filestore.Store) *Service {
	return &Service{repo: repo, ai: ai, tts: tts, store: store}
}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

// Course همه‌ی فصل‌ها و درس‌های فعال با ستاره‌های کاربر. اولین درس کل دوره همیشه
// باز است و هر درس بعدی وقتی باز می‌شود که درس قبلی (به ترتیب نمایش) تمام شده
// باشد — مسیر قدم‌به‌قدم، مثل کتاب‌های آموزش کودک.
func (s *Service) Course(ctx context.Context, userID string) ([]Unit, error) {
	const op = "course.Course"
	if err := parseID(op, userID); err != nil {
		return nil, err
	}
	units, err := s.repo.Tree(ctx, true, userID)
	if err != nil {
		return nil, err
	}
	prevDone := true
	out := make([]Unit, 0, len(units))
	for _, u := range units {
		lessons := make([]Lesson, 0, len(u.Lessons))
		for _, l := range u.Lessons {
			if l.ItemCount == 0 {
				continue // درس بدون کارت هنوز آماده نیست
			}
			l.Unlocked = prevDone || l.Completed
			prevDone = l.Completed
			lessons = append(lessons, l)
		}
		if len(lessons) == 0 {
			continue
		}
		u.Lessons = lessons
		out = append(out, u)
	}
	return out, nil
}

func (s *Service) Lesson(ctx context.Context, id string) (Lesson, error) {
	const op = "course.Lesson"
	if err := parseID(op, id); err != nil {
		return Lesson{}, err
	}
	l, err := s.repo.GetLesson(ctx, id)
	if err != nil {
		return Lesson{}, err
	}
	if !l.IsActive {
		return Lesson{}, richerror.New(op).WithMessage("درس پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return l, nil
}

// StarsForScore میانگین نمره‌ی تلفظ کارت‌ها → ستاره‌ی درس. سخت‌گیر نیست: هدف
// این دوره اعتمادبه‌نفس است، پس هر تلاش کاملی دست‌کم یک ستاره می‌گیرد.
func StarsForScore(score int) int {
	switch {
	case score >= 80:
		return 3
	case score >= 60:
		return 2
	default:
		return 1
	}
}

// Complete پایان یک درس را با میانگین نمره‌ی کارت‌ها ثبت می‌کند و ستاره را برمی‌گرداند.
func (s *Service) Complete(ctx context.Context, userID, lessonID string, score int) (int, error) {
	const op = "course.Complete"
	if err := parseID(op, userID); err != nil {
		return 0, err
	}
	if err := parseID(op, lessonID); err != nil {
		return 0, err
	}
	if score < 0 {
		score = 0
	}
	if score > 100 {
		score = 100
	}
	stars := StarsForScore(score)
	return stars, s.repo.SaveProgress(ctx, userID, lessonID, stars, score)
}

// ---------- ادمین ----------

func (s *Service) AdminTree(ctx context.Context) ([]Unit, error) {
	return s.repo.Tree(ctx, false, "")
}

func (s *Service) AdminLesson(ctx context.Context, id string) (Lesson, error) {
	const op = "course.AdminLesson"
	if err := parseID(op, id); err != nil {
		return Lesson{}, err
	}
	return s.repo.GetLesson(ctx, id)
}

func (s *Service) AdminSaveUnit(ctx context.Context, id string, u Unit) (string, error) {
	const op = "course.AdminSaveUnit"
	u.TitleFa = strings.TrimSpace(u.TitleFa)
	if u.TitleFa == "" {
		return "", richerror.New(op).WithMessage("عنوان فصل الزامی است").WithKind(richerror.KindInvalid)
	}
	if id != "" {
		if err := parseID(op, id); err != nil {
			return "", err
		}
	}
	u.ID = id
	return s.repo.SaveUnit(ctx, u)
}

func (s *Service) AdminDeleteUnit(ctx context.Context, id string) error {
	const op = "course.AdminDeleteUnit"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.DeleteUnit(ctx, id)
}

func (s *Service) AdminSaveLesson(ctx context.Context, id string, l Lesson) (Lesson, error) {
	const op = "course.AdminSaveLesson"
	l.TitleFa = strings.TrimSpace(l.TitleFa)
	if l.TitleFa == "" {
		return Lesson{}, richerror.New(op).WithMessage("عنوان درس الزامی است").WithKind(richerror.KindInvalid)
	}
	if err := parseID(op, l.UnitID); err != nil {
		return Lesson{}, err
	}
	items := make([]Item, 0, len(l.Items))
	for _, it := range l.Items {
		it.TextEn = strings.TrimSpace(it.TextEn)
		it.MeaningFa = strings.TrimSpace(it.MeaningFa)
		it.TipFa = strings.TrimSpace(it.TipFa)
		if it.TextEn == "" {
			continue
		}
		items = append(items, it)
	}
	l.Items = items
	if id != "" {
		if err := parseID(op, id); err != nil {
			return Lesson{}, err
		}
	}
	l.ID = id
	savedID, err := s.repo.SaveLesson(ctx, l)
	if err != nil {
		return Lesson{}, err
	}
	return s.repo.GetLesson(ctx, savedID)
}

func (s *Service) AdminDeleteLesson(ctx context.Context, id string) error {
	const op = "course.AdminDeleteLesson"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.DeleteLesson(ctx, id)
}

// AdminSuggest کارت‌های یک درس را از روی موضوعش با AI پیشنهاد می‌دهد (چیزی ذخیره
// نمی‌کند). کارت‌های درس‌های قبلی به AI داده می‌شوند تا تکرار نشوند.
func (s *Service) AdminSuggest(ctx context.Context, topic, unitTitle string, count int) (aiservice.CourseLessonSuggestion, error) {
	const op = "course.AdminSuggest"
	if strings.TrimSpace(topic) == "" {
		return aiservice.CourseLessonSuggestion{}, richerror.New(op).WithMessage("موضوع درس را بنویس").WithKind(richerror.KindInvalid)
	}
	if count < 4 || count > 15 {
		count = 8
	}
	var previous []string
	if units, err := s.repo.Tree(ctx, false, ""); err == nil {
		for _, u := range units {
			for _, l := range u.Lessons {
				if l.TitleEn != "" {
					previous = append(previous, l.TitleEn)
				}
			}
		}
	}
	res, err := s.ai.SuggestCourseLesson(ctx, topic, unitTitle, previous, count)
	if err != nil {
		return res, richerror.New(op).WithErr(err).WithMessage("ساخت کارت‌ها با AI ناموفق بود، دوباره امتحان کن")
	}
	return res, nil
}

// courseSpeechSpeed صدای کارت‌ها کمی آهسته‌تر از عادی است — برای مبتدی‌مبتدی.
const courseSpeechSpeed = 0.85

// AdminGenerateAudio برای کارت‌های بدون صدای درس، با TTS فعال صدا می‌سازد.
// تعداد ساخته‌شده و خطای اولین شکست (اگر بود) برمی‌گردد؛ کارت‌های موفق ذخیره می‌مانند.
func (s *Service) AdminGenerateAudio(ctx context.Context, lessonID, voiceID string) (Lesson, int, error) {
	const op = "course.AdminGenerateAudio"
	if !s.tts.Enabled() {
		return Lesson{}, 0, richerror.New(op).WithMessage(s.tts.MissingKeyMessage()).WithKind(richerror.KindInvalid)
	}
	l, err := s.AdminLesson(ctx, lessonID)
	if err != nil {
		return Lesson{}, 0, err
	}
	made := 0
	for _, it := range l.Items {
		if it.AudioURL != "" || it.ID == "" {
			continue
		}
		audio, err := s.tts.GenerateSpeech(ctx, it.TextEn, voiceID, courseSpeechSpeed)
		if err != nil {
			l, _ = s.repo.GetLesson(ctx, lessonID)
			return l, made, richerror.New(op).WithErr(err).WithMessage("ساخت صدای «" + it.TextEn + "» ناموفق بود: " + err.Error())
		}
		url, err := s.store.Save(ctx, "course/"+uuid.NewString()+audio.Ext, audio.Data, audio.ContentType)
		if err != nil {
			return l, made, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی فایل صدا")
		}
		if err := s.repo.SetItemAudio(ctx, it.ID, url); err != nil {
			return l, made, err
		}
		made++
	}
	l, err = s.repo.GetLesson(ctx, lessonID)
	return l, made, err
}
