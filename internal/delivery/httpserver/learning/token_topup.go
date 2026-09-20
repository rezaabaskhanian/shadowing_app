package learninghandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"

	"github.com/labstack/echo/v4"
)

// TokenTopupPlans طرح‌های تاپ‌آپِ توکن را برمی‌گرداند (برای نمایش در اپ، مثلاً
// وقتی کاربر به سقفِ رایگانِ روزانه رسیده).
func (h Handler) TokenTopupPlans(c echo.Context) error {
	plans, err := h.tokenTopupSvc.ListPlans(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن طرح‌های تاپ‌آپ"})
	}
	return c.JSON(http.StatusOK, echo.Map{"plans": plans})
}

type verifyTokenTopupRequest struct {
	ProductID     string `json:"product_id"`
	PurchaseToken string `json:"purchase_token"`
}

// VerifyTokenTopupPurchase یک خریدِ کافه‌بازاریِ تاپ‌آپ (Poolakey) را سمتِ
// سرور تایید می‌کند و در صورتِ معتبربودن، توکنِ پلن را همان لحظه به اعتبارِ
// کاربرِ لاگین‌شده اضافه می‌کند.
func (h Handler) VerifyTokenTopupPurchase(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var req verifyTokenTopupRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}

	if err := h.tokenTopupSvc.VerifyAndGrant(c.Request().Context(), userClaims.UserID, req.ProductID, req.PurchaseToken); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": err.Error()})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "توکن با موفقیت اضافه شد"})
}
