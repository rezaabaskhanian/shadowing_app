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

* AI Conversation
* Free Speech
* Speech Analyzer
* Grammar Feedback
* Vocabulary Coach
* Advanced Personalization
* Adaptive Learning Path
* More scenarios
* More sophisticated speaking reports

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

## Next recommended (per the Decision Framework, section 31)

**Personalized "Today's Mission"** — MVP item 15 in section 24, spec section 10.

1. *User problem:* the app currently has no personalized starting point — every user sees the same scene list regardless of level or weak skill, and there's no daily "what should I practice right now" answer.
2. *Why necessary:* this is the direct, obvious consumer of the Speaking Profile that just shipped. Without it, Level/SpeakingProfile data is measured but never used — pure vanity data.
3. *MVP or Phase 2/3:* MVP (explicitly listed, section 24 item 15).
4. *Core Loop fit:* yes — it's the "which Scene/practice do I route the user into" decision at the very top of the loop (section 28: SPEAKING PROFILE → Weak Skills + Goals → SCENARIO ENGINE).
5. *Advantage vs ELSA:* not a differentiator by itself (ELSA does this too) — it's necessary parity, and the real payoff is that LingoFlow's version routes into a *visual Scene*, not an abstract lesson, so the differentiation stays intact.

Closely related alternative if this is deprioritized: **Progress over time** (section 21) — the app currently shows only current totals (streak, XP, skills breakdown), not week-over-week per-skill trend. Lower urgency than Today's Mission because it doesn't unlock anything else downstream.

## Explicitly not next (per the same framework)

- **Scenario Library growth** (section 23, target 30-50 scenes) — real gap (only a handful of scenes exist), but it's a content task, not an engineering one; can proceed in parallel with any of the above without blocking them.
- **AI Conversation, Free Speech (as a standalone feature), Speech Analyzer, Grammar curriculum** — still correctly Phase 2 per section 25; nothing that shipped changes that.
