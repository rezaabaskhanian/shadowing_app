package landinghandler

import (
	"net/http"

	postgreslanding "shadowing-backend/internal/repository/postgres/landing"
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

type settingsResp struct {
	HeroTitle     string `json:"hero_title"`
	HeroSubtitle  string `json:"hero_subtitle"`
	HeroImageURL  string `json:"hero_image_url"`
	GooglePlayURL string `json:"google_play_url"`
	BazaarURL     string `json:"bazaar_url"`
	CTATitle      string `json:"cta_title"`
	CTASubtitle   string `json:"cta_subtitle"`
}

type highlightResp struct {
	ID          string `json:"id"`
	Icon        string `json:"icon"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Position    int    `json:"position"`
}

type faqResp struct {
	ID       string `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Position int    `json:"position"`
}

func (h Handler) ListSections(c echo.Context) error {
	ctx := c.Request().Context()

	sections, err := h.landingSvc.List(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}
	settings, err := h.landingSvc.GetSettings(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}
	features, err := h.landingSvc.ListHighlights(ctx, "feature")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}
	steps, err := h.landingSvc.ListHighlights(ctx, "step")
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}
	faqs, err := h.landingSvc.ListFAQs(ctx)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت محتوای صفحه",
		})
	}

	sectionsResp := make([]sectionResp, 0, len(sections))
	for _, s := range sections {
		images := make([]imageResp, 0, len(s.Images))
		for _, img := range s.Images {
			images = append(images, imageResp{ID: img.ID.String(), URL: img.URL})
		}
		sectionsResp = append(sectionsResp, sectionResp{
			ID:          s.ID.String(),
			TabLabel:    s.TabLabel,
			Title:       s.Title,
			Description: s.Description,
			Position:    s.Position,
			Images:      images,
		})
	}

	toHighlightResp := func(items []postgreslanding.Highlight) []highlightResp {
		resp := make([]highlightResp, 0, len(items))
		for _, hl := range items {
			resp = append(resp, highlightResp{ID: hl.ID.String(), Icon: hl.Icon, Title: hl.Title, Description: hl.Description, Position: hl.Position})
		}
		return resp
	}

	faqsResp := make([]faqResp, 0, len(faqs))
	for _, f := range faqs {
		faqsResp = append(faqsResp, faqResp{ID: f.ID.String(), Question: f.Question, Answer: f.Answer, Position: f.Position})
	}

	return c.JSON(http.StatusOK, map[string]any{
		"sections": sectionsResp,
		"settings": settingsResp{
			HeroTitle: settings.HeroTitle, HeroSubtitle: settings.HeroSubtitle, HeroImageURL: settings.HeroImageURL,
			GooglePlayURL: settings.GooglePlayURL, BazaarURL: settings.BazaarURL, CTATitle: settings.CTATitle, CTASubtitle: settings.CTASubtitle,
		},
		"highlights": map[string]any{
			"features": toHighlightResp(features),
			"steps":    toHighlightResp(steps),
		},
		"faqs": faqsResp,
	})
}
