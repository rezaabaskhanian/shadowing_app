package leitnerservice

import (
	"context"

	"shadowing-backend/internal/domain/leitner"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

type Repository interface {
	Create(ctx context.Context, w leitner.Word) error
	GetByID(ctx context.Context, id uuid.UUID) (leitner.Word, error)
	GetByUserAndWord(ctx context.Context, userID uuid.UUID, word string) (leitner.Word, error)
	ListByUser(ctx context.Context, userID uuid.UUID) ([]leitner.Word, error)
	Update(ctx context.Context, w leitner.Word) error
	Delete(ctx context.Context, id uuid.UUID) error
}

type Service struct {
	repo Repository
}

func New(repo Repository) Service {
	return Service{repo: repo}
}

// AddWord کلمه‌ی جدید را به جعبه‌ی کاربر اضافه می‌کند؛ اگر کلمه از قبل
// (case-sensitive نیست، طرف کلاینت lowercase می‌شود) وجود داشته باشد،
// همان ردیف موجود برگردانده می‌شود (idempotent).
func (s Service) AddWord(ctx context.Context, userID, word, meaning string) (leitner.Word, error) {
	const op = "leitner.AddWord"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}

	newWord, err := leitner.NewWord(uid, word, meaning)
	if err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err).WithKind(richerror.KindInvalid)
	}

	if err := s.repo.Create(ctx, newWord); err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err)
	}

	return s.repo.GetByUserAndWord(ctx, uid, word)
}

// ListWords همه‌ی کلمه‌های جعبه‌ی یک کاربر را برمی‌گرداند.
func (s Service) ListWords(ctx context.Context, userID string) ([]leitner.Word, error) {
	const op = "leitner.ListWords"

	uid, err := uuid.Parse(userID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID")
	}
	return s.repo.ListByUser(ctx, uid)
}

// Promote/Demote فقط روی کلمه‌ی متعلق به همان کاربر عمل می‌کنند — شناسه از
// claims می‌آید، نه از بدنه‌ی درخواست، تا کاربری نتواند کلمه‌ی کاربر دیگر
// را دستکاری کند.
func (s Service) Promote(ctx context.Context, userID, wordID string) (leitner.Word, error) {
	return s.applyReview(ctx, userID, wordID, func(w *leitner.Word) { w.Promote() })
}

func (s Service) Demote(ctx context.Context, userID, wordID string) (leitner.Word, error) {
	return s.applyReview(ctx, userID, wordID, func(w *leitner.Word) { w.Demote() })
}

func (s Service) applyReview(ctx context.Context, userID, wordID string, apply func(*leitner.Word)) (leitner.Word, error) {
	const op = "leitner.applyReview"

	wid, err := uuid.Parse(wordID)
	if err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err).WithMessage("invalid word ID")
	}

	w, err := s.repo.GetByID(ctx, wid)
	if err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err)
	}
	if w.UserID.String() != userID {
		return leitner.Word{}, richerror.New(op).WithMessage("این کلمه متعلق به شما نیست").WithKind(richerror.KindInvalid)
	}

	apply(&w)

	if err := s.repo.Update(ctx, w); err != nil {
		return leitner.Word{}, richerror.New(op).WithErr(err)
	}
	return w, nil
}

// RemoveWord فقط کلمه‌ی متعلق به همان کاربر را حذف می‌کند.
func (s Service) RemoveWord(ctx context.Context, userID, wordID string) error {
	const op = "leitner.RemoveWord"

	wid, err := uuid.Parse(wordID)
	if err != nil {
		return richerror.New(op).WithErr(err).WithMessage("invalid word ID")
	}

	w, err := s.repo.GetByID(ctx, wid)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}
	if w.UserID.String() != userID {
		return richerror.New(op).WithMessage("این کلمه متعلق به شما نیست").WithKind(richerror.KindInvalid)
	}

	return s.repo.Delete(ctx, wid)
}
