package habithandler

import (
	"net/http"
	"strconv"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/pkg/upload"

	"github.com/labstack/echo/v4"
)

// ListActivities فهرست فعالیت‌های روزمره‌ی قابل استفاده در ماموریت عادت را
// برمی‌گرداند (برای نمایش آیکن/نام در اپ).
func (h Handler) ListActivities(c echo.Context) error {
	activities, err := h.habitSvc.ListActivities(c.Request().Context())
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, echo.Map{"activities": activities})
}

// TodayMission ماموریت عادت امروز کاربر را برمی‌گرداند.
func (h Handler) TodayMission(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	mission, err := h.habitSvc.TodayMission(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, mission)
}

// StartMission ماموریت را وارد وضعیت در حال انجام می‌کند.
func (h Handler) StartMission(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	if err := h.habitSvc.StartMission(c.Request().Context(), c.Param("id"), userClaims.UserID); err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, echo.Map{"message": "ماموریت شروع شد"})
}

// SubmitSession جلسه‌ی تمرین عادت (صدای کاربر در قالب فعالیت روزمره) را ثبت
// و نتیجه‌ی تطبیق با دیالوگ هدف را برمی‌گرداند.
func (h Handler) SubmitSession(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	var localPath string
	if fileHeader, ferr := c.FormFile("audio"); ferr == nil {
		localPath, err = upload.SaveRecording(fileHeader, h.uploadDir)
		if err != nil {
			return errorhandling.ErrorHandling(err, c)
		}
	}

	duration, _ := strconv.Atoi(c.FormValue("duration"))

	result, err := h.habitSvc.SubmitSession(c.Request().Context(), c.Param("id"), userClaims.UserID, localPath, duration)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, result)
}

// History آمار و فهرست ماموریت‌های تکمیل‌شده‌ی کاربر را برمی‌گرداند.
func (h Handler) History(c echo.Context) error {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return c.JSON(http.StatusUnauthorized, echo.Map{"message": "احراز هویت ناموفق"})
	}

	history, err := h.habitSvc.History(c.Request().Context(), userClaims.UserID)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, history)
}
