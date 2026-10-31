package postgresaiconversation

import (
	"context"
	"encoding/json"
	"errors"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type RoleplayRepository struct {
	db *pgxpool.Pool
}

func NewRoleplayRepository(db *pgxpool.Pool) *RoleplayRepository {
	return &RoleplayRepository{db: db}
}

const roleplayColumns = `id::text, title, title_fa, situation_fa, ai_role, user_role_fa, goals_fa, key_phrases,
	category, level, COALESCE(podcast_id::text, ''), position, is_active, created_at::text`

func scanRoleplay(row pgx.Row) (aiconversation.Roleplay, error) {
	var r aiconversation.Roleplay
	var goals, phrases []byte
	if err := row.Scan(&r.ID, &r.Title, &r.TitleFA, &r.SituationFA, &r.AIRole, &r.UserRoleFA, &goals, &phrases,
		&r.Category, &r.Level, &r.PodcastID, &r.Position, &r.IsActive, &r.CreatedAt); err != nil {
		return aiconversation.Roleplay{}, err
	}
	_ = json.Unmarshal(goals, &r.GoalsFA)
	_ = json.Unmarshal(phrases, &r.KeyPhrases)
	if r.GoalsFA == nil {
		r.GoalsFA = []string{}
	}
	if r.KeyPhrases == nil {
		r.KeyPhrases = []aiconversation.KeyPhrase{}
	}
	return r, nil
}

// List همه‌ی سناریوها (onlyActive: فقط منتشرشده‌ها) به ترتیب position.
func (r *RoleplayRepository) List(ctx context.Context, onlyActive bool) ([]aiconversation.Roleplay, error) {
	const op = "postgresaiconversation.RoleplayRepository.List"
	q := `SELECT ` + roleplayColumns + ` FROM roleplay_scenarios`
	if onlyActive {
		q += ` WHERE is_active`
	}
	q += ` ORDER BY position, created_at`
	rows, err := r.db.Query(ctx, q)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()
	out := []aiconversation.Roleplay{}
	for rows.Next() {
		rp, err := scanRoleplay(rows)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		out = append(out, rp)
	}
	return out, rows.Err()
}

func (r *RoleplayRepository) Get(ctx context.Context, id string) (aiconversation.Roleplay, error) {
	const op = "postgresaiconversation.RoleplayRepository.Get"
	rp, err := scanRoleplay(r.db.QueryRow(ctx, `SELECT `+roleplayColumns+` FROM roleplay_scenarios WHERE id = $1::uuid`, id))
	if errors.Is(err, pgx.ErrNoRows) {
		return aiconversation.Roleplay{}, richerror.New(op).WithErr(err).WithMessage("نقش‌آفرینی پیدا نشد").WithKind(richerror.KindNotFound)
	}
	if err != nil {
		return aiconversation.Roleplay{}, richerror.New(op).WithErr(err)
	}
	return rp, nil
}

// Save سناریو را می‌سازد (ID خالی) یا جایگزین می‌کند و شناسه‌اش را برمی‌گرداند.
func (r *RoleplayRepository) Save(ctx context.Context, rp aiconversation.Roleplay) (string, error) {
	const op = "postgresaiconversation.RoleplayRepository.Save"
	goals, _ := json.Marshal(rp.GoalsFA)
	phrases, _ := json.Marshal(rp.KeyPhrases)
	var podcastID *string
	if rp.PodcastID != "" {
		podcastID = &rp.PodcastID
	}
	id := rp.ID
	var err error
	if id == "" {
		err = r.db.QueryRow(ctx, `
			INSERT INTO roleplay_scenarios (title, title_fa, situation_fa, ai_role, user_role_fa, goals_fa, key_phrases,
				category, level, podcast_id, position, is_active)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::uuid, $11, $12) RETURNING id::text`,
			rp.Title, rp.TitleFA, rp.SituationFA, rp.AIRole, rp.UserRoleFA, goals, phrases,
			rp.Category, rp.Level, podcastID, rp.Position, rp.IsActive).Scan(&id)
	} else {
		var tag interface{ RowsAffected() int64 }
		tag, err = r.db.Exec(ctx, `
			UPDATE roleplay_scenarios SET title = $2, title_fa = $3, situation_fa = $4, ai_role = $5, user_role_fa = $6,
				goals_fa = $7, key_phrases = $8, category = $9, level = $10, podcast_id = $11::uuid, position = $12,
				is_active = $13, updated_at = NOW()
			WHERE id = $1::uuid`,
			id, rp.Title, rp.TitleFA, rp.SituationFA, rp.AIRole, rp.UserRoleFA, goals, phrases,
			rp.Category, rp.Level, podcastID, rp.Position, rp.IsActive)
		if err == nil && tag.RowsAffected() == 0 {
			return "", richerror.New(op).WithMessage("نقش‌آفرینی پیدا نشد").WithKind(richerror.KindNotFound)
		}
	}
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره‌ی نقش‌آفرینی")
	}
	return id, nil
}

func (r *RoleplayRepository) Delete(ctx context.Context, id string) error {
	const op = "postgresaiconversation.RoleplayRepository.Delete"
	if _, err := r.db.Exec(ctx, `DELETE FROM roleplay_scenarios WHERE id = $1::uuid`, id); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در حذف نقش‌آفرینی")
	}
	return nil
}
