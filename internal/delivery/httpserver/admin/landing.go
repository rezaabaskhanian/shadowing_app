package adminhandler

import (
	"net/http"

	postgreslanding "shadowing-backend/internal/repository/postgres/landing"

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

type landingSettingsResp struct {
	HeroTitle     string `json:"hero_title"`
	HeroSubtitle  string `json:"hero_subtitle"`
	HeroImageURL  string `json:"hero_image_url"`
	GooglePlayURL string `json:"google_play_url"`
	BazaarURL     string `json:"bazaar_url"`
	CTATitle      string `json:"cta_title"`
	CTASubtitle   string `json:"cta_subtitle"`
}

// GetLandingSettings تنظیمات کلی صفحه‌ی معرفی (هیرو، دکمه‌های دانلود، بنر پایانی) را برمی‌گرداند.
func (h Handler) GetLandingSettings(c echo.Context) error {
	s, err := h.landingSvc.GetSettings(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت تنظیمات صفحه‌ی معرفی",
		})
	}

	return c.JSON(http.StatusOK, landingSettingsResp{
		HeroTitle: s.HeroTitle, HeroSubtitle: s.HeroSubtitle, HeroImageURL: s.HeroImageURL,
		GooglePlayURL: s.GooglePlayURL, BazaarURL: s.BazaarURL, CTATitle: s.CTATitle, CTASubtitle: s.CTASubtitle,
	})
}

// UpdateLandingSettings تنظیمات کلی صفحه‌ی معرفی را ویرایش می‌کند.
func (h Handler) UpdateLandingSettings(c echo.Context) error {
	var req landingSettingsResp
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}

	err := h.landingSvc.UpdateSettings(c.Request().Context(), postgreslanding.Settings{
		HeroTitle: req.HeroTitle, HeroSubtitle: req.HeroSubtitle, HeroImageURL: req.HeroImageURL,
		GooglePlayURL: req.GooglePlayURL, BazaarURL: req.BazaarURL, CTATitle: req.CTATitle, CTASubtitle: req.CTASubtitle,
	})
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ذخیره تنظیمات صفحه‌ی معرفی",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ذخیره شد"})
}

var allowedHighlightKinds = map[string]bool{"feature": true, "step": true}

type landingHighlightResp struct {
	ID          string `json:"id"`
	Kind        string `json:"kind"`
	Icon        string `json:"icon"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Position    int    `json:"position"`
}

type landingHighlightRequest struct {
	Icon        string `json:"icon"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Position    int    `json:"position"`
}

// ListLandingHighlights آیتم‌های یک نوع مشخص (feature یا step) را برمی‌گرداند.
func (h Handler) ListLandingHighlights(c echo.Context) error {
	kind := c.Param("kind")
	if !allowedHighlightKinds[kind] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_kind", "message": "نوع نامعتبر است"})
	}

	highlights, err := h.landingSvc.ListHighlights(c.Request().Context(), kind)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت آیتم‌ها",
		})
	}

	resp := make([]landingHighlightResp, 0, len(highlights))
	for _, hl := range highlights {
		resp = append(resp, landingHighlightResp{
			ID: hl.ID.String(), Kind: hl.Kind, Icon: hl.Icon, Title: hl.Title, Description: hl.Description, Position: hl.Position,
		})
	}

	return c.JSON(http.StatusOK, map[string]any{"highlights": resp})
}

// CreateLandingHighlight یک آیتم تازه (فیچر یا مرحله) می‌سازد.
func (h Handler) CreateLandingHighlight(c echo.Context) error {
	kind := c.Param("kind")
	if !allowedHighlightKinds[kind] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_kind", "message": "نوع نامعتبر است"})
	}

	var req landingHighlightRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_input", "message": "عنوان الزامی است"})
	}

	hl, err := h.landingSvc.CreateHighlight(c.Request().Context(), kind, req.Icon, req.Title, req.Description, req.Position)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ساخت آیتم",
		})
	}

	return c.JSON(http.StatusCreated, landingHighlightResp{
		ID: hl.ID.String(), Kind: hl.Kind, Icon: hl.Icon, Title: hl.Title, Description: hl.Description, Position: hl.Position,
	})
}

// UpdateLandingHighlight فیلدهای یک آیتم را ویرایش می‌کند.
func (h Handler) UpdateLandingHighlight(c echo.Context) error {
	if !allowedHighlightKinds[c.Param("kind")] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_kind", "message": "نوع نامعتبر است"})
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	var req landingHighlightRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.Title == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_input", "message": "عنوان الزامی است"})
	}

	if err := h.landingSvc.UpdateHighlight(c.Request().Context(), id, req.Icon, req.Title, req.Description, req.Position); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ویرایش آیتم",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ویرایش شد"})
}

// DeleteLandingHighlight یک آیتم را حذف می‌کند.
func (h Handler) DeleteLandingHighlight(c echo.Context) error {
	if !allowedHighlightKinds[c.Param("kind")] {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_kind", "message": "نوع نامعتبر است"})
	}
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	if err := h.landingSvc.DeleteHighlight(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در حذف آیتم",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "حذف شد"})
}

type landingFAQResp struct {
	ID       string `json:"id"`
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Position int    `json:"position"`
}

type landingFAQRequest struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
	Position int    `json:"position"`
}

// ListLandingFAQs سوالات متداول را برمی‌گرداند.
func (h Handler) ListLandingFAQs(c echo.Context) error {
	faqs, err := h.landingSvc.ListFAQs(c.Request().Context())
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در دریافت سوالات متداول",
		})
	}

	resp := make([]landingFAQResp, 0, len(faqs))
	for _, f := range faqs {
		resp = append(resp, landingFAQResp{ID: f.ID.String(), Question: f.Question, Answer: f.Answer, Position: f.Position})
	}

	return c.JSON(http.StatusOK, map[string]any{"faqs": resp})
}

// CreateLandingFAQ یک سوال متداول تازه می‌سازد.
func (h Handler) CreateLandingFAQ(c echo.Context) error {
	var req landingFAQRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.Question == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_input", "message": "سوال الزامی است"})
	}

	f, err := h.landingSvc.CreateFAQ(c.Request().Context(), req.Question, req.Answer, req.Position)
	if err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ساخت سوال متداول",
		})
	}

	return c.JSON(http.StatusCreated, landingFAQResp{ID: f.ID.String(), Question: f.Question, Answer: f.Answer, Position: f.Position})
}

// UpdateLandingFAQ فیلدهای یک سوال متداول را ویرایش می‌کند.
func (h Handler) UpdateLandingFAQ(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	var req landingFAQRequest
	if err := c.Bind(&req); err != nil {
		return echo.NewHTTPError(http.StatusBadRequest)
	}
	if req.Question == "" {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_input", "message": "سوال الزامی است"})
	}

	if err := h.landingSvc.UpdateFAQ(c.Request().Context(), id, req.Question, req.Answer, req.Position); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در ویرایش سوال متداول",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "ویرایش شد"})
}

// DeleteLandingFAQ یک سوال متداول را حذف می‌کند.
func (h Handler) DeleteLandingFAQ(c echo.Context) error {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid_id", "message": "شناسه نامعتبر است"})
	}

	if err := h.landingSvc.DeleteFAQ(c.Request().Context(), id); err != nil {
		return c.JSON(http.StatusInternalServerError, map[string]string{
			"error":   "internal_error",
			"message": "خطا در حذف سوال متداول",
		})
	}

	return c.JSON(http.StatusOK, map[string]string{"message": "حذف شد"})
}
