package postgressong

import (
	"context"
	"encoding/json"
	"errors"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// Line یک خط از متن آهنگ با زمانِ شروع و پایانش در آهنگ (میلی‌ثانیه).
type Line struct {
	Text          string `json:"text"`
	TranslationFa string `json:"translation_fa"`
	StartMs       int    `json:"start_ms"`
	EndMs         int    `json:"end_ms"`
}

type VocabItem struct {
	Word      string `json:"word"`
	MeaningFa string `json:"meaning_fa"`
}

type Song struct {
	ID              string      `json:"id"`
	Title           string      `json:"title"`
	Artist          string      `json:"artist"`
	DescriptionFa   string      `json:"description_fa"`
	Level           string      `json:"level"`
	CoverURL        string      `json:"cover_url"`
	AudioURL        string      `json:"audio_url"`
	InstrumentalURL string      `json:"instrumental_url"`
	DurationSeconds int         `json:"duration_seconds"`
	Lines           []Line      `json:"lines"`
	Vocabulary      []VocabItem `json:"vocabulary"`
	// LicenseNote منبع و مجوز آهنگ؛ فقط در API ادمین برمی‌گردد.
	LicenseNote string `json:"license_note,omitempty"`
	Position    int    `json:"position"`
	IsActive    bool   `json:"is_active"`
	LineCount   int    `json:"line_count"`
	CreatedAt   string `json:"created_at"`
}

const songColumns = `id::text, title, artist, description_fa, level, cover_url, audio_url, instrumental_url,
	duration_seconds, lines, vocabulary, license_note, position, is_active, created_at::text`

func scanSong(row pgx.Row) (Song, error) {
	var s Song
	var lines, vocab []byte
	if err := row.Scan(&s.ID, &s.Title, &s.Artist, &s.DescriptionFa, &s.Level, &s.CoverURL, &s.AudioURL,
		&s.InstrumentalURL, &s.DurationSeconds, &lines, &vocab, &s.LicenseNote, &s.Position, &s.IsActive, &s.CreatedAt); err != nil {
		return Song{}, err
	}
	_ = json.Unmarshal(lines, &s.Lines)
	_ = json.Unmarshal(vocab, &s.Vocabulary)
	if s.Lines == nil {
		s.Lines = []Line{}
	}
	if s.Vocabulary == nil {
		s.Vocabulary = []VocabItem{}
	}
	s.LineCount = len(s.Lines)
	return s, nil
}

// List همه‌ی آهنگ‌ها (onlyActive: فقط منتشرشده‌ها) به ترتیب position.
func (r DB) List(ctx context.Context, onlyActive bool) ([]Song, error) {
	const op = "postgressong.List"
	q := `SELECT ` + songColumns + ` FROM songs`
	if onlyActive {
		q += ` WHERE is_active`
	}
	q += ` ORDER BY position, created_at`
	rows, err := r.conn.Query(ctx, q)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := []Song{}
	for rows.Next() {
		s, err := scanSong(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

func (r DB) Get(ctx context.Context, id string) (Song, error) {
	const op = "postgressong.Get"
	s, err := scanSong(r.conn.QueryRow(ctx, `SELECT `+songColumns+` FROM songs WHERE id = $1::uuid`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return Song{}, richerror.New(op).WithErr(err).WithMessage("آهنگ پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Song{}, richerror.New(op).WithErr(err)
	}
	return s, nil
}

// Save آهنگ را می‌سازد (ID خالی) یا جایگزین می‌کند و شناسه‌اش را برمی‌گرداند.
func (r DB) Save(ctx context.Context, s Song) (string, error) {
	const op = "postgressong.Save"
	if s.Lines == nil {
		s.Lines = []Line{}
	}
	if s.Vocabulary == nil {
		s.Vocabulary = []VocabItem{}
	}
	lines, _ := json.Marshal(s.Lines)
	vocab, _ := json.Marshal(s.Vocabulary)
	id := s.ID
	var err error
	if id == "" {
		err = r.conn.QueryRow(ctx, `
			INSERT INTO songs (title, artist, description_fa, level, cover_url, audio_url, instrumental_url,
				duration_seconds, lines, vocabulary, license_note, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id::text`,
			s.Title, s.Artist, s.DescriptionFa, s.Level, s.CoverURL, s.AudioURL, s.InstrumentalURL,
			s.DurationSeconds, lines, vocab, s.LicenseNote, s.Position, s.IsActive).Scan(&id)
	} else {
		var tag interface{ RowsAffected() int64 }
		tag, err = r.conn.Exec(ctx, `
			UPDATE songs SET title = $2, artist = $3, description_fa = $4, level = $5, cover_url = $6, audio_url = $7,
				instrumental_url = $8, duration_seconds = $9, lines = $10, vocabulary = $11, license_note = $12,
				position = $13, is_active = $14, updated_at = NOW()
			WHERE id = $1::uuid`,
			id, s.Title, s.Artist, s.DescriptionFa, s.Level, s.CoverURL, s.AudioURL, s.InstrumentalURL,
			s.DurationSeconds, lines, vocab, s.LicenseNote, s.Position, s.IsActive)
		if err == nil && tag.RowsAffected() == 0 {
			return "", richerror.New(op).WithMessage("آهنگ پیدا نشد").WithKind(richerror.KindNotFound)
		}
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی آهنگ")
	}
	return id, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgressong.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM songs WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف آهنگ")
	}
	return nil
}
