package postgrescourse

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

type Unit struct {
	ID            string   `json:"id"`
	TitleFa       string   `json:"title_fa"`
	TitleEn       string   `json:"title_en"`
	Emoji         string   `json:"emoji"`
	DescriptionFa string   `json:"description_fa"`
	Position      int      `json:"position"`
	IsActive      bool     `json:"is_active"`
	Lessons       []Lesson `json:"lessons"`
}

type Lesson struct {
	ID        string `json:"id"`
	UnitID    string `json:"unit_id"`
	TitleFa   string `json:"title_fa"`
	TitleEn   string `json:"title_en"`
	Emoji     string `json:"emoji"`
	GoalFa    string `json:"goal_fa"`
	Position  int    `json:"position"`
	IsActive  bool   `json:"is_active"`
	ItemCount int    `json:"item_count"`
	Items     []Item `json:"items,omitempty"`

	// فقط در نمای کاربر پر می‌شوند.
	Stars     int  `json:"stars"`
	Completed bool `json:"completed"`
	Unlocked  bool `json:"unlocked"`
}

type Item struct {
	ID        string `json:"id,omitempty"`
	Position  int    `json:"position"`
	TextEn    string `json:"text_en"`
	MeaningFa string `json:"meaning_fa"`
	Emoji     string `json:"emoji"`
	ImageURL  string `json:"image_url"`
	AudioURL  string `json:"audio_url"`
	TipFa     string `json:"tip_fa"`
}

// Tree همه‌ی فصل‌ها با درس‌هایشان (بدون کارت‌ها). activeOnly برای اپ؛ userID
// (اختیاری) ستاره/پایان هر درس را برای همان کاربر پر می‌کند.
func (r DB) Tree(ctx context.Context, activeOnly bool, userID string) ([]Unit, error) {
	const op = "postgrescourse.Tree"
	filter := ""
	if activeOnly {
		filter = "WHERE u.is_active"
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, title_fa, title_en, emoji, description_fa, position, is_active
		FROM course_units u `+filter+`
		ORDER BY position, created_at`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	units := make([]Unit, 0)
	index := map[string]int{}
	for rows.Next() {
		var u Unit
		if err := rows.Scan(&u.ID, &u.TitleFa, &u.TitleEn, &u.Emoji, &u.DescriptionFa, &u.Position, &u.IsActive); err != nil {
			rows.Close()
			return nil, richerror.New(op).WithErr(err)
		}
		u.Lessons = []Lesson{}
		index[u.ID] = len(units)
		units = append(units, u)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	lessonFilter := ""
	if activeOnly {
		lessonFilter = "WHERE l.is_active"
	}
	var uid any
	if userID != "" {
		uid = userID
	}
	lrows, err := r.conn.Query(ctx, `
		SELECT l.id::text, l.unit_id::text, l.title_fa, l.title_en, l.emoji, l.goal_fa, l.position, l.is_active,
			(SELECT COUNT(*) FROM course_items i WHERE i.lesson_id = l.id),
			COALESCE(p.stars, 0), p.user_id IS NOT NULL
		FROM course_lessons l
		LEFT JOIN course_progress p ON p.lesson_id = l.id AND p.user_id = $1::uuid
		`+lessonFilter+`
		ORDER BY l.position, l.created_at`, uid)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer lrows.Close()
	for lrows.Next() {
		var l Lesson
		if err := lrows.Scan(&l.ID, &l.UnitID, &l.TitleFa, &l.TitleEn, &l.Emoji, &l.GoalFa, &l.Position, &l.IsActive,
			&l.ItemCount, &l.Stars, &l.Completed); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		if i, ok := index[l.UnitID]; ok {
			units[i].Lessons = append(units[i].Lessons, l)
		}
	}
	return units, lrows.Err()
}

// GetLesson یک درس با کارت‌هایش.
func (r DB) GetLesson(ctx context.Context, id string) (Lesson, error) {
	const op = "postgrescourse.GetLesson"
	var l Lesson
	err := r.conn.QueryRow(ctx, `
		SELECT id::text, unit_id::text, title_fa, title_en, emoji, goal_fa, position, is_active
		FROM course_lessons WHERE id = $1::uuid`, id).
		Scan(&l.ID, &l.UnitID, &l.TitleFa, &l.TitleEn, &l.Emoji, &l.GoalFa, &l.Position, &l.IsActive)
	if errors.Is(err, pgx.ErrNoRows) {
		return Lesson{}, richerror.New(op).WithErr(err).WithMessage("درس پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return Lesson{}, richerror.New(op).WithErr(err)
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, position, text_en, meaning_fa, emoji, image_url, audio_url, tip_fa
		FROM course_items WHERE lesson_id = $1::uuid ORDER BY position`, id)
	if err != nil {
		return Lesson{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	l.Items = []Item{}
	for rows.Next() {
		var it Item
		if err := rows.Scan(&it.ID, &it.Position, &it.TextEn, &it.MeaningFa, &it.Emoji, &it.ImageURL, &it.AudioURL, &it.TipFa); err != nil {
			return Lesson{}, richerror.New(op).WithErr(err)
		}
		l.Items = append(l.Items, it)
	}
	l.ItemCount = len(l.Items)
	return l, rows.Err()
}

func (r DB) SaveUnit(ctx context.Context, u Unit) (string, error) {
	const op = "postgrescourse.SaveUnit"
	id := u.ID
	var err error
	if id == "" {
		err = r.conn.QueryRow(ctx, `
			INSERT INTO course_units (title_fa, title_en, emoji, description_fa, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6) RETURNING id::text`,
			u.TitleFa, u.TitleEn, u.Emoji, u.DescriptionFa, u.Position, u.IsActive).Scan(&id)
	} else {
		_, err = r.conn.Exec(ctx, `
			UPDATE course_units SET title_fa = $2, title_en = $3, emoji = $4, description_fa = $5, position = $6, is_active = $7
			WHERE id = $1::uuid`,
			id, u.TitleFa, u.TitleEn, u.Emoji, u.DescriptionFa, u.Position, u.IsActive)
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی فصل")
	}
	return id, nil
}

func (r DB) DeleteUnit(ctx context.Context, id string) error {
	const op = "postgrescourse.DeleteUnit"
	if _, err := r.conn.Exec(ctx, `DELETE FROM course_units WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف فصل")
	}
	return nil
}

// SaveLesson درس را می‌سازد/به‌روز می‌کند و کارت‌هایش را کامل جایگزین می‌کند.
func (r DB) SaveLesson(ctx context.Context, l Lesson) (string, error) {
	const op = "postgrescourse.SaveLesson"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx)

	id := l.ID
	if id == "" {
		err = tx.QueryRow(ctx, `
			INSERT INTO course_lessons (unit_id, title_fa, title_en, emoji, goal_fa, position, is_active)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, $7) RETURNING id::text`,
			l.UnitID, l.TitleFa, l.TitleEn, l.Emoji, l.GoalFa, l.Position, l.IsActive).Scan(&id)
	} else {
		_, err = tx.Exec(ctx, `
			UPDATE course_lessons SET unit_id = $2::uuid, title_fa = $3, title_en = $4, emoji = $5, goal_fa = $6,
				position = $7, is_active = $8
			WHERE id = $1::uuid`,
			id, l.UnitID, l.TitleFa, l.TitleEn, l.Emoji, l.GoalFa, l.Position, l.IsActive)
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی درس")
	}
	if _, err := tx.Exec(ctx, `DELETE FROM course_items WHERE lesson_id = $1::uuid`, id); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	for i, it := range l.Items {
		if _, err := tx.Exec(ctx, `
			INSERT INTO course_items (lesson_id, position, text_en, meaning_fa, emoji, image_url, audio_url, tip_fa)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8)`,
			id, i, it.TextEn, it.MeaningFa, it.Emoji, it.ImageURL, it.AudioURL, it.TipFa); err != nil {
			return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی کارت‌ها")
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return "", richerror.New(op).WithErr(err)
	}
	return id, nil
}

func (r DB) DeleteLesson(ctx context.Context, id string) error {
	const op = "postgrescourse.DeleteLesson"
	if _, err := r.conn.Exec(ctx, `DELETE FROM course_lessons WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف درس")
	}
	return nil
}

// SetItemAudio آدرس صدای یک کارت را بعد از تولید TTS ذخیره می‌کند.
func (r DB) SetItemAudio(ctx context.Context, itemID, audioURL string) error {
	const op = "postgrescourse.SetItemAudio"
	if _, err := r.conn.Exec(ctx, `UPDATE course_items SET audio_url = $2 WHERE id = $1::uuid`, itemID, audioURL); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// SaveProgress بهترین نتیجه‌ی کاربر روی یک درس را نگه می‌دارد (ستاره هیچ‌وقت کم نمی‌شود).
func (r DB) SaveProgress(ctx context.Context, userID, lessonID string, stars, score int) error {
	const op = "postgrescourse.SaveProgress"
	_, err := r.conn.Exec(ctx, `
		INSERT INTO course_progress (user_id, lesson_id, stars, best_score)
		VALUES ($1::uuid, $2::uuid, $3, $4)
		ON CONFLICT (user_id, lesson_id) DO UPDATE
		SET stars = GREATEST(course_progress.stars, EXCLUDED.stars),
			best_score = GREATEST(course_progress.best_score, EXCLUDED.best_score),
			completed_at = NOW()`,
		userID, lessonID, stars, score)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت پیشرفت")
	}
	return nil
}
