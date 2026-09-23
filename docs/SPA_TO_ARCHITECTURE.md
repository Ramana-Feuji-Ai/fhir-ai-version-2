# SPA → Angular components + API endpoints

Source: `FHI_FHIR_Learning_SPA 2.html` + `fhi-fhir-learning.css`

Content inventory from seed: **17 phases**, **9 tracks**, **301 topics**, **1204 slides**.

## Route map

| SPA | Angular |
|-----|---------|
| `#/` (`renderHome`) | `/` → `HomePage` |
| `#/phase/:id` (`renderPhase`) | `/phase/:id` → `PhasePage` |
| sticky header / mobile drawer | `HeaderComponent` |
| footer | `FooterComponent` |

## Angular component split

```
app/
  layout/
    header.component.ts          brand, nav, avatar, mobile menu
    footer.component.ts
  features/
    home/home.page.ts            hero + pathway + curriculum catalog
    phase/phase.page.ts          phase hero, progress, section tree
    slides/slide-deck.component  SCORM chrome, slide pane, rail, dots
  shared/
    phase-card.component.ts      curriculum grid card
  core/
    curriculum.api.ts            HTTP client for /api/v1
    models.ts
```

### SPA function → component

| SPA | Component / service |
|-----|---------------------|
| `renderHome` / pathway / features | `HomePage` |
| `phaseCards` / `filterCards` / `selectTrack` | `HomePage` + `PhaseCardComponent` |
| `renderPhase` / `treeHtml` | `PhasePage` |
| `keys` / `toggleTopic` progress | `CurriculumApi.setTopicProgress` + DB |
| `slideDeckHtml` / `renderSlide` / `goSlide` / `shiftSlide` | `SlideDeckComponent` |
| `enterScormFullscreen` / `exitScormFullscreen` | TODO (next iteration) |
| `openResource` / `answerQuiz` | TODO resource modal component |
| `localStorage fhi-phase-{id}` | `topic_progress` table via API |

## REST API (`/api/v1`)

| Method | Path | SPA equivalent |
|--------|------|----------------|
| GET | `/curriculum/summary` | home stats + track chips |
| GET | `/tracks` | track board |
| GET | `/phases?track=&q=` | `filterCards` / `phaseCards` |
| GET | `/phases/{id}` | `renderPhase` tree (no slide HTML) |
| GET | `/topics/{id}` | open topic → slides + keyPoints + examTip |
| GET | `/me/progress/phases/{phaseId}` | `keys(id)` |
| PUT | `/me/progress/topics/{topicId}` `{completed}` | `toggleTopic` |

Demo learner UUID (avatar **MR**): `11111111-1111-1111-1111-111111111111`

## Data model (PostgreSQL)

`phase` → `section` → `topic` → (`slide`, `topic_key_point`)  
`phase` → (`phase_spec`, `phase_example`, `phase_lab`, `quiz_question` → `quiz_choice`)  
`learner` → `topic_progress`  
`topic.legacy_key` keeps SPA keys like `0-2` for migration.

## Look & feel

Ported stylesheet: `apps/web/src/assets/styles/fhi-fhir-learning.css`  
Fonts: IBM Plex Sans / Serif (same as SPA).

## Suggested next tasks

1. Resource modal + quiz UI (`openResource`)
2. Fullscreen SCORM mode + keyboard nav
3. Migrate browser `localStorage` progress into API on first login
4. Real auth (replace demo learner)
5. Admin content editor for phases/topics/slides
