// Package specialtyservice «زبان تخصصی»: هر رشته (پزشکی، فناوری اطلاعات، …) یک
// فهرست لغت دارد و محتوای موجود (صحنه، پادکست، موضوع صحبت و نوشتن، مصاحبه) فقط
// برچسب رشته می‌گیرد؛ محتوای جدا ساخته نمی‌شود. اپ هر رشته را از سطح min_level
// (پیش‌فرض B1) به بالا باز می‌کند، چون بدون ۲ تا ۳ هزار لغت عمومی متن تخصصی فهمیده
// نمی‌شود. کل بخش پشت کلید FEATURE_ESP_ENABLED است.
package specialtyservice

import (
	"context"
	"regexp"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgresspecialty "shadowing-backend/internal/repository/postgres/specialty"

	"github.com/google/uuid"
)

type repository interface {
	ListFields(ctx context.Context, onlyActive bool) ([]postgresspecialty.Field, error)
	GetField(ctx context.Context, key string) (postgresspecialty.Field, error)
	SaveField(ctx context.Context, f postgresspecialty.Field) error
	DeleteField(ctx context.Context, key string) error
	Words(ctx context.Context, key string) ([]postgresspecialty.Word, error)
	ReplaceWords(ctx context.Context, key string, words []postgresspecialty.Word) error
	SetContentField(ctx context.Context, kind, id, key string) error
	Content(ctx context.Context, key string, onlyPublished bool) ([]postgresspecialty.ContentItem, error)
}

type flags interface {
	Get(key string) string
}

// KeyEnabled کلید تنظیماتی که این بخش را برای کاربرها باز می‌کند.
const KeyEnabled = "FEATURE_ESP_ENABLED"

type (
	Field       = postgresspecialty.Field
	Word        = postgresspecialty.Word
	ContentItem = postgresspecialty.ContentItem
)

type Service struct {
	repo  repository
	flags flags
}

func New(repo repository, flags flags) *Service {
	return &Service{repo: repo, flags: flags}
}

var (
	keyPattern  = regexp.MustCompile(`^[a-z][a-z0-9_]{1,39}$`)
	validLevels = map[string]bool{"starter": true, "beginner": true, "intermediate": true, "advanced": true, "proficient": true}
)

func (s *Service) Enabled() bool {
	switch strings.ToLower(strings.TrimSpace(s.flags.Get(KeyEnabled))) {
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

// FieldDetail همه‌ی چیزی که صفحه‌ی یک رشته در اپ لازم دارد.
type FieldDetail struct {
	Field
	Words   []Word        `json:"words"`
	Content []ContentItem `json:"content"`
}

// ---------- اپ ----------

func (s *Service) ListFields(ctx context.Context) ([]Field, error) {
	const op = "specialty.ListFields"
	if err := s.checkEnabled(op); err != nil {
		return nil, err
	}
	return s.repo.ListFields(ctx, true)
}

func (s *Service) GetField(ctx context.Context, key string) (FieldDetail, error) {
	const op = "specialty.GetField"
	if err := s.checkEnabled(op); err != nil {
		return FieldDetail{}, err
	}
	f, err := s.repo.GetField(ctx, key)
	if err != nil {
		return FieldDetail{}, err
	}
	if !f.IsActive {
		return FieldDetail{}, richerror.New(op).WithMessage("رشته پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return s.detail(ctx, f, true)
}

func (s *Service) detail(ctx context.Context, f Field, onlyPublished bool) (FieldDetail, error) {
	words, err := s.repo.Words(ctx, f.Key)
	if err != nil {
		return FieldDetail{}, err
	}
	content, err := s.repo.Content(ctx, f.Key, onlyPublished)
	if err != nil {
		return FieldDetail{}, err
	}
	return FieldDetail{Field: f, Words: words, Content: content}, nil
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Field, error) {
	return s.repo.ListFields(ctx, false)
}

func (s *Service) AdminGet(ctx context.Context, key string) (FieldDetail, error) {
	f, err := s.repo.GetField(ctx, key)
	if err != nil {
		return FieldDetail{}, err
	}
	return s.detail(ctx, f, false)
}

// NormalizeField مقدارهای پیش‌فرض را می‌گذارد و ورودیِ نامعتبر را رد می‌کند.
func NormalizeField(f *Field) string {
	f.Key = strings.ToLower(strings.TrimSpace(f.Key))
	f.TitleFa = strings.TrimSpace(f.TitleFa)
	f.TitleEn = strings.TrimSpace(f.TitleEn)
	if !keyPattern.MatchString(f.Key) {
		return "کلید رشته باید با حرف انگلیسی کوچک شروع شود و فقط حرف، عدد و _ داشته باشد (مثلاً medicine)"
	}
	if f.TitleFa == "" {
		return "عنوان فارسی رشته الزامی است"
	}
	if !validLevels[f.MinLevel] {
		f.MinLevel = "intermediate"
	}
	return ""
}

func (s *Service) AdminSaveField(ctx context.Context, f Field) (FieldDetail, error) {
	const op = "specialty.AdminSaveField"
	if msg := NormalizeField(&f); msg != "" {
		return FieldDetail{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	if err := s.repo.SaveField(ctx, f); err != nil {
		return FieldDetail{}, err
	}
	return s.AdminGet(ctx, f.Key)
}

func (s *Service) AdminDeleteField(ctx context.Context, key string) error {
	return s.repo.DeleteField(ctx, key)
}

// maxWords سقف لغت‌های یک رشته؛ فهرست‌های پژوهشیِ رشته‌ای چند صد کلمه‌اند.
const maxWords = 1000

// NormalizeWords خالی‌ها و تکراری‌ها (بدون حساسیت به حروف) را حذف می‌کند.
func NormalizeWords(words []Word) []Word {
	out := make([]Word, 0, len(words))
	seen := map[string]bool{}
	for _, w := range words {
		w.Word = strings.TrimSpace(w.Word)
		w.MeaningFa = strings.TrimSpace(w.MeaningFa)
		k := strings.ToLower(w.Word)
		if k == "" || seen[k] {
			continue
		}
		seen[k] = true
		if !validLevels[w.Level] {
			w.Level = "intermediate"
		}
		out = append(out, w)
	}
	return out
}

func (s *Service) AdminSaveWords(ctx context.Context, key string, words []Word) (FieldDetail, error) {
	const op = "specialty.AdminSaveWords"
	f, err := s.repo.GetField(ctx, key)
	if err != nil {
		return FieldDetail{}, err
	}
	words = NormalizeWords(words)
	if len(words) > maxWords {
		return FieldDetail{}, richerror.New(op).WithMessage("حداکثر ۱۰۰۰ لغت برای هر رشته").WithKind(richerror.KindInvalid)
	}
	if err := s.repo.ReplaceWords(ctx, f.Key, words); err != nil {
		return FieldDetail{}, err
	}
	return s.detail(ctx, f, false)
}

// AdminSetContentField به یک محتوای موجود برچسب رشته می‌زند (key خالی = برداشتن).
func (s *Service) AdminSetContentField(ctx context.Context, kind, id, key string) error {
	const op = "specialty.AdminSetContentField"
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	key = strings.TrimSpace(key)
	if key != "" {
		if _, err := s.repo.GetField(ctx, key); err != nil {
			return err
		}
	}
	return s.repo.SetContentField(ctx, kind, id, key)
}
