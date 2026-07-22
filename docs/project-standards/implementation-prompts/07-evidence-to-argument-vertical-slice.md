# Cursor Prompt 07 — Evidence-to-Argument Vertical Slice

Use this prompt only after WP-085 is Resolved. This begins Phase 3 with one representative Module 2→3 comparison path. It must preserve the accepted WP-079 matrix-direction engine and the production Modules 4–7 writing spine.

```text
Build and verify one complete evidence-to-argument vertical slice from verified source passages in Module 2 through a defensible comparative thesis and proof directions in Module 3.

Use the walkthrough direction as the representative slice:

- speech pathos compared with letter logos;
- exact, inspectable evidence from the speech;
- exact, inspectable evidence from the letter;
- student explanation of rhetorical choice → audience effect → purpose for each;
- a tested comparison pattern;
- a staged comparative thesis;
- proof directions that can be traced forward into Module 4 paragraph plans.

This is a foundation slice, not a wholesale Module 2–3 rewrite. Put the new experience behind a development-only gate for the representative direction until acceptance passes. Do not alter the production behavior of other directions yet. Do not reopen WP-079, remove its canonical direction taxonomy, rewrite student prose, or change Modules 4–9 except for read-only compatibility assertions at the handoff boundary.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2: product shift and north-star experience
   - Sections 3.1–3.16: instructional, artifact, cognitive-load, completion, accessibility, and success contracts
   - Sections 4.1–4.5: artifact graph, health, configuration, diagnostics, and completion truth
   - Module 2 and Module 3 required revisions and acceptance criteria
   - Phase 3 and its exit condition
   - Sections 8–9: regression fixtures and acceptance evidence
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-003, WP-064, WP-079, and WP-085 in docs/project-standards/walkthroughs/issue-log.md
8. lib/module2/matrixEssayDirectionContract.js and all WP-079 tests
9. Current Module 2 source, observation, rating, matrix, and direction persistence
10. Current Module 3 pattern, idea, claim, thesis, proof-plan, resume, success, and matrix-review persistence
11. The accepted Module 4 artifact inputs, especially sourceParagraphIndex, purpose, evidence provenance, and thesis relationship

Create one new bounded issue, WP-086, for this representative evidence-to-argument slice. Do not redefine historical issues. Keep it Open during implementation and Needs Verification until agent-run browser acceptance passes.

FIRST PROGRESS REPORT — ARTIFACT AND INSTRUCTION AUDIT

Before editing, report:

- the exact database rows, JSON fields, APIs, helpers, and client state used for both source texts;
- how source title, author, date, publication context, working-copy text, and citation metadata are currently stored and verified;
- the current Module 2 observation shape, including quote/passage, source identity, rhetorical tag, audience/effect reasoning, and purpose reasoning;
- every place fallback text, detached matrix cells, stale values, fragments, or source-label contradictions can enter the student path;
- how each of the six ratings links—or fails to link—to evidence and an explicit zero judgment;
- the WP-079 direction contract, selection signature, supporting choices, and downstream provenance;
- how Module 3 currently hydrates reread evidence, pattern, idea, claim, thesis, proof directions, and matrix-change review;
- every character threshold, implicit advancement, duplicated claim/thesis task, or completion claim that can certify weak work;
- how Module 4 currently consumes Module 3 thesis and proof directions;
- the smallest stable evidence identity and provenance contract that can survive edits, reloads, and direction changes;
- what can be derived safely from legacy observations and what must be flagged for local student review;
- the exact development gate and seed strategy for the representative speech-pathos / letter-logos slice.

Do not edit until the artifact map and stable identity contract are explicit. Do not invent a second matrix-direction engine.

PROBLEM TO SOLVE

Module 2 currently contains useful source, observation, rating, and direction activities, while Module 3 contains pattern, idea, claim, thesis, and proof-plan activities. Students do not consistently experience these as transformations of the same evidence. Evidence can become detached from its source or explanation; one work can be overrepresented; malformed or legacy fragments can appear as valid work; and Module 3 can ask for a conclusion before the student has reread and tested both passages.

The representative slice must make this learning process visible:

verified source passage → rhetorical observation → rating evidence → selected comparison direction → both-work reread → tested pattern → comparative thesis → proof directions

TARGET STUDENT EXPERIENCE

The student should be able to answer, at every stage:

1. Which exact passage am I using?
2. Which source did it come from?
3. What rhetorical choice do I notice?
4. What effect might that choice have on this audience?
5. How does that effect help the author’s purpose?
6. What is similar or different across the two works?
7. Why does that comparison matter?
8. What can my essay prove?
9. What sections will prove it?

Each screen should present one real decision. Put only the active evidence and required reasoning on the desk. Keep full source texts, other observations, rating history, and optional reference material on the shelf.

SHARED EVIDENCE AND PROVENANCE CONTRACT

Create or extend one shared, normalized contract rather than adding component-local shapes. The representative contract should include at least:

- stable observation/evidence id;
- source id and source kind (speech or letter);
- verified source-record id/version or equivalent upstream signature;
- exact quotation or precise passage locator;
- surrounding context sufficient to inspect the quote honestly;
- student observation;
- rhetorical choice/appeal tag;
- audience;
- audience effect reasoning;
- contribution-to-purpose reasoning;
- rating cell or comparison role using the evidence;
- selected-direction id/signature from WP-079;
- health and review metadata;
- created/updated timestamps where persistence already supports them.

Requirements:

- preserve student wording exactly;
- retain source identity through every downstream transformation;
- never fabricate a quote, explanation, or source locator;
- do not treat a generic note as exact evidence;
- distinguish “missing,” “student explicitly judged zero,” and “not yet reviewed”;
- detect stale provenance when the source, observation, rating, or selected direction changes;
- allow a local repair without erasing downstream prose;
- keep adapters pure and confidence-limited;
- write upgraded metadata only on a legitimate authenticated save, never as a render side effect.

SOURCE TRUST AND EVIDENCE HEALTH

Preserve WP-003’s requirement that both source texts are durably saved before analysis. Add truthful health checks for the representative path:

- missing or uninspectable source text;
- missing/contradictory source metadata;
- quote not found in the saved working source when exact-text matching is possible;
- quote saved under the wrong source;
- missing precise passage reference when no quote is stored;
- missing audience/effect/purpose reasoning;
- evidence linked to a different appeal than the selected rating without student confirmation;
- duplicate observation presented as two distinct pieces of evidence;
- stale observation after the working source changes;
- only one work substantively represented;
- legacy/fallback strings presented as student work.

Health findings must be advisory or blocking according to their actual consequence. Do not silently repair student reasoning. A mismatch should keep the student’s work visible, explain the problem in plain language, and route to the smallest relevant repair.

MODULE 2 — REPRESENTATIVE EVIDENCE PATH

For the gated representative direction:

1. Keep both saved source texts one click away and inspectable.
2. Present the active source passage before asking for analysis.
3. Use the recurring sequence:
   Quotation → rhetorical choice → audience effect → purpose.
4. Save each observation with durable provenance.
5. Show why an observation supports a rating without pretending the 0–10 number is scientific.
6. For a meaningful nonzero rating, require either linked evidence or an explicit “I need to gather evidence” state.
7. For zero, require an explicit zero judgment; do not interpret blank as zero.
8. Keep all six matrix cells legible and traceable to evidence or an explicit zero judgment.
9. Preserve WP-079 recommendation ranking, tied alternatives, supporting choices, custom direction, and student ownership.
10. When the student selects speech-pathos / letter-logos, show the exact supporting observations from both works and allow local replacement before handoff.
11. Remove malformed/fallback material from the student-facing desk; place recoverable legacy work in a clearly labeled review state.
12. Use explicit Continue/Finish actions. Never advance on character count.

Do not turn the matrix recommendation into thesis prose. It remains a direction the student will investigate.

MODULE 3 — BOTH-WORK REREAD AND STAGED THESIS BUILDER

For the gated representative direction, use this sequence:

1. Reorient: show the selected direction and its ratings/provenance compactly.
2. Reread: place one inspectable speech passage and one inspectable letter passage side by side on desktop and sequentially on mobile.
3. Repair: if either side is weak, let the student replace or improve that evidence locally before proceeding.
4. Explain each side: preserve the Module 2 observation, but require enough choice → audience effect → purpose reasoning to support comparison.
5. Test the pattern: ask what is similar or different and let the student revise that provisional pattern.
6. Build the comparative argument in distinct stages:
   - What is similar or different?
   - Why does that difference matter for audience or purpose?
   - What larger point can the essay prove?
   - What sections will prove it?
7. Produce one authoritative comparative thesis; do not collect a near-duplicate claim and thesis as separate disconnected artifacts.
8. Produce proof directions that align with the thesis and retain links to the supporting evidence from both works.
9. Show a compact argument map before completion:
   selected direction → speech proof → letter proof → thesis → proof directions.
10. Keep proof-plan requirements visible before the student begins the formal essay plan in Module 4.

If existing pattern/idea/claim/thesis prose is present, preserve it. Adapt it into the staged builder only when mapping is unambiguous. Otherwise show it as saved work requiring local review; never overwrite it automatically.

TRUE BOTH-WORK READINESS

Do not certify the representative comparison unless semantic validation establishes:

- both verified source texts are available;
- at least one inspectable passage from each work;
- meaningful student explanation for each passage;
- the selected direction still matches the active matrix signature or has been explicitly reviewed;
- a comparative pattern representing both works;
- a thesis that represents both works and makes an arguable audience/purpose point;
- proof directions aligned with the thesis;
- no unresolved fragments, wrong-source labels, or contradictory provenance.

Length alone is never evidence of readiness. Do not use character thresholds to advance or certify work.

MODULE 3 COMPLETION AND MODULE 4 HANDOFF

The gated completion page should display the argument the student actually earned:

- selected comparison direction;
- speech passage plus explanation;
- letter passage plus explanation;
- comparative thesis;
- proof directions;
- a simple trace showing how these pieces connect.

It must be readable rather than compressed into a narrow center card. Use the shared success language proportionately, but do not claim that both works are ready unless validation passed.

The Module 4 handoff must receive stable, source-linked proof directions without rewriting the student’s thesis or existing paragraph plans. Add read-only contract tests proving the accepted Module 4–7 spine can consume the output. Do not redesign Module 4 in this prompt.

PERSISTENCE, RESUME, AND CHANGE PROPAGATION

- Save the active step and local repair destination server-side.
- Refresh and direct reopen must restore the correct stage and evidence pair.
- Editing a Module 2 observation, rating, source, or selected direction must mark affected Module 3 work for review without deleting it.
- Confirming unchanged downstream prose must store the reviewed upstream signature.
- Replacing evidence must update only dependent health/review metadata until the student deliberately revises downstream prose.
- Back from a local repair must return to the exact Module 3 stage that requested it.
- Existing WP-079 matrix-change review behavior must continue to work.

COGNITIVE-LOAD AND COPY RULES

- One decision per screen.
- Desk: active evidence pair, selected direction, and only the reasoning needed now.
- Shelf: full texts, other observations, rating history, optional examples.
- Use student-facing labels: Speech, Letter, Your evidence, What it may do for the audience, How it supports the purpose, Your comparison, Your thesis, How you will prove it.
- Do not expose terms such as artifact, provenance, signature, semantic validation, canonical frame, hydration, or health flag.
- Examples should model structure without writing the student’s answer.
- Feedback must explain why a choice works or what to inspect next.
- Keep primary writing and decision controls above optional references.

DEVELOPMENT GATE AND SEED

Use a development-only gate for the representative speech-pathos / letter-logos direction. Production and every other direction retain the current accepted path.

Add a deterministic dev seed that includes:

- verified speech and letter source records;
- ratings 6/8, 10/4, 4/9;
- selected speech-pathos / letter-logos direction with WP-079 signature;
- one strong speech observation;
- one strong letter observation;
- one weak/mismatched observation for repair testing;
- existing Module 3 prose to verify ownership and review behavior;
- no walkthrough student’s exact essay language hardcoded in product logic.

TEST FIXTURES

Cover at least:

- coherent evidence from both works;
- speech-only and letter-only evidence;
- quote stored under the wrong source;
- quote missing from the saved source;
- precise passage locator without quotation;
- missing audience effect;
- missing purpose reasoning;
- blank rating versus explicit zero;
- stale evidence after source edit;
- selected-direction change after Module 3 work exists;
- duplicated evidence;
- fragmentary legacy observation;
- legacy Module 3 claim/thesis preservation;
- aligned and misaligned proof directions;
- refresh/resume during reread, repair, thesis building, and completion;
- local repair return;
- two-source completion truth;
- Module 4 handoff compatibility.

AUTOMATED ACCEPTANCE

Add focused executable tests for:

1. evidence/provenance normalization and stable identity;
2. source and evidence health diagnostics;
3. matrix-cell evidence/explicit-zero traceability;
4. representative selected-direction evidence pairing;
5. staged thesis-builder persistence and assembly;
6. true both-work readiness;
7. upstream-change review without prose loss;
8. Module 3 completion truth;
9. Module 4 handoff compatibility;
10. no character-threshold auto-advance;
11. student-facing copy exclusions;
12. development gating.

Run focused WP-079/WP-086 tests, then proportional Module 2–4 suites. Preserve WP-081–085 tests.

AGENT BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Use the representative seed and verify at 390×844 and 1440×900:

1. Both source texts open and the exact active passages are inspectable.
2. Speech observation persists with source, quote, choice, audience effect, and purpose.
3. Letter observation persists with the same fields.
4. All six ratings remain legible and each is traceable to evidence or explicit zero.
5. Selected speech-pathos / letter-logos direction shows its provenance and both supporting observations.
6. Module 3 opens on a concise reorientation, not a data dump.
7. Reread presents both works and local replacement works without module replay.
8. Wrong-source/missing reasoning is flagged without erasing prose.
9. Thesis builder progresses through distinct comparison, significance, larger point, and proof-direction stages.
10. No character threshold advances a step.
11. Refresh restores each representative stage.
12. Changing Module 2 evidence or direction preserves Module 3 prose and requires review.
13. Completion refuses one-work support and never overclaims readiness.
14. Completion displays the earned evidence-to-thesis argument clearly.
15. Module 4 receives the thesis and proof directions with stable evidence links.
16. Keyboard/focus order is logical; no horizontal overflow; the active task remains visually primary.

Use agent-owned browser checks, database/API inspection, and automated tests wherever possible. Human review is limited to irreducibly subjective judgment of coaching tone or age fit; identify it explicitly rather than asking Jason to repeat routine checks.

FIRST RESPONSE AFTER READING

Return:

1. governing strategy sections read;
2. current Module 2→3→4 artifact map;
3. stable evidence identity/provenance proposal;
4. representative gate and seed plan;
5. legacy confidence limits;
6. files expected to change;
7. focused tests and browser acceptance plan;
8. explicit out-of-scope boundaries.

Then implement, verify, fix acceptance findings, update WP-086, and report evidence. Do not mark WP-086 Resolved before the representative browser slice passes.

OUT OF SCOPE

- generalizing the new flow to every WP-079 direction;
- changing the WP-079 direction taxonomy or ranking rules;
- Module 1 vocabulary redesign;
- Module 4–7 instructional redesign;
- Module 8–9 APA/submission redesign;
- broad visual-system or success-screen redesign;
- automatic AI rewriting of student evidence, reasoning, thesis, or proof directions;
- production promotion of this representative slice.
```
