package userhandler

import (
	"fmt"
	"log"
	"net/http"
	"shadowing-backend/internal/service/user/dto"

	"github.com/labstack/echo/v4"
)

// ✅ تابع اعتبارسنجی شماره تلفن
func validatePhoneNumber(phone string) error {
	if phone == "" {
		return fmt.Errorf("شماره تلفن نمی‌تواند خالی باشد")
	}
	if len(phone) != 11 {
		return fmt.Errorf("شماره تلفن باید 11 رقم باشد")
	}
	if phone[0:2] != "09" {
		return fmt.Errorf("شماره تلفن باید با 09 شروع شود")
	}
	return nil
}
func (h Handler) Login(c echo.Context) error {
	const op = "httpserver.Login"
	var req dto.LoginRequest

	// 1️⃣ اعتبارسنجی Binding
	if err := c.Bind(&req); err != nil {
		log.Println(op, "Bind error:", err)
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	// 2️⃣ اعتبارسنجی شماره تلفن
	if err := validatePhoneNumber(req.PhoneNumber); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_phone",
			"message": err.Error(),
		})
	}

	// 3️⃣ اعتبارسنجی رمز عبور (خالی نباشد)
	if req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_password",
			"message": "رمز عبور نمی‌تواند خالی باشد",
		})
	}

	// 4️⃣ فراخوانی سرویس
	res, err := h.userSvc.Login(req)

	if err != nil {
		// تشخیص نوع خطا از سرویس
		switch err.Error() {
		case "کاربری با این شماره تلفن یافت نشد":
			return c.JSON(http.StatusNotFound, map[string]string{
				"error":   "user_not_found",
				"message": "کاربری با این شماره تلفن یافت نشد",
			})
		case "رمز عبور اشتباه است":
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"error":   "invalid_credentials",
				"message": "شماره تلفن یا رمز عبور اشتباه است",
			})
		default:
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error":   "internal_error",
				"message": "خطای داخلی سرور",
			})
		}
	}

	return c.JSON(http.StatusOK, res)
}
