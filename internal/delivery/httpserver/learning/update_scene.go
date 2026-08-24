package learninghandler

import (
	"net/http"
	"shadowing-backend/internal/pkg/errorhandling"
	"shadowing-backend/internal/service/learning/dto"

	"github.com/labstack/echo/v4"
)

func (h Handler) UpdateScene(c echo.Context) error {

	var req dto.Scene

	if err := c.Bind(&req); err != nil {

		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_request",
			"message": "درخواست نامعتبر است",
		})
	}

	updateReq := dto.CreateSceneRequest{
		Title:              req.Title,
		Description:        req.Description,
		BackgroundImageURL: req.BackgroundImageURL,
		Difficulty:         req.Difficulty,
		Hotspots:           req.Hotspots,
		IsLocked:           req.IsLocked,
		Category:           req.Category,
	}

	scene, err := h.learningSvc.UpdateScene(c.Request().Context(), req.ID, updateReq)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}

	return c.JSON(http.StatusOK, scene)
}
