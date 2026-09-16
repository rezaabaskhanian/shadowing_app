package assessmentservice

import (
	"context"

	"shadowing-backend/internal/domain/assessment"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// ItemRepository - آیتم‌های تست تعیین سطح (مدیریت‌شده در پنل ادمین)
type ItemRepository interface {
	Create(ctx context.Context, item *assessment.AssessmentItem) error
	Update(ctx context.Context, item *assessment.AssessmentItem) error
	Delete(ctx context.Context, id uuid.UUID) error
	List(ctx context.Context) ([]assessment.AssessmentItem, error)
	GetByIDs(ctx context.Context, ids []uuid.UUID) ([]assessment.AssessmentItem, error)
	// RandomActive - category برای kind=shadow نادیده گرفته می‌شود (رشته‌ی خالی بفرستید)
	RandomActive(ctx context.Context, kind assessment.Kind, category assessment.Category) (*assessment.AssessmentItem, error)
	// RandomActiveShadow - یک آیتم shadow فعال و تصادفی از یک سطح دشواری مشخص
	RandomActiveShadow(ctx context.Context, difficulty assessment.Difficulty) (*assessment.AssessmentItem, error)
}

// ProfileRepository - پروفایل گفتاری هر کاربر (upsert، بدون نسخه‌بندی)
type ProfileRepository interface {
	Upsert(ctx context.Context, profile *assessment.SpeakingProfile) error
	GetByUser(ctx context.Context, userID uuid.UUID) (*assessment.SpeakingProfile, error)
}

// SubmissionLogRepository - لاگ متنی هر آیتم ارسالی (بدون صدا)
type SubmissionLogRepository interface {
	Insert(ctx context.Context, userID, itemID uuid.UUID, transcript, relevanceAnswered, relevanceFeedback, grammarCorrection, grammarExplanation string, pronunciationScore, fluencyScore, overallScore *float64) error
}

type Service struct {
	items     ItemRepository
	profiles  ProfileRepository
	log       SubmissionLogRepository
	evaluator speecheval.EvaluatorTranscriber
	ai        aiservice.Service
}

func New(
	items ItemRepository,
	profiles ProfileRepository,
	log SubmissionLogRepository,
	evaluator speecheval.EvaluatorTranscriber,
	ai aiservice.Service,
) *Service {
	return &Service{
		items:     items,
		profiles:  profiles,
		log:       log,
		evaluator: evaluator,
		ai:        ai,
	}
}
