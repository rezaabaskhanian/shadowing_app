package userhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	otpservice "shadowing-backend/internal/service/otp"
)

type sendOtpRequest struct {
	Phone   string `json:"phone"`
	Purpose string `json:"purpose"`
}

type verifyOtpRequest struct {
	Phone   string `json:"phone"`
	Purpose string `json:"purpose"`
	Code    string `json:"code"`
}

func validPurpose(p string) bool {
	return p == otpservice.PurposeRegister || p == otpservice.PurposeReset
}

func (h Handler) SendOtp(c echo.Context) error {
	var req sendOtpRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	if req.Phone == "" || !validPurpose(req.Purpose) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "شماره تلفن یا هدف نامعتبر است",
		})
	}

	if req.Purpose == otpservice.PurposeReset {
		if _, err := h.userSvc.GetUserByPhone(req.Phone); err != nil {
			return c.JSON(http.StatusNotFound, map[string]string{
				"error":   "not_found",
				"message": "کاربری با این شماره پیدا نشد",
			})
		}
	} else {
		if _, err := h.userSvc.GetUserByPhone(req.Phone); err == nil {
			return c.JSON(http.StatusConflict, map[string]string{
				"error":   "duplicate_phone",
				"message": "این شماره قبلاً ثبت شده است",
			})
		}
	}

	if err := h.otpSvc.Send(c.Request().Context(), req.Phone, req.Purpose); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "otp_send_failed",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "کد تایید ارسال شد"})
}

func (h Handler) VerifyOtp(c echo.Context) error {
	var req verifyOtpRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	if req.Phone == "" || req.Code == "" || !validPurpose(req.Purpose) {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "ورودی نامعتبر است",
		})
	}

	token, err := h.otpSvc.Verify(c.Request().Context(), req.Phone, req.Purpose, req.Code)
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "otp_verify_failed",
			"message": err.Error(),
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"token": token})
}
