package postgrestopicspeaking

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

// Topic یک موضوع «صحبت درباره‌ی یک موضوع» که ادمین ساخته.
type Topic struct {
	ID              string   `json:"id"`
	Title           string   `json:"title"`
	PromptFa        string   `json:"prompt_fa"`
	GuideQuestions  []string `json:"guide_questions"`
	UsefulPhrases   []string `json:"useful_phrases"`
	Level           string   `json:"level"`
	DurationSeconds int      `json:"duration_seconds"`
	Position        int      `json:"position"`
	IsActive        bool     `json:"is_active"`
	CreatedAt       string   `json:"created_at"`
}

// UserTopic موضوع به‌همراه خلاصه‌ی تلاش‌های همین کاربر (برای لیست اپ).
type UserTopic struct {
	Topic
	Attempts  int `json:"attempts"`
	BestScore int `json:"best_score"`
}

// Attempt یک تلاش ثبت‌شده. Review همان JSON کامل بررسی AI است.
type Attempt struct {
	UserID          string
	TopicID         string
	Transcript      string
	DurationSeconds int
	Score           int
	Review          any
}

const topicColumns = `id::text, title, prompt_fa, guide_questions, useful_phrases, level,
	duration_seconds, position, is_active, created_at::text`

func scanTopic(row pgx.Row, t *Topic, extra ...any) error {
	dest := append([]any{&t.ID, &t.Title, &t.PromptFa, &t.GuideQuestions, &t.UsefulPhrases, &t.Level,
		&t.DurationSeconds, &t.Position, &t.IsActive, &t.CreatedAt}, extra...)
	return row.Scan(dest...)
}

// ListAll همه‌ی موضوع‌ها (فعال و غیرفعال) برای پنل ادمین.
func (r DB) ListAll(ctx context.Context) ([]Topic, error) {
	const op = "postgrestopicspeaking.ListAll"
	rows, err := r.conn.Query(ctx, `SELECT `+topicColumns+` FROM speaking_topics ORDER BY position, created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]Topic, 0)
	for rows.Next() {
		var t Topic
		if err := scanTopic(rows, &t); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

// ListActiveForUser موضوع‌های فعال برای اپ، با تعداد تلاش و بهترین امتیاز همین کاربر.
func (r DB) ListActiveForUser(ctx context.Context, userID string) ([]UserTopic, error) {
	const op = "postgrestopicspeaking.ListActiveForUser"
	rows, err := r.conn.Query(ctx, `
		SELECT `+topicColumns+`,
			COALESCE(a.attempts, 0), COALESCE(a.best_score, 0)
		FROM speaking_topics t
		LEFT JOIN (
			SELECT topic_id, COUNT(*) AS attempts, MAX(score) AS best_score
			FROM topic_speaking_attempts
			WHERE user_id = $1::uuid
			GROUP BY topic_id
		) a ON a.topic_id = t.id
		WHERE t.is_active
		ORDER BY t.position, t.created_at`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	out := make([]UserTopic, 0)
	for rows.Next() {
		var t UserTopic
		if err := scanTopic(rows, &t.Topic, &t.Attempts, &t.BestScore); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, t)
	}
	return out, rows.Err()
}

func (r DB) Get(ctx context.Context, id string) (Topic, error) {
	const op = "postgrestopicspeaking.Get"
	var t Topic
	err := scanTopic(r.conn.QueryRow(ctx, `SELECT `+topicColumns+` FROM speaking_topics WHERE id = $1::uuid`, id), &t)
	if errors.Is(err, pgx.ErrNoRows) {
		return Topic{}, richerror.New(op).WithErr(err).WithMessage("موضوع پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Topic{}, richerror.New(op).WithErr(err)
	}
	return t, nil
}

func nonNil(s []string) []string {
	if s == nil {
		return []string{}
	}
	return s
}

func (r DB) Create(ctx context.Context, t Topic) (Topic, error) {
	const op = "postgrestopicspeaking.Create"
	var out Topic
	err := scanTopic(r.conn.QueryRow(ctx, `
		INSERT INTO speaking_topics (title, prompt_fa, guide_questions, useful_phrases, level, duration_seconds, position, is_active)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING `+topicColumns,
		t.Title, t.PromptFa, nonNil(t.GuideQuestions), nonNil(t.UsefulPhrases), t.Level, t.DurationSeconds, t.Position, t.IsActive), &out)
	if err != nil {
		return Topic{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت موضوع")
	}
	return out, nil
}

func (r DB) Update(ctx context.Context, t Topic) (Topic, error) {
	const op = "postgrestopicspeaking.Update"
	var out Topic
	err := scanTopic(r.conn.QueryRow(ctx, `
		UPDATE speaking_topics
		SET title = $2, prompt_fa = $3, guide_questions = $4, useful_phrases = $5, level = $6,
			duration_seconds = $7, position = $8, is_active = $9
		WHERE id = $1::uuid
		RETURNING `+topicColumns,
		t.ID, t.Title, t.PromptFa, nonNil(t.GuideQuestions), nonNil(t.UsefulPhrases), t.Level, t.DurationSeconds, t.Position, t.IsActive), &out)
	if errors.Is(err, pgx.ErrNoRows) {
		return Topic{}, richerror.New(op).WithErr(err).WithMessage("موضوع پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Topic{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی موضوع")
	}
	return out, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgrestopicspeaking.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM speaking_topics WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف موضوع")
	}
	return nil
}

func (r DB) InsertAttempt(ctx context.Context, a Attempt) error {
	const op = "postgrestopicspeaking.InsertAttempt"
	review, err := json.Marshal(a.Review)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	_, err = r.conn.Exec(ctx, `
		INSERT INTO topic_speaking_attempts (user_id, topic_id, transcript, duration_seconds, score, review)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6)`,
		a.UserID, a.TopicID, a.Transcript, a.DurationSeconds, a.Score, review)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تلاش")
	}
	return nil
}
