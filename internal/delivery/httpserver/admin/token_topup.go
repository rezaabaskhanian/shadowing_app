package adminhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"
)

// ListTokenTopupPlans طرح‌های تاپ‌آپِ توکن را برمی‌گرداند.
func (h Handler) ListTokenTopupPlans(c echo.Context) error {
	plans, err := h.tokenTopupSvc.ListPlans(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن طرح‌های تاپ‌آپ"})
	}
	return c.JSON(http.StatusOK, echo.Map{"plans": plans})
}

type createTokenTopupPlanRequest struct {
	Name       string `json:"name"`
	Tokens     int    `json:"tokens"`
	PriceToman int    `json:"price_toman"`
	ProductID  string `json:"product_id"`
}

// CreateTokenTopupPlan یک طرحِ تاپ‌آپِ جدید می‌سازد. اگر product_id پر شود،
// این پلن از طریق پولکی کافه‌بازار با همان SKU قابل‌خرید می‌شود — باید دقیقاً
// با شناسه‌ی SKU ساخته‌شده در پنل توسعه‌دهندگان کافه‌بازار یکی باشد. برای
// قیمت‌گذاریِ درست، اول کارت «هزینه‌ی واقعی AI» (پایین تنظیمات) را ببین.
func (h Handler) CreateTokenTopupPlan(c echo.Context) error {
	var req createTokenTopupPlanRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.Name == "" || req.Tokens <= 0 || req.PriceToman < 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "نام، تعداد توکن و قیمت باید معتبر باشند"})
	}

	plan, err := h.tokenTopupSvc.CreatePlan(c.Request().Context(), req.Name, req.Tokens, req.PriceToman, req.ProductID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ساخت طرح تاپ‌آپ"})
	}
	return c.JSON(http.StatusCreated, plan)
}

// DeleteTokenTopupPlan یک طرح تاپ‌آپ را حذف می‌کند.
func (h Handler) DeleteTokenTopupPlan(c echo.Context) error {
	if err := h.tokenTopupSvc.DeletePlan(c.Request().Context(), c.Param("id")); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در حذف طرح تاپ‌آپ"})
	}
	return c.JSON(http.StatusOK, echo.Map{"message": "حذف شد"})
}
