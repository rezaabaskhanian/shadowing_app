package freespeechservice

import (
	"context"
	"errors"

	scene "shadowing-backend/internal/domain/learning/scene"
	aiservice "shadowing-backend/internal/service/ai"
	aiaccessservice "shadowing-backend/internal/service/aiaccess"
	"shadowing-backend/internal/service/speecheval"

	"github.com/google/uuid"
)

// SceneRepository همان اینترفیسِ سبکی که aiconversation هم استفاده می‌کند؛
// ریپازیتوری جدیدی برای صحنه ساخته نمی‌شود.
type SceneRepository interface {
	GetByID(ctx context.Context, id string) (scene.Scene, error)
}

// LogRepository لاگِ ممیزیِ هر تلاش را ثبت می‌کند — بدون صفحه‌ی تاریخچه.
type LogRepository interface {
	Insert(ctx context.Context, userID, sceneID uuid.UUID, transcript, relevanceAnswered, relevanceFeedback, grammarCorrection, grammarExplanation string) error
}

var errEmptyTranscript = errors.New("empty transcript")

type Service struct {
	scenes      SceneRepository
	log         LogRepository
	ai          aiservice.Service
	transcriber speecheval.Transcriber
	access      *aiaccessservice.Service
}

func New(scenes SceneRepository, log LogRepository, ai aiservice.Service, transcriber speecheval.Transcriber, access *aiaccessservice.Service) *Service {
	return &Service{scenes: scenes, log: log, ai: ai, transcriber: transcriber, access: access}
}
