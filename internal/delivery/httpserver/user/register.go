package userhandler

import (
	"net/http"

	"github.com/labstack/echo/v4"

	"shadowing-backend/internal/pkg/errmesg"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/user/dto"
)

func (h Handler) Register(c echo.Context) error {

	var uReq dto.RegisterRequest

	if err := c.Bind(&uReq); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	resp, err := h.userSvc.Register(c.Request().Context(), uReq)

	// if err != nil {

	// 	return echo.NewHTTPError(http.StatusInternalServerError, err.Error())
	// }

	if err != nil {
		// ✅ تشخیص نوع خطا و ارسال Status Code مناسب
		switch err.Error() {
		case errmesg.ErrorMsgPhoneNumberIsNotUniqe:
			return c.JSON(http.StatusConflict, map[string]string{
				"error":   "duplicate_phone",
				"message": "شماره تلفن قبلاً ثبت شده است",
			})

		case errmesg.ErrorMsgPhoneNumberIsNotValid:
			return c.JSON(http.StatusBadRequest, map[string]string{
				"error":   "invalid_input",
				"message": err.Error(),
			})
		default:
			if re, ok := err.(richerror.RichError); ok && (re.Kind() == richerror.KindInvalid || re.Kind() == richerror.KindNotFound) {
				return c.JSON(http.StatusBadRequest, map[string]string{
					"error":   "otp_invalid",
					"message": re.Message(),
				})
			}
			// خطای غیرمنتظره (دیتابیس، توکن، ...)
			return c.JSON(http.StatusInternalServerError, map[string]string{
				"error":   "internal_error",
				"message": "خطای داخلی سرور",
			})
		}
	}

	return c.JSON(http.StatusCreated, resp)

}
