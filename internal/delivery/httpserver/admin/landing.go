package adminhandler

import (
	"net/http"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
)

type landingImageResp struct {
	ID  string `json:"id"`
	URL string `json:"url"`
}

type landingSectionResp struct {
	ID          string             `json:"id"`
	TabLabel    string             `json:"tab_label"`
	Title       string             `json:"title"`
	Description string             `json:"description"`
	Position    int                `json:"position"`
	Images      []landingImageResp `json:"images"`
}

// ListLandingSections همه‌ی بخش‌های صفحه‌ی معرفی را برای ویرایش در پنل
// ادمین برمی‌گرداند.
func (h Handler) ListLandingSections(c echo.Context) error {
	sections, err := h.landingSvc.List(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت بخش‌ها",
		})
	}

	resp := make([]landingSectionResp, 0, len(sections))
	for _, s := range sections {
		images := make([]landingImageResp, 0, len(s.Images))
		for _, img := range s.Images {
			images = append(images, landingImageResp{ID: img.ID.String(), URL: img.URL})
		}
		resp = append(resp, landingSectionResp{
			ID: s.ID.String(), TabLabel: s.TabLabel, Title: s.Title,
			Description: s.Description, Position: s.Position, Images: images,
		})
	}

	return c.JSON(http.StatusOK, map[string]any{"sections": resp})
}

type landingSectionRequest struct {
	TabLabel    string `json:"tab_label"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Position    int    `json:"position"`
}

// CreateLandingSection یک بخش تازه برای صفحه‌ی معرفی می‌سازد.
func (h Handler) CreateLandingSection(c echo.Context) error {
	var req landingSectionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.TabLabel == "" || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "برچسب تب و عنوان الزامی است",
		})
	}

	s, err := h.landingSvc.Create(c.Request().Context(), req.TabLabel, req.Title, req.Description, req.Position)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ساخت بخش",
		})
	}

	return c.JSON(http.StatusCreated, landingSectionResp{
		ID: s.ID.String(), TabLabel: s.TabLabel, Title: s.Title,
		Description: s.Description, Position: s.Position, Images: []landingImageResp{},
	})
}

// UpdateLandingSection فیلدهای یک بخش را ویرایش می‌کند.
func (h Handler) UpdateLandingSection(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	var req landingSectionRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.TabLabel == "" || req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{
			"error":   "invalid_input",
			"message": "برچسب تب و عنوان الزامی است",
		})
	}

	if err := h.landingSvc.Update(c.Request().Context(), id, req.TabLabel, req.Title, req.Description, req.Position); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ویرایش بخش",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "بخش ویرایش شد"})
}

// DeleteLandingSection یک بخش (و عکس‌هایش) را حذف می‌کند.
func (h Handler) DeleteLandingSection(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	if err := h.landingSvc.Delete(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در حذف بخش",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "بخش حذف شد"})
}

type addLandingImageRequest struct {
	URL      string `json:"url"`
	Position int    `json:"position"`
}

// AddLandingSectionImage یک عکس (که قبلاً با /v1/admin/upload آپلود شده) را
// به یک بخش وصل می‌کند.
func (h Handler) AddLandingSectionImage(c echo.Context) error {
	sectionID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	var req addLandingImageRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.URL == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_input", "message": "url الزامی است"})
	}

	img, err := h.landingSvc.AddImage(c.Request().Context(), sectionID, req.URL, req.Position)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در افزودن عکس",
		})
	}

	return c.JSON(http.StatusCreated, landingImageResp{ID: img.ID.String(), URL: img.URL})
}

// DeleteLandingSectionImage یک عکس را از یک بخش حذف می‌کند.
func (h Handler) DeleteLandingSectionImage(c echo.Context) error {
	imageID, err := uuid.Parse(c.Param("imageID"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	if err := h.landingSvc.DeleteImage(c.Request().Context(), imageID); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در حذف عکس",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "عکس حذف شد"})
}
