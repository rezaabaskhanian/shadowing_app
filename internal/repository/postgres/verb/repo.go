package postgresverb

import (
	"context"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Verb struct {
	ID          uuid.UUID `json:"id"`
	Lemma       string    `json:"lemma"`
	Forms       []string  `json:"forms"`
	SortOrder   int       `json:"sort_order"`
	IsPublished bool      `json:"is_published"`
}

type Meaning struct {
	ID               uuid.UUID `json:"id"`
	VerbID           uuid.UUID `json:"verb_id"`
	MeaningFa        string    `json:"meaning_fa"`
	ExplanationFa    string    `json:"explanation_fa"`
	FallbackExample  string    `json:"fallback_example"`
	PracticePromptFa string    `json:"practice_prompt_fa"`
	SortOrder        int       `json:"sort_order"`
}

// Occurrence یک جمله از یک درس که فعل در آن آمده. DialogueID/AudioURL از
// جفت‌کردن متن با دیالوگ فعلی صحنه پر می‌شوند؛ اگر متن دیالوگ عوض شده باشد
// خالی‌اند (جمله دیگر در درس نیست).
type Occurrence struct {
	ID          uuid.UUID  `json:"id"`
	VerbID      uuid.UUID  `json:"verb_id"`
	MeaningID   *uuid.UUID `json:"meaning_id"`
	SceneID     uuid.UUID  `json:"scene_id"`
	SceneTitle  string     `json:"scene_title"`
	Sentence    string     `json:"sentence"`
	MatchedForm string     `json:"matched_form"`
	Status      string     `json:"status"`
	DialogueID  string     `json:"dialogue_id"`
	AudioURL    string     `json:"audio_url"`
	Translation string     `json:"translation"`
}

// SceneSentence یک جمله‌ی دیالوگ برای جست‌وجوی شکل‌های فعل.
type SceneSentence struct {
	SceneID  uuid.UUID
	Sentence string
}

type Progress struct {
	MeaningID           uuid.UUID
	SeenAt              *time.Time
	RecognitionCorrect  int
	LastRecognitionDate *time.Time
	SpokenOK            bool
	// LeitnerLevel بالاترین سطح کارت لایتنرِ این معنا (۰ = کارتی ندارد)
	LeitnerLevel int
}

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

// ---------- افعال ----------

const verbColumns = `id, lemma, forms, sort_order, is_published`

func scanVerb(row pgx.Row) (Verb, error) {
	var v Verb
	err := row.Scan(&v.ID, &v.Lemma, &v.Forms, &v.SortOrder, &v.IsPublished)
	return v, err
}

func (d DB) ListVerbs(ctx context.Context, onlyPublished bool) ([]Verb, error) {
	const op = "postgresverb.ListVerbs"
	query := `SELECT ` + verbColumns + ` FROM verbs`
	if onlyPublished {
		query += ` WHERE is_published`
	}
	query += ` ORDER BY sort_order, lemma`
	rows, err := d.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	var list []Verb
	for rows.Next() {
		v, err := scanVerb(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, v)
	}
	return list, rows.Err()
}

func (d DB) GetVerb(ctx context.Context, id uuid.UUID) (Verb, error) {
	const op = "postgresverb.GetVerb"
	v, err := scanVerb(d.conn.QueryRow(ctx, `SELECT `+verbColumns+` FROM verbs WHERE id = $1`, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return Verb{}, richerror.New(op).WithMessage("فعل پیدا نشد").WithKind(richerror.KindNotFound)
		}
		return Verb{}, richerror.New(op).WithErr(err)
	}
	return v, nil
}

func (d DB) CreateVerb(ctx context.Context, v Verb) (Verb, error) {
	const op = "postgresverb.CreateVerb"
	created, err := scanVerb(d.conn.QueryRow(ctx, `
		INSERT INTO verbs (lemma, forms, sort_order, is_published) VALUES ($1, $2, $3, $4)
		RETURNING `+verbColumns, v.Lemma, v.Forms, v.SortOrder, v.IsPublished))
	if err != nil {
		return Verb{}, richerror.New(op).WithErr(err).WithMessage("ساخت فعل ناموفق بود (شاید تکراری است)").WithKind(richerror.KindInvalid)
	}
	return created, nil
}

func (d DB) UpdateVerb(ctx context.Context, v Verb) error {
	const op = "postgresverb.UpdateVerb"
	_, err := d.conn.Exec(ctx, `
		UPDATE verbs SET lemma = $2, forms = $3, sort_order = $4, is_published = $5, updated_at = now()
		WHERE id = $1`, v.ID, v.Lemma, v.Forms, v.SortOrder, v.IsPublished)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("ویرایش فعل ناموفق بود").WithKind(richerror.KindInvalid)
	}
	return nil
}

func (d DB) DeleteVerb(ctx context.Context, id uuid.UUID) error {
	const op = "postgresverb.DeleteVerb"
	if _, err := d.conn.Exec(ctx, `DELETE FROM verbs WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// ---------- معناها ----------

const meaningColumns = `id, verb_id, meaning_fa, explanation_fa, fallback_example, practice_prompt_fa, sort_order`

func scanMeaning(row pgx.Row) (Meaning, error) {
	var m Meaning
	err := row.Scan(&m.ID, &m.VerbID, &m.MeaningFa, &m.ExplanationFa, &m.FallbackExample, &m.PracticePromptFa, &m.SortOrder)
	return m, err
}

func (d DB) ListMeanings(ctx context.Context, verbID uuid.UUID) ([]Meaning, error) {
	const op = "postgresverb.ListMeanings"
	rows, err := d.conn.Query(ctx, `SELECT `+meaningColumns+` FROM verb_meanings WHERE verb_id = $1 ORDER BY sort_order, created_at`, verbID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	var list []Meaning
	for rows.Next() {
		m, err := scanMeaning(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, m)
	}
	return list, rows.Err()
}

func (d DB) GetMeaning(ctx context.Context, id uuid.UUID) (Meaning, error) {
	const op = "postgresverb.GetMeaning"
	m, err := scanMeaning(d.conn.QueryRow(ctx, `SELECT `+meaningColumns+` FROM verb_meanings WHERE id = $1`, id))
	if err != nil {
		if err == pgx.ErrNoRows {
			return Meaning{}, richerror.New(op).WithMessage("معنا پیدا نشد").WithKind(richerror.KindNotFound)
		}
		return Meaning{}, richerror.New(op).WithErr(err)
	}
	return m, nil
}

func (d DB) CreateMeaning(ctx context.Context, m Meaning) (Meaning, error) {
	const op = "postgresverb.CreateMeaning"
	created, err := scanMeaning(d.conn.QueryRow(ctx, `
		INSERT INTO verb_meanings (verb_id, meaning_fa, explanation_fa, fallback_example, practice_prompt_fa, sort_order)
		VALUES ($1, $2, $3, $4, $5, $6) RETURNING `+meaningColumns,
		m.VerbID, m.MeaningFa, m.ExplanationFa, m.FallbackExample, m.PracticePromptFa, m.SortOrder))
	if err != nil {
		return Meaning{}, richerror.New(op).WithErr(err)
	}
	return created, nil
}

func (d DB) UpdateMeaning(ctx context.Context, m Meaning) error {
	const op = "postgresverb.UpdateMeaning"
	_, err := d.conn.Exec(ctx, `
		UPDATE verb_meanings SET meaning_fa = $2, explanation_fa = $3, fallback_example = $4,
			practice_prompt_fa = $5, sort_order = $6, updated_at = now()
		WHERE id = $1`, m.ID, m.MeaningFa, m.ExplanationFa, m.FallbackExample, m.PracticePromptFa, m.SortOrder)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (d DB) DeleteMeaning(ctx context.Context, id uuid.UUID) error {
	const op = "postgresverb.DeleteMeaning"
	if _, err := d.conn.Exec(ctx, `DELETE FROM verb_meanings WHERE id = $1`, id); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// ---------- جمله‌های درس‌ها ----------

// occurrenceSelect جمله را با دیالوگ فعلیِ همان صحنه که همین متن را دارد جفت
// می‌کند (LEFT JOIN — اگر متن عوض شده، dialogue_id خالی می‌ماند).
const occurrenceSelect = `
	SELECT DISTINCT ON (o.id)
		o.id, o.verb_id, o.meaning_id, o.scene_id, s.title, o.sentence, o.matched_form, o.status,
		COALESCE(d.id::text, '') AS dialogue_id, COALESCE(d.audio_url, '') AS audio_url, COALESCE(d.translation, '') AS translation
	FROM verb_occurrences o
	JOIN scenes s ON s.id = o.scene_id
	LEFT JOIN hotspots h ON h.scene_id = o.scene_id
	LEFT JOIN dialogues d ON d.hotspot_id = h.id AND d.original_text = o.sentence`

func scanOccurrences(rows pgx.Rows) ([]Occurrence, error) {
	defer rows.Close()
	var list []Occurrence
	for rows.Next() {
		var o Occurrence
		if err := rows.Scan(&o.ID, &o.VerbID, &o.MeaningID, &o.SceneID, &o.SceneTitle, &o.Sentence, &o.MatchedForm, &o.Status,
			&o.DialogueID, &o.AudioURL, &o.Translation); err != nil {
			return nil, err
		}
		list = append(list, o)
	}
	return list, rows.Err()
}

// ListOccurrences همه‌ی جمله‌های یک فعل (همه‌ی وضعیت‌ها) برای پنل ادمین.
func (d DB) ListOccurrences(ctx context.Context, verbID uuid.UUID) ([]Occurrence, error) {
	const op = "postgresverb.ListOccurrences"
	rows, err := d.conn.Query(ctx, occurrenceSelect+` WHERE o.verb_id = $1 ORDER BY o.id, d.id`, verbID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	list, err := scanOccurrences(rows)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	return list, nil
}

// ApprovedOccurrences جمله‌های تأییدشده‌ی یک فعل در صحنه‌های منتشرشده که
// هنوز در درس هستند (برای اپ).
func (d DB) ApprovedOccurrences(ctx context.Context, verbID uuid.UUID) ([]Occurrence, error) {
	const op = "postgresverb.ApprovedOccurrences"
	rows, err := d.conn.Query(ctx, `SELECT * FROM (`+occurrenceSelect+`
		WHERE o.verb_id = $1 AND o.status = 'approved' AND o.meaning_id IS NOT NULL AND s.status = 'published'
		ORDER BY o.id, d.id) x WHERE x.dialogue_id <> ''`, verbID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	list, err := scanOccurrences(rows)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	return list, nil
}

// SceneTags جمله‌های تأییدشده‌ی یک صحنه (فقط افعال منتشرشده) برای نشانه‌گذاری داخل درس.
func (d DB) SceneTags(ctx context.Context, sceneID uuid.UUID) ([]Occurrence, error) {
	const op = "postgresverb.SceneTags"
	rows, err := d.conn.Query(ctx, occurrenceSelect+`
		JOIN verbs v ON v.id = o.verb_id
		WHERE o.scene_id = $1 AND o.status = 'approved' AND o.meaning_id IS NOT NULL AND v.is_published
		ORDER BY o.id, d.id`, sceneID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	list, err := scanOccurrences(rows)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	return list, nil
}

// SceneSentences همه‌ی جمله‌های دیالوگ‌ها (اختیاری: فقط یک صحنه) برای جست‌وجو.
func (d DB) SceneSentences(ctx context.Context, sceneID *uuid.UUID) ([]SceneSentence, error) {
	const op = "postgresverb.SceneSentences"
	query := `SELECT DISTINCT h.scene_id, d.original_text FROM dialogues d JOIN hotspots h ON h.id = d.hotspot_id`
	args := []any{}
	if sceneID != nil {
		query += ` WHERE h.scene_id = $1`
		args = append(args, *sceneID)
	}
	rows, err := d.conn.Query(ctx, query, args...)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	var list []SceneSentence
	for rows.Next() {
		var s SceneSentence
		if err := rows.Scan(&s.SceneID, &s.Sentence); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, s)
	}
	return list, rows.Err()
}

// ExistingSentences کلیدهای (scene_id|sentence) که برای این فعل از قبل ثبت شده‌اند.
func (d DB) ExistingSentences(ctx context.Context, verbID uuid.UUID) (map[string]bool, error) {
	const op = "postgresverb.ExistingSentences"
	rows, err := d.conn.Query(ctx, `SELECT scene_id, sentence FROM verb_occurrences WHERE verb_id = $1`, verbID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	seen := map[string]bool{}
	for rows.Next() {
		var sceneID uuid.UUID
		var sentence string
		if err := rows.Scan(&sceneID, &sentence); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		seen[sceneID.String()+"|"+sentence] = true
	}
	return seen, rows.Err()
}

func (d DB) InsertSuggestion(ctx context.Context, verbID uuid.UUID, meaningID *uuid.UUID, sceneID uuid.UUID, sentence, form string) error {
	const op = "postgresverb.InsertSuggestion"
	_, err := d.conn.Exec(ctx, `
		INSERT INTO verb_occurrences (verb_id, meaning_id, scene_id, sentence, matched_form)
		VALUES ($1, $2, $3, $4, $5) ON CONFLICT (verb_id, scene_id, sentence) DO NOTHING`,
		verbID, meaningID, sceneID, sentence, form)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (d DB) UpdateOccurrence(ctx context.Context, id uuid.UUID, status string, meaningID *uuid.UUID) error {
	const op = "postgresverb.UpdateOccurrence"
	_, err := d.conn.Exec(ctx, `UPDATE verb_occurrences SET status = $2, meaning_id = $3, updated_at = now() WHERE id = $1`,
		id, status, meaningID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}
	return nil
}

// ---------- پیشرفت کاربر ----------

// UserProgress پیشرفت کاربر در همه‌ی معناهای فعل‌های داده‌شده (کلید = meaning_id)،
// همراه با بالاترین سطح کارت لایتنر هر معنا.
func (d DB) UserProgress(ctx context.Context, userID uuid.UUID) (map[uuid.UUID]Progress, error) {
	const op = "postgresverb.UserProgress"
	rows, err := d.conn.Query(ctx, `
		SELECT m.id, p.seen_at, COALESCE(p.recognition_correct, 0), p.last_recognition_date, COALESCE(p.spoken_ok, false),
			COALESCE((SELECT MAX(level) FROM leitner_words lw WHERE lw.user_id = $1 AND lw.verb_meaning_id = m.id), 0)
		FROM verb_meanings m
		LEFT JOIN user_verb_progress p ON p.meaning_id = m.id AND p.user_id = $1`, userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := map[uuid.UUID]Progress{}
	for rows.Next() {
		var p Progress
		if err := rows.Scan(&p.MeaningID, &p.SeenAt, &p.RecognitionCorrect, &p.LastRecognitionDate, &p.SpokenOK, &p.LeitnerLevel); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[p.MeaningID] = p
	}
	return out, rows.Err()
}

func (d DB) MarkSeen(ctx context.Context, userID, meaningID uuid.UUID) error {
	const op = "postgresverb.MarkSeen"
	_, err := d.conn.Exec(ctx, `
		INSERT INTO user_verb_progress (user_id, meaning_id, seen_at) VALUES ($1, $2, now())
		ON CONFLICT (user_id, meaning_id) DO UPDATE SET seen_at = COALESCE(user_verb_progress.seen_at, now()), updated_at = now()`,
		userID, meaningID)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// RecordRecognitionCorrect یک جواب درست آزمون تشخیص را ثبت می‌کند — حداکثر
// یکی در روز شمرده می‌شود تا حدس‌زدن پشت‌سرهم «یادگرفتن» حساب نشود.
func (d DB) RecordRecognitionCorrect(ctx context.Context, userID, meaningID uuid.UUID) error {
	const op = "postgresverb.RecordRecognitionCorrect"
	_, err := d.conn.Exec(ctx, `
		INSERT INTO user_verb_progress (user_id, meaning_id, seen_at, recognition_correct, last_recognition_date)
		VALUES ($1, $2, now(), 1, CURRENT_DATE)
		ON CONFLICT (user_id, meaning_id) DO UPDATE SET
			recognition_correct = user_verb_progress.recognition_correct +
				CASE WHEN user_verb_progress.last_recognition_date IS DISTINCT FROM CURRENT_DATE THEN 1 ELSE 0 END,
			last_recognition_date = CURRENT_DATE,
			seen_at = COALESCE(user_verb_progress.seen_at, now()),
			updated_at = now()`, userID, meaningID)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (d DB) MarkSpokenOK(ctx context.Context, userID, meaningID uuid.UUID) error {
	const op = "postgresverb.MarkSpokenOK"
	_, err := d.conn.Exec(ctx, `
		INSERT INTO user_verb_progress (user_id, meaning_id, seen_at, spoken_ok) VALUES ($1, $2, now(), true)
		ON CONFLICT (user_id, meaning_id) DO UPDATE SET spoken_ok = true,
			seen_at = COALESCE(user_verb_progress.seen_at, now()), updated_at = now()`, userID, meaningID)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
