package claims

import (
	"fmt"
	"shadowing-backend/internal/config"
	authservice "shadowing-backend/internal/service/auth"

	"github.com/labstack/echo/v4"
)

func GetClaims(c echo.Context) (*authservice.Claims, error) {

	claims, ok := c.Get(config.AuthMiddlewareContextKey).(*authservice.Claims)
	if !ok || claims == nil {
		return nil, fmt.Errorf("claims not found in context")
	}

	return c.Get(config.AuthMiddlewareContextKey).(*authservice.Claims), nil

}
