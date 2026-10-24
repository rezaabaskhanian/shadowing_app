package postgresinterview

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

// Question یک سؤال مصاحبه. AudioURL صدای مصاحبه‌گر است که ادمین از قبل می‌سازد.
type Question struct {
	ID             string   `json:"id"`
	Position       int      `json:"position"`
	Text           string   `json:"text"`
	TranslationFa  string   `json:"translation_fa"`
	AudioURL       string   `json:"audio_url"`
	PrepSeconds    int      `json:"prep_seconds"`
	AnswerSeconds  int      `json:"answer_seconds"`
	TipFa          string   `json:"tip_fa"`
	SampleAnswer   string   `json:"sample_answer"`
	SampleAnswerFa string   `json:"sample_answer_fa"`
	KeyPhrases     []string `json:"key_phrases"`
}

// Set یک مجموعه‌ی مصاحبه (کاری، پذیرش دانشگاه یا سفارت).
type Set struct {
	ID               string     `json:"id"`
	Kind             string     `json:"kind"`
	FieldKey         string     `json:"field_key"`
	Title            string     `json:"title"`
	TitleFa          string     `json:"title_fa"`
	DescriptionFa    string     `json:"description_fa"`
	Level            string     `json:"level"`
	ImageURL         string     `json:"image_url"`
	InterviewerVoice string     `json:"interviewer_voice"`
	Position         int        `json:"position"`
	IsActive         bool       `json:"is_active"`
	QuestionCount    int        `json:"question_count"`
	Questions        []Question `json:"questions,omitempty"`
}

// UserSet مجموعه به‌همراه خلاصه‌ی تلاش‌های همین کاربر (برای لیست اپ).
type UserSet struct {
	Set
	Attempts  int `json:"attempts"`
	BestScore int `json:"best_score"`
}

// Answer یک جواب ثبت‌شده. Review همان JSON کامل بررسی AI است.
type Answer struct {
	AttemptID       string
	QuestionID      string
	TryNo           int
	Transcript      string
	DurationSeconds int
	Score           int
	Review          any
}

// AnswerRow جواب ذخیره‌شده، برای ساختن گزارش آخر.
type AnswerRow struct {
	QuestionID      string          `json:"question_id"`
	TryNo           int             `json:"try_no"`
	Transcript      string          `json:"transcript"`
	DurationSeconds int             `json:"duration_seconds"`
	Score           int             `json:"score"`
	Review          json.RawMessage `json:"review"`
}

const setColumns = `s.id::text, s.kind, s.field_key, s.title, s.title_fa, s.description_fa, s.level,
	s.image_url, s.interviewer_voice, s.position, s.is_active,
	(SELECT COUNT(*) FROM interview_questions q WHERE q.set_id = s.id)`

func scanSet(row pgx.Row, s *Set, extra ...any) error {
	dest := append([]any{&s.ID, &s.Kind, &s.FieldKey, &s.Title, &s.TitleFa, &s.DescriptionFa, &s.Level,
		&s.ImageURL, &s.InterviewerVoice, &s.Position, &s.IsActive, &s.QuestionCount}, extra...)
	return row.Scan(dest...)
}

// ListAll همه‌ی مجموعه‌ها (فعال و غیرفعال) برای پنل ادمین، بدون سؤال‌ها.
func (r DB) ListAll(ctx context.Context) ([]Set, error) {
	const op = "postgresinterview.ListAll"
	rows, err := r.conn.Query(ctx, `SELECT `+setColumns+` FROM interview_sets s ORDER BY s.position, s.created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Set, 0)
	for rows.Next() {
		var s Set
		if err := scanSet(rows, &s); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// ListActiveForUser مجموعه‌های فعالِ دارای سؤال، با تعداد تلاش و بهترین امتیاز همین کاربر.
func (r DB) ListActiveForUser(ctx context.Context, userID string) ([]UserSet, error) {
	const op = "postgresinterview.ListActiveForUser"
	rows, err := r.conn.Query(ctx, `
		SELECT `+setColumns+`, COALESCE(a.attempts, 0), COALESCE(a.best_score, 0)
		FROM interview_sets s
		LEFT JOIN (
			SELECT set_id, COUNT(*) AS attempts, MAX(score) AS best_score
			FROM interview_attempts
			WHERE user_id = $1::uuid AND finished_at IS NOT NULL
			GROUP BY set_id
		) a ON a.set_id = s.id
		WHERE s.is_active AND EXISTS (SELECT 1 FROM interview_questions q WHERE q.set_id = s.id)
		ORDER BY s.position, s.created_at`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]UserSet, 0)
	for rows.Next() {
		var s UserSet
		if err := scanSet(rows, &s.Set, &s.Attempts, &s.BestScore); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, s)
	}
	return out, rows.Err()
}

// Get یک مجموعه با سؤال‌هایش (به ترتیب).
func (r DB) Get(ctx context.Context, id string) (Set, error) {
	const op = "postgresinterview.Get"
	var s Set
	err := scanSet(r.conn.QueryRow(ctx, `SELECT `+setColumns+` FROM interview_sets s WHERE s.id = $1::uuid`, id), &s)
	if errors.Is(err, pgx.ErrNoRows) {
		return Set{}, richerror.New(op).WithMessage("مصاحبه پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Set{}, richerror.New(op).WithErr(err)
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, position, text, translation_fa, audio_url, prep_seconds, answer_seconds,
			tip_fa, sample_answer, sample_answer_fa, key_phrases
		FROM interview_questions WHERE set_id = $1::uuid ORDER BY position`, id)
	if err != nil {
		return Set{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	s.Questions = make([]Question, 0)
	for rows.Next() {
		var q Question
		var phrases []byte
		if err := rows.Scan(&q.ID, &q.Position, &q.Text, &q.TranslationFa, &q.AudioURL, &q.PrepSeconds, &q.AnswerSeconds,
			&q.TipFa, &q.SampleAnswer, &q.SampleAnswerFa, &phrases); err != nil {
			return Set{}, richerror.New(op).WithErr(err)
		}
		q.KeyPhrases = []string{}
		_ = json.Unmarshal(phrases, &q.KeyPhrases)
		s.Questions = append(s.Questions, q)
	}
	return s, rows.Err()
}

func phrasesJSON(list []string) []byte {
	if list == nil {
		list = []string{}
	}
	b, _ := json.Marshal(list)
	return b
}

// Save مجموعه را می‌سازد (ID خالی) یا به‌روز می‌کند و سؤال‌ها را با فهرست داده‌شده
// هم‌گام می‌کند: سؤالِ دارای ID به‌روز می‌شود (تا جواب‌های قبلی کاربرها بمانند)،
// بدون ID ساخته می‌شود، و سؤالی که در فهرست نیست پاک می‌شود.
func (r DB) Save(ctx context.Context, s Set) (string, error) {
	const op = "postgresinterview.Save"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	defer func() { _ = tx.Rollback(ctx) }()

	if s.ID == "" {
		err = tx.QueryRow(ctx, `
			INSERT INTO interview_sets (kind, field_key, title, title_fa, description_fa, level, image_url, interviewer_voice, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id::text`,
			s.Kind, s.FieldKey, s.Title, s.TitleFa, s.DescriptionFa, s.Level, s.ImageURL, s.InterviewerVoice, s.Position, s.IsActive,
		).Scan(&s.ID)
	} else {
		var tag interface{ RowsAffected() int64 }
		tag, err = tx.Exec(ctx, `
			UPDATE interview_sets SET kind = $2, field_key = $3, title = $4, title_fa = $5, description_fa = $6, level = $7,
				image_url = $8, interviewer_voice = $9, position = $10, is_active = $11
			WHERE id = $1::uuid`,
			s.ID, s.Kind, s.FieldKey, s.Title, s.TitleFa, s.DescriptionFa, s.Level, s.ImageURL, s.InterviewerVoice, s.Position, s.IsActive)
		if err == nil && tag.RowsAffected() == 0 {
			return "", richerror.New(op).WithMessage("مصاحبه پیدا نشد").WithKind(richerror.KindNotFound)
		}
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}

	keep := make([]string, 0, len(s.Questions))
	for i, q := range s.Questions {
		q.Position = i
		if q.ID != "" {
			tag, err := tx.Exec(ctx, `
				UPDATE interview_questions SET position = $3, text = $4, translation_fa = $5, audio_url = $6, prep_seconds = $7,
					answer_seconds = $8, tip_fa = $9, sample_answer = $10, sample_answer_fa = $11, key_phrases = $12
				WHERE id = $1::uuid AND set_id = $2::uuid`,
				q.ID, s.ID, q.Position, q.Text, q.TranslationFa, q.AudioURL, q.PrepSeconds, q.AnswerSeconds,
				q.TipFa, q.SampleAnswer, q.SampleAnswerFa, phrasesJSON(q.KeyPhrases))
			if err != nil {
				return "", richerror.New(op).WithErr(err)
			}
			if tag.RowsAffected() > 0 {
				keep = append(keep, q.ID)
				continue
			}
		}
		var newID string
		if err := tx.QueryRow(ctx, `
			INSERT INTO interview_questions (set_id, position, text, translation_fa, audio_url, prep_seconds, answer_seconds,
				tip_fa, sample_answer, sample_answer_fa, key_phrases)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id::text`,
			s.ID, q.Position, q.Text, q.TranslationFa, q.AudioURL, q.PrepSeconds, q.AnswerSeconds,
			q.TipFa, q.SampleAnswer, q.SampleAnswerFa, phrasesJSON(q.KeyPhrases)).Scan(&newID); err != nil {
			return "", richerror.New(op).WithErr(err)
		}
		keep = append(keep, newID)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM interview_questions WHERE set_id = $1::uuid AND NOT (id::text = ANY($2))`, s.ID, keep); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	if err := tx.Commit(ctx); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return s.ID, nil
}

func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgresinterview.Delete"
	if _, err := r.conn.Exec(ctx, `DELETE FROM interview_sets WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// StartAttempt یک تلاش تازه برای کاربر می‌سازد.
func (r DB) StartAttempt(ctx context.Context, userID, setID string) (string, error) {
	const op = "postgresinterview.StartAttempt"
	var id string
	if err := r.conn.QueryRow(ctx, `INSERT INTO interview_attempts (user_id, set_id) VALUES ($1::uuid, $2::uuid) RETURNING id::text`,
		userID, setID).Scan(&id); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return id, nil
}

// AttemptOwner مجموعه و وضعیت پایانِ یک تلاشِ همین کاربر؛ تلاشِ کاربر دیگر «پیدا نشد» است.
func (r DB) AttemptOwner(ctx context.Context, attemptID, userID string) (setID string, finished bool, err error) {
	const op = "postgresinterview.AttemptOwner"
	err = r.conn.QueryRow(ctx, `SELECT set_id::text, finished_at IS NOT NULL FROM interview_attempts WHERE id = $1::uuid AND user_id = $2::uuid`,
		attemptID, userID).Scan(&setID, &finished)
	if errors.Is(err, pgx.ErrNoRows) {
		return "", false, richerror.New(op).WithMessage("این مصاحبه پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return "", false, richerror.New(op).WithErr(err)
	}
	return setID, finished, nil
}

// NextTryNo شماره‌ی تلاش بعدی برای یک سؤال در یک مصاحبه.
func (r DB) NextTryNo(ctx context.Context, attemptID, questionID string) (int, error) {
	const op = "postgresinterview.NextTryNo"
	var n int
	if err := r.conn.QueryRow(ctx, `SELECT COALESCE(MAX(try_no), 0) + 1 FROM interview_answers WHERE attempt_id = $1::uuid AND question_id = $2::uuid`,
		attemptID, questionID).Scan(&n); err != nil {
		return 0, richerror.New(op).WithErr(err)
	}
	return n, nil
}

func (r DB) InsertAnswer(ctx context.Context, a Answer) error {
	const op = "postgresinterview.InsertAnswer"
	review, _ := json.Marshal(a.Review)
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO interview_answers (attempt_id, question_id, try_no, transcript, duration_seconds, score, review)
		VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7)`,
		a.AttemptID, a.QuestionID, a.TryNo, a.Transcript, a.DurationSeconds, a.Score, review); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// Answers همه‌ی جواب‌های یک تلاش، به ترتیب سؤال و شماره‌ی تلاش.
func (r DB) Answers(ctx context.Context, attemptID string) ([]AnswerRow, error) {
	const op = "postgresinterview.Answers"
	rows, err := r.conn.Query(ctx, `
		SELECT a.question_id::text, a.try_no, a.transcript, a.duration_seconds, a.score, a.review
		FROM interview_answers a JOIN interview_questions q ON q.id = a.question_id
		WHERE a.attempt_id = $1::uuid ORDER BY q.position, a.try_no`, attemptID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]AnswerRow, 0)
	for rows.Next() {
		var a AnswerRow
		if err := rows.Scan(&a.QuestionID, &a.TryNo, &a.Transcript, &a.DurationSeconds, &a.Score, &a.Review); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

// FinishAttempt تلاش را با امتیاز و گزارش آخر می‌بندد.
func (r DB) FinishAttempt(ctx context.Context, attemptID string, score int, report any) error {
	const op = "postgresinterview.FinishAttempt"
	b, _ := json.Marshal(report)
	if _, err := r.conn.Exec(ctx, `UPDATE interview_attempts SET finished_at = NOW(), score = $2, report = $3 WHERE id = $1::uuid`,
		attemptID, score, b); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
