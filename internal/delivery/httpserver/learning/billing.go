package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

type verifyPurchaseRequest struct {
	ProductID     string `json:"product_id"`
	PurchaseToken string `json:"purchase_token"`
}

// VerifyPurchase یک خرید کافه‌بازاری (Poolakey) را سمت سرور تأیید می‌کند و در
// صورت معتبر بودن، اشتراک یک‌ساله را برای کاربر لاگین‌شده فعال می‌کند.
func (h Handler) VerifyPurchase(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req verifyPurchaseRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}

	if err := h.billingSvc.VerifyAndGrant(c.Request().Context(), userClaims.UserID, req.ProductID, req.PurchaseToken); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "اشتراک با موفقیت فعال شد"})
}
