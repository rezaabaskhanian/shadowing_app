package leitnerhandler

import (
	"context"
	"net/http"

	"shadowing-backend/internal/domain/leitner"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

// wordDTO شکل JSON یک کلمه‌ی لایتنر — همان فیلدهایی که مدل محلی BoxWord
// سمت موبایل (VocabContext.tsx) دارد، به‌علاوه‌ی id برای عملیات
// promote/demote/delete.
type wordDTO struct {
	ID         string `json:"id"`
	Word       string `json:"word"`
	Meaning    string `json:"meaning"`
	Level      int    `json:"level"`
	NextReview int64  `json:"next_review"` // یونیکس میلی‌ثانیه، هم‌شکل با Date.now() سمت موبایل
	CreatedAt  int64  `json:"created_at"`  // یونیکس میلی‌ثانیه
}

func toWordDTO(w leitner.Word) wordDTO {
	return wordDTO{
		ID:         w.ID.String(),
		Word:       w.Word,
		Meaning:    w.Meaning,
		Level:      w.Level,
		NextReview: w.NextReview.UnixMilli(),
		CreatedAt:  w.CreatedAt.UnixMilli(),
	}
}

// ListWords همه‌ی کلمه‌های جعبه‌ی لایتنر کاربر لاگین‌شده را برمی‌گرداند.
func (h Handler) ListWords(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	words, err := h.leitnerSvc.ListWords(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	out := make([]wordDTO, 0, len(words))
	for _, w := range words {
		out = append(out, toWordDTO(w))
	}
	return c.JSON(http.StatusOK, echo.Map{"words": out})
}

type addWordRequest struct {
	Word    string `json:"word"`
	Meaning string `json:"meaning"`
}

// AddWord یک کلمه‌ی جدید به جعبه‌ی کاربر اضافه می‌کند (idempotent — اگر
// تکراری باشد، همان ردیف موجود برمی‌گردد).
func (h Handler) AddWord(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req addWordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر است"})
	}

	w, err := h.leitnerSvc.AddWord(c.Request().Context(), userClaims.UserID, req.Word, req.Meaning)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusCreated, toWordDTO(w))
}

// PromoteWord کلمه را یک سطح بالا می‌برد («بلد بودم»).
func (h Handler) PromoteWord(c echo.Context) error {
	return h.reviewWord(c, h.leitnerSvc.Promote)
}

// DemoteWord کلمه را به سطح ۱ برمی‌گرداند («بلد نبودم»).
func (h Handler) DemoteWord(c echo.Context) error {
	return h.reviewWord(c, h.leitnerSvc.Demote)
}

func (h Handler) reviewWord(c echo.Context, action func(ctx context.Context, userID, wordID string) (leitner.Word, error)) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	w, err := action(c.Request().Context(), userClaims.UserID, c.Param("id"))
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, toWordDTO(w))
}

// DeleteWord یک کلمه را از جعبه‌ی کاربر حذف می‌کند.
func (h Handler) DeleteWord(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	if err := h.leitnerSvc.RemoveWord(c.Request().Context(), userClaims.UserID, c.Param("id")); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, echo.Map{"message": "حذف شد"})
}
