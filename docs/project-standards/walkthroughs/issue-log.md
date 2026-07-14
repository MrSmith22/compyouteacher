# Writing Processor Walkthrough Issue Log

## Purpose

This document is the **living implementation tracker** created from the completed end-to-end student walkthrough (July 2026). It records specific bugs, instructional gaps, UX inconsistencies, architectural risks, and recommended improvements discovered during live testing.

The **[Master Design Specification](../master-design-specification-phase-ii.md)** remains the **governing design document** for Phase II. It defines durable product philosophy, instructional contracts, and cross-cutting standards. This issue log does not replace that specification. It tracks **concrete work items** that emerged from the walkthrough and should be closed through implementation, verification, or an explicit deferral decision.

Update this log as issues are picked up, fixed, verified, or deferred. Link commits and resolution notes when work is complete.

---

## Status Definitions

| Status | Meaning |
|--------|---------|
| **Open** | Confirmed during the walkthrough; not yet addressed. |
| **In Progress** | Actively being worked. |
| **Resolved** | Fix implemented and confirmed in testing. |
| **Deferred** | Acknowledged; intentionally postponed with a documented reason. |
| **Won't Fix** | Accepted as-is; no planned change. |
| **Needs Verification** | A fix may exist but has not been confirmed in a fresh end-to-end walkthrough. |

---

## Priority Definitions

| Priority | Meaning |
|----------|---------|
| **Critical** | Blocks instructional contract, corrupts student work, breaks trust, or prevents successful submission. |
| **High** | Major instructional or operational gap; strongly affects student confidence or outcomes. |
| **Medium** | Meaningful improvement; should be scheduled in Phase II. |
| **Low** | Worth doing; limited immediate impact. |
| **Cosmetic** | Visual polish or minor copy refinement. |

---

## Issue Summary

| Issue ID | Title | Module | Priority | Category | Status |
|----------|-------|--------|----------|----------|--------|
| WP-001 | Generated essay includes Roman numerals and outline headings | 7 | Critical | Bug | Resolved |
| WP-002 | Google Doc export references stale document | 8 | Critical | Bug / Architecture | Resolved |
| WP-003 | Module 2 allows progression without both source texts persisted | 2 | Critical | Persistence / Gate | Resolved |
| WP-004 | Module 9 duplicates Module 8 Google Doc export preparation | 9 | High | Architecture / Flow | Open |
| WP-005 | Module 9 uses legacy narrow screen layout | 9 | High | Visual Design | Needs Verification |
| WP-006 | Module 9 tests APA knowledge before teaching it | 9 | Critical | Instructional | Open |
| WP-007 | PDF download instructions insufficient for younger students | 9 | Critical | Instructional | Resolved |
| WP-008 | Module 6→7 transition lacks psychological coaching | 6–7 | High | Navigation / Flow | Open |
| WP-009 | Module 8→9 transition could be stronger | 8–9 | Medium | Navigation / Flow | Open |
| WP-010 | Success and completion pages under-celebrate accomplishment | 6–9 | Medium | Instructional / UX | Open |
| WP-011 | Vocabulary inconsistency — software/LMS voice instead of teacher voice | App-wide | High | Copy / Voice | Open |
| WP-012 | Module 6 creates blank-page feeling instead of translation stage | 6 | Critical | Instructional | Needs Verification |
| WP-013 | Module 6 introduction drafting does not surface planning artifacts | 6 | High | Instructional | Needs Verification |
| WP-014 | Module 6 body paragraph pages lack drafting coaching | 6 | High | Instructional | Needs Verification |
| WP-015 | Module 6 conclusion drafting ignores conclusion planning | 6 | High | Instructional | Needs Verification |
| WP-016 | Module 6 missing “how experienced writers use these notes” instruction | 6 | High | Instructional | Needs Verification |
| WP-017 | Module 6 sidebar too narrow and visually de-emphasized | 6 | High | Visual Design | Open |
| WP-018 | Module 6 lacks meaningful instructional color semantics | 6 | Medium | Visual Design | Open |
| WP-019 | Module 6 drafting pages missing consistent six-section screen pattern | 6 | High | Instructional / UX | Open |
| WP-020 | Module 7 assumes revision knowledge instead of teaching it | 7 | Critical | Instructional | Open |
| WP-021 | Module 7 Read Aloud lacks “why” coaching and listening checklist | 7 | High | Instructional | Open |
| WP-022 | Module 7 revision pages lack strategy coaching (intro, body, conclusion) | 7 | High | Instructional | Open |
| WP-023 | Module 7 does not compare draft against planning artifacts | 7 | High | Instructional | Open |
| WP-024 | Module 7 revision pages present excessive simultaneous cognitive load | 7 | Medium | UX / Cognitive Load | Open |
| WP-025 | Module 7 sidebar not configured as revision notebook | 7 | Medium | Visual Design | Open |
| WP-026 | Module 7 revision language can imply writing is “wrong” | 7 | Low | Copy / Voice | Open |
| WP-028 | Module 8 lacks single authoritative export pathway | 8 | Critical | Architecture | Open |
| WP-029 | Module 8 lacks export verification against latest essay | 8 | High | Architecture / Trust | Open |
| WP-030 | Module 8 lacks recovery actions for export problems | 8 | High | UX / Trust | Resolved |
| WP-031 | Module 8 uses hyperlinks instead of primary action buttons | 8 | High | UX | Resolved |
| WP-032 | Module 8 export success messaging does not build trust | 8 | High | Instructional / UX | Resolved |
| WP-033 | Module 8 does not explain what the Google Doc represents | 8 | Medium | Instructional | Resolved |
| WP-034 | Module 8 APA formatting page lacks how/why coaching | 8 | Medium | Instructional | Resolved |
| WP-035 | Module 8 Ready to Submit screen lacks confidence checklist | 8 | Medium | Instructional | Resolved |
| WP-036 | Module 8 missing escape hatches to update Google Doc | 8 | Medium | Navigation / Flow | Resolved |
| WP-037 | Module 8 lacks reassurance that submission has not happened yet | 8 | Medium | Instructional | Resolved |
| WP-038 | Module 9 needs internal APA Quick Guide | 9 | Critical | Instructional | Resolved |
| WP-039 | Module 9 quiz stacks many questions instead of one concept per screen | 9 | High | Instructional / UX | Resolved |
| WP-040 | Module 9 quiz feedback reports correctness without teaching | 9 | Medium | Instructional | Resolved |
| WP-041 | Module 9 formatting page lacks “do not rewrite” coaching | 9 | High | Instructional | Resolved |
| WP-042 | Module 9 export button uses technical “Export” language | 9 | Medium | Copy / Voice | Resolved |
| WP-043 | Module 9 lacks visual screenshots for APA and PDF steps | 9 | High | Instructional / Visual Design | Resolved |
| WP-044 | Module 9 upload page lacks explicit step-by-step coaching | 9 | Medium | Instructional | Resolved |
| WP-045 | Module 9 upload lacks wrong-PDF reassurance | 9 | Medium | Instructional | Resolved |
| WP-046 | Module 9 final upload checklist missing | 9 | Medium | Instructional | Resolved |
| WP-047 | Module 9 legacy submission flow feels LMS-like | 9 | High | UX / Flow | Needs Verification |
| WP-048 | Four-question screen contract not met (especially how + finished) | App-wide | High | Instructional / UX | Needs Verification |
| WP-049 | Students must search sidebar instead of seeing artifacts pulled forward | App-wide | High | UX / Cognitive Load | Needs Verification |
| WP-050 | Visual hierarchy treats all page elements with equal weight | App-wide | High | Visual Design | Needs Verification |
| WP-051 | Most screens lack visible success criteria (“How do I know I’m finished?”) | App-wide | High | Instructional | Needs Verification |
| WP-052 | Module transitions are mechanical, not psychological | App-wide | High | Navigation / Flow | Needs Verification |
| WP-053 | Action affordances mix buttons, hyperlinks, and plain text inconsistently | App-wide | High | UX | Needs Verification |
| WP-054 | Progressive disclosure not applied on dense screens | App-wide | Medium | UX / Cognitive Load | Needs Verification |
| WP-055 | Feedback uses Correct/Incorrect without teaching | App-wide | Medium | Instructional | Needs Verification |
| WP-056 | Insufficient mid-module progress celebration | App-wide | Medium | Instructional | Needs Verification |
| WP-057 | “Never start from scratch” messaging missing after Module 2 | App-wide | Medium | Instructional | Needs Verification |
| WP-058 | Modules lack distinct psychological feel across the journey | App-wide | Medium | Instructional / UX | Needs Verification |
| WP-059 | Sidebar functions as storage instead of working notebook | App-wide | Medium | UX | Needs Verification |
| WP-060 | Dense pages lack whitespace and instructional card chunking | App-wide | Low | Visual Design | Open |
| WP-061 | Instructional color semantics not applied application-wide | App-wide | Medium | Visual Design | Open |
| WP-062 | Students feel lost on several screens | App-wide | High | UX / Cognitive Load | Open |
| WP-063 | Planning supports do not fade naturally before drafting and revision | 5–7 | High | Instructional / Architecture | Open |
| WP-064 | Students cannot reopen saved source texts during Module 3 analysis | 3 | High | UX / Navigation | Resolved |
| WP-065 | Transition Module 6 from outline language to writing language | 6 | High | Instructional / UX | Resolved |
| WP-066 | Align Module 7 revision labels with Module 6 writing language | 7 | Medium | Instructional / UX | Resolved |
| WP-067 | Module 8 completion does not advance progress to Module 9 | 8 | Critical | Persistence / Gate | Resolved |
| WP-068 | Module 8 revisit completion bypasses dedicated success page | 8 | High | Navigation / Flow | Resolved |
| WP-069 | Improve Module 9 final success screen | 9 | High | Instructional / UX | Resolved |
| WP-070 | Unlock to Test does not restore Module 7 editing | 7 | Critical | Bug / Dev tooling | Resolved |
| WP-071 | Module 8 always shows Create when a Google Doc already exists | 8 | Medium | Copy / UX | Resolved |
| WP-072 | Module 9 introduction lacks submission-prep coaching | 9 | High | Instructional / Copy | Resolved |
| WP-073 | Module 6 drafting pages need explicit “Your job right now” writing steps | 6 | High | Instructional | Needs Verification |
| WP-074 | Make “Your job right now” the primary instructional focus on Module 6 drafting pages | 6 | High | Instructional / UX | Needs Verification |
| WP-075 | Replace ambiguous Module 6 writing terminology with student-friendly language | 6 | Medium | Copy / Voice | Needs Verification |
| WP-076 | Build the Introduction page around the reader, not the writing | 6 | High | Instructional | Needs Verification |
| WP-077 | Make supporting resources impossible to miss on Module 6 drafting pages | 6 | High | Instructional / UX | Needs Verification |
| WP-078 | Module 1 prompt page lacks clear first-task hierarchy | 1 | High | Instructional / UX | Resolved |

*Note: WP-027 was reserved during drafting and intentionally skipped to avoid renumbering WP-028+. WP-064 was added after WP-003 verification (July 2026). WP-065 was added after WP-001 verification (July 2026). WP-066 was logged after WP-065 verification (July 2026). WP-067 was logged after WP-002 Module 8 export-gate verification (July 2026). WP-068 was logged to unify Module 8 completion through `/modules/8/success` (July 2026). WP-069 was logged for Module 9 final success-screen guidance (July 2026). WP-070 was logged when Unlock to Test failed to restore Module 7 editing during WP-002 verification (July 2026). WP-071 was logged for Module 8 Create vs Update Google Doc wording (July 2026). WP-072 was created to correctly track Module 9 introductory coaching that had been mis-attributed to WP-012 (July 2026). WP-073 was logged for explicit Module 6 “Your job right now” drafting steps (July 2026). WP-074 was logged to make those steps the primary page focus (July 2026). WP-075 was logged for ambiguous Module 6 wording such as “open your essay” (July 2026). WP-076 was logged for reader-centered Introduction coaching (July 2026). WP-077 was logged for Module 6 Need Help discoverability and natural drafting questions (July 2026). WP-078 was logged for Module 1 prompt first-task hierarchy (M1.1) and closed after live verification (July 10, 2026). The Developer Testing Panel and seed harness are development infrastructure only and intentionally have no WP issue ID. Next new walkthrough ID: WP-079.*

---

## Detailed Issues

### WP-001 — Generated essay includes Roman numerals and outline headings

- **Module:** 7 (affects drafting presentation in Modules 6–7)
- **Screen or area:** Read Aloud; generated full-draft view; all revision screens that display assembled essay
- **Priority:** Critical
- **Category:** Bug
- **Status:** Resolved

**Walkthrough observation:** During Read Aloud, the generated essay contained Roman numerals and outline headings such as “II. King uses emotional appeals…”, “III. King builds credibility…”, and “IV. King uses logical arguments…”. Planning labels appeared inside prose students were meant to revise and submit.

**Why it matters educationally:** Students revise an outline framework instead of a genuine essay. Reading aloud becomes less authentic because students hear planning structure, not their writing. Revision teaches the wrong object.

**Why it matters technically or operationally:** Planning representation and writing representation are architecturally distinct. Leakage indicates the draft assembly path is not stripping outline metadata before rendering the student-facing essay.

**Recommended smallest reasonable fix:** Strip Roman numerals, outline headings, paragraph labels, and planning prompts from the generated essay before rendering in Module 6 completion, Module 7 Read Aloud, and revision views. Preserve planning artifacts only in sidebar/reference contexts.

**Verification steps:**
1. Complete Modules 5–6 with a full outline containing Roman numerals.
2. Open Module 7 Read Aloud and inspect generated text.
3. Confirm essay contains only introduction, body paragraphs, and conclusion prose — no outline labels.
4. Confirm sidebar still shows planning artifacts where appropriate.

**Related files:** `components/module7/module7DraftSections.js` (`getEssayProseBlocks`); `components/module7/EssayProseView.jsx`; Module 7 Read Aloud and Module 8 finished-essay preview

**Resolution notes:** Assembled-essay views now render prose-only blocks via `getEssayProseBlocks` / `EssayProseView`. Planning labels (Roman numerals, outline titles) remain on shelves/maps only. Verified during the WP-065 walkthrough (July 2026): Module 7 Read Aloud prose-only behavior remained intact.

**Resolved in commit:** (presentation fix present prior to this log sync; closed after WP-065 verification confirmation)

---

### WP-002 — Google Doc export references stale document

- **Module:** 8
- **Screen or area:** Google Doc creation/export screens in Module 8
- **Priority:** Critical
- **Category:** Bug / Architecture
- **Status:** Resolved

**Walkthrough observation:** Early in Module 8, the Google Doc appeared to contain an older essay from a previous test. Later, Module 9’s export button generated the correct newest essay. The export engine works, but at least one export path references stale information.

**Why it matters educationally:** Students lose trust that the paper they worked on is the paper being submitted. Anxiety replaces confidence during an already stressful submission phase.

**Why it matters technically or operationally:** Multiple export paths appear to exist. One succeeds with current data; another surfaces outdated content. This is an architectural consistency problem, not a fundamental export failure.

**Recommended smallest reasonable fix:** Identify all Google Doc export entry points. Route every export through one shared function that always reads the latest persisted essay. Update or create the submission document deterministically.

**Verification steps:**
1. Complete a full essay, then modify revision content.
2. Export from every Module 8 and Module 9 export control.
3. Confirm all paths produce identical, current content.
4. Re-test after a prior test account has an old Google Doc on record.

**Related files:** `lib/supabase/helpers/studentDrafts.ts` (`getFinalTextForExport`); `components/ModuleEight.js`; `components/ModuleNine.js`; `lib/exports/exportEssayToGoogleDocs.ts`; `app/api/export-to-docs/route.js`

**Resolution notes:** (July 2026) `getFinalTextForExport` now resolves Module 7 `final_text` → Module 7 `full_text` → Module 6 `full_text`, matching on-screen essay selection. Module 8 no longer treats a leftover `exported_docs` link **or** `student_drafts` module-8 `final_ready` as verified: on load, `docVerifiedThisSession` is always false and the CREATE_DOC step is shown. Continue / “Ready” / “Google Doc Created” unlock only after a successful Create/Update export initiated in the current Module 8 visit. Previously finalized Module 8 rows still require that this-visit export (then restore the success panel once checklist is complete). Verified in live walkthrough (July 10, 2026): Reset → Seed Complete Essay → Module 8 export matched current essay; Module 7 revise with marker `WP002-VERIFY-0710` → Save → Finalize → Module 8 Update exported a new Doc containing the marker.

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-003 — Module 2 allows progression without both source texts persisted

- **Module:** 2
- **Screen or area:** Source preparation wizard (speech and letter stages); analysis-phase entry; downstream Module 2–4 routes
- **Priority:** Critical
- **Category:** Persistence / Gate
- **Status:** Resolved

**Walkthrough observation:** The walkthrough student had speech text persisted (`mlk_text`) but letter text empty (`lfbj_text`). The student could continue through Module 2 because local textarea content satisfied progression checks even though the letter was never saved. Later pages correctly reported “No saved letter found yet.”

**Why it matters educationally:** Module 2’s instructional contract requires both working source copies before analysis begins. Allowing progression without persistence violates “teach before ask” and strands students mid-module.

**Why it matters technically or operationally:** Progression gates validated UI state instead of persisted `module2_sources` data. Downstream pages correctly read the database, exposing the inconsistency.

**Recommended smallest reasonable fix:** Enforce a single readiness model: both speech and letter must be persisted in `module2_sources` before analysis-phase routes unlock. Block Continue until save is confirmed via API re-fetch. Add defensive redirects on downstream module entry points.

**Verification steps:**
1. Paste valid speech and letter text without clicking Save on the letter.
2. Confirm Continue is blocked and a clear save-required message appears.
3. Save both sources; confirm API returns both texts.
4. Refresh mid-wizard and confirm resume lands on the correct incomplete stage.
5. Attempt direct navigation to Module 2 analysis or Module 3 with incomplete sources; confirm redirect.

**Related files:** `lib/module2/module2SourceReadiness.ts`; `lib/module2/useModule2SourcePreparationGate.js`; `app/modules/2/page.js`; `app/modules/2/layout.js`; `app/modules/3/page.js`; `app/modules/4/page.js`

**Resolution notes:** Fully verified through manual walkthrough testing (July 2026). All source persistence gates passed. Refresh preserved saved copies. Direct navigation to `/modules/2/tcharts`, `/modules/2/analysis`, `/modules/2/success`, and `/modules/3` behaved correctly (incomplete sources redirected to Module 2). Saved state correctly required persistence before progression; Continue and progress controls could not bypass unsaved sources.

**Resolved in commit:** (implementation present prior to verification; status closed after manual walkthrough confirmation)

---

### WP-004 — Module 9 duplicates Module 8 Google Doc export preparation

- **Module:** 9 (also affects Module 8)
- **Screen or area:** Module 9 export page; Module 8 Google Doc workflow
- **Priority:** High
- **Category:** Architecture / Flow
- **Status:** Open

**Walkthrough observation:** Module 8 prepares students to create/update a submission Google Doc. Module 9 then presents a separate export step that repeats the same preparation work. Module 9’s export produced the correct essay, confirming the engine works but the workflow is duplicated.

**Why it matters educationally:** Students encounter the same intimidating technical step twice without understanding why. Duplication increases anxiety and makes the process feel error-prone.

**Why it matters technically or operationally:** Multiple export surfaces increase the risk of divergent behavior (see WP-002). Maintenance burden grows with each duplicate button.

**Recommended smallest reasonable fix:** Establish one submission-document concept. Module 8 creates/updates it; Module 9 verifies status and offers Update/Open actions only when needed — not a full duplicate export ritual.

**Verification steps:**
1. Complete Module 8 export successfully.
2. Enter Module 9 and confirm export step reflects existing document status.
3. Confirm no redundant full re-export is required unless essay changed.
4. Confirm update path still works after essay edits.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-005 — Module 9 uses legacy narrow screen layout

- **Module:** 9
- **Screen or area:** All Module 9 screens (quiz, formatting, PDF, upload, completion)
- **Priority:** High
- **Category:** Visual Design
- **Status:** Needs Verification

**Walkthrough observation:** Module 9 pages render inside a very narrow vertical strip while large portions of the display remain empty. Screenshots, instructional cards, and action buttons are cramped compared to Modules 6–8.

**Why it matters educationally:** APA and PDF tasks are visually learned. Cramped layout forces excessive scrolling and makes instructional screenshots impractical.

**Why it matters technically or operationally:** Module 9 appears to use a legacy layout pattern inconsistent with the rest of Phase II UI. Widening requires layout work, not just copy changes.

**Recommended smallest reasonable fix:** Adopt the standard working-width layout used elsewhere. Increase content column width to accommodate screenshots, numbered steps, and prominent buttons.

**Verification steps:**
1. Open each Module 9 screen at desktop width.
2. Confirm working area uses available horizontal space.
3. Confirm screenshots and buttons fit without excessive vertical scrolling.

**Related files:** `components/ModuleNine.js`; `components/layout/ModulePageShell.jsx`; `components/layout/layoutModes.js`; `components/layout/WorkspaceLayout.jsx`

**Resolution notes:** (July 2026) Root cause: Module 9 used `ReadingLayout` (`max-w-3xl`), so an inner `max-w-6xl` could never widen. Fix: add `/modules/9` to workspace routes; introduce shared `ModulePageShell` (`contentMax` md/lg/xl/none); Module 9 uses `contentMax="lg"` (`max-w-5xl`) for readable single-column width inside the same responsive WorkspaceLayout padding as Modules 6–8. Modules 6–8 wrap with `ModulePageShell` (full width). No workflow, quiz, export, or persistence changes. Awaiting walkthrough verification at desktop and mobile widths.

**Resolved in commit:**

---

### WP-006 — Module 9 tests APA knowledge before teaching it

- **Module:** 9
- **Screen or area:** APA quiz / review screens at start of Module 9
- **Priority:** Critical
- **Category:** Instructional
- **Status:** Open

**Walkthrough observation:** Module 9 asks APA questions before teaching APA concepts. This inverts the application’s established Teach → Practice → Feedback → Continue pattern used elsewhere (e.g., Module 2 rhetorical appeals).

**Why it matters educationally:** The rest of the Writing Processor teaches. Module 9 tests. Students as young as 13–14 may never have formatted an APA paper. Testing first produces failure and anxiety instead of learning.

**Why it matters technically or operationally:** Quiz-first flow is the largest philosophical inconsistency in the application and undermines the Master Spec’s core instructional model.

**Recommended smallest reasonable fix:** Replace quiz-first entry with a short internal APA Quick Guide. Teach one concept, offer micro-practice, give explanatory feedback, then continue. Reframe any remaining quiz as reinforcement, not assessment.

**Verification steps:**
1. Enter Module 9 as a student with no APA background.
2. Confirm each APA concept is taught with a visual example before any question.
3. Confirm feedback explains why, not just whether the answer was correct.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-007 — PDF download instructions insufficient for younger students

- **Module:** 9
- **Screen or area:** PDF creation / download instructions page
- **Priority:** Critical
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Current PDF instructions do not provide enough guidance for students who have never downloaded a PDF from Google Docs. Walkthrough discussion identified this as a significant blocker for the target age group.

**Why it matters educationally:** Many students have never downloaded a PDF or submitted a formal essay. Implicit instructions assume digital literacy the population may not have.

**Why it matters technically or operationally:** Upload depends on a successful PDF download. Unclear instructions create support burden and failed submissions near deadlines.

**Recommended smallest reasonable fix:** Add explicit numbered steps: Open Google Doc → File → Download → PDF Document (.pdf) → Save to Downloads/Desktop. Include screenshots of the Google Docs menu path.

**Verification steps:**
1. Walk a novice tester through Module 9 PDF page only.
2. Confirm they can download a PDF without teacher assistance.
3. Confirm saved file location is clear.

**Related files:** `components/ModuleNine.js` (Step 4 instructional block)

**Resolution notes:** Verified through a live student walkthrough. The revised Module 9 PDF download instructions successfully guided the student through: (1) opening the Google Doc, (2) clicking File, (3) choosing Download, (4) selecting PDF Document (.pdf), (5) saving the PDF in an easy-to-find location, (6) returning to the Writing Processor, and (7) uploading the PDF successfully. The numbered instructions were clear and appropriate for middle school students. Confirmed unchanged: Google Doc creation, export behavior, file picker, PDF upload, submission completion, APA quiz, APA checklist, and progress tracking. No application code was modified during verification closure.

**Resolved in commit:** (presentation-only fix; closed after live walkthrough verification)

---

### WP-008 — Module 6→7 transition lacks psychological coaching

- **Module:** 6–7
- **Screen or area:** Module 6 completion; Module 7 entry
- **Priority:** High
- **Category:** Navigation / Flow
- **Status:** Open

**Walkthrough observation:** Transitions between modules often function mechanically but not psychologically. The Master Spec gives an example transition — “You’ve written a draft. Now let’s strengthen it.” — that is not consistently delivered at the Module 6→7 boundary.

**Why it matters educationally:** Module 7 is the second major cognitive transition (drafting → revision). Without explicit coaching, students do not understand they are changing roles from writer to reviser.

**Why it matters technically or operationally:** Weak transitions increase “lost” feelings and reduce completion rates at module boundaries.

**Recommended smallest reasonable fix:** Add a Module 6 completion screen and Module 7 intro card that name the role change, reassure students their draft is complete, and preview the revision workshop ahead.

**Verification steps:**
1. Complete Module 6 and note the transition messaging.
2. Confirm Module 7 opening explains what revision is and is not (not proofreading).
3. Confirm student can articulate why they are in Module 7.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-009 — Module 8→9 transition could be stronger

- **Module:** 8–9
- **Screen or area:** Module 8 completion; Module 9 entry
- **Priority:** Medium
- **Category:** Navigation / Flow
- **Status:** Open

**Walkthrough observation:** The Module 8→9 transition works functionally but could better reduce anxiety. The Master Spec recommends explicit messaging: writing is finished; remaining tasks are APA review, PDF download, upload, and submission — no additional writing required.

**Why it matters educationally:** By Module 8–9, students worry about losing work or submitting the wrong version. A strong transition reframes the remaining work as preparation, not more writing.

**Why it matters technically or operationally:** Clear transition copy reduces support contacts and premature submission anxiety.

**Recommended smallest reasonable fix:** Add a transition card at Module 8 completion listing the four remaining Module 9 tasks and explicitly stating no further writing is required.

**Verification steps:**
1. Complete Module 8 and read transition content.
2. Confirm four Module 9 steps are listed.
3. Confirm “no additional writing” message is present.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-010 — Success and completion pages under-celebrate accomplishment

- **Module:** 6–9 (pattern observed app-wide)
- **Screen or area:** Module completion screens; Module 9 final success screen; intermittent milestone pages
- **Priority:** Medium
- **Category:** Instructional / UX
- **Status:** Open

**Walkthrough observation:** Completion pages function but do not consistently celebrate what students accomplished. Module 8 completion, Module 9 success, and mid-journey milestones under-recognize the full arc (observation → analysis → planning → outlining → drafting → revision → formatting → submission).

**Why it matters educationally:** Celebration reinforces that writing is a process with achievable stages. Under-celebrating the final submission misses the most important psychological payoff.

**Why it matters technically or operationally:** Inconsistent completion treatment makes the product feel uneven and LMS-like at the finish line.

**Recommended smallest reasonable fix:** Define a shared completion-screen template: name what was accomplished, list skills learned, and use consistent celebratory teacher voice. Apply to Module 8, Module 9, and key mid-course milestones.

**Verification steps:**
1. Review all completion/success screens in Modules 6–9.
2. Confirm each names specific accomplishments and skills.
3. Confirm tone is consistent across modules.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-011 — Vocabulary inconsistency — software/LMS voice instead of teacher voice

- **Module:** App-wide (especially Modules 6–9)
- **Screen or area:** Buttons, headings, instructions, feedback
- **Priority:** High
- **Category:** Copy / Voice
- **Status:** Open

**Walkthrough observation:** The application sometimes sounds like software or an LMS (“Continue”, “Complete”, “Submit”, “Export”) instead of a writing teacher (“Let’s look at the evidence you’ve already chosen”, “I’m ready to continue”). Module 9 is the strongest example; the pattern appears throughout.

**Why it matters educationally:** Teacher voice changes the emotional experience from task completion to guided learning. LMS language increases anxiety and transactional thinking.

**Why it matters technically or operationally:** Inconsistent voice makes Phase II copy passes harder and undermines brand identity as a “digital writing teacher.”

**Recommended smallest reasonable fix:** Audit high-traffic strings in Modules 6–9. Replace software commands with conversational teacher phrasing. Create a short approved-vocabulary list for actions (Create/Update/Open instead of Export).

**Verification steps:**
1. Review Module 6–9 UI copy against Master Spec §19–20 and Part 7B.
2. Flag remaining LMS-style imperatives.
3. Confirm action labels use student-natural verbs.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-012 — Module 6 creates blank-page feeling instead of translation stage

- **Module:** 6
- **Screen or area:** All drafting screens; Module 6 entry
- **Priority:** Critical
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Module 6 currently feels like Planning → Blank Page → Essay. Students experience beginning a new assignment even though they have already completed most difficult thinking. The largest instructional weakness in Module 6 is failing to communicate that drafting is translation, not invention.

**Why it matters educationally:** Students enter Module 6 believing “the hard part begins.” The opposite should be true. Without the translation bridge, the planning investment feels wasted.

**Why it matters technically or operationally:** The application already persists planning artifacts. The gap is instructional surfacing, not missing data.

**Recommended smallest reasonable fix:** Add a Module 6 entry coach screen and per-page opener: “You are NOT starting over. Everything you need already exists. Your job is to turn notes into complete sentences.”

**Verification steps:**
1. Enter Module 6 after completing Module 5.
2. Confirm entry messaging frames drafting as translation.
3. Confirm drafting pages do not present an unexplained blank-page experience.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Presentation-only translation bridge: first drafting section shows an InfoCallout (“You are not starting over”); Module 6 step presentation and meta strip frame drafting as turning the outline into sentences one section at a time. No persistence, navigation, or drafting-logic changes. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-013 — Module 6 introduction drafting does not surface planning artifacts

- **Module:** 6
- **Screen or area:** Draft Introduction screen
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Students see a prompt, large textbox, and sidebar with minimal coaching. Thesis, essay purpose, and paragraph plan exist but are visually secondary. Students hunt instead of being shown what they already decided.

**Why it matters educationally:** Introductions should build on prior planning. Hiding artifacts recreates blank-page anxiety and contradicts “never start from scratch.”

**Why it matters technically or operationally:** Sidebar already contains the data. Primary workspace layout must pull it forward.

**Recommended smallest reasonable fix:** Display thesis, essay purpose, and paragraph topics inline above the textbox. Add a three-part introduction coach (introduce topic, provide context, end with thesis).

**Verification steps:**
1. Open Draft Introduction with completed Module 5 planning.
2. Confirm thesis and purpose appear in the working area without sidebar hunting.
3. Confirm coaching explains what introductions do before writing begins.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`; `components/module6/ModuleSixStepFrame.jsx`

**Resolution notes:** (July 10, 2026) Presentation-only: thesis card (“Your thesis (already written)”) + thesis/outline coaches + intro writer moves appear above the drafting box; richer why/example/self-check copy. Essay purpose / full paragraph-topic strip still limited to outline guide + shelf. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-014 — Module 6 body paragraph pages lack drafting coaching

- **Module:** 6
- **Screen or area:** Draft Body Paragraph screens
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Body paragraph pages ask students to “write this paragraph” without modeling how experienced writers build paragraphs. The application behaves as though students already know how to introduce evidence, explain it, and connect it to the thesis.

**Why it matters educationally:** Body paragraphs are the core of the essay. Assigning without teaching wastes the walkthrough’s richest instructional opportunity.

**Why it matters technically or operationally:** Evidence, explanations, audience, and purpose data already exist per paragraph. Coaching can be templated per paragraph index.

**Recommended smallest reasonable fix:** Add per-paragraph coaching card: today’s goal, surfaced main idea/evidence/reasoning, then “how writers introduce → explain → connect evidence” before the textbox.

**Verification steps:**
1. Open each body paragraph drafting page.
2. Confirm main idea, quotations, and explanations appear inline.
3. Confirm a writer-model coach precedes the textbox.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`; `components/module6/ModuleSixStepFrame.jsx`

**Resolution notes:** (July 10, 2026) Presentation-only: per-body outline points listed inline; thesis coach; “How writers use these notes” moves; annotated example + self-check. Full quotation/explanation artifact pull-forward from paragraph plans remains partial (still on shelf). Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-015 — Module 6 conclusion drafting ignores conclusion planning

- **Module:** 6
- **Screen or area:** Draft Conclusion screen
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Students already answered how they will restate the thesis and what final thought readers should leave with. The conclusion drafting page largely ignores those planning responses.

**Why it matters educationally:** Conclusions should close the arc planned in Module 5. Ignoring prior answers makes conclusion drafting feel like another blank-page task.

**Why it matters technically or operationally:** Conclusion planning artifacts are persisted. Surfacing them is a presentation change.

**Recommended smallest reasonable fix:** Show restate-thesis and final-thought planning responses inline. Explain how conclusions work, then ask students to draft.

**Verification steps:**
1. Complete conclusion planning in Module 5.
2. Open Draft Conclusion.
3. Confirm prior conclusion answers appear before the textbox.
4. Confirm coaching explains conclusion structure.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Presentation-only: conclusion outline summary/finalThought surfaced in the Outline guide; thesis coach + writer moves + annotated example/self-check. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-016 — Module 6 missing “how experienced writers use these notes” instruction

- **Module:** 6
- **Screen or area:** All drafting screens (Section 4 of six-section pattern)
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** The six-section drafting pattern calls for “How do experienced writers use these notes?” This instructional step is currently missing. Students see artifacts (sometimes in the sidebar) but are not taught how to translate notes into prose.

**Why it matters educationally:** This section is the core pedagogical bridge between planning and drafting. Without it, students copy notes or freeze.

**Why it matters technically or operationally:** Content can be templated once per section type (introduction, body, conclusion) with minor per-paragraph variation.

**Recommended smallest reasonable fix:** Add a short instructional card before each textbox explaining how writers introduce, explain, and connect evidence — without copying notes directly.

**Verification steps:**
1. Review each Module 6 drafting page.
2. Confirm a writer-strategy card appears after artifacts and before the textbox.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Presentation-only: “How writers use these notes” numbered moves appear before the drafting box on intro, body, and conclusion pages. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-017 — Module 6 sidebar too narrow and visually de-emphasized

- **Module:** 6
- **Screen or area:** Drafting sidebar (Writer’s Notebook)
- **Priority:** High
- **Category:** Visual Design
- **Status:** Open

**Walkthrough observation:** The sidebar is very narrow with small text and little visual emphasis. It feels secondary even though it contains necessary planning information. Students do not naturally consult it.

**Why it matters educationally:** Module 6 reframes the sidebar as a Writer’s Notebook. A cramped notebook does not teach students to use prior thinking.

**Why it matters technically or operationally:** Sidebar width and typography are layout/CSS changes within existing component structure.

**Recommended smallest reasonable fix:** Widen sidebar, increase typography, highlight the current paragraph’s artifacts, collapse non-relevant sections, and use visual cards.

**Verification steps:**
1. Open body paragraph drafting pages.
2. Confirm current paragraph artifacts are visually prominent.
3. Confirm sidebar is readable without squinting or horizontal scroll.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-018 — Module 6 lacks meaningful instructional color semantics

- **Module:** 6
- **Screen or area:** All Module 6 drafting screens
- **Priority:** Medium
- **Category:** Visual Design
- **Status:** Open

**Walkthrough observation:** Module 6 feels visually flat. Color does not reinforce thinking types (instruction, student idea, evidence, writing, revision reminder) as recommended in the Master Spec.

**Why it matters educationally:** Color should teach where to look. Flat UI forces students to parse undifferentiated text blocks.

**Why it matters technically or operationally:** Color semantics should align with the application-wide palette defined in Part 7A to avoid one-off Module 6 styling.

**Recommended smallest reasonable fix:** Apply semantic color roles to instructional cards, student ideas, evidence blocks, and writing areas per the Master Spec color philosophy.

**Verification steps:**
1. Review Module 6 screens against color semantics table in Master Spec.
2. Confirm color distinguishes instruction from student work from evidence.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-019 — Module 6 drafting pages missing consistent six-section screen pattern

- **Module:** 6
- **Screen or area:** All drafting screens
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Open

**Walkthrough observation:** The Master Spec defines a six-section pattern (Where are we? / Why does this matter? / What have you figured out? / How do writers use notes? / Now write / Before continuing checklist). Drafting pages do not follow this consistently.

**Why it matters educationally:** Consistent screen patterns reduce cognitive load and make the teacher’s guidance predictable.

**Why it matters technically or operationally:** A shared layout component for Module 6 drafting would enforce consistency and speed Phase II implementation.

**Recommended smallest reasonable fix:** Create a reusable Module 6 drafting layout implementing all six sections. Migrate introduction, body, and conclusion pages to it.

**Verification steps:**
1. Audit each Module 6 drafting page against the six-section checklist.
2. Confirm every page includes a finish checklist before Continue.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-020 — Module 7 assumes revision knowledge instead of teaching it

- **Module:** 7
- **Screen or area:** All revision screens
- **Priority:** Critical
- **Category:** Instructional
- **Status:** Open

**Walkthrough observation:** Module 7 repeatedly asks students to “strengthen,” “revise,” and “improve” without teaching what those verbs mean. The application assumes revision knowledge many tenth graders do not have.

**Why it matters educationally:** Revision is a skill, not a task. Module 7’s desired goal is to teach how experienced writers revise — not merely to improve the essay.

**Why it matters technically or operationally:** Each revision page should teach one strategy. This is primarily copy and layout work on an otherwise strong workflow.

**Recommended smallest reasonable fix:** Add a revision-strategy instructional card to every Module 7 page before the editing workspace. Define revision vs editing explicitly on Module 7 entry.

**Verification steps:**
1. Enter Module 7 without prior revision instruction.
2. Confirm each page teaches one concrete strategy before asking for edits.
3. Confirm revision is framed as improving communication, not fixing mistakes.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-021 — Module 7 Read Aloud lacks “why” coaching and listening checklist

- **Module:** 7
- **Screen or area:** Read Aloud screen
- **Priority:** High
- **Category:** Instructional
- **Status:** Open

**Walkthrough observation:** Read Aloud is a strong instructional idea and works technically (recording and playback). However, the page explains what to do but not why. Students do not receive a listening checklist before recording.

**Why it matters educationally:** Reading aloud reveals awkward wording, missing transitions, and unclear explanations — but only if students know what to listen for.

**Why it matters technically or operationally:** Recording and playback need no redesign. Add pre-recording instructional content only.

**Recommended smallest reasonable fix:** Add “why read aloud” coaching and a checklist (stumbles, repetition, long sentences, incomplete explanations, listener comprehension) before the record button.

**Verification steps:**
1. Open Read Aloud as a student.
2. Confirm why-coaching and checklist appear before recording.
3. Confirm recording/playback still function correctly.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-022 — Module 7 revision pages lack strategy coaching (intro, body, conclusion)

- **Module:** 7
- **Screen or area:** Introduction, body paragraph, and conclusion revision screens
- **Priority:** High
- **Category:** Instructional
- **Status:** Open

**Walkthrough observation:** Introduction revision presents “strengthen your introduction” with little coaching. Body pages say “strengthen this paragraph” without how. Conclusion revision has little instruction. Each page needs teach → compare → improve-one-thing sequencing.

**Why it matters educationally:** Without strategy coaching, students default to superficial word swaps or grammar fixes instead of substantive revision.

**Why it matters technically or operationally:** Coaching content differs per section but follows one template. Focus each body page on one or two strategies (transitions, evidence explanation, etc.).

**Recommended smallest reasonable fix:** Add section-specific coaching questions (e.g., “Does my thesis clearly express my argument?”) and a single-strategy focus per body paragraph revision page.

**Verification steps:**
1. Review each Module 7 revision page.
2. Confirm coaching questions appear before the textbox.
3. Confirm each body page names one primary revision strategy.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-023 — Module 7 does not compare draft against planning artifacts

- **Module:** 7
- **Screen or area:** Body paragraph revision screens
- **Priority:** High
- **Category:** Instructional
- **Status:** Open

**Walkthrough observation:** The application knows the student’s paragraph plan, evidence, explanations, audience, and purpose — but revision pages do not automatically compare the draft against those artifacts. Example from spec: outline said “King builds credibility” but paragraph may not explain how.

**Why it matters educationally:** Comparing draft to plan creates authentic revision grounded in the student’s own thinking.

**Why it matters technically or operationally:** Data already exists in persisted artifacts. Comparison is conditional prompt text, not new data collection.

**Recommended smallest reasonable fix:** On each body revision page, show the planned main idea and ask whether the draft actually delivers it. Suggest one sentence to add if not.

**Verification steps:**
1. Open body paragraph revision with a deliberate gap between plan and draft.
2. Confirm planning artifact and comparison prompt appear.
3. Confirm suggestion is coaching-only (does not auto-rewrite).

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-024 — Module 7 revision pages present excessive simultaneous cognitive load

- **Module:** 7
- **Screen or area:** All revision screens
- **Priority:** Medium
- **Category:** UX / Cognitive Load
- **Status:** Open

**Walkthrough observation:** Revision pages often present instructions, sidebar, draft, textbox, buttons, and navigation all at once. Progressive disclosure is not applied.

**Why it matters educationally:** Revision is cognitively demanding. Showing everything simultaneously increases overwhelm.

**Why it matters technically or operationally:** Progressive disclosure can be implemented via collapsible sections and stepwise reveal without changing persistence or workflow order.

**Recommended smallest reasonable fix:** Reveal coaching first, then draft excerpt, then edit area, then continue — collapsing non-essential sidebar content by default.

**Verification steps:**
1. Open revision pages and count simultaneously visible task layers.
2. Confirm only current-step content is expanded by default.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-025 — Module 7 sidebar not configured as revision notebook

- **Module:** 7
- **Screen or area:** Revision sidebar
- **Priority:** Medium
- **Category:** Visual Design
- **Status:** Open

**Walkthrough observation:** During revision, the sidebar should become a “revision notebook” highlighting only information relevant to the current revision task. Instead it continues to behave like general storage.

**Why it matters educationally:** Revision requires different reference material than drafting. Irrelevant sidebar content increases noise.

**Why it matters technically or operationally:** Sidebar collapse/filter rules can be revision-task-aware using existing artifact metadata.

**Recommended smallest reasonable fix:** Filter and expand sidebar sections per revision page type. Collapse everything not relevant to the current paragraph or section.

**Verification steps:**
1. Open each revision page type.
2. Confirm sidebar shows only relevant artifacts for that task.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-026 — Module 7 revision language can imply writing is “wrong”

- **Module:** 7
- **Screen or area:** Revision prompts and feedback
- **Priority:** Low
- **Category:** Copy / Voice
- **Status:** Open

**Walkthrough observation:** Some revision language can imply the student’s writing is wrong rather than complete-but-improvable. Master Spec recommends: “Your draft is complete. Now we’re making it even stronger.”

**Why it matters educationally:** Revision should feel like improvement, not correction. Defensive students revise less deeply.

**Why it matters technically or operationally:** Copy pass only; no workflow changes.

**Recommended smallest reasonable fix:** Replace deficit-framed prompts with strength-framed coaching across Module 7 strings.

**Verification steps:**
1. Audit Module 7 UI strings for “wrong”, “fix”, or implied failure.
2. Confirm strength-framed alternatives are in place.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-028 — Module 8 lacks single authoritative export pathway

- **Module:** 8 (architectural; related to WP-002, WP-004)
- **Screen or area:** All Google Doc export touchpoints
- **Priority:** Critical
- **Category:** Architecture
- **Status:** Open

**Walkthrough observation:** The walkthrough confirmed the export engine works but identified multiple export paths. The Master Spec requires exactly one authoritative pathway — not two or three — using identical logic every time.

**Why it matters educationally:** Students should think: “This button creates or updates my submission document.” Multiple paths create confusion about which version is authoritative.

**Why it matters technically or operationally:** Duplicate export logic is the root cause of stale-document risk. Consolidation is a prerequisite for trustworthy submission prep.

**Recommended smallest reasonable fix:** Extract one shared export service. Deprecate alternate paths. All buttons call the same create-or-update function.

**Verification steps:**
1. Map every export call site in Modules 8–9.
2. Confirm all call the same function.
3. Run WP-002 verification suite.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-029 — Module 8 lacks export verification against latest essay

- **Module:** 8
- **Screen or area:** Post-export confirmation; Module 8 Google Doc screens
- **Priority:** High
- **Category:** Architecture / Trust
- **Status:** Open

**Walkthrough observation:** The application does not verify that Google Doc contents match the current persisted essay. Failures can occur silently.

**Why it matters educationally:** Students need confidence their teacher will see the newest essay. Silent mismatch destroys trust.

**Why it matters technically or operationally:** Post-export verification can compare word count, hash, or sampled content. On mismatch, show a clear recovery prompt — never silent failure.

**Recommended smallest reasonable fix:** After export, verify doc matches latest essay. If not, display: “We found that your Google Doc does not match your latest essay. Click Update Google Doc to synchronize.”

**Verification steps:**
1. Export successfully; confirm verification runs.
2. Manually desync doc; confirm mismatch message appears.
3. Confirm Update resolves the mismatch.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-030 — Module 8 lacks recovery actions for export problems

- **Module:** 8
- **Screen or area:** Google Doc export and formatting screens
- **Priority:** High
- **Category:** UX / Trust
- **Status:** Resolved

**Walkthrough observation:** There is no obvious recovery path when export goes wrong. Students should always have access to Update Google Doc, Create New Google Doc, and Open Current Submission Document.

**Why it matters educationally:** Export problems are high-stress. Recovery actions restore agency.

**Why it matters technically or operationally:** Three explicit actions cover nearly all export failure modes without support intervention.

**Recommended smallest reasonable fix:** Add three persistent secondary actions on Module 8 export surfaces with clear labels.

**Verification steps:**
1. Simulate stale/missing doc states.
2. Confirm all three recovery actions are visible and functional.

**Related files:** `lib/exports/submissionDocRecovery.js`; `components/exports/SubmissionDocRecoveryPanel.jsx`; `lib/exports/createOrUpdateSubmissionGoogleDocClient.js`; `lib/exports/googleOperationTimeout.js`; `lib/exports/runExportEssayToGoogleDocs.js`; `lib/exports/exportEssayToGoogleDocs.ts`; `lib/exports/devGoogleDocEditorOverride.js`; `app/api/export-to-docs/route.js`; `app/api/verify-submission-doc/route.js`; `components/ModuleEight.js`; `components/ModuleNine.js`; Dev Panel submission-doc simulations

**Resolution notes:** (July 2026) Modules 8–9 use a shared recovery model with Update Google Doc, Open Current Submission Document, Retry check, and Create a new Google Doc (confirmed replacement only; never auto-replace; keep the old Drive file and pointer until a verified new Doc exists). Safe Update keeps the same Google Doc ID/URL. Temporary Google/API failures (including timeouts) end loading and surface Retry primary + Open when available—not mismatch—so progression stays locked until verified. Root hang fixed by skipping non-grantable `@localhost` writer grants; Google Drive/Docs operations use a 25s timeout; client requests abort at 60s. Browser acceptance: Scenario A (mismatch → one Update → same Doc → verified; progression unlocked; essay wording restored) and Scenario D (one-shot temporary failure → Retry → verified) at **390×844** and **1440×900**. Full suite 916/916.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-031 — Module 8 uses hyperlinks instead of primary action buttons

- **Module:** 8
- **Screen or area:** Google Doc, formatting, and submission-prep screens
- **Priority:** High
- **Category:** UX
- **Status:** Resolved

**Walkthrough observation:** Module 8 mixes hyperlinks and buttons for expected actions. Students recognize buttons but often overlook hyperlinks.

**Why it matters educationally:** During submission prep, missed actions feel like personal failure rather than UI ambiguity.

**Why it matters technically or operationally:** Button hierarchy (primary/secondary/reference) should replace hyperlinks for actions like Create, Update, Open, and Continue.

**Recommended smallest reasonable fix:** Convert Module 8 action hyperlinks to styled buttons with clear primary/secondary hierarchy.

**Verification steps:**
1. Audit Module 8 interactive elements.
2. Confirm every expected action is a visible button.

**Related files:** `components/ModuleEight.js`; `components/exports/SubmissionDocRecoveryPanel.jsx`; `components/module8/ModuleEightReferenceShelf.jsx`; `app/modules/8/success/page.js`; `tests/module8-wp031-action-buttons.test.js`

**Resolution notes:** (July 2026) Module 8 workflow actions (Create/Update, Open, Retry, Create-new, Keep going / Continue / Finish, gate “Go to Module 5/7”, success “Continue to Module 9”) render as accessible `<button>` controls with primary/secondary hierarchy and 44px min hit target. Format-step “Open your Google Doc” is a button (`window.open` + popup-blocker handling); after this-session verify on Create-doc, footer Keep going is suppressed so recovery Continue is the sole primary. APA template/sample/OWL remain semantic links. WP-030 recovery contracts preserved (same-doc Update, confirmed replacement only, Retry on temporary failure, progression locked until verified). Browser acceptance at **390×844** and **1440×900**: Update primary + Open/Create-new secondary buttons; APA resources stay links; success Continue is a button. Full suite 920/920.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-032 — Module 8 export success messaging does not build trust

- **Module:** 8
- **Screen or area:** Post-export success state
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** Success messaging is minimal (e.g., “Google Doc created”) without last-updated time, word count, or status. Students cannot confirm the export reflects their latest work.

**Why it matters educationally:** Module 8’s job is to reduce anxiety. Sparse confirmation keeps students wondering if the correct version exported.

**Why it matters technically or operationally:** Export response likely already contains metadata usable in confirmation UI.

**Recommended smallest reasonable fix:** Replace generic success with: “Your submission document has been updated successfully” plus last updated timestamp, word count, and status (“Ready for formatting”).

**Verification steps:**
1. Export a doc; confirm rich confirmation appears.
2. Re-export after edits; confirm timestamp and word count update.

**Related files:** `lib/exports/submissionDocSuccessConfirmation.js`; `lib/exports/runExportEssayToGoogleDocs.js`; `app/api/export-to-docs/route.js`; `lib/exports/createOrUpdateSubmissionGoogleDocClient.js`; `components/ModuleEight.js`; `components/exports/SubmissionDocRecoveryPanel.jsx`; `tests/module8-wp032-export-success-confirmation.test.js`

**Resolution notes:** (July 2026) Verified Create/Update/replacement responses include a rich confirmation built only when content verification succeeds: operation-appropriate success statement, ISO `completedAt` from successful server-side finish (locale-formatted in UI), exported essay word count from `expectedWordCount`, and status “Ready for formatting”. No extra Google Drive/Docs round-trip. Mismatch, timeout, temporary failure, and unverified replacement never receive this confirmation. Re-export refreshes word count and completion time. Browser acceptance at **390×844** and **1440×900**: compact success metadata above recovery Continue (single primary). Full suite 926/926.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-033 — Module 8 does not explain what the Google Doc represents

- **Module:** 8
- **Screen or area:** Google Doc introduction screen
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** The module assumes students understand what the Google Doc represents. It is not explained that this document becomes the paper submitted to the teacher.

**Why it matters educationally:** Without explicit framing, students treat the Doc as a technical side effect rather than their submission artifact.

**Why it matters technically or operationally:** Short instructional copy addition; no API changes.

**Recommended smallest reasonable fix:** Add explanation: “This Google Doc will become the paper you submit to your teacher. Everything from this point forward happens inside this document.”

**Verification steps:**
1. Open Module 8 Google Doc intro.
2. Confirm submission-document framing is explicit.

**Related files:** `components/ModuleEight.js` (always-visible Prepare panel); `components/module8/module8StepPresentation.js` (Create/Update working-set copy); `tests/module8-wp033-submission-doc-framing.test.js`

**Resolution notes:** (July 2026) Evidence-based audit: no new instructional prose required. The always-visible Prepare panel already states writing is complete / ideas are finished, the Google Doc is the paper the teacher will read and the student will format and turn in—above Create/Update actions and outside collapsed “Why this matters.” Create working-set copy also frames the Doc as the paper to format before turning in. Added regression coverage + `data-testid="module8-submission-doc-framing"`. Browser check at **390×844** and **1440×900** (Update intro; disclosures closed). Full suite 930/930.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-034 — Module 8 APA formatting page lacks how/why coaching

- **Module:** 8
- **Screen or area:** APA formatting screen
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Students are told to format their paper but not how or why. The page has logical progression and a checklist but weak coaching on what APA formatting does and what students will change.

**Why it matters educationally:** Students need to know writing is finished and only formatting remains. This reduces formatting anxiety.

**Why it matters technically or operationally:** Instructional cards can precede existing checklist without changing workflow.

**Recommended smallest reasonable fix:** Add four sections: what APA does, what students will change, checklist, continue. Emphasize ideas are finished.

**Verification steps:**
1. Open APA formatting page.
2. Confirm how/why coaching precedes the checklist.

**Related files:** `components/ModuleEight.js`; `components/module8/module8StepPresentation.js`; `tests/module8-wp034-apa-formatting-coaching.test.js`

**Resolution notes:** (July 2026) Format working set now shows four visible stages before/around the existing checklist: What APA formatting does; What you will change (six category chips + Open Google Doc + writing-finished reassurance); Formatting checklist (same persisted CHECKLIST_ITEMS / Module 9 checklist APIs); Continue cue with Keep going still gated by `checklistComplete`. Coaching is not limited to collapsed Why this matters. APA shelf links unchanged. Browser acceptance at **390×844** and **1440×900**. Full suite 935/935.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-035 — Module 8 Ready to Submit screen lacks confidence checklist

- **Module:** 8
- **Screen or area:** Ready to Submit screen
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Students should leave Ready to Submit feeling genuinely ready, not “I guess I’m ready.” The page lacks explicit confirmations (newest essay appears, title page correct, references complete, double spaced).

**Why it matters educationally:** Pre-submission confidence checklist prevents regret and last-minute panic.

**Why it matters technically or operationally:** Checklist is UI-only; can mirror Module 9 upload checklist for consistency.

**Recommended smallest reasonable fix:** Add visible “Before continuing” checklist with the five confirmations from the Master Spec.

**Verification steps:**
1. Open Ready to Submit.
2. Confirm five-item checklist is visible before Continue.

**Related files:** `components/ModuleEight.js`; `components/module8/module8StepPresentation.js`; `tests/module8-wp035-ready-confidence-checklist.test.js`

**Resolution notes:** (July 2026) Ready step adds always-visible “Before continuing” five-item local confidence checklist (separate from persisted APA `CHECKLIST_ITEMS`). Final Finish stays disabled and `finishPreparing` returns unless verified Doc + APA checklist + all five confirmations. Copy clarifies these checks do not submit the paper. Previously finalized revisit now lands on Ready (not auto-success) until confidence completes, then Finish proceeds to `/modules/8/success`. Browser acceptance at **390×844** and **1440×900** (disabled → enabled Finish). Full suite 940/940.

**Resolved in commit:** (closed after browser acceptance; this commit)

---

### WP-036 — Module 8 missing escape hatches to update Google Doc

- **Module:** 8
- **Screen or area:** Formatting and submission-prep screens after initial export
- **Priority:** Medium
- **Category:** Navigation / Flow
- **Status:** Resolved

**Walkthrough observation:** Students can feel trapped after export if they need to update the Google Doc. Master Spec: “Never trap students.” Allow return paths to update the doc from later Module 8 screens.

**Why it matters educationally:** Trapped feelings amplify submission anxiety.

**Why it matters technically or operationally:** Navigation links/buttons to Update Google Doc should persist across Module 8 substeps.

**Recommended smallest reasonable fix:** Add “Update Google Doc” secondary action on formatting and ready screens.

**Verification steps:**
1. Progress past initial export.
2. Confirm Update Google Doc remains accessible.

**Related files:** `components/ModuleEight.js`; `tests/module8-wp036-update-doc-escape-hatches.test.js`

**Resolution notes:** (July 2026) Secondary **Update Google Doc** escape hatch on Format and Ready navigates to the existing Create/Update working set only (`setCurrentStepIndex(0)`)—no second export path and no checklist clear on navigate. Evidence: verified Update replaces Doc body via `deleteContentRange` + `insertText` (`buildReplaceGoogleDocBodyRequests` / `replaceDocumentBody`), so APA (6) and Ready confidence (5) reset **only** after `contentVerified` success. WP-032 confirmation remains on the Create step. Open Google Doc remains available; Keep going/Finish stay the sole primary progression actions. Focused WP-030–036 **54/54**; full suite **948/948**. Live browser: Format escape hatch confirmed after verified Update; dual-viewport CDP acceptance interrupted/unreliable—no further automation loops.

**Resolved in commit:** (this commit)

---

### WP-037 — Module 8 lacks reassurance that submission has not happened yet

- **Module:** 8
- **Screen or area:** All Module 8 screens
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Students fear accidentally submitting too early. Module 8 does not consistently reassure that writing is saved, nothing is submitted yet, and they can return to update.

**Why it matters educationally:** Fear of irreversible mistakes diverts attention from formatting quality.

**Why it matters technically or operationally:** Reassurance copy can be a persistent banner or card on Module 8 pages.

**Recommended smallest reasonable fix:** Add recurring reassurance: “Your writing has already been saved. Nothing is submitted yet. You can always return and update your Google Doc.”

**Verification steps:**
1. Walk all Module 8 screens.
2. Confirm reassurance messaging is visible on each.

**Related files:** `components/ModuleEight.js`; `tests/module8-wp037-submission-reassurance.test.js`

**Resolution notes:** (July 2026) Extended the always-visible `module8-submission-doc-framing` panel with shared `module8-submission-reassurance`: writing saved; nothing submitted yet (Module 8 prepares the Doc; Module 9 final PDF); can return and update Google Doc. Outside step working-set conditionals so it appears on Create/Update, Format, and Ready. No new API/state/gates. Preserves WP-030–036. Focused WP-030–037 **58/58**; full suite **952/952**. Bounded browser: Module 8 sign-in wall blocked authenticated viewport checks—no CDP/auth loop.

**Resolved in commit:** (this commit)

---

### WP-038 — Module 9 needs internal APA Quick Guide

- **Module:** 9
- **Screen or area:** APA instruction area (new); reference throughout Module 9
- **Priority:** Critical
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Instead of immediately presenting quiz questions, students need an internal APA Quick Guide covering only what this assignment requires: title page, font, margins, spacing, page numbers, references, in-text citations — with screenshots.

**Why it matters educationally:** Students need a usable model, not an APA lecture or external manual. The guide should remain visible while formatting.

**Why it matters technically or operationally:** New reference component reused across Module 9 screens. Purdue OWL stays available but secondary.

**Recommended smallest reasonable fix:** Build a collapsible APA Quick Guide panel with screenshot-backed sections for each required formatting element.

**Verification steps:**
1. Confirm Quick Guide appears before any APA questions.
2. Confirm guide remains accessible on formatting and PDF screens.
3. Confirm Purdue OWL is optional, not primary.

**Related files:** `components/module9/ModuleNineApaQuickGuide.jsx`; `components/module9/ModuleNineApaLesson.jsx`; `components/module9/ModuleNineApaVisual.jsx`; `lib/module9/module9ApaLearning.js`; `components/ModuleNine.js`; `tests/module9-wp006-apa-learning.test.js`

**Resolution notes:** (July 2026) Evidence-only reconciliation—no product redesign. Shared `ModuleNineApaQuickGuide` uses the same concept model as the lesson (`getModule9ApaQuickGuideSections` / `MODULE9_APA_CONCEPTS`: page setup/font·spacing·margins, title page, page numbers, in-text citations, references, plus formatting-vs-rewriting and abstract exceptions). Guide renders before Try-it in `ModuleNineApaLesson` and again on checklist + PDF steps in `ModuleNine.js`. Visuals are code-native APA models (`ModuleNineApaVisual`), not Drive screenshots—still satisfy the usable model intent. Purdue OWL is under “Optional extras” via `MODULE9_APA_SECONDARY_RESOURCES`. Covered by `tests/module9-wp006-apa-learning.test.js` (incl. WP-038–040 reconciliation case). Bounded browser: Module 9 showed `module9-apa-quick-guide` + lesson without auth block.

**Resolved in commit:** (this commit)

---

### WP-039 — Module 9 quiz stacks many questions instead of one concept per screen

- **Module:** 9
- **Screen or area:** APA quiz screens
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** Pages can contain many quiz questions at once (Question 1 through Question 10). This violates one-concept-per-screen focus and increases cognitive load.

**Why it matters educationally:** Students lose focus when multiple questions compete for attention. Micro-practice after each teach moment is more effective.

**Why it matters technically or operationally:** Quiz UI should paginate to one question → feedback → continue per concept.

**Recommended smallest reasonable fix:** Split quiz into single-question screens with immediate teaching feedback before Continue.

**Verification steps:**
1. Open APA quiz flow.
2. Confirm only one question visible per screen.

**Related files:** `components/module9/ModuleNineApaLesson.jsx`; `lib/module9/module9ApaLearning.js`; `tests/module9-wp006-apa-learning.test.js`

**Resolution notes:** (July 2026) Evidence-only. Lesson advances by `conceptIndex` with a single `practicePrompt` / option radiogroup per screen; Continue stays disabled until `canContinueApaConcept` (`feedbackSeen`). Source + state-machine tests in `module9-wp006-apa-learning.test.js` (cases 2–3, 7–8, reconciliation). No product-code change.

**Resolved in commit:** (this commit)

---

### WP-040 — Module 9 quiz feedback reports correctness without teaching

- **Module:** 9
- **Screen or area:** APA quiz feedback states
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Feedback primarily reports correct/incorrect. Master Spec recommends feedback that teaches — e.g., “APA uses double spacing because it improves readability and leaves room for instructor comments.”

**Why it matters educationally:** Students should finish every interaction knowing more than when they started.

**Why it matters technically or operationally:** Feedback strings can be expanded without changing quiz logic.

**Recommended smallest reasonable fix:** Replace binary feedback with one-sentence teaching explanations per answer.

**Verification steps:**
1. Answer quiz questions correctly and incorrectly.
2. Confirm each feedback state includes a teaching explanation.

**Related files:** `lib/module9/module9ApaLearning.js`; `components/module9/ModuleNineApaLesson.jsx`; `tests/module9-wp006-apa-learning.test.js`

**Resolution notes:** (July 2026) Evidence-only. Every option carries multi-sentence teaching `feedback`; UI shows concept copy under “That works.” / “Let’s look closer.” (`module9-apa-feedback`). `everyOptionHasTeachingFeedback` rejects binary-only strings; tests 5–6 + reconciliation enforce >20 chars and non-“correct/incorrect”-only messaging. No product-code change.

**Resolved in commit:** (this commit)

---

### WP-041 — Module 9 formatting page lacks “do not rewrite” coaching

- **Module:** 9
- **Screen or area:** Formatting screen
- **Priority:** High
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** The formatting page is largely successful but does not explicitly tell students what to change vs leave alone. Students may rewrite content when they should only adjust formatting.

**Why it matters educationally:** One sentence — “Do NOT rewrite your paper here. Only change formatting.” — prevents costly mistakes.

**Why it matters technically or operationally:** Copy-only change with high impact.

**Recommended smallest reasonable fix:** Add prominent coaching distinguishing formatting changes from content changes.

**Verification steps:**
1. Open Module 9 formatting page.
2. Confirm “do not rewrite” guidance is visible before actions.

**Related files:** `components/ModuleNine.js`; `lib/module9/module9ApaLearning.js`; `tests/module9-wp041-do-not-rewrite-coaching.test.js`

**Resolution notes:** (July 2026) Already satisfied—no duplicate instructional prose. Guided and unguided share Step 2 (`!guidedMode || viewedStep === 2`): “changing how it looks—not rewriting your essay” (`module9-do-not-rewrite-coaching`) precedes Open Google Doc and the Format checklist step in source order. Reinforced by `MODULE9_APA_ENTRY.framing` and the formatting-vs-rewriting APA concept. Test id + focused regression only.

**Resolved in commit:** (this commit)

---

### WP-042 — Module 9 export button uses technical “Export” language

- **Module:** 9
- **Screen or area:** Export Final Draft to Google Docs button
- **Priority:** Medium
- **Category:** Copy / Voice
- **Status:** Resolved

**Walkthrough observation:** Current label “Export Final Draft to Google Docs” uses technical vocabulary. Master Spec recommends “Create My Final Google Doc” or “Update My Final Google Doc.”

**Why it matters educationally:** Students think in documents, not exports.

**Why it matters technically or operationally:** Label should reflect doc state (create vs update). Align with Module 8 button vocabulary (WP-011).

**Recommended smallest reasonable fix:** Rename button based on whether a submission document exists. Use Create/Update language consistently.

**Verification steps:**
1. Open Module 9 export with no prior doc; confirm “Create” label.
2. Open with existing doc; confirm “Update” label.

**Related files:** `components/ModuleNine.js`; `components/exports/SubmissionDocRecoveryPanel.jsx`; `lib/exports/submissionDocRecovery.js`; `tests/module9-wp042-create-update-doc-labels.test.js`

**Resolution notes:** (July 2026) Already satisfied—no copy/workflow change. Legacy “Export Final Draft to Google Docs” removed; Module 9 uses shared `SubmissionDocRecoveryPanel` with `hasUrl={!!exportUrl}`, verification, and Create/Update/Create-new handlers. Labels from `getRecoveryActionLabel`: Create your Google Doc / Update Google Doc / Create a new Google Doc (+ busy variants). Aligns with Module 8 recovery vocabulary. Focused regression `module9-wp042-create-update-doc-labels.test.js`.

**Resolved in commit:** (this commit)

---

### WP-043 — Module 9 lacks visual screenshots for APA and PDF steps

- **Module:** 9
- **Screen or area:** APA guide, formatting, PDF download screens
- **Priority:** High
- **Category:** Instructional / Visual Design
- **Status:** Resolved

**Walkthrough observation:** Module 9 should rely heavily on screenshots (correct title page, references, spacing, page numbers, PDF export menu). Currently visual examples are insufficient.

**Why it matters educationally:** Students learn formatting visually, especially at ages 13–14.

**Why it matters technically or operationally:** Requires image assets and wider layout (WP-005). Screenshots should be bundled with Quick Guide (WP-038).

**Recommended smallest reasonable fix:** Add screenshot pairs (correct/incorrect where helpful) for each APA element and the PDF download path.

**Verification steps:**
1. Confirm each APA concept has at least one screenshot.
2. Confirm PDF page shows File → Download → PDF menu path visually.

**Related files:** `components/module9/ModuleNineApaVisual.jsx`; `components/module9/ModuleNinePdfDownloadVisual.jsx`; `components/ModuleNine.js`; `tests/module9-wp043-visual-models.test.js`

**Resolution notes:** (July 2026) APA concept visuals already covered by code-native `ModuleNineApaVisual` (preserved). Added `ModuleNinePdfDownloadVisual` schematic File → Download → PDF Document (.pdf) menu for Step 4, placed with download instructions before the file upload control. Accessible figure/figcaption/`role="img"`; no remote images; overflow-safe max width for ~390px. No upload/progression changes. Focused tests cover APA coverage + PDF visual placement.

**Resolved in commit:** (this commit)

---

### WP-044 — Module 9 upload page lacks explicit step-by-step coaching

- **Module:** 9
- **Screen or area:** PDF upload screen
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Upload functions correctly but needs stronger coaching. The choose-file → locate → open → upload → confirmation flow should not remain implicit.

**Why it matters educationally:** First-time submitters do not know the upload ritual. Explicit steps reduce failure.

**Why it matters technically or operationally:** Numbered steps and optional screenshot; no upload logic change.

**Recommended smallest reasonable fix:** Add numbered upload steps matching the Master Spec flow.

**Verification steps:**
1. Walk upload page with a novice tester.
2. Confirm steps are numbered and match actual upload flow.

**Related files:** `components/ModuleNine.js`; `tests/module9-wp044-upload-coaching.test.js`

**Resolution notes:** (July 2026) Step 4 separates **Download your Google Doc as a PDF** from always-visible **Upload your PDF** coaching (`module9-pdf-upload-coaching`): Choose file control → Locate PDF → Open → check Selected / Upload Final PDF → wait for confirmation. Placed after WP-043 download visual and before file input. Upload handlers, accept types, and Selected feedback unchanged. WP-045/046 not included.

**Resolved in commit:** (this commit)

---

### WP-045 — Module 9 upload lacks wrong-PDF reassurance

- **Module:** 9
- **Screen or area:** PDF upload screen
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Students worry about uploading the wrong PDF before the deadline. The application does not address this fear.

**Why it matters educationally:** One reassurance sentence prevents paralysis: students can re-upload the correct PDF.

**Why it matters technically or operationally:** Copy-only addition near upload button.

**Recommended smallest reasonable fix:** Add: “If you accidentally upload the wrong PDF before the deadline, simply upload the correct one.”

**Verification steps:**
1. Open upload screen.
2. Confirm wrong-PDF reassurance is visible.

**Related files:** `components/ModuleNine.js`; `tests/module9-wp045-wrong-pdf-reassurance.test.js`

**Resolution notes:** (July 2026) Copy-only reassurance (`module9-wrong-pdf-reassurance`) placed immediately before the file control / Upload Final PDF actions. Wording was reconciled with actual submission policy: `final-pdf` uses `replaceExisting: false` and returns HTTP 409 “Final PDF already submitted,” and Module 9 success already tells students to contact their teacher before changing or resubmitting. Therefore the UI does **not** use the Master Spec / issue-log sentence that a student can “simply upload the correct one” after submission. Supported path: reselect with the file control before upload; after upload, contact the teacher. No API, storage, replacement, progression, checklist, or success-page changes.

**Resolved in commit:** (this commit)

---

### WP-046 — Module 9 final upload checklist missing

- **Module:** 9
- **Screen or area:** Pre-upload verification area
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Resolved

**Walkthrough observation:** Before upload, students should verify: PDF opens correctly, title page appears, references page appears, everything is double spaced, this is the newest essay.

**Why it matters educationally:** Checklist confirmations create confidence at the highest-stakes moment.

**Why it matters technically or operationally:** UI checklist before upload button; aligns with WP-035.

**Recommended smallest reasonable fix:** Add five-item pre-upload checklist students acknowledge before upload is enabled.

**Verification steps:**
1. Open upload screen.
2. Confirm five-item checklist appears before upload.

**Related files:** `components/ModuleNine.js`; `tests/module9-wp046-final-upload-checklist.test.js`

**Resolution notes:** (July 2026) Added Step 4-only `finalUploadChecklistState` (session-local, five items) with `module9-final-upload-checklist`, visually distinct from Step 3’s persisted APA `CHECKLIST_ITEMS`. Selected filename appears before the final checklist; checkboxes stay disabled until a valid PDF is selected; confirmations reset on clear/reject/new selection. `canUpload` and `handleUploadPDF` both require all five checks. Upload failures keep the selected file and confirmations for retry. No Step 3, API, replacement policy, WP-045, or WP-047 changes.

**Resolved in commit:** (this commit)

---

### WP-047 — Module 9 legacy submission flow feels LMS-like

- **Module:** 9
- **Screen or area:** Full Module 9 journey (quiz → export → format → PDF → upload → complete)
- **Priority:** High
- **Category:** UX / Flow
- **Status:** Needs Verification

**Walkthrough observation:** Module 9 should feel like a teacher walking beside a student through the final minutes before submission. Instead it feels like an LMS quiz and checklist — narrow layout, test-first APA, duplicated export, and transactional screens.

**Why it matters educationally:** The final module determines whether students leave thinking “I know how to do this” vs “I managed to get through it.”

**Why it matters technically or operationally:** Fixing WP-005, WP-006, WP-004, and WP-047 together modernizes Module 9 without changing submission workflow architecture.

**Recommended smallest reasonable fix:** Re-sequence Module 9 as teach → prepare doc (verify, not duplicate) → format with guide → PDF with screenshots → upload with checklist → celebratory completion. Remove LMS quiz framing.

**Verification steps:**
1. Complete Module 9 end-to-end.
2. Confirm flow feels instructional, not assessive.
3. Confirm no step duplicates Module 8 without clear purpose.

**Related files:** `components/ModuleNine.js`; `components/module9/ModuleNineApaLesson.jsx`; `lib/module9/module9ApaLearning.js`; `tests/module9-wp047-teacher-guided-flow.test.js`

**Resolution notes:** (July 2026) Presentation/flow refinement only—architecture preserved. Removed student-facing Guided mode and all-steps branch; one `viewedStep` sequence with resume-to-earliest-incomplete hydration. Removed student-facing scores / first-try / pass-fail framing while keeping `module9_quiz` score persistence and teacher analytics. Softened transactional headings to warm action labels; compact `module9-journey-progress` indicator. Consolidated duplicated APA-complete scoring panel; entry copy stays in `ModuleNineApaLesson`. Verified-Doc reuse + recovery panel unchanged; WP-038–046 content preserved. Automated suites green. Bounded browser verified Step 1 journey labels (no Guided mode / no first-try copy) at 390×844 and 1440×900 without horizontal overflow—did **not** complete a full student walkthrough of Steps 2–4 / success, so status is **Needs Verification** pending that human e2e judgment.

**Resolved in commit:** (this commit)

---

### WP-048 — Four-question screen contract not met (especially how + finished)

- **Module:** App-wide (most acute in Modules 6–9)
- **Screen or area:** All student-facing task screens
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Needs Verification

**Walkthrough observation:** Every screen should answer: What am I doing? Why am I doing it? How do I do it successfully? How do I know I’m finished? Questions 3 and 4 are especially weak — students are told to revise/write/format without coaching or success criteria.

**Why it matters educationally:** The four-question contract is the application’s core instructional scaffold. Missing answers produce the “lost” feeling observed multiple times.

**Why it matters technically or operationally:** Shared screen template with four sections would enforce compliance across modules.

**Recommended smallest reasonable fix:** Add a reusable four-question header/footer component. Audit Modules 6–9 first.

**Verification steps:**
1. Sample five screens per module (6–9).
2. Score each against the four questions.
3. Fail if any question lacks a visible answer.

**Related files:** `components/module6/ModuleSixStepFrame.jsx`; `components/shared/ScreenContractCues.jsx`; `components/shared/screenContractHelpers.js`; `tests/wp048-four-question-screen-contract.test.js`

**Resolution notes:** (July 2026) First Modules 6–9 pass only—not app-wide complete. Phase A audit (in the focused test matrix) found purpose/finished often lived only inside collapsed `Why this matters` / `Self-check` disclosures; Module 7 read-aloud had empty purpose/finished; Module 8 Ready’s success cue was a reflective question; Module 6 whole-draft review had no `successLooksLike` (purpose/how visible; finished only hinted in the guide rail). Phase B: enhanced shared `ModuleSixStepFrame` + `ScreenContractCues` so a concise purpose and “You’re ready when…” are always visible; how stays in `jobRightNow` (M6) or `howToSucceed`/coaching (M7–8); review stage uses `getModule6ReviewPresentation()`; deeper lines/examples remain collapsed without duplicating the visible lines. Module 9 uses journey-step contract copy without restoring Guided/scores. Status remains **Needs Verification** because the issue is app-wide and representative states outside Modules 6–9 were not audited.

**Resolved in commit:** (this commit)

---

### WP-049 — Students must search sidebar instead of seeing artifacts pulled forward

- **Module:** App-wide (most acute in Modules 6–7)
- **Screen or area:** Drafting and revision workspaces with sidebars
- **Priority:** High
- **Category:** UX / Cognitive Load
- **Status:** Needs Verification

**Walkthrough observation:** Students must search for quotations, thesis, paragraph plan, and conclusion plan in the sidebar. The application already knows this information but does not bring it into the working area.

**Why it matters educationally:** Searching increases cognitive load and contradicts “the application should never ask students to remember something it already knows.”

**Why it matters technically or operationally:** Artifact surfacing is a layout concern. Data is already persisted.

**Recommended smallest reasonable fix:** Auto-display task-relevant artifacts in the primary workspace. Demote sidebar to collapsed reference.

**Verification steps:**
1. Open drafting/revision pages without opening the sidebar.
2. Confirm all task-relevant artifacts are visible in the working area.

**Related files:** `components/shared/TaskRelevantArtifacts.jsx`; `lib/module6/taskRelevantArtifacts.js`; `components/ModuleSix.js`; `components/ModuleSeven.js`; `components/module6/ModuleSixReferenceShelf.jsx`; `components/module7/ModuleSevenReferenceShelf.jsx`; `tests/wp049-task-relevant-artifact-pull-forward.test.js`

**Resolution notes:** (July 2026) Modules 6–7 first pass only—not app-wide complete. Added pure `selectTaskRelevantArtifacts` + `TaskRelevantArtifacts` desk before drafting/revision textareas. Pull-forward precedence: thesis from outline/thesisText; body claim/evidence/reasoning from the active `outline.body[bodyIndex]` (paragraph-plan ordinal or explicit index only when stored); conclusion notes from `outline.conclusion`; review/final-review = compact thesis only; read-aloud = no desk wall. Full shelves demoted to collapsed **More saved work**. Need Help no longer duplicates thesis/outline cards already on the desk. Status remains **Needs Verification** because the issue is app-wide and Modules outside 6–7 were not audited.

**Resolved in commit:** (this commit)

---

### WP-050 — Visual hierarchy treats all page elements with equal weight

- **Module:** App-wide
- **Screen or area:** All student-facing pages
- **Priority:** High
- **Category:** Visual Design
- **Status:** Needs Verification

**Walkthrough observation:** Many pages feel bland because instructions, buttons, examples, references, sidebars, text boxes, and helper text share nearly identical visual weight. Students must decide what matters instead of being guided.

**Why it matters educationally:** Visual hierarchy is instruction. The interface should teach where to look: start here → now look here → now do this → now continue.

**Why it matters technically or operationally:** Implement five-level information hierarchy (current task, objective, instruction, student work, reference) from Part 7A.

**Recommended smallest reasonable fix:** Apply consistent type scale, spacing, and card treatment so reference material never competes with the current task.

**Verification steps:**
1. Review sample pages from each module against five-level hierarchy.
2. Confirm current task is the largest element on each page.

**Related files:** `lib/ui/hierarchyContract.js`; `components/module6/ModuleSixStepFrame.jsx`; `components/shared/ScreenContractCues.jsx`; `components/shared/TaskRelevantArtifacts.jsx`; `components/ModuleSix.js`; `components/ModuleSeven.js`; `components/ModuleEight.js`; `components/ModuleNine.js`; `tests/wp050-five-level-visual-hierarchy.test.js`

**Resolution notes:** (July 2026) Modules 6–9 pilot only—not app-wide visual acceptance. Shared `hierarchyContract` tokens + `data-hierarchy-level` markers strengthen L1 task headings, quiet L2 objective cues, soften L3 instruction (JobRightNow/strategy), keep L4 desk quieter than active work surfaces, demote L5 shelves/guides, and make Keep going / Finish / Upload Final PDF dominate adjacent Back/Save actions—without adding five cards or a louder color system. Module 9 module chrome demoted so journey-step tasks win. Status remains **Needs Verification** pending broader app visual judgment.

**Resolved in commit:** (this commit)

---

### WP-051 — Most screens lack visible success criteria (“How do I know I’m finished?”)

- **Module:** App-wide
- **Screen or area:** Task screens across Modules 6–9
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Students often wonder whether they did enough to continue. Most screens lack explicit “You’re ready to continue when…” checklists.

**Why it matters educationally:** Certainty reduces anxiety and prevents both under- and over-working a task.

**Why it matters technically or operationally:** Finish checklists can be section 6 of the Module 6 pattern and a shared footer elsewhere.

**Recommended smallest reasonable fix:** Add three-to-five item success criteria before each Continue button.

**Verification steps:**
1. Audit Continue screens in Modules 6–9.
2. Confirm each has visible success criteria.

**Related files:** `components/shared/SuccessCriteriaPanel.jsx`; `components/ModuleSix.js`; `components/ModuleSeven.js`; `components/ModuleEight.js`; `components/module9/ModuleNineApaLesson.jsx`; `tests/wp051-visible-success-criteria.test.js`

**Resolution notes:** (July 2026) Modules 6–9 pass only. Added `SuccessCriteriaPanel` (“Before you continue”) after active work / before forward actions for Module 6 drafting/review and Module 7 read-aloud/revision/final-review using `successLooksLike` (review expanded to four observable prose checks; read-aloud aligned to recording + named observation gate). Module 8 Create clarifies the single verified-Doc gate; Format/Ready keep existing APA + confidence checklists without duplication. Module 9 APA micro-practice shows one feedback condition; Steps 3–4 keep existing checklists. WP-048 one-line finished cue retained; detailed panel deferred out of disclosures via `deferSuccessCriteria`. No new progression gates. Status **Needs Verification** (app-wide issue).

**Resolved in commit:** (this commit)

---

### WP-052 — Module transitions are mechanical, not psychological

- **Module:** App-wide (Modules 3–9 cited in Master Spec)
- **Screen or area:** Module entry and completion screens
- **Priority:** High
- **Category:** Navigation / Flow
- **Status:** Needs Verification

**Walkthrough observation:** Module transitions function mechanically but do not help students feel themselves changing roles (discovery → organization → planning → writing → revision → preparation → submission).

**Why it matters educationally:** Psychological transitions reduce anxiety and orient students to a new cognitive mode.

**Why it matters technically or operationally:** Transition cards are copy + light UI at module boundaries. Examples exist in Master Spec §29.

**Recommended smallest reasonable fix:** Add role-change transition cards at every module boundary using Master Spec examples as templates.

**Verification steps:**
1. Walk Modules 3–9 boundaries.
2. Confirm each boundary names what was accomplished and what role comes next.

**Related files:** `lib/transitions/moduleRoleTransitions.js`; `components/transitions/ModuleRoleTransitionCard.jsx`; Module 4 handoff + Module 4–6 success clients; `app/modules/{7,8,9}/success/page.js`; `tests/wp052-module-role-transitions.test.js`

**Resolution notes:** (July 2026) Modules 3–9 boundary pass. Shared transition model covers 3→4 … 8→9 plus Module 9 terminal celebration. **Reused** (no duplicate card): Module 4 handoff (3→4 destination-side), Module 4–6 staged success—wired to model copy + `data-testid="module-role-transition"`. **Card surfaces:** Module 7/8/9 success. Module 8 success no longer says “demonstrate” APA; states writing is finished and Module 9 is review/download/submit. Module 9 celebrates the transferable sequence (observing/analyzing → submitting). Module 3 files and paused architecture docs untouched. Status **Needs Verification** (app-wide; Module 3 source success path intentional untouched; browser coverage bounded).

**Resolved in commit:** (this commit)

---

### WP-053 — Action affordances mix buttons, hyperlinks, and plain text inconsistently

- **Module:** App-wide (especially Modules 8–9)
- **Screen or area:** All action surfaces
- **Priority:** High
- **Category:** UX
- **Status:** Needs Verification

**Walkthrough observation:** The application mixes buttons, hyperlinks, and plain text for actions. Students overlook hyperlinks and wonder what is clickable.

**Why it matters educationally:** Missed actions during submission prep are high-stakes.

**Why it matters technically or operationally:** Define primary, secondary, and reference button classes. Reserve hyperlinks for reference material only.

**Recommended smallest reasonable fix:** Convert action hyperlinks to buttons app-wide. Document button hierarchy in design system.

**Verification steps:**
1. Audit interactive elements on Modules 8–9.
2. Confirm actions are buttons; links are reference-only.

**Related files:** `lib/ui/hierarchyContract.js`; `lib/ui/openExternalResource.js`; `components/ModuleNine.js`; `app/modules/9/success/page.js`; `components/module8/ModuleEightReferenceShelf.jsx`; `components/module9/ModuleNineApaQuickGuide.jsx`; `docs/design-system-v1.md`; `tests/wp053-action-affordance-contract.test.js`

**Resolution notes:** (July 2026) Modules 8–9 verification pass. Taxonomy: primary / final / secondary / reference link / navigation. Converted already-submitted + Module 9 success “Open PDF/Doc” filled anchors to secondary `type="button"` retrieval actions via `openExternalResource`. Retained APA template/OWL/sample as `HIERARCHY_REFERENCE_LINK_CLASS` anchors. Module 8 WP-031 Create/Update/Open/Retry/Continue buttons unchanged. Documented affordances in `docs/design-system-v1.md`. Status **Needs Verification** (app-wide; browser coverage bounded).

**Resolved in commit:** (this commit)

---

### WP-054 — Progressive disclosure not applied on dense screens

- **Module:** App-wide
- **Screen or area:** Dense task screens (revision, formatting, quiz)
- **Priority:** Medium
- **Category:** UX / Cognitive Load
- **Status:** Needs Verification

**Walkthrough observation:** Many pages reveal everything at once instead of progressively disclosing coaching → relevant artifacts → task → textbox.

**Why it matters educationally:** Progressive disclosure is one of the strongest UX principles identified in the walkthrough.

**Why it matters technically or operationally:** Collapsible sections and stepwise UI reduce overwhelm without removing content.

**Recommended smallest reasonable fix:** Implement progressive disclosure pattern on the five densest screens per module, then standardize.

**Verification steps:**
1. Identify pages with more than four simultaneous content layers.
2. Confirm progressive reveal is implemented.

**Related files:** `lib/ui/progressiveDisclosureContract.js`; `components/shared/InstructionalDisclosure.jsx`; Module 6–9 frame/strategy/format/upload surfaces; `docs/design-system-v1.md`; `tests/wp054-progressive-disclosure-density.test.js`

**Resolution notes:** (July 2026) Modules 6–9 pilot. Density matrix in `progressiveDisclosureContract.js`. Shared `InstructionalDisclosure` (M7/M9 aliases). Remediated dense states: M7 intro/body/conclusion/final revision (tips/examples disclosed), M8 Create/Format/Ready (extended framing, APA-does, progress, reflection disclosed), M9 upload (detailed download/upload steps + file tips disclosed). Always visible retained: WP-048 cues, desk artifacts, success criteria, checklists, Doc recovery, PDF visual/input/filename/final checklist/Upload, reassurance. Status **Needs Verification** (app-wide; browser bounded).

**Resolved in commit:** (this commit)

---

### WP-055 — Feedback uses Correct/Incorrect without teaching

- **Module:** App-wide (pilot repair: Module 1 quiz; Modules 2 & 9 verified compliant; Module 3 excluded)
- **Screen or area:** Quiz and validation feedback
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Feedback often stops at “Correct” or “Incorrect” without explaining why. Master Spec §33 requires teaching through feedback.

**Why it matters educationally:** Feedback moments are teaching moments. Binary labels waste them.

**Why it matters technically or operationally:** String and template change across feedback components.

**Recommended smallest reasonable fix:** Extend feedback templates to always include a one-sentence teaching explanation.

**Verification steps:**
1. Trigger correct and incorrect feedback states.
2. Confirm each includes teaching content.

**Related files:** `components/ModuleOne.js`, `lib/module1/quizHelpers.js`, `lib/ui/teachingFeedbackContract.js`, `tests/wp055-teaching-feedback.test.js` (Module 2 / Module 9 product files unchanged when already compliant)

**Resolution notes:**
- Feedback audit matrix documented in `tests/wp055-teaching-feedback.test.js` (`WP055_FEEDBACK_AUDIT_MATRIX`): Module 1 active quiz repaired; Module 2 rhetorical lesson and Module 9 APA already have teaching feedback; Modules 4–8 lack comparable instructional quizzes; `components/ModuleSystem.js` is dormant/unmounted; Module 3 excluded; operational save/load/upload errors excluded from teaching rewrites.
- Module 1 content model extended with `correctFeedback` / `incorrectFeedback` on every `MODULE1_QUIZ_V2` item; UI uses `That works.` / `Let’s look closer.` plus explanation with `role="status"`, `aria-live="polite"`, `data-testid="quiz-item-feedback"`, and `data-feedback-correct` (neutral styling, not color-only).
- Questions, options, answers, order, `QUIZ_CONTENT_VERSION` (2), scoring, and persistence payload shape unchanged.
- Module 2 and Module 9 preserved (no product file edits required).
- Status remains Needs Verification (app-wide issue; Module 3 out of scope; browser coverage bounded).
- Browser: no listener on port 3000 during verification; Module 1 quiz and Module 9 APA were **not reached live**. Acceptance relies on unit/contract tests for this pass.

**Resolved in commit:**

---

### WP-056 — Insufficient mid-module progress celebration

- **Module:** App-wide (pilot pass: Modules 6–9 only)
- **Screen or area:** Between-task screens; section completions
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Completion pages are reasonably good, but progress is not celebrated throughout modules. Small celebrations (“Great — you’ve chosen your evidence. Now let’s explain why it matters.”) are missing.

**Why it matters educationally:** Small celebrations maintain motivation across a long workflow.

**Why it matters technically or operationally:** Short coach strings at stage transitions; no architecture change.

**Recommended smallest reasonable fix:** Add one-sentence celebration bridges at major step completions in Modules 6–9.

**Verification steps:**
1. Complete individual sections within modules.
2. Confirm celebratory bridge text appears between steps.

**Related files:** `components/shared/ProgressCelebrationBridge.jsx`, `lib/ui/moduleProgressCelebrations.js`, `components/ModuleSix.js`, `components/ModuleSeven.js`, `components/ModuleEight.js`, `components/ModuleNine.js`, `tests/wp056-mid-module-progress-celebrations.test.js`

**Resolution notes:**
- Transition audit matrix in `tests/wp056-mid-module-progress-celebrations.test.js` / `WP056_TRANSITION_AUDIT_MATRIX`.
- Contract: local `progressCelebration` only; `role="status"` + `aria-live="polite"`; concrete completed work + next job; no timer, persistence, activity event, confetti, or duplicate terminal success-page bridge.
- Representative messages: Module 6 intro→body (“Your introduction is drafted…”), Module 7 read-aloud (“You finished the read-aloud and named what you noticed…”), Module 8 Doc→Format (“Your Google Doc now has your verified finished essay…”), Module 9 APA→Doc (“You finished the APA learning moves…”).
- Positive triggers: successful forward navigation after gates/saves (M6 `persistAndNavigateStage` ok from `goNext`; M7 after read-aloud gate; M8 verified session / checklist complete; M9 fresh APA completion, verified Continue, checklist Continue).
- Suppressions: Back, Edit/escape hatch, failed save/verify/upload, blocked gates, hydration/WP-047 resume, already-submitted.
- Status remains Needs Verification (app-wide issue; Modules 6–9 scope; browser coverage bounded).
- Browser: no listener on port 3000 during verification; mid-module celebration bridges were **not reached live**. Acceptance relies on unit/contract tests for this pass.

**Resolved in commit:**

---

### WP-057 — “Never start from scratch” messaging missing after Module 2

- **Module:** App-wide (Modules 4–9 audited; Module 3 excluded; most acute 6–9)
- **Screen or area:** Drafting, revision, formatting, and submission screens
- **Priority:** Medium
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** After Module 2, students should almost never feel they are beginning from nothing. The walkthrough showed this philosophy is not reinforced consistently in later modules.

**Why it matters educationally:** This is perhaps the most important UX philosophy after the walkthrough. Students should constantly hear: “You’ve already done the hard thinking.”

**Why it matters technically or operationally:** Recurring copy theme tied to artifact surfacing (WP-049, WP-012).

**Recommended smallest reasonable fix:** Add “building on your work” messaging to Module 6 entry and repeat at revision and submission boundaries.

**Verification steps:**
1. Sample later-module screens for scratch-framing vs build-framing language.
2. Confirm build-framing dominates.

**Related files:** `lib/ui/buildForwardContract.js`, `components/ModuleFive.js`, `components/ModuleSix.js`, `components/ModuleSeven.js`, `components/ModuleEight.js`, `components/ModuleNine.js`, `lib/module9/module9ScreenContract.js`, `tests/wp057-never-start-from-scratch.test.js`

**Resolution notes:**
- Modules 4–9 build-forward audit matrix in `WP057_BUILD_FORWARD_AUDIT` / `tests/wp057-never-start-from-scratch.test.js`.
- Reused existing language: Module 4 success “not starting over,” Module 5 “plans you already completed,” Module 6 first-stage wording, Module 7 strength frame, Module 8 `module8-submission-doc-framing`, Module 9 Steps 1–2 screen contract.
- Smallest repairs: promote Module 6 first-stage framing into always-visible progress strip (removed Need Help-only InfoCallout duplicate); add Module 7 read-aloud always-visible line; refine Module 9 Steps 3–4 purpose for prior-artifact continuity; add stable build-forward test hooks (no second slogan panels).
- Distinct from WP-056 celebrations (completed step → next job).
- Status remains Needs Verification (app-wide; Module 3 excluded; browser bounded).
- Browser: no listener on port 3000 during verification; build-forward states **not reached live**.

**Resolved in commit:**

---

### WP-058 — Modules lack distinct psychological feel across the journey

- **Module:** App-wide (Modules 4–9 integrated; Module 3 model-only)
- **Screen or area:** Module entry experiences
- **Priority:** Medium
- **Category:** Instructional / UX
- **Status:** Needs Verification

**Walkthrough observation:** Modules should feel psychologically different (discovery, organization, planning, writing, revision, preparation, submission) even if visual skin stays consistent. Currently transitions do not create these distinct modes.

**Why it matters educationally:** Psychological differentiation helps students understand where they are in the writing process.

**Why it matters technically or operationally:** Achieved through entry copy, objectives, and minor visual cues — not full redesigns.

**Recommended smallest reasonable fix:** Define a one-line psychological mode label per module and display it on entry.

**Verification steps:**
1. Enter each module fresh.
2. Confirm mode label and coaching match the intended psychological stage.

**Related files:** `lib/ui/modulePsychologicalModes.js`, `components/shared/ModuleModeCue.jsx`, `components/ModuleFour.js`, `components/module5/ModuleFiveStepFrame.jsx`, `components/module6/ModuleSixStepFrame.jsx`, `components/ModuleSix.js`, `components/ModuleSeven.js`, `components/ModuleEight.js`, `components/ModuleNine.js`, `tests/wp058-module-psychological-modes.test.js`

**Resolution notes:**
- Mode matrix: Discovery (3) → Organization (4) → Planning (5) → Writing (6) → Revision (7) → Preparation (8) → Submission (9).
- Compact `module-mode-cue` always visible above the task/chrome; objective-level hierarchy; noninteractive; not a live region; not inside disclosures.
- Placement: ModuleFour workspace; ModuleFiveStepFrame; ModuleSixStepFrame via `psychologicalModule` for M6–8; ModuleNine journey header.
- Module 3 defined in pure model only; no Module 3 product edits.
- No contradictory entry-copy rewrites required after audit; cue kept distinct from WP-052/056/057 panels.
- Status remains Needs Verification (app-wide; Module 3 deferred; browser bounded).
- Browser: no listener on port 3000 during verification; modes **not reached live**.

**Resolved in commit:**

---

### WP-059 — Sidebar functions as storage instead of working notebook

- **Module:** App-wide (pilot: Modules 6–7)
- **Screen or area:** Sidebar across drafting and revision modules
- **Priority:** Medium
- **Category:** UX
- **Status:** Needs Verification

**Walkthrough observation:** The sidebar was originally treated as storage. The walkthrough established it should be an instructional notebook with the current task expanded and everything else collapsed.

**Why it matters educationally:** Students should instantly recognize “this is the information I need right now.”

**Why it matters technically or operationally:** Sidebar component needs task-aware expand/collapse behavior.

**Recommended smallest reasonable fix:** Implement notebook behavior: auto-expand current task artifacts, collapse all else by default.

**Verification steps:**
1. Open drafting and revision pages.
2. Confirm sidebar defaults to current-task view.

**Related files:** `lib/ui/workingNotebook.js`, `components/shared/WorkingNotebookCurrentPage.jsx`, `components/module6/ModuleSixReferenceShelf.jsx`, `components/module7/ModuleSevenReferenceShelf.jsx`, `components/ModuleSix.js`, `components/ModuleSeven.js`, `tests/wp059-working-notebook-sidebar.test.js`

**Resolution notes:**
- Surface audit (`WP059_SIDEBAR_SURFACE_AUDIT`): M6–7 working-notebook pilot; M4–5 planning/reference; M8 preparation reference; M9 quick guide.
- Contract: always-visible current-page index (labels from `selectTaskRelevantArtifacts`) + desk shows full notes (`Notebook page open on your desk`) + collapsed `More saved work` archive.
- Module 6 matrix: Intro / Body N / Conclusion / Whole-draft review. Module 7 matrix: Read aloud (full-draft context, not empty) / section revision / Final review.
- Artifact precedence unchanged (WP-049 selector reused; no second matcher). Student text not duplicated in the index.
- Status remains Needs Verification (app-wide; M6–7 scope; browser bounded).
- Browser: no listener on port 3000 during verification; notebook states **not reached live**.

**Resolved in commit:**

---

### WP-060 — Dense pages lack whitespace and instructional card chunking

- **Module:** App-wide
- **Screen or area:** Pages with long vertical forms
- **Priority:** Low
- **Category:** Visual Design
- **Status:** Open

**Walkthrough observation:** Many pages feel crowded despite relatively little information. Long uninterrupted vertical forms reduce readability.

**Why it matters educationally:** Students are willing to read if information is chunked into cards with breathing room.

**Why it matters technically or operationally:** Spacing and card components; aligns with Part 7A “cards instead of paragraphs.”

**Recommended smallest reasonable fix:** Increase vertical spacing and convert paragraph instructions to instructional cards on the ten densest pages.

**Verification steps:**
1. Review crowded pages identified in walkthrough.
2. Confirm card chunking and increased whitespace.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-061 — Instructional color semantics not applied application-wide

- **Module:** App-wide
- **Screen or area:** All instructional screens
- **Priority:** Medium
- **Category:** Visual Design
- **Status:** Open

**Walkthrough observation:** Color is discussed throughout the walkthrough but not applied consistently. Students should eventually recognize blue = instruction, green = student thinking, yellow = evidence, purple = writing, orange = revision, gray = reference.

**Why it matters educationally:** Color becomes another teacher when used consistently.

**Why it matters technically or operationally:** Requires design-system update and component adoption — not one-off page styling.

**Recommended smallest reasonable fix:** Define semantic color tokens in the design system and apply to instructional cards across Modules 6–9 first.

**Verification steps:**
1. Compare pages against semantic color table.
2. Confirm consistent role-to-color mapping.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-062 — Students feel lost on several screens

- **Module:** App-wide
- **Screen or area:** Multiple screens across Modules 6–9
- **Priority:** High
- **Category:** UX / Cognitive Load
- **Status:** Open

**Walkthrough observation:** Students experienced “I don’t know what this page wants” on several screens. Screens do not consistently answer: Where am I? What am I working on? How does this connect to prior work? What happens next?

**Why it matters educationally:** Lost students disengage or click through without learning.

**Why it matters technically or operationally:** Symptom of WP-048, WP-050, WP-051 combined. Fixing the four-question contract and visual hierarchy should resolve most cases.

**Recommended smallest reasonable fix:** Audit “lost” screens from walkthrough notes. Add orientation headers answering the four navigation questions.

**Verification steps:**
1. Re-run walkthrough on previously confusing screens.
2. Confirm no screen produces “I don’t know what this wants.”

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-063 — Planning supports do not fade naturally before drafting and revision

- **Module:** 5–7
- **Screen or area:** Draft assembly; Module 6 drafting; Module 7 revision views
- **Priority:** High
- **Category:** Instructional / Architecture
- **Status:** Open

**Walkthrough observation:** Roman numerals, outline labels, and planning prompts are correct during planning but should gradually disappear as students move toward drafting and revision. By Module 7, students should experience a real essay — not an outline wrapped around an essay (see also WP-001).

**Why it matters educationally:** Planning supports that overstay their welcome teach students the wrong genre. The student-facing essay must be distinct from the planning representation.

**Why it matters technically or operationally:** Reinforces the architectural principle that planning representation and writing representation are different objects.

**Recommended smallest reasonable fix:** Define a fade schedule: planning labels visible in Modules 4–5, absent from generated essay in Modules 6–7. Enforce at draft assembly layer.

**Verification steps:**
1. Trace outline labels through Modules 5 → 6 → 7.
2. Confirm labels are absent from student-facing essay text after assembly.

**Related files:** Not specified in Master Design Specification.

**Resolution notes:**

**Resolved in commit:**

---

### WP-064 — Students cannot reopen saved source texts during Module 3 analysis

- **Module:** 3 (ultimately all evidence-based modules)
- **Screen or area:** Module 3 analysis workflow; saved speech and letter working copies
- **Priority:** High
- **Category:** UX / Navigation
- **Status:** Resolved

**Walkthrough observation:** Students who close their saved speech or letter tabs have no way to reopen them from within Module 3. This interrupts the intended workflow of continually referencing evidence while analyzing quotations.

**Why it matters educationally:** Analysis depends on continual reference to the working source copies. Without one-click access to reopen saved texts, students lose the “look first, then write” habit and may invent or misremember quotations.

**Why it matters technically or operationally:** Saved source routes (`/texts/speech`, `/texts/letter`) already exist, but Module 3 does not surface a durable reopen control. The same gap will recur in later evidence-based modules unless access is provided consistently.

**Recommended smallest reasonable fix:** Add one-click controls in Module 3 to reopen the student’s saved speech and letter working copies. Design the pattern so it can be reused across all evidence-based modules, not only Module 3.

**Verification steps:**
1. Complete Module 2 with both sources saved.
2. Open Module 3 and open the saved speech and letter tabs, then close those tabs.
3. Confirm Module 3 provides a clear one-click way to reopen each saved copy.
4. Confirm the reopened pages show the persisted working copies.
5. Confirm the same reopen pattern remains available (or is planned) for later evidence-based modules.

**Related files:** `components/ModuleThreeV2Form.jsx`; `components/sources/ReopenSourceTextsControl.jsx`; `lib/sources/openSavedSourceTexts.js`

**Resolution notes:** Fully verified through walkthrough testing (July 2026). Reopen Source Texts opens both saved working copies. Closing both source windows causes the control to reappear. Reopening focuses/reopens the saved copies correctly. No duplicate windows are created. The control hides while both managed source windows remain open. Student observations, selections, notes, and autosaved work remain intact. Refresh preserves all work. Reopened windows display the persisted working copies rather than blank or original pages.

**Resolved in commit:** (navigation-only fix; closed after walkthrough verification)

---

### WP-065 — Transition Module 6 from outline language to writing language

- **Module:** 6
- **Screen or area:** Drafting workspace label above each section textbox
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** After WP-001 fixed assembled-essay rendering in Modules 7–8, Module 6 drafting still showed outline-oriented labels such as “I. Introduction” and “II. King uses emotional appeals…” above the writing textbox. Students felt they were filling an outline rather than drafting an essay.

**Why it matters educationally:** Module 6 is the transition from planning to writing. Drafting chrome should use writing language (Introduction, Body Paragraph 1, Conclusion) so students experience the workspace as essay writing, not outline completion.

**Why it matters technically or operationally:** Presentation-only change. Section order, autosave, persistence, shelves, and Modules 5/7/8/9 must remain unchanged. Planning labels stay on the outline shelf.

**Recommended smallest reasonable fix:** Replace the Module 6 drafting textbox label with writing-oriented labels; leave `buildDraftSectionSteps` titles and shelf/outline rendering untouched.

**Verification steps:**
1. Open Module 6 with a multi-body outline.
2. Confirm each drafting textbox label uses writing language (no Roman numerals; no claim/bucket titles).
3. Confirm the left shelf still shows the outline with Roman numerals and bucket titles.
4. Confirm drafting, autosave, and section navigation still work.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`

**Resolution notes:** Fully verified through manual walkthrough testing (July 2026). Module 6 drafting labels now use writing language (Introduction, Body Paragraph 1, Body Paragraph 2, Conclusion). Outline shelf still shows Roman numerals (planning representation preserved). Autosave persisted across refresh. WP-001 Read Aloud prose-only behavior remained intact. Module 8 continued to function normally. No persistence or export regressions. Follow-up consistency for Module 7 revision labels logged as WP-066.

**Resolved in commit:** (presentation-only fix; closed after manual verification)

---

### WP-066 — Align Module 7 revision labels with Module 6 writing language

- **Module:** 7
- **Screen or area:** Revision workspace label above each section textbox
- **Priority:** Medium
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** After WP-065, Module 6 drafting uses writing labels (Introduction, Body Paragraph 1, Conclusion), but Module 7 revision pages still show outline-oriented labels such as “II. Conclusion” above revision textboxes. Not a WP-065 failure—scope was Module 6 only—but the writing experience is now inconsistent across drafting and revision.

**Why it matters educationally:** Students moving from Module 6 to Module 7 should continue feeling they are revising an essay, not returning to outline language. Matching writing-oriented labels preserves the planning-vs-writing separation established by WP-001 and WP-065.

**Why it matters technically or operationally:** Presentation-only enhancement. Outline shelves, draft maps, and planning artifacts should remain unchanged. Same pattern as `getModule6DraftingLabel()` can likely be reused or mirrored for Module 7 revision chrome.

**Recommended smallest reasonable fix:** Simplify Module 7 revision textbox labels to match Module 6 writing language (Introduction, Body Paragraph N, Conclusion). Leave outline shelves and planning artifacts unchanged.

**Verification steps:**
1. Open Module 7 revision for intro, body, and conclusion sections.
2. Confirm labels use writing language with no Roman numerals or bucket titles above the textbox.
3. Confirm the Module 7 shelf/draft map still shows planning outline language.
4. Confirm revision, autosave, and Read Aloud prose-only behavior still work.

**Related files:** `components/ModuleSeven.js`; `components/ModuleSix.js`; `components/module6/module6StepPresentation.js` (`getWritingSectionLabel`)

**Resolution notes:** Fully verified through manual walkthrough testing (July 2026). Module 6 and Module 7 now share the same writing labels via `getWritingSectionLabel()`. Drafting and revision textareas display Introduction, Body Paragraph 1, Body Paragraph 2, …, Conclusion. Roman numerals have been removed from writing surfaces. Planning artifacts (left shelf, outline, and draft map) continue to display Roman numerals and outline labels. Read Aloud remains prose only. No regressions were observed in navigation, revision flow, or persistence during walkthrough verification.

**Resolved in commit:** (presentation-only fix; closed after manual verification)

---

### WP-067 — Module 8 completion does not advance progress to Module 9

- **Module:** 8
- **Screen or area:** In-module “Continue to Module 9” success panel (after Google Doc + checklist)
- **Priority:** Critical
- **Category:** Persistence / Gate
- **Status:** Resolved

**Walkthrough observation:** After completing Module 8 (Google Doc created/updated, APA checklist complete, Ready), clicking Continue to Module 9 navigated to `/modules/9`, but the Module 9 gate rejected entry with “Finish Module 8 before starting Module 9.” Developer Panel showed `current_module: 8`.

**Why it matters educationally:** Students believe they finished Module 8 and are blocked at the next door with no clear recovery. Trust in progress and submission flow breaks.

**Why it matters technically or operationally:** The WP-002 in-module locked success panel used a plain `<Link href="/modules/9">`, bypassing `/modules/8/success` and `advanceCurrentModuleOnSuccess`. Navigation succeeded without persisting progress.

**Recommended smallest reasonable fix:** On Continue, call `advanceCurrentModuleOnSuccess({ completedModuleNumber: 8 })`, confirm the write, then navigate to Module 9. Reuse the existing production progress helper (same as other module success pages).

**Verification steps:**
1. Reset Student; Seed Complete Essay; open Module 8.
2. Create/Update Google Doc; complete checklist until Ready.
3. Click Continue to Module 9.
4. Confirm Developer Panel `current_module` is 9 and Module 9 loads without the Module 8 gate message.

**Related files:** `components/ModuleEight.js`; `lib/supabase/helpers/studentAssignments.ts` (`advanceCurrentModuleOnSuccess`); `app/modules/8/success/page.js`

**Resolution notes:** (July 2026) Completion routes through `/modules/8/success`, which calls `advanceCurrentModuleOnSuccess` for completed module 8 before Continue to Module 9. Verified in live walkthrough: Module 8 success page is shown; Continue advances correctly; `current_module` becomes 9; Module 9 opens normally with no gating or redirect issues.

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-068 — Module 8 revisit completion bypasses dedicated success page

- **Module:** 8
- **Screen or area:** Completion / transition to Module 9
- **Priority:** High
- **Category:** Navigation / Flow
- **Status:** Resolved

**Walkthrough observation:** First-time Module 8 completion routed through `/modules/8/success`. Previously finalized / Seed Complete Essay revisits showed an in-module success panel and navigated straight to Module 9, skipping the dedicated success screen.

**Why it matters educationally:** Students should get one consistent celebration and transition before Module 9, whether first visit or revisit after a required Google Doc refresh.

**Why it matters technically or operationally:** WP-002’s `previouslyFinalized` path set `locked` and used a direct Module 9 continue handler, diverging from `finishPreparing` → `/modules/8/success`.

**Recommended smallest reasonable fix:** When revisit requirements are met (this-visit export + checklist), navigate to the existing Module 8 success page. Keep progress advance on that page (WP-067). Do not change export or checklist gates (WP-002).

**Verification steps:**
1. First-time path: Finish preparing → confirm `/modules/8/success` → Continue to Module 9.
2. Revisit path: Reset; Seed Complete Essay; Module 8; Create/Update Doc; complete checklist → confirm `/modules/8/success` before Module 9.
3. Confirm `current_module` advances to 9 from the success page.

**Related files:** `components/ModuleEight.js`; `app/modules/8/success/page.js`

**Resolution notes:** (July 2026) Revisit completion now `router.push("/modules/8/success")` once `previouslyFinalized && docVerifiedThisSession && checklistComplete` (one-shot via ref). Removed direct Module 9 advance from the in-module panel; any residual locked Continue also goes to the success page. WP-002 session export and success-page `advanceCurrentModuleOnSuccess` unchanged. Verified in live walkthrough: seeded/revisit completion routes through `/modules/8/success`; success page displays correctly; Continue proceeds into Module 9; shared completion flow works as intended.

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-069 — Improve Module 9 final success screen

- **Module:** 9
- **Screen or area:** `/modules/9/success` after final PDF submission
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** The Module 9 success screen confirmed submission but read like a generic dialog. Links were primary; students were not clearly told what happened, what each button was for, or whether anything else was required.

**Why it matters educationally:** This is the end of the Writing Processor. A 13–14 year old needs closure, reassurance that the PDF was submitted, and clear next steps—not a bare “Success!” with unlabeled actions.

**Why it matters technically or operationally:** Presentation and copy only. Submission logging, progress advance, and document link loading must stay unchanged.

**Recommended smallest reasonable fix:** Rewrite copy in teacher voice; lead with submission confirmation; label each action (PDF, Google Doc, Dashboard); note records-keeping and “contact teacher before resubmitting”; end with a celebration of completing the Writing Processor.

**Verification steps:**
1. Complete Module 9 PDF upload and land on the success page.
2. Confirm a student can answer: Was it submitted? What are these buttons for? Anything else to do? What happens next?
3. Confirm Open PDF, Open Google Doc, and Back to Dashboard still work.

**Related files:** `app/modules/9/success/page.js`

**Resolution notes:** (July 2026) Success page rewritten with confirmation-first hierarchy, labeled actions with short explanations, teacher-contact guidance, and a closing celebration. No changes to `logActivity`, `advanceCurrentModuleOnSuccess`, or document fetch logic. Verified in live walkthrough: updated completion copy is clear for middle school students; all buttons function correctly; final screen clearly communicates that submission is complete; student expectations are clear.

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-070 — Unlock to Test does not restore Module 7 editing

- **Module:** 7
- **Screen or area:** Finalized Module 7 revision workspace; development-only Unlock to Test control
- **Priority:** Critical
- **Category:** Bug / Dev tooling
- **Status:** Resolved

**Walkthrough observation:** After finalizing Module 7, Unlock to Test did not restore editable revision fields. The essay stayed read-only, blocking WP-002 verification that requires revising text before export.

**Why it matters educationally:** Development-only, but it blocks walkthrough verification of submission trust (WP-002).

**Why it matters technically or operationally:** Unlock only flipped local `locked` state. Overlapping Module 7 loads could re-apply `final_ready` locking, and unlock left testers on Read Aloud (prose-only), so no drafting field appeared editable.

**Recommended smallest reasonable fix:** Dev-only unlock that (1) sets a session flag so late loads cannot re-lock, (2) clears the UI lock, and (3) moves to the first revision textarea. Production finalize behavior unchanged.

**Verification steps:**
1. Finalize an essay in Module 7.
2. Return to Module 7 and click Unlock to Test.
3. Type into a revision field.
4. Save revision successfully.
5. Confirm the new text persists after reload.

**Related files:** `components/ModuleSeven.js`

**Resolution notes:** (July 2026) Unlock to Test (development only) now sets `devUnlockedForTestingRef` so overlapping loads cannot re-apply `final_ready` lock, clears UI lock, and navigates from Read Aloud to the first revision field. Save revision still clears `final_ready` / updates `full_text` as before. Production students never see the control. Verified in live walkthrough (July 10, 2026) during WP-002 verification: Unlock to Test restored editing; marker text could be inserted, saved, and finalized.

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-071 — Module 8 always shows Create when a Google Doc already exists

- **Module:** 8
- **Screen or area:** Google Doc creation/export step (working-set label and primary action)
- **Priority:** Medium
- **Category:** Copy / UX
- **Status:** Resolved

**Walkthrough observation:** After a Google Doc already existed for the assignment, Module 8 still presented “Create your Google Doc,” which suggested a brand-new document would always be made.

**Why it matters educationally:** Students need accurate action language during submission prep. “Create” when a doc already exists increases anxiety and confusion about which paper is authoritative.

**Why it matters technically or operationally:** Wording only. Existence is already known via `submissionDocUrl` / `exported_docs`; export and session verification gates are unchanged.

**Recommended smallest reasonable fix:** When a submission Google Doc link is already present, show “Update your Google Doc” for the working-set label and primary button; otherwise keep “Create your Google Doc.”

**Verification steps:**
1. Reset Student.
2. Seed Complete Essay.
3. Export a Google Doc.
4. Return to Module 8.
5. Confirm the primary control reads “Update your Google Doc.”

**Related files:** `components/ModuleEight.js`; `components/module8/module8StepPresentation.js`

**Resolution notes:** (July 2026) `getModule8StepPresentation` now accepts `hasExistingDoc` from `submissionDocUrl`. Working-set label/description and the unverified existing-doc primary button use “Update your Google Doc.” No export, gating, or persistence changes. Verified in live walkthrough (July 10, 2026): after an existing export, Module 8 primary control read “Update your Google Doc.”

**Resolved in commit:** (closed after live walkthrough verification)

---

### WP-072 — Module 9 introduction lacks submission-prep coaching

- **Module:** 9
- **Screen or area:** Module 9 header / introductory instructional copy
- **Priority:** High
- **Category:** Instructional / Copy
- **Status:** Resolved

**Walkthrough observation:** Module 9 felt abrupt. Students were presented with APA work without enough context that the essay is already written, they are not writing another essay, they are preparing what they already wrote for submission, and APA changes how the paper looks—not what it says.

**Why it matters educationally:** Younger students need explicit framing before submission tasks so they do not treat Module 9 as another writing assignment.

**Why it matters technically or operationally:** Presentation-only copy on the Module 9 intro surface. No export, upload, quiz, checklist, API, or persistence changes.

**Recommended smallest reasonable fix:** Rewrite the Module 9 introduction so students understand: essay finished; preparing for submission (not rewriting); APA changes appearance; four simple steps follow.

**Verification steps:**
1. Open Module 9 as a student entering after Module 8.
2. Confirm intro copy states the essay is finished and this module is submission prep.
3. Confirm APA is framed as appearance, not new ideas.
4. Confirm the four steps are listed before work begins.

**Related files:** `components/ModuleNine.js`

**Resolution notes:** (July 2026) Implemented as presentation-only Module 9 header copy (essay already finished; preparing for submission; APA changes appearance; four steps: checklist → quiz → Google Doc → download/upload PDF). Originally mis-logged under WP-012; reassigned to WP-072 after audit (July 10, 2026). Implementation present in codebase; closed as Resolved for the Module 9 intro coaching scope.

**Resolved in commit:** (presentation-only; closed after audit confirmed implementation exists)

---

### WP-073 — Module 6 drafting pages need explicit “Your job right now” writing steps

- **Module:** 6
- **Screen or area:** Introduction, body, and conclusion drafting pages
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** Module 6 showed planning artifacts (thesis, outline, examples) but still felt like a reference page. A first-time eighth grader could still ask “What do I type first?” because coaching explained concepts without directing the next writing move.

**Why it matters educationally:** Students should not have to infer the drafting process from multiple cards. Each page should walk them through writing that section like a teacher beside them.

**Why it matters technically or operationally:** Presentation-only. Persistence, navigation, and drafting logic stay unchanged.

**Recommended smallest reasonable fix:** Add a prominent “Your job right now” section immediately before the drafting textarea with short numbered steps for introduction, body, and conclusion that reference the thesis and outline cards.

**Verification steps:**
1. Walk Introduction, one body section, and Conclusion.
2. At each page ask whether a first-time eighth grader would know exactly what sentence to begin writing next.
3. Confirm the answer is yes without outside help.

**Related files:** `components/ModuleSix.js`; `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Added `jobRightNow` coaching (lead + numbered steps) rendered immediately above the drafting textarea for intro, body, and conclusion. Steps reference the thesis and outline guide cards. Redundant “How writers use these notes” card removed from the workspace to keep the next action obvious. No persistence/workflow/navigation/drafting-logic changes. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-074 — Make “Your job right now” the primary instructional focus on Module 6 drafting pages

- **Module:** 6
- **Screen or area:** Introduction, body, and conclusion drafting pages
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Needs Verification

**Walkthrough observation:** WP-073 added strong step-by-step coaching, but students still hit multiple instructional blocks before the writing directions. The page felt like documentation instead of a teacher giving immediate guidance.

**Why it matters educationally:** A first-time eighth grader should know “What am I supposed to write first?” within seconds, without reading several coaches first.

**Why it matters technically or operationally:** Presentation hierarchy only. Persistence, drafting logic, and workflow unchanged. Instructional content is reordered and de-duplicated, not deleted for unique value.

**Recommended smallest reasonable fix:** Place “Your job right now” immediately under the page question; put writing next; move thesis, outline, why/example/self-check below as Need help; remove duplicated coaching wording.

**Verification steps:**
1. Walk Introduction, one Body section, and Conclusion.
2. Confirm a first-time eighth grader can identify Step 1 within two or three seconds of page load.
3. Confirm supporting resources reinforce writing rather than compete with the primary action.

**Related files:** `components/ModuleSix.js`; `components/module6/ModuleSixStepFrame.jsx`; `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Module 6 hierarchy is now Question → Your job right now → writing box → Need help (thesis, outline notes, why/example/self-check). Duplicate thesis/outline coach paragraphs and overlapping right-rail writing recipes removed; unique artifacts retained. Modules 7–8 unchanged (no jobRightNow). Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-075 — Replace ambiguous Module 6 writing terminology with student-friendly language

- **Module:** 6
- **Screen or area:** Drafting page questions and related coaching copy
- **Priority:** Medium
- **Category:** Copy / Voice
- **Status:** Needs Verification

**Walkthrough observation:** The prompt “How will you open your essay from the outline you already built?” is ambiguous. Middle school students may think “open” means opening a file, Google Doc, or assignment rather than beginning the introduction.

**Why it matters educationally:** Instructional language should be immediately clear to 13–14 year olds without interpreting writing jargon.

**Why it matters technically or operationally:** Presentation-only copy. No workflow, persistence, navigation, or drafting-logic changes.

**Recommended smallest reasonable fix:** Replace ambiguous phrases such as “open your essay” / “close your essay” with clear writing-task language (begin introduction, write conclusion, etc.).

**Verification steps:**
1. Open the Module 6 Introduction drafting page.
2. Confirm a first-time eighth grader understands the prompt asks how to begin writing the introduction—not how to open a document.
3. Spot-check Body and Conclusion questions for the same clarity.

**Related files:** `components/module6/module6StepPresentation.js`

**Resolution notes:** (July 10, 2026) Introduction question → “How will you begin your introduction…”. Conclusion question → “How will you write your conclusion…”. Softened related “open/close/claim/landing” wording in nearby coaching where it could confuse. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-076 — Build the Introduction page around the reader, not the writing

- **Module:** 6
- **Screen or area:** Draft Introduction page
- **Priority:** High
- **Category:** Instructional
- **Status:** Needs Verification

**Walkthrough observation:** The Introduction drafting page still began from writing mechanics (“begin your introduction”) instead of what the student wants the reader to understand first.

**Why it matters educationally:** Students should think like writers by focusing first on the reader, then leading that reader toward the thesis they already planned.

**Why it matters technically or operationally:** Presentation-only. No persistence, navigation, drafting logic, or saved-work changes.

**Recommended smallest reasonable fix:** Reader-centered question; “Your job right now” framed around the reader; thesis card as destination; outline as support; conversational nearby copy.

**Verification steps:**
1. Open Module 6 Introduction.
2. Confirm a first-time eighth grader understands: thinking about the reader; what the reader needs first; how to begin writing; thesis is where they lead the reader, not where they start.

**Related files:** `components/module6/module6StepPresentation.js`; `components/ModuleSix.js`

**Resolution notes:** (July 10, 2026) Introduction question → “What's the first thing you want your reader to know?” Job-right-now lead/steps are reader-first. Thesis card labeled as destination (“Where you're leading your reader”). Outline help framed as support. Nearby why/example/self-check/teacher copy rewritten in conversational eighth-grade voice. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-077 — Make supporting resources impossible to miss on Module 6 drafting pages

- **Module:** 6
- **Screen or area:** All Module 6 drafting pages (Introduction, Body, Conclusion)
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Needs Verification

**Walkthrough observation:** Strong reader-first coaching still assumed students knew where thesis, outline points, and examples lived. Body questions also pasted generated outline titles into the page question in an artificial way.

**Why it matters educationally:** Students should never wonder where supporting information is. Coaching should point to resources at the moment of need, with clear visual matches.

**Why it matters technically or operationally:** Presentation-only. No persistence, workflow, or drafting-logic changes.

**Recommended smallest reasonable fix:** Explicit “under Need Help” find-it language; Need Help jump control; color-matched thesis/outline cards and coaching cues; natural teacher-style questions without generated text in the question.

**Verification steps:**
1. Open each Module 6 drafting page.
2. Confirm a first-time eighth grader always knows where referenced information lives, what each resource is for, and how to move between writing and Need Help without confusion.
3. Confirm body questions do not paste generated outline titles into the question itself.

**Related files:** `components/module6/ModuleSixStepFrame.jsx`; `components/module6/module6StepPresentation.js`; `components/ModuleSix.js`

**Resolution notes:** (July 10, 2026) Need Help is a labeled scroll target with a top jump button; job steps use blue/green resource cues matching thesis/outline cards; find-it copy points to Need Help; body/conclusion questions rewritten in natural teacher voice. Awaiting walkthrough verification.

**Resolved in commit:**

---

### WP-078 — Module 1 prompt page lacks clear first-task hierarchy

- **Module:** 1
- **Screen or area:** `/modules/1/prompt` (Step 1 prompt breakdown)
- **Priority:** High
- **Category:** Instructional / UX
- **Status:** Resolved

**Walkthrough observation:** The first prompt breakdown page stacked Step 1 of 2, explanatory copy, reassurance, Welcome headings, and the assignment before any answerable question. Students could read several blocks without knowing what to do first.

**Why it matters educationally:** The first Module 1 task must make the immediate action obvious within seconds. Competing top-of-page headings create the “lost” feeling described in the walkthrough.

**Why it matters technically or operationally:** Presentation and shared workspace layout only. Prompt breakdown persistence, MC/paraphrase logic, save API, and progression to Step 2 unchanged.

**Recommended smallest reasonable fix:** Make the concrete task the primary heading; demote reassurance/background; place the assignment as Need Help reference; adopt the shared WorkspaceLayout rhythm used in later modules.

**Verification steps:**
1. Open `/modules/1/prompt` as a reset student.
2. Confirm a first-time student can name the task within about five seconds.
3. Confirm Welcome/background does not compete as a primary heading.
4. Confirm assignment is available under Need Help and does not dominate the top.
5. Confirm save still advances to video/quiz and reload restores answers.

**Related files:** `app/modules/1/prompt/page.js`; `components/layout/layoutModes.js`

**Resolution notes:** (July 10, 2026) Implemented Start here → Your job right now → work → Need Help on the shared drafting workspace shell. Module 1 routes use WorkspaceLayout. Jason verified PASS on live walkthrough (July 10, 2026). Related app-wide WP-048 / WP-050 / WP-051 / WP-062 remain Open (not closed by this Module 1 fix).

**Resolved in commit:** (presentation-only; closed after live verification PASS)

---

*Last updated: July 10, 2026 — WP-078 Resolved (Module 1 prompt first-task hierarchy / M1.1).*
