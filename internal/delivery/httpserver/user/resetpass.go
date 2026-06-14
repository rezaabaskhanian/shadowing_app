package userhandler

import (
	"log"
	"net/http"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/user/dto"

	"github.com/labstack/echo/v4"
)

func (h Handler) ResetPass(c echo.Context) error {
	const op = "httpserver.ResetPass"
	var req dto.ResetPasswordRequest

	if err := c.Bind(&req); err != nil {
		log.Println(op, "Bind error:", err)
		return richerror.New(op).WithErr(err)
	}

	// 3️⃣ اعتبارسنجی رمز عبور (خالی نباشد)
	if req.Password == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_password",
			"message": "رمز عبور نمی‌تواند خالی باشد",
		})
	}

	// 4️⃣ اعتبارسنجی طول رمز عبور (حداقل ۸ کاراکتر)
	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "weak_password",
			"message": "رمز عبور باید حداقل ۸ کاراکتر باشد",
		})
	}

	// 5️⃣ اعتبارسنجی تطابق رمز و تکرار آن
	if req.Password != req.ConfirmPassword {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "password_mismatch",
			"message": "رمز عبور و تکرار آن مطابقت ندارند",
		})
	}

	err := h.userSvc.ResetPassword(req)

	if err != nil {
		return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	}

	return c.JSON(http.StatusOK, "پسورد با موفقیت عوض شد")

}
