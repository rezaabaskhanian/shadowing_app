package customscene

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"math/rand"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	domain "shadowing-backend/internal/domain/learning/scene"
	"shadowing-backend/internal/pkg/filestore"
	"shadowing-backend/internal/pkg/richerror"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/speecheval"
	ttsservice "shadowing-backend/internal/service/tts"

	"github.com/google/uuid"
)

type Repository interface {
	CreateCustomScene(ctx context.Context, scene domain.Scene) error
	GetSceneDomain(ctx context.Context, id string) (domain.Scene, error)
	GetUserCustomScenes(ctx context.Context, userID string) ([]domain.Scene, error)
	DeleteUserCustomScene(ctx context.Context, userID, sceneID string) error
	CountUserCustomScenesToday(ctx context.Context, userID string) (int, error)
}

type AIService interface {
	GenerateScene(ctx context.Context, prompt, difficulty, grammarTopic string) (aiservice.GeneratedScene, error)
}

type Service struct {
	repo        Repository
	aiSvc       AIService
	ttsSvc      ttsservice.Service
	store       filestore.Store
	transcriber speecheval.LongTranscriber
}

func New(
	repo Repository,
	aiSvc AIService,
	ttsSvc ttsservice.Service,
	store filestore.Store,
	transcriber speecheval.LongTranscriber,
) Service {
	return Service{
		repo:        repo,
		aiSvc:       aiSvc,
		ttsSvc:      ttsSvc,
		store:       store,
		transcriber: transcriber,
	}
}

type CreateCustomSceneInput struct {
	UserID     string
	Topic      string
	Text       string
	Difficulty string
	AudioPath  string
	VoiceID    string
}

// لیست عکس‌های کاور باکیفیت و تنوع‌دار برای صحنه‌های اختصاصی
var defaultCustomCovers = []string{
	"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
	"https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
}

// GenerateCustomScene فرآیند کامل ساخت صحنه اختصاصی از متن، وویس یا موضوع را اجرا می‌کند.
func (s Service) GenerateCustomScene(ctx context.Context, in CreateCustomSceneInput) (domain.Scene, error) {
	const op = "customscene.GenerateCustomScene"

	if strings.TrimSpace(in.UserID) == "" {
		return domain.Scene{}, richerror.New(op).WithMessage("کاربر احراز هویت نشده است").WithKind(richerror.KindInvalid)
	}

	contentPrompt := strings.TrimSpace(in.Text)
	if contentPrompt == "" && in.AudioPath != "" && s.transcriber != nil {
		slog.Info("customscene: transcribing uploaded audio for custom scene", "audioPath", in.AudioPath)
		tr, err := s.transcriber.TranscribeLong(ctx, in.AudioPath)
		if err != nil {
			slog.Warn("customscene: audio transcription failed", "err", err)
			return domain.Scene{}, richerror.New(op).WithMessage("رونویسی فایل صوتی انجام نشد: " + err.Error())
		}
		contentPrompt = tr
	}

	if contentPrompt == "" && in.Topic != "" {
		contentPrompt = in.Topic
	}

	if contentPrompt == "" {
		return domain.Scene{}, richerror.New(op).WithMessage("لطفاً متن، موضوع یا فایل صوتی ارسال کنید").WithKind(richerror.KindInvalid)
	}

	diff := strings.ToLower(strings.TrimSpace(in.Difficulty))
	switch diff {
	case "starter", "beginner", "intermediate", "advanced":
		// valid
	default:
		diff = "intermediate"
	}

	// ۱. پردازش و تبدیل با هوش مصنوعی (محدود به ۱ هات‌اسپات و ۴ تا ۶ دیالوگ کوتاه)
	promptForAI := fmt.Sprintf(
		"Personalized custom shadowing scenario:\n%s\n\n"+
			"Strict constraints for this custom shadowing session:\n"+
			"- Generate exactly 1 hotspot named \"Main Conversation\".\n"+
			"- Generate exactly 4 to 6 concise dialogue lines (alternating speakers).\n"+
			"- Keep each sentence natural, spoken, and under 15 words (maximum 100 characters per line) for optimal shadowing.\n"+
			"- Provide an accurate \"image_prompt\" describing a 16:9 3D animated Pixar-style background illustration that perfectly depicts this setting.",
		contentPrompt,
	)

	generated, err := s.aiSvc.GenerateScene(ctx, promptForAI, diff, "")
	if err != nil {
		slog.Warn("customscene: AI scene generation failed, using intelligent conversational generator", "err", err)
		generated = buildFallbackGeneratedScene(contentPrompt, diff)
	}

	title := generated.Title
	if title == "" {
		title = "Custom Shadowing Session"
	}
	if len(title) > 240 {
		title = title[:237] + "..."
	}

	// ۲. تولید هوشمند تصویر پس‌زمینه متناسب با موضوع سناریو (AI Image Generation + Thematic Fallback)
	sceneID := domain.NewSenceID()
	bgImage := s.generateRelevantCoverImage(ctx, title, generated.ImagePrompt, contentPrompt)
	desc := generated.Description
	if desc == "" {
		desc = "Personalized practice based on your custom content."
	}

	hotspots := make([]domain.Hotspot, 0, len(generated.Hotspots))

	// ۳. تولید صوت با TTS برای دیالوگ‌های صحنه
	for hIdx, gh := range generated.Hotspots {
		hid := domain.NewHotspotID()
		hOrder := gh.Order
		if hOrder <= 0 {
			hOrder = hIdx + 1
		}

		hName := strings.TrimSpace(gh.Name)
		if hName == "" {
			hName = "Main Conversation"
		}
		if len(hName) > 95 {
			hName = hName[:92] + "..."
		}

		xPos := gh.XPosition
		if xPos < 0 || xPos > 100 {
			xPos = 50.0
		}
		yPos := gh.YPosition
		if yPos < 0 || yPos > 100 {
			yPos = 50.0
		}

		dialogues := make([]domain.Dialogue, 0, len(gh.Dialogues))
		for dIdx, gd := range gh.Dialogues {
			did := domain.NewDialogueID()
			dOrder := gd.Order
			if dOrder <= 0 {
				dOrder = dIdx + 1
			}

			speaker := domain.SpeakerCustomer
			if strings.ToLower(gd.Speaker) == "clerk" || strings.ToLower(gd.Speaker) == "doctor" || strings.ToLower(gd.Speaker) == "receptionist" {
				speaker = domain.SpeakerClerk
			}

			// تبدیل متن به صوت نیتیو
			audioURL := ""
			if s.ttsSvc.Enabled() && strings.TrimSpace(gd.OriginalText) != "" {
				audioRes, ttsErr := s.ttsSvc.GenerateSpeech(ctx, gd.OriginalText, in.VoiceID, 1.0)
				if ttsErr == nil && len(audioRes.Data) > 0 {
					fname := fmt.Sprintf("custom_dialogue_%s%s", uuid.NewString()[:8], audioRes.Ext)
					if u, saveErr := s.store.Save(ctx, fname, audioRes.Data, audioRes.ContentType); saveErr == nil {
						audioURL = u
					}
				} else {
					slog.Warn("customscene: tts generation failed for line", "err", ttsErr, "line", gd.OriginalText)
				}
			}

			// اگر صوت تولید نشد، خالی می‌ماند تا اپ کلاینت از تلفظ نیتیو داخلی گوشی (On-Device TTS) استفاده کند
			// هرگز از آدرس ماک/جعلی استفاده نمی‌شود تا خطای ۴۰۴ رخ ندهد.

			words := make([]domain.DialogueWord, 0, len(gd.Words))
			for _, w := range gd.Words {
				if w.Word != "" {
					words = append(words, domain.DialogueWord{
						Word:    strings.ToLower(w.Word),
						Meaning: w.Meaning,
					})
				}
			}

			waitDur := gd.WaitDuration
			if waitDur < 1 || waitDur > 30 {
				waitDur = 5
			}

			origText := strings.TrimSpace(gd.OriginalText)
			if origText == "" {
				origText = "Hello!"
			}

			dialogues = append(dialogues, domain.Dialogue{
				ID:           did,
				HotspotID:    hid,
				Order:        dOrder,
				Speaker:      speaker,
				OriginalText: origText,
				Translation:  gd.Translation,
				AudioURL:     audioURL,
				DisplayType:  domain.DisplayFull,
				WaitDuration: waitDur,
				Words:        words,
				CreatedAt:    time.Now(),
			})
		}

		hotspots = append(hotspots, domain.Hotspot{
			ID:         hid,
			SceneID:    sceneID,
			Name:       hName,
			XPosition:  xPos,
			YPosition:  yPos,
			OrderIndex: hOrder,
			Dialogues:  dialogues,
			CreatedAt:  time.Now(),
			UpdatedAt:  time.Now(),
		})
	}

	now := time.Now()
	newScene := domain.Scene{
		ID:                 sceneID,
		Title:              title,
		Description:        desc,
		BackgroundImageURL: bgImage,
		Difficulty:         domain.DifficultyLevel(diff),
		Status:             domain.StatusPublished,
		Hotspots:           hotspots,
		Order:              9999,
		IsLocked:           false,
		Category:           string(domain.CategoryDaily),
		CreatedByUserID:    &in.UserID,
		IsCustom:           true,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	// ۴. ذخیره در دیتابیس
	if err := s.repo.CreateCustomScene(ctx, newScene); err != nil {
		slog.Error("customscene: failed to save custom scene to db", "err", err, "sceneID", sceneID)
		return domain.Scene{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره صحنه اختصاصی در پایگاه داده: " + err.Error())
	}

	slog.Info("customscene: successfully created custom scene", "sceneID", sceneID, "userID", in.UserID, "dialogues", len(hotspots))
	return newScene, nil
}

// ListUserCustomScenes صحنه‌های اختصاصی این کاربر را بازمی‌گرداند.
func (s Service) ListUserCustomScenes(ctx context.Context, userID string) ([]domain.Scene, error) {
	const op = "customscene.ListUserCustomScenes"
	if strings.TrimSpace(userID) == "" {
		return []domain.Scene{}, richerror.New(op).WithMessage("شناسه کاربر نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return s.repo.GetUserCustomScenes(ctx, userID)
}

// DeleteUserCustomScene صحنه اختصاصی را حذف می‌کند.
func (s Service) DeleteUserCustomScene(ctx context.Context, userID, sceneID string) error {
	const op = "customscene.DeleteUserCustomScene"
	if strings.TrimSpace(userID) == "" || strings.TrimSpace(sceneID) == "" {
		return richerror.New(op).WithMessage("شناسه کاربر یا صحنه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return s.repo.DeleteUserCustomScene(ctx, userID, sceneID)
}

// CleanTempFile فایل موقت آپلودشده را پاک می‌کند
func CleanTempFile(path string) {
	if path != "" {
		_ = os.Remove(path)
	}
}

// ExtractTextFromSimpleFile برای فایل‌های متنی txt و md
func ExtractTextFromSimpleFile(path string) (string, error) {
	ext := strings.ToLower(filepath.Ext(path))
	if ext == ".txt" || ext == ".md" || ext == ".csv" || ext == ".json" {
		data, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		return string(data), nil
	}
	return "", fmt.Errorf("فرمت فایل متنی پشتیبانی نمی‌شود (%s)", ext)
}

func buildFallbackGeneratedScene(contentPrompt, diff string) aiservice.GeneratedScene {
	title := "Custom Practice: " + contentPrompt
	if len(title) > 40 {
		title = title[:37] + "..."
	}

	dialogues := []aiservice.GeneratedDialogue{
		{
			Order:        1,
			Speaker:      "Clerk",
			OriginalText: fmt.Sprintf("Hello! Welcome. How can I help you regarding %s today?", contentPrompt),
			Translation:  fmt.Sprintf("سلام! خوش آمدید. امروز چطور می‌توانم در خصوص %s به شما کمک کنم؟", contentPrompt),
			WaitDuration: 5,
			Words: []aiservice.GeneratedWord{
				{Word: "welcome", Meaning: "خوش آمدید"},
				{Word: "help", Meaning: "کمک کردن"},
				{Word: "regarding", Meaning: "در رابطه با"},
			},
		},
		{
			Order:        2,
			Speaker:      "Customer",
			OriginalText: fmt.Sprintf("Hi! I would like to practice and talk about %s.", contentPrompt),
			Translation:  fmt.Sprintf("سلام! مایل هستم درباره %s تمرین و صحبت کنم.", contentPrompt),
			WaitDuration: 6,
			Words: []aiservice.GeneratedWord{
				{Word: "practice", Meaning: "تمرین کردن"},
				{Word: "would like", Meaning: "تمایل داشتن"},
			},
		},
		{
			Order:        3,
			Speaker:      "Clerk",
			OriginalText: "That sounds like a wonderful plan. Let's practice key phrases step by step.",
			Translation:  "برنامه بسیار عالی به نظر می‌رسد. بیایید عبارات کلیدی را قدم‌به‌قدم تمرین کنیم.",
			WaitDuration: 5,
			Words: []aiservice.GeneratedWord{
				{Word: "wonderful", Meaning: "فوق‌العاده"},
				{Word: "phrases", Meaning: "عبارات"},
				{Word: "step by step", Meaning: "قدم به قدم"},
			},
		},
		{
			Order:        4,
			Speaker:      "Customer",
			OriginalText: "Thank you so much. Repeating these sentences with correct rhythm helps my fluency.",
			Translation:  "خیلی متشکرم. تکرار این جملات با ریتم صحیح به روان صحبت کردنم کمک می‌کند.",
			WaitDuration: 6,
			Words: []aiservice.GeneratedWord{
				{Word: "repeating", Meaning: "تکرار کردن"},
				{Word: "rhythm", Meaning: "ریتم"},
				{Word: "fluency", Meaning: "روانی کلام"},
			},
		},
	}

	return aiservice.GeneratedScene{
		Title:       title,
		Description: fmt.Sprintf("Personalized shadowing scenario tailored to %s.", contentPrompt),
		Difficulty:  diff,
		Hotspots: []aiservice.GeneratedHotspot{
			{
				Name:      "Main Conversation",
				Order:     1,
				XPosition: 50.0,
				YPosition: 50.0,
				Dialogues: dialogues,
			},
		},
	}
}

// generateRelevantCoverImage تصویر مرتبط با پرامپت سناریو را از Pollinations AI دانلود و در استور ذخیره می‌کند
// در صورت عدم دسترسی شبکه، از دسته‌بندی موضوعی هوشمند استفاده می‌کند.
func (s Service) generateRelevantCoverImage(ctx context.Context, title, imagePrompt, contentPrompt string) string {
	promptToUse := strings.TrimSpace(imagePrompt)
	if promptToUse == "" {
		promptToUse = fmt.Sprintf("A 3D animated Pixar style scene for English shadowing: %s, vibrant colors, warm lighting, 16:9 aspect ratio", title)
	} else {
		promptToUse = fmt.Sprintf("%s, 3D animated Pixar Disney style, vibrant warm colors, cinematic lighting, 16:9 aspect ratio", promptToUse)
	}

	pollinationsURL := fmt.Sprintf(
		"https://image.pollinations.ai/prompt/%s?width=1280&height=720&nologo=true&seed=%d",
		url.QueryEscape(promptToUse),
		rand.Intn(100000),
	)

	client := &http.Client{Timeout: 7 * time.Second}
	req, reqErr := http.NewRequestWithContext(ctx, http.MethodGet, pollinationsURL, nil)
	if reqErr == nil {
		resp, getErr := client.Do(req)
		if getErr == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			imgData, readErr := io.ReadAll(resp.Body)
			if readErr == nil && len(imgData) > 5000 {
				fname := fmt.Sprintf("custom_scene_%s.jpg", uuid.NewString()[:8])
				if savedURL, saveErr := s.store.Save(ctx, fname, imgData, "image/jpeg"); saveErr == nil {
					slog.Info("customscene: successfully generated AI scene cover", "url", savedURL)
					return savedURL
				}
			}
		} else if getErr != nil {
			slog.Warn("customscene: pollinations image generation failed, using thematic fallback", "err", getErr)
		}
	}

	return getThematicCoverFallback(contentPrompt + " " + title)
}

func getThematicCoverFallback(text string) string {
	low := strings.ToLower(text)
	switch {
	case strings.Contains(low, "doctor") || strings.Contains(low, "hospital") || strings.Contains(low, "clinic") || strings.Contains(low, "dentist") || strings.Contains(low, "nurse") || strings.Contains(low, "پزشک") || strings.Contains(low, "بیمار"):
		return "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "cafe") || strings.Contains(low, "coffee") || strings.Contains(low, "restaurant") || strings.Contains(low, "dinner") || strings.Contains(low, "food") || strings.Contains(low, "کافه") || strings.Contains(low, "رستوران"):
		return "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "airport") || strings.Contains(low, "flight") || strings.Contains(low, "plane") || strings.Contains(low, "travel") || strings.Contains(low, "فرودگاه") || strings.Contains(low, "سفر"):
		return "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "hotel") || strings.Contains(low, "reception") || strings.Contains(low, "room") || strings.Contains(low, "هتل"):
		return "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "interview") || strings.Contains(low, "job") || strings.Contains(low, "office") || strings.Contains(low, "business") || strings.Contains(low, "کار") || strings.Contains(low, "مصاحبه"):
		return "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "car") || strings.Contains(low, "taxi") || strings.Contains(low, "drive") || strings.Contains(low, "mechanic") || strings.Contains(low, "خودرو") || strings.Contains(low, "ماشین"):
		return "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "shop") || strings.Contains(low, "store") || strings.Contains(low, "supermarket") || strings.Contains(low, "mall") || strings.Contains(low, "خرید") || strings.Contains(low, "فروشگاه"):
		return "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "university") || strings.Contains(low, "school") || strings.Contains(low, "class") || strings.Contains(low, "library") || strings.Contains(low, "دانشگاه") || strings.Contains(low, "کلاس"):
		return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1280&q=80"
	case strings.Contains(low, "gym") || strings.Contains(low, "fitness") || strings.Contains(low, "sport") || strings.Contains(low, "ورزش") || strings.Contains(low, "باشگاه"):
		return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1280&q=80"
	default:
		return "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1280&q=80"
	}
}
