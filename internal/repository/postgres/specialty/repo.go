package postgresspecialty

import (
	"context"
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

// Field یک رشته‌ی «زبان تخصصی». Key شناسه‌ی خوانا و ثابت است (مثلاً medicine).
type Field struct {
	Key       string `json:"key"`
	TitleFa   string `json:"title_fa"`
	TitleEn   string `json:"title_en"`
	Icon      string `json:"icon"`
	MinLevel  string `json:"min_level"`
	Position  int    `json:"position"`
	IsActive  bool   `json:"is_active"`
	WordCount int    `json:"word_count"`
}

// Word یک لغت رشته.
type Word struct {
	ID        string `json:"id"`
	Word      string `json:"word"`
	MeaningFa string `json:"meaning_fa"`
	Example   string `json:"example"`
	ExampleFa string `json:"example_fa"`
	Level     string `json:"level"`
	AudioURL  string `json:"audio_url"`
	Position  int    `json:"position"`
}

// ContentItem محتوای موجودی که برچسب این رشته را دارد (فقط چیزی که اپ برای
// کارت و باز کردنش لازم دارد).
type ContentItem struct {
	Kind     string `json:"kind"` // scene | podcast | speaking_topic | writing_prompt | interview
	ID       string `json:"id"`
	Title    string `json:"title"`
	Level    string `json:"level"`
	ImageURL string `json:"image_url"`
}

// ContentTables جدول‌هایی که ستون field_key دارند، با نام ستون عنوان/سطح/عکس و
// شرط «منتشرشده» هر کدام. تنها جایی است که این نام‌ها تعریف می‌شوند.
var ContentTables = map[string]struct{ Table, Title, Level, Image, Active string }{
	"scene":          {"scenes", "title", "difficulty", "background_image_url", "status = 'published'"},
	"podcast":        {"podcasts", "title", "level", "image_url", "is_active"},
	"speaking_topic": {"speaking_topics", "title", "level", "image_url", "is_active"},
	"writing_prompt": {"writing_prompts", "title", "level", "image_url", "is_active"},
	"interview":      {"interview_sets", "title", "level", "image_url", "is_active"},
}

const fieldColumns = `f.key, f.title_fa, f.title_en, f.icon, f.min_level, f.position, f.is_active,
	(SELECT COUNT(*) FROM field_words w WHERE w.field_key = f.key)`

func scanField(row pgx.Row, f *Field) error {
	return row.Scan(&f.Key, &f.TitleFa, &f.TitleEn, &f.Icon, &f.MinLevel, &f.Position, &f.IsActive, &f.WordCount)
}

// ListFields رشته‌ها؛ onlyActive برای اپ.
func (r DB) ListFields(ctx context.Context, onlyActive bool) ([]Field, error) {
	const op = "postgresspecialty.ListFields"
	q := `SELECT ` + fieldColumns + ` FROM specialty_fields f`
	if onlyActive {
		q += ` WHERE f.is_active`
	}
	rows, err := r.conn.Query(ctx, q+` ORDER BY f.position, f.created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Field, 0)
	for rows.Next() {
		var f Field
		if err := scanField(rows, &f); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

func (r DB) GetField(ctx context.Context, key string) (Field, error) {
	const op = "postgresspecialty.GetField"
	var f Field
	err := scanField(r.conn.QueryRow(ctx, `SELECT `+fieldColumns+` FROM specialty_fields f WHERE f.key = $1`, key), &f)
	if errors.Is(err, pgx.ErrNoRows) {
		return Field{}, richerror.New(op).WithMessage("رشته پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Field{}, richerror.New(op).WithErr(err)
	}
	return f, nil
}

// SaveField رشته را می‌سازد یا (با همان key) به‌روز می‌کند.
func (r DB) SaveField(ctx context.Context, f Field) error {
	const op = "postgresspecialty.SaveField"
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO specialty_fields (key, title_fa, title_en, icon, min_level, position, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (key) DO UPDATE SET title_fa = EXCLUDED.title_fa, title_en = EXCLUDED.title_en, icon = EXCLUDED.icon,
			min_level = EXCLUDED.min_level, position = EXCLUDED.position, is_active = EXCLUDED.is_active`,
		f.Key, f.TitleFa, f.TitleEn, f.Icon, f.MinLevel, f.Position, f.IsActive); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// DeleteField رشته و لغت‌هایش را پاک می‌کند و برچسبش را از محتوا برمی‌دارد.
func (r DB) DeleteField(ctx context.Context, key string) error {
	const op = "postgresspecialty.DeleteField"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	for _, t := range ContentTables {
		if _, err := tx.Exec(ctx, `UPDATE `+t.Table+` SET field_key = '' WHERE field_key = $1`, key); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	if _, err := tx.Exec(ctx, `DELETE FROM specialty_fields WHERE key = $1`, key); err != nil {
		return richerror.New(op).WithErr(err)
	}
	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (r DB) Words(ctx context.Context, key string) ([]Word, error) {
	const op = "postgresspecialty.Words"
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, word, meaning_fa, example, example_fa, level, audio_url, position
		FROM field_words WHERE field_key = $1 ORDER BY position, word`, key)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Word, 0)
	for rows.Next() {
		var w Word
		if err := rows.Scan(&w.ID, &w.Word, &w.MeaningFa, &w.Example, &w.ExampleFa, &w.Level, &w.AudioURL, &w.Position); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, w)
	}
	return out, rows.Err()
}

// ReplaceWords کل فهرست لغت‌های یک رشته را با فهرست داده‌شده عوض می‌کند.
func (r DB) ReplaceWords(ctx context.Context, key string, words []Word) error {
	const op = "postgresspecialty.ReplaceWords"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()
	if _, err := tx.Exec(ctx, `DELETE FROM field_words WHERE field_key = $1`, key); err != nil {
		return richerror.New(op).WithErr(err)
	}
	for i, w := range words {
		if _, err := tx.Exec(ctx, `
			INSERT INTO field_words (field_key, word, meaning_fa, example, example_fa, level, audio_url, position)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			key, w.Word, w.MeaningFa, w.Example, w.ExampleFa, w.Level, w.AudioURL, i); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// SetContentField برچسب رشته‌ی یک محتوا را عوض می‌کند (key خالی = برداشتن برچسب).
func (r DB) SetContentField(ctx context.Context, kind, id, key string) error {
	const op = "postgresspecialty.SetContentField"
	t, ok := ContentTables[kind]
	if !ok {
		return richerror.New(op).WithMessage("نوع محتوا نامعتبر است").WithKind(richerror.KindInvalid)
	}
	tag, err := r.conn.Exec(ctx, `UPDATE `+t.Table+` SET field_key = $2 WHERE id = $1::uuid`, id, key)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	if tag.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("محتوا پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return nil
}

// Content محتوای برچسب‌خورده‌ی یک رشته؛ onlyPublished برای اپ.
func (r DB) Content(ctx context.Context, key string, onlyPublished bool) ([]ContentItem, error) {
	const op = "postgresspecialty.Content"
	out := make([]ContentItem, 0)
	for _, kind := range []string{"scene", "podcast", "speaking_topic", "writing_prompt", "interview"} {
		t := ContentTables[kind]
		q := `SELECT id::text, ` + t.Title + `, ` + t.Level + `, ` + t.Image + ` FROM ` + t.Table + ` WHERE field_key = $1`
		if onlyPublished {
			q += ` AND ` + t.Active
		}
		rows, err := r.conn.Query(ctx, q+` ORDER BY created_at`, key)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		for rows.Next() {
			it := ContentItem{Kind: kind}
			if err := rows.Scan(&it.ID, &it.Title, &it.Level, &it.ImageURL); err != nil {
				rows.Close()
				return nil, richerror.New(op).WithErr(err)
			}
			out = append(out, it)
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
	}
	return out, nil
}
