package aiconversationhandler

import (
	"net/http"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/errorhandling"

	"github.com/labstack/echo/v4"
)

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

// ListRoleplays - سناریوهای منتشرشده‌ی «نقش‌آفرینی» برای اپ
func (h *Handler) ListRoleplays(c echo.Context) error {
	list, err := h.svc.ListRoleplays(c.Request().Context())
	return respond(c, list, err)
}

func (h *Handler) AdminListRoleplays(c echo.Context) error {
	list, err := h.svc.AdminListRoleplays(c.Request().Context())
	return respond(c, list, err)
}

func (h *Handler) AdminGetRoleplay(c echo.Context) error {
	rp, err := h.svc.AdminGetRoleplay(c.Request().Context(), c.Param("id"))
	return respond(c, rp, err)
}

func (h *Handler) saveRoleplay(c echo.Context, id string) error {
	var req aiconversation.Roleplay
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
	}
	rp, err := h.svc.AdminSaveRoleplay(c.Request().Context(), id, req)
	return respond(c, rp, err)
}

func (h *Handler) AdminCreateRoleplay(c echo.Context) error { return h.saveRoleplay(c, "") }
func (h *Handler) AdminUpdateRoleplay(c echo.Context) error {
	return h.saveRoleplay(c, c.Param("id"))
}

func (h *Handler) AdminDeleteRoleplay(c echo.Context) error {
	err := h.svc.AdminDeleteRoleplay(c.Request().Context(), c.Param("id"))
	return respond(c, map[string]bool{"ok": true}, err)
}
