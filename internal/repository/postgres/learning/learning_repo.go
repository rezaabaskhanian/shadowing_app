package postgreslearning

import (
	"context"
	"encoding/json"
	domain "shadowing-backend/internal/domain/learning/scene"
	scene "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

func (r DB) Create(ctx context.Context, s domain.Scene) error {
	const op = "postgres.CreateScene"

	// ========== 1️⃣ شروع تراکنش ==========
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	// ========== 2️⃣ درج Scene ==========
	query := `INSERT INTO scenes (
		id, title, description, background_image_url, 
		difficulty, status, "order", created_at, updated_at
	) VALUES ($1, $2, $3, $4, $5, $6, $7, now(), now())`

	_, err = tx.Exec(ctx, query,
		s.ID,
		s.Title,
		s.Description,
		s.BackgroundImageURL,
		s.Difficulty,
		s.Status,
		s.Order,
	)
	if err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("failed to insert scene")
	}

	// ========== 3️⃣ درج Hotspot‌ها و Dialogues ==========
	for _, h := range s.Hotspots {
		// درج Hotspot
		hotspotQuery := `INSERT INTO hotspots (
			id, scene_id, name, x_position, y_position, order_index, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, now(), now())`

		_, err = tx.Exec(ctx, hotspotQuery,
			h.ID,
			s.ID,
			h.Name,
			h.XPosition,
			h.YPosition,
			h.OrderIndex,
		)
		if err != nil {
			return richerror.New(op).
				WithErr(err).
				WithMessage("failed to insert hotspot")
		}

		// درج Dialogues این Hotspot
		for _, d := range h.Dialogues {
			// واژه‌ها به‌صورت JSON ذخیره می‌شوند (پیش‌فرض آرایه‌ی خالی)
			wordsJSON := []byte("[]")
			if len(d.Words) > 0 {
				if b, mErr := json.Marshal(d.Words); mErr == nil {
					wordsJSON = b
				}
			}

			dialogueQuery := `INSERT INTO dialogues (
				id, hotspot_id, "order", speaker, original_text, translation,
				audio_url, display_type, partial_hint, wait_duration, words, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, now(), now())`

			_, err = tx.Exec(ctx, dialogueQuery,
				d.ID,
				h.ID,
				d.Order,
				d.Speaker,
				d.OriginalText,
				d.Translation,
				d.AudioURL,
				d.DisplayType,
				d.PartialHint,
				d.WaitDuration,
				wordsJSON,
			)
			if err != nil {
				return richerror.New(op).
					WithErr(err).
					WithMessage("failed to insert dialogue")
			}
		}
	}

	// ========== 4️⃣ Commit تراکنش ==========
	err = tx.Commit(ctx)
	if err != nil {
		return richerror.New(op).
			WithErr(err).
			WithMessage("failed to commit transaction")
	}

	return nil
}

// Delete implements [learningservice.Repository].
func (r DB) Delete(ctx context.Context, id string) error {
	const op = "postgres.DeleteScene"

	// Parse UUID
	sceneID, err := uuid.Parse(id)
	if err != nil {
		return richerror.New(op).
			WithMessage("invalid scene ID").
			WithKind(richerror.KindInvalid)
	}

	// شروع تراکنش
	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	// 1️⃣ ابتدا دیالوگ‌ها و هات‌اسپات‌ها به دلیل CASCADE حذف می‌شوند
	// اما برای اطمینان و جلوگیری از خطا، ابتدا هات‌اسپات‌ها را چک می‌کنیم
	checkQuery := `SELECT COUNT(*) FROM hotspots WHERE scene_id = $1`
	var count int
	err = tx.QueryRow(ctx, checkQuery, sceneID).Scan(&count)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to check hotspots")
	}

	// 2️⃣ حذف سناریو (هات‌اسپات‌ها و دیالوگ‌ها به دلیل CASCADE حذف می‌شوند)
	deleteQuery := `DELETE FROM scenes WHERE id = $1`
	result, err := tx.Exec(ctx, deleteQuery, sceneID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete scene")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("scene not found").
			WithKind(richerror.KindNotFound)
	}

	// 3️⃣ Commit تراکنش
	err = tx.Commit(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to commit transaction")
	}

	return nil
}

// GetAll implements [learningservice.Repository].
func (r DB) GetAll(ctx context.Context) ([]scene.Scene, error) {
	const op = "postgres.GetAllScenes"

	query := `SELECT 
		id, title, description, background_image_url,
		difficulty, status, "order", created_at, updated_at
	FROM scenes ORDER BY "order", created_at DESC`

	rows, err := r.conn.Query(ctx, query)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var scenes []scene.Scene
	for rows.Next() {
		var s scene.Scene
		err := rows.Scan(
			&s.ID, &s.Title, &s.Description, &s.BackgroundImageURL,
			&s.Difficulty, &s.Status, &s.Order, &s.CreatedAt, &s.UpdatedAt,
		)
		if err != nil {
			return nil, richerror.New(op).WithErr(err)
		}
		// برای لیست، هات‌اسپات‌ها را خالی می‌گذاریم (بهینه‌تر)
		s.Hotspots = []scene.Hotspot{}
		scenes = append(scenes, s)
	}

	return scenes, nil
}

// GetByID implements [learningservice.Repository].
func (r DB) GetByID(ctx context.Context, id string) (scene.Scene, error) {
	const op = "postgres.GetSceneByID"

	// 1️⃣ Get Scene
	sceneQuery := `SELECT 
		id, title, description, background_image_url,
		difficulty, status, "order", created_at, updated_at
	FROM scenes WHERE id = $1`

	var s scene.Scene
	err := r.conn.QueryRow(ctx, sceneQuery, id).Scan(
		&s.ID, &s.Title, &s.Description, &s.BackgroundImageURL,
		&s.Difficulty, &s.Status, &s.Order, &s.CreatedAt, &s.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return scene.Scene{}, richerror.New(op).
				WithMessage("scene not found").
				WithKind(richerror.KindNotFound)
		}
		return scene.Scene{}, richerror.New(op).WithErr(err)
	}

	// 2️⃣ Get Hotspots
	hotspotQuery := `SELECT 
		id, scene_id, name, x_position, y_position, order_index, created_at, updated_at
	FROM hotspots WHERE scene_id = $1 ORDER BY order_index`

	rows, err := r.conn.Query(ctx, hotspotQuery, s.ID)
	if err != nil {
		return scene.Scene{}, richerror.New(op).WithErr(err)
	}
	defer rows.Close()

	var hotspots []scene.Hotspot
	for rows.Next() {
		var h scene.Hotspot
		err := rows.Scan(
			&h.ID, &h.SceneID, &h.Name, &h.XPosition,
			&h.YPosition, &h.OrderIndex, &h.CreatedAt, &h.UpdatedAt,
		)
		if err != nil {
			return scene.Scene{}, richerror.New(op).WithErr(err)
		}

		// 3️⃣ Get Dialogues for this hotspot
		dialogueQuery := `SELECT
			id, hotspot_id, "order", speaker, original_text, COALESCE(translation, ''),
			COALESCE(audio_url, ''), display_type, COALESCE(partial_hint, ''), wait_duration,
			COALESCE(words, '[]'::jsonb), created_at
		FROM dialogues WHERE hotspot_id = $1 ORDER BY "order"`

		dRows, err := r.conn.Query(ctx, dialogueQuery, h.ID)
		if err != nil {
			return scene.Scene{}, richerror.New(op).WithErr(err)
		}
		defer dRows.Close()

		var dialogues []scene.Dialogue
		for dRows.Next() {
			var d scene.Dialogue
			var wordsJSON []byte
			err := dRows.Scan(
				&d.ID, &d.HotspotID, &d.Order, &d.Speaker, &d.OriginalText,
				&d.Translation, &d.AudioURL, &d.DisplayType,
				&d.PartialHint, &d.WaitDuration, &wordsJSON, &d.CreatedAt,
			)
			if err != nil {
				return scene.Scene{}, richerror.New(op).WithErr(err)
			}
			if len(wordsJSON) > 0 {
				_ = json.Unmarshal(wordsJSON, &d.Words)
			}
			dialogues = append(dialogues, d)
		}
		if err := dRows.Err(); err != nil {
			return scene.Scene{}, richerror.New(op).WithErr(err)
		}

		h.Dialogues = dialogues
		hotspots = append(hotspots, h)
	}
	if err := rows.Err(); err != nil {
		return scene.Scene{}, richerror.New(op).WithErr(err)
	}

	s.Hotspots = hotspots
	return s, nil
}

// GetPublished implements [learningservice.Repository].
func (r DB) GetPublished(ctx context.Context) ([]scene.Scene, error) {
	panic("unimplemented")
}

// Update implements [learningservice.Repository].
func (r DB) Update(ctx context.Context, scene scene.Scene) error {
	const op = "postgres.UpdateScene"

	tx, err := r.conn.Begin(ctx)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to begin transaction")
	}
	defer tx.Rollback(ctx)

	// 1️⃣ Update Scene
	query := `UPDATE scenes SET 
		title = $1, 
		description = $2, 
		background_image_url = $3,
		difficulty = $4, 
		status = $5, 
		"order" = $6,
		updated_at = NOW()
	WHERE id = $7`

	result, err := tx.Exec(ctx, query,
		scene.Title, scene.Description, scene.BackgroundImageURL,
		scene.Difficulty, scene.Status, scene.Order, scene.ID,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to update scene")
	}

	rowsAffected := result.RowsAffected()
	if rowsAffected == 0 {
		return richerror.New(op).
			WithMessage("scene not found").
			WithKind(richerror.KindNotFound)
	}

	// 2️⃣ اگر هات‌اسپات‌ها تغییر کرده‌اند، آنها را به‌روز کن
	// (برای سادگی، هات‌اسپات‌های قبلی را حذف و دوباره درج می‌کنیم)

	// حذف هات‌اسپات‌های قبلی (و دیالوگ‌هایشان به دلیل CASCADE)
	deleteQuery := `DELETE FROM hotspots WHERE scene_id = $1`
	_, err = tx.Exec(ctx, deleteQuery, scene.ID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to delete old hotspots")
	}

	// درج هات‌اسپات‌های جدید
	for _, h := range scene.Hotspots {
		hotspotQuery := `INSERT INTO hotspots (
			id, scene_id, name, x_position, y_position, order_index, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`

		_, err = tx.Exec(ctx, hotspotQuery,
			h.ID, scene.ID, h.Name, h.XPosition, h.YPosition,
			h.OrderIndex,
		)
		if err != nil {
			return richerror.New(op).WithErr(err).WithMessage("failed to insert hotspot")
		}

		// درج دیالوگ‌های جدید
		for _, d := range h.Dialogues {
			dialogueQuery := `INSERT INTO dialogues (
				id, hotspot_id, "order", speaker, original_text, translation,
				audio_url, display_type, partial_hint, wait_duration, created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`

			_, err = tx.Exec(ctx, dialogueQuery,
				d.ID, h.ID, d.Order, d.Speaker, d.OriginalText,
				d.Translation, d.AudioURL, d.DisplayType,
				d.PartialHint, d.WaitDuration, d.CreatedAt,
			)
			if err != nil {
				return richerror.New(op).WithErr(err).WithMessage("failed to insert dialogue")
			}
		}
	}

	return tx.Commit(ctx)

}
