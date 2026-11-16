package adminhandler

import (
	"net/http"
	"strconv"

	"shadowing-backend/internal/service/instagrampost"

	"github.com/labstack/echo/v4"
)

// GetInstagramPost درس مناسب روز جاری یا با افست مشخص را برمی‌گرداند.
func (h Handler) GetInstagramPost(c echo.Context) error {
	if h.instagramPostSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس اینستاگرام در دسترس نیست"})
	}

	offset := 0
	if offsetStr := c.QueryParam("offset"); offsetStr != "" {
		if val, err := strconv.Atoi(offsetStr); err == nil {
			offset = val
		}
	}

	post := h.instagramPostSvc.GetTodayPost(offset)
	return c.JSON(http.StatusOK, post)
}

// ListInstagramLessons فهرست تمام پست‌ها و درس‌های آماده اینستاگرام را برمی‌گرداند.
func (h Handler) ListInstagramLessons(c echo.Context) error {
	if h.instagramPostSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس اینستاگرام در دسترس نیست"})
	}

	lessons := h.instagramPostSvc.ListLessons()
	return c.JSON(http.StatusOK, lessons)
}

// BuildCustomInstagramPost ساخت یا بازآفرینی کپشن و هشتگ برای یک درس سفارشی.
func (h Handler) BuildCustomInstagramPost(c echo.Context) error {
	if h.instagramPostSvc == nil {
		return c.JSON(http.StatusServiceUnavailable, echo.Map{"message": "سرویس اینستاگرام در دسترس نیست"})
	}

	var req instagrampost.InstagramLesson
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, echo.Map{"message": "داده‌های ارسالی نامعتبر است"})
	}

	built := h.instagramPostSvc.BuildCustomPost(req)
	return c.JSON(http.StatusOK, built)
}

