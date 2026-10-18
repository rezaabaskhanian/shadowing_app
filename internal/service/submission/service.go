package submissionservice

import (
	"context"
	"strings"

	"shadowing-backend/internal/pkg/adminnotice"
	postgressubmission "shadowing-backend/internal/repository/postgres/submission"
)

// DefaultApprovalPoints امتیازی که با تایید یک پیشنهاد صحنه به کاربر اهدا می‌شود.
const DefaultApprovalPoints = 50

type repository interface {
	Create(ctx context.Context, userID, imageURL, situationText string, dialogues []postgressubmission.DialogueLine) (postgressubmission.Submission, error)
	ListByUser(ctx context.Context, userID string) ([]postgressubmission.Submission, error)
	ListByStatus(ctx context.Context, status string) ([]postgressubmission.Submission, error)
	Get(ctx context.Context, id string) (postgressubmission.Submission, error)
	MarkApproved(ctx context.Context, id, sceneID, reviewerID string, points int) error
	MarkRejected(ctx context.Context, id, reviewerID, note string) error
	AwardPoints(ctx context.Context, userID string, delta int, reason, submissionID string) error
	UserPoints(ctx context.Context, userID string) (int, error)
}

type Service struct {
	repo     repository
	notifier adminnotice.Notifier
}

func New(repo repository) Service {
	return Service{repo: repo, notifier: adminnotice.Nop{}}
}

// WithNotifier پیشنهادهای تازه را به ربات ادمین هم خبر می‌دهد.
func (s Service) WithNotifier(n adminnotice.Notifier) Service {
	s.notifier = n
	return s
}

type DialogueLine = postgressubmission.DialogueLine
type Submission = postgressubmission.Submission

func (s Service) Create(ctx context.Context, userID, imageURL, situationText string, dialogues []DialogueLine) (Submission, error) {
	sub, err := s.repo.Create(ctx, userID, imageURL, situationText, dialogues)
	if err != nil {
		return sub, err
	}
	var b strings.Builder
	b.WriteString("موقعیت: " + strings.TrimSpace(situationText))
	for _, d := range dialogues {
		b.WriteString("\n• " + strings.TrimSpace(d.Speaker) + ": " + strings.TrimSpace(d.Text))
	}
	if imageURL != "" {
		b.WriteString("\n🖼 تصویر هم فرستاده")
	}
	b.WriteString("\n\nبرای بررسی: پنل ← صف بررسی صحنه‌ها")
	s.notifier.Notify(adminnotice.Notice{
		Kind: adminnotice.KindSubmission, Section: "📝 پیشنهاد صحنه (منتظر بررسی)",
		Body: b.String(), UserID: userID, RefID: sub.ID,
	})
	return sub, nil
}

func (s Service) ListMine(ctx context.Context, userID string) ([]Submission, error) {
	return s.repo.ListByUser(ctx, userID)
}

func (s Service) ListByStatus(ctx context.Context, status string) ([]Submission, error) {
	return s.repo.ListByStatus(ctx, status)
}

func (s Service) Get(ctx context.Context, id string) (Submission, error) {
	return s.repo.Get(ctx, id)
}

// Approve پیشنهاد را به یک صحنه‌ی منتشرشده (sceneID، که قبلاً توسط ادمین ساخته
// شده) وصل می‌کند و امتیاز پیش‌فرض را به کاربر اهدا می‌کند.
func (s Service) Approve(ctx context.Context, submissionID, sceneID, reviewerID string) (int, error) {
	sub, err := s.repo.Get(ctx, submissionID)
	if err != nil {
		return 0, err
	}

	if err := s.repo.MarkApproved(ctx, submissionID, sceneID, reviewerID, DefaultApprovalPoints); err != nil {
		return 0, err
	}
	if err := s.repo.AwardPoints(ctx, sub.UserID, DefaultApprovalPoints, "scene_submission_approved", submissionID); err != nil {
		return 0, err
	}
	return DefaultApprovalPoints, nil
}

func (s Service) Reject(ctx context.Context, submissionID, reviewerID, note string) error {
	return s.repo.MarkRejected(ctx, submissionID, reviewerID, note)
}

func (s Service) UserPoints(ctx context.Context, userID string) (int, error) {
	return s.repo.UserPoints(ctx, userID)
}
