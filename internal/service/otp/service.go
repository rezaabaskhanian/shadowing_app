package otpservice

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"time"

	"shadowing-backend/internal/pkg/richerror"

	postgresotp "shadowing-backend/internal/repository/postgres/otp"

	"github.com/google/uuid"
)

const (
	PurposeRegister = "register"
	PurposeReset    = "reset"

	codeTTL        = 2 * time.Minute
	tokenTTL       = 10 * time.Minute
	resendCooldown = 60 * time.Second
	maxAttempts    = 5
)

type Repository interface {
	Create(ctx context.Context, phone, purpose, code string, expiresAt time.Time) (postgresotp.Row, error)
	LatestPending(ctx context.Context, phone, purpose string) (postgresotp.Row, error)
	IncrementAttempts(ctx context.Context, id uuid.UUID) error
	MarkVerified(ctx context.Context, id uuid.UUID, token string, tokenExpiresAt time.Time) error
	FindValidToken(ctx context.Context, phone, purpose, token string) (postgresotp.Row, error)
	ConsumeToken(ctx context.Context, id uuid.UUID) error
}

type SMSClient interface {
	SendCode(ctx context.Context, phone, code string) error
}

type Service struct {
	repo Repository
	sms  SMSClient
}

func New(repo Repository, sms SMSClient) Service {
	return Service{repo: repo, sms: sms}
}

func generateCode() string {
	b := make([]byte, 3)
	_, _ = rand.Read(b)
	n := (int(b[0])<<16 | int(b[1])<<8 | int(b[2])) % 100000
	return fmt.Sprintf("%05d", n)
}

func generateToken() (string, error) {
	b := make([]byte, 24)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// Send یک کد OTP تازه تولید و پیامک می‌کند. اگر آخرین کد ارسال‌شده هنوز
// داخل بازه‌ی cooldown باشد، خطا برمی‌گرداند تا از اسپم پیامک جلوگیری شود.
func (s Service) Send(ctx context.Context, phone, purpose string) error {
	const op = "otpservice.Send"

	if last, err := s.repo.LatestPending(ctx, phone, purpose); err == nil {
		if time.Since(last.CreatedAt) < resendCooldown {
			return richerror.New(op).WithMessage("لطفاً کمی صبر کن و دوباره تلاش کن").WithKind(richerror.KindInvalid)
		}
	}

	code := generateCode()

	if _, err := s.repo.Create(ctx, phone, purpose, code, time.Now().Add(codeTTL)); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره کد تایید")
	}

	if err := s.sms.SendCode(ctx, phone, code); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در ارسال پیامک")
	}

	return nil
}

// Verify کد وارد‌شده را با آخرین کد pending مقایسه می‌کند و در صورت تطابق
// یک توکن یک‌بارمصرف صادر می‌کند تا register/reset-pass با آن ادامه بدهند.
func (s Service) Verify(ctx context.Context, phone, purpose, code string) (string, error) {
	const op = "otpservice.Verify"

	row, err := s.repo.LatestPending(ctx, phone, purpose)
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("کد تاییدی برای این شماره پیدا نشد").WithKind(richerror.KindNotFound)
	}

	if row.Attempts >= maxAttempts {
		return "", richerror.New(op).WithMessage("تعداد تلاش‌های مجاز تمام شده، دوباره کد بگیر").WithKind(richerror.KindInvalid)
	}

	if time.Now().After(row.ExpiresAt) {
		return "", richerror.New(op).WithMessage("کد تایید منقضی شده است").WithKind(richerror.KindInvalid)
	}

	if row.Code != code {
		_ = s.repo.IncrementAttempts(ctx, row.ID)
		return "", richerror.New(op).WithMessage("کد تایید نادرست است").WithKind(richerror.KindInvalid)
	}

	token, err := generateToken()
	if err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در صدور توکن")
	}

	tokenExpiresAt := time.Now().Add(tokenTTL)
	if err := s.repo.MarkVerified(ctx, row.ID, token, tokenExpiresAt); err != nil {
		return "", richerror.New(op).WithErr(err).WithMessage("خطا در ثبت تایید")
	}

	return token, nil
}

// ConsumeToken یک توکن verify‌شده را اعتبارسنجی و یک‌بارمصرف می‌کند. این
// همان اثبات مالکیت شماره‌ای است که register/reset-pass به آن نیاز دارند.
func (s Service) ConsumeToken(ctx context.Context, phone, purpose, token string) error {
	const op = "otpservice.ConsumeToken"

	if token == "" {
		return richerror.New(op).WithMessage("کد تایید شماره موبایل را انجام نداده‌ای").WithKind(richerror.KindInvalid)
	}

	row, err := s.repo.FindValidToken(ctx, phone, purpose, token)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("تایید شماره موبایل نامعتبر یا منقضی شده، دوباره تلاش کن").WithKind(richerror.KindInvalid)
	}

	if err := s.repo.ConsumeToken(ctx, row.ID); err != nil {
		return richerror.New(op).WithErr(err).WithMessage("خطا در تایید نهایی")
	}

	return nil
}
