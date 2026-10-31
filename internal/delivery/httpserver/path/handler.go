package pathhandler

import (
	"net/http"

	"shadowing-backend/internal/delivery/middlware"
	"shadowing-backend/internal/pkg/claims"
	"shadowing-backend/internal/pkg/errorhandling"
	authservice "shadowing-backend/internal/service/auth"
	pathservice "shadowing-backend/internal/service/path"

	"github.com/labstack/echo/v4"
)

type Handler struct {
	svc        *pathservice.Service
	authSvc    authservice.Service
	authConfig authservice.Config
}

func New(svc *pathservice.Service, authSvc authservice.Service, authConfig authservice.Config) Handler {
	return Handler{svc: svc, authSvc: authSvc, authConfig: authConfig}
}

func (h Handler) SetPathRoutes(e *echo.Echo) {
	auth := middlware.Auth(h.authSvc, h.authConfig)

	app := e.Group("/v1/paths", auth)
	app.GET("", h.Paths)
	app.GET("/:level", h.Path)
	app.GET("/:level/self-intro", h.SelfIntros)
	app.PUT("/:level/self-intro/:stage", h.SaveSelfIntro)
	app.POST("/weeks/:id/items/:key/complete", h.CompleteItem)
	app.GET("/weeks/:id/checkpoint", h.Checkpoint)
	app.POST("/weeks/:id/checkpoint", h.SubmitCheckpoint)

	goal := e.Group("/v1/goal-plan", auth)
	goal.GET("", h.GoalPlan)
	goal.PUT("", h.SaveGoalPlan)
	goal.DELETE("", h.DeleteGoalPlan)
	goal.GET("/map", h.GoalMap)
	goal.GET("/maps", h.GoalMaps)
	goal.GET("/maps/:goal", h.ExploreGoalMap)

	adminGoal := e.Group("/v1/admin/goal-packs", auth, middlware.AdminOnly)
	adminGoal.GET("/:goal", h.AdminGoalPack)
	adminGoal.PUT("/:goal", h.AdminSaveGoalPack)
	adminGoal.GET("/:goal/extras", h.AdminGoalExtras)
	adminGoal.PUT("/:goal/extras", h.AdminSaveGoalExtras)
	adminGoal.GET("/:goal/map", h.AdminGoalMap)
	adminGoal.PUT("/:goal/map", h.AdminSaveGoalMap)

	admin := e.Group("/v1/admin/paths", auth, middlware.AdminOnly)
	admin.GET("", h.AdminPaths)
	admin.GET("/:level", h.AdminPath)
	admin.PUT("/:level", h.AdminSavePath)
	admin.PUT("/:level/active", h.AdminSetActive)
	admin.POST("/:level/checkpoint-audio", h.AdminCheckpointAudio)
}

func userID(c echo.Context) (string, error) {
	userClaims, err := claims.GetClaims(c)
	if err != nil {
		return "", c.JSON(http.StatusUnauthorized, map[string]string{"message": "احراز هویت نامعتبر است"})
	}
	return userClaims.UserID, nil
}

func respond(c echo.Context, data any, err error) error {
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, data)
}

func badRequest(c echo.Context) error {
	return c.JSON(http.StatusBadRequest, map[string]string{"message": "درخواست نامعتبر"})
}

// ---------- اپ ----------

func (h Handler) Paths(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	paths, err := h.svc.Paths(c.Request().Context(), uid)
	return respond(c, paths, err)
}

func (h Handler) Path(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	p, err := h.svc.Path(c.Request().Context(), uid, c.Param("level"))
	return respond(c, p, err)
}

func (h Handler) CompleteItem(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	err = h.svc.CompleteItem(c.Request().Context(), uid, c.Param("id"), c.Param("key"))
	return respond(c, echo.Map{"ok": true}, err)
}

func (h Handler) Checkpoint(c echo.Context) error {
	cp, err := h.svc.Checkpoint(c.Request().Context(), c.Param("id"))
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSONBlob(http.StatusOK, cp)
}

func (h Handler) SubmitCheckpoint(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Scores map[string]int `json:"scores"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.SubmitCheckpoint(c.Request().Context(), uid, c.Param("id"), req.Scores)
	return respond(c, res, err)
}

func (h Handler) SelfIntros(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	res, err := h.svc.SelfIntros(c.Request().Context(), uid, c.Param("level"))
	return respond(c, res, err)
}

func (h Handler) SaveSelfIntro(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req struct {
		Transcript      string `json:"transcript"`
		DurationSeconds int    `json:"duration_seconds"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	res, err := h.svc.SaveSelfIntro(c.Request().Context(), uid, c.Param("level"), c.Param("stage"), req.Transcript, req.DurationSeconds)
	return respond(c, res, err)
}

// ---------- ادمین ----------

func (h Handler) AdminPaths(c echo.Context) error {
	paths, err := h.svc.AdminPaths(c.Request().Context())
	return respond(c, paths, err)
}

func (h Handler) AdminPath(c echo.Context) error {
	p, err := h.svc.AdminPath(c.Request().Context(), c.Param("level"))
	return respond(c, p, err)
}

func (h Handler) AdminSavePath(c echo.Context) error {
	var req pathservice.Path
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	req.Level = c.Param("level")
	p, err := h.svc.AdminSavePath(c.Request().Context(), req)
	return respond(c, p, err)
}

func (h Handler) AdminSetActive(c echo.Context) error {
	var req struct {
		IsActive bool `json:"is_active"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	err := h.svc.AdminSetActive(c.Request().Context(), c.Param("level"), req.IsActive)
	return respond(c, echo.Map{"is_active": req.IsActive}, err)
}

func (h Handler) AdminCheckpointAudio(c echo.Context) error {
	var req struct {
		Voices map[string]string `json:"voices"`
	}
	_ = c.Bind(&req)
	made, err := h.svc.AdminGenerateCheckpointAudio(c.Request().Context(), c.Param("level"), req.Voices)
	if err != nil && made > 0 {
		return c.JSON(http.StatusBadGateway, echo.Map{"message": err.Error(), "made": made})
	}
	return respond(c, echo.Map{"made": made}, err)
}

// ---------- مسیر هدف‌محور ----------

// GoalPlan برنامه‌ی کاربر؛ بدون برنامه {"plan": null}.
func (h Handler) GoalPlan(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	v, err := h.svc.GoalPlan(c.Request().Context(), uid)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	if v == nil {
		return c.JSON(http.StatusOK, echo.Map{"plan": nil})
	}
	return c.JSON(http.StatusOK, v)
}

func (h Handler) SaveGoalPlan(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	var req pathservice.SaveGoalPlanInput
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	v, err := h.svc.SaveGoalPlan(c.Request().Context(), uid, req)
	return respond(c, v, err)
}

func (h Handler) DeleteGoalPlan(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	return respond(c, echo.Map{"ok": true}, h.svc.DeleteGoalPlan(c.Request().Context(), uid))
}

func (h Handler) AdminGoalPack(c echo.Context) error {
	items, err := h.svc.AdminGoalPack(c.Request().Context(), c.Param("goal"))
	return respond(c, echo.Map{"items": items}, err)
}

func (h Handler) AdminSaveGoalPack(c echo.Context) error {
	var req struct {
		Items []pathservice.GoalSituation `json:"items"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	err := h.svc.AdminSaveGoalPack(c.Request().Context(), c.Param("goal"), req.Items)
	return respond(c, echo.Map{"ok": true, "count": len(req.Items)}, err)
}

func (h Handler) AdminGoalExtras(c echo.Context) error {
	items, err := h.svc.AdminGoalExtras(c.Request().Context(), c.Param("goal"))
	return respond(c, echo.Map{"items": items}, err)
}

func (h Handler) AdminSaveGoalExtras(c echo.Context) error {
	var req struct {
		Items []pathservice.GoalExtra `json:"items"`
	}
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	err := h.svc.AdminSaveGoalExtras(c.Request().Context(), c.Param("goal"), req.Items)
	return respond(c, echo.Map{"ok": true, "count": len(req.Items)}, err)
}

// GoalMap نقشه‌ی هدفِ کاربر؛ بدون برنامه یا بدون نقشه {"map": null}.
func (h Handler) GoalMap(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	m, err := h.svc.GoalMap(c.Request().Context(), uid)
	if err != nil {
		return errorhandling.ErrorHandling(err, c)
	}
	return c.JSON(http.StatusOK, echo.Map{"map": m})
}

// GoalMaps نمای کوچک نقشه‌های ساخته‌شده، برای انتخاب نقشه وقتی کاربر برنامه ندارد.
func (h Handler) GoalMaps(c echo.Context) error {
	list, err := h.svc.GoalMaps(c.Request().Context())
	return respond(c, echo.Map{"maps": list}, err)
}

// ExploreGoalMap نقشه‌ی یک هدف با موقعیت‌هایش برای سطحِ ?level= (بدون برنامه).
func (h Handler) ExploreGoalMap(c echo.Context) error {
	uid, err := userID(c)
	if uid == "" {
		return err
	}
	m, view, err := h.svc.ExploreGoalMap(c.Request().Context(), uid, c.Param("goal"), c.QueryParam("level"))
	return respond(c, echo.Map{"map": m, "plan": view}, err)
}

func (h Handler) AdminGoalMap(c echo.Context) error {
	m, err := h.svc.AdminGoalMap(c.Request().Context(), c.Param("goal"))
	return respond(c, echo.Map{"map": m}, err)
}

func (h Handler) AdminSaveGoalMap(c echo.Context) error {
	var req pathservice.GoalMap
	if err := c.Bind(&req); err != nil {
		return badRequest(c)
	}
	req.Goal = c.Param("goal")
	err := h.svc.AdminSaveGoalMap(c.Request().Context(), req)
	return respond(c, echo.Map{"ok": true, "spots": len(req.Spots)}, err)
}
