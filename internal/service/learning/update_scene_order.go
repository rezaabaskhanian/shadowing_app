package learningservice

import (
	"context"
	"encoding/json"
	"strings"

	"shadowing-backend/internal/pkg/richerror"
)

// UpdateSceneOrder فقط ترتیب یک صحنه در مسیر آموزشی را تغییر می‌دهد.
func (s Service) UpdateSceneOrder(ctx context.Context, id string, order int) error {
	const op = "learningservice.UpdateSceneOrder"

	if err := s.repo.UpdateOrder(ctx, id, order); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}

// UpdateSceneDifficulty فقط سطح یک صحنه را تغییر می‌دهد؛ برخلاف ویرایش کامل،
// شناسه‌ی دیالوگ‌ها و پیشرفت کاربرها حفظ می‌شود.
func (s Service) UpdateSceneDifficulty(ctx context.Context, id, difficulty string) error {
	const op = "learningservice.UpdateSceneDifficulty"

	level, err := toDifficulty(op, difficulty)
	if err != nil {
		return err
	}
	if err := s.repo.UpdateDifficulty(ctx, id, string(level)); err != nil {
		return richerror.New(op).WithErr(err)
	}

	return nil
}

// TranslationFix اصلاح یک دیالوگ: ترجمه و/یا چیپ‌ها (آرایه‌ی کامل جایگزین).
type TranslationFix struct {
	DialogueID  string          `json:"dialogue_id"`
	Translation string          `json:"translation,omitempty"`
	Words       json.RawMessage `json:"words,omitempty"`
	Phrases     json.RawMessage `json:"phrases,omitempty"`
}

// FixSceneText ترجمه و چیپ‌های چند دیالوگ و/یا نکته‌ی گرامری (موضوع، توضیح،
// مثال‌ها) یک صحنه را درجا اصلاح می‌کند. متن انگلیسی، صدا و شناسه‌ها دست
// نمی‌خورند، پس برای صحنه‌های منتشرشده امن است و پیشرفت کاربرها حفظ می‌شود.
func (s Service) FixSceneText(ctx context.Context, sceneID string, fixes []TranslationFix, topic, explanation *string, examples json.RawMessage) (int, error) {
	const op = "learningservice.FixSceneText"

	if len(fixes) == 0 && topic == nil && explanation == nil && len(examples) == 0 {
		return 0, richerror.New(op).WithMessage("هیچ اصلاحی فرستاده نشده").WithKind(richerror.KindInvalid)
	}
	for _, f := range fixes {
		if strings.TrimSpace(f.DialogueID) == "" || (strings.TrimSpace(f.Translation) == "" && len(f.Words) == 0 && len(f.Phrases) == 0) {
			return 0, richerror.New(op).WithMessage("dialogue_id و دست‌کم یکی از translation/words/phrases لازم است").WithKind(richerror.KindInvalid)
		}
		for _, raw := range []json.RawMessage{f.Words, f.Phrases} {
			if len(raw) > 0 && !isJSONArray(raw) {
				return 0, richerror.New(op).WithMessage("words و phrases باید آرایه باشند").WithKind(richerror.KindInvalid)
			}
		}
	}
	if len(examples) > 0 && !isJSONArray(examples) {
		return 0, richerror.New(op).WithMessage("grammar_examples باید آرایه باشد").WithKind(richerror.KindInvalid)
	}
	n := 0
	for _, f := range fixes {
		var tr *string
		if t := strings.TrimSpace(f.Translation); t != "" {
			tr = &t
		}
		if err := s.repo.FixDialogueTranslation(ctx, sceneID, f.DialogueID, tr, f.Words, f.Phrases); err != nil {
			return n, richerror.New(op).WithErr(err)
		}
		n++
	}
	if topic != nil || explanation != nil || len(examples) > 0 {
		if err := s.repo.FixGrammarNote(ctx, sceneID, topic, explanation, examples); err != nil {
			return n, richerror.New(op).WithErr(err)
		}
	}
	return n, nil
}

func isJSONArray(raw json.RawMessage) bool {
	var v []any
	return json.Unmarshal(raw, &v) == nil
}
