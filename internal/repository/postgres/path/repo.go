package postgrespath

import (
	"context"
	"encoding/json"
	"errors"
	"time"

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

// Item یک قدم از یک جلسه: ارجاع به محتوای موجود (scene/podcast/video_clip/
// speaking_topic) یا یک قدم بدون ارجاع (leitner_review/weak_lines/checkpoint).
type Item struct {
	Key      string `json:"key"`
	Kind     string `json:"kind"`
	RefID    string `json:"ref_id,omitempty"`
	Title    string `json:"title,omitempty"`
	Required bool   `json:"required"`
	Minutes  int    `json:"minutes,omitempty"`
	NoteFa   string `json:"note_fa,omitempty"`

	Done bool `json:"done"`
}

type Session struct {
	No      int    `json:"no"`
	TitleFa string `json:"title_fa"`
	Items   []Item `json:"items"`

	Done     bool `json:"done"`
	Unlocked bool `json:"unlocked"`
}

type Week struct {
	ID         string          `json:"id"`
	PathID     string          `json:"path_id,omitempty"`
	Position   int             `json:"position"`
	TitleFa    string          `json:"title_fa"`
	GoalFa     string          `json:"goal_fa"`
	CanDo      []string        `json:"can_do"`
	Sessions   []Session       `json:"sessions"`
	Checkpoint json.RawMessage `json:"checkpoint,omitempty"`
	IsFree     bool            `json:"is_free"`

	// فقط در نمای کاربر پر می‌شوند.
	Unlocked       bool `json:"unlocked"`
	Done           bool `json:"done"`
	CheckpointDone bool `json:"checkpoint_done"`
	BestScore      *int `json:"best_score,omitempty"`
}

type Path struct {
	ID            string `json:"id"`
	Level         string `json:"level"`
	TitleFa       string `json:"title_fa"`
	DescriptionFa string `json:"description_fa"`
	GoalFa        string `json:"goal_fa"`
	Position      int    `json:"position"`
	IsActive      bool   `json:"is_active"`
	Weeks         []Week `json:"weeks,omitempty"`
}

func (r DB) ListPaths(ctx context.Context, activeOnly bool) ([]Path, error) {
	const op = "postgrespath.ListPaths"
	filter := ""
	if activeOnly {
		filter = "WHERE is_active"
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, level, title_fa, description_fa, goal_fa, position, is_active
		FROM learning_paths `+filter+`
		ORDER BY position, created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := make([]Path, 0)
	for rows.Next() {
		var p Path
		if err := rows.Scan(&p.ID, &p.Level, &p.TitleFa, &p.DescriptionFa, &p.GoalFa, &p.Position, &p.IsActive); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, p)
	}
	return out, rows.Err()
}

// GetPathByLevel مسیر یک سطح با همه‌ی هفته‌ها (شامل جلسه‌ها و محتوای Checkpoint).
func (r DB) GetPathByLevel(ctx context.Context, level string) (Path, error) {
	const op = "postgrespath.GetPathByLevel"
	var p Path
	err := r.conn.QueryRow(ctx, `
		SELECT id::text, level, title_fa, description_fa, goal_fa, position, is_active
		FROM learning_paths WHERE level = $1`, level).
		Scan(&p.ID, &p.Level, &p.TitleFa, &p.DescriptionFa, &p.GoalFa, &p.Position, &p.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return Path{}, richerror.New(op).WithMessage("مسیر پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Path{}, richerror.New(op).WithErr(err)
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, path_id::text, position, title_fa, goal_fa, can_do, sessions, checkpoint, is_free
		FROM path_weeks WHERE path_id = $1 ORDER BY position`, p.ID)
	if err != nil {
		return Path{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		w, err := scanWeek(rows)
		if err != nil {
			return Path{}, richerror.New(op).WithErr(err)
		}
		p.Weeks = append(p.Weeks, w)
	}
	return p, rows.Err()
}

func (r DB) GetWeek(ctx context.Context, id string) (Week, error) {
	const op = "postgrespath.GetWeek"
	row := r.conn.QueryRow(ctx, `
		SELECT id::text, path_id::text, position, title_fa, goal_fa, can_do, sessions, checkpoint, is_free
		FROM path_weeks WHERE id = $1`, id)
	w, err := scanWeek(row)
	if errors.Is(err, pgx.ErrNoRows) {
		return Week{}, richerror.New(op).WithMessage("هفته پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Week{}, richerror.New(op).WithErr(err)
	}
	return w, nil
}

func scanWeek(row pgx.Row) (Week, error) {
	var w Week
	var canDo, sessions, checkpoint []byte
	if err := row.Scan(&w.ID, &w.PathID, &w.Position, &w.TitleFa, &w.GoalFa, &canDo, &sessions, &checkpoint, &w.IsFree); err != nil {
		return Week{}, err
	}
	if err := json.Unmarshal(canDo, &w.CanDo); err != nil {
		return Week{}, err
	}
	if err := json.Unmarshal(sessions, &w.Sessions); err != nil {
		return Week{}, err
	}
	w.Checkpoint = checkpoint
	return w, nil
}

// UpsertPath مسیر را بر اساس level ذخیره می‌کند. هفته‌ها بر اساس position
// به‌روز می‌شوند (نه حذف و ساخت دوباره) تا پیشرفت کاربرها که به week_id وصل
// است بماند؛ هفته‌هایی که دیگر در ورودی نیستند حذف می‌شوند.
func (r DB) UpsertPath(ctx context.Context, p Path) (string, error) {
	const op = "postgrespath.UpsertPath"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	var id string
	err = tx.QueryRow(ctx, `
		INSERT INTO learning_paths (level, title_fa, description_fa, goal_fa, position, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (level) DO UPDATE SET title_fa = EXCLUDED.title_fa, description_fa = EXCLUDED.description_fa,
			goal_fa = EXCLUDED.goal_fa, position = EXCLUDED.position, is_active = EXCLUDED.is_active, updated_at = now()
		RETURNING id::text`, p.Level, p.TitleFa, p.DescriptionFa, p.GoalFa, p.Position, p.IsActive).Scan(&id)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}

	positions := make([]int, 0, len(p.Weeks))
	for _, w := range p.Weeks {
		canDo, _ := json.Marshal(w.CanDo)
		sessions, _ := json.Marshal(w.Sessions)
		checkpoint := w.Checkpoint
		if len(checkpoint) == 0 {
			checkpoint = json.RawMessage("{}")
		}
		if _, err := tx.Exec(ctx, `
			INSERT INTO path_weeks (path_id, position, title_fa, goal_fa, can_do, sessions, checkpoint, is_free)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (path_id, position) DO UPDATE SET title_fa = EXCLUDED.title_fa, goal_fa = EXCLUDED.goal_fa,
				can_do = EXCLUDED.can_do, sessions = EXCLUDED.sessions, checkpoint = EXCLUDED.checkpoint, is_free = EXCLUDED.is_free`,
			id, w.Position, w.TitleFa, w.GoalFa, canDo, sessions, []byte(checkpoint), w.IsFree); err != nil {
			return "", richerror.New(op).WithErr(err)
		}
		positions = append(positions, w.Position)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM path_weeks WHERE path_id = $1 AND NOT (position = ANY($2))`, id, positions); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	if err := tx.Commit(ctx); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return id, nil
}

func (r DB) SetCheckpoint(ctx context.Context, weekID string, checkpoint json.RawMessage) error {
	const op = "postgrespath.SetCheckpoint"
	if _, err := r.conn.Exec(ctx, `UPDATE path_weeks SET checkpoint = $2 WHERE id = $1`, weekID, []byte(checkpoint)); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// SetActive مسیر یک سطح را برای کاربرها فعال یا غیرفعال می‌کند.
func (r DB) SetActive(ctx context.Context, level string, active bool) error {
	const op = "postgrespath.SetActive"
	tag, err := r.conn.Exec(ctx, `UPDATE learning_paths SET is_active = $2, updated_at = now() WHERE level = $1`, level, active)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	if tag.RowsAffected() == 0 {
		return richerror.New(op).WithMessage("مسیر پیدا نشد").WithKind(richerror.KindNotFound)
	}
	return nil
}

// DoneItems کلید قدم‌های تمام‌شده‌ی کاربر، به تفکیک هفته.
func (r DB) DoneItems(ctx context.Context, userID string, weekIDs []string) (map[string]map[string]bool, error) {
	const op = "postgrespath.DoneItems"
	out := map[string]map[string]bool{}
	if len(weekIDs) == 0 {
		return out, nil
	}
	rows, err := r.conn.Query(ctx, `
		SELECT week_id::text, item_key FROM user_path_items
		WHERE user_id = $1 AND week_id = ANY($2::uuid[])`, userID, weekIDs)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var weekID, key string
		if err := rows.Scan(&weekID, &key); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if out[weekID] == nil {
			out[weekID] = map[string]bool{}
		}
		out[weekID][key] = true
	}
	return out, rows.Err()
}

// CompletedScenes از بین sceneIDs، صحنه‌هایی که کاربر تمام کرده (در هر جای اپ).
func (r DB) CompletedScenes(ctx context.Context, userID string, sceneIDs []string) (map[string]bool, error) {
	const op = "postgrespath.CompletedScenes"
	out := map[string]bool{}
	if len(sceneIDs) == 0 {
		return out, nil
	}
	rows, err := r.conn.Query(ctx, `
		SELECT scene_id::text FROM scene_progress
		WHERE user_id = $1 AND scene_id = ANY($2::uuid[]) AND is_completed`, userID, sceneIDs)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[id] = true
	}
	return out, rows.Err()
}

func (r DB) MarkItem(ctx context.Context, userID, weekID, key string) error {
	const op = "postgrespath.MarkItem"
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO user_path_items (user_id, week_id, item_key) VALUES ($1, $2, $3)
		ON CONFLICT DO NOTHING`, userID, weekID, key); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (r DB) SaveCheckpointResult(ctx context.Context, userID, weekID string, scores map[string]int, total int) error {
	const op = "postgrespath.SaveCheckpointResult"
	b, _ := json.Marshal(scores)
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO user_checkpoint_results (user_id, week_id, scores, total) VALUES ($1, $2, $3, $4)`,
		userID, weekID, b, total); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// BestCheckpoints بهترین نمره‌ی کل Checkpoint کاربر در هر هفته.
func (r DB) BestCheckpoints(ctx context.Context, userID string, weekIDs []string) (map[string]int, error) {
	const op = "postgrespath.BestCheckpoints"
	out := map[string]int{}
	if len(weekIDs) == 0 {
		return out, nil
	}
	rows, err := r.conn.Query(ctx, `
		SELECT week_id::text, MAX(total) FROM user_checkpoint_results
		WHERE user_id = $1 AND week_id = ANY($2::uuid[]) GROUP BY week_id`, userID, weekIDs)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var best int
		if err := rows.Scan(&id, &best); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[id] = best
	}
	return out, rows.Err()
}

// SelfIntro آمار یک ضبط «قبل» یا «بعد» (خودِ صدا روی گوشی کاربر است).
type SelfIntro struct {
	Stage           string    `json:"stage"`
	Transcript      string    `json:"transcript"`
	DurationSeconds int       `json:"duration_seconds"`
	WordCount       int       `json:"word_count"`
	UniqueWords     int       `json:"unique_words"`
	CreatedAt       time.Time `json:"created_at"`
}

func (r DB) SaveSelfIntro(ctx context.Context, userID, level string, in SelfIntro) error {
	const op = "postgrespath.SaveSelfIntro"
	if _, err := r.conn.Exec(ctx, `
		INSERT INTO user_self_intros (user_id, level, stage, transcript, duration_seconds, word_count, unique_words)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, level, stage) DO UPDATE SET transcript = EXCLUDED.transcript,
			duration_seconds = EXCLUDED.duration_seconds, word_count = EXCLUDED.word_count,
			unique_words = EXCLUDED.unique_words, created_at = now()`,
		userID, level, in.Stage, in.Transcript, in.DurationSeconds, in.WordCount, in.UniqueWords); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// SelfIntros ضبط‌های «قبل» و «بعد» کاربر در یک سطح، به تفکیک مرحله.
func (r DB) SelfIntros(ctx context.Context, userID, level string) (map[string]SelfIntro, error) {
	const op = "postgrespath.SelfIntros"
	rows, err := r.conn.Query(ctx, `
		SELECT stage, transcript, duration_seconds, word_count, unique_words, created_at
		FROM user_self_intros WHERE user_id = $1 AND level = $2`, userID, level)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := map[string]SelfIntro{}
	for rows.Next() {
		var s SelfIntro
		if err := rows.Scan(&s.Stage, &s.Transcript, &s.DurationSeconds, &s.WordCount, &s.UniqueWords, &s.CreatedAt); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[s.Stage] = s
	}
	return out, rows.Err()
}
