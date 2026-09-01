package adminhandler

import (
	"net/http"
	"strconv"

	subscriptionservice "shadowing-backend/internal/service/subscription"

	"github.com/labstack/echo/v4"
)

// ListSubscriptionPlans طرح‌های اشتراک را برمی‌گرداند.
func (h Handler) ListSubscriptionPlans(c echo.Context) error {
	plans, err := h.subscriptionSvc.ListPlans(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن طرح‌های اشتراک"})
	}
	return c.JSON(http.StatusOK, echo.Map{"plans": plans})
}

type createPlanRequest struct {
	Name         string `json:"name"`
	DurationDays int    `json:"duration_days"`
	PriceToman   int    `json:"price_toman"`
	ProductID    string `json:"product_id"`
}

// CreateSubscriptionPlan یک طرح اشتراک جدید می‌سازد. اگر product_id پر شود،
// این پلن از طریق پولکی کافه‌بازار با همان SKU قابل‌خرید می‌شود — باید
// دقیقاً با شناسه‌ی SKU ساخته‌شده در پنل توسعه‌دهندگان کافه‌بازار یکی باشد.
func (h Handler) CreateSubscriptionPlan(c echo.Context) error {
	var req createPlanRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.Name == "" || req.DurationDays <= 0 || req.PriceToman < 0 {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "نام، مدت و قیمت باید معتبر باشند"})
	}

	plan, err := h.subscriptionSvc.CreatePlan(c.Request().Context(), req.Name, req.DurationDays, req.PriceToman, req.ProductID)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در ساخت طرح اشتراک"})
	}
	return c.JSON(http.StatusCreated, plan)
}

// DeleteSubscriptionPlan یک طرح اشتراک را حذف می‌کند.
func (h Handler) DeleteSubscriptionPlan(c echo.Context) error {
	if err := h.subscriptionSvc.DeletePlan(c.Request().Context(), c.Param("id")); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در حذف طرح اشتراک"})
	}
	return c.JSON(http.StatusOK, echo.Map{"message": "حذف شد"})
}

type grantSubscriptionRequest struct {
	Phone          string `json:"phone"`
	PlanID         string `json:"plan_id"`
	PointsToRedeem int    `json:"points_to_redeem"`
}

// GrantSubscription اشتراک را دستی برای یک کاربر (با شماره تلفن) فعال می‌کند —
// چون هنوز درگاه پرداخت واقعی وجود ندارد. اگر کاربر امتیاز کافی داشته باشد،
// می‌تواند بخشی از هزینه را با امتیاز تخفیف بگیرد (هر ۱۰۰ امتیاز = ۲۰,۰۰۰ تومان).
func (h Handler) GrantSubscription(c echo.Context) error {
	var req grantSubscriptionRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "درخواست نامعتبر"})
	}
	if req.Phone == "" || req.PlanID == "" {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "شماره تلفن و طرح اشتراک الزامی است"})
	}

	targetUser, err := h.userSvc.GetUserByPhone(req.Phone)
	if err != nil {
		return c.JSON(http.StatusNotFound, echo.Map{"message": "کاربری با این شماره پیدا نشد"})
	}
	targetUserID := string(targetUser.ID)

	plans, err := h.subscriptionSvc.ListPlans(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن طرح‌های اشتراک"})
	}
	var selected *subscriptionservice.Plan
	for i := range plans {
		if plans[i].ID == req.PlanID {
			selected = &plans[i]
			break
		}
	}
	if selected == nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "طرح اشتراک پیدا نشد"})
	}

	if err := h.subscriptionSvc.Grant(c.Request().Context(), targetUserID, *selected, req.PointsToRedeem, "", ""); err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در فعال‌سازی اشتراک"})
	}

	return c.JSON(http.StatusOK, echo.Map{"message": "اشتراک فعال شد"})
}

// RevenueStats آمار درآمد اشتراک‌های خریداری‌شده (نه گرنت دستی ادمین) را
// برمی‌گرداند — مجموع کل و شکست روزانه‌ی «days» روز اخیر (پیش‌فرض ۳۰).
func (h Handler) RevenueStats(c echo.Context) error {
	days := 30
	if v := c.QueryParam("days"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			days = n
		}
	}

	stats, err := h.subscriptionSvc.RevenueStats(c.Request().Context(), days)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, echo.Map{"message": "خطا در خواندن آمار درآمد"})
	}
	return c.JSON(http.StatusOK, stats)
}
