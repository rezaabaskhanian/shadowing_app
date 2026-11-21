package customscene

import (
	"context"
	"fmt"
	"log/slog"
	"math/rand"
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
	if diff == "" {
		diff = "intermediate"
	}

	// ۱. پردازش و تبدیل با هوش مصنوعی
	promptForAI := fmt.Sprintf(
		"Personalized user practice content:\n%s\nTransform this into a natural, engaging conversational shadowing scene.",
		contentPrompt,
	)

	generated, err := s.aiSvc.GenerateScene(ctx, promptForAI, diff, "")
	if err != nil {
		slog.Warn("customscene: AI scene generation failed, using intelligent conversational generator", "err", err)
		generated = buildFallbackGeneratedScene(contentPrompt, diff)
	}

	// ۲. ساخت آبجکت domain.Scene
	sceneID := domain.NewSenceID()
	bgImage := defaultCustomCovers[rand.Intn(len(defaultCustomCovers))]

	title := generated.Title
	if title == "" {
		title = "Custom Shadowing Session"
	}
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

			if audioURL == "" {
				audioURL = "/uploads/305c18f4-3b42-443e-8843-f4d575ca97b2.mp3"
			}

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
			if waitDur < 3 || waitDur > 15 {
				waitDur = 5
			}

			dialogues = append(dialogues, domain.Dialogue{
				ID:           did,
				HotspotID:    hid,
				Order:        dOrder,
				Speaker:      speaker,
				OriginalText: gd.OriginalText,
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
			Name:       gh.Name,
			XPosition:  gh.XPosition,
			YPosition:  gh.YPosition,
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
		Category:           "custom",
		CreatedByUserID:    &in.UserID,
		IsCustom:           true,
		CreatedAt:          now,
		UpdatedAt:          now,
	}

	// ۴. ذخیره در دیتابیس
	if err := s.repo.CreateCustomScene(ctx, newScene); err != nil {
		slog.Error("customscene: failed to save custom scene to db", "err", err)
		return domain.Scene{}, richerror.New(op).WithErr(err).WithMessage("خطا در ذخیره صحنه اختصاصی در پایگاه داده")
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
