package middlware

import (
	"net/http"

	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/richerror"
	authservice "shadowing-backend/internal/service/auth"

	mw "github.com/labstack/echo-jwt/v4"
	"github.com/labstack/echo/v4"

	cfg "shadowing-backend/internal/config"
)

func Auth(service authservice.Service, config authservice.Config) echo.MiddlewareFunc {
	const op = "middleware.Auth"

	// get token without "Bearer "  echo is delete berare then
	return mw.WithConfig(mw.Config{

		ContextKey: cfg.AuthMiddlewareContextKey,
		SigningKey: []byte(config.SignKey),
		// TODO - as sign method string to config...
		SigningMethod: "HS256",

		ErrorHandler: func(c echo.Context, err error) error {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"message": "لطفا ابتدا وارد حساب کاربری خود شوید",
			})
		},

		ParseTokenFunc: func(c echo.Context, auth string) (interface{}, error) {

			claims, err := service.ParseToken("Bearer " + auth)

			if err != nil {
				return nil, richerror.New(op).WithErr(err).WithMessage("dont create clamis")
			}

			return claims, nil
		},
	})
}

// AdminOnly بررسی نقش ادمین (بعد از Auth باید بیاید)
func AdminOnly(next echo.HandlerFunc) echo.HandlerFunc {
	return func(c echo.Context) error {
		userClaims, err := claims.GetClaims(c)
		if err != nil {
			return c.JSON(http.StatusUnauthorized, map[string]string{
				"message": "احراز هویت ناموفق",
			})
		}

		if userClaims.Role != "admin" {
			return c.JSON(http.StatusForbidden, map[string]string{
				"message": "دسترسی غیرمجاز. فقط ادمین‌ها می‌توانند وارد این بخش شوند.",
			})
		}

		return next(c)
	}
}
