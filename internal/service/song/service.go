// Package songservice بخش «آهنگ»: آهنگ آماده (آپلود ادمین) با متنی که خط‌به‌خط
// هم‌زمان با صدا هایلایت می‌شود، مثل داستان. ساخت صدا در کار نیست؛ ادمین زمان هر
// خط را در پنل با ضربه زدن هم‌زمان با آهنگ می‌گذارد.
package songservice

import (
	"context"
	"fmt"
	"strings"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	postgressong "shadowing-backend/internal/repository/postgres/song"

	"github.com/google/uuid"
)

type (
	Song      = postgressong.Song
	Line      = postgressong.Line
	VocabItem = postgressong.VocabItem
)

type Repository interface {
	List(ctx context.Context, onlyActive bool) ([]Song, error)
	Get(ctx context.Context, id string) (Song, error)
	Save(ctx context.Context, s Song) (string, error)
	Delete(ctx context.Context, id string) error
}

type Service struct {
	repo Repository
	// store فایل‌های آپلودی (نسخه‌ی بی‌کلام) را برای ترکیب با صدای کاربر باز می‌کند.
	store filestore.Store
}

func New(repo Repository, store filestore.Store) *Service {
	return &Service{repo: repo, store: store}
}

func parseID(op richerror.Op, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- اپ ----------

// List آهنگ‌های منتشرشده، بدون متن کامل (کارت‌های لیست) و بدون یادداشت مجوز.
func (s *Service) List(ctx context.Context) ([]Song, error) {
	all, err := s.repo.List(ctx, true)
	if err != nil {
		return nil, err
	}
	for i := range all {
		all[i].Lines, all[i].Vocabulary, all[i].LicenseNote = nil, nil, ""
	}
	return all, nil
}

func (s *Service) Get(ctx context.Context, id string) (Song, error) {
	const op = "song.Get"
	if err := parseID(op, id); err != nil {
		return Song{}, err
	}
	song, err := s.repo.Get(ctx, id)
	if err != nil {
		return Song{}, err
	}
	if !song.IsActive {
		return Song{}, richerror.New(op).WithMessage("آهنگ پیدا نشد").WithKind(richerror.KindNotFound)
	}
	song.LicenseNote = ""
	return song, nil
}

// ---------- ادمین ----------

func (s *Service) AdminList(ctx context.Context) ([]Song, error) {
	all, err := s.repo.List(ctx, false)
	if err != nil {
		return nil, err
	}
	for i := range all {
		all[i].Lines, all[i].Vocabulary = nil, nil
	}
	return all, nil
}

func (s *Service) AdminGet(ctx context.Context, id string) (Song, error) {
	const op = "song.AdminGet"
	if err := parseID(op, id); err != nil {
		return Song{}, err
	}
	return s.repo.Get(ctx, id)
}

var validLevels = map[string]bool{"starter": true, "beginner": true, "intermediate": true, "advanced": true, "proficient": true}

// AdminSave آهنگ را تمیز و ذخیره می‌کند. پیش‌نویس هر چیزی می‌تواند باشد؛ فقط
// انتشار شرط دارد (صدا و زمان‌بندیِ کامل و مرتب همه‌ی خط‌ها).
func (s *Service) AdminSave(ctx context.Context, id string, song Song) (Song, error) {
	const op = "song.AdminSave"
	invalid := func(msg string) (Song, error) {
		return Song{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	if id != "" {
		if err := parseID(op, id); err != nil {
			return Song{}, err
		}
	}
	song.ID = id
	song.Title = strings.TrimSpace(song.Title)
	song.Artist = strings.TrimSpace(song.Artist)
	song.DescriptionFa = strings.TrimSpace(song.DescriptionFa)
	song.CoverURL = strings.TrimSpace(song.CoverURL)
	song.AudioURL = strings.TrimSpace(song.AudioURL)
	song.InstrumentalURL = strings.TrimSpace(song.InstrumentalURL)
	song.LicenseNote = strings.TrimSpace(song.LicenseNote)
	if song.Title == "" {
		return invalid("عنوان آهنگ الزامی است")
	}
	if !validLevels[song.Level] {
		song.Level = "beginner"
	}
	if song.DurationSeconds < 0 {
		song.DurationSeconds = 0
	}

	lines := make([]Line, 0, len(song.Lines))
	for _, l := range song.Lines {
		l.Text = strings.TrimSpace(l.Text)
		l.TranslationFa = strings.TrimSpace(l.TranslationFa)
		if l.Text == "" {
			continue
		}
		lines = append(lines, l)
	}
	song.Lines = lines
	vocab := make([]VocabItem, 0, len(song.Vocabulary))
	for _, v := range song.Vocabulary {
		if v.Word = strings.TrimSpace(v.Word); v.Word != "" {
			v.MeaningFa = strings.TrimSpace(v.MeaningFa)
			vocab = append(vocab, v)
		}
	}
	song.Vocabulary = vocab

	if song.IsActive {
		if err := publishable(song); err != "" {
			return invalid(err)
		}
	}

	savedID, err := s.repo.Save(ctx, song)
	if err != nil {
		return Song{}, err
	}
	return s.repo.Get(ctx, savedID)
}

// publishable دلیلِ قابل انتشار نبودن را برمی‌گرداند (خالی = آماده).
func publishable(s Song) string {
	if s.AudioURL == "" {
		return "برای انتشار، فایل صدای آهنگ لازم است"
	}
	if len(s.Lines) == 0 {
		return "آهنگ بدون متن قابل انتشار نیست"
	}
	prevEnd := 0
	for i, l := range s.Lines {
		if l.EndMs <= l.StartMs {
			return fmt.Sprintf("زمان خط %d کامل نیست (پایان باید بعد از شروع باشد)", i+1)
		}
		if l.StartMs < prevEnd {
			return fmt.Sprintf("خط %d قبل از تمام شدن خط قبلی شروع شده", i+1)
		}
		if s.DurationSeconds > 0 && l.EndMs > s.DurationSeconds*1000+500 {
			return fmt.Sprintf("زمان خط %d از طول آهنگ بیشتر است", i+1)
		}
		prevEnd = l.EndMs
	}
	return ""
}

func (s *Service) AdminDelete(ctx context.Context, id string) error {
	const op = "song.AdminDelete"
	if err := parseID(op, id); err != nil {
		return err
	}
	return s.repo.Delete(ctx, id)
}
