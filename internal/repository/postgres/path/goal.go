package postgrespath

import (
	"context"
	"encoding/json"
	"errors"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
)

// GoalSituation یک موقعیت از بسته‌ی هدف (مثلاً «کنترل پاسپورت»).
type GoalSituation struct {
	ID       string   `json:"id,omitempty"`
	Position int      `json:"position"`
	Priority int      `json:"priority"`
	TitleFa  string   `json:"title_fa"`
	TitleEn  string   `json:"title_en,omitempty"`
	SceneIDs []string `json:"scene_ids"`
}

// GoalPlan برنامه‌ی کاربر.
type GoalPlan struct {
	Goal          string     `json:"goal"`
	TargetDate    *time.Time `json:"target_date,omitempty"`
	MinutesPerDay int        `json:"minutes_per_day"`
	StartLevel    string     `json:"start_level"`
	CreatedAt     time.Time  `json:"created_at"`
}

// SceneInfo سطح و وضعیت یک صحنه برای انتخاب بهترین صحنه‌ی هر موقعیت.
type SceneInfo struct {
	Level     string
	Published bool
}

func (r DB) GoalPack(ctx context.Context, goal string) ([]GoalSituation, error) {
	const op = "postgrespath.GoalPack"
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, position, priority, title_fa, title_en, scene_ids
		FROM goal_pack_situations WHERE goal = $1 ORDER BY position`, goal)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := []GoalSituation{}
	for rows.Next() {
		var s GoalSituation
		var raw []byte
		if err := rows.Scan(&s.ID, &s.Position, &s.Priority, &s.TitleFa, &s.TitleEn, &raw); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		s.SceneIDs = []string{}
		_ = json.Unmarshal(raw, &s.SceneIDs)
		out = append(out, s)
	}
	return out, rows.Err()
}

// SaveGoalPack کل بسته‌ی یک هدف را یک‌جا جایگزین می‌کند.
func (r DB) SaveGoalPack(ctx context.Context, goal string, items []GoalSituation) error {
	const op = "postgrespath.SaveGoalPack"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `DELETE FROM goal_pack_situations WHERE goal = $1`, goal); err != nil {
		return richerror.New(op).WithErr(err)
	}
	for _, s := range items {
		ids, _ := json.Marshal(s.SceneIDs)
		if _, err := tx.Exec(ctx, `
			INSERT INTO goal_pack_situations (goal, position, priority, title_fa, title_en, scene_ids)
			VALUES ($1, $2, $3, $4, $5, $6::jsonb)`, goal, s.Position, s.Priority, s.TitleFa, s.TitleEn, string(ids)); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (r DB) GetGoalPlan(ctx context.Context, userID string) (*GoalPlan, error) {
	const op = "postgrespath.GetGoalPlan"
	var p GoalPlan
	err := r.conn.QueryRow(ctx, `
		SELECT goal, target_date, minutes_per_day, start_level, created_at
		FROM user_goal_plans WHERE user_id = $1`, userID).
		Scan(&p.Goal, &p.TargetDate, &p.MinutesPerDay, &p.StartLevel, &p.CreatedAt)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	return &p, nil
}

func (r DB) SaveGoalPlan(ctx context.Context, userID string, p GoalPlan) error {
	const op = "postgrespath.SaveGoalPlan"
	_, err := r.conn.Exec(ctx, `
		INSERT INTO user_goal_plans (user_id, goal, target_date, minutes_per_day, start_level, updated_at)
		VALUES ($1, $2, $3, $4, $5, now())
		ON CONFLICT (user_id) DO UPDATE SET
			goal = EXCLUDED.goal, target_date = EXCLUDED.target_date,
			minutes_per_day = EXCLUDED.minutes_per_day, start_level = EXCLUDED.start_level, updated_at = now()`,
		userID, p.Goal, p.TargetDate, p.MinutesPerDay, p.StartLevel)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

func (r DB) DeleteGoalPlan(ctx context.Context, userID string) error {
	const op = "postgrespath.DeleteGoalPlan"
	if _, err := r.conn.Exec(ctx, `DELETE FROM user_goal_plans WHERE user_id = $1`, userID); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// SceneInfos سطح و وضعیت انتشار صحنه‌ها.
func (r DB) SceneInfos(ctx context.Context, sceneIDs []string) (map[string]SceneInfo, error) {
	const op = "postgrespath.SceneInfos"
	out := map[string]SceneInfo{}
	if len(sceneIDs) == 0 {
		return out, nil
	}
	rows, err := r.conn.Query(ctx, `
		SELECT id::text, difficulty, status = 'published' FROM scenes WHERE id = ANY($1::uuid[])`, sceneIDs)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var si SceneInfo
		if err := rows.Scan(&id, &si.Level, &si.Published); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[id] = si
	}
	return out, rows.Err()
}
