# Content accuracy review: narration + topic text vs. the FHIR specification

Audit date: 2026-09-02
Scope: targeted audit (not exhaustive) — full narration script (79/79 lines), template-pattern extraction across all 301 topics, plus a hand-picked representative sample (~60 topics across all 17 phases).
Sources checked against: **hl7.org/fhir** (the normative FHIR R4 specification) and the SMART App Launch spec. Note: `fhir.org` itself is *not* the specification — it's a community landing page (IG registry, app registry, connectathons) that links out to `hl7.org/fhir` for the actual standard. The narration script says this explicitly and correctly.

## Executive summary

- **Narration (13 lessons / 79 lines): clean.** No factually wrong or misleading claims found. Every checkable technical statement — REST verbs, resource semantics, SMART launch flows, terminology operations, Bundle types, security constructs — verified against hl7.org/fhir. Two lines use slightly dated-but-still-valid phrasing (noted below), nothing needs correcting.
- **Topic text (301 topics): accurate where it says something, but a large share says almost nothing, and a smaller but real subset says the *wrong* thing.** ~224 of 301 topics (74%) are assembled from a pool of ~20 reusable boilerplate blocks rather than bespoke writing. Where checked, none of the boilerplate's generic FHIR claims are technically wrong — the actual defect is that assignment isn't subject-matched, so at least **8 topics carry content about a different subject than their own title** (e.g. the "Bulk Data" topic contains a generic IG paragraph with zero mention of `$export`/NDJSON/async job status; a Da Vinci payer-IG topic gets the SMART/OAuth boilerplate instead). This is the one class of finding that constitutes a real accuracy problem, not just thin content.
- Phases 0–3 (foundations, spec versioning, resource model) are almost entirely bespoke and were the highest-quality, fully accurate content found.

**Recommendation:** don't run a full 301-topic audit — the sample was large enough to establish the pattern (accurate-when-present, template-pool-driven thinness, and a template-mismatch bug). Instead, fix the mismatch bug at its source (see "Root cause" below) and write real content for the specific named-but-empty topics listed in §2.

---

## 1. Narration script findings (all 13 lessons, full text)

Source: `apps/web/src/assets/ld-conversations.json`

Every lesson (What is FHIR, Why FHIR exists, Resources, REST & the four paradigms, Formats/narrative/extensions, Terminology, Security/SMART, Implementation Guides, Clinical resources, Medications/immunizations, Workflow/financial, Testing/community, Getting started) was read in full and checked line by line. Representative confirmations:

- FHIR = Fast Healthcare Interoperability Resources; evolutionary path from v2/v3/RIM/CDA — **accurate** (hl7.org/fhir/summary.html).
- REST verb mapping (GET→read/search/vread/history, POST→create, PUT→update, PATCH→partial update, DELETE→delete) — **accurate**, matches http.html exactly.
- SMART App Launch: OAuth2, EHR launch vs. standalone launch, `.well-known/smart-configuration` discovery, backend services with client assertions — **accurate**, matches the SMART App Launch spec.
- Terminology: CodeSystem/ValueSet/ConceptMap definitions, `$expand`/`$validate-code`/`$translate` operations, required/extensible/preferred/example binding strengths — **accurate**.
- Narrative-as-safe-fallback ("safe to render only the narrative") — **accurate**, direct quote match to narrative.html.
- Modifier-extension "must understand or refuse" framing — **accurate**, matches extensibility.html's SHALL NOT clause.

**Two minor notes (not errors):**
1. Lesson 7's SMART scope example `patient/Observation.read` is SMART v1-style syntax. It's still valid and supported (servers advertise it via the `permission-v1` capability), just not the newer `.rs`/`.cud`/`.cruds` v2 syntax — fine as a teaching example.
2. Lesson 4's "four primary exchange paradigms" (REST/Documents/Messages/Services) is the classic, widely-taught framing; the current spec's exchange-module page formally lists six (adds Database/Persistent Storage and Subscriptions). The word "primary" adequately hedges this.

No corrections needed to the narration content.

---

## 2. Topic content: the template-mismatch bug (highest-priority finding)

`data/phases.spa.json` (301 topics) is built from a small pool of reusable text blocks rather than fully bespoke writing per topic, and in several places the pool is applied **without matching the block's subject to the topic's actual title**. The generic blocks themselves aren't wrong (verified below) — but applying the wrong block to a topic makes that topic's content actively incorrect for what it claims to teach.

Confirmed instances:

| Topic (title in the syllabus) | What it should cover | What it actually contains |
|---|---|---|
| **Bulk Data** (Phase 9) | `$export`, NDJSON, System/Group/Patient-level export, async job polling, `Prefer: respond-async` | Generic "what is an Implementation Guide" paragraph. Zero Bulk Data–specific content anywhere in the 301-topic corpus. |
| **Bulk Data Access**, **US Core**, **CARIN Blue Button** (Phase 10, "US Implementation Guides") | IG-specific profiles/constraints for each named guide | The exact same generic IG paragraph, verbatim, on all four topics |
| **Da Vinci PDex, Prior Authorization, CRD, DTR, Risk Adjustment, Clinical Data Exchange** (Phase 10) | Payer-provider data exchange, CDS Hooks (CRD), Questionnaire-based DTR, PDex | The "SMART and OAuth" launch-flow boilerplate — unrelated subject entirely |
| **"searchset, history, batch, transaction, document, message, and collection"** (Phase 9, Bundles) | `Bundle.type` enumeration and semantics | An exact duplicate of the separate "Search parameter types" topic (same summary, keyPoints, examTip) — never mentions Bundle types |
| **Diagnoses, procedures, and supporting information** (Claim, Phase 8) | `Claim.diagnosis`/`Claim.procedure`/`Claim.supportingInfo` structure | The "Clinical modeling" template (Condition/status-code content, unrelated to claims) |
| **Providers, diagnoses, procedures, and items** (ExplanationOfBenefit, Phase 8) | EOB adjudication structure | Same "Clinical modeling" template, same mismatch |
| **Accuracy, confidence trend, time, and lab completion** (Phase 16, readiness dashboard) | Assessment-readiness analytics | The hands-on "Lab intent" template — literally instructs the learner to "save final JSON, validator output, and HTTP traces," which is nonsensical for a dashboard-metrics topic |

**Root cause (for whoever fixes this):** the content-generation/seeding step that populates `phases.spa.json` appears to assign boilerplate blocks by position/rotation within a section rather than by matching block subject to topic title. This is worth checking wherever that seed file is generated (it's duplicated byte-for-byte at `apps/api/src/main/resources/db/seed/phases.spa.json`, so whatever generates one should regenerate both). The same recycled-block sections (Coverage, Claim/ClaimResponse, Common terminologies, US Implementation Guides) interleave 2–3 different templates across their topic lists, so this bug is likely to recur in the ~59 "mixed" sections that weren't individually inspected in this pass.

---

## 3. Template pool: accuracy of the generic content itself

Where the pooled boilerplate *does* match its topic (the common case — most templated topics are merely thin, not wrong), every technical claim it makes checked out against hl7.org/fhir:

- **REST foundations** template (HTTP verbs, MIME types `application/fhir+json`/`+xml`/`+turtle`, interaction list) — accurate (http.html).
- **Terminology building blocks** (CodeSystem/ValueSet/ConceptMap, `$expand`/`$validate-code`/`$lookup`/`$translate`) — accurate (terminology-service.html); operation-to-resource mapping confirmed correct.
- **SMART and OAuth** (three launch patterns: EHR/standalone/backend services) — accurate.
- **Profiling** (StructureDefinition constrains a base resource; CapabilityStatement/SearchParameter/OperationDefinition/ImplementationGuide as the conformance artifact set) — accurate.
- **OperationOutcome/status codes** (401/403 security, 404 not found, 409/412 concurrency, 422 validation) — accurate, matches http.html's status-code guidance including the 422-for-business-rule-violation mapping.
- **FMM (FHIR Maturity Model)** "0–5 scale, draft→normative" — accurate (versions.html).
- **Diagnostic set** (ServiceRequest/Specimen/Observation/DiagnosticReport/ImagingStudy relationships; Observation's required elements) — accurate.
- **Financial flow** (Coverage → eligibility → prior auth → Claim → EOB) — directionally correct; prior-auth is technically a distinct Da Vinci PAS layer, acceptable simplification for an overview slide.

The one recurring stylistic weakness across the whole pool: it teaches *exam strategy and process* ("check cardinality," "validate with required packages," "reject R5 behavior in R4 items") far more than it teaches the actual resource/element/rule the topic title names. For the 77 topics running the plain "Definition and purpose" fallback (no more specific template applies), the learner gets zero substantive facts about the named subject — not wrong, just empty.

---

## 4. Bespoke content (Phases 0–3): highest quality, fully accurate

Phases 0–3 — Orientation, Healthcare Interoperability Foundations, Spec Navigation & Versioning, Resource Model & Structure — are almost entirely hand-written (70/73 topics have unique content) and are the strongest material in the corpus. Every claim checked was accurate, including:

- FHIR version history and current status (DSTU2/STU3/R4/R4B/R5, R4 as the US-certification baseline) — accurate (versions.html).
- Canonical URL semantics ("stable identifier, not the same as a temporary server path") — accurate.
- `meta.profile` claiming a profile does not itself validate the instance — accurate, correctly distinguishes assertion from validation.
- Modifier-extension handling rule, verified as a near-verbatim match to the spec's SHALL NOT clause.
- `value[x]` choice-element exclusivity ("exactly one permitted alternative") — accurate.

---

## 5. Recommendation

1. **Fix the template-assignment bug** at the seed/content-generation source (not by hand-patching the JSON) so blocks are matched to topic subject — this is a small number of section boundaries (Phases 8–10, 16) but the mechanism likely repeats elsewhere.
2. **Write real content** for the confirmed-empty named topics: Bulk Data / Bulk Data Access, the Da Vinci IG family (PDex/PAS/CRD/DTR), the Bundle-types topic, and the two Claim/EOB structure topics — these are explicit, testable syllabus items with no substantive coverage anywhere in the 301-topic corpus today.
3. **No changes needed to narration.**
4. A full 301-topic line-by-line audit isn't warranted — this sample was large enough (60 topics + full template-pool extraction) to characterize the corpus; further value is in fixing the identified mechanism and named gaps, not in re-reading the remaining topics that share the same already-verified templates.
