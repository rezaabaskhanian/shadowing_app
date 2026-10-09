package postgresvideoclip

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

type Question struct {
	QuestionFa  string   `json:"question_fa"`
	Options     []string `json:"options"`
	AnswerIndex int      `json:"answer_index"`
}

type Line struct {
	ID            string `json:"id,omitempty"`
	Position      int    `json:"position"`
	Speaker       string `json:"speaker"`
	Text          string `json:"text"`
	TranslationFa string `json:"translation_fa"`
	StartMs       int    `json:"start_ms"`
	EndMs         int    `json:"end_ms"`
}

type Clip struct {
	ID              string     `json:"id"`
	Title           string     `json:"title"`
	DescriptionFa   string     `json:"description_fa"`
	Source          string     `json:"source"` // flow | movie
	VideoURL        string     `json:"video_url"`
	PosterURL       string     `json:"poster_url"`
	Level           string     `json:"level"`
	DurationSeconds int        `json:"duration_seconds"`
	Questions       []Question `json:"questions"`
	Position        int        `json:"position"`
	IsActive        bool       `json:"is_active"`
	CreatedAt       string     `json:"created_at"`
	Lines           []Line     `json:"lines"`
}

// UserClip کلیپ در لیست اپ: بدون خطوط، با تعداد شخصیت‌ها و بهترین امتیاز همین کاربر.
type UserClip struct {
	Clip
	SpeakerCount int `json:"speaker_count"`
	Attempts     int `json:"attempts"`
	BestScore    int `json:"best_score"`
}

const clipColumns = `c.id::text, c.title, c.description_fa, c.source, c.video_url, c.poster_url, c.level,
	c.duration_seconds, c.questions, c.position, c.is_active, c.created_at::text`

func scanClip(row pgx.Row, c *Clip, extra ...any) error {
	var questions []byte
	dest := append([]any{&c.ID, &c.Title, &c.DescriptionFa, &c.Source, &c.VideoURL, &c.PosterURL, &c.Level,
		&c.DurationSeconds, &questions, &c.Position, &c.IsActive, &c.CreatedAt}, extra...)
	if err := row.Scan(dest...); err != nil {
		return err
	}
	c.Questions = []Question{}
	if len(questions) > 0 {
		_ = json.Unmarshal(questions, &c.Questions)
	}
	c.Lines = []Line{}
	return nil
}

// ListAll همه‌ی کلیپ‌ها برای پنل ادمین (بدون خطوط).
func (r DB) ListAll(ctx context.Context) ([]UserClip, error) {
	const op = "postgresvideoclip.ListAll"
	rows, err := r.conn.Query(ctx, `
		SELECT `+clipColumns+`,
			(SELECT COUNT(DISTINCT speaker) FROM video_clip_lines l WHERE l.clip_id = c.id), 0, 0
		FROM video_clips c ORDER BY c.position, c.created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	return scanUserClips(op, rows)
}

// ListActiveForUser کلیپ‌های فعال برای اپ با تعداد تلاش و بهترین امتیاز کاربر.
func (r DB) ListActiveForUser(ctx context.Context, userID string) ([]UserClip, error) {
	const op = "postgresvideoclip.ListActiveForUser"
	rows, err := r.conn.Query(ctx, `
		SELECT `+clipColumns+`,
			(SELECT COUNT(DISTINCT speaker) FROM video_clip_lines l WHERE l.clip_id = c.id),
			COALESCE(a.attempts, 0), COALESCE(a.best_score, 0)
		FROM video_clips c
		LEFT JOIN (
			SELECT clip_id, COUNT(*) AS attempts, MAX(score) AS best_score
			FROM video_clip_attempts WHERE user_id = $1::uuid GROUP BY clip_id
		) a ON a.clip_id = c.id
		WHERE c.is_active AND c.video_url <> ''
		ORDER BY c.position, c.created_at`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	return scanUserClips(op, rows)
}

func scanUserClips(op richerror.Op, rows pgx.Rows) ([]UserClip, error) {
	out := make([]UserClip, 0)
	for rows.Next() {
		var c UserClip
		if err := scanClip(rows, &c.Clip, &c.SpeakerCount, &c.Attempts, &c.BestScore); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// Get یک کلیپ با همه‌ی خطوطش.
func (r DB) Get(ctx context.Context, id string) (Clip, error) {
	const op = "postgresvideoclip.Get"
	var c Clip
	err := scanClip(r.conn.QueryRow(ctx, `SELECT `+clipColumns+` FROM video_clips c WHERE c.id = $1::uuid`, id), &c)
	if errors.Is(err, pgx.ErrNoRows) {
		return Clip{}, richerror.New(op).WithErr(err).WithMessage("کلیپ پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Clip{}, richerror.New(op).WithErr(err)
	}

	rows, err := r.conn.Query(ctx, `
		SELECT id::text, position, speaker, text, translation_fa, start_ms, end_ms
		FROM video_clip_lines WHERE clip_id = $1::uuid ORDER BY start_ms, position`, id)
	if err != nil {
		return Clip{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var l Line
		if err := rows.Scan(&l.ID, &l.Position, &l.Speaker, &l.Text, &l.TranslationFa, &l.StartMs, &l.EndMs); err != nil {
			return Clip{}, richerror.New(op).WithErr(err)
		}
		c.Lines = append(c.Lines, l)
	}
	return c, rows.Err()
}

// Save کلیپ را می‌سازد (ID خالی) یا به‌روز می‌کند و خطوطش را کامل جایگزین می‌کند،
// همه در یک تراکنش.
func (r DB) Save(ctx context.Context, c Clip) (string, error) {
	const op = "postgresvideoclip.Save"
	questions, err := json.Marshal(c.Questions)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	id := c.ID
	if id == "" {
		err = tx.QueryRow(ctx, `
			INSERT INTO video_clips (title, description_fa, source, video_url, poster_url, level, duration_seconds, questions, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			RETURNING id::text`,
			c.Title, c.DescriptionFa, c.Source, c.VideoURL, c.PosterURL, c.Level, c.DurationSeconds, questions, c.Position, c.IsActive,
		).Scan(&id)
	} else {
		var tag interface{ RowsAffected() int64 }
		tag, err = tx.Exec(ctx, `
			UPDATE video_clips SET title = $2, description_fa = $3, source = $4, video_url = $5, poster_url = $6,
				level = $7, duration_seconds = $8, questions = $9, position = $10, is_active = $11
			WHERE id = $1::uuid`,
			id, c.Title, c.DescriptionFa, c.Source, c.VideoURL, c.PosterURL, c.Level, c.DurationSeconds, questions, c.Position, c.IsActive)
		if err == nil && tag.RowsAffected() == 0 {
			return "", richerror.New(op).WithMessage("کلیپ پیدا نشد").WithKind(richerror.KindNotFound)
		}
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی کلیپ")
	}

	if _, err := tx.Exec(ctx, `DELETE FROM video_clip_lines WHERE clip_id = $1::uuid`, id); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	for i, l := range c.Lines {
		if _, err := tx.Exec(ctx, `
			INSERT INTO video_clip_lines (clip_id, position, speaker, text, translation_fa, start_ms, end_ms)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, $7)`,
			id, i, l.Speaker, l.Text, l.TranslationFa, l.StartMs, l.EndMs); err != nil {
			return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی دیالوگ‌ها")
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return id, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgresvideoclip.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM video_clips WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف کلیپ")
	}
	return nil
}

func (r DB) InsertAttempt(ctx context.Context, userID, clipID, speaker string, score int) error {
	const op = "postgresvideoclip.InsertAttempt"
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO video_clip_attempts (user_id, clip_id, speaker, score) VALUES ($1::uuid, $2::uuid, $3, $4)`,
		userID, clipID, speaker, score); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تلاش")
	}
	return nil
}
