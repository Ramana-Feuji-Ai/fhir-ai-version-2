# FHIR Learning Academy — session handoff

Purpose of this file: if the current Claude Code session expires or resets, paste/reference this file at the start of a new session (or just say "read docs/HANDOFF.md") to resume with full context. Last updated: 2026-09-08.

## What this project is

"FHIR Learning Academy" — an Angular 21 + Spring Boot 3.4 + Postgres app teaching the HL7 FHIR healthcare interoperability standard. 17 phases, 9 tracks, 301 topics, 1,204 slides.

- Repo root: `c:\Users\venkata.mahendrakar\Downloads\final2\fhir-guide`
- Frontend: `apps/web` (Angular 21, `npm start` → port 43211)
- Backend: `apps/api` (Spring Boot, port 18081)
- Login: `mr@fhi.local` / `ChangeMe123!`

## Environment gotchas (read this before doing anything)

- **No Maven / no mvnw wrapper** in this environment — the API could not be started or compiled from this CLI. It needs to be started by hand (e.g. IntelliJ's Spring Boot run configuration — `.idea` exists in `apps/api`).
- **Database name/schema is NOT what the README says.** Real connection: database `fhirld` (not `fhir_learning`), schema `academy` (not `public`), per `application.yml`. Tables: `phase`, `section`, `topic`, `topic_key_point`, `slide`, `phase_spec`, `phase_example`, `phase_lab`, `quiz_question`, `quiz_choice`, `learner`, `topic_progress`. (The `public` schema of `fhirld` has an unrelated leftover legacy-ld table set — ignore it.)
- Postgres runs as a native Windows service, not Docker, and stays up independently of the API/frontend.
- Topic ids are stable across restarts (`ddl-auto: update`, not `create-drop`) — safe to hardcode.
- Python + `edge-tts` were installed mid-session (weren't present initially).

### Topic id ranges per phase
| Phase | Title | Ids |
|---|---|---|
| 0 | Orientation and readiness assessment | 1-15 |
| 1 | Healthcare interoperability foundations | 16-31 |
| 2 | FHIR specification navigation and versioning | 32-47 |
| 3 | FHIR resource model and structure | 48-70 |
| 4 | Essential administrative resources | 71-85 |
| 5 | Clinical resources | 86-101 |
| 6 | Diagnostic resources | 102-115 |
| 7 | Medication and immunization resources | 116-128 |
| 8 | Financial and payer resources | 129-144 |
| 9 | FHIR REST API and exchange mechanisms | 145-169 |
| 10 | Profiling and conformance | 170-191 |
| 11 | Terminology | 192-209 |
| 12 | Security, privacy, and consent | 210-228 |
| 13 | Validation and troubleshooting | 229-248 |
| 14 | Testing and implementation tools | 249-262 |
| 15 | Practical certification laboratories (8 labs × 3 steps) | 263-286 |
| 16 | Certification assessment program | 287-301 |

## Completed work (this session)

### 1. Narration rollout — done, all 301 topics
Replaced the old system (13 shared "lessons" keyword-matched onto topics, most topics got none) with deterministic per-topic narration:
- `apps/web/src/assets/topic-narration.json` — one entry per topic id, `{topicTitle, conversation: [{speaker, text, audioPath}]}`.
- `ConversationLibrary.forTopic(topicId)` (`apps/web/src/app/core/conversation.library.ts`) — direct lookup, replaced the old fuzzy `match()`.
- `mock-data-enhancer.ts` updated to call `forTopic(topic.id)`.
- All 1,204 audio clips generated via `apps/web/scripts/generate_topic_narration.py` (free Microsoft edge-tts, voices `en-US-JennyNeural`/`en-US-AndrewNeural`), written to `apps/web/public/assets/audio/` (the only path the live app serves — check `angular.json`'s asset glob). Script supports `--ids "1-15"` / `"32-47,50"` to scope a run, is safe to re-run (skips existing files), and retries/continues past the free TTS endpoint's occasional flakiness instead of crashing the whole batch.
- Content authored by parallel subagents grounded in each topic's real summary/keyPoints/examTip (or, where that data was itself wrong — see below — from real FHIR R4 knowledge instead).

### 2. Seed-data content-mismatch bug — found and fixed, 121 topics
A prior content audit (`docs/content-accuracy-review.md`) found some topics' `summary`/`keyPoints`/`examTip`/slide text was copy-pasted from an unrelated topic (e.g. a topic titled "Bulk Data" had generic Implementation-Guide filler with zero mention of `$export`/NDJSON). Queried the DB directly for the two known boilerplate signatures ("Study this concept within...", "Hands-on practice for...") to find the **exact, complete** set: **121 topics** across phases 4-16 (not just the handful originally sampled).
- Rewrote all 121 via 7 parallel subagents (real FHIR R4 content, matching the style of the app's already-good bespoke Phases 0-3).
- Applied directly to the **live database** (topic.summary/exam_tip/detail_html, topic_key_point rows, slide rows) in one transaction — necessary because `ContentSeedRunner` only seeds when the `phase` table is empty (`phaseRepository.count() > 0` → skip), so editing the JSON alone would have had zero effect on the running app.
- Also applied to both copies of the seed file (`data/phases.spa.json` and `apps/api/src/main/resources/db/seed/phases.spa.json`, kept byte-identical) so a future fresh reseed doesn't reintroduce the bug.
- Verified: 0 remaining boilerplate-signature matches anywhere in the DB or JSON afterward.

### 3. UI bugs fixed (unrelated to the above, found along the way)
- **Fullscreen slide-deck Prev/Next unreachable**: the floating AI-assistant widget and the fullscreen deck both had `z-index: 80`; the assistant (rendered later in the DOM) visually covered the deck's nav buttons. Fixed: fullscreen deck bumped to `z-index: 200` (`fhi-fhir-learning.css`).
- **"Video" badge disappears after marking a topic complete**: `hasVideo`/`hasInteractive` are frontend-only computed flags; `phase.page.ts`'s `refreshPhase()` was re-fetching via the raw API (`this.api.phase(id)`) instead of `this.enhancer.enhancePhase(id)`, silently dropping those flags. Fixed by routing through the enhancer.
- Added Previous+Next buttons and white text to the fullscreen "end of conversation" CTA box (`slide-deck.component.ts`); gated that CTA to fullscreen-only (it was redundant with the normal bottom nav bar outside fullscreen).

### 4. "Ask anything" AI assistant — implemented, working
Real feature now, not the old stub. **No RAG, no vector database** — the app always already knows which topic/phase you're viewing, so it's direct context injection, not search-then-generate.
- **Backend**: `POST /api/v1/assistant/ask` (`AssistantController.java` → `AssistantService.java`). Fetches the real topic (full content) or phase (overview + topic titles/summaries) from the DB, builds one prompt, calls **Groq** (`openai/gpt-oss-20b` model, OpenAI-compatible chat completions API) — chosen over Anthropic/Claude per explicit user request (free tier). Config in `application.yml` under `fhir.groq.*`, key read from `GROQ_API_KEY` env var.
  - ⚠️ **Open issue**: at last check, the user had temporarily hardcoded their real Groq key directly into `application.yml` as the env var's default value (`${GROQ_API_KEY:gsk_...}`), which is git-tracked — flagged repeatedly as a leak risk if committed, not yet confirmed resolved. Worth checking/fixing on resume.
- **Frontend**: `assistant-context.service.ts` (new) — shared signal tracking "what topic/phase is on screen," updated by `phase.page.ts` on load/topic-open/topic-close/destroy. `assistant.api.ts` (new) — calls the backend. `ai-assistant.component.ts` — wired up for real, plus:
  - Renders Markdown replies (tables, bold, lists) via the `marked` npm package — had to move the CSS for `.markdown table/th/td/etc.` into the **global** `styles.css` because content injected via `[innerHTML]` is invisible to Angular's component-scoped style encapsulation (styles defined in a component's own `styles: []` never apply to dynamically-injected HTML).
  - Panel widened 380px → 560px (height 520px → 600px) so tables fit without scrolling.
  - **Fixed a real bug**: the assistant component is mounted once at the app root (`app.component.ts`, outside the router) and never gets destroyed on logout — so its `open`/`messages` state persisted across a logout/login cycle, making the panel reappear instantly (with old chat history) right after a fresh login. Fixed with an `effect()` in the constructor that resets `open` and `messages` whenever `auth.isLoggedIn()` becomes false.

## Known follow-ups / not yet done

1. **Groq API key security** — confirm it's back to a real env var, not hardcoded in `application.yml` (see above).
2. **No live fact-check of the bulk-authored content against hl7.org/fhir.** The original `docs/content-accuracy-review.md` audit did real `WebFetch` verification against hl7.org/fhir for a ~90-topic sample + all narration. The subsequent large-scale work (narration for 285 topics, the 121-topic seed-data rewrite) was authored by subagents from trained FHIR knowledge, **not individually re-verified live**. Offered to run a proper fact-check pass on this newer content; not done yet.
3. **Backend Java changes were never compiled** — no Maven available in this dev environment. Reviewed carefully by hand and type-consistent with the existing codebase, but worth an actual `mvn compile`/IDE build check on resume, especially the new `AssistantService.java`/`AssistantController.java`/`AssistantDtos.java` and the `FhirProperties.Groq` addition.
4. Markdown rendering only covers the AI assistant's chat bubbles — nowhere else in the app.

## Reference docs already in the repo
- `docs/content-accuracy-review.md` — the original FHIR-spec accuracy audit (topics + old narration vs. hl7.org/fhir).
- `docs/SPA_TO_ARCHITECTURE.md` — SPA → Angular/API architecture mapping.
- `README.md` — has some stale info (db name); trust this file and `application.yml` over it for connection details.
