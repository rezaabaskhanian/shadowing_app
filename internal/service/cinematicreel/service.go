package cinematicreel

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"
	"time"

	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/outboundhttp"
	settingsservice "shadowing-backend/internal/service/settings"

	"github.com/google/uuid"
)

// Endpoint شناسه رسمی مدل‌ها در پلتفرم fal.ai
const (
	EndpointFluxDev         = "fal-ai/flux/dev"
	EndpointFluxSchnell     = "fal-ai/flux/schnell"
	EndpointKling25Turbo    = "fal-ai/kling-video/v2.5-turbo/standard/image-to-video"
	EndpointMiniMaxH3Turbo  = "minimax/h3-max-turbo/image-to-video"
	EndpointMiniMaxH3Std    = "minimax/h3-max/image-to-video"
)

// قیمت‌های رسمی بر حسب دلار بر ثانیه یا هر تصویر
const (
	CostFluxDevUSD        = 0.025
	CostKling25TurboPerSec = 0.042 // ۵ ثانیه = ۰٫۲۱ دلار
	CostMiniMaxTurboPerSec = 0.015 // ۵ ثانیه = ۰٫۰۷۵ دلار
	CostMiniMaxStdPerSec   = 0.030 // ۵ ثانیه = ۰٫۱۵ دلار
)

type PocStatus struct {
	ID                string  `json:"id"`
	Status            string  `json:"status"` // idle, generating_image, generating_video, completed, failed
	Progress          int     `json:"progress"`
	Message           string  `json:"message"`
	ReferenceImageURL string  `json:"reference_image_url"`
	VideoURL          string  `json:"video_url"`
	ModelUsed         string  `json:"model_used"`
	RealCostUSD       float64 `json:"real_cost_usd"`
	DurationSec       int     `json:"duration_sec"`
	ElapsedSec        float64 `json:"elapsed_sec"`
	Error             string  `json:"error,omitempty"`
	CreatedAt         string  `json:"created_at"`
}

type Service struct {
	settings *settingsservice.Service
	store    filestore.Store
	client   *http.Client

	mu        sync.RWMutex
	lastPoc   *PocStatus
	isBusy    bool
}

func New(settings *settingsservice.Service, store filestore.Store) *Service {
	return &Service{
		settings: settings,
		store:    store,
		client:   &http.Client{Timeout: 300 * time.Second},
	}
}

func (s *Service) getClient() *http.Client {
	c, err := outboundhttp.Client()
	if err == nil && c != nil {
		c.Timeout = 300 * time.Second
		return c
	}
	if s.client != nil {
		return s.client
	}
	return &http.Client{Timeout: 300 * time.Second}
}

func (s *Service) getFalKey() string {
	if s.settings != nil {
		if k := strings.TrimSpace(s.settings.Get(settingsservice.KeyFalKey)); k != "" {
			return k
		}
	}
	return ""
}

func (s *Service) HasFalKey() bool {
	return s.getFalKey() != ""
}

func (s *Service) GetCurrentPoc() *PocStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if s.lastPoc == nil {
		return &PocStatus{
			Status:  "idle",
			Message: "آماده برای تست آزمایشی فاز ۱",
		}
	}
	cpy := *s.lastPoc
	return &cpy
}

// StartPocTest اجرای فرآیند آزمایشی تولید تصویر مرجع و کلیپ ۵ ثانیه‌ای در پس‌زمینه
func (s *Service) StartPocTest(modelChoice string) (*PocStatus, error) {
	s.mu.Lock()
	if s.isBusy {
		s.mu.Unlock()
		return nil, fmt.Errorf("یک تست در حال حاضر در حال اجرا است؛ لطفاً تا پایان آن صبر کنید")
	}

	falKey := s.getFalKey()
	if falKey == "" {
		s.mu.Unlock()
		return nil, fmt.Errorf("کلید FAL_KEY در تنظیمات ثبت نشده است. لطفاً کلید API را در بخش تنظیمات یا فایل .env قرار دهید")
	}

	pocID := uuid.NewString()
	s.isBusy = true
	s.lastPoc = &PocStatus{
		ID:          pocID,
		Status:      "generating_image",
		Progress:    10,
		Message:     "در حال ساخت تصویر مرجع سینمایی کاراکترهای Oliver و Emma (Flux Dev)...",
		ModelUsed:   modelChoice,
		DurationSec: 5,
		CreatedAt:   time.Now().Format(time.RFC3339),
	}
	s.mu.Unlock()

	go s.runPocBackground(pocID, modelChoice, falKey)

	return s.GetCurrentPoc(), nil
}

func (s *Service) runPocBackground(pocID, modelChoice, falKey string) {
	startTime := time.Now()
	defer func() {
		s.mu.Lock()
		s.isBusy = false
		s.mu.Unlock()
	}()

	update := func(status string, progress int, msg string, imgURL, vidURL string, errStr string) {
		s.mu.Lock()
		defer s.mu.Unlock()
		if s.lastPoc != nil && s.lastPoc.ID == pocID {
			s.lastPoc.Status = status
			s.lastPoc.Progress = progress
			s.lastPoc.Message = msg
			if imgURL != "" {
				s.lastPoc.ReferenceImageURL = imgURL
			}
			if vidURL != "" {
				s.lastPoc.VideoURL = vidURL
			}
			s.lastPoc.Error = errStr
			s.lastPoc.ElapsedSec = time.Since(startTime).Seconds()
		}
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	// ۱. تولید تصویر مرجع با کیفیت فتورئالیسم سینمایی ۹:۱۶
	imagePrompt := "Cinematic photorealistic vertical 9:16 portrait inside a cozy modern artisan coffee shop in London. " +
		"On the right, Oliver, a handsome 25-year-old young man with neat short brown hair, wearing a stylish clean black jacket. " +
		"Across the polished dark wooden counter stands Emma, a 27-year-old friendly British female barista with natural brown hair tied in a neat low ponytail, wearing a dark green canvas barista apron over a cream knit top. " +
		"Warm morning soft lighting streaming through rain-streaked London cafe windows, soft steam from an espresso machine, 35mm film photography, cinematic lighting, vertical 9:16 aspect ratio."

	update("generating_image", 20, "در حال رندر تصویر مرجع پرجزئیات کاراکترها در کافه لندن...", "", "", "")

	refImgURL, err := s.generateImageFal(ctx, falKey, imagePrompt)
	if err != nil {
		update("failed", 0, "خطا در ساخت تصویر مرجع: "+err.Error(), "", "", err.Error())
		return
	}

	totalCost := CostFluxDevUSD
	update("generating_video", 50, "تصویر مرجع ساخته شد! اکنون در حال متحرک‌سازی سکانس ۵ ثانیه‌ای با Image-to-Video...", refImgURL, "", "")

	// ۲. انتخاب مدل و محاسبه هزینه
	var videoEndpoint string
	var videoCost float64
	videoDuration := 5

	if strings.ToLower(modelChoice) == "minimax" || strings.ToLower(modelChoice) == "minimax-turbo" {
		videoEndpoint = EndpointMiniMaxH3Turbo
		videoCost = float64(videoDuration) * CostMiniMaxTurboPerSec
	} else if strings.ToLower(modelChoice) == "minimax-std" {
		videoEndpoint = EndpointMiniMaxH3Std
		videoCost = float64(videoDuration) * CostMiniMaxStdPerSec
	} else {
		// پیش‌فرض: Kling 2.5 Turbo
		videoEndpoint = EndpointKling25Turbo
		videoCost = float64(videoDuration) * CostKling25TurboPerSec
	}

	totalCost += videoCost

	videoPrompt := "Cinematic medium shot in a modern London coffee shop. " +
		"Oliver in his black jacket takes a small step forward to the wooden counter and speaks naturally. " +
		"Emma the female barista behind the counter smiles warmly and listens attentively with natural eye contact and head movement. " +
		"Subtle natural handheld camera motion, warm cozy coffeehouse lighting, photorealistic human movement, 9:16 vertical video."

	vidURL, err := s.generateVideoFal(ctx, falKey, videoEndpoint, videoPrompt, refImgURL, videoDuration)
	if err != nil {
		update("failed", 50, "خطا در تولید ویدیوی صحنه: "+err.Error(), refImgURL, "", err.Error())
		return
	}

	// ۳. دانلود ویدیو و ذخیره در محل دائمی filestore
	update("generating_video", 85, "در حال انتقال ویدیو به حافظه محلی سرور لینگوفلو...", refImgURL, vidURL, "")
	localVidURL, err := s.saveRemoteMedia(ctx, vidURL, ".mp4", "video/mp4")
	if err != nil {
		// اگر در دانلود لوکال مشکلی پیش آمد، همان URL ریموت معتبر را نگه می‌داریم
		localVidURL = vidURL
	}

	s.mu.Lock()
	if s.lastPoc != nil && s.lastPoc.ID == pocID {
		s.lastPoc.Status = "completed"
		s.lastPoc.Progress = 100
		s.lastPoc.Message = "تولید ویدیوی آزمایشی ۵ ثانیه‌ای فاز ۱ با موفقیت انجام شد!"
		s.lastPoc.VideoURL = localVidURL
		s.lastPoc.RealCostUSD = totalCost
		s.lastPoc.ElapsedSec = time.Since(startTime).Seconds()
	}
	s.mu.Unlock()
}

// generateImageFal فراخوانی Flux روی fal.ai برای تصویر مرجع
func (s *Service) generateImageFal(ctx context.Context, falKey, prompt string) (string, error) {
	reqBody := map[string]interface{}{
		"prompt":       prompt,
		"image_size":   "portrait_16_9", // 9:16 vertical
		"num_images":   1,
		"enable_safety_checker": false,
	}

	result, err := s.callFalQueue(ctx, falKey, EndpointFluxDev, reqBody)
	if err != nil {
		return "", err
	}

	// فرمت خروجی flux: {"images": [{"url": "..."}]}
	if images, ok := result["images"].([]interface{}); ok && len(images) > 0 {
		if firstImg, ok := images[0].(map[string]interface{}); ok {
			if u, ok := firstImg["url"].(string); ok && u != "" {
				return u, nil
			}
		}
	}

	return "", fmt.Errorf("آدرس تصویر در پاسخ fal.ai یافت نشد")
}

// generateVideoFal فراخوانی Image-to-Video روی fal.ai
func (s *Service) generateVideoFal(ctx context.Context, falKey, endpoint, prompt, imageURL string, duration int) (string, error) {
	reqBody := map[string]interface{}{
		"prompt":    prompt,
		"image_url": imageURL,
		"duration":  duration,
	}

	// برای مینی‌مکس رزولوشن و تطبیق ابعاد
	if strings.Contains(endpoint, "minimax") {
		reqBody["resolution"] = "768P"
	}

	result, err := s.callFalQueue(ctx, falKey, endpoint, reqBody)
	if err != nil {
		return "", err
	}

	// فرمت خروجی kling / minimax: {"video": {"url": "..."}}
	if vidObj, ok := result["video"].(map[string]interface{}); ok {
		if u, ok := vidObj["url"].(string); ok && u != "" {
			return u, nil
		}
	}

	return "", fmt.Errorf("آدرس ویدیو در پاسخ fal.ai یافت نشد")
}

// callFalQueue ارسال کار به صف fal.ai و پولینگ تا اتمام
func (s *Service) callFalQueue(ctx context.Context, falKey, endpoint string, payload map[string]interface{}) (map[string]interface{}, error) {
	submitURL := fmt.Sprintf("https://queue.fal.run/%s", endpoint)

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", submitURL, bytes.NewReader(jsonBytes))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Key "+falKey)
	req.Header.Set("Content-Type", "application/json")

	client := s.getClient()
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("خطای ارتباط با سرور fal.ai: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusAccepted {
		return nil, fmt.Errorf("خطای fal.ai (کد %d): %s", resp.StatusCode, string(bodyBytes))
	}

	var submitResp struct {
		RequestID   string `json:"request_id"`
		StatusURL   string `json:"status_url"`
		ResponseURL string `json:"response_url"`
	}
	if err := json.Unmarshal(bodyBytes, &submitResp); err != nil {
		return nil, fmt.Errorf("خطا در پردازش پاسخ ثبت صف fal.ai: %w", err)
	}

	if submitResp.RequestID == "" && submitResp.ResponseURL == "" {
		// پاسخ مستقیم همگام (Sync)
		var directResult map[string]interface{}
		if err := json.Unmarshal(bodyBytes, &directResult); err == nil {
			return directResult, nil
		}
	}

	// پولینگ دوره‌ای تا وضعیت COMPLETED
	statusURL := submitResp.StatusURL
	if statusURL == "" {
		statusURL = fmt.Sprintf("https://queue.fal.run/%s/requests/%s/status", endpoint, submitResp.RequestID)
	}
	resultURL := submitResp.ResponseURL
	if resultURL == "" {
		resultURL = fmt.Sprintf("https://queue.fal.run/%s/requests/%s", endpoint, submitResp.RequestID)
	}

	ticker := time.NewTicker(3 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return nil, ctx.Err()
		case <-ticker.C:
			pollReq, err := http.NewRequestWithContext(ctx, "GET", statusURL, nil)
			if err != nil {
				return nil, err
			}
			pollReq.Header.Set("Authorization", "Key "+falKey)

			pollResp, err := client.Do(pollReq)
			if err != nil {
				continue
			}

			pollBytes, _ := io.ReadAll(pollResp.Body)
			pollResp.Body.Close()

			var statusObj struct {
				Status string `json:"status"`
				Error  string `json:"error"`
			}
			json.Unmarshal(pollBytes, &statusObj)

			if statusObj.Status == "COMPLETED" {
				// دریافت خروجی نهایی
				resReq, err := http.NewRequestWithContext(ctx, "GET", resultURL, nil)
				if err != nil {
					return nil, err
				}
				resReq.Header.Set("Authorization", "Key "+falKey)

				resResp, err := client.Do(resReq)
				if err != nil {
					return nil, err
				}
				defer resResp.Body.Close()

				resBytes, _ := io.ReadAll(resResp.Body)
				var finalOutput map[string]interface{}
				if err := json.Unmarshal(resBytes, &finalOutput); err != nil {
					return nil, err
				}
				return finalOutput, nil
			}

			if statusObj.Status == "ERROR" {
				return nil, fmt.Errorf("خطا در پردازش هوش مصنوعی fal.ai: %s", statusObj.Error)
			}
		}
	}
}

// saveRemoteMedia دانلود مدیا و ذخیره در پوشه uploads محلی سرور
func (s *Service) saveRemoteMedia(ctx context.Context, remoteURL, ext, contentType string) (string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", remoteURL, nil)
	if err != nil {
		return "", err
	}
	client := s.getClient()
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("دانلود فایل از منبع شکست خورد (کد %d)", resp.StatusCode)
	}

	data, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	filename := fmt.Sprintf("cinematic_poc_%s%s", uuid.NewString()[:8], ext)
	return s.store.Save(ctx, filename, data, contentType)
}

