package aiconversationservice

import (
	"context"
	"strings"

	"shadowing-backend/internal/domain/aiconversation"
	"shadowing-backend/internal/pkg/richerror"

	"github.com/google/uuid"
)

// topic عنوان/توضیح/دسته‌ای است که به پرامپتِ Converse و SuggestReplies داده می‌شود.
type topic struct {
	Title, Description, Category string
}

// conversationTopic موضوعِ گفتگو را از صحنه یا سناریوی نقش‌آفرینیِ آن می‌سازد.
func (s *Service) conversationTopic(ctx context.Context, conv *aiconversation.Conversation) (topic, error) {
	if conv.RoleplayID != uuid.Nil {
		rp, err := s.roleplays.Get(ctx, conv.RoleplayID.String())
		if err != nil {
			return topic{}, err
		}
		return roleplayTopic(rp), nil
	}
	sc, err := s.scenes.GetByID(ctx, conv.SceneID.String())
	if err != nil {
		return topic{}, richerror.New("aiconversation.conversationTopic").WithErr(err).
			WithMessage("scene not found").WithKind(richerror.KindNotFound)
	}
	return topic{Title: sc.Title, Description: sc.Description, Category: sc.Category}, nil
}

// levelHints سطحِ زبانِ AI در نقش‌آفرینی، هم‌خوان با سطحِ سناریو.
var levelHints = map[string]string{
	"starter":      "very simple English (A1): short sentences, the most common words, speak slowly",
	"beginner":     "simple everyday English (A2): short sentences, common words",
	"intermediate": "natural everyday English (B1)",
	"advanced":     "natural spoken English with common idioms (B2)",
	"proficient":   "fully natural, fast spoken English (C1)",
}

// roleplayTopic نقشِ AI، سطح و جمله‌های کلیدیِ سناریو را در «توضیح صحنه» می‌گذارد؛
// پرامپتِ Converse همان است و فقط از این توضیح نقش را برمی‌دارد.
func roleplayTopic(rp aiconversation.Roleplay) topic {
	var b strings.Builder
	b.WriteString(strings.TrimSpace(rp.AIRole))
	b.WriteString("\nThis is a real-life roleplay. Play the role above; the learner plays the other person. ")
	b.WriteString("Create small realistic problems or questions so the learner has to explain, ask and negotiate.")
	if hint := levelHints[rp.Level]; hint != "" {
		b.WriteString("\nLanguage level: " + hint + ".")
	}
	if len(rp.KeyPhrases) > 0 {
		phrases := make([]string, 0, len(rp.KeyPhrases))
		for _, p := range rp.KeyPhrases {
			phrases = append(phrases, `"`+p.EN+`"`)
		}
		b.WriteString("\nAsk questions that give the learner natural chances to use these phrases (never list them or quote them yourself): ")
		b.WriteString(strings.Join(phrases, ", "))
		b.WriteString(".")
	}
	return topic{Title: rp.Title, Description: b.String(), Category: rp.Category}
}

// ---------- اپ ----------

// ListRoleplays سناریوهای منتشرشده، بدون نقشِ AI (فقط پرامپت لازمش دارد).
func (s *Service) ListRoleplays(ctx context.Context) ([]aiconversation.Roleplay, error) {
	list, err := s.roleplays.List(ctx, true)
	if err != nil {
		return nil, err
	}
	for i := range list {
		list[i].AIRole = ""
	}
	return list, nil
}

// ---------- ادمین ----------

func (s *Service) AdminListRoleplays(ctx context.Context) ([]aiconversation.Roleplay, error) {
	return s.roleplays.List(ctx, false)
}

func (s *Service) AdminGetRoleplay(ctx context.Context, id string) (aiconversation.Roleplay, error) {
	const op = "aiconversation.AdminGetRoleplay"
	if _, err := uuid.Parse(id); err != nil {
		return aiconversation.Roleplay{}, richerror.New(op).WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return s.roleplays.Get(ctx, id)
}

var validRoleplayLevels = map[string]bool{"starter": true, "beginner": true, "intermediate": true, "advanced": true, "proficient": true}

// AdminSaveRoleplay سناریو را تمیز و ذخیره می‌کند. انتشار فقط با نقشِ AI ممکن است.
func (s *Service) AdminSaveRoleplay(ctx context.Context, id string, rp aiconversation.Roleplay) (aiconversation.Roleplay, error) {
	const op = "aiconversation.AdminSaveRoleplay"
	invalid := func(msg string) (aiconversation.Roleplay, error) {
		return aiconversation.Roleplay{}, richerror.New(op).WithMessage(msg).WithKind(richerror.KindInvalid)
	}
	if id != "" {
		if _, err := uuid.Parse(id); err != nil {
			return invalid("شناسه نامعتبر است")
		}
	}
	rp.ID = id
	rp.Title = strings.TrimSpace(rp.Title)
	rp.TitleFA = strings.TrimSpace(rp.TitleFA)
	rp.SituationFA = strings.TrimSpace(rp.SituationFA)
	rp.AIRole = strings.TrimSpace(rp.AIRole)
	rp.UserRoleFA = strings.TrimSpace(rp.UserRoleFA)
	rp.Category = strings.TrimSpace(rp.Category)
	rp.PodcastID = strings.TrimSpace(rp.PodcastID)
	if rp.Title == "" {
		return invalid("عنوان الزامی است")
	}
	if rp.Category == "" {
		rp.Category = "daily"
	}
	if !validRoleplayLevels[rp.Level] {
		rp.Level = "beginner"
	}
	if rp.PodcastID != "" {
		if _, err := uuid.Parse(rp.PodcastID); err != nil {
			return invalid("شناسه‌ی پادکست نامعتبر است")
		}
	}
	if rp.IsActive && rp.AIRole == "" {
		return invalid("برای انتشار، نقشِ AI لازم است")
	}

	goals := make([]string, 0, len(rp.GoalsFA))
	for _, g := range rp.GoalsFA {
		if g = strings.TrimSpace(g); g != "" {
			goals = append(goals, g)
		}
	}
	rp.GoalsFA = goals
	phrases := make([]aiconversation.KeyPhrase, 0, len(rp.KeyPhrases))
	for _, p := range rp.KeyPhrases {
		p.EN, p.FA = strings.TrimSpace(p.EN), strings.TrimSpace(p.FA)
		if p.EN != "" {
			phrases = append(phrases, p)
		}
	}
	rp.KeyPhrases = phrases

	savedID, err := s.roleplays.Save(ctx, rp)
	if err != nil {
		return aiconversation.Roleplay{}, err
	}
	return s.roleplays.Get(ctx, savedID)
}

func (s *Service) AdminDeleteRoleplay(ctx context.Context, id string) error {
	if _, err := uuid.Parse(id); err != nil {
		return richerror.New("aiconversation.AdminDeleteRoleplay").WithErr(err).WithMessage("شناسه نامعتبر است").WithKind(richerror.KindInvalid)
	}
	return s.roleplays.Delete(ctx, id)
}
