package postgreslibrary

import (
	"context"
	"encoding/json"
	"errors"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// ---------- کتابخانه‌ی محتوا (فایل‌های JSON) ----------

// Resource یک فایل JSON نگه‌داری‌شده. در لیست، Content خالی است و فقط SizeBytes
// برمی‌گردد تا فایل‌های بزرگ بی‌دلیل منتقل نشوند.
type Resource struct {
	ID        string          `json:"id"`
	Title     string          `json:"title"`
	Kind      string          `json:"kind"`
	Notes     string          `json:"notes"`
	FileName  string          `json:"file_name"`
	SizeBytes int             `json:"size_bytes"`
	Content   json.RawMessage `json:"content,omitempty"`
	CreatedAt string          `json:"created_at"`
	UpdatedAt string          `json:"updated_at"`
}

const resourceMetaColumns = `id::text, title, kind, notes, file_name, OCTET_LENGTH(content::text),
	created_at::text, updated_at::text`

func scanResourceMeta(row pgx.Row, r *Resource, extra ...any) error {
	dest := append([]any{&r.ID, &r.Title, &r.Kind, &r.Notes, &r.FileName, &r.SizeBytes,
		&r.CreatedAt, &r.UpdatedAt}, extra...)
	return row.Scan(dest...)
}

func (r DB) ListResources(ctx context.Context) ([]Resource, error) {
	const op = "postgreslibrary.ListResources"
	rows, err := r.conn.Query(ctx, `SELECT `+resourceMetaColumns+` FROM content_resources ORDER BY created_at DESC`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]Resource, 0)
	for rows.Next() {
		var res Resource
		if err := scanResourceMeta(rows, &res); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, res)
	}
	return out, rows.Err()
}

func (r DB) GetResource(ctx context.Context, id string) (Resource, error) {
	const op = "postgreslibrary.GetResource"
	var res Resource
	var content []byte
	err := scanResourceMeta(r.conn.QueryRow(ctx,
		`SELECT `+resourceMetaColumns+`, content::text FROM content_resources WHERE id = $1::uuid`, id), &res, &content)
	if errors.Is(err, pgx.ErrNoRows) {
		return Resource{}, richerror.New(op).WithErr(err).WithMessage("فایل پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Resource{}, richerror.New(op).WithErr(err)
	}
	res.Content = content
	return res, nil
}

func (r DB) CreateResource(ctx context.Context, res Resource) (Resource, error) {
	const op = "postgreslibrary.CreateResource"
	var out Resource
	err := scanResourceMeta(r.conn.QueryRow(ctx, `
		INSERT INTO content_resources (title, kind, notes, file_name, content)
		VALUES ($1, $2, $3, $4, $5::json)
		RETURNING `+resourceMetaColumns,
		res.Title, res.Kind, res.Notes, res.FileName, string(res.Content)), &out)
	if err != nil {
		return Resource{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی فایل")
	}
	return out, nil
}

// UpdateResource عنوان/نوع/یادداشت را عوض می‌کند؛ اگر Content خالی نباشد
// محتوای فایل هم جایگزین می‌شود.
func (r DB) UpdateResource(ctx context.Context, res Resource) (Resource, error) {
	const op = "postgreslibrary.UpdateResource"
	var content *string
	if len(res.Content) > 0 {
		s := string(res.Content)
		content = &s
	}
	var out Resource
	err := scanResourceMeta(r.conn.QueryRow(ctx, `
		UPDATE content_resources
		SET title = $2, kind = $3, notes = $4,
			file_name = CASE WHEN $6::text IS NULL THEN file_name ELSE $5 END,
			content = COALESCE($6::text::json, content),
			updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING `+resourceMetaColumns,
		res.ID, res.Title, res.Kind, res.Notes, res.FileName, content), &out)
	if errors.Is(err, pgx.ErrNoRows) {
		return Resource{}, richerror.New(op).WithErr(err).WithMessage("فایل پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Resource{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی فایل")
	}
	return out, nil
}

func (r DB) DeleteResource(ctx context.Context, id string) error {
	const op = "postgreslibrary.DeleteResource"
	if _, err := r.conn.Exec(ctx, `DELETE FROM content_resources WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف فایل")
	}
	return nil
}

// ---------- اصطلاحات ----------

type Idiom struct {
	ID            string `json:"id"`
	Phrase        string `json:"phrase"`
	MeaningFa     string `json:"meaning_fa"`
	ExplanationFa string `json:"explanation_fa"`
	ExampleEn     string `json:"example_en"`
	ExampleFa     string `json:"example_fa"`
	Level         string `json:"level"`
	Category      string `json:"category"`
	IsActive      bool   `json:"is_active"`
	CreatedAt     string `json:"created_at"`
}

const idiomColumns = `id::text, phrase, meaning_fa, explanation_fa, example_en, example_fa,
	level, category, is_active, created_at::text`

func scanIdiom(row pgx.Row, i *Idiom) error {
	return row.Scan(&i.ID, &i.Phrase, &i.MeaningFa, &i.ExplanationFa, &i.ExampleEn, &i.ExampleFa,
		&i.Level, &i.Category, &i.IsActive, &i.CreatedAt)
}

func isUniqueViolation(err error) bool {
	var pgErr *pgconn.PgError
	return errors.As(err, &pgErr) && pgErr.Code == "23505"
}

func (r DB) ListIdioms(ctx context.Context) ([]Idiom, error) {
	const op = "postgreslibrary.ListIdioms"
	rows, err := r.conn.Query(ctx, `SELECT `+idiomColumns+` FROM idioms ORDER BY created_at DESC, phrase`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]Idiom, 0)
	for rows.Next() {
		var i Idiom
		if err := scanIdiom(rows, &i); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, i)
	}
	return out, rows.Err()
}

func (r DB) CreateIdiom(ctx context.Context, i Idiom) (Idiom, error) {
	const op = "postgreslibrary.CreateIdiom"
	var out Idiom
	err := scanIdiom(r.conn.QueryRow(ctx, `
		INSERT INTO idioms (phrase, meaning_fa, explanation_fa, example_en, example_fa, level, category, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+idiomColumns,
		i.Phrase, i.MeaningFa, i.ExplanationFa, i.ExampleEn, i.ExampleFa, i.Level, i.Category, i.IsActive), &out)
	if isUniqueViolation(err) {
		return Idiom{}, richerror.New(op).WithErr(err).WithMessage("این اصطلاح قبلاً ثبت شده").WithKind(richerror.KindConflict)
	}
	if err != nil {
		return Idiom{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی اصطلاح")
	}
	return out, nil
}

func (r DB) UpdateIdiom(ctx context.Context, i Idiom) (Idiom, error) {
	const op = "postgreslibrary.UpdateIdiom"
	var out Idiom
	err := scanIdiom(r.conn.QueryRow(ctx, `
		UPDATE idioms
		SET phrase = $2, meaning_fa = $3, explanation_fa = $4, example_en = $5, example_fa = $6,
			level = $7, category = $8, is_active = $9, updated_at = NOW()
		WHERE id = $1::uuid
		RETURNING `+idiomColumns,
		i.ID, i.Phrase, i.MeaningFa, i.ExplanationFa, i.ExampleEn, i.ExampleFa, i.Level, i.Category, i.IsActive), &out)
	if errors.Is(err, pgx.ErrNoRows) {
		return Idiom{}, richerror.New(op).WithErr(err).WithMessage("اصطلاح پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if isUniqueViolation(err) {
		return Idiom{}, richerror.New(op).WithErr(err).WithMessage("این اصطلاح قبلاً ثبت شده").WithKind(richerror.KindConflict)
	}
	if err != nil {
		return Idiom{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی اصطلاح")
	}
	return out, nil
}

func (r DB) DeleteIdioms(ctx context.Context, ids []string) error {
	const op = "postgreslibrary.DeleteIdioms"
	if _, err := r.conn.Exec(ctx, `DELETE FROM idioms WHERE id = ANY($1::uuid[])`, ids); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف اصطلاح")
	}
	return nil
}

// ImportResult خلاصه‌ی وارد کردن گروهی.
type ImportResult struct {
	Created int `json:"created"`
	Updated int `json:"updated"`
	Skipped int `json:"skipped"`
}

// ImportIdioms همه را در یک تراکنش ثبت می‌کند. اصطلاحِ تکراری (بدون حساسیت به
// حروف بزرگ/کوچک) اگر overwrite باشد به‌روز می‌شود، وگرنه رد می‌شود.
func (r DB) ImportIdioms(ctx context.Context, items []Idiom, overwrite bool) (ImportResult, error) {
	const op = "postgreslibrary.ImportIdioms"
	conflict := `DO NOTHING`
	if overwrite {
		conflict = `DO UPDATE SET meaning_fa = EXCLUDED.meaning_fa, explanation_fa = EXCLUDED.explanation_fa,
			example_en = EXCLUDED.example_en, example_fa = EXCLUDED.example_fa, level = EXCLUDED.level,
			category = EXCLUDED.category, updated_at = NOW()`
	}
	query := `
		INSERT INTO idioms (phrase, meaning_fa, explanation_fa, example_en, example_fa, level, category, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		ON CONFLICT ((LOWER(phrase))) ` + conflict + `
		RETURNING (xmax = 0)`

	var res ImportResult
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return res, richerror.New(op).WithErr(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	for _, i := range items {
		var inserted bool
		err := tx.QueryRow(ctx, query,
			i.Phrase, i.MeaningFa, i.ExplanationFa, i.ExampleEn, i.ExampleFa, i.Level, i.Category, i.IsActive).Scan(&inserted)
		switch {
		case errors.Is(err, pgx.ErrNoRows):
			res.Skipped++
		case err != nil:
			return ImportResult{}, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت «" + i.Phrase + "»")
		case inserted:
			res.Created++
		default:
			res.Updated++
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return ImportResult{}, richerror.New(op).WithErr(err)
	}
	return res, nil
}
