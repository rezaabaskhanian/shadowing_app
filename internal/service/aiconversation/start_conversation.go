package aiconversationservice

import (
	"context"
	"log/slog"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"
	"shadowing-backend/internal/service/aiconversation/dto"

	"github.com/google/uuid"
)

const defaultOpeningText = "Hi! Let's practice a conversation. Ready when you are!"

// StartConversation یک گفتگوی تازه می‌سازد و اولین نوبت (از طرف AI) را
// برمی‌گرداند. اگر AI یا TTS در دسترس نباشند، هیچ‌کدام درخواست را نمی‌شکنند —
// یک جمله‌ی افتتاحیه‌ی ثابت و/یا بدون صدا برمی‌گردد.
func (s *Service) StartConversation(ctx context.Context, userIDStr, sceneIDStr string) (*dto.StartConversationResponse, error) {
	const op = "aiconversation.StartConversation"

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid user ID").WithKind(richerror.KindInvalid)
	}
	sceneUUID, err := uuid.Parse(sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("invalid scene ID").WithKind(richerror.KindInvalid)
	}

	sc, err := s.scenes.GetByID(ctx, sceneIDStr)
	if err != nil {
		return nil, richerror.New(op).WithErr(err).WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}

	openingText := defaultOpeningText
	if s.ai.Enabled() {
		if result, aiErr := s.ai.Converse(ctx, sc.Title, sc.Description, sc.Category, nil, 0,
			aiconversation.MaxUserTurns, aiconversation.WrapUpFromTurn); aiErr == nil {
			openingText = result.Reply
		} else {
			slog.Warn("aiconversation: opening converse call failed, using fallback", "err", aiErr)
		}
	}

	audioURL := s.synthesize(ctx, openingText)

	conv, err := aiconversation.NewConversation(userID, sceneUUID)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := s.conversations.Create(ctx, conv); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	openingTurn, err := aiconversation.NewTurn(conv.ID, aiconversation.RoleAssistant, openingText, audioURL, 0)
	if err != nil {
		return nil, richerror.New(op).WithErr(err)
	}
	if err := s.turns.Insert(ctx, openingTurn); err != nil {
		return nil, richerror.New(op).WithErr(err)
	}

	return &dto.StartConversationResponse{
		ConversationID: conv.ID.String(),
		SceneTitle:     sc.Title,
		OpeningTurn: dto.TurnDTO{
			Role:     string(aiconversation.RoleAssistant),
			Text:     openingText,
			AudioURL: audioURL,
		},
		MaxUserTurns: aiconversation.MaxUserTurns,
	}, nil
}
