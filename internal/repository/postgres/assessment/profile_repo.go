package postgresassessment

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProfileRepository struct {
	db *pgxpool.Pool
}

func NewProfileRepository(db *pgxpool.Pool) *ProfileRepository {
	return &ProfileRepository{db: db}
}

// Upsert - ثبت/به‌روزرسانی پروفایل گفتاری کاربر. نسخه‌بندی نداریم؛ هر تست
// جدید نتیجه‌ی قبلی را جایگزین می‌کند.
func (r *ProfileRepository) Upsert(ctx context.Context, p *assessment.SpeakingProfile) error {
	const op = "postgresassessment.ProfileRepository.Upsert"

	query := `INSERT INTO speaking_profiles (
		id, user_id, level, overall_score, pronunciation_score, fluency_score, is_estimated, assessed_at, created_at, updated_at,
		test_version, comprehension_level, speaking_level, listening_level, vocab_level, vocab_size, vocab_valid
	) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
	ON CONFLICT (user_id) DO UPDATE SET
		level = EXCLUDED.level,
		overall_score = EXCLUDED.overall_score,
		pronunciation_score = EXCLUDED.pronunciation_score,
		fluency_score = EXCLUDED.fluency_score,
		is_estimated = EXCLUDED.is_estimated,
		assessed_at = EXCLUDED.assessed_at,
		updated_at = EXCLUDED.updated_at,
		test_version = EXCLUDED.test_version,
		comprehension_level = EXCLUDED.comprehension_level,
		speaking_level = EXCLUDED.speaking_level,
		listening_level = EXCLUDED.listening_level,
		vocab_level = EXCLUDED.vocab_level,
		vocab_size = EXCLUDED.vocab_size,
		vocab_valid = EXCLUDED.vocab_valid`

	version := p.TestVersion
	if version == 0 {
		version = 1
	}
	_, err := r.db.Exec(ctx, query,
		p.ID, p.UserID, p.Level, p.OverallScore, p.PronunciationScore, p.FluencyScore,
		p.IsEstimated, p.AssessedAt, p.CreatedAt, p.UpdatedAt,
		version, string(p.ComprehensionLevel), string(p.SpeakingLevel), string(p.ListeningLevel), string(p.VocabLevel),
		p.VocabSize, p.VocabValid,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save speaking profile")
	}
	return nil
}

// GetByUser - پروفایل گفتاری کاربر؛ نبودش یعنی کاربر هنوز تست نداده (نه خطا).
func (r *ProfileRepository) GetByUser(ctx context.Context, userID uuid.UUID) (*assessment.SpeakingProfile, error) {
	const op = "postgresassessment.ProfileRepository.GetByUser"

	query := `SELECT id, user_id, level, overall_score, pronunciation_score, fluency_score, is_estimated, assessed_at, created_at, updated_at,
		test_version, comprehension_level, speaking_level, listening_level, vocab_level, vocab_size, vocab_valid
	FROM speaking_profiles WHERE user_id = $1`

	var p assessment.SpeakingProfile
	var version int16
	var comp, speak, listen, vocab string
	err := r.db.QueryRow(ctx, query, userID).Scan(
		&p.ID, &p.UserID, &p.Level, &p.OverallScore, &p.PronunciationScore, &p.FluencyScore,
		&p.IsEstimated, &p.AssessedAt, &p.CreatedAt, &p.UpdatedAt,
		&version, &comp, &speak, &listen, &vocab, &p.VocabSize, &p.VocabValid,
	)
	p.TestVersion = int(version)
	p.ComprehensionLevel = assessment.Level(comp)
	p.SpeakingLevel = assessment.Level(speak)
	p.ListeningLevel = assessment.Level(listen)
	p.VocabLevel = assessment.Level(vocab)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, richerror.New(op).WithMessage("speaking profile not found").WithKind(richerror.KindNotFound)
		}
		return nil, richerror.New(op).WithErr(err)
	}
	return &p, nil
}

// InsertResult - یک ردیف در تاریخچه‌ی نتیجه‌ها (برای مقایسه با تست بعدی).
func (r *ProfileRepository) InsertResult(ctx context.Context, p *assessment.SpeakingProfile, imitationAccuracy float64) error {
	const op = "postgresassessment.ProfileRepository.InsertResult"

	_, err := r.db.Exec(ctx, `INSERT INTO placement_results
		(user_id, level, comprehension_level, speaking_level, listening_level, vocab_level, vocab_size, vocab_valid, imitation_accuracy, assessed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
		p.UserID, string(p.Level), string(p.ComprehensionLevel), string(p.SpeakingLevel), string(p.ListeningLevel),
		string(p.VocabLevel), p.VocabSize, p.VocabValid, imitationAccuracy, p.AssessedAt,
	)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("failed to save placement result")
	}
	return nil
}

// LastResult - آخرین نتیجه‌ی ثبت‌شده‌ی کاربر قبل از این تست؛ nil اگر نداشته.
func (r *ProfileRepository) LastResult(ctx context.Context, userID uuid.UUID) (*assessment.PlacementResult, error) {
	const op = "postgresassessment.ProfileRepository.LastResult"

	var res assessment.PlacementResult
	var level, comp, speak string
	err := r.db.QueryRow(ctx, `SELECT level, comprehension_level, speaking_level, vocab_size, assessed_at
		FROM placement_results WHERE user_id = $1 ORDER BY assessed_at DESC LIMIT 1`, userID).
		Scan(&level, &comp, &speak, &res.VocabSize, &res.AssessedAt)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, richerror.New(op).WithErr(err)
	}
	res.Level = assessment.Level(level)
	res.ComprehensionLevel = assessment.Level(comp)
	res.SpeakingLevel = assessment.Level(speak)
	return &res, nil
}
