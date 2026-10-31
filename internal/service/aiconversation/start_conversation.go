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

// StartConversation یک گفتگوی تازه روی یک صحنه یا یک سناریوی نقش‌آفرینی
// (دقیقاً یکی از sceneIDStr/roleplayIDStr) می‌سازد و اولین نوبت (از طرف AI) را
// برمی‌گرداند. اگر AI یا TTS در دسترس نباشند، هیچ‌کدام درخواست را نمی‌شکنند —
// یک جمله‌ی افتتاحیه‌ی ثابت و/یا بدون صدا برمی‌گردد.
func (s *Service) StartConversation(ctx context.Context, userIDStr, sceneIDStr, roleplayIDStr string) (*dto.StartConversationResponse, error) {
	const op = "aiconversation.StartConversation"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}

	var sceneUUID, roleplayUUID uuid.UUID
	var tp topic
	if roleplayIDStr != "" {
		if roleplayUUID, err = uuid.Parse(roleplayIDStr); err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("invalid roleplay ID").WithKind(richerror.KindInvalid)
		}
		rp, err := s.roleplays.Get(ctx, roleplayIDStr)
		if err != nil {
			return nil, err
		}
		if !rp.IsActive {
			return nil, richerror.New(op).WithMessage("roleplay not found").WithKind(richerror.KindNotFound)
		}
		tp = roleplayTopic(rp)
	} else {
		if sceneUUID, err = uuid.Parse(sceneIDStr); err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID").WithKind(richerror.KindInvalid)
		}
		sc, err := s.scenes.GetByID(ctx, sceneIDStr)
		if err != nil {
			return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
		}
		tp = topic{Title: sc.Title, Description: sc.Description, Category: sc.Category}
	}

	if err := s.access.CheckAllowed(ctx, op, userIDStr); err != nil {
		return nil, err
	}

	openingText, openingTextFA := defaultOpeningText, defaultOpeningTextFA
	var usage aiservice.TokenUsage
	if s.ai.Enabled() {
		if result, aiErr := s.ai.Converse(ctx, tp.Title, tp.Description, tp.Category, nil, 0,
			aiconversation.MaxUserTurns, aiconversation.WrapUpFromTurn); aiErr == nil && strings.TrimSpace(result.Reply) != "" {
			openingText, openingTextFA, usage = result.Reply, strings.TrimSpace(result.ReplyFA), result.Usage
		} else {
			slog.Warn("aiconversation: opening converse call failed, using fallback", "err", aiErr)
		}
	}

	s.access.RecordUsage(ctx, userIDStr, usage.InputTokens, usage.OutputTokens)

	audioURL := s.synthesize(ctx, openingText)

	conv, err := aiconversation.NewConversation(userID, sceneUUID, roleplayUUID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	conv.TotalInputTokens = usage.InputTokens
	conv.TotalOutputTokens = usage.OutputTokens
	if err := s.conversations.Create(ctx, conv); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	openingTurn, err := aiconversation.NewTurn(conv.ID, aiconversation.RoleAssistant, openingText, audioURL, 0)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	openingTurn.InputTokens = usage.InputTokens
	openingTurn.OutputTokens = usage.OutputTokens
	if err := s.turns.Insert(ctx, openingTurn); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.StartConversationResponse{
		ConversationID: conv.ID.String(),
		SceneTitle:     tp.Title,
		OpeningTurn: dto.TurnDTO{
			Role:     string(aiconversation.RoleAssistant),
			Text:     openingText,
			TextFA:   openingTextFA,
			AudioURL: audioURL,
		},
		MaxUserTurns: aiconversation.MaxUserTurns,
		MaxHints:     aiconversation.MaxHints,
	}, nil
}
