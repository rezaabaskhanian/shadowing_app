# LingoFlow handoff (2026-10-28)

Notes for whoever continues this repo (another AI agent or a developer). Read this first, then `PRODUCT_SPECـCHAT_GPT.md`.

## Project shape
- `internal/`, `cmd/main.go`: Go backend (Echo + Postgres). Migrations live in `internal/repository/postgres/migrations` and run on startup (sql-migrate). The latest is `078_songs.sql`.
- `app/`: React Native 0.86 Android app (new architecture, Reanimated 4, TrackPlayer for audio, nitro-sound for recording).
- `admin-panel/`: Next.js admin panel.
- `mcp-server/`: MCP server (`lingoflow-mcp`) that wraps the admin API for content work. It needs the admin credentials in its env. Never put those in files.

## Rules the owner set
- Reply to the owner in Persian. Keep code and commands as they are.
- Do not run Docker or a database locally. The owner deploys on the VPS one service at a time:
  `docker compose -f docker-compose.prod.yaml up -d --build --no-deps backend` (then `admin` separately).
  The VPS has about 1.9 GB of RAM, so never build several services together.
- Commit only when the owner asks. Never commit `app/android/gradle.properties`. Add files by name, not with `git add -A`.
- Never read, store or ask for passwords, API keys or tokens.
- Content created through MCP stays a draft; the owner publishes in the panel.
- On published scenes, use `fix_scene_text` only. `update_scene` and `edit_scene_lines` rebuild dialogue ids and wipe user progress.
- Scene images: Iranian characters, women in hijab and modest dress, no text in images.
- Content level target: at least 95% known words for the level (CEFR).

## Not committed yet (as of this note)
Everything below is in the working tree and passes `tsc`, `eslint` (no new errors) and `go build`. None of it has been tested on a phone yet.
- Songs: the mix endpoint `POST /v1/songs/:id/mix` (`internal/service/song/mix.go`), takes saved on the device (`app/src/services/songTakes.ts`), the "My recordings" screen (`SongTakesScreen`), the seekable player in `SongScreen`.
- Dictation section: `DictationListScreen` (featured podcasts, linked from the drawer) and `PodcastDictationScreen` (the whole podcast plays without text; the text appears only on "Check").
- UX review fixes for Home (grouped carousels in `components/HomeGroup.tsx`, small text links instead of side cards), Scenes tab (FlatList, one filter row), Leitner (show answer before rating, ConfirmModal for delete), Podcast list and player, Profile and Settings, Progress (continue button, chart colours), login (keyboard-safe scroll, sign-up as a text link), placement intro, goal map (pin markers, auto-hiding hint), curriculum map (windowed rendering, one "current" node).
- `AndroidManifest.xml`: `WRITE_EXTERNAL_STORAGE` (maxSdk 28) and `requestLegacyExternalStorage` for saving song takes to `Music/LingoFlow`. This needs a native rebuild (`./gradlew clean`).
- `app/package.json`: the Reanimated flag `ANDROID_SYNCHRONOUSLY_UPDATE_UI_PROPS` for smoother map gestures. It also needs a native rebuild.

## Content state on the server
- Goal maps are saved for all four goals (travel is tiled; study, migration and work use 1376×768 images without tiles).
- Songs: "What a Wonderful World" (published) and "Stand by Me" (draft). Both have instrumentals.
- Instrumentals are made locally with Demucs: `python -m demucs --two-stems=vocals -n htdemucs --mp3`. The scratch virtualenv is temporary, so reinstall it if it is gone.
- Song files live in `~/Desktop/lingflow/document_songs/<level>/<song>/`: the mp3 plus a timed `.lrc` (sometimes saved inside an `.rtf`; convert it with `textutil -convert txt`).

## Open items
- Deploy the backend (song mix endpoint) and rebuild the APK. Then test on a real phone: sing-along sync, "Save to phone", dictation, goal maps.
- The goal-map image for travel has a green diagonal line that is part of the picture, not the app.
- A profile edit feature does not exist (no backend). The owner was asked whether to build it.
- Decide what the centre button of the bottom bar should do (currently Home).
- Optional: cover images for the songs, and more songs per level (the list of 10 songs per level is in the chat history).
