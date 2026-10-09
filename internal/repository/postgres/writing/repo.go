package postgreswriting

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

// Prompt یک موضوع «تمرین نوشتن» که ادمین ساخته.
type Prompt struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	PromptFa       string   `json:"prompt_fa"`
	GuideQuestions []string `json:"guide_questions"`
	UsefulPhrases  []string `json:"useful_phrases"`
	Level          string   `json:"level"`
	MinWords       int      `json:"min_words"`
	MaxWords       int      `json:"max_words"`
	Position       int      `json:"position"`
	IsActive       bool     `json:"is_active"`
	CreatedAt      string   `json:"created_at"`
}

// UserPrompt موضوع به‌همراه خلاصه‌ی متن‌های همین کاربر (برای لیست اپ).
type UserPrompt struct {
	Prompt
	Attempts  int `json:"attempts"`
	BestScore int `json:"best_score"`
}

// Attempt یک متن ثبت‌شده. Review همان JSON کامل بررسی AI است.
type Attempt struct {
	UserID   string
	PromptID string
	Text     string
	Score    int
	Review   any
}

const promptColumns = `id::text, title, prompt_fa, guide_questions, useful_phrases, level,
	min_words, max_words, position, is_active, created_at::text`

func scanPrompt(row pgx.Row, t *Prompt, extra ...any) error {
	dest := append([]any{&t.ID, &t.Title, &t.PromptFa, &t.GuideQuestions, &t.UsefulPhrases, &t.Level,
		&t.MinWords, &t.MaxWords, &t.Position, &t.IsActive, &t.CreatedAt}, extra...)
	return row.Scan(dest...)
}

// ListAll همه‌ی موضوع‌ها (فعال و غیرفعال) برای پنل ادمین.
func (r DB) ListAll(ctx context.Context) ([]Prompt, error) {
	const op = "postgreswriting.ListAll"
	rows, err := r.conn.Query(ctx, `SELECT `+promptColumns+` FROM writing_prompts ORDER BY position, created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]Prompt, 0)
	for rows.Next() {
		var t Prompt
		if err := scanPrompt(rows, &t); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListActiveForUser موضوع‌های فعال برای اپ، با تعداد تلاش و بهترین امتیاز همین کاربر.
func (r DB) ListActiveForUser(ctx context.Context, userID string) ([]UserPrompt, error) {
	const op = "postgreswriting.ListActiveForUser"
	rows, err := r.conn.Query(ctx, `
		SELECT `+promptColumns+`,
			COALESCE(a.attempts, 0), COALESCE(a.best_score, 0)
		FROM writing_prompts t
		LEFT JOIN (
			SELECT prompt_id, COUNT(*) AS attempts, MAX(score) AS best_score
			FROM writing_attempts
			WHERE user_id = $1::uuid
			GROUP BY prompt_id
		) a ON a.prompt_id = t.id
		WHERE t.is_active
		ORDER BY t.position, t.created_at`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]UserPrompt, 0)
	for rows.Next() {
		var t UserPrompt
		if err := scanPrompt(rows, &t.Prompt, &t.Attempts, &t.BestScore); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r DB) Get(ctx context.Context, id string) (Prompt, error) {
	const op = "postgreswriting.Get"
	var t Prompt
	err := scanPrompt(r.conn.QueryRow(ctx, `SELECT `+promptColumns+` FROM writing_prompts WHERE id = $1::uuid`, id), &t)
	if errors.Is(err, pgx.ErrNoRows) {
		return Prompt{}, richerror.New(op).WithErr(err).WithMessage("موضوع پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Prompt{}, richerror.New(op).WithErr(err)
	}
	return t, nil
}

func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

func (r DB) Create(ctx context.Context, t Prompt) (Prompt, error) {
	const op = "postgreswriting.Create"
	var out Prompt
	err := scanPrompt(r.conn.QueryRow(ctx, `
		INSERT INTO writing_prompts (title, prompt_fa, guide_questions, useful_phrases, level, min_words, max_words, position, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING `+promptColumns,
		t.Title, t.PromptFa, nonNil(t.GuideQuestions), nonNil(t.UsefulPhrases), t.Level, t.MinWords, t.MaxWords, t.Position, t.IsActive), &out)
	if err != nil {
		return Prompt{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت موضوع")
	}
	return out, nil
}

func (r DB) Update(ctx context.Context, t Prompt) (Prompt, error) {
	const op = "postgreswriting.Update"
	var out Prompt
	err := scanPrompt(r.conn.QueryRow(ctx, `
		UPDATE writing_prompts
		SET title = $2, prompt_fa = $3, guide_questions = $4, useful_phrases = $5, level = $6,
			min_words = $7, max_words = $8, position = $9, is_active = $10
		WHERE id = $1::uuid
		RETURNING `+promptColumns,
		t.ID, t.Title, t.PromptFa, nonNil(t.GuideQuestions), nonNil(t.UsefulPhrases), t.Level, t.MinWords, t.MaxWords, t.Position, t.IsActive), &out)
	if errors.Is(err, pgx.ErrNoRows) {
		return Prompt{}, richerror.New(op).WithErr(err).WithMessage("موضوع پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Prompt{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی موضوع")
	}
	return out, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgreswriting.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM writing_prompts WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف موضوع")
	}
	return nil
}

func (r DB) InsertAttempt(ctx context.Context, a Attempt) error {
	const op = "postgreswriting.InsertAttempt"
	review, err := json.Marshal(a.Review)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	_, err = r.conn.Exec(ctx, `
		INSERT INTO writing_attempts (user_id, prompt_id, text, score, review)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5)`,
		a.UserID, a.PromptID, a.Text, a.Score, review)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تلاش")
	}
	return nil
}
