package topicsuggestionservice

import (
	"context"

	posttopicsuggestion "shadowing-backend/internal/repository/postgres/topicsuggestion"
)

// DefaultApprovalPoints امتیازی که با تایید یک پیشنهاد موضوع به کاربر اهدا می‌شود.
const DefaultApprovalPoints = 30

type repository interface {
	Create(ctx context.Context, userID, topicText string) (posttopicsuggestion.TopicSuggestion, error)
	ListByUser(ctx context.Context, userID string) ([]posttopicsuggestion.TopicSuggestion, error)
	ListByStatus(ctx context.Context, status string) ([]posttopicsuggestion.TopicSuggestion, error)
	Get(ctx context.Context, id string) (posttopicsuggestion.TopicSuggestion, error)
	MarkApproved(ctx context.Context, id, sceneID, reviewerID string, points int) error
	MarkRejected(ctx context.Context, id, reviewerID, note string) error
	AwardPoints(ctx context.Context, userID string, delta int, reason string) error
}

type Service struct {
	repo repository
}

func New(repo repository) Service {
	return Service{repo: repo}
}

type TopicSuggestion = posttopicsuggestion.TopicSuggestion

func (s Service) Create(ctx context.Context, userID, topicText string) (TopicSuggestion, error) {
	return s.repo.Create(ctx, userID, topicText)
}

func (s Service) ListMine(ctx context.Context, userID string) ([]TopicSuggestion, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s Service) ListByStatus(ctx context.Context, status string) ([]TopicSuggestion, error) {
	return s.repo.ListByStatus(ctx, status)
}

func (s Service) Get(ctx context.Context, id string) (TopicSuggestion, error) {
	return s.repo.Get(ctx, id)
}

// Approve پیشنهاد را به یک صحنه‌ی منتشرشده (sceneID، که ادمین با کمک دستی/AI
// از روی موضوع پیشنهادی ساخته) وصل می‌کند و امتیاز پیش‌فرض را به کاربر اهدا می‌کند.
func (s Service) Approve(ctx context.Context, suggestionID, sceneID, reviewerID string) (int, error) {
	sug, err := s.repo.Get(ctx, suggestionID)
	if err != nil {
		return 0, err
	}

	if err := s.repo.MarkApproved(ctx, suggestionID, sceneID, reviewerID, DefaultApprovalPoints); err != nil {
		return 0, err
	}
	if err := s.repo.AwardPoints(ctx, sug.UserID, DefaultApprovalPoints, "topic_suggestion_approved"); err != nil {
		return 0, err
	}
	return DefaultApprovalPoints, nil
}

func (s Service) Reject(ctx context.Context, suggestionID, reviewerID, note string) error {
	return s.repo.MarkRejected(ctx, suggestionID, reviewerID, note)
}
