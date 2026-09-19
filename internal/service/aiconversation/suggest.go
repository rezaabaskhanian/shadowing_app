package aiconversationservice

import (
	"context"
	"log/slog"
	"strings"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/aiconversation/dto"

	"github.com/google/uuid"
)

// maxSuggestionsPerHint - هر Hint دو گزینه دارد (پرامپت هم همین را می‌خواهد)؛
// اگر مدل بیشتر برگرداند، سرور بریده‌اش می‌کند.
const maxSuggestionsPerHint = 2

// Suggest برای آخرین پیامِ AI در گفتگو، دو جوابِ پیشنهادی (انگلیسی + ترجمه‌ی
// فارسی) برمی‌گرداند. برای هر نوبتِ AI فقط یک بار LLM صدا زده می‌شود و از سقفِ
// MaxHints هم فقط یک بار کم می‌کند — زدنِ دوباره‌ی دکمه روی همان نوبت همان
// نتیجه‌ی ذخیره‌شده را برمی‌گرداند. صدا اینجا ساخته نمی‌شود (SuggestAudio).
func (s *Service) Suggest(ctx context.Context, userIDStr, conversationIDStr string) (*dto.SuggestResponse, error) {
	const op = "aiconversation.Suggest"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	conversationID, err := uuid.Parse(conversationIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid conversation ID").WithKind(richerror.KindInvalid)
	}

	conv, err := s.conversations.GetByID(ctx, conversationID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if conv.UserID != userID {
		return nil, richerror.New(op).WithMessage("not your conversation").WithKind(richerror.KindForbidden)
	}
	if conv.Status == aiconversation.StatusCompleted {
		return nil, richerror.New(op).WithMessage("conversation already ended").WithKind(richerror.KindInvalid)
	}

	history, err := s.turns.ListByConversation(ctx, conv.ID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if len(history) == 0 || history[len(history)-1].Role != aiconversation.RoleAssistant {
		return nil, richerror.New(op).WithMessage("no assistant message to reply to").WithKind(richerror.KindInvalid)
	}
	lastTurn := history[len(history)-1]

	if existing, err := s.hints.GetByTurn(ctx, conv.ID, lastTurn.OrderIndex); err != nil {
		return nil, richerror.New(op).WithErr(err)
	} else if existing != nil {
		return s.suggestResponse(ctx, conv.ID, existing)
	}

	used, err := s.hints.CountByConversation(ctx, conv.ID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if used >= aiconversation.MaxHints {
		return nil, richerror.New(op).WithMessage("hint limit reached").WithKind(richerror.KindForbidden)
	}

	if !s.ai.Enabled() {
		return nil, richerror.New(op).WithMessage("ai is not configured")
	}

	sc, err := s.scenes.GetByID(ctx, conv.SceneID.String())
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	// نبودنِ پروفایل (کاربر هنوز تست سطح نداده) خطا نیست؛ سطحِ خالی یعنی مبتدی.
	var level string
	if profile, profileErr := s.profiles.GetByUser(ctx, userID); profileErr == nil {
		level = string(profile.Level)
	}

	aiHistory := make([]aiservice.ConversationTurn, 0, len(history))
	for _, t := range history {
		aiHistory = append(aiHistory, aiservice.ConversationTurn{Role: string(t.Role), Text: t.Text})
	}

	result, err := s.ai.SuggestReplies(ctx, sc.Title, sc.Description, sc.Category, level, aiHistory)
	if err != nil {
		slog.Warn("aiconversation: suggest replies failed", "err", err)
		return nil, richerror.New(op).WithErr(err).WithMessage("could not generate suggestions")
	}

	suggestions := make([]aiconversation.Suggestion, 0, maxSuggestionsPerHint)
	for _, r := range result.Suggestions {
		text := strings.TrimSpace(r.Text)
		if text == "" {
			continue
		}
		suggestions = append(suggestions, aiconversation.Suggestion{Text: text, TranslationFA: strings.TrimSpace(r.TranslationFA)})
		if len(suggestions) == maxSuggestionsPerHint {
			break
		}
	}
	if len(suggestions) == 0 {
		return nil, richerror.New(op).WithMessage("model returned no usable suggestions")
	}

	hint, err := aiconversation.NewHint(conv.ID, lastTurn.OrderIndex, suggestions)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	hint.InputTokens = result.Usage.InputTokens
	hint.OutputTokens = result.Usage.OutputTokens
	if err := s.hints.Insert(ctx, hint); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	// Insert روی تعارض بی‌صدا رد می‌شود (دو درخواستِ همزمان)؛ ردیفِ برنده را
	// دوباره می‌خوانیم تا هر دو درخواست یک HintID برگردانند.
	stored, err := s.hints.GetByTurn(ctx, conv.ID, lastTurn.OrderIndex)
	if err != nil || stored == nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("failed to load stored hint")
	}
	return s.suggestResponse(ctx, conv.ID, stored)
}

func (s *Service) suggestResponse(ctx context.Context, conversationID uuid.UUID, hint *aiconversation.Hint) (*dto.SuggestResponse, error) {
	const op = "aiconversation.suggestResponse"

	used, err := s.hints.CountByConversation(ctx, conversationID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	items := make([]dto.SuggestionDTO, 0, len(hint.Suggestions))
	for _, sg := range hint.Suggestions {
		items = append(items, dto.SuggestionDTO{Text: sg.Text, TranslationFA: sg.TranslationFA, AudioURL: sg.AudioURL})
	}
	return &dto.SuggestResponse{
		HintID:      hint.ID.String(),
		Suggestions: items,
		HintsUsed:   used,
		MaxHints:    aiconversation.MaxHints,
	}, nil
}

// SuggestAudio صدای یکی از جمله‌های پیشنهادی را برمی‌گرداند. صدا فقط وقتی
// ساخته می‌شود که کاربر دکمه‌ی پخش را بزند (هزینه‌ی ElevenLabs)، و برای پخش‌های
// بعدیِ همان جمله از آدرسِ ذخیره‌شده استفاده می‌شود. مثل synthesize، اگر TTS
// تنظیم نباشد یا شکست بخورد، آدرسِ خالی برمی‌گردد نه خطا.
func (s *Service) SuggestAudio(ctx context.Context, userIDStr, hintIDStr string, index int) (*dto.SuggestAudioResponse, error) {
	const op = "aiconversation.SuggestAudio"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	hintID, err := uuid.Parse(hintIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid hint ID").WithKind(richerror.KindInvalid)
	}

	hint, err := s.hints.GetByID(ctx, hintID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	conv, err := s.conversations.GetByID(ctx, hint.ConversationID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if conv.UserID != userID {
		return nil, richerror.New(op).WithMessage("not your conversation").WithKind(richerror.KindForbidden)
	}
	if index < 0 || index >= len(hint.Suggestions) {
		return nil, richerror.New(op).WithMessage("suggestion index out of range").WithKind(richerror.KindInvalid)
	}

	if url := hint.Suggestions[index].AudioURL; url != "" {
		return &dto.SuggestAudioResponse{AudioURL: url}, nil
	}

	url := s.synthesize(ctx, hint.Suggestions[index].Text)
	if url != "" {
		if err := s.hints.SetSuggestionAudio(ctx, hint.ID, index, url); err != nil {
			slog.Warn("aiconversation: failed to cache suggestion audio", "err", err)
		}
	}
	return &dto.SuggestAudioResponse{AudioURL: url}, nil
}
