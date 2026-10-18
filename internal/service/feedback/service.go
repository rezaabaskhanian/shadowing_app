package feedbackservice

import (
	"context"
	"strings"
	"unicode/utf8"

	"shadowing-backend/internal/pkg/adminnotice"
	"shadowing-backend/internal/pkg/richerror"
	postgresfeedback "shadowing-backend/internal/repository/postgres/feedback"
)

type repository interface {
	Create(ctx context.Context, userID, message string) (postgresfeedback.Feedback, error)
	ListAll(ctx context.Context) ([]postgresfeedback.Feedback, error)
	Get(ctx context.Context, id string) (postgresfeedback.Feedback, error)
	InsertReply(ctx context.Context, rp postgresfeedback.Reply) (postgresfeedback.Reply, error)
	RepliesByUser(ctx context.Context, userID string) ([]postgresfeedback.Reply, error)
}

// Pusher نوتیف اختصاصی به یک کاربر (notificationservice.SendToUser).
type Pusher interface {
	SendToUser(ctx context.Context, userID, title, body string) (int, error)
}

type Service struct {
	repo     repository
	notifier adminnotice.Notifier
	pusher   Pusher
}

func New(repo repository) Service {
	return Service{repo: repo, notifier: adminnotice.Nop{}}
}

// WithNotifier پیام‌های تازه را به ربات ادمین هم می‌فرستد.
func (s Service) WithNotifier(n adminnotice.Notifier) Service {
	s.notifier = n
	return s
}

// WithPusher جواب ادمین را با نوتیف به کاربر می‌رساند.
func (s Service) WithPusher(p Pusher) Service {
	s.pusher = p
	return s
}

type Feedback = postgresfeedback.Feedback
type Reply = postgresfeedback.Reply

func (s Service) Create(ctx context.Context, userID, message string) (Feedback, error) {
	f, err := s.repo.Create(ctx, userID, message)
	if err != nil {
		return f, err
	}
	s.notifier.Notify(adminnotice.Notice{
		Kind: adminnotice.KindFeedback, Section: "💬 پیشنهاد و انتقاد",
		Body: message, UserID: userID, RefID: f.ID,
	})
	return f, nil
}

func (s Service) ListAll(ctx context.Context) ([]Feedback, error) {
	return s.repo.ListAll(ctx)
}

// MyReplies جواب‌های ادمین به کاربر، برای صفحه‌ی «پیشنهاد و انتقاد» اپ.
func (s Service) MyReplies(ctx context.Context, userID string) ([]Reply, error) {
	return s.repo.RepliesByUser(ctx, userID)
}

const maxReplyLen = 1000

// replyTitles عنوان نوتیف جواب، به تفکیک بخشی که کاربر از آن پیام داده بود.
var replyTitles = map[string]string{
	adminnotice.KindFeedback:     "📩 جواب پیشنهاد و انتقادت",
	adminnotice.KindSubmission:   "📩 درباره‌ی صحنه‌ای که پیشنهاد دادی",
	adminnotice.KindTopic:        "📩 درباره‌ی موضوعی که پیشنهاد دادی",
	adminnotice.KindSubscription: "📩 پیام پشتیبانی LingoFlow",
	adminnotice.KindTopup:        "📩 پیام پشتیبانی LingoFlow",
}

// Reply جواب ادمین (از ربات یا پنل) را ثبت می‌کند و با نوتیف به کاربر می‌فرستد.
// برای پیشنهاد و انتقاد، کاربر از روی خود پیام پیدا می‌شود و متن اصلی کنار جواب
// ذخیره می‌شود.
func (s Service) Reply(ctx context.Context, kind, refID, userID, reply string) (int, error) {
	const op = "feedback.Reply"
	reply = strings.TrimSpace(reply)
	if reply == "" || utf8.RuneCountInString(reply) > maxReplyLen {
		return 0, richerror.New(op).WithMessage("متن جواب باید بین ۱ تا ۱۰۰۰ حرف باشد").WithKind(richerror.KindInvalid)
	}
	title, ok := replyTitles[kind]
	if !ok {
		return 0, richerror.New(op).WithMessage("نوع پیام ناشناخته است").WithKind(richerror.KindInvalid)
	}
	original := ""
	if kind == adminnotice.KindFeedback {
		f, err := s.repo.Get(ctx, refID)
		if err != nil {
			return 0, err
		}
		userID, original = f.UserID, f.Message
	}
	if userID == "" {
		return 0, richerror.New(op).WithMessage("کاربر مشخص نیست").WithKind(richerror.KindInvalid)
	}
	if _, err := s.repo.InsertReply(ctx, Reply{UserID: userID, Kind: kind, RefID: refID, Original: original, Reply: reply}); err != nil {
		return 0, err
	}
	if s.pusher == nil {
		return 0, nil
	}
	// نرسیدن نوتیف جواب را باطل نمی‌کند؛ کاربر آن را در اپ هم می‌بیند.
	sent, _ := s.pusher.SendToUser(ctx, userID, title, reply)
	return sent, nil
}
