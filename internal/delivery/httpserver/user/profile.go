package userhandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/labstack/echo/v4"
)

func (h Handler) Profile(c echo.Context) error {

	const op = "userhandler.Profile"

	claims, err := claims.GetClaims(c)
	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	res, err := h.userSvc.Profile(claims.UserID)

	if err != nil {
		return richerror.New(op).WithErr(err)
	}

	return c.JSON(http.StatusOK, res)
}
