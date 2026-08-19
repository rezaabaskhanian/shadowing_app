package landinghandler

import (
	"net/http"

	landingservice "shadowing-backend/internal/service/landing"

	"github.com/labstack/echo/v4"
)

// Handler روت‌های عمومی (بدون احراز هویت) صفحه‌ی معرفی www.lingoflow.ir را
// سرویس‌دهی می‌کند. مدیریت (CRUD) این محتوا در adminhandler است.
type Handler struct {
	landingSvc landingservice.Service
}

func New(landingSvc landingservice.Service) Handler {
	return Handler{landingSvc: landingSvc}
}

func (h Handler) SetPublicLandingRoutes(e *echo.Echo) {
	e.GET("/v1/public/landing-sections", h.ListSections)
}

type imageResp struct {
	ID  string `json:"id"`
	URL string `json:"url"`
}

type sectionResp struct {
	ID          string      `json:"id"`
	TabLabel    string      `json:"tab_label"`
	Title       string      `json:"title"`
	Description string      `json:"description"`
	Position    int         `json:"position"`
	Images      []imageResp `json:"images"`
}

func (h Handler) ListSections(c echo.Context) error {
	sections, err := h.landingSvc.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}

	resp := make([]sectionResp, 0, len(sections))
	for _, s := range sections {
		images := make([]imageResp, 0, len(s.Images))
		for _, img := range s.Images {
			images = append(images, imageResp{ID: img.ID.String(), URL: img.URL})
		}
		resp = append(resp, sectionResp{
			ID:          s.ID.String(),
			TabLabel:    s.TabLabel,
			Title:       s.Title,
			Description: s.Description,
			Position:    s.Position,
			Images:      images,
		})
	}

	return c.JSON(http.StatusOK, map[string]any{"sections": resp})
}
