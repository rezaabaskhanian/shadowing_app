package adminhandler

import (
	"net/http"

	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/assessment/dto"

	"github.com/labstack/echo/v4"
)

// CreateAssessmentItem یک آیتم جدید تست تعیین سطح می‌سازد (intro/situational/shadow).
func (h Handler) CreateAssessmentItem(c echo.Context) error {
	var req dto.CreateItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	item, err := h.assessmentSvc.CreateItem(c.Request().Context(), req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusCreated, item)
}

// ListAssessmentItems همه‌ی آیتم‌ها (فعال و غیرفعال) را برای جدول پنل برمی‌گرداند.
func (h Handler) ListAssessmentItems(c echo.Context) error {
	items, err := h.assessmentSvc.ListItems(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, items)
}

// UpdateAssessmentItem یک آیتم موجود را ویرایش می‌کند.
func (h Handler) UpdateAssessmentItem(c echo.Context) error {
	itemID := c.Param("id")

	var req dto.UpdateItemRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	item, err := h.assessmentSvc.UpdateItem(c.Request().Context(), itemID, req)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, item)
}

// DeleteAssessmentItem یک آیتم را حذف می‌کند.
func (h Handler) DeleteAssessmentItem(c echo.Context) error {
	itemID := c.Param("id")

	if err := h.assessmentSvc.DeleteItem(c.Request().Context(), itemID); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, map[string]string{
		"message": "آیتم با موفقیت حذف شد",
	})
}
