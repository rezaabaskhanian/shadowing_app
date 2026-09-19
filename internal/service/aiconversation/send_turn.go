package aiconversationservice

import (
	"context"
	"log/slog"
	"os"
	"strings"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"
	aiservice "shadowing-backend/internal/service/ai"
	"shadowing-backend/internal/service/aiconversation/dto"

	"github.com/google/uuid"
)

const defaultWrapUpText = "Thanks for practicing! Let's wrap up here."

// SendTurn یک نوبتِ صوتیِ کاربر را رونویسی، در تاریخچه ثبت و پاسخ AI را
// (متن + صدا) برمی‌گرداند. صدای کاربر هیچ‌وقت روی سرور نگه داشته نمی‌شود.
func (s *Service) SendTurn(ctx context.Context, userIDStr, conversationIDStr, localAudioPath string) (*dto.SendTurnResponse, error) {
	const op = "aiconversation.SendTurn"

	defer func() {
		if err := os.Remove(localAudioPath); err != nil && !os.IsNotExist(err) {
			slog.Warn("aiconversation: failed to remove temp recording", "err", err)
		}
	}()

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

	transcript, err := s.transcriber.TranscribeOnly(ctx, localAudioPath)
	if err != nil || strings.TrimSpace(transcript) == "" {
		return nil, richerror.New(op).WithErr(err).
			WithMessage("didn't catch that, please try again").WithKind(richerror.KindInvalid)
	}

	history, err := s.turns.ListByConversation(ctx, conv.ID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	var grammarCorrection, grammarExplanation string
	if grammar, grammarErr := s.ai.CheckGrammar(ctx, transcript); grammarErr == nil {
		grammarCorrection, grammarExplanation = grammar.Corrected, grammar.Explanation
	} else {
		slog.Warn("aiconversation: grammar check failed", "err", grammarErr)
	}

	userTurn, err := aiconversation.NewTurn(conv.ID, aiconversation.RoleUser, transcript, "", len(history))
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	userTurn.GrammarCorrection = grammarCorrection
	userTurn.GrammarExplanation = grammarExplanation
	if err := s.turns.Insert(ctx, userTurn); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	sc, err := s.scenes.GetByID(ctx, conv.SceneID.String())
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	turnNumber := conv.TurnCount + 1

	assistantText := defaultWrapUpText
	shouldEnd := true
	var usage aiservice.TokenUsage
	if s.ai.Enabled() {
		aiHistory := make([]aiservice.ConversationTurn, 0, len(history)+1)
		for _, t := range history {
			aiHistory = append(aiHistory, aiservice.ConversationTurn{Role: string(t.Role), Text: t.Text})
		}
		aiHistory = append(aiHistory, aiservice.ConversationTurn{Role: string(aiconversation.RoleUser), Text: transcript})

		if result, aiErr := s.ai.Converse(ctx, sc.Title, sc.Description, sc.Category, aiHistory, turnNumber,
			aiconversation.MaxUserTurns, aiconversation.WrapUpFromTurn); aiErr == nil {
			assistantText, shouldEnd, usage = result.Reply, result.ShouldEnd, result.Usage
		} else {
			slog.Warn("aiconversation: converse failed, using fallback reply", "err", aiErr)
		}
	}

	// سقفِ نوبت‌ها همیشه سمتِ سرور اعمال می‌شود، صرف‌نظر از اینکه مدل چه
	// چیزی برگردانده — تا هزینه/طولِ گفتگو هیچ‌وقت دستِ مدل نباشد.
	isEnded := shouldEnd || turnNumber >= aiconversation.MaxUserTurns

	audioURL := s.synthesize(ctx, assistantText)

	assistantTurn, err := aiconversation.NewTurn(conv.ID, aiconversation.RoleAssistant, assistantText, audioURL, len(history)+1)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	assistantTurn.InputTokens = usage.InputTokens
	assistantTurn.OutputTokens = usage.OutputTokens
	if err := s.turns.Insert(ctx, assistantTurn); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	status := aiconversation.StatusActive
	if isEnded {
		status = aiconversation.StatusCompleted
	}
	if err := s.conversations.UpdateProgress(ctx, conv.ID, turnNumber, status, usage.InputTokens, usage.OutputTokens); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.SendTurnResponse{
		UserTranscript:         transcript,
		AssistantText:          assistantText,
		AssistantAudioURL:      audioURL,
		UserGrammarCorrection:  grammarCorrection,
		UserGrammarExplanation: grammarExplanation,
		TurnNumber:             turnNumber,
		MaxUserTurns:           aiconversation.MaxUserTurns,
		IsEnded:                isEnded,
	}, nil
}
