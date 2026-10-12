// Package libraryservice ابزارهای محتوایی پنل ادمین:
//   - «کتابخانه‌ی محتوا»: نگه‌داری فایل‌های JSON (مثلاً درس‌های آماده) به‌عنوان مرجع.
//   - «اصطلاحات»: ثبت تکی، از روی JSON یا گروهی (هر خط یک اصطلاح).
package libraryservice

import (
	"context"
	"encoding/json"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
	postgreslibrary "shadowing-backend/internal/repository/postgres/library"

	"github.com/google/uuid"
)

type repository interface {
	ListResources(ctx context.Context) ([]postgreslibrary.Resource, error)
	GetResource(ctx context.Context, id string) (postgreslibrary.Resource, error)
	CreateResource(ctx context.Context, r postgreslibrary.Resource) (postgreslibrary.Resource, error)
	UpdateResource(ctx context.Context, r postgreslibrary.Resource) (postgreslibrary.Resource, error)
	DeleteResource(ctx context.Context, id string) error

	ListIdioms(ctx context.Context) ([]postgreslibrary.Idiom, error)
	CreateIdiom(ctx context.Context, i postgreslibrary.Idiom) (postgreslibrary.Idiom, error)
	UpdateIdiom(ctx context.Context, i postgreslibrary.Idiom) (postgreslibrary.Idiom, error)
	DeleteIdioms(ctx context.Context, ids []string) error
	ImportIdioms(ctx context.Context, items []postgreslibrary.Idiom, overwrite bool) (postgreslibrary.ImportResult, error)
}

type Resource = postgreslibrary.Resource
type Idiom = postgreslibrary.Idiom
type ImportResult = postgreslibrary.ImportResult

type Service struct {
	repo repository
}

func New(repo repository) *Service {
	return &Service{repo: repo}
}

const (
	maxResourceBytes = 5 << 20 // ۵ مگابایت برای هر فایل JSON
	maxImportItems   = 2000
)

var validKinds = map[string]bool{"lesson": true, "scene": true, "podcast": true, "vocabulary": true, "other": true}
var validLevels = map[string]bool{"": true, "beginner": true, "intermediate": true, "advanced": true}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

func invalid(op richerror.Op, msg string) error {
	return richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
}

// ---------- کتابخانه‌ی محتوا ----------

func (s *Service) ListResources(ctx context.Context) ([]Resource, error) {
	return s.repo.ListResources(ctx)
}

func (s *Service) GetResource(ctx context.Context, id string) (Resource, error) {
	const op = "library.GetResource"
	if err := parseID(op, id); err != nil {
		return Resource{}, err
	}
	return s.repo.GetResource(ctx, id)
}

// SaveResource با id خالی فایل تازه می‌سازد. در ویرایش، Content خالی یعنی
// «فقط عنوان/نوع/یادداشت عوض شود».
func (s *Service) SaveResource(ctx context.Context, id string, r Resource) (Resource, error) {
	const op = "library.SaveResource"
	r.Title = strings.TrimSpace(r.Title)
	r.Notes = strings.TrimSpace(r.Notes)
	r.FileName = strings.TrimSpace(r.FileName)
	if !validKinds[r.Kind] {
		r.Kind = "other"
	}
	if r.Title == "" {
		r.Title = strings.TrimSuffix(r.FileName, ".json")
	}
	if r.Title == "" {
		return Resource{}, invalid(op, "عنوان فایل را وارد کنید")
	}
	if len(r.Content) > maxResourceBytes {
		return Resource{}, invalid(op, "فایل بزرگ‌تر از ۵ مگابایت است")
	}
	if len(r.Content) > 0 && !json.Valid(r.Content) {
		return Resource{}, invalid(op, "محتوای فایل JSON معتبر نیست")
	}

	if id == "" {
		if len(r.Content) == 0 {
			return Resource{}, invalid(op, "محتوای JSON خالی است")
		}
		return s.repo.CreateResource(ctx, r)
	}
	if err := parseID(op, id); err != nil {
		return Resource{}, err
	}
	r.ID = id
	return s.repo.UpdateResource(ctx, r)
}

func (s *Service) DeleteResource(ctx context.Context, id string) error {
	const op = "library.DeleteResource"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.DeleteResource(ctx, id)
}

// ---------- اصطلاحات ----------

func normalizeIdiom(i Idiom) Idiom {
	i.Phrase = strings.Join(strings.Fields(i.Phrase), " ")
	i.MeaningFa = strings.TrimSpace(i.MeaningFa)
	i.ExplanationFa = strings.TrimSpace(i.ExplanationFa)
	i.ExampleEn = strings.TrimSpace(i.ExampleEn)
	i.ExampleFa = strings.TrimSpace(i.ExampleFa)
	i.Level = strings.ToLower(strings.TrimSpace(i.Level))
	i.Category = strings.TrimSpace(i.Category)
	if !validLevels[i.Level] {
		i.Level = ""
	}
	return i
}

func (s *Service) ListIdioms(ctx context.Context) ([]Idiom, error) {
	return s.repo.ListIdioms(ctx)
}

func (s *Service) SaveIdiom(ctx context.Context, id string, i Idiom) (Idiom, error) {
	const op = "library.SaveIdiom"
	i = normalizeIdiom(i)
	if i.Phrase == "" {
		return Idiom{}, invalid(op, "خود اصطلاح (انگلیسی) را وارد کنید")
	}
	if id == "" {
		return s.repo.CreateIdiom(ctx, i)
	}
	if err := parseID(op, id); err != nil {
		return Idiom{}, err
	}
	i.ID = id
	return s.repo.UpdateIdiom(ctx, i)
}

func (s *Service) DeleteIdioms(ctx context.Context, ids []string) error {
	const op = "library.DeleteIdioms"
	if len(ids) == 0 {
		return nil
	}
	for _, id := range ids {
		if err := parseID(op, id); err != nil {
			return err
		}
	}
	return s.repo.DeleteIdioms(ctx, ids)
}

// ImportIdioms وارد کردن گروهی (از JSON یا متن چندخطی که پنل به آرایه تبدیل
// کرده). ردیف‌های بی‌عبارت نادیده گرفته و در Skipped شمرده می‌شوند.
func (s *Service) ImportIdioms(ctx context.Context, items []Idiom, overwrite bool) (ImportResult, error) {
	const op = "library.ImportIdioms"
	if len(items) == 0 {
		return ImportResult{}, invalid(op, "هیچ اصطلاحی برای وارد کردن نیست")
	}
	if len(items) > maxImportItems {
		return ImportResult{}, invalid(op, "حداکثر ۲۰۰۰ اصطلاح در هر بار وارد کردن")
	}
	clean := make([]Idiom, 0, len(items))
	empty := 0
	for _, i := range items {
		i = normalizeIdiom(i)
		if i.Phrase == "" {
			empty++
			continue
		}
		i.IsActive = true
		clean = append(clean, i)
	}
	if len(clean) == 0 {
		return ImportResult{}, invalid(op, "هیچ ردیفی «phrase» نداشت")
	}
	res, err := s.repo.ImportIdioms(ctx, clean, overwrite)
	res.Skipped += empty
	return res, err
}
