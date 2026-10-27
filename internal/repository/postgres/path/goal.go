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
	ImageURL  string
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
		SELECT id::text, difficulty, status = 'published', COALESCE(background_image_url, '')
		FROM scenes WHERE id = ANY($1::uuid[])`, sceneIDs)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var id string
		var si SceneInfo
		if err := rows.Scan(&id, &si.Level, &si.Published, &si.ImageURL); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out[id] = si
	}
	return out, rows.Err()
}

// GoalExtra یک تمرین غیرصحنه‌ای در بسته‌ی هدف (پادکست، موضوع صحبت، موضوع نوشتن).
type GoalExtra struct {
	Kind     string `json:"kind"` // podcast | topic | writing
	RefID    string `json:"ref_id"`
	Position int    `json:"position"`
}

// GoalExtraInfo اطلاعات نمایشی یک تمرین بسته‌ی هدف برای یک کاربر.
type GoalExtraInfo struct {
	Kind     string
	RefID    string
	Title    string
	Subtitle string
	Level    string
	ImageURL string
	Active   bool
	Done     bool
}

func (r DB) GoalExtras(ctx context.Context, goal string) ([]GoalExtra, error) {
	const op = "postgrespath.GoalExtras"
	rows, err := r.conn.Query(ctx, `
		SELECT kind, ref_id::text, position FROM goal_pack_extras WHERE goal = $1 ORDER BY position, kind`, goal)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := []GoalExtra{}
	for rows.Next() {
		var x GoalExtra
		if err := rows.Scan(&x.Kind, &x.RefID, &x.Position); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, x)
	}
	return out, rows.Err()
}

// SaveGoalExtras همه‌ی تمرین‌های غیرصحنه‌ای یک هدف را یک‌جا جایگزین می‌کند.
func (r DB) SaveGoalExtras(ctx context.Context, goal string, items []GoalExtra) error {
	const op = "postgrespath.SaveGoalExtras"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	if _, err := tx.Exec(ctx, `DELETE FROM goal_pack_extras WHERE goal = $1`, goal); err != nil {
		return richerror.New(op).WithErr(err)
	}
	for _, x := range items {
		if _, err := tx.Exec(ctx, `
			INSERT INTO goal_pack_extras (goal, kind, ref_id, position) VALUES ($1, $2, $3::uuid, $4)
			ON CONFLICT (goal, kind, ref_id) DO UPDATE SET position = EXCLUDED.position`,
			goal, x.Kind, x.RefID, x.Position); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}

// GoalExtraInfos عنوان، سطح، عکس، فعال بودن و «انجام‌شده» برای هر تمرین بسته‌ی هدف.
// پادکست done ندارد (گوش دادن ثبت نمی‌شود)؛ صحبت و نوشتن با وجود یک تلاش done می‌شوند.
func (r DB) GoalExtraInfos(ctx context.Context, userID string, items []GoalExtra) (map[string]GoalExtraInfo, error) {
	const op = "postgrespath.GoalExtraInfos"
	out := map[string]GoalExtraInfo{}
	ids := map[string][]string{}
	for _, x := range items {
		ids[x.Kind] = append(ids[x.Kind], x.RefID)
	}
	queries := map[string]string{
		"podcast": `
			SELECT p.id::text, p.title, p.description_fa, p.level,
			       COALESCE(NULLIF(p.image_url, ''), s.background_image_url, ''), p.is_active, false
			FROM podcasts p LEFT JOIN scenes s ON s.id = p.scene_id
			WHERE p.id = ANY($1::uuid[])`,
		"topic": `
			SELECT t.id::text, t.title, t.prompt_fa, t.level, t.image_url, t.is_active,
			       EXISTS (SELECT 1 FROM topic_speaking_attempts a WHERE a.topic_id = t.id AND a.user_id = $2::uuid)
			FROM speaking_topics t WHERE t.id = ANY($1::uuid[])`,
		"writing": `
			SELECT w.id::text, w.title, w.prompt_fa, w.level, w.image_url, w.is_active,
			       EXISTS (SELECT 1 FROM writing_attempts a WHERE a.prompt_id = w.id AND a.user_id = $2::uuid)
			FROM writing_prompts w WHERE w.id = ANY($1::uuid[])`,
	}
	for kind, list := range ids {
		q, ok := queries[kind]
		if !ok || len(list) == 0 {
			continue
		}
		var rows pgx.Rows
		var err error
		if kind == "podcast" {
			rows, err = r.conn.Query(ctx, q, list)
		} else {
			rows, err = r.conn.Query(ctx, q, list, userID)
		}
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		for rows.Next() {
			info := GoalExtraInfo{Kind: kind}
			if err := rows.Scan(&info.RefID, &info.Title, &info.Subtitle, &info.Level, &info.ImageURL, &info.Active, &info.Done); err != nil {
				rows.Close()
				return nil, richerror.New(op).WithErr(err)
			}
			out[kind+":"+info.RefID] = info
		}
		rows.Close()
		if err := rows.Err(); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
	}
	return out, nil
}

// GoalMapSpot یک نقطه روی نقشه‌ی هدف؛ x و y درصد از عرض و ارتفاع عکس.
type GoalMapSpot struct {
	Position int     `json:"position"`
	X        float64 `json:"x"`
	Y        float64 `json:"y"`
}

// GoalMapTiles نسخه‌ی پرجزئیات نقشه، بریده به کاشی‌های مربعی (ردیف‌به‌ردیف در URLs).
type GoalMapTiles struct {
	TileSize   int      `json:"tile_size"`
	FullWidth  int      `json:"full_width"`
	FullHeight int      `json:"full_height"`
	Cols       int      `json:"cols"`
	Rows       int      `json:"rows"`
	URLs       []string `json:"urls"`
}

// GoalMap عکس نقشه‌ی یک هدف و نقطه‌های موقعیت‌ها روی آن. ImageURL نمای کلی سبک است
// و Width/Height نسبت تصویر را می‌دهند؛ Tiles برای زوم زیاد.
type GoalMap struct {
	Goal     string        `json:"goal"`
	ImageURL string        `json:"image_url"`
	Width    int           `json:"width"`
	Height   int           `json:"height"`
	Tiles    *GoalMapTiles `json:"tiles,omitempty"`
	Spots    []GoalMapSpot `json:"spots"`
}

// GoalMap نقشه‌ی یک هدف؛ nil اگر هنوز نقشه‌ای ساخته نشده.
func (r DB) GoalMap(ctx context.Context, goal string) (*GoalMap, error) {
	const op = "postgrespath.GoalMap"
	m := GoalMap{Goal: goal, Spots: []GoalMapSpot{}}
	var tiles []byte
	err := r.conn.QueryRow(ctx, `SELECT image_url, width, height, tiles FROM goal_maps WHERE goal = $1`, goal).
		Scan(&m.ImageURL, &m.Width, &m.Height, &tiles)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if len(tiles) > 0 {
		var t GoalMapTiles
		if json.Unmarshal(tiles, &t) == nil && len(t.URLs) > 0 {
			m.Tiles = &t
		}
	}
	rows, err := r.conn.Query(ctx, `SELECT position, x, y FROM goal_map_spots WHERE goal = $1 ORDER BY position`, goal)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	for rows.Next() {
		var s GoalMapSpot
		var x, y float32
		if err := rows.Scan(&s.Position, &x, &y); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		s.X, s.Y = float64(x), float64(y)
		m.Spots = append(m.Spots, s)
	}
	return &m, rows.Err()
}

// SaveGoalMap عکس و همه‌ی نقطه‌های نقشه‌ی یک هدف را یک‌جا جایگزین می‌کند.
func (r DB) SaveGoalMap(ctx context.Context, m GoalMap) error {
	const op = "postgrespath.SaveGoalMap"
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	defer tx.Rollback(ctx) //nolint:errcheck
	var tiles any          // nil → NULL در دیتابیس
	if m.Tiles != nil {
		b, _ := json.Marshal(m.Tiles)
		tiles = string(b)
	}
	if _, err := tx.Exec(ctx, `
		INSERT INTO goal_maps (goal, image_url, width, height, tiles, updated_at) VALUES ($1, $2, $3, $4, $5::jsonb, now())
		ON CONFLICT (goal) DO UPDATE SET image_url = EXCLUDED.image_url, width = EXCLUDED.width,
			height = EXCLUDED.height, tiles = EXCLUDED.tiles, updated_at = now()`,
		m.Goal, m.ImageURL, m.Width, m.Height, tiles); err != nil {
		return richerror.New(op).WithErr(err)
	}
	if _, err := tx.Exec(ctx, `DELETE FROM goal_map_spots WHERE goal = $1`, m.Goal); err != nil {
		return richerror.New(op).WithErr(err)
	}
	for _, s := range m.Spots {
		if _, err := tx.Exec(ctx, `INSERT INTO goal_map_spots (goal, position, x, y) VALUES ($1, $2, $3, $4)`,
			m.Goal, s.Position, s.X, s.Y); err != nil {
			return richerror.New(op).WithErr(err)
		}
	}
	if err := tx.Commit(ctx); err != nil {
		return richerror.New(op).WithErr(err)
	}
	return nil
}
