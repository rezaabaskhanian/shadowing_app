package progresshandler

// UpdateSceneProgress - به‌روزرسانی پیشرفت سناریو
// @Summary به‌روزرسانی پیشرفت کاربر در یک سناریو
// @Description پیشرفت کاربر در یک سناریو را به‌روزرسانی می‌کند
// @Tags Progress
// @Accept json
// @Produce json
// @Param request body dto.UpdateSceneProgressRequest true "اطلاعات پیشرفت"
// @Success 200 {object} dto.UpdateSceneProgressResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /api/v1/progress/scene [put]
// func (h *Handler) UpdateSceneProgress(c echo.Context) error {
// 	const op = "progresshandler.UpdateSceneProgress"

// 	var req dto.UpdateSceneProgressRequest
// 	if err := c.Bind(&req); err != nil {
// 		return c.JSON(http.StatusBadRequest, map[string]string{
// 			"error":   "invalid_request",
// 			"message": "درخواست نامعتبر است",
// 		})
// 	}

// 	// اعتبارسنجی اولیه
// 	if req.UserID == "" {
// 		return c.JSON(http.StatusBadRequest, map[string]string{
// 			"error":   "user_id_required",
// 			"message": "شناسه کاربر الزامی است",
// 		})
// 	}
// 	if req.SceneID == "" {
// 		return c.JSON(http.StatusBadRequest, map[string]string{
// 			"error":   "scene_id_required",
// 			"message": "شناسه سناریو الزامی است",
// 		})
// 	}

// 	// فراخوانی سرویس
// 	response, err := h.progressSvc.UpdateSceneProgress(c.Request().Context(), req)
// 	if err != nil {
// 		errorhandling.ErrorHandling(err, c)
// 	}

// 	return c.JSON(http.StatusOK, response)
// }
