package posthabit

import (
	"context"

	"shadowing-backend/internal/domain/habit/mission"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type DB struct {
	conn *pgxpool.Pool
}

func New(conn *pgxpool.Pool) DB {
	return DB{conn: conn}
}

type Activity struct {
	ID     uuid.UUID
	Code   string
	NameEN string
	NameFA string
	Icon   string
}

// DialogueLine - یک خط از دیالوگ‌های یک هات‌اسپات، فقط چیزی که برای مقایسه‌ی
// رونوشت گفتار با متن هدف لازم است.
type DialogueLine struct {
	ID           uuid.UUID
	Order        int
	Speaker      string
	OriginalText string
}

const missionColumns = `
	id, user_id, hotspot_id, activity_id, mission_type, status,
	started_at, completed_at, coalesce(duration_seconds, 0), created_at
`

func scanMission(row pgx.Row) (mission.Mission, error) {
	var m mission.Mission
	var missionType, status string
	err := row.Scan(
		&m.ID, &m.UserID, &m.HotspotID, &m.ActivityID, &missionType, &status,
		&m.StartedAt, &m.CompletedAt, &m.DurationSeconds, &m.CreatedAt,
	)
	if err != nil {
		return mission.Mission{}, err
	}
	m.Type = mission.Type(missionType)
	m.Status = mission.Status(status)
	return m, nil
}

func (r DB) ListActivities(ctx context.Context) ([]Activity, error) {
	const op = "posthabit.ListActivities"

	rows, err := r.conn.Query(ctx, `
		SELECT id, code, name_en, name_fa, coalesce(icon, '')
		FROM habit_activities WHERE is_active = true ORDER BY name_en
	`)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن فعالیت‌ها")
	}
	defer rows.Close()

	var list []Activity
	for rows.Next() {
		var a Activity
		if err := rows.Scan(&a.ID, &a.Code, &a.NameEN, &a.NameFA, &a.Icon); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, a)
	}
	return list, nil
}

func (r DB) CreateMission(ctx context.Context, userID, hotspotID, activityID uuid.UUID, missionType string) (mission.Mission, error) {
	const op = "posthabit.CreateMission"

	query := `
		INSERT INTO habit_missions (user_id, hotspot_id, activity_id, mission_type)
		VALUES ($1, $2, $3, $4)
		RETURNING ` + missionColumns

	row := r.conn.QueryRow(ctx, query, userID, hotspotID, activityID, missionType)
	m, err := scanMission(row)
	if err != nil {
		return mission.Mission{}, richerror.New(op).WithErr(err).WithMessage("خطا در ساخت ماموریت")
	}
	return m, nil
}

func (r DB) GetMission(ctx context.Context, id uuid.UUID) (mission.Mission, error) {
	const op = "posthabit.GetMission"

	query := `SELECT ` + missionColumns + ` FROM habit_missions WHERE id = $1`
	row := r.conn.QueryRow(ctx, query, id)
	m, err := scanMission(row)
	if err != nil {
		return mission.Mission{}, richerror.New(op).WithErr(err).WithMessage("ماموریت پیدا نشد")
	}
	return m, nil
}

func (r DB) StartMission(ctx context.Context, id uuid.UUID) error {
	const op = "posthabit.StartMission"

	_, err := r.conn.Exec(ctx, `
		UPDATE habit_missions SET status = 'in_progress', started_at = now()
		WHERE id = $1 AND status <> 'completed'
	`, id)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در شروع ماموریت")
	}
	return nil
}

func (r DB) CompleteMission(ctx context.Context, id uuid.UUID, duration int) error {
	const op = "posthabit.CompleteMission"

	_, err := r.conn.Exec(ctx, `
		UPDATE habit_missions SET status = 'completed', completed_at = now(), duration_seconds = $2
		WHERE id = $1
	`, id, duration)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در تکمیل ماموریت")
	}
	return nil
}

func (r DB) CreateSession(ctx context.Context, missionID, userID uuid.UUID, audioPath, transcript string, duration int) (uuid.UUID, error) {
	const op = "posthabit.CreateSession"

	var id uuid.UUID
	err := r.conn.QueryRow(ctx, `
		INSERT INTO habit_practice_sessions (mission_id, user_id, audio_path, transcript, duration_seconds)
		VALUES ($1, $2, NULLIF($3, ''), $4, $5)
		RETURNING id
	`, missionID, userID, audioPath, transcript, duration).Scan(&id)
	if err != nil {
		return uuid.Nil, richerror.New(op).WithErr(err).WithMessage("خطا در ثبت جلسه‌ی تمرین")
	}
	return id, nil
}

func (r DB) CreateResult(ctx context.Context, sessionID, hotspotID uuid.UUID, matchedSentences, totalSentences, matchedWords, totalWords int, accuracy float64) error {
	const op = "posthabit.CreateResult"

	_, err := r.conn.Exec(ctx, `
		INSERT INTO habit_practice_results
			(session_id, hotspot_id, matched_sentences, total_sentences, matched_words, total_words, accuracy)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, sessionID, hotspotID, matchedSentences, totalSentences, matchedWords, totalWords, accuracy)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ثبت نتیجه‌ی تمرین")
	}
	return nil
}

func (r DB) ListUserMissions(ctx context.Context, userID uuid.UUID, limit int) ([]mission.Mission, error) {
	const op = "posthabit.ListUserMissions"

	query := `SELECT ` + missionColumns + ` FROM habit_missions WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2`
	rows, err := r.conn.Query(ctx, query, userID, limit)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن ماموریت‌ها")
	}
	defer rows.Close()

	var list []mission.Mission
	for rows.Next() {
		m, err := scanMission(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, m)
	}
	return list, nil
}

// HistoryStats تعداد ماموریت‌های تکمیل‌شده و مجموع مدت تمرین کاربر را برمی‌گرداند.
func (r DB) HistoryStats(ctx context.Context, userID uuid.UUID) (int, int, error) {
	const op = "posthabit.HistoryStats"

	var completedCount, totalDuration int
	err := r.conn.QueryRow(ctx, `
		SELECT count(*), coalesce(sum(duration_seconds), 0)
		FROM habit_missions WHERE user_id = $1 AND status = 'completed'
	`, userID).Scan(&completedCount, &totalDuration)
	if err != nil {
		return 0, 0, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن آمار تاریخچه")
	}
	return completedCount, totalDuration, nil
}

// DialogueLinesByHotspot خط‌های دیالوگ یک هات‌اسپات را به ترتیب برمی‌گرداند.
//
// معادل این کوئری در ریپازیتوری learning وجود نداشت (فقط GetDialogueByID
// تک‌خطی بود)، برای همین چون این ریپازیتوری از قبل مستقیم روی جدول
// dialogues/hotspots کوئری می‌زند (در SuggestHotspot)، اینجا هم مستقیم اضافه
// شد تا یک وابستگی جدید بین پکیج‌ها ساخته نشود.
func (r DB) DialogueLinesByHotspot(ctx context.Context, hotspotID uuid.UUID) ([]DialogueLine, error) {
	const op = "posthabit.DialogueLinesByHotspot"

	rows, err := r.conn.Query(ctx, `
		SELECT id, "order", speaker, original_text
		FROM dialogues WHERE hotspot_id = $1 ORDER BY "order" ASC
	`, hotspotID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("خطا در خواندن دیالوگ‌ها")
	}
	defer rows.Close()

	var list []DialogueLine
	for rows.Next() {
		var d DialogueLine
		if err := rows.Scan(&d.ID, &d.Order, &d.Speaker, &d.OriginalText); err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		list = append(list, d)
	}
	return list, nil
}

// SuggestHotspot یک هات‌اسپات مناسب برای ماموریت امروز کاربر پیشنهاد می‌دهد.
//
// اولویت با هات‌اسپات‌هایی است که کاربر اخیراً در شادوئینگ خوب تمرین کرده
// (overall_score >= 70) و هنوز برایش ماموریت عادت تکمیل/درحال‌انجام ندارد؛
// اگر نبود، هر هات‌اسپاتی که کاربر در شادوئینگ لمسش کرده کافی است؛ اگر آن هم
// نبود (کاربر کاملاً تازه‌کار است)، یک هات‌اسپات تصادفی از صحنه‌های منتشرشده
// تا این قابلیت هیچ‌وقت برای کاربر جدید بن‌بست نشود.
func (r DB) SuggestHotspot(ctx context.Context, userID uuid.UUID) (uuid.UUID, error) {
	const op = "posthabit.SuggestHotspot"

	const notAlreadyAssigned = `
		NOT EXISTS (
			SELECT 1 FROM habit_missions hm
			WHERE hm.user_id = $1 AND hm.hotspot_id = d.hotspot_id
			  AND hm.status IN ('completed', 'in_progress')
		)
	`

	var hotspotID uuid.UUID

	wellPracticedQuery := `
		SELECT d.hotspot_id
		FROM shadowing_recordings sr
		JOIN dialogues d ON d.id = sr.dialogue_id
		WHERE sr.user_id = $1 AND sr.overall_score >= 70 AND ` + notAlreadyAssigned + `
		GROUP BY d.hotspot_id
		ORDER BY max(sr.created_at) DESC
		LIMIT 1
	`
	err := r.conn.QueryRow(ctx, wellPracticedQuery, userID).Scan(&hotspotID)
	if err == nil {
		return hotspotID, nil
	}
	if err != pgx.ErrNoRows {
		return uuid.Nil, richerror.New(op).WithErr(err).WithMessage("خطا در پیشنهاد هات‌اسپات")
	}

	anyPracticedQuery := `
		SELECT d.hotspot_id
		FROM shadowing_recordings sr
		JOIN dialogues d ON d.id = sr.dialogue_id
		WHERE sr.user_id = $1 AND ` + notAlreadyAssigned + `
		GROUP BY d.hotspot_id
		ORDER BY max(sr.created_at) DESC
		LIMIT 1
	`
	err = r.conn.QueryRow(ctx, anyPracticedQuery, userID).Scan(&hotspotID)
	if err == nil {
		return hotspotID, nil
	}
	if err != pgx.ErrNoRows {
		return uuid.Nil, richerror.New(op).WithErr(err).WithMessage("خطا در پیشنهاد هات‌اسپات")
	}

	randomQuery := `
		SELECT h.id FROM hotspots h
		JOIN scenes s ON s.id = h.scene_id
		WHERE s.status = 'published'
		ORDER BY random()
		LIMIT 1
	`
	err = r.conn.QueryRow(ctx, randomQuery).Scan(&hotspotID)
	if err != nil {
		return uuid.Nil, richerror.New(op).WithErr(err).WithMessage("هیچ صحنه‌ی منتشرشده‌ای برای پیشنهاد وجود ندارد")
	}
	return hotspotID, nil
}

// FindActiveMission ماموریت assigned/in_progress موجود کاربر را برمی‌گرداند
// (اگر باشد) — بدون در نظر گرفتن هات‌اسپات — تا «ماموریت امروز» تا زمانی که
// تکمیل نشده همان بماند و هر بار باز کردن صفحه یک ماموریت تازه با هات‌اسپات
// تصادفی دیگر نسازد.
func (r DB) FindActiveMission(ctx context.Context, userID uuid.UUID) (mission.Mission, bool, error) {
	const op = "posthabit.FindActiveMission"

	query := `
		SELECT ` + missionColumns + ` FROM habit_missions
		WHERE user_id = $1 AND status IN ('assigned', 'in_progress')
		ORDER BY created_at DESC LIMIT 1
	`
	row := r.conn.QueryRow(ctx, query, userID)
	m, err := scanMission(row)
	if err != nil {
		if err == pgx.ErrNoRows {
			return mission.Mission{}, false, nil
		}
		return mission.Mission{}, false, richerror.New(op).WithErr(err)
	}
	return m, true, nil
}

func (r DB) GetActivity(ctx context.Context, id uuid.UUID) (Activity, error) {
	const op = "posthabit.GetActivity"

	var a Activity
	err := r.conn.QueryRow(ctx, `
		SELECT id, code, name_en, name_fa, coalesce(icon, '') FROM habit_activities WHERE id = $1
	`, id).Scan(&a.ID, &a.Code, &a.NameEN, &a.NameFA, &a.Icon)
	if err != nil {
		return Activity{}, richerror.New(op).WithErr(err).WithMessage("فعالیت پیدا نشد")
	}
	return a, nil
}

// RandomActivity یک فعالیت فعال تصادفی برمی‌گرداند — برای انتخاب فعالیت
// ماموریت تازه، بدون نیاز به منطق پیچیده‌ی تناسب فعالیت با هات‌اسپات (MVP).
func (r DB) RandomActivity(ctx context.Context) (Activity, error) {
	const op = "posthabit.RandomActivity"

	var a Activity
	err := r.conn.QueryRow(ctx, `
		SELECT id, code, name_en, name_fa, coalesce(icon, '')
		FROM habit_activities WHERE is_active = true
		ORDER BY random() LIMIT 1
	`).Scan(&a.ID, &a.Code, &a.NameEN, &a.NameFA, &a.Icon)
	if err != nil {
		return Activity{}, richerror.New(op).WithErr(err).WithMessage("فعالیتی برای پیشنهاد وجود ندارد")
	}
	return a, nil
}
