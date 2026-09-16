# LingoFlow — Product Context & ELSA Benchmark

## 1. Product Overview

LingoFlow is a mobile English-speaking learning application focused on learning English through realistic situations, visual scenes, shadowing, speaking practice, and AI-powered feedback.

The product should NOT become a generic English-learning app or a copy of ELSA Speak.

The main product differentiation is:

> Learn to speak English by experiencing realistic situations, not just completing lessons.

Core philosophy:

> See it → Hear it → Shadow it → Record it → Get AI Feedback → Retry → Improve

LingoFlow should make English speaking practice feel like entering a real-world situation.

---

# 2. Core Product Positioning

Potential positioning:

> Practice English in real situations — not just lessons.

Alternative:

> See it. Hear it. Shadow it. Speak it.

The product should focus primarily on speaking ability and real-life communication.

The goal is not to compete with large English-learning platforms by having thousands of grammar lessons.

The goal is to create a superior speaking-practice experience.

---

# 3. Core Learning Loop

The most important product loop is:

Scene
↓
Hotspot
↓
Dialogue
↓
Listen
↓
Shadow
↓
Record
↓
AI Analysis
↓
Feedback
↓
Retry
↓
Progress
↓
Next Practice

This loop is more important than the total number of features.

---

# 4. Visual Scene System

A major differentiator of LingoFlow is visual learning through cinematic scenes.

Example:

Restaurant scene

The user sees a realistic/wide cinematic 3D environment.

Possible hotspots:

* Waiter
* Customer
* Counter
* Menu
* Table

Each hotspot contains several dialogues.

Example:

Restaurant → Waiter → Dialogue 1

"Hi, are you ready to order?"

The user can interact with the scene and practice dialogues associated with different characters or locations.

Important:

* Scenes should be visually rich.
* Scenes should be wide/cinematic.
* Scenes should feel like real situations.
* Hotspots should be interactive.
* Images generated for scenes should NOT contain hotspot overlays.
* The camera should NOT be top-down.
* Background images should be suitable for mobile horizontal/wide presentation where appropriate.

---

# 5. Dialogue Structure

Each scene can contain multiple hotspots.

Each hotspot can contain multiple dialogues.

Example:

Restaurant
├── Waiter
│   ├── Dialogue 1
│   ├── Dialogue 2
│   ├── Dialogue 3
│   └── Dialogue 4
│
├── Customer
│   ├── Dialogue 1
│   ├── Dialogue 2
│   └── Dialogue 3
│
└── Counter
├── Dialogue 1
└── Dialogue 2

Dialogue data can include:

* speaker
* text
* audio
* hotspot
* order
* difficulty
* vocabulary
* pronunciation targets
* expected response where applicable

---

# 6. Shadowing

Shadowing is a core LingoFlow feature.

The basic flow:

1. Listen to native pronunciation.
2. Listen again if needed.
3. Shadow the speaker.
4. Record the user's voice.
5. Analyze the recording.
6. Show feedback.
7. Allow retry.

The goal is not simply reading text aloud.

The user should imitate:

* pronunciation
* rhythm
* intonation
* timing
* fluency

Shadowing should remain one of the strongest differentiators of LingoFlow.

---

# 7. AI Speech Analysis

LingoFlow should analyze user speech.

Important dimensions:

* Pronunciation
* Fluency
* Intonation
* Grammar
* Vocabulary
* Accuracy

For pronunciation assessment, services such as Azure Speech Pronunciation Assessment can be considered.

The AI feedback should be actionable.

Bad:

> Score: 72

Better:

> Your pronunciation was good overall, but the word "comfortable" needs improvement.

Better:

> Try reducing the stress on the second syllable and repeat the sentence.

The system should encourage retry.

---

# 8. ELSA Speak Benchmark

ELSA Speak should be treated as a benchmark, not as something to copy blindly.

ELSA has evolved from a pronunciation-focused application into a broader AI English-speaking platform.

Important ELSA areas include:

* Assessment
* Personalized Learning Path
* Pronunciation Coach
* Sentence Practice
* AI Conversation
* Roleplay
* Speech Analyzer
* Free Speech
* Vocabulary
* Grammar
* Dictionary
* Courses
* Daily Practice
* Progress
* Streak
* Achievements
* Leaderboards
* Bilingual learning
* Multi-accent training
* Interview Coach
* Public Speaking Coach
* Meeting/Professional coaching
* AI-powered feedback

The key lesson is not "build all these features."

The key lesson is:

> ELSA connects assessment, practice, feedback, personalization, and progress into a continuous learning loop.

LingoFlow should do the same, but around realistic visual situations and shadowing.

---

# 9. ELSA Feature Analysis

## Assessment

ELSA:

* Measures the user's English ability.
* Identifies weaknesses.
* Uses results for personalization.

LingoFlow:

MUST HAVE.

But the assessment should be speaking-centric.

Potential dimensions:

* Pronunciation
* Fluency
* Vocabulary
* Grammar
* Listening
* Speaking confidence

The system should eventually create a Speaking Profile.

Example:

Speaking Level: B1

Pronunciation: 82
Fluency: 64
Vocabulary: 71
Grammar: 76

Main weakness:
Fluency / hesitation

---

# 10. Personalized Learning Path

ELSA uses assessment, goals, interests, and progress to personalize learning.

LingoFlow:

MUST HAVE.

Instead of:

"Today's Lesson"

prefer:

"Today's Mission"

Example:

Today's Mission:

Order a coffee in English

B1
7 minutes
Speaking

The system should choose scenarios based on:

* user's level
* user's goals
* weak skills
* previous performance
* completed scenarios
* vocabulary history

---

# 11. Pronunciation Coach

ELSA:
Very strong pronunciation analysis.

LingoFlow:

MUST HAVE.

However, pronunciation should not be the entire product.

In LingoFlow:

Pronunciation
↓
part of Shadowing
↓
part of Speaking Improvement

---

# 12. Sentence Practice

ELSA provides sentence-level speaking practice.

LingoFlow:

MUST HAVE.

But the LingoFlow flow should be:

Listen
↓
Shadow
↓
Record
↓
Compare
↓
Retry

---

# 13. AI Conversation

ELSA:
Users can have open-ended conversations with AI.

LingoFlow:

PHASE 2.

Do not make this the main MVP.

First build strong structured situation-based shadowing.

Later add:

Scene
↓
Structured Dialogue
↓
AI Conversation

---

# 14. Roleplay

ELSA has roleplay scenarios.

Examples:

* Restaurant
* Airport
* Travel
* Work
* Interview
* Meetings

LingoFlow:

IMPORTANT.

But LingoFlow should differentiate through visual scenes.

ELSA:

AI
↓
Conversation

LingoFlow:

Visual Scene
↓
Characters
↓
Dialogue
↓
Shadowing
↓
AI Feedback
↓
Conversation

---

# 15. Speech Analyzer

ELSA analyzes:

* Pronunciation
* Intonation
* Fluency
* Grammar
* Vocabulary

LingoFlow:

PHASE 2.

Example:

Speaking Report

Pronunciation: 81
Fluency: 67
Intonation: 73
Vocabulary: 76
Grammar: 78

Overall: 75

The system should use this information to determine future practice.

---

# 16. Free Speech

ELSA allows users to speak freely about a topic.

LingoFlow:

PHASE 2.

A stronger LingoFlow implementation could combine free speech with real-world context.

Example:

The user is making tea.

AI:

"Describe what you're doing."

User:

"I'm making some tea..."

The system analyzes the speech.

This can become an Everyday Speaking feature.

---

# 17. Vocabulary

ELSA has vocabulary learning and dictionary functionality.

LingoFlow:

MUST HAVE vocabulary learning.

But vocabulary should primarily come from situations.

Example:

Restaurant

* reservation
* menu
* appetizer
* recommend
* bill

The system can automatically extract important words from completed scenarios.

Then:

Scenario
↓
Vocabulary
↓
Review
↓
Lightner Box
↓
Future conversation

LingoFlow should NOT initially attempt to build a huge general-purpose dictionary.

---

# 18. Grammar

ELSA includes grammar learning.

LingoFlow:

PHASE 2 / LIMITED.

Grammar should initially be feedback-oriented rather than course-oriented.

Example:

User:

"I go yesterday."

AI:

"Better: I went yesterday."

Explanation:

Use past tense because the action happened yesterday.

Do not build a huge grammar curriculum in MVP.

---

# 19. Bilingual Learning

ELSA supports bilingual assistance.

LingoFlow:

MUST HAVE.

Especially for beginner users.

Potential progression:

Beginner:
Persian explanation + English content

Intermediate:
Mostly English + limited Persian assistance

Advanced:
English only

The objective is to gradually reduce dependence on Persian.

---

# 20. Daily Practice

ELSA heavily emphasizes daily practice.

LingoFlow:

MUST HAVE.

Daily Practice should be:

Today's Mission

rather than simply:

Today's Lesson.

Example:

Today's Mission:
"Order breakfast at a hotel"

Duration:
8 minutes

Skills:
Speaking + Pronunciation

---

# 21. Progress

LingoFlow:

MUST HAVE.

Track progress over time.

Example:

Week 1:
Speaking 61

Week 2:
Speaking 66

Week 3:
Speaking 72

Week 4:
Speaking 77

Also track:

* pronunciation
* fluency
* intonation
* vocabulary
* grammar
* completed situations
* speaking time
* shadowing attempts

---

# 22. Gamification

Use:

* Streak
* XP
* Achievements
* Daily goals

Prioritize:

Streak: MUST HAVE

Achievements: SHOULD HAVE

Leaderboard: LOW PRIORITY

The product should not become a social network.

---

# 23. Scenario Library

LingoFlow should build a curated scenario library.

Initial target:

30–50 main scenarios.

Three broad levels:

## Simple

Examples:

* Introducing yourself
* Ordering food
* Ordering coffee
* Shopping
* Asking for directions
* Booking a hotel
* Airport
* Talking about hobbies
* Daily routine
* Meeting someone new

## Intermediate

Examples:

* University presentation
* Group discussion
* Job-related discussion
* Explaining a problem
* Giving an opinion
* Planning a trip
* Discussing technology
* Discussing education
* Making a complaint
* Social conversation

## Professional / Advanced

Examples:

* Explaining a movie
* Job interview
* Business meeting
* Presentation
* Negotiation
* Project discussion
* Giving professional feedback
* Technical discussion
* Persuasive speaking
* Workplace communication

---

# 24. LingoFlow Feature Priorities

## PHASE 1 — MVP

Build:

1. Onboarding
2. Speaking Assessment
3. Level
4. Scenario Library
5. Visual Scenes
6. Hotspots
7. Dialogue System
8. Listen
9. Shadow
10. Record
11. Pronunciation Analysis
12. Basic AI Feedback
13. Vocabulary Extraction
14. Lightner Box
15. Daily Mission
16. Progress
17. Streak

Core experience:

Scene
↓
Hotspot
↓
Dialogue
↓
Listen
↓
Shadow
↓
Record
↓
AI Score
↓
Retry

---

# 25. PHASE 2

Add:

* AI Conversation — ✅ Shipped 2026-09-14 (see section 35)
* Free Speech — ✅ Shipped 2026-09-16 (see section 35)
* Speech Analyzer — ✅ Shipped 2026-09-14, as Grammar added to Skill Breakdown (see section 35)
* Grammar Feedback — ✅ Shipped 2026-09-14 (see section 35)
* Vocabulary Coach — ✅ Shipped 2026-09-15, v1 (see section 35)
* Advanced Personalization — ✅ Shipped 2026-09-16, both parts (see section 35)
* Adaptive Learning Path — ✅ Shipped 2026-09-16, same work as Advanced Personalization (see section 35)
* More scenarios — 🟡 In progress (content, not code): ~20 of the 30–50 target authored on production as of 2026-09-14 (section 23)
* More sophisticated speaking reports — ✅ Shipped 2026-09-16, as the Weekly Speaking Digest (see section 35)

All Phase 2 code items are shipped as of 2026-09-16; only content growth (scenario count) remains open.

---

# 26. PHASE 3

Add specialized coaches:

Daily Life Coach
Travel Coach
University Coach
Job Interview Coach
Presentation Coach
Meeting Coach
Workplace Coach

Example:

LingoFlow
├── Daily Life
├── University
├── Career
└── Travel

Career:

* Interview
* Meeting
* Presentation
* Negotiation
* Workplace conversation

---

# 27. PHASE 4 — LingoFlow AI

The ultimate goal is an adaptive Speaking AI.

Example user profile:

Level: B1

Pronunciation: 82
Fluency: 64
Vocabulary: 71
Grammar: 76

Weakness:
Hesitation

Goal:
Job Interview

The AI should understand:

> This user does not primarily need more pronunciation exercises. Their main weakness is fluency and hesitation.

Therefore the system should recommend more:

* spontaneous speaking
* timed responses
* roleplay
* conversation

and fewer basic pronunciation drills.

This is the beginning of true personalization.

---

# 28. Product Architecture Concept

The product learning engine should conceptually work like this:

USER PROFILE
↓
SPEAKING PROFILE
↓
Weak Skills + User Goals
↓
SCENARIO ENGINE
↓
SCENARIO
↓
SCENE
↓
HOTSPOT
↓
DIALOGUES
↓
Listen → Shadow → Record
↓
AI ANALYSIS
↓
Pronunciation / Fluency / Vocabulary / Grammar
↓
USER PROFILE UPDATE
↓
NEXT SCENARIO

The important point:

Every speaking attempt should produce useful data.

The system should learn from the user's performance.

---

# 29. Strategic Differentiation

Do NOT build:

"ELSA but with different UI."

Instead:

ELSA:
AI Conversation
↓
Speaking
↓
Feedback

LingoFlow:

Real Situation
↓
Visual Context
↓
Character / Hotspot
↓
Dialogue
↓
Shadowing
↓
Speaking
↓
AI Feedback
↓
Adaptive Practice

The product should own the concept:

> Real-world contextual speaking practice.

---

# 30. Product Principles

1. Speaking first.
2. Real situations over abstract lessons.
3. Context over isolated sentences.
4. Shadowing is a core mechanic.
5. AI feedback must lead to action.
6. Every mistake should inform future practice.
7. Personalization should be based on actual speaking performance.
8. Avoid feature bloat.
9. Do not build a generic English-learning platform.
10. Do not copy ELSA directly.
11. Visual scenes should be a major differentiator.
12. The user should always know what to practice next.
13. Practice should feel short, achievable, and repeatable.
14. The product should optimize for speaking habit and retention.

---

# 31. Decision Framework for Future Features

Whenever proposing a new feature, evaluate it using these questions:

1. Does it improve speaking ability?
2. Does it improve real-world communication?
3. Does it strengthen the Scene → Shadow → Speak loop?
4. Does it create useful data for personalization?
5. Does it improve retention?
6. Does it differentiate LingoFlow from generic language apps?
7. Is it necessary for MVP?
8. Can it be postponed?

Do not add a feature simply because ELSA has it.

---

# 32. Primary Product Loop

The most important loop in the entire product is:

REAL SITUATION
↓
SEE
↓
HEAR
↓
SHADOW
↓
RECORD
↓
AI ANALYSIS
↓
FEEDBACK
↓
RETRY
↓
REMEMBER
↓
USE IN ANOTHER SITUATION

This should guide product, UX, backend, AI, content, and data architecture decisions.

---

# 33. Claude's Role

When working on LingoFlow, Claude should act as:

* Product Engineer
* UX Engineer
* AI Product Architect
* Backend Architect
* Mobile Architect
* Critical Product Reviewer

Claude should challenge weak product decisions rather than blindly implementing them.

When proposing implementation:

1. Explain the problem briefly.
2. Propose the simplest correct solution.
3. Prefer incremental implementation.
4. Avoid unnecessary abstractions.
5. Keep MVP scope under control.
6. Reuse existing architecture where appropriate.
7. Clearly distinguish MVP from future phases.

Do not implement Phase 2/3 features when they are not required for MVP.

---

# 34. Core Product Statement

LingoFlow is not primarily an English lesson app.

It is a:

> Contextual AI Speaking Practice Platform

where users learn to communicate by entering realistic situations, listening to natural dialogue, shadowing native speakers, recording themselves, receiving AI feedback, and repeating the interaction until they improve.

The long-term vision is:

> An AI coach that understands how the user speaks English in real-world situations and continuously creates the right speaking practice for them.

---

# 35. Implementation Status (living log)

This section is updated as features ship, so the MVP checklist in section 24 stays a real status board, not just a wishlist. Format: what shipped, when, and where it lives in the code — enough for a future session to verify the claim rather than trust it blindly.

## Shipped

**Speaking Assessment — Stage 1 "Quick Check" (2026-09-13)**

Fills MVP item 2 (Speaking Assessment) and item 3 (Level) from section 24.

- 5 randomly-pooled items per test: one "intro" free-speech prompt, one "situational" free-speech prompt, and **three** shadow sentences — one each from the beginner/intermediate/advanced pools — all authored/managed from the admin panel (new "تست تعیین سطح" section), not hardcoded.
- Only the shadow items get a real Pronunciation/Fluency/Overall score (reuses the existing `speecheval.Evaluator`); Level is set from the **average of the three shadow scores**, not a single sentence — a lone unlucky/lucky sentence no longer swings the whole result (`internal/service/assessment/submit_assessment.go`'s `averageShadowResults`, CEFR-ish mapping in `internal/domain/assessment/level_mapping.go`, currently A1-C1, thresholds marked as an adjustable placeholder). A full adaptive (CAT-style) placement test was considered and deliberately deferred — it would require session-state across multiple request rounds, which conflicts with the stateless "one request, done" design; the 3-tier average gets most of the reliability benefit without that complexity.
- Known device quirk (not a code bug, no fix needed): on the Android **emulator**, quick back-to-back playback→record transitions can produce audio static due to the emulator's shared virtual audio device; doesn't reproduce on real hardware. Separately, a real bug was found and fixed: setting the reference-audio URL eagerly on item-entry raced with an immediate manual play-press and could wedge TrackPlayer — fixed by only setting the URI at the moment "play" is pressed (`PlacementTestRecordScreen.tsx`).
- The two free-speech items get transcribed (`speecheval.TranscribeOnly` — added because the existing evaluator hard-requires a reference text to score pronunciation, which doesn't exist for open-ended answers) and checked for topical relevance by the AI service (`ai.CheckAnswerRelevance`, new method across all three providers) — qualitative yes/partial/no + one actionable sentence, deliberately **no fake numeric score** on these two.
- Persisted as `speaking_profiles` (upsert, no history/versioning yet) + a text-only `assessment_submission_items` log (no audio kept server-side, consistent with the rest of the app).
- Test is skippable, not mandatory; invisible end-to-end (both the login gate in `App.tsx` and the Home CTA) until the admin has actually populated at least one item of each kind/category — no user is ever blocked on empty content.
- Code: `internal/domain/assessment`, `internal/service/assessment`, `internal/repository/postgres/assessment`, `internal/delivery/httpserver/assessment` (mobile) + `internal/delivery/httpserver/admin/assessment_item.go` (admin CRUD), `admin-panel/app/dashboard/AssessmentPanel.tsx`, `app/src/screens/PlacementTest/*`, `app/src/api/assessment.ts`.
- Explicitly NOT built (out of scope for Stage 1, revisit only if a real need shows up): retake history/versioning of SpeakingProfile, live AI/TTS generation of test sentences (rejected — cost + complexity, see reasoning kept in git history of this plan), any Vocabulary/Grammar dimension on the score (the evaluator doesn't support it, and inventing one would violate section 7's "no fake precision" rule).
- UI polish (2026-09-13, same day): Level is now actually *visible* to the user, not just computed — a small chip in the Drawer under the username (`t('placementLevelBadge')`). The Drawer also always exposes a "Speaking Level Test" row (`onOpenPlacementTest` in `AppDrawer.tsx`) so a user can retake the test anytime after the first result, independent of the Home CTA card (which stays reserved for "you haven't taken it yet"). This closes the loop: Level is no longer dead data — it's end-to-end verified on a real device and one tap away from being retaken.

**Personalized "Today's Mission" (2026-09-13)**

Fills MVP item 15 (section 24) / spec section 10. First real consumer of the `SpeakingProfile` the Assessment feature produces — previously write-only data.

- No new screen, no new DB table: read-time composition over data that already existed — `Scene.Difficulty` (beginner/intermediate/advanced, same tiers as assessment shadow items), `SpeakingProfile.Level` (A1-C1), `scene_progress`/`scene_dialogue_progress` completion, and the same pronunciation/fluency averages `GetSkillsBreakdown` already used.
- Selection: target difficulty from `SpeakingProfile.Level` (A1/A2→beginner, B1→intermediate, B2/C1→advanced) → first incomplete scene at that difficulty (lowest `Order`) → falls back to any incomplete scene → falls back to the least-recently-completed scene at that difficulty once everything is done, so the card is never empty (`internal/service/mission/get_today.go`'s `pickScene`).
- Graceful degradation everywhere, never a block: no profile yet → defaults to beginner and labels the card with the scene's own difficulty instead of a fake CEFR level (`is_estimated_level`); no shadowing attempts yet → generic "Speaking" focus label instead of inventing a "weak skill" from zero data; no published scenes at all → 404, mobile silently falls back to the old static "Continue Story" card (`scenes[0]`) with zero regression risk.
- Replaced, not duplicated, the existing "Continue Story" card on Home (`app/src/screens/Home.tsx`) — adding a second card would have created a second competing "what do I do next" answer, which fails the Core-Loop-fit test. Same tap target, same navigation (`Shadowing` screen), now with level/minutes/focus-skill badges.
- Code: `internal/service/mission`, `internal/delivery/httpserver/mission` (`GET /v1/mission/today`), `app/src/api/mission.ts`, `app/src/screens/Home.tsx`.
- Explicitly NOT built: no caching/versioning of the recommendation (recomputed fresh per request — cheap enough at this scale), no vocabulary/goals dimension in the selection (spec section 10 lists them as future inputs; only level + weak-skill signal exist today), no admin-authorable content (this feature has none — pure computation).

**Progress over time (2026-09-14)**

Fills MVP item 16 (section 24) / spec section 21. Read-time aggregation over data that already existed, same pattern as Today's Mission — no new input data required, only reporting.

- New weekly trend: last 6 calendar weeks (Monday-start, current week included) of the user's average speaking score (`(pronunciation_score + fluency_score) / 2`), from the same two sources `AvgScoresByUser` already unions (`shadowing_recordings` + `shadowing_evaluation_events`). Weeks with zero sessions come back as `sessions: 0` so the client can render them as empty rather than a fake score dip (mirrors the zero-fill approach `WeeklyActivity` already uses for the 7-day chart).
- Code: `internal/repository/postgres/shadowing/recording/recording_repo.go`'s `TrendByUser`, `internal/service/progress/get_progress_trend.go`, `internal/delivery/httpserver/progress/get_progress_trend.go` (`GET /v1/progress/trend`), `app/src/api/progress.ts`'s `getProgressTrend`, new "Progress Over Time" card in `app/src/screens/Placeholders.tsx`'s `ProgressScreen` (between Weekly Activity and Skill Breakdown).
- Explicitly NOT built: no per-skill (pronunciation vs. fluency) split on the trend line — spec section 21's own example is a single "Speaking" number, and splitting it would need two overlapping series with no chart library in the app; no vocabulary/grammar dimension (same "no fake precision" reasoning as the Assessment feature — the evaluator doesn't score those); no configurable time range (6 weeks is fixed, matches the existing 7-day activity chart's fixed-range precedent).

**Onboarding (2026-09-14)**

Fills MVP item 1 (section 24), the last unshipped item in the MVP checklist. Scope was deliberately kept to the minimal option (of three discussed): a 3-slide walkthrough only, no goal-selection step, no forced routing into the placement test.

- 3 slides covering the Core Loop (section 3) in plain language: "See it. Hear it." → "Shadow it. Record it." → "Get feedback. Improve." Skippable at any point (top-right "Skip"), last slide's button just completes onboarding.
- Shown once per install (`AsyncStorage` key `onboarding_v1_seen`), gated in `App.tsx` *before* the auth check — i.e. it's a device-level "first ever open" walkthrough, not a per-account one, and it doesn't try to route into the (already-existing, already-working) placement-test gate that fires post-login; the two gates are intentionally independent, not chained.
- Explicitly NOT built: no goal-selection step — rejected because nothing in the mission-selection logic (`internal/service/mission`) reads a goal yet (spec section 10 lists goals as a future input only), so collecting one now would be unused UI, violating principle 8 ("avoid feature bloat"); no forced/auto-advance into the placement test from the last slide — the existing post-login gate in `App.tsx` already handles that independently, chaining them would duplicate logic for no benefit.
- Code: `app/src/screens/OnboardingScreens.tsx`, gating in `app/App.tsx`.
- Related, same day: default UI language now follows device locale (`getDeviceLanguage()`, already existed for notifications, now reused for the language picker's initial value in `app/src/data/i18n.tsx`) instead of being hardcoded to English — the primary audience is Iranian (Persian-locale devices), so a Persian-locale phone should see Persian from the first screen, without hardcoding Persian for every install (e.g. store review).
- **Not yet verified on-device/emulator** — code is type-checked and lint-clean, but only exercised via static review, not a real Android run. The project is Android-only for now (no iOS build/testing).

**AI Conversation (2026-09-14)**

First Phase 2 feature (section 25), pulled forward ahead of Scenario Library growth by explicit user choice, not by the framework's default sequencing (section 30 principle 8 / section 33 normally say finish MVP content gaps first — flagged to the user before building, who chose to proceed anyway). Directly extends the Core Loop's structured Scene → Hotspot → Dialogue → Shadow → Record flow rather than replacing it, per section 13's guidance for how AI Conversation should relate to the rest of the product.

- After a user finishes every dialogue in a scene, the completion prompt (`handleFinishLesson`'s Alert in `SceneScreen`) offers a free-form turn-based voice conversation with an AI playing a character inferred from the scene's situation (e.g. a barista for a cafe scene) — capped at 8 user turns, with the model prompted to start wrapping up from turn 6.
- AI replies are text + real synthesized speech. The ElevenLabs integration this needed **already existed** (`internal/service/tts`, previously only used by the admin panel's "generate dialogue audio" button) — this feature is just its second consumer, no new TTS plumbing was built.
- Everything AI/TTS-dependent degrades gracefully and was verified live under real failure (not just code review): with the sandbox's outbound network blocking both the Gemini and ElevenLabs calls (TLS handshake timeouts), `POST /v1/ai-conversation/start` and `/turn` still returned 200 with static fallback text and no audio — never a 500, never a blocked conversation. Speech transcription (Whisper, local) was verified for real: a synthesized "Hello, I would like to buy a blue jacket please" audio file transcribed correctly, and a garbage-bytes audio file was correctly rejected (400) **without** consuming a turn.
- Turn cap is enforced server-side (`turnNumber >= MaxUserTurns`), never left to the model; a completed conversation rejects further turns (verified live: a second turn sent after completion returned `400 conversation already ended`).
- Code: `internal/domain/aiconversation`, `internal/repository/postgres/aiconversation`, `internal/service/aiconversation` (`StartConversation`/`SendTurn`), `internal/service/ai/converse.go` (+ implementations added to all 3 providers — Anthropic, Gemini, DeepSeek — since they share one Go interface, though only the account's configured provider, Gemini, is actually exercised), `internal/delivery/httpserver/aiconversation` (`POST /v1/ai-conversation/start`, `/turn`), `app/src/api/conversation.ts`, `app/src/screens/AIConversation/index.tsx`.
- Explicitly NOT built: no conversation history browsing/replay UI, no admin-configurable system prompt (persona is inferred from scene title/description/category at request time), no per-skill scoring of conversation turns (consistent with the "no fake precision" rule already applied to free-speech items elsewhere — free-form speech isn't scored against a reference).
- **Not yet verified on a real Android device/emulator** — same caveat as Onboarding; backend behavior (including both the happy path once network access is available, and every degrade path) was verified live via curl against the local dev stack, but the mobile screen itself has only been type-checked, not run.

**Grammar Feedback (2026-09-14)**

Second Phase 2 feature (section 25 / section 18 "Grammar"), same day as AI Conversation. Deliberately feedback-oriented, not course-oriented, per section 18's explicit guidance — one short correction + one plain-language reason, never a lesson.

- Applies only to the user's own free-form speech, on both places that already produce a transcript of it: Assessment free-speech items (`internal/service/assessment`) and AI Conversation user turns (`internal/service/aiconversation`) — deliberately **not** applied to shadowing dialogue, since there the user is repeating a fixed reference sentence and has nothing of their own to correct.
- New AI-provider capability `CheckGrammar` (`internal/service/ai/check_grammar.go`), an exact structural copy of the existing `checkRelevance` (single transcript in, `{corrected, explanation}` out, both empty when nothing's wrong) — implemented across all three providers (Anthropic/Gemini/DeepSeek) since they share one Go interface.
- Fully independent of, and additional to, the existing relevance check on the same transcript — one failing never affects the other, and neither ever blocks the assessment submission or the conversation turn (same graceful-degradation convention as every other AI call this session).
- Code: `internal/service/ai/check_grammar.go`, `submit_assessment.go`'s `evaluateFreeSpeech`, `aiconversation/send_turn.go`, migration `033_add_grammar_feedback.sql` (adds nullable `grammar_correction`/`grammar_explanation` to `assessment_submission_items` and `ai_conversation_turns`), new fields on `ItemResultDTO` and `SendTurnResponse`, rendered in `PlacementTestResultScreen.tsx` (right under the existing relevance feedback) and `AIConversationScreen`'s user bubbles.
- **Verified live end-to-end this session** (not just code review): with a deliberately flawed test utterance ("I go to store yesterday and buy a jacket"), the full pipeline ran correctly through transcription → grammar-check attempt → DB persistence → API response in both flows; the AI call itself was blocked by this sandbox's outbound network (same as AI Conversation's verification earlier), so the *content* of a real correction wasn't observed, but the *plumbing* (call site, DB columns, omitempty behavior, and that nothing broke when the AI call failed) was confirmed against a real running server, not assumed.
- Explicitly NOT built: no persistence-driven "grammar history" view (corrections are shown once, at the moment they happen, and logged only for audit — same non-UI-facing role `assessment_submission_items` already had); no combining the relevance + grammar calls into one AI request to save cost/latency (a plausible future optimization, skipped for now per "avoid premature optimization").
- **Not yet verified on a real Android device/emulator** — same caveat as the two features above it.

**Speech Analyzer → Grammar added to Skill Breakdown (2026-09-14)**

Third Phase 2 feature (section 25 / section 15 "Speech Analyzer"), same day as AI Conversation and Grammar Feedback — and a direct example of section 33's "challenge weak product decisions" instruction in practice. Section 15's example lists 5 dimensions (Pronunciation/Fluency/Intonation/Vocabulary/Grammar); flagged to the user before building that only 4 have a real signal in this codebase, and explicitly **did not** build Intonation — no pitch/prosody analysis exists anywhere, and inventing a number for it would violate the "no fake precision" rule applied consistently all session. User agreed to ship the 4 real dimensions only.

- Not a new screen: extends the existing "Skill Breakdown" section on the Progress screen (`app/src/screens/Placeholders.tsx`) — which already had Pronunciation/Fluency/Vocabulary — with a 4th bar, Grammar. Building a separate "Speech Analyzer" screen would have duplicated this section for no reason (same reasoning already applied to Today's Mission not duplicating the old "Continue Story" card).
- Grammar's number is genuine, not invented: the fraction of the user's free-form transcripts (across both places Grammar Feedback runs — Assessment free-speech items and AI Conversation turns) that needed *no* correction. New repo `internal/repository/postgres/progress/grammar` (`CleanRate`), one `UNION ALL` query across `assessment_submission_items` and `ai_conversation_turns` — same aggregation-across-tables-it-doesn't-own pattern `WeeklyActivity` already used.
- Deliberately did **not** add a new composite "Overall" score across the 4 dimensions — the Progress screen's existing "Overall Score" ring already means something different (scene completion %), and a second, differently-computed "Overall" under a similar label would confuse rather than help.
- Code: `internal/repository/postgres/progress/grammar/grammar_repo.go`, `internal/service/progress/get_skills_breakdown.go`, `GetSkillsBreakdownResponse.Grammar` (`internal/service/progress/dto`), mobile: `SkillsBreakdown.grammar` (`app/src/api/progress.ts`), 4th bar in `ProgressScreen`.
- **Verified live end-to-end this session**: seeded real rows in both source tables (2 clean + 1 flawed in `assessment_submission_items`, then +1 flawed in `ai_conversation_turns`) directly via SQL (since this sandbox's AI calls can't produce a real correction to test against) and confirmed the API returned the exact expected ratio at each step (66% → 50% as data was added) — the computation itself, not just the plumbing, was verified against real numbers this time.
- **Not yet verified on a real Android device/emulator** — same caveat as every mobile-touching feature this session.

**Assessment submission latency fix (2026-09-14, same day, prompted by the user noticing slow placement-test results)**

Not a new feature — a performance fix surfaced by today's own changes. `SubmitAssessment` processed its 5 submitted items (2 free-speech + 3 shadow, per the earlier 3-tier fix) fully sequentially; adding Grammar Feedback's second AI call per free-speech item earlier today made an already-sequential path measurably worse. Fixed in `internal/service/assessment/submit_assessment.go`: all submitted items now process concurrently (goroutines writing to per-index slots, no shared-slice mutation, verified race-free with `go build -race`), and each free-speech item's relevance + grammar checks now run concurrently with each other instead of back-to-back. Verified live: a real 5-item submission completed correctly and quickly under `-race`; this sandbox's AI calls fail fast (403) rather than timing out slowly, so the full magnitude of the improvement will be more visible in production where those calls actually succeed and take real (1-3s) latency each.

**Vocabulary Coach v1 (2026-09-15)**

Fills the Phase 2 "Vocabulary Coach" line (section 25). Designed as a proposal first (section 36), then implemented the same day; scope changed once during implementation — noted below rather than silently.

- **Correction to the original proposal:** the design doc assumed the Home screen needed a due-word badge built. Reading `app/src/screens/Home.tsx` during implementation showed the "Leitner" quick-action card already displays `${dueCount} words due` when `dueCount > 0` (client-computed from `VocabContext`) — that part of the proposal was already shipped, just not previously logged here. No changes were made to Home; a `GET /v1/leitner/words/due` endpoint was correspondingly **not** built either, since nothing server-side turned out to need it (the one thing that did need server-side due-awareness — the notification job — queries the repository directly, not over HTTP).
- What was actually missing, and what got built: a proactive **push notification** when a user has due words, since that was the one real gap (LingoFlow had zero re-engagement hooks tied to spaced repetition before this). Implemented as a straight structural copy of the existing streak-reminder pattern, not a new mechanism: new opt-in `vocab_reminder_enabled` column (migration `034_vocab_reminder_setting.sql`, default off — same consent posture as every other notification toggle), `VocabReminderTokens` query (`internal/repository/postgres/notification/repo.go`, users who opted in AND have ≥1 word past `next_review`), `Service.SendVocabReminders` (`internal/service/notification/service.go`), called from the same daily job that already sends streak reminders (`runDailyStreakJob`, `cmd/main.go`) rather than a second scheduler. Mobile: `vocabReminderEnabled`/`setVocabReminderEnabled` added to `NotificationContext.tsx` alongside the existing streak toggle, and a matching switch row in `AppDrawer.tsx` right below the streak-reminder row.
- The message is a single fixed string sent to every due user in one batch (`push.SendToTokens`), not personalized with an actual word count per user — same granularity `SendStreakReminders` already uses, not a new capability being invented here.
- Explicitly NOT built (unchanged from the proposal): no NLP/AI word extraction (still hand-authored per dialogue), no AI "coach" chat persona, no change to Today's Mission's scene-selection algorithm, no vocabulary stats/analytics screen, no `scene_id`/`dialogue_id` linkage on `leitner_words` (deferred exactly as flagged — this is the one open thread Advanced Personalization should pick up if it wants scene-aware nudges).
- Verified: `go build ./...`, `go vet ./...`, and `go test ./...` all clean; `npx tsc --noEmit` on the mobile app clean. **Not verified live** — no push actually sent/received on a device this session (would need a real due word + a real FCM-registered device + the daily job's scheduled hour, none of which were set up here); this is plumbing verified by reading and compiling, not by observing a notification arrive.
- Code: `internal/repository/postgres/migrations/034_vocab_reminder_setting.sql`, `internal/repository/postgres/notification/repo.go`, `internal/service/notification/service.go`, `cmd/main.go`, `app/src/api/notifications.ts`, `app/src/data/NotificationContext.tsx`, `app/src/components/AppDrawer.tsx`, `app/src/data/i18n.tsx`.

**Advanced Personalization — part A: 4-way focusSkill (2026-09-16)**

Ships part A of the proposal below (section 36's "Advanced Personalization / Adaptive Learning Path" entry), exactly as scoped the day before. Part B (goals) followed later the same day — see the next entry.

- `focusSkill` (`internal/service/mission/get_today.go`) now compares Pronunciation, Fluency, Vocabulary and Grammar — the same four dimensions `GetSkillsBreakdown` already surfaces on the Progress screen — instead of only Pronunciation vs. Fluency. Reuses the existing `LeitnerStatsRepository`/`GrammarStatsRepository` implementations (`postgresleitner`, `postgresgrammar`, already constructed in `cmd/main.go` for `progressservice`) via two new interfaces on `missionservice.Repository` (`LeitnerRepository`, `GrammarRepository`) — no new repository code, no migration, no mobile change (the response still just returns the winning skill's name as `focusSkill`, same field as before).
- Each skill only enters the comparison when real data backs it, same "no fake precision" convention as `GetSkillsBreakdown`: Pronunciation/Fluency both skipped when both are exactly 0 (no recordings yet — the only signal available, same limitation the original code already had), Vocabulary skipped when `wordCount == 0`, Grammar skipped when `total == 0` (no free-speech transcripts checked yet). If nothing has data, `focusSkill` stays the generic `"speaking"` fallback, unchanged from before.
- Code: `internal/service/mission/service.go` (new `LeitnerRepository`/`GrammarRepository` interfaces + `Service` fields), `internal/service/mission/get_today.go` (`computeFocusSkill`, extracted out of `GetTodaysMission`), `cmd/main.go` (`missionservice.New` now also takes `leitnerRepo`, `grammarRepo` — both already existed, just weren't wired in here before).
- Verified: `go build ./...`, `go vet ./...`, `go test ./...` all clean. **Not verified live against real data** — no seeded rows exercised the new Vocabulary/Grammar branches through a real `GET /v1/mission/today` call this session; the existing Pronunciation/Fluency path is unchanged code, already verified live in earlier sessions.
- Explicitly NOT built in this part (unchanged from the proposal): part B (goals) — shipped separately later the same day, see the next entry.

**Advanced Personalization — part B: optional Goal, soft bias only (2026-09-16, same day)**

Closes out the proposal above. The two open product decisions were put to the user directly rather than guessed: (1) effect — hard filter by scene category vs. soft priority only → **soft priority only**; (2) collection point — reopen Onboarding vs. a new post-test prompt vs. an optional row in Drawer/Settings → **optional row in Drawer/Settings**, consistent with Onboarding's existing decision (2026-09-14) to not ask for a goal at first-open.

- New optional `learning_goal` setting, one of `""` (none, default) / `Travel` / `Work` / `Daily Life` / `Study` — a fixed set, not free text, so the pill picker's label always matches something meaningful. Stored on `user_notification_settings` (migration `035_add_learning_goal.sql`) — reused the existing per-user settings table rather than a new one; `content_source` already lives there as a non-notification preference, so this isn't a new precedent, just the same drawer of misc settings the codebase already has.
- Scene-category matching is deliberately loose, not exact: `Category` is free text an admin types per scene (no fixed taxonomy — confirmed by reading `admin-panel/app/dashboard/SceneCreator.tsx`, which only offers a `<datalist>` autocomplete, not an enum), so `matchesGoal` (`internal/service/mission/get_today.go`) does a case-insensitive substring match in both directions. This is explicitly a "best-effort nudge," not a guarantee — a scene tagged "Airport" won't match goal "Travel" unless one string contains the other.
- The bias is genuinely soft, verified by construction not just by claim: `pickScene`'s existing two priority tiers (incomplete-at-target-difficulty, then any-incomplete) are unchanged in *which* tier is chosen — `pickPreferred` only reorders *within* a tier, preferring a goal-matching scene if one exists there, and always falls back to the tier's first scene otherwise. No scene is ever excluded for not matching the goal, and behavior for every existing user (whose `learning_goal` defaults to `""`) is provably identical to before this change, since `matchesGoal` short-circuits `false` on an empty goal.
- Same day, found and fixed while touching this handler: `UpdateNotificationSettings` (`internal/delivery/httpserver/user/notification_settings.go`) never actually read `vocab_reminder_enabled` from the request body or passed it to `UpsertSettings` — the mobile app was sending it correctly (`NotificationContext.tsx`'s `persist()`), but the backend silently dropped it on every save, meaning the Vocabulary Coach push toggle (shipped 2026-09-15) could never actually be turned on. Not something introduced today; a leftover gap from that session, closed now as a byproduct of extending the same struct for `learning_goal`.
- Code: migration `035_add_learning_goal.sql`; `internal/repository/postgres/notification/repo.go` (`Settings.LearningGoal`, `GetLearningGoal`, updated `GetSettings`/`UpsertSettings` queries); `internal/service/mission/service.go` (`GoalRepository` interface); `internal/service/mission/get_today.go` (`matchesGoal`, `pickPreferred`, `pickScene` now takes `goal`); `cmd/main.go` (`missionservice.New` now also takes `notificationRepo`); `internal/delivery/httpserver/user/notification_settings.go` (`allowedLearningGoals` allow-list, the `vocab_reminder_enabled` fix); mobile: `app/src/api/notifications.ts` (`LearningGoal` type), `app/src/data/NotificationContext.tsx` (`learningGoal`/`setLearningGoal`), `app/src/components/AppDrawer.tsx` (pill-picker row), `app/src/data/i18n.tsx` (new keys).
- Verified: `go build ./...`, `go vet ./...`, `go test ./...`, and `npx tsc --noEmit` on the mobile app all clean. **Not verified live/on-device** — no real save-goal → refetch-mission round trip was exercised against a running server or a real Android build this session; same caveat as most mobile-touching work logged above.
- Explicitly NOT built: no scene-category taxonomy/enum (would need touching every existing scene's `Category` and the admin UI — out of scope for a soft-bias nudge); no goal shown/editable anywhere except the Drawer row; no goal input during Onboarding (deliberately, per the decision above).

**Free Speech (2026-09-16, same day)**

The last remaining Phase 2 code gap (section 25) — everything else in that list had already shipped earlier this session. Not built as a standalone feature/tab (which the framework correctly kept deferred all session); instead, per an explicit product decision, attached to the exact point AI Conversation already occupies, as a second, lighter option: a single-turn "describe what happened" instead of a multi-turn AI-replies conversation. This keeps it tied to a real situation the user just practiced (section 16's own warning against becoming generic decontextualized speaking practice), and required zero new AI capability — it's the third consumer of the same `TranscribeOnly` + `CheckAnswerRelevance` + `CheckGrammar` trio Assessment's free-speech items already use, unchanged.

- Flow: after finishing every dialogue in a scene, the completion Alert in `SceneScreen` (`handleFinishLesson`) now offers "Describe what happened" alongside the existing "Have a conversation" option. Prompt text is generated from the scene's own title (`"Describe, in your own words, what happened in this situation: {title}"`), not admin-authored content — same "infer from scene metadata" pattern AI Conversation already uses for its character persona.
- New minimal slice, deliberately not layered onto `aiconversationservice` despite the similar shape (that service carries conversation-session state — status, turn count, history — none of which a single-shot attempt needs; forcing it in would've meant nullable/unused fields on every row). Backend: `internal/service/freespeech` (`Analyze` — transcribe, then relevance + grammar concurrently, same concurrency pattern as `evaluateFreeSpeech`), `internal/repository/postgres/freespeech` (insert-only audit log, no read path — same non-UI-facing role `assessment_submission_items` has), `internal/delivery/httpserver/freespeech` (`POST /v1/free-speech/analyze`, multipart `scene_id` + `audio`, mirrors `POST /v1/ai-conversation/turn`'s handler shape exactly). Migration `036_create_free_speech_attempts.sql`.
- No numeric score (section 7's "no fake precision" — free-form speech was never scored against a reference anywhere else in this codebase either), no conversation/session concept, no history-browsing UI (consistent with every other "logged for audit only" decision made this session).
- Mobile: `app/src/screens/FreeSpeech` (record once → analyzing → result card: transcript + relevance badge + grammar tip, reusing `PlacementTestResultScreen`'s exact `relevanceMeta` icon/color/label convention and the `grammarTipLabel` key already used by both Assessment and AI Conversation — no new visual language introduced), `app/src/api/freespeech.ts`, registered as a hidden-tab-bar route in `AppNavigator.tsx` (same pattern as `AIConversation`), new `sceneTitle` nav param passed straight from `SceneScreen`'s already-loaded scene (no extra round trip to fetch it again).
- Verified: `go build ./...`, `go vet ./...`, `go test ./...`, `npx tsc --noEmit` all clean. **Not verified live/on-device** — same caveat as every mobile-touching AI feature this session (this sandbox has no outbound network to a real transcription/AI backend, and no real Android build was run).
- Explicitly NOT built: no standalone entry point outside scene completion (deliberate v1 scope — see the product decision above; revisit only if usage data asks for it), no conversation/reply from the AI side, no persisted history view.

**Weekly Speaking Digest (2026-09-16, same day)**

Fills the last unaddressed Phase 2 line, "More sophisticated speaking reports" (section 25) — the only item in that list nothing had ever explicitly targeted. Discussed with the user first (per section 33): the existing Skill Breakdown + Progress Over Time charts are raw cumulative data, not an actionable "report"; three interpretations were laid out (a weekly push digest, a per-scene completion report, an exportable/shareable card) with trade-offs, and the user picked the weekly push digest — cheapest (zero new data collection, zero new AI calls) and the only one that doubles as a retention hook (principle 14), consistent with the existing streak/vocab reminder push pattern.

- New opt-in `weekly_digest_enabled` setting (migration `037_add_weekly_digest_setting.sql`, same table/pattern as every other notification toggle, default off). Sent by a new `notificationservice.SendWeeklyDigests`, run from the existing daily job (`runDailyStreakJob`, `cmd/main.go`) but gated to Mondays only — by then, the most recently completed Monday-start week (`TrendByUser`'s second-to-last entry) has fully elapsed and has real data, unlike the just-started current week.
- Deliberately skips users whose last completed week had zero sessions — no message is sent at all, rather than reporting "0 sessions" or inventing a discouraging/fake data point; keeping inactive users engaged is the streak reminder's job, not this one's.
- Message is personalized per user (sessions count, speaking-score delta vs. the week before, and a weakest-skill line) — unlike `SendStreakReminders`/`SendVocabReminders`, which send one fixed string to a batch of tokens, this loops per opted-in user. The weakest-skill logic (`weakestSkillLabel` in `internal/service/notification/send_weekly_digest.go`) is a deliberate small duplication of `missionservice`'s `computeFocusSkill` (same 4-way Pronunciation/Fluency/Vocabulary/Grammar comparison, same "only compare skills with real data behind them" guard) rather than a shared package — the two services' dependency shapes differ enough that extracting one 15-line helper into a new shared package would be premature abstraction (principle 4) for a single reuse site.
- Code: migration `037_add_weekly_digest_setting.sql`; `internal/repository/postgres/notification/repo.go` (`Settings.WeeklyDigestEnabled`, `WeeklyDigestOptedInUserIDs`, updated `GetSettings`/`UpsertSettings`); `internal/service/notification/service.go` (new `RecordingStatsRepository`/`LeitnerStatsRepository`/`GrammarStatsRepository` interfaces — same three shapes `progressservice` already uses, reused not duplicated in spirit even though the interfaces themselves are declared per-package per this codebase's existing convention); `internal/service/notification/send_weekly_digest.go` (`SendWeeklyDigests`, `weakestSkillLabel`); `cmd/main.go` (`notificationservice.New` now also takes `recordingRepo`/`leitnerRepo`/`grammarRepo`, all already existed; Monday gate in `runDailyStreakJob`); `internal/delivery/httpserver/user/notification_settings.go` (request/response field); mobile: `app/src/api/notifications.ts`, `app/src/data/NotificationContext.tsx` (`weeklyDigestEnabled`/`setWeeklyDigestEnabled`), `app/src/components/AppDrawer.tsx` (toggle row), `app/src/data/i18n.tsx`.
- Verified: `go build ./...`, `go vet ./...`, `go test ./...`, `npx tsc --noEmit` all clean. **Not verified live** — no digest actually sent/received this session (would need a real completed week of data + a real FCM-registered device + the job's Monday gate + scheduled hour, none set up here); same "plumbing verified by reading and compiling" caveat as Vocabulary Coach's push had.
- Explicitly NOT built: no per-skill breakdown in the message itself (only the single weakest one — matches the "one actionable thing" tone of Grammar Feedback rather than dumping all 4 numbers), no in-app digest history/archive (push-only, same as every other reminder), no configurable send day/time (fixed Monday, matches the fixed-schedule precedent of the streak job itself).

## Next recommended (per the Decision Framework, section 31)

**Scenario Library growth** (section 23, item 4): per the user (2026-09-14), ~20 scenes have now been authored directly on the production server (outside this session, not verified from here — the 6-scene count above is the local dev DB only and was already known to be a separate, smaller dataset). This is meaningfully closer to the 30-50 target than the last review assumed, and is now the only remaining Phase 2 gap of any kind (all Phase 2 code items shipped as of today) — still worth a real count next time this item comes up, but it's no longer treated as an untouched gap either.

---

# 36. Feature Design Proposals (pending — not yet built)

Design docs written *before* implementation, so scope gets agreed on paper first (per section 33's "explain the problem, propose the simplest correct solution" — and per section 31's Decision Framework, applied explicitly below rather than skipped). Entries move to section 35 once actually shipped, with a real "Explicitly NOT built" note replacing the proposed one here if scope changed during implementation.

(Vocabulary Coach was proposed here 2026-09-15 and shipped the same day — see section 35's "Shipped" log for the entry and for what changed between proposal and implementation.)

## Advanced Personalization / Adaptive Learning Path (proposed 2026-09-15, both parts shipped 2026-09-16 — see section 35)

Fills the Phase 2 "Advanced Personalization" and "Adaptive Learning Path" lines (section 25) together — they turned out to be the same gap once the code was actually read, not two separate features. Grounded in a fresh read of `internal/service/mission/get_today.go`, not assumption.

**What Today's Mission actually does today (confirmed by reading the code):**
1. Filters scenes to published + unlocked (`get_today.go:56-69`).
2. Reads `SpeakingProfile.Level` → maps to a target difficulty (`:74-80`, `difficultyForLevel` at `:24-33`).
3. Picks a scene via a 3-tier rule (`pickScene`, `:144-175`): first not-yet-completed scene at target difficulty → else first not-yet-completed scene at any difficulty → else the target-difficulty scene completed longest ago → else just `candidates[0]`.
4. Computes a `focusSkill` label (`:103-116`) by comparing only **pronunciation vs. fluency** averages (`SkillsRepository.AvgScoresByUser`) — whichever is lower gets named as the focus.

That's the entire personalization surface. Per spec section 10, the intended signal set is level + goals + weak skills + previous performance + completed scenes + vocabulary history — today's code only actually uses 3 of those 6 (level, completion, and a 2-of-4 slice of weak skills).

**Two genuinely different gaps hiding under one Phase-2 line item — confirmed, not assumed:**

**(A) `focusSkill` ignores Vocabulary and Grammar even though both are already computed elsewhere.** `internal/service/progress/get_skills_breakdown.go:24-45` already produces real Pronunciation/Fluency/Vocabulary/Grammar percentages for the Progress screen (Vocabulary from `leitnerRepo.AvgLevelByUser`, Grammar from `grammarRepo.CleanRate` — the same Grammar Coach infrastructure shipped 2026-09-14). `missionservice`'s `Repository` interfaces (`service.go:16-34`) simply don't include the Leitner or Grammar repos — nobody wired them in, not because of any deliberate design choice. This is pure reuse, no new data, no new product surface, no user-facing decision needed.

**(B) "Goals" do not exist anywhere — not a code gap, a product gap.** Searched the full domain model, every migration, and `OnboardingScreens.tsx`: there is no goal/interest field on any table, not even unused on `speaking_profiles` (migration `031_create_assessment_tables.sql:28-39`, which is placement-test output only — level/scores/timestamps, nothing else). This connects directly to a decision already on record: Onboarding (shipped 2026-09-14) explicitly rejected adding a goal-selection slide, reasoning "nothing in the mission-selection logic reads a goal yet... collecting one now would be unused UI." Building the goals half of Advanced Personalization is exactly what would un-block that — but it means reopening a UI decision that was deliberately deferred, not just writing backend code.

**Decision Framework (section 31) applied honestly, for each gap separately:**
- **(A) Vocabulary/Grammar in focusSkill:** improves personalization (Q4) and costs almost nothing (Q8: cannot really be postponed for a good reason — it's already-computed data sitting unused). Not MVP-required (Q7), correctly Phase 2, but this is the "can ship tomorrow" half.
- **(B) Goals:** improves real-world communication relevance (Q2) and personalization (Q4) *if* built well, but requires a genuine product decision (where to collect it, how many options, whether it filters scene *category* not just difficulty) before any code — building it hastily risks the exact "unused UI" trap Onboarding already avoided once.

**Proposed v1 scope for tomorrow (2026-09-16) — part A only:**
- Add `LeitnerRepository` (`AvgLevelByUser`) and `GrammarRepository` (`CleanRate`) to `missionservice.Repository` (or inject `progressservice` itself and reuse `GetSkillsBreakdown` directly — simplest-correct-solution call to make during implementation, not here).
- Extend `focusSkill` (`get_today.go:103-116`) from a pronunciation-vs-fluency comparison to a genuine 4-way weakest-skill pick across Pronunciation/Fluency/Vocabulary/Grammar.
- No scene-selection change, no migration, no mobile change beyond whatever label text `focusSkill` already renders — this is a pure backend accuracy fix to a signal that's already surfaced.

**Explicitly not building tomorrow (part B, deferred until a product decision is made):**
- No goal field, no onboarding/profile UI for it, no scene-category filtering by goal. This needs the user to decide, before code: does a goal filter scene *category* (e.g., "Travel" scenes) or just bias *difficulty/order*, and where does the app ask for it (a settings screen, since Onboarding already deliberately said no to asking at first-open)?




# LingoFlow — زمینه محصول و بنچمارک ELSA

## ۱. مرور کلی محصول

LingoFlow یک اپلیکیشن موبایلی یادگیری مکالمه انگلیسی است که بر یادگیری زبان انگلیسی از طریق موقعیت‌های واقعی، صحنه‌های بصری، سایه‌گویی (Shadowing)، تمرین مکالمه و بازخورد مبتنی بر هوش مصنوعی تمرکز دارد.

محصول نباید به یک اپلیکیشن عمومی یادگیری انگلیسی یا کپی از ELSA Speak تبدیل شود.

تمایز اصلی محصول این است:

> یاد بگیرید انگلیسی را از طریق تجربه موقعیت‌های واقعی صحبت کنید، نه فقط با تکمیل درس‌ها.

فلسفه اصلی:

> ببین آن را ← بشنو آن را ← سایه بزن آن را ← ضبط کن آن را ← بازخورد هوش مصنوعی بگیر ← دوباره تلاش کن ← بهتر شو

LingoFlow باید تمرین مکالمه انگلیسی را مانند ورود به یک موقعیت واقعی دنیای واقعی احساس‌پذیر کند.

---

# ۲. جایگاه‌یابی اصلی محصول

جایگاه‌یابی بالقوه:

> تمرین انگلیسی در موقعیت‌های واقعی — نه فقط درس‌ها.

جایگزین:

> ببین. بشنو. سایه بزن. صحبت کن.

محصول باید عمدتاً بر توانایی مکالمه و ارتباطات واقعی زندگی تمرکز کند.

هدف رقابت با پلتفرم‌های بزرگ یادگیری انگلیسی از طریق داشتن هزاران درس گرامر نیست.

هدف ایجاد یک تجربه برتر در تمرین مکالمه است.

---

# ۳. حلقه اصلی یادگیری

مهم‌ترین حلقه محصول:

صحنه
↓
نقطه تعامل (Hotspot)
↓
دیالوگ
↓
گوش دادن
↓
سایه‌گویی
↓
ضبط
↓
تحلیل هوش مصنوعی
↓
بازخورد
↓
تلاش مجدد
↓
پیشرفت
↓
تمرین بعدی

این حلقه از تعداد کل ویژگی‌ها مهم‌تر است.

---

# ۴. سیستم صحنه بصری

یک تمایز اصلی LingoFlow یادگیری بصری از طریق صحنه‌های سینمایی است.

مثال:

صحنه رستوران

کاربر یک محیط سه‌بعدی واقع‌گرایانه/سینمایی وسیع می‌بیند.

نقاط تعامل ممکن:

* گارسون
* مشتری
* پیشخوان
* منو
* میز

هر نقطه تعامل شامل چندین دیالوگ است.

مثال:

رستوران ← گارسون ← دیالوگ ۱

"سلام، آماده سفارش دادن هستید؟"

کاربر می‌تواند با صحنه تعامل کند و دیالوگ‌های مرتبط با شخصیت‌ها یا مکان‌های مختلف را تمرین کند.

مهم:

* صحنه‌ها باید از نظر بصری غنی باشند.
* صحنه‌ها باید وسیع/سینمایی باشند.
* صحنه‌ها باید مانند موقعیت‌های واقعی احساس شوند.
* نقاط تعامل باید تعاملی باشند.
* تصاویر تولیدشده برای صحنه‌ها نباید شامل لایه‌های نقاط تعامل باشند.
* دوربین نباید از بالا به پایین باشد.
* تصاویر پس‌زمینه باید برای نمایش افقی/وسیع موبایل در صورت لزوم مناسب باشند.

---

# ۵. ساختار دیالوگ

هر صحنه می‌تواند شامل چندین نقطه تعامل باشد.

هر نقطه تعامل می‌تواند شامل چندین دیالوگ باشد.

مثال:

رستوران
├── گارسون
│   ├── دیالوگ ۱
│   ├── دیالوگ ۲
│   ├── دیالوگ ۳
│   └── دیالوگ ۴
│
├── مشتری
│   ├── دیالوگ ۱
│   ├── دیالوگ ۲
│   └── دیالوگ ۳
│
└── پیشخوان
    ├── دیالوگ ۱
    └── دیالوگ ۲

داده‌های دیالوگ می‌توانند شامل موارد زیر باشند:

* گوینده
* متن
* صدا
* نقطه تعامل
* ترتیب
* سطح دشواری
* واژگان
* اهداف تلفظ
* پاسخ مورد انتظار در صورت وجود

---

# ۶. سایه‌گویی (Shadowing)

سایه‌گویی یک ویژگی اصلی LingoFlow است.

جریان اصلی:

۱. به تلفظ بومی گوش دهید.
۲. در صورت نیاز دوباره گوش دهید.
۳. سایه گوینده را بزنید (همزمان تکرار کنید).
۴. صدای کاربر را ضبط کنید.
۵. ضبط را تحلیل کنید.
۶. بازخورد نمایش دهید.
۷. امکان تلاش مجدد بدهید.

هدف صرفاً خواندن بلند متن نیست.

کاربر باید تقلید کند:

* تلفظ
* ریتم
* آهنگ کلام (Intonation)
* زمان‌بندی
* روانی

سایه‌گویی باید یکی از قوی‌ترین تمایزهای LingoFlow باقی بماند.

---

# ۷. تحلیل گفتار با هوش مصنوعی

LingoFlow باید گفتار کاربر را تحلیل کند.

ابعاد مهم:

* تلفظ
* روانی
* آهنگ کلام
* گرامر
* واژگان
* دقت

برای ارزیابی تلفظ، می‌توان خدماتی مانند Azure Speech Pronunciation Assessment را در نظر گرفت.

بازخورد هوش مصنوعی باید قابل اقدام باشد.

بد:

> امتیاز: ۷۲

بهتر:

> تلفظ شما به طور کلی خوب بود، اما کلمه "comfortable" نیاز به بهبود دارد.

بهتر:

> سعی کنید استرس روی هجای دوم را کاهش دهید و جمله را تکرار کنید.

سیستم باید کاربر را به تلاش مجدد تشویق کند.

---

# ۸. بنچمارک ELSA Speak

ELSA Speak باید به عنوان یک بنچمارک در نظر گرفته شود، نه چیزی که کورکورانه کپی شود.

ELSA از یک اپلیکیشن متمرکز بر تلفظ به یک پلتفرم گسترده‌تر مکالمه انگلیسی مبتنی بر هوش مصنوعی تکامل یافته است.

حوزه‌های مهم ELSA شامل:

* ارزیابی
* مسیر یادگیری شخصی‌سازی‌شده
* مربی تلفظ
* تمرین جمله
* مکالمه با هوش مصنوعی
* ایفای نقش
* تحلیلگر گفتار
* گفتار آزاد
* واژگان
* گرامر
* فرهنگ لغت
* دوره‌ها
* تمرین روزانه
* پیشرفت
* استریک (زنجیره روزانه)
* دستاوردها
* جدول امتیازات
* یادگیری دوزبانه
* آموزش چند لهجه‌ای
* مربی مصاحبه
* مربی سخنرانی عمومی
* مربی جلسات/حرفه‌ای
* بازخورد مبتنی بر هوش مصنوعی

درس کلیدی "ساختن همه این ویژگی‌ها" نیست.

درس کلیدی این است:

> ELSA ارزیابی، تمرین، بازخورد، شخصی‌سازی و پیشرفت را به یک حلقه یادگیری پیوسته متصل می‌کند.

LingoFlow باید همین کار را انجام دهد، اما حول موقعیت‌های بصری واقع‌گرایانه و سایه‌گویی.

---

# ۹. تحلیل ویژگی‌های ELSA

## ارزیابی

ELSA:

* توانایی انگلیسی کاربر را می‌سنجد.
* نقاط ضعف را شناسایی می‌کند.
* از نتایج برای شخصی‌سازی استفاده می‌کند.

LingoFlow:

باید داشته باشد.

اما ارزیابی باید مکالمه‌محور باشد.

ابعاد بالقوه:

* تلفظ
* روانی
* واژگان
* گرامر
* شنیدن
* اعتماد به نفس در مکالمه

سیستم باید در نهایت یک پروفایل مکالمه ایجاد کند.

مثال:

سطح مکالمه: B1

تلفظ: ۸۲
روانی: ۶۴
واژگان: ۷۱
گرامر: ۷۶

ضعف اصلی:
روانی / تردید

---

# ۱۰. مسیر یادگیری شخصی‌سازی‌شده

ELSA از ارزیابی، اهداف، علایق و پیشرفت برای شخصی‌سازی استفاده می‌کند.

LingoFlow:

باید داشته باشد.

به جای:

"درس امروز"

ترجیح دهید:

"مأموریت امروز"

مثال:

مأموریت امروز:

سفارش قهوه به انگلیسی

B1
۷ دقیقه
مکالمه

سیستم باید سناریوها را بر اساس موارد زیر انتخاب کند:

* سطح کاربر
* اهداف کاربر
* مهارت‌های ضعیف
* عملکرد قبلی
* سناریوهای تکمیل‌شده
* تاریخچه واژگان

---

# ۱۱. مربی تلفظ

ELSA:
تحلیل تلفظ بسیار قوی.

LingoFlow:

باید داشته باشد.

با این حال، تلفظ نباید کل محصول باشد.

در LingoFlow:

تلفظ
↓
بخشی از سایه‌گویی
↓
بخشی از بهبود مکالمه

---

# ۱۲. تمرین جمله

ELSA تمرین مکالمه در سطح جمله ارائه می‌دهد.

LingoFlow:

باید داشته باشد.

اما جریان LingoFlow باید این باشد:

گوش دادن
↓
سایه‌گویی
↓
ضبط
↓
مقایسه
↓
تلاش مجدد

---

# ۱۳. مکالمه با هوش مصنوعی

ELSA:
کاربران می‌توانند مکالمات باز با هوش مصنوعی داشته باشند.

LingoFlow:

فاز ۲.

این را MVP اصلی نکنید.

ابتدا سایه‌گویی قوی و ساختاریافته مبتنی بر موقعیت را بسازید.

بعداً اضافه کنید:

صحنه
↓
دیالوگ ساختاریافته
↓
مکالمه با هوش مصنوعی

---

# ۱۴. ایفای نقش

ELSA سناریوهای ایفای نقش دارد.

مثال‌ها:

* رستوران
* فرودگاه
* سفر
* کار
* مصاحبه
* جلسات

LingoFlow:

مهم.

اما LingoFlow باید از طریق صحنه‌های بصری تمایز ایجاد کند.

ELSA:

هوش مصنوعی
↓
مکالمه

LingoFlow:

صحنه بصری
↓
شخصیت‌ها
↓
دیالوگ
↓
سایه‌گویی
↓
بازخورد هوش مصنوعی
↓
مکالمه

---

# ۱۵. تحلیلگر گفتار

ELSA تحلیل می‌کند:

* تلفظ
* آهنگ کلام
* روانی
* گرامر
* واژگان

LingoFlow:

فاز ۲.

مثال:

گزارش مکالمه

تلفظ: ۸۱
روانی: ۶۷
آهنگ کلام: ۷۳
واژگان: ۷۶
گرامر: ۷۸

امتیاز کلی: ۷۵

سیستم باید از این اطلاعات برای تعیین تمرین‌های آینده استفاده کند.

---

# ۱۶. گفتار آزاد

ELSA به کاربران اجازه می‌دهد آزادانه درباره یک موضوع صحبت کنند.

LingoFlow:

فاز ۲.

یک پیاده‌سازی قوی‌تر LingoFlow می‌تواند گفتار آزاد را با زمینه دنیای واقعی ترکیب کند.

مثال:

کاربر در حال درست کردن چای است.

هوش مصنوعی:

"توضیح دهید چه کاری انجام می‌دهید."

کاربر:

"من در حال درست کردن چای هستم..."

سیستم گفتار را تحلیل می‌کند.

این می‌تواند به یک ویژگی "مکالمه روزمره" تبدیل شود.

---

# ۱۷. واژگان

ELSA یادگیری واژگان و عملکرد فرهنگ لغت دارد.

LingoFlow:

باید یادگیری واژگان داشته باشد.

اما واژگان باید عمدتاً از موقعیت‌ها بیاید.

مثال:

رستوران

* رزرو
* منو
* پیش‌غذا
* توصیه کردن
* صورتحساب

سیستم می‌تواند به طور خودکار کلمات مهم را از سناریوهای تکمیل‌شده استخراج کند.

سپس:

سناریو
↓
واژگان
↓
مرور
↓
جعبه لایتنر
↓
مکالمه آینده

LingoFlow نباید در ابتدا تلاش کند یک فرهنگ لغت عمومی بزرگ بسازد.

---

# ۱۸. گرامر

ELSA شامل یادگیری گرامر است.

LingoFlow:

فاز ۲ / محدود.

گرامر در ابتدا باید بازخورد-محور باشد نه دوره-محور.

مثال:

کاربر:

"I go yesterday."

هوش مصنوعی:

"بهتر: I went yesterday."

توضیح:

از زمان گذشته استفاده کنید زیرا عمل دیروز اتفاق افتاده است.

در MVP یک برنامه درسی گرامر عظیم نسازید.

---

# ۱۹. یادگیری دوزبانه

ELSA از کمک دوزبانه پشتیبانی می‌کند.

LingoFlow:

باید داشته باشد.

به ویژه برای کاربران مبتدی.

پیشرفت بالقوه:

مبتدی:
توضیح فارسی + محتوای انگلیسی

متوسط:
عمدتاً انگلیسی + کمک محدود فارسی

پیشرفته:
فقط انگلیسی

هدف کاهش تدریجی وابستگی به فارسی است.

---

# ۲۰. تمرین روزانه

ELSA به شدت بر تمرین روزانه تأکید دارد.

LingoFlow:

باید داشته باشد.

تمرین روزانه باید این باشد:

مأموریت امروز

نه صرفاً:

درس امروز.

مثال:

مأموریت امروز:
"سفارش صبحانه در هتل"

مدت:
۸ دقیقه

مهارت‌ها:
مکالمه + تلفظ

---

# ۲۱. پیشرفت

LingoFlow:

باید داشته باشد.

پیشرفت را در طول زمان پیگیری کنید.

مثال:

هفته ۱:
مکالمه ۶۱

هفته ۲:
مکالمه ۶۶

هفته ۳:
مکالمه ۷۲

هفته ۴:
مکالمه ۷۷

همچنین پیگیری کنید:

* تلفظ
* روانی
* آهنگ کلام
* واژگان
* گرامر
* موقعیت‌های تکمیل‌شده
* زمان مکالمه
* تلاش‌های سایه‌گویی

---

# ۲۲. گیمیفیکیشن

استفاده کنید از:

* استریک
* XP
* دستاوردها
* اهداف روزانه

اولویت:

استریک: باید داشته باشد

دستاوردها: خوب است داشته باشد

جدول امتیازات: اولویت پایین

محصول نباید به یک شبکه اجتماعی تبدیل شود.

---

# ۲۳. کتابخانه سناریو

LingoFlow باید یک کتابخانه سناریو منتخب بسازد.

هدف اولیه:

۳۰ تا ۵۰ سناریوی اصلی.

سه سطح کلی:

## ساده

مثال‌ها:

* معرفی خود
* سفارش غذا
* سفارش قهوه
* خرید
* پرسیدن آدرس
* رزرو هتل
* فرودگاه
* صحبت درباره سرگرمی‌ها
* روتین روزانه
* ملاقات با فرد جدید

## متوسط

مثال‌ها:

* ارائه دانشگاهی
* بحث گروهی
* بحث مرتبط با کار
* توضیح یک مشکل
* ابراز نظر
* برنامه‌ریزی سفر
* بحث درباره فناوری
* بحث درباره آموزش
* شکایت کردن
* مکالمه اجتماعی

## حرفه‌ای / پیشرفته

مثال‌ها:

* توضیح یک فیلم
* مصاحبه شغلی
* جلسه کاری
* ارائه
* مذاکره
* بحث پروژه
* ارائه بازخورد حرفه‌ای
* بحث فنی
* سخنرانی متقاعدکننده
* ارتباطات محیط کار

---

# ۲۴. اولویت‌های ویژگی LingoFlow

## فاز ۱ — MVP

بسازید:

۱. Onboarding
۲. ارزیابی مکالمه
۳. سطح
۴. کتابخانه سناریو
۵. صحنه‌های بصری
۶. نقاط تعامل
۷. سیستم دیالوگ
۸. گوش دادن
۹. سایه‌گویی
۱۰. ضبط
۱۱. تحلیل تلفظ
۱۲. بازخورد پایه هوش مصنوعی
۱۳. استخراج واژگان
۱۴. جعبه لایتنر
۱۵. مأموریت روزانه
۱۶. پیشرفت
۱۷. استریک

تجربه اصلی:

صحنه
↓
نقطه تعامل
↓
دیالوگ
↓
گوش دادن
↓
سایه‌گویی
↓
ضبط
↓
امتیاز هوش مصنوعی
↓
تلاش مجدد

---

# ۲۵. فاز ۲

اضافه کنید:

* مکالمه با هوش مصنوعی
* گفتار آزاد
* تحلیلگر گفتار
* بازخورد گرامر
* مربی واژگان
* شخصی‌سازی پیشرفته
* مسیر یادگیری تطبیقی
* سناریوهای بیشتر
* گزارش‌های مکالمه پیچیده‌تر

---

# ۲۶. فاز ۳

مربیان تخصصی اضافه کنید:

مربی زندگی روزمره
مربی سفر
مربی دانشگاه
مربی مصاحبه شغلی
مربی ارائه
مربی جلسه
مربی محیط کار

مثال:

LingoFlow
├── زندگی روزمره
├── دانشگاه
├── حرفه
└── سفر

حرفه:

* مصاحبه
* جلسه
* ارائه
* مذاکره
* مکالمه محیط کار

---

# ۲۷. فاز ۴ — LingoFlow AI

هدف نهایی یک هوش مصنوعی مکالمه تطبیقی است.

مثال پروفایل کاربر:

سطح: B1

تلفظ: ۸۲
روانی: ۶۴
واژگان: ۷۱
گرامر: ۷۶

ضعف:
تردید

هدف:
مصاحبه شغلی

هوش مصنوعی باید درک کند:

> این کاربر در درجه اول به تمرین‌های بیشتر تلفظ نیاز ندارد. ضعف اصلی آن‌ها روانی و تردید است.

بنابراین سیستم باید توصیه کند تمرین‌های بیشتر:

* مکالمه spontane
* پاسخ‌های زمان‌دار
* ایفای نقش
* مکالمه

و تمرین‌های کمتری:

* تمرین‌های پایه تلفظ

این آغاز شخصی‌سازی واقعی است.

---

# ۲۸. مفهوم معماری محصول

موتور یادگیری محصول باید به صورت مفهومی اینگونه کار کند:

پروفایل کاربر
↓
پروفایل مکالمه
↓
مهارت‌های ضعیف + اهداف کاربر
↓
موتور سناریو
↓
سناریو
↓
صحنه
↓
نقطه تعامل
↓
دیالوگ‌ها
↓
گوش دادن ← سایه‌گویی ← ضبط
↓
تحلیل هوش مصنوعی
↓
تلفظ / روانی / واژگان / گرامر
↓
به‌روزرسانی پروفایل کاربر
↓
سناریوی بعدی

نکته مهم:

هر تلاش مکالمه باید داده مفید تولید کند.

سیستم باید از عملکرد کاربر یاد بگیرد.

---

# ۲۹. تمایز استراتژیک

نسازید:

"ELSA اما با UI متفاوت."

به جای آن:

ELSA:
مکالمه با هوش مصنوعی
↓
مکالمه
↓
بازخورد

LingoFlow:

موقعیت واقعی
↓
زمینه بصری
↓
شخصیت / نقطه تعامل
↓
دیالوگ
↓
سایه‌گویی
↓
مکالمه
↓
بازخورد هوش مصنوعی
↓
تمرین تطبیقی

محصول باید مالک مفهوم زیر باشد:

> تمرین مکالمه زمینه‌ای در دنیای واقعی.

---

# ۳۰. اصول محصول

۱. مکالمه اول.
۲. موقعیت‌های واقعی بر درس‌های انتزاعی.
۳. زمینه بر جملات جدا.
۴. سایه‌گویی یک مکانیک اصلی است.
۵. بازخورد هوش مصنوعی باید به اقدام منجر شود.
۶. هر اشتباه باید به تمرین آینده اطلاع دهد.
۷. شخصی‌سازی باید بر اساس عملکرد واقعی مکالمه باشد.
۸. از تورم ویژگی‌ها اجتناب کنید.
۹. یک پلتفرم عمومی یادگیری انگلیسی نسازید.
۱۰. ELSA را مستقیماً کپی نکنید.
۱۱. صحنه‌های بصری باید یک تمایز اصلی باشند.
۱۲. کاربر باید همیشه بداند بعد چه چیزی را تمرین کند.
۱۳. تمرین باید کوتاه، قابل دستیابی و قابل تکرار احساس شود.
۱۴. محصول باید برای عادت مکالمه و حفظ کاربر (Retention) بهینه شود.

---

# ۳۱. چارچوب تصمیم برای ویژگی‌های آینده

هر زمان که یک ویژگی جدید پیشنهاد می‌دهید، آن را با این سوالات ارزیابی کنید:

۱. آیا توانایی مکالمه را بهبود می‌بخشد؟
۲. آیا ارتباطات دنیای واقعی را بهبود می‌بخشد؟
۳. آیا حلقه صحنه ← سایه‌گویی ← مکالمه را تقویت می‌کند؟
۴. آیا داده مفید برای شخصی‌سازی ایجاد می‌کند؟
۵. آیا حفظ کاربر را بهبود می‌بخشد؟
۶. آیا LingoFlow را از اپلیکیشن‌های عمومی زبان متمایز می‌کند؟
۷. آیا برای MVP ضروری است؟
۸. آیا می‌توان آن را به تعویق انداخت؟

ویژگی‌ای را فقط به این دلیل که ELSA دارد اضافه نکنید.

---

# ۳۲. حلقه اصلی محصول

مهم‌ترین حلقه در کل محصول:

موقعیت واقعی
↓
دیدن
↓
شنیدن
↓
سایه‌گویی
↓
ضبط
↓
تحلیل هوش مصنوعی
↓
بازخورد
↓
تلاش مجدد
↓
به خاطر سپردن
↓
استفاده در موقعیت دیگر

این باید تصمیمات محصول، UX، بک‌اند، هوش مصنوعی، محتوا و معماری داده را هدایت کند.

---

# ۳۳. نقش Claude

هنگام کار روی LingoFlow، Claude باید به عنوان موارد زیر عمل کند:

* مهندس محصول
* مهندس UX
* معمار محصول هوش مصنوعی
* معمار بک‌اند
* معمار موبایل
* بازبین انتقادی محصول

Claude باید تصمیمات ضعیف محصول را به چالش بکشد نه اینکه کورکورانه پیاده‌سازی کند.

هنگام پیشنهاد پیاده‌سازی:

۱. مشکل را مختصر توضیح دهید.
۲. ساده‌ترین راه‌حل صحیح را پیشنهاد دهید.
۳. پیاده‌سازی تدریجی را ترجیح دهید.
۴. از انتزاع‌های غیرضروری اجتناب کنید.
۵. محدوده MVP را تحت کنترل نگه دارید.
۶. در صورت لزوم از معماری موجود استفاده مجدد کنید.
۷. به وضوح MVP را از فازهای آینده متمایز کنید.

ویژگی‌های فاز ۲/۳ را وقتی برای MVP لازم نیستند پیاده‌سازی نکنید.

---

# ۳۴. بیانیه اصلی محصول

LingoFlow در درجه اول یک اپلیکیشن درس انگلیسی نیست.

این یک:

> پلتفرم تمرین مکالمه زمینه‌ای با هوش مصنوعی

است که در آن کاربران با ورود به موقعیت‌های واقع‌گرایانه، گوش دادن به دیالوگ طبیعی، سایه‌گویی گویندگان بومی، ضبط خود، دریافت بازخورد هوش مصنوعی و تکرار تعامل تا بهبود، یاد می‌گیرند ارتباط برقرار کنند.

چشم‌انداز بلندمدت:

> یک مربی هوش مصنوعی که درک می‌کند کاربر چگونه در موقعیت‌های دنیای واقعی انگلیسی صحبت می‌کند و به طور مداوم تمرین مکالمه مناسب را برای او ایجاد می‌کند.

---

# ۳۵. وضعیت پیاده‌سازی (لاگ زنده)

این بخش با ارسال ویژگی‌ها به‌روزرسانی می‌شود، تا چک‌لیست MVP در بخش ۲۴ یک تابلو وضعیت واقعی باقی بماند، نه فقط یک لیست آرزو. قالب: چه چیزی ارسال شد، چه زمانی، و کجا در کد زندگی می‌کند — به اندازه کافی برای یک جلسه آینده تا ادعا را تأیید کند نه اینکه کورکورانه اعتماد کند.

## ارسال‌شده

**ارزیابی مکالمه — مرحله ۱ "بررسی سریع" (۲۰۲۶-۰۹-۱۳)**

موارد MVP ۲ (ارزیابی مکالمه) و ۳ (سطح) از بخش ۲۴ را پر می‌کند.

- ۵ آیتم تصادفی از استخر در هر آزمون: یک درخواست "معرفی" گفتار آزاد، یک درخواست "موقعیتی" گفتار آزاد، و **سه** جمله سایه‌گویی — هر کدام یکی از استخرهای مبتدی/متوسط/پیشرفته — همه از پنل ادمین مدیریت می‌شوند (بخش جدید "تست تعیین سطح")، نه هاردکد شده.
- فقط آیتم‌های سایه‌گویی امتیاز واقعی تلفظ/روانی/کلی می‌گیرند (از `speecheval.Evaluator` موجود استفاده مجدد می‌کند)؛ سطح از **میانگین سه امتیاز سایه‌گویی** تعیین می‌شود، نه یک جمله — یک جمله بدشانس/خوش‌شانس دیگر کل نتیجه را تغییر نمی‌دهد (`averageShadowResults` در `internal/service/assessment/submit_assessment.go`، نقشه‌برداری CEFR-ish در `internal/domain/assessment/level_mapping.go`، فعلاً A1-C1، آستانه‌ها به عنوان یک placeholder قابل تنظیم علامت‌گذاری شده‌اند). یک آزمون تعیین سطح تطبیقی کامل (سبک CAT) در نظر گرفته و عمداً به تعویق افتاد — این نیاز به وضعیت جلسه در چند دور درخواست دارد، که با طراحی "یک درخواست، تمام" بدون حالت تضاد دارد؛ میانگین ۳ سطح بیشتر مزیت قابلیت اطمینان را بدون آن پیچیدگی به دست می‌آورد.
- یک نکته عجیب دستگاه شناخته‌شده (نه یک باگ کد، نیازی به رفع نیست): روی **شبیه‌ساز** اندروید، انتقال‌های سریع پخش←ضبط می‌توانند به دلیل دستگاه صوتی مجازی مشترک شبیه‌ساز، نویز صوتی تولید کنند؛ روی سخت‌افزار واقعی تکرار نمی‌شود. به طور جداگانه، یک باگ واقعی پیدا و رفع شد: تنظیم مشتاقانه URL صدای مرجع در ورود به آیتم با یک فشار پخش دستی فوری رقابت می‌کرد و می‌توانست TrackPlayer را قفل کند — با تنظیم URI فقط در لحظه فشار "پخش" رفع شد (`PlacementTestRecordScreen.tsx`).
- دو آیتم گفتار آزاد رونویسی می‌شوند (`speecheval.TranscribeOnly` — اضافه شد چون ارزیاب موجود برای امتیازدهی تلفظ به متن مرجع نیاز دارد، که برای پاسخ‌های باز وجود ندارد) و توسط سرویس هوش مصنوعی از نظر ارتباط موضوعی بررسی می‌شوند (`ai.CheckAnswerRelevance`، متد جدید در هر سه provider) — کیفی بله/جزئی/خیر + یک جمله قابل اقدام، عمداً **بدون امتیاز عددی جعلی** روی این دو.
- به عنوان `speaking_profiles` (upsert، هنوز بدون تاریخچه/نسخه‌بندی) + یک لاگ فقط متنی `assessment_submission_items` ذخیره می‌شود (هیچ صدایی در سمت سرور نگه داشته نمی‌شود، مطابق با بقیه اپلیکیشن).
- آزمون قابل رد کردن است، اجباری نیست؛ تا زمانی که ادمین حداقل یک آیتم از هر نوع/دسته را پر نکرده باشد، end-to-end نامرئی است (هم گیت ورود در `App.tsx` و هم CTA خانه) — هیچ کاربری هرگز روی محتوای خالی مسدود نمی‌شود.
- کد: `internal/domain/assessment`، `internal/service/assessment`، `internal/repository/postgres/assessment`، `internal/delivery/httpserver/assessment` (موبایل) + `internal/delivery/httpserver/admin/assessment_item.go` (CRUD ادمین)، `admin-panel/app/dashboard/AssessmentPanel.tsx`، `app/src/screens/PlacementTest/*`، `app/src/api/assessment.ts`.
- صراحتاً ساخته نشد (خارج از محدوده مرحله ۱، فقط در صورت نیاز واقعی دوباره بررسی شود): تاریخچه/نسخه‌بندی تلاش مجدد SpeakingProfile، تولید زنده AI/TTS جملات آزمون (رد شد — هزینه + پیچیدگی، استدلال در تاریخچه git این طرح نگه داشته شده)، هر بعد واژگان/گرامر روی امتیاز (ارزیاب از آن پشتیبانی نمی‌کند و اختراع یکی قانون "بدون دقت جعلی" بخش ۷ را نقض می‌کند).
- پولیش UI (۲۰۲۶-۰۹-۱۳، همان روز): سطح اکنون واقعاً برای کاربر *قابل مشاهده* است، نه فقط محاسبه‌شده — یک چیپ کوچک در Drawer زیر نام کاربری (`t('placementLevelBadge')`). Drawer همچنین همیشه یک ردیف "تست سطح مکالمه" (`onOpenPlacementTest` در `AppDrawer.tsx`) نمایش می‌دهد تا کاربر بتواند هر زمان پس از اولین نتیجه آزمون را دوباره بدهد، مستقل از کارت CTA خانه (که برای "هنوز آن را نداده‌اید" رزرو شده است). این حلقه را می‌بندد: سطح دیگر داده مرده نیست — end-to-end روی یک دستگاه واقعی تأیید شده و با یک ضربه قابل تکرار است.

**"مأموریت امروز" شخصی‌سازی‌شده (۲۰۲۶-۰۹-۱۳)**

مورد MVP ۱۵ (بخش ۲۴) / بخش ۱۰ مشخصات را پر می‌کند. اولین مصرف‌کننده واقعی `SpeakingProfile` که ویژگی ارزیابی تولید می‌کند — قبلاً داده فقط-نوشتنی بود.

- بدون صفحه جدید، بدون جدول DB جدید: ترکیب زمان-خواندن روی داده‌ای که قبلاً وجود داشت — `Scene.Difficulty` (مبتدی/متوسط/پیشرفته، همان سطوح آیتم‌های سایه‌گویی ارزیابی)، `SpeakingProfile.Level` (A1-C1)، تکمیل `scene_progress`/`scene_dialogue_progress`، و همان میانگین‌های تلفظ/روانی که `GetSkillsBreakdown` قبلاً استفاده می‌کرد.
- انتخاب: دشواری هدف از `SpeakingProfile.Level` (A1/A2←مبتدی، B1←متوسط، B2/C1←پیشرفته) ← اولین صحنه ناتمام در آن دشواری (کمترین `Order`) ← بازگشت به هر صحنه ناتمام ← بازگشت به صحنه‌ای که در آن دشواری کمترین اخیراً تکمیل شده وقتی همه چیز تمام شده، بنابراین کارت هرگز خالی نیست (`pickScene` در `internal/service/mission/get_today.go`).
- تخریب تدریجی همه جا، هرگز مسدودکننده: هنوز پروفایلی نیست ← پیش‌فرض به مبتدی و کارت با دشواری خود صحنه برچسب‌گذاری می‌شود نه سطح CEFR جعلی (`is_estimated_level`)؛ هنوز تلاش سایه‌گویی نیست ← برچسب تمرکز "مکالمه" عمومی به جای اختراع "مهارت ضعیف" از صفر داده؛ هیچ صحنه منتشرشده‌ای نیست ← ۴۰۴، موبایل بی‌صدا به کارت قدیمی استاتیک "ادامه داستان" (`scenes[0]`) با ریسک رگرسیون صفر برمی‌گردد.
- جایگزین شد، نه تکرار: کارت موجود "ادامه داستان" در خانه (`app/src/screens/Home.tsx`) — اضافه کردن کارت دوم یک پاسخ رقیب دوم "بعد چه کار کنم" ایجاد می‌کرد، که آزمون تناسب حلقه اصلی را رد می‌کند. همان هدف ضربه، همان ناوبری (صفحه سایه‌گویی)، اکنون با نشان‌های سطح/دقیقه/مهارت تمرکز.
- کد: `internal/service/mission`، `internal/delivery/httpserver/mission` (`GET /v1/mission/today`)، `app/src/api/mission.ts`، `app/src/screens/Home.tsx`.
- صراحتاً ساخته نشد: بدون کش/نسخه‌بندی توصیه (در هر درخواست تازه محاسبه می‌شود — در این مقیاس به اندازه کافی ارزان)، بدون بعد واژگان/اهداف در انتخاب (بخش ۱۰ مشخصات آنها را به عنوان ورودی‌های آینده فهرست می‌کند؛ امروز فقط سیگنال سطح + مهارت ضعیف وجود دارد)، بدون محتوای قابل نوشتن توسط ادمین (این ویژگی هیچ ندارد — محاسبه خالص).

**پیشرفت در طول زمان (۲۰۲۶-۰۹-۱۴)**

مورد MVP ۱۶ (بخش ۲۴) / بخش ۲۱ مشخصات را پر می‌کند. تجمیع زمان-خواندن روی داده‌ای که قبلاً وجود داشت، همان الگوی مأموریت امروز — بدون نیاز به داده ورودی جدید، فقط گزارش‌دهی.

- روند هفتگی جدید: ۶ هفته تقویمی آخر (شروع دوشنبه، شامل هفته جاری) از میانگین امتیاز مکالمه کاربر (`(pronunciation_score + fluency_score) / 2`)، از همان دو منبعی که `AvgScoresByUser` قبلاً ادغام می‌کرد (`shadowing_recordings` + `shadowing_evaluation_events`). هفته‌های بدون جلسه به عنوان `sessions: 0` برمی‌گردند تا کلاینت بتواند آنها را خالی رندر کند نه یک افت امتیاز جعلی (رویکرد پر کردن صفر که `WeeklyActivity` قبلاً برای نمودار ۷ روزه استفاده می‌کرد را منعکس می‌کند).
- کد: `TrendByUser` در `internal/repository/postgres/shadowing/recording/recording_repo.go`، `internal/service/progress/get_progress_trend.go`، `internal/delivery/httpserver/progress/get_progress_trend.go` (`GET /v1/progress/trend`)، `getProgressTrend` در `app/src/api/progress.ts`، کارت جدید "پیشرفت در طول زمان" در `ProgressScreen` (`app/src/screens/Placeholders.tsx`) (بین فعالیت هفتگی و تفکیک مهارت).
- صراحتاً ساخته نشد: بدون تفکیک هر مهارت (تلفظ در برابر روانی) روی خط روند — مثال خود بخش ۲۱ مشخصات یک عدد "مکالمه" واحد است، و تفکیک آن نیاز به دو سری همپوشان با هیچ کتابخانه نموداری در اپلیکیشن دارد؛ بدون بعد واژگان/گرامر (همان استدلال "بدون دقت جعلی" که در ویژگی ارزیابی — ارزیاب آنها را امتیاز نمی‌دهد)؛ بدون محدوده زمانی قابل تنظیم (۶ هفته ثابت است، مطابق با سابقه محدوده ثابت نمودار فعالیت ۷ روزه موجود).

**Onboarding (۲۰۲۶-۰۹-۱۴)**

مورد MVP ۱ (بخش ۲۴)، آخرین آیتم ارسال‌نشده در چک‌لیست MVP را پر می‌کند. محدوده عمداً به گزینه حداقلی (از سه مورد بحث‌شده) محدود شد: فقط یک راهنمای ۳ اسلایدی، بدون مرحله انتخاب هدف، بدون مسیریابی اجباری به آزمون تعیین سطح.

- ۳ اسلاید که حلقه اصلی (بخش ۳) را به زبان ساده پوشش می‌دهد: "ببین. بشنو." ← "سایه بزن. ضبط کن." ← "بازخورد بگیر. بهتر شو." در هر نقطه قابل رد کردن (بالا-راست "رد کردن")، دکمه اسلاید آخر فقط Onboarding را کامل می‌کند.
- یک بار در هر نصب نمایش داده می‌شود (کلید AsyncStorage `onboarding_v1_seen`)، در `App.tsx` *قبل* از بررسی احراز هویت گیت می‌شود — یعنی یک راهنمای "اولین باز شدن تا به حال" در سطح دستگاه است، نه در سطح حساب، و سعی نمی‌کند به گیت آزمون تعیین سطح (که قبلاً وجود دارد و کار می‌کند) که پس از ورود فعال می‌شود مسیریابی کند؛ این دو گیت عمداً مستقل هستند، نه زنجیره‌ای.
- صراحتاً ساخته نشد: بدون مرحله انتخاب هدف — رد شد چون هیچ چیز در منطق انتخاب مأموریت (`internal/service/mission`) هنوز هدفی را نمی‌خواند (بخش ۱۰ مشخصات اهداف را فقط به عنوان ورودی آینده فهرست می‌کند)، بنابراین جمع‌آوری یکی اکنون UI بی‌استفاده خواهد بود، که اصل ۸ ("از تورم ویژگی‌ها اجتناب کنید") را نقض می‌کند؛ بدون پیشروی اجباری/خودکار به آزمون تعیین سطح از اسلاید آخر — گیت موجود پس از ورود در `App.tsx` قبلاً این را مستقل مدیریت می‌کند، زنجیره کردن آنها منطق را برای هیچ سودی تکرار می‌کند.
- کد: `app/src/screens/OnboardingScreens.tsx`، گیت در `app/App.tsx`.
- مرتبط، همان روز: زبان پیش‌فرض UI اکنون از locale دستگاه پیروی می‌کند (`getDeviceLanguage()`، که قبلاً برای اعلان‌ها وجود داشت، اکنون برای مقدار اولیه انتخابگر زبان در `app/src/data/i18n.tsx` استفاده مجدد می‌شود) به جای هاردکد شدن به انگلیسی — مخاطب اصلی ایرانی است (دستگاه‌های با locale فارسی)، بنابراین یک گوشی با locale فارسی باید از صفحه اول فارسی ببیند، بدون هاردکد کردن فارسی برای هر نصبی (مثلاً بررسی فروشگاه).
- **هنوز روی دستگاه/شبیه‌ساز تأیید نشده** — کد type-checked و lint-clean است، اما فقط از طریق بررسی استاتیک بررسی شده، نه یک اجرای واقعی اندروید. پروژه فعلاً فقط اندروید است (بدون ساخت/تست iOS).

**مکالمه با هوش مصنوعی (۲۰۲۶-۰۹-۱۴)**

اولین ویژگی فاز ۲ (بخش ۲۵)، که با انتخاب صریح کاربر جلوتر از رشد کتابخانه سناریو کشیده شد، نه با توالی پیش‌فرض چارچوب (بخش ۳۰ اصل ۸ / بخش ۳۳ معمولاً می‌گویند اول شکاف‌های محتوای MVP را تمام کنید — قبل از ساخت به کاربر علامت‌گذاری شد، که با این حال تصمیم گرفت ادامه دهد). مستقیماً جریان ساختاریافته حلقه اصلی صحنه ← نقطه تعامل ← دیالوگ ← سایه‌گویی ← ضبط را گسترش می‌دهد نه اینکه جایگزین آن شود، مطابق راهنمایی بخش ۱۳ درباره چگونگی ارتباط مکالمه با هوش مصنوعی با بقیه محصول.

- پس از اینکه کاربر همه دیالوگ‌های یک صحنه را تمام کرد، درخواست تکمیل (Alert `handleFinishLesson` در `SceneScreen`) یک مکالمه صوتی نوبتی آزاد با هوش مصنوعی که نقش شخصیتی استنباط‌شده از موقعیت صحنه را بازی می‌کند (مثلاً باریستا برای صحنه کافه) ارائه می‌دهد — حداکثر ۸ نوبت کاربر، با دستور به مدل برای شروع جمع‌بندی از نوبت ۶.
- پاسخ‌های هوش مصنوعی متن + گفتار ترکیب‌شده واقعی هستند. یکپارچه‌سازی ElevenLabs که این نیاز داشت **قبلاً وجود داشت** (`internal/service/tts`، قبلاً فقط توسط دکمه "تولید صدای دیالوگ" پنل ادمین استفاده می‌شد) — این ویژگی فقط دومین مصرف‌کننده آن است، بدون plumbing TTS جدید.
- همه چیز وابسته به AI/TTS به تدریج تخریب می‌شود و تحت شکست واقعی به صورت زنده تأیید شد (نه فقط بررسی کد): با مسدود کردن شبکه خروجی sandbox هر دو تماس Gemini و ElevenLabs (timeout handshake TLS)، `POST /v1/ai-conversation/start` و `/turn` هنوز ۲۰۰ با متن fallback استاتیک و بدون صدا برمی‌گرداندند — هرگز ۵۰۰، هرگز مکالمه مسدود نشد. رونویسی گفتار (Whisper، محلی) واقعاً تأیید شد: یک فایل صوتی ترکیب‌شده "Hello, I would like to buy a blue jacket please" به درستی رونویسی شد، و یک فایل صوتی بایت‌های زباله به درستی رد شد (۴۰۰) **بدون** مصرف نوبت.
- سقف نوبت در سمت سرور اعمال می‌شود (`turnNumber >= MaxUserTurns`)، هرگز به مدل واگذار نمی‌شود؛ یک مکالمه تکمیل‌شده نوبت‌های بیشتر را رد می‌کند (به صورت زنده تأیید شد: نوبت دوم پس از تکمیل ۴۰۰ `conversation already ended` برگرداند).
- کد: `internal/domain/aiconversation`، `internal/repository/postgres/aiconversation`، `internal/service/aiconversation` (`StartConversation`/`SendTurn`)، `internal/service/ai/converse.go` (+ پیاده‌سازی‌ها در هر ۳ provider — Anthropic، Gemini، DeepSeek — چون یک رابط Go مشترک دارند، اگرچه فقط provider پیکربندی‌شده حساب، Gemini، واقعاً اجرا می‌شود)، `internal/delivery/httpserver/aiconversation` (`POST /v1/ai-conversation/start`، `/turn`)، `app/src/api/conversation.ts`، `app/src/screens/AIConversation/index.tsx`.
- صراحتاً ساخته نشد: بدون مرور/پخش تاریخچه مکالمه، بدون system prompt قابل تنظیم توسط ادمین (پرسونا در زمان درخواست از عنوان/توضیحات/دسته صحنه استنباط می‌شود)، بدون امتیازدهی هر مهارت نوبت‌های مکالمه (مطابق قانون "بدون دقت جعلی" که قبلاً در جای دیگر برای آیتم‌های گفتار آزاد اعمال شده — گفتار آزاد در برابر مرجع امتیاز نمی‌گیرد).
- **هنوز روی دستگاه/شبیه‌ساز واقعی اندروید تأیید نشده** — همان هشدار Onboarding؛ رفتار بک‌اند (شامل مسیر خوشحال وقتی دسترسی شبکه موجود است، و هر مسیر تخریب) به صورت زنده با curl در برابر استک dev محلی تأیید شد، اما صفحه موبایل خود فقط type-checked شده، نه اجرا.

**بازخورد گرامر (۲۰۲۶-۰۹-۱۴)**

دومین ویژگی فاز ۲ (بخش ۲۵ / بخش ۱۸ "گرامر")، همان روز مکالمه با هوش مصنوعی. عمداً بازخورد-محور، نه دوره-محور، مطابق راهنمایی صریح بخش ۱۸ — یک تصحیح کوتاه + یک دلیل به زبان ساده، هرگز یک درس.

- فقط روی گفتار آزاد خود کاربر اعمال می‌شود، در هر دو جایی که قبلاً رونویسی آن را تولید می‌کنند: آیتم‌های گفتار آزاد ارزیابی (`internal/service/assessment`) و نوبت‌های کاربر مکالمه با هوش مصنوعی (`internal/service/aiconversation`) — عمداً **روی دیالوگ سایه‌گویی اعمال نمی‌شود**، چون در آنجا کاربر یک جمله مرجع ثابت را تکرار می‌کند و چیزی از خود برای تصحیح ندارد.
- قابلیت جدید provider هوش مصنوعی `CheckGrammar` (`internal/service/ai/check_grammar.go`)، یک کپی ساختاری دقیق از `checkRelevance` موجود (یک رونویسی ورودی، `{corrected, explanation}` خروجی، هر دو خالی وقتی چیزی اشتباه نیست) — پیاده‌سازی‌شده در هر سه provider (Anthropic/Gemini/DeepSeek) چون یک رابط Go مشترک دارند.
- کاملاً مستقل از، و اضافی به، بررسی ارتباط موجود روی همان رونویسی — شکست یکی هرگز بر دیگری تأثیر نمی‌گذارد، و هیچکدام هرگز ارسال ارزیابی یا نوبت مکالمه را مسدود نمی‌کند (همان قرارداد تخریب تدریجی مانند هر تماس هوش مصنوعی دیگر این جلسه).
- کد: `internal/service/ai/check_grammar.go`، `evaluateFreeSpeech` در `submit_assessment.go`، `aiconversation/send_turn.go`، مهاجرت `033_add_grammar_feedback.sql` (ستون‌های nullable `grammar_correction`/`grammar_explanation` به `assessment_submission_items` و `ai_conversation_turns` اضافه می‌کند)، فیلدهای جدید روی `ItemResultDTO` و `SendTurnResponse`، رندر در `PlacementTestResultScreen.tsx` (درست زیر بازخورد ارتباط موجود) و حباب‌های کاربر `AIConversationScreen`.
- **به صورت زنده end-to-end این جلسه تأیید شد** (نه فقط بررسی کد): با یک utterance آزمایشی عمداً معیوب ("I go to store yesterday and buy a jacket")، خط لوله کامل به درستی از رونویسی ← تلاش بررسی گرامر ← پایداری DB ← پاسخ API در هر دو جریان اجرا شد؛ تماس هوش مصنوعی خود توسط شبکه خروجی sandbox مسدود شد (مانند تأیید مکالمه با هوش مصنوعی قبلی)، بنابراین *محتوای* یک تصحیح واقعی مشاهده نشد، اما *plumbing* (محل تماس، ستون‌های DB، رفتار omitempty، و اینکه وقتی تماس هوش مصنوعی شکست خورد هیچ چیز خراب نشد) در برابر یک سرور واقعی در حال اجرا تأیید شد، نه فرض.
- صراحتاً ساخته نشد: بدون نمای "تاریخچه گرامر" مبتنی بر پایداری (تصحیحات یک بار، در لحظه وقوع نمایش داده می‌شوند، و فقط برای حسابرسی ثبت می‌شوند — همان نقش غیر-UI-facing که `assessment_submission_items` قبلاً داشت)؛ بدون ترکیب تماس‌های ارتباط + گرامر به یک درخواست هوش مصنوعی برای صرفه‌جویی در هزینه/تأخیر (یک بهینه‌سازی آینده قابل قبول، فعلاً رد شد مطابق "از بهینه‌سازی زودهنگام اجتناب کنید").
- **هنوز روی دستگاه/شبیه‌ساز واقعی اندروید تأیید نشده** — همان هشدار دو ویژگی بالای آن.

**تحلیلگر گفتار ← گرامر به تفکیک مهارت اضافه شد (۲۰۲۶-۰۹-۱۴)**

سومین ویژگی فاز ۲ (بخش ۲۵ / بخش ۱۵ "تحلیلگر گفتار")، همان روز مکالمه با هوش مصنوعی و بازخورد گرامر — و یک مثال مستقیم از دستور بخش ۳۳ "تصمیمات ضعیف محصول را به چالش بکشید" در عمل. مثال بخش ۱۵ پنج بعد را فهرست می‌کند (تلفظ/روانی/آهنگ کلام/واژگان/گرامر)؛ قبل از ساخت به کاربر علامت‌گذاری شد که فقط ۴ بعد سیگنال واقعی در این کدبیس دارند، و صراحتاً **آهنگ کلام ساخته نشد** — هیچ تحلیل pitch/prosody در هیچ کجا وجود ندارد، و اختراع یک عدد برای آن قانون "بدون دقت جعلی" را نقض می‌کند که به طور مداوم در تمام جلسه اعمال شده. کاربر موافقت کرد فقط ۴ بعد واقعی ارسال شود.

- نه یک صفحه جدید: بخش "تفکیک مهارت" موجود در صفحه پیشرفت (`app/src/screens/Placeholders.tsx`) را گسترش می‌دهد — که قبلاً تلفظ/روانی/واژگان داشت — با یک نوار چهارم، گرامر. ساختن یک صفحه "تحلیلگر گفتار" جداگانه این بخش را بی‌دلیل تکرار می‌کرد (همان استدلالی که قبلاً برای مأموریت امروز که کارت قدیمی "ادامه داستان" را تکرار نمی‌کند اعمال شد).
- عدد گرامر اصیل است، نه اختراعی: کسری از رونویسی‌های گفتار آزاد کاربر (در هر دو جایی که بازخورد گرامر اجرا می‌شود — آیتم‌های گفتار آزاد ارزیابی و نوبت‌های مکالمه با هوش مصنوعی) که به *هیچ* تصحیحی نیاز نداشتند. مخزن جدید `internal/repository/postgres/progress/grammar` (`CleanRate`)، یک کوئری `UNION ALL` در `assessment_submission_items` و `ai_conversation_turns` — همان الگوی تجمیع در جداولی که مالک آنها نیست که `WeeklyActivity` قبلاً استفاده می‌کرد.
- عمداً یک امتیاز ترکیبی جدید "کلی" در ۴ بعد اضافه **نشد** — حلقه "امتیاز کلی" موجود صفحه پیشرفت قبلاً معنای متفاوتی دارد (درصد تکمیل صحنه)، و یک "کلی" دوم با محاسبه متفاوت تحت برچسب مشابه باعث سردرگمی می‌شود نه کمک.
- کد: `internal/repository/postgres/progress/grammar/grammar_repo.go`، `internal/service/progress/get_skills_breakdown.go`، `GetSkillsBreakdownResponse.Grammar` (`internal/service/progress/dto`)، موبایل: `SkillsBreakdown.grammar` (`app/src/api/progress.ts`)، نوار چهارم در `ProgressScreen`.
- **به صورت زنده end-to-end این جلسه تأیید شد**: ردیف‌های واقعی در هر دو جدول منبع کاشته شد (۲ تمیز + ۱ معیوب در `assessment_submission_items`، سپس +۱ معیوب در `ai_conversation_turns`) مستقیماً از طریق SQL (چون تماس‌های هوش مصنوعی این sandbox نمی‌توانند یک تصحیح واقعی برای آزمایش تولید کنند) و تأیید شد API نسبت دقیق مورد انتظار را در هر مرحله برگرداند (۶۶٪ ← ۵۰٪ با اضافه شدن داده) — خود محاسبه، نه فقط plumbing، این بار در برابر اعداد واقعی تأیید شد.
- **هنوز روی دستگاه/شبیه‌ساز واقعی اندروید تأیید نشده** — همان هشدار هر ویژگی موبایل-لمس این جلسه.

**رفع تأخیر ارسال ارزیابی (۲۰۲۶-۰۹-۱۴، همان روز، به دلیل توجه کاربر به نتایج کند آزمون تعیین سطح)**

نه یک ویژگی جدید — یک رفع عملکرد که توسط تغییرات خود امروز نمایان شد. `SubmitAssessment` ۵ آیتم ارسالی خود (۲ گفتار آزاد + ۳ سایه‌گویی، مطابق رفع ۳ سطح قبلی) را کاملاً متوالی پردازش می‌کرد؛ اضافه کردن تماس دوم هوش مصنوعی بازخورد گرامر در هر آیتم گفتار آزاد امروز، یک مسیر قبلاً متوالی را به طور قابل اندازه‌گیری بدتر کرد. در `internal/service/assessment/submit_assessment.go` رفع شد: همه آیتم‌های ارسالی اکنون همزمان پردازش می‌شوند (goroutineها به اسلات‌های هر ایندکس می‌نویسند، بدون جهش اسلایس مشترک، با `go build -race` تأیید شد که race-free است)، و بررسی‌های ارتباط + گرامر هر آیتم گفتار آزاد اکنون همزمان با یکدیگر اجرا می‌شوند نه پشت سر هم. به صورت زنده تأیید شد: یک ارسال واقعی ۵ آیتمی به درستی و سریع تحت `-race` کامل شد؛ تماس‌های هوش مصنوعی این sandbox به سرعت شکست می‌خورند (۴۰۳) نه اینکه کند timeout شوند، بنابراین بزرگی کامل بهبود در production که آن تماس‌ها واقعاً موفق می‌شوند و تأخیر واقعی (۱-۳ ثانیه) هر کدام می‌گیرند بیشتر قابل مشاهده خواهد بود.

**مربی واژگان v1 (۲۰۲۶-۰۹-۱۵)**

خط "مربی واژگان" فاز ۲ (بخش ۲۵) را پر می‌کند. ابتدا به عنوان یک پیشنهاد طراحی شد (بخش ۳۶)، سپس همان روز پیاده‌سازی شد؛ محدوده یک بار در حین پیاده‌سازی تغییر کرد — در زیر به جای سکوت ذکر شده.

- **تصحیح پیشنهاد اصلی:** سند طراحی فرض می‌کرد صفحه خانه نیاز به ساخت یک نشان کلمات سررسید دارد. خواندن `app/src/screens/Home.tsx` در حین پیاده‌سازی نشان داد کارت سریع "لایتنر" قبلاً `${dueCount} words due` را وقتی `dueCount > 0` است نمایش می‌دهد (محاسبه سمت کلاینت از `VocabContext`) — آن بخش از پیشنهاد قبلاً ارسال شده بود، فقط قبلاً در اینجا لاگ نشده بود. هیچ تغییری در خانه انجام نشد؛ یک endpoint `GET /v1/leitner/words/due` به همان ترتیب ساخته **نشد**، چون هیچ چیز سمت سرور در نهایت به آن نیاز نداشت (تنها چیزی که نیاز به آگاهی سررسید سمت سرور داشت — کار اعلان — مستقیماً به مخزن query می‌زند، نه از طریق HTTP).
- آنچه واقعاً کم بود، و آنچه ساخته شد: یک **اعلان push** پیشگیرانه وقتی کاربر کلمات سررسید دارد، چون این تنها شکاف واقعی بود (LingoFlow قبلاً هیچ قلاب re-engagement متصل به تکرار فاصله‌دار نداشت). به عنوان یک کپی ساختاری مستقیم از الگوی یادآوری استریک موجود پیاده‌سازی شد، نه یک مکانیک جدید: ستون opt-in جدید `vocab_reminder_enabled` (مهاجرت `034_vocab_reminder_setting.sql`، پیش‌فرض خاموش — همان وضعیت رضایت مانند هر کلید اعلان دیگر)، کوئری `VocabReminderTokens` (`internal/repository/postgres/notification/repo.go`، کاربرانی که opt-in کرده‌اند و ≥۱ کلمه گذشته از `next_review` دارند)، `Service.SendVocabReminders` (`internal/service/notification/service.go`)، فراخوانی‌شده از همان کار روزانه‌ای که قبلاً یادآوری‌های استریک را می‌فرستد (`runDailyStreakJob`، `cmd/main.go`) نه یک زمان‌بند دوم. موبایل: `vocabReminderEnabled`/`setVocabReminderEnabled` به `NotificationContext.tsx` در کنار کلید استریک موجود اضافه شد، و یک ردیف سوئیچ مطابق در `AppDrawer.tsx` درست زیر ردیف یادآوری استریک.
- پیام یک رشته ثابت واحد است که به هر کاربر سررسید در یک دسته ارسال می‌شود (`push.SendToTokens`)، نه شخصی‌سازی‌شده با تعداد کلمات واقعی هر کاربر — همان دانه‌بندی که `SendStreakReminders` قبلاً استفاده می‌کرد، نه یک قابلیت جدید که اینجا اختراع شود.
- صراحتاً ساخته نشد (بدون تغییر از پیشنهاد): بدون استخراج کلمه NLP/هوش مصنوعی (هنوز دست‌نویس per dialogue)، بدون چت پرسونا "مربی" هوش مصنوعی، بدون تغییر در الگوریتم انتخاب صحنه مأموریت امروز، بدون صفحه آمار/تحلیل واژگان، بدون پیوند `scene_id`/`dialogue_id` روی `leitner_words` (دقیقاً همانطور که علامت‌گذاری شد به تعویق افتاد — این تنها رشته باز است که شخصی‌سازی پیشرفته باید آن را بردارد اگر بخواهد یادآوری‌های آگاه به صحنه داشته باشد).
- تأیید شد: `go build ./...`، `go vet ./...`، و `go test ./...` همه تمیز؛ `npx tsc --noEmit` روی اپ موبایل تمیز. **به صورت زنده تأیید نشد** — هیچ push واقعاً ارسال/دریافت نشد روی یک دستگاه این جلسه (نیاز به یک کلمه سررسید واقعی + یک دستگاه ثبت‌شده FCM واقعی + ساعت زمان‌بندی کار روزانه، که هیچ‌کدام اینجا تنظیم نشد)؛ این plumbing است که با خواندن و کامپایل تأیید شده، نه با مشاهده رسیدن یک اعلان.
- کد: `internal/repository/postgres/migrations/034_vocab_reminder_setting.sql`، `internal/repository/postgres/notification/repo.go`، `internal/service/notification/service.go`، `cmd/main.go`، `app/src/api/notifications.ts`، `app/src/data/NotificationContext.tsx`، `app/src/components/AppDrawer.tsx`، `app/src/data/i18n.tsx`.

**شخصی‌سازی پیشرفته — بخش A: focusSkill ۴ طرفه (۲۰۲۶-۰۹-۱۶)**

بخش A پیشنهاد زیر (ورودی "شخصی‌سازی پیشرفته / مسیر یادگیری تطبیقی" بخش ۳۶) را دقیقاً همانطور که روز قبل محدوده‌بندی شده بود ارسال می‌کند. بخش B (اهداف) بعداً همان روز دنبال شد — ورودی بعدی را ببینید.

- `focusSkill` (`internal/service/mission/get_today.go`) اکنون تلفظ، روانی، واژگان و گرامر را مقایسه می‌کند — همان چهار بعدی که `GetSkillsBreakdown` قبلاً در صفحه پیشرفت نمایش می‌دهد — به جای فقط تلفظ در برابر روانی. از پیاده‌سازی‌های موجود `LeitnerStatsRepository`/`GrammarStatsRepository` (`postgresleitner`، `postgresgrammar`، که قبلاً در `cmd/main.go` برای `progressservice` ساخته شده بودند) از طریق دو رابط جدید روی `missionservice.Repository` (`LeitnerRepository`، `GrammarRepository`) استفاده مجدد می‌کند — بدون کد مخزن جدید، بدون مهاجرت، بدون تغییر موبایل (پاسخ هنوز فقط نام مهارت برنده را به عنوان `focusSkill` برمی‌گرداند، همان فیلد قبلی).
- هر مهارت فقط زمانی وارد مقایسه می‌شود که داده واقعی پشتیبانی کند، همان قرارداد "بدون دقت جعلی" مانند `GetSkillsBreakdown`: تلفظ/روانی هر دو وقتی هر دو دقیقاً ۰ باشند رد می‌شوند (هنوز ضبطی نیست — تنها سیگنال موجود، همان محدودیتی که کد اصلی قبلاً داشت)، واژگان وقتی `wordCount == 0` رد می‌شود، گرامر وقتی `total == 0` رد می‌شود (هنوز رونویسی گفتار آزادی بررسی نشده). اگر هیچ چیز داده نداشته باشد، `focusSkill` همان fallback عمومی `"speaking"` باقی می‌ماند، بدون تغییر از قبل.
- کد: `internal/service/mission/service.go` (رابط‌های جدید `LeitnerRepository`/`GrammarRepository` + فیلدهای `Service`)، `internal/service/mission/get_today.go` (`computeFocusSkill`، استخراج‌شده از `GetTodaysMission`)، `cmd/main.go` (`missionservice.New` اکنون `leitnerRepo`، `grammarRepo` را هم می‌گیرد — هر دو قبلاً وجود داشتند، فقط قبلاً اینجا سیم‌کشی نشده بودند).
- تأیید شد: `go build ./...`، `go vet ./...`، `go test ./...` همه تمیز. **به صورت زنده در برابر داده واقعی تأیید نشد** — هیچ ردیف کاشته‌شده‌ای شاخه‌های جدید واژگان/گرامر را از طریق یک تماس واقعی `GET /v1/mission/today` این جلسه اجرا نکرد؛ مسیر موجود تلفظ/روانی کد بدون تغییر است، قبلاً در جلسات قبلی به صورت زنده تأیید شده بود.
- صراحتاً ساخته نشد در این بخش (بدون تغییر از پیشنهاد): بخش B (اهداف) — به طور جداگانه بعداً همان روز ارسال شد، ورودی بعدی را ببینید.

**شخصی‌سازی پیشرفته — بخش B: هدف اختیاری، فقط سوگیری نرم (۲۰۲۶-۰۹-۱۶، همان روز)**

پیشنهاد بالا را می‌بندد. دو تصمیم محصول باز مستقیماً به کاربر ارائه شد نه اینکه حدس زده شود: (۱) اثر — فیلتر سخت بر اساس دسته صحنه در برابر فقط اولویت نرم ← **فقط اولویت نرم**؛ (۲) نقطه جمع‌آوری — بازگشایی Onboarding در برابر یک درخواست جدید پس از آزمون در برابر یک ردیف اختیاری در Drawer/تنظیمات ← **ردیف اختیاری در Drawer/تنظیمات**، مطابق تصمیم موجود Onboarding (۲۰۲۶-۰۹-۱۴) برای نپرسیدن هدف در اولین باز شدن.

- تنظیم اختیاری جدید `learning_goal`، یکی از `""` (هیچ، پیش‌فرض) / `Travel` / `Work` / `Daily Life` / `Study` — یک مجموعه ثابت، نه متن آزاد، بنابراین برچسب انتخابگر pill همیشه با چیزی معنادار مطابقت دارد. روی `user_notification_settings` ذخیره می‌شود (مهاجرت `035_add_learning_goal.sql`) — از جدول تنظیمات per-user موجود استفاده مجدد شد نه یک جدول جدید؛ `content_source` قبلاً به عنوان یک ترجیح غیر-اعلان آنجا زندگی می‌کند، بنابراین این یک precedent جدید نیست، فقط همان کشوی تنظیمات متفرقه‌ای است که کدبیس قبلاً دارد.
- تطبیق دسته صحنه عمداً شل است، نه دقیق: `Category` متن آزادی است که ادمین برای هر صحنه تایپ می‌کند (بدون طبقه‌بندی ثابت — با خواندن `admin-panel/app/dashboard/SceneCreator.tsx` تأیید شد، که فقط یک autocomplete `<datalist>` ارائه می‌دهد، نه یک enum)، بنابراین `matchesGoal` (`internal/service/mission/get_today.go`) یک تطبیق زیررشته حساس به حروف کوچک/بزرگ در هر دو جهت انجام می‌دهد. این صراحتاً یک "تلنگر بهترین تلاش" است، نه یک تضمین — یک صحنه برچسب‌گذاری‌شده "Airport" با هدف "Travel" مطابقت نمی‌کند مگر اینکه یک رشته شامل دیگری باشد.
- سوگیری واقعاً نرم است، با ساختار تأیید شده نه فقط با ادعا: دو لایه اولویت موجود `pickScene` (ناتمام-در-دشواری-هدف، سپس هر-ناتمام) در *کدام* لایه انتخاب می‌شود بدون تغییر باقی می‌مانند — `pickPreferred` فقط *درون* یک لایه ترتیب را تغییر می‌دهد، ترجیح یک صحنه مطابق هدف اگر یکی در آنجا وجود داشته باشد، و همیشه در غیر این صورت به اولین صحنه لایه برمی‌گردد. هیچ صحنه‌ای هرگز برای عدم تطابق هدف حذف نمی‌شود، و رفتار برای هر کاربر موجود (که `learning_goal` آن پیش‌فرض `""` است) قابل اثبات با قبل این تغییر یکسان است، چون `matchesGoal` روی هدف خالی `false` short-circuit می‌کند.
- همان روز، در حین دست زدن به این handler پیدا و رفع شد: `UpdateNotificationSettings` (`internal/delivery/httpserver/user/notification_settings.go`) هرگز واقعاً `vocab_reminder_enabled` را از بدنه درخواست نمی‌خواند یا به `UpsertSettings` پاس نمی‌داد — اپ موبایل آن را به درستی ارسال می‌کرد (`persist()` در `NotificationContext.tsx`)، اما بک‌اند بی‌صدا آن را در هر ذخیره حذف می‌کرد، یعنی کلید push مربی واژگان (ارسال ۲۰۲۶-۰۹-۱۵) هرگز واقعاً نمی‌توانست روشن شود. چیزی که امروز معرفی نشد؛ یک شکاف باقی‌مانده از آن جلسه، اکنون به عنوان محصول جانبی گسترش همان struct برای `learning_goal` بسته شد.
- کد: مهاجرت `035_add_learning_goal.sql`؛ `internal/repository/postgres/notification/repo.go` (`Settings.LearningGoal`، `GetLearningGoal`، کوئری‌های به‌روزرسانی‌شده `GetSettings`/`UpsertSettings`)؛ `internal/service/mission/service.go` (رابط `GoalRepository`)؛ `internal/service/mission/get_today.go` (`matchesGoal`، `pickPreferred`، `pickScene` اکنون `goal` می‌گیرد)؛ `cmd/main.go` (`missionservice.New` اکنون `notificationRepo` را هم می‌گیرد)؛ `internal/delivery/httpserver/user/notification_settings.go` (لیست مجاز `allowedLearningGoals`، رفع `vocab_reminder_enabled`)؛ موبایل: `app/src/api/notifications.ts` (نوع `LearningGoal`)، `app/src/data/NotificationContext.tsx` (`learningGoal`/`setLearningGoal`)، `app/src/components/AppDrawer.tsx` (ردیف انتخابگر pill)، `app/src/data/i18n.tsx` (کلیدهای جدید).
- تأیید شد: `go build ./...`، `go vet ./...`، `go test ./...`، و `npx tsc --noEmit` روی اپ موبایل همه تمیز. **به صورت زنده/روی دستگاه تأیید نشد** — هیچ رفت و برگشت واقعی ذخیره-هدف ← واکشی-مجدد-مأموریت در برابر یک سرور در حال اجرا یا یک ساخت واقعی اندروید این جلسه اجرا نشد؛ همان هشدار بیشتر کارهای موبایل-لمس لاگ‌شده در بالا.
- صراحتاً ساخته نشد: بدون طبقه‌بندی/enum دسته صحنه (نیاز به دست زدن به `Category` هر صحنه موجود و UI ادمین دارد — خارج از محدوده برای یک تلنگر سوگیری نرم)؛ بدون هدف نمایش/ویرایش در هیچ کجا جز ردیف Drawer؛ بدون ورودی هدف در حین Onboarding (عمداً، مطابق تصمیم بالا).

**گفتار آزاد (۲۰۲۶-۰۹-۱۶، همان روز)**

آخرین شکاف کد فاز ۲ باقی‌مانده (بخش ۲۵) — همه چیز دیگر در آن لیست قبلاً در این جلسه ارسال شده بود. به عنوان یک ویژگی/تب جداگانه ساخته نشد (که چارچوب به درستی تمام جلسه آن را به تعویق انداخته بود)؛ به جای آن، مطابق یک تصمیم صریح محصول، به همان نقطه‌ای که مکالمه با هوش مصنوعی اشغال می‌کند متصل شد، به عنوان یک گزینه دوم و سبک‌تر: یک "توضیح دهید چه اتفاقی افتاد" تک-نوبتی به جای یک مکالمه چند-نوبتی با پاسخ‌های هوش مصنوعی. این آن را به یک موقعیت واقعی که کاربر تازه تمرین کرده گره می‌زند (هشدار خود بخش ۱۶ علیه تبدیل شدن به تمرین مکالمه عمومی بدون زمینه)، و به صفر قابلیت هوش مصنوعی جدید نیاز داشت — این سومین مصرف‌کننده همان سه‌گانه `TranscribeOnly` + `CheckAnswerRelevance` + `CheckGrammar` است که آیتم‌های گفتار آزاد ارزیابی قبلاً استفاده می‌کنند، بدون تغییر.

- جریان: پس از تمام کردن همه دیالوگ‌های یک صحنه، Alert تکمیل در `SceneScreen` (`handleFinishLesson`) اکنون "توضیح دهید چه اتفاقی افتاد" را در کنار گزینه موجود "مکالمه داشته باشید" ارائه می‌دهد. متن درخواست از عنوان خود صحنه تولید می‌شود (`"Describe, in your own words, what happened in this situation: {title}"`)، نه محتوای نوشته‌شده توسط ادمین — همان الگوی "از متادیتای صحنه استنباط کن" که مکالمه با هوش مصنوعی قبلاً برای پرسونای شخصیت خود استفاده می‌کند.
- برش حداقلی جدید، عمداً روی `aiconversationservice` لایه‌بندی نشد با وجود شکل مشابه (آن سرویس وضعیت جلسه مکالمه را حمل می‌کند — وضعیت، تعداد نوبت، تاریخچه — که هیچ‌کدام برای یک تلاش تک-شات لازم نیست؛ اجبار آن به داخل به معنای فیلدهای nullable/بی‌استفاده روی هر ردیف بود). بک‌اند: `internal/service/freespeech` (`Analyze` — رونویسی، سپس ارتباط + گرامر همزمان، همان الگوی همزمانی `evaluateFreeSpeech`)، `internal/repository/postgres/freespeech` (لاگ حسابرسی فقط-درج، بدون مسیر خواندن — همان نقش غیر-UI-facing که `assessment_submission_items` دارد)، `internal/delivery/httpserver/freespeech` (`POST /v1/free-speech/analyze`، multipart `scene_id` + `audio`، دقیقاً شکل handler `POST /v1/ai-conversation/turn` را منعکس می‌کند). مهاجرت `036_create_free_speech_attempts.sql`.
- بدون امتیاز عددی (قانون "بدون دقت جعلی" بخش ۷ — گفتار آزاد هرگز در هیچ جای دیگر این کدبیس در برابر مرجع امتیاز نگرفت)، بدون مفهوم مکالمه/جلسه، بدون UI مرور تاریخچه (مطابق با هر تصمیم دیگر "فقط برای حسابرسی لاگ شده" این جلسه).
- موبایل: `app/src/screens/FreeSpeech` (یک بار ضبط ← تحلیل ← کارت نتیجه: رونویسی + نشان ارتباط + نکته گرامر، با استفاده مجدد از قرارداد دقیق آیکون/رنگ/برچسب `relevanceMeta` در `PlacementTestResultScreen` و کلید `grammarTipLabel` که قبلاً توسط ارزیابی و مکالمه با هوش مصنوعی استفاده می‌شد — بدون معرفی زبان بصری جدید)، `app/src/api/freespeech.ts`، ثبت‌شده به عنوان یک مسیر مخفی-نوار-تب در `AppNavigator.tsx` (همان الگوی `AIConversation`)، پارامتر ناوبری جدید `sceneTitle` مستقیماً از صحنه قبلاً-بارگذاری‌شده `SceneScreen` پاس داده می‌شود (بدون رفت و برگشت اضافی برای واکشی مجدد).
- تأیید شد: `go build ./...`، `go vet ./...`، `go test ./...`، `npx tsc --noEmit` همه تمیز. **به صورت زنده/روی دستگاه تأیید نشد** — همان هشدار هر ویژگی هوش مصنوعی موبایل-لمس این جلسه (این sandbox شبکه خروجی به یک بک‌اند رونویسی/هوش مصنوعی واقعی ندارد، و هیچ ساخت واقعی اندروید اجرا نشد).
- صراحتاً ساخته نشد: بدون نقطه ورود مستقل خارج از تکمیل صحنه (محدوده v1 عمدی — تصمیم محصول بالا را ببینید؛ فقط اگر داده استفاده درخواست کند دوباره بررسی شود)، بدون مکالمه/پاسخ از سمت هوش مصنوعی، بدون نمای تاریخچه پایدار.

## توصیه‌شده بعدی (مطابق چارچوب تصمیم، بخش ۳۱)

**رشد کتابخانه سناریو** (بخش ۲۳، مورد ۴): به گفته کاربر (۲۰۲۶-۰۹-۱۴)، حدود ۲۰ صحنه اکنون مستقیماً روی سرور production نوشته شده‌اند (خارج از این جلسه، از اینجا تأیید نشده — شمارش ۶ صحنه بالا فقط DB dev محلی است و قبلاً شناخته شده بود که یک مجموعه داده جداگانه و کوچک‌تر است). این به طور معناداری به هدف ۳۰-۵۰ نزدیک‌تر از آخرین بررسی است، و اکنون تنها شکاف فاز ۲ باقی‌مانده از هر نوعی است (همه موارد کد فاز ۲ تا امروز ارسال شده‌اند) — هنوز ارزش یک شمارش واقعی را دارد دفعه بعد که این مورد مطرح شود، اما دیگر به عنوان یک شکاف دست‌نخورده در نظر گرفته نمی‌شود.

---

# ۳۶. پیشنهادات طراحی ویژگی (در انتظار — هنوز ساخته نشده)

اسناد طراحی *قبل از* پیاده‌سازی نوشته می‌شوند، بنابراین محدوده ابتدا روی کاغذ توافق می‌شود (مطابق بخش ۳۳ "مشکل را توضیح دهید، ساده‌ترین راه‌حل صحیح را پیشنهاد دهید" — و مطابق چارچوب تصمیم بخش ۳۱، که صراحتاً در زیر اعمال شده نه اینکه رد شود). ورودی‌ها به بخش ۳۵ منتقل می‌شوند وقتی واقعاً ارسال شوند، با یک یادداشت واقعی "صراحتاً ساخته نشد" که در صورت تغییر محدوده در حین پیاده‌سازی جایگزین مورد پیشنهادی اینجا می‌شود.

(مربی واژگان ۲۰۲۶-۰۹-۱۵ اینجا پیشنهاد و همان روز ارسال شد — ورودی و آنچه بین پیشنهاد و پیاده‌سازی تغییر کرد را در بخش ۳۵ "لاگ ارسال‌شده" ببینید.)

## شخصی‌سازی پیشرفته / مسیر یادگیری تطبیقی (پیشنهاد ۲۰۲۶-۰۹-۱۵، هر دو بخش ارسال ۲۰۲۶-۰۹-۱۶ — بخش ۳۵ را ببینید)

خطوط "شخصی‌سازی پیشرفته" و "مسیر یادگیری تطبیقی" فاز ۲ (بخش ۲۵) را با هم پر می‌کند — آنها وقتی کد واقعاً خوانده شد معلوم شد همان یک شکاف هستند، نه دو ویژگی جداگانه. بر اساس یک خوانش تازه از `internal/service/mission/get_today.go`، نه فرض.

**آنچه مأموریت امروز واقعاً امروز انجام می‌دهد (با خواندن کد تأیید شده):**
۱. صحنه‌ها را به منتشرشده + بازشده فیلتر می‌کند (`get_today.go:56-69`).
۲. `SpeakingProfile.Level` را می‌خواند ← به دشواری هدف نقشه می‌کند (`:74-80`، `difficultyForLevel` در `:24-33`).
۳. یک صحنه را از طریق یک قاعده ۳ لایه انتخاب می‌کند (`pickScene`، `:144-175`): اولین صحنه هنوز-تکمیل-نشده در دشواری هدف ← در غیر این صورت اولین صحنه هنوز-تکمیل-نشده در هر دشواری ← در غیر این صورت صحنه دشواری هدف که طولانی‌ترین زمان پیش تکمیل شده ← در غیر این صورت فقط `candidates[0]`.
۴. یک برچسب `focusSkill` محاسبه می‌کند (`:103-116`) با مقایسه فقط میانگین‌های **تلفظ در برابر روانی** (`SkillsRepository.AvgScoresByUser`) — هر کدام کمتر باشد به عنوان تمرکز نام می‌گیرد.

این کل سطح شخصی‌سازی است. مطابق بخش ۱۰ مشخصات، مجموعه سیگنال مورد نظر سطح + اهداف + مهارت‌های ضعیف + عملکرد قبلی + صحنه‌های تکمیل‌شده + تاریخچه واژگان است — کد امروز فقط واقعاً ۳ مورد از این ۶ را استفاده می‌کند (سطح، تکمیل، و یک برش ۲ از ۴ از مهارت‌های ضعیف).

**دو شکاف واقعاً متفاوت که زیر یک خط فاز ۲ پنهان شده‌اند — تأیید شده، نه فرض شده:**

**(A) `focusSkill` واژگان و گرامر را نادیده می‌گیرد حتی اگر هر دو قبلاً در جای دیگر محاسبه شوند.** `internal/service/progress/get_skills_breakdown.go:24-45` قبلاً درصدهای واقعی تلفظ/روانی/واژگان/گرامر را برای صفحه پیشرفت تولید می‌کند (واژگان از `leitnerRepo.AvgLevelByUser`، گرامر از `grammarRepo.CleanRate` — همان زیرساخت مربی گرامر که ۲۰۲۶-۰۹-۱۴ ارسال شد). رابط‌های `Repository` در `missionservice` (`service.go:16-34`) به سادگی مخازن Leitner یا Grammar را شامل نمی‌شوند — هیچ‌کس آنها را سیم‌کشی نکرده، نه به دلیل هر انتخاب طراحی عمدی. این استفاده مجدد خالص است، بدون داده جدید، بدون سطح محصول جدید، بدون نیاز به تصمیم کاربر.

**(B) "اهداف" در هیچ کجا وجود ندارند — نه یک شکاف کد، یک شکاف محصول.** کل مدل دامنه، هر مهاجرت، و `OnboardingScreens.tsx` جستجو شد: هیچ فیلد هدف/علاقه روی هیچ جدولی وجود ندارد، حتی به صورت بی‌استفاده روی `speaking_profiles` (مهاجرت `031_create_assessment_tables.sql:28-39`، که فقط خروجی آزمون تعیین سطح است — سطح/امتیازات/مهرهای زمانی، هیچ چیز دیگر). این مستقیماً به تصمیمی متصل می‌شود که قبلاً در سابقه است: Onboarding (ارسال ۲۰۲۶-۰۹-۱۴) صراحتاً اضافه کردن یک اسلاید انتخاب هدف را رد کرد، با استدلال "هیچ چیز در منطق انتخاب مأموریت هنوز هدفی را نمی‌خواند... جمع‌آوری یکی اکنون UI بی‌استفاده خواهد بود." ساختن نیمه اهداف شخصی‌سازی پیشرفته دقیقاً همان چیزی است که آن را un-block می‌کند — اما این به معنای بازگشایی یک تصمیم UI است که عمداً به تعویق افتاده بود، نه فقط نوشتن کد بک‌اند.

**چارچوب تصمیم (بخش ۳۱) صادقانه اعمال شد، برای هر شکاف جداگانه:**
- **(A) واژگان/گرامر در focusSkill:** شخصی‌سازی را بهبود می‌بخشد (س۴) و تقریباً هیچ هزینه‌ای ندارد (س۸: واقعاً نمی‌توان برای دلیل خوبی به تعویق انداخت — داده قبلاً-محاسبه‌شده بی‌استفاده است). MVP-لازم نیست (س۷)، به درستی فاز ۲، اما این نیمه "فردا قابل ارسال" است.
- **(B) اهداف:** ارتباط دنیای واقعی را بهبود می‌بخشد (س۲) و شخصی‌سازی (س۴) *اگر* خوب ساخته شود، اما نیاز به یک تصمیم واقعی محصول دارد (کجا جمع‌آوری شود، چند گزینه، آیا فیلتر *دسته* صحنه کند نه فقط دشواری) قبل از هر کد — ساختن آن با عجله خطر همان تله "UI بی‌استفاده" را دارد که Onboarding قبلاً یک بار از آن اجتناب کرد.

**محدوده v1 پیشنهادی برای فردا (۲۰۲۶-۰۹-۱۶) — فقط بخش A:**
- افزودن `LeitnerRepository` (`AvgLevelByUser`) و `GrammarRepository` (`CleanRate`) به `missionservice.Repository` (یا تزریق خود `progressservice` و استفاده مستقیم از `GetSkillsBreakdown` — تصمیم "ساده‌ترین راه‌حل صحیح" که باید در حین پیاده‌سازی گرفته شود، نه اینجا).
- گسترش `focusSkill` (`get_today.go:103-116`) از یک مقایسه تلفظ-در-برابر-روانی به یک انتخاب واقعی ۴ طرفه ضعیف‌ترین مهارت در تلفظ/روانی/واژگان/گرامر.
- بدون تغییر انتخاب صحنه، بدون مهاجرت، بدون تغییر موبایل فراتر از هر متن برچسبی که `focusSkill` قبلاً رندر می‌کند — این یک رفع دقت کاملاً بک‌اند برای سیگنالی است که قبلاً نمایش داده می‌شود.

**صراحتاً فردا ساخته نمی‌شود (بخش B، به تعویق افتاده تا یک تصمیم محصول گرفته شود):**
- بدون فیلد هدف، بدون UI Onboarding/پروفایل برای آن، بدون فیلتر دسته صحنه بر اساس هدف. این نیاز به تصمیم کاربر دارد، قبل از کد: آیا یک هدف *دسته* صحنه را فیلتر می‌کند (مثلاً صحنه‌های "Travel") یا فقط *دشواری/ترتیب* را سوگیری می‌دهد، و اپ کجا آن را می‌پرسد (یک صفحه تنظیمات، چون Onboarding قبلاً عمداً گفت نه به پرسیدن در اولین باز شدن)؟