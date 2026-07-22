# Cursor Prompt 08 — Generalize Evidence-to-Argument Across All Directions

Use this prompt only after WP-086 is Resolved. It generalizes the accepted representative Module 2→3 slice across the complete WP-079 direction universe. It does not promote the slice to production.

```text
Generalize the accepted WP-086 evidence-to-argument experience from the representative `cross_dominant:pathos:logos` direction to every supported WP-079 direction: all three same-appeal frames, all six ordered cross-dominant frames, and a student-created direction with explicit both-work evidence mapping.

Preserve the accepted Module 2→3 learning process:

verified source passage → rhetorical observation → rating evidence → selected comparison direction → both-work reread → tested pattern → comparative thesis → proof directions → Module 4 handoff

This is a generalization and hardening task. Do not redesign the WP-079 recommendation/ranking engine, rewrite the WP-086 step sequence, promote the slice to production, or change Modules 4–9 beyond compatibility tests. Use the accepted WP-086 contract, components, persistence, and student language as the foundation. Remove representative-only assumptions rather than creating parallel flows.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2 and 3.1–3.16
   - Sections 4.1–4.5
   - Module 2 and Module 3
   - Phase 3 and its exit condition
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. WP-003, WP-064, WP-079, WP-085, and WP-086 in docs/project-standards/walkthroughs/issue-log.md
8. Prompt 07 and the accepted WP-086 implementation/tests/browser evidence
9. lib/module2/matrixEssayDirectionContract.js
10. lib/artifacts/evidenceArgumentContract.js
11. lib/dev/isEvidenceToArgumentSliceEnabled.js
12. components/module3/EvidenceArgumentSliceFlow.jsx and EvidenceArgumentSlicePanel.jsx
13. Module 2 direction-selection/pairing UI, Module 3 evidence-argument API/persistence, success helpers, and Module 4 handoff tests

Create one new bounded issue, WP-087. Do not reopen WP-079 or WP-086. Keep WP-087 Open during implementation and Needs Verification until automated and agent browser acceptance pass.

FIRST PROGRESS REPORT — GENERALIZATION AUDIT

Before editing, report:

- every representative-only constant, option-id comparison, hardcoded pathos/logos label, assumed matrix cell, evidence role, seed field, test expectation, and copy branch in WP-086;
- the complete WP-079 direction universe and exact option-id grammar:
  - `same_appeal:ethos`
  - `same_appeal:pathos`
  - `same_appeal:logos`
  - all six ordered `cross_dominant:<speechAppeal>:<letterAppeal>` pairs where the appeals differ
  - `student_created` / the actual persisted custom-direction identifier and metadata;
- how same-appeal relationship metadata distinguishes strong contrast, meaningful similarity, nuanced difference, and weak signal;
- how cross-dominant directions identify the speech-side and letter-side appeals;
- how custom directions currently store label, reasoning, ratings, selected evidence, and signature;
- how ties and supporting recommendations can become the selected direction without losing provenance;
- how evidence is currently paired and what happens when multiple observations match one side;
- how explicit-zero and missing-evidence states affect direction eligibility and argument readiness;
- how a selected direction change invalidates or preserves `flow_state.evidenceArgumentSlice`;
- how legacy WP-086 state can be normalized without losing student prose;
- the smallest direction-descriptor contract that can drive the existing Module 2 and Module 3 UI without family-specific duplication;
- the dev gate, seed/fixture matrix, and browser scenarios required to cover every direction family proportionately.

Do not edit until the shared direction-descriptor and evidence-pair resolution rules are explicit.

PROBLEM TO SOLVE

WP-086 proves that one speech-pathos / letter-logos comparison can carry trustworthy evidence into a staged thesis. The current slice is intentionally coupled to that option id. Every other valid WP-079 selection still uses the prior path, so students receive different evidence and argument support based solely on which legitimate direction they selected.

Generalization must preserve the student-owned direction while correctly determining:

- which appeal/evidence belongs on the speech side;
- which appeal/evidence belongs on the letter side;
- whether the selected relationship is similarity, contrast, nuanced difference, cross-dominance, or student-created;
- which explanation prompts are relevant;
- how multiple candidate observations are selected or replaced;
- how both-work readiness is validated;
- how the resulting thesis and proof directions remain traceable.

TARGET OUTCOME

For any accepted WP-079 selection in development:

- Module 2 shows a truthful supporting evidence pair from both works;
- the student can inspect, choose, or locally replace either side;
- Module 3 uses the same concise staged flow accepted in WP-086;
- prompts and labels reflect the chosen appeals and relationship without writing the answer;
- refresh and resume preserve the exact selected direction and work;
- changing directions preserves existing prose but marks affected work for review;
- completion requires substantive support from both works;
- Module 4 receives the authoritative thesis and proof directions;
- no direction family gets a weaker completion contract.

ONE SHARED DIRECTION DESCRIPTOR

Create or extend one pure direction-descriptor helper derived from the canonical WP-079 frame. It should normalize at least:

- selected option id;
- direction family (`same_appeal`, `cross_dominant`, `student_created`);
- student-facing selected label;
- speech appeal when known;
- letter appeal when known;
- same-appeal relationship when applicable;
- selected ratings and the matrix cell ids used;
- selected-direction signature;
- supporting/tied/custom provenance;
- whether the mapping is complete enough to enter the slice;
- a plain-language reason when local mapping is required.

Requirements:

- use `generateCanonicalDirectionFrames` and existing WP-079 contracts rather than duplicating the taxonomy;
- validate option ids and reject malformed/unknown combinations;
- preserve ordered speech/letter appeal roles for cross-dominant frames;
- preserve relationship metadata for same-appeal frames;
- never infer appeals for a custom direction unless the student explicitly mapped them;
- never turn a direction label into thesis prose;
- never expose internal frame ids or signatures to students;
- document confidence limits and legacy normalization rules.

DIRECTION-SPECIFIC EVIDENCE PAIRING

Build one pure resolver that receives the normalized direction, matrix bundle, and available evidence records and returns:

- ranked speech-side candidates;
- ranked letter-side candidates;
- the currently selected pair;
- missing/ambiguous/mismatched health findings;
- the matrix cells and ratings supporting each side;
- explicit-zero status;
- whether local evidence selection is required.

Pairing rules:

1. Same-appeal frame: both sides use that appeal.
2. Cross-dominant frame: speech uses the first appeal; letter uses the second.
3. Student-created direction: require the student to choose or confirm an appeal/strategy and exact evidence for each work.
4. Prefer evidence explicitly linked to the selected matrix cell.
5. If multiple healthy observations match, preserve the student’s prior choice; otherwise present a small, inspectable choice—not a silent arbitrary winner.
6. Never reuse a speech observation as letter evidence or vice versa.
7. Never count the same observation twice to create the appearance of two-source support.
8. Blank is not zero. Explicit zero remains a rating judgment, not passage evidence.
9. If a selected direction relies on a zero/weak cell, require the student to gather or explicitly remap substantive passage evidence before argument readiness.
10. A quote/passage mismatch remains visible and locally repairable; do not erase it or silently replace it.

MULTIPLE EVIDENCE AND STUDENT CHOICE

For each side:

- show the currently selected observation first;
- allow the student to inspect other matching observations under progressive disclosure;
- allow local replace/gather without replaying Module 2;
- persist the chosen evidence id in the slice state;
- retain the previously selected evidence when still healthy after reload;
- mark dependent Module 3 work for review when the choice changes;
- never change the chosen pair merely because recommendation ranking changes while the selected direction stays valid.

SAME-APPEAL EXPERIENCE

Support all three same-appeal frames and adapt coaching to the actual relationship:

- strong contrast: ask how the same appeal works differently across audiences/purposes;
- meaningful similarity: ask what both works share and why the effect may still differ by audience or context;
- nuanced difference: ask the student to state the limited but meaningful difference without exaggerating it;
- weak/unsupported signal: do not certify a thesis; route to gather evidence or choose another direction.

The flow must not assume every same-appeal direction is a contrast. Preserve WP-079’s relationship classification and student ownership.

CROSS-DOMINANT EXPERIENCE

Support all six ordered pairs. Labels, desk fields, evidence cells, reread cards, and prompts must reflect the actual speech and letter appeals. Verify reverse-order cases explicitly (for example speech logos / letter pathos) so code does not accidentally reuse the representative pathos/logos mapping.

Coaching should ask why each work emphasizes a different rhetorical resource for its audience and purpose. It must not imply that the other appeals are absent or that ratings are objective measurements.

STUDENT-CREATED DIRECTION

The custom path must remain genuinely student-created.

Require the student to:

- retain or edit the custom direction label/reasoning;
- explicitly select the speech-side evidence;
- explicitly select the letter-side evidence;
- identify the relevant rhetorical choice/strategy for each side when not already tagged;
- confirm what relationship they want to investigate;
- review the resulting direction summary before entering Module 3.

Do not force a custom direction into a canonical option id merely to reuse UI. Store an explicit mapping layer that the shared evidence-pair resolver can consume. Preserve custom wording across refresh, direction review, and downstream work.

MODULE 2 GENERALIZATION

- Replace the representative-only pairing panel condition with the shared dev-only slice gate for any valid, fully mapped direction.
- Render selected appeals, ratings, relationship, and evidence dynamically.
- Preserve tied/supporting/custom selection behavior from WP-079.
- Keep both full source texts one click away.
- Keep all six matrix cells traceable to evidence or explicit zero.
- Provide local repair when either selected side is missing or unhealthy.
- Do not flood the screen with every observation; use the accepted desk/shelf hierarchy.
- Use explicit actions; no character-count advancement.

MODULE 3 GENERALIZATION

Reuse the accepted WP-086 stages and components. Generalize their inputs and copy rather than creating family-specific flows:

1. reorient to the actual selected direction;
2. reread the resolved evidence pair;
3. repair either side locally;
4. explain each passage’s choice → audience effect → purpose;
5. test the correct relationship;
6. explain why it matters;
7. state the larger point/thesis;
8. define proof directions;
9. inspect the argument map.

Requirements:

- dynamic appeal and relationship language;
- same persistence namespace upgraded through a schema version, not parallel per-family objects;
- safe normalization of WP-086 state;
- current step, return step, selected evidence ids, direction signature, prose, and review state survive refresh;
- direction changes preserve prose and require deliberate review;
- the success argument map reflects the active direction/evidence pair;
- true both-work readiness remains identical across all families.

STATE VERSIONING AND CHANGE PROPAGATION

Extend `flow_state.evidenceArgumentSlice` with an explicit schema version and normalized direction descriptor if not already present.

- Existing WP-086 state must reopen intact.
- If the stored option id still matches, preserve selected evidence and prose.
- If only relationship/rating provenance changed, mark review without clearing prose.
- If the selected option id changed, preserve the prior prose as saved work, resolve a new evidence pair, and require stage-appropriate review.
- If a custom mapping changes, invalidate only dependent readiness/review metadata.
- Never upgrade persistence as a render side effect.
- All writes remain authenticated and scoped to the current student.

TRUE READINESS FOR EVERY FAMILY

Completion requires:

- two verified working source texts;
- one healthy, inspectable passage from each work;
- student explanation for each passage;
- a current reviewed direction signature;
- a comparison pattern appropriate to the active relationship;
- an arguable comparative thesis representing both works;
- proof directions aligned with the thesis;
- no unresolved wrong-source, detached, stale, fragmentary, or one-work-only finding.

Do not weaken readiness for custom, similarity, nuanced, tied, or supporting selections. Do not certify based on length.

DEVELOPMENT GATE

Generalize the existing gate so any valid WP-079 canonical direction—or a fully mapped student-created direction—can use the slice only in development.

- Production remains unchanged.
- Unknown/malformed directions fall back honestly to the existing path or a local review state; they must not crash.
- The gate must not contain an enumerated one-off list that can drift from the canonical WP-079 frame generator.
- Dev seeds and the Developer Testing Panel remain development-only.

SEEDS AND FIXTURE MATRIX

Extend the seed system without adding a separate button for every option. Provide one configurable WP-087 seed or a small family-level set that can generate:

- same-appeal strong contrast;
- same-appeal meaningful similarity;
- same-appeal nuanced difference;
- cross-dominant representative order;
- cross-dominant reverse order;
- tied/supporting selection;
- fully mapped student-created direction;
- incomplete custom mapping;
- multiple healthy evidence candidates on one side;
- explicit-zero/weak selected side;
- direction change with existing Module 3 prose;
- legacy WP-086 persisted state.

Use synthetic student language in seeds. Do not hardcode the walkthrough student’s essay into product logic.

AUTOMATED ACCEPTANCE

Add executable tests proving:

1. the descriptor covers exactly the 9 canonical WP-079 frames plus custom;
2. malformed ids are rejected safely;
3. all 3 same-appeal mappings resolve the correct speech/letter cells;
4. all 6 ordered cross-dominant mappings resolve the correct cells, including reverse order;
5. relationship-aware prompts distinguish contrast, similarity, nuanced difference, and weak signal;
6. custom directions require explicit both-side mapping;
7. evidence resolver preserves source identity and prior healthy choices;
8. multiple candidates require/preserve student choice;
9. explicit zero is not treated as passage evidence;
10. tied/supporting selections retain WP-079 provenance;
11. state-version normalization preserves WP-086 prose and progress;
12. selected-direction changes preserve prose and trigger review;
13. readiness is equally strict across every family;
14. success and Module 4 handoff use the active thesis/proof directions;
15. no character threshold advances;
16. student-facing copy excludes internal terminology;
17. production remains outside the generalized gate.

Use table-driven tests over the canonical frame generator so future frame changes fail visibly rather than silently losing coverage. Run focused WP-079/WP-086/WP-087 tests, proportional Module 2–4 suites, and WP-081–085 regression tests relevant to the handoff.

AGENT BROWSER ACCEPTANCE — REQUIRED

Cursor owns routine acceptance. Verify at 390×844 and 1440×900:

1. Same-appeal contrast: correct appeal on both works; contrast coaching; evidence pair persists.
2. Same-appeal similarity: similarity coaching does not falsely call it a contrast.
3. Same-appeal nuanced difference: appropriately cautious coaching and readiness.
4. Reverse cross-dominant case: speech/letter appeals and evidence are not swapped.
5. Tied/supporting recommendation: selected provenance survives Module 2→3.
6. Custom direction: both-side mapping is required, saved, and restored.
7. Incomplete custom/weak side: completion is blocked with a local repair path.
8. Multiple candidates: student choice persists after refresh.
9. Direction change: prior Module 3 prose remains visible; review is required; no silent rewrite.
10. Legacy WP-086 state: resumes at the saved step with the same prose.
11. Argument map and Module 3 success reflect the active family and evidence.
12. Module 4 receives the current thesis/proof directions.
13. Keyboard/focus order is logical; active task is primary; no horizontal overflow.

Use agent browser automation, API/database inspection, and executable tests wherever possible. Human review is limited to irreducibly subjective coaching tone or age fit; do not ask Jason to repeat routine acceptance.

FIRST RESPONSE AFTER READING

Return:

1. governing sections read;
2. representative-only assumptions found;
3. complete direction-descriptor table;
4. evidence-pair rules for same, cross, and custom families;
5. state-version and legacy normalization plan;
6. files expected to change;
7. fixture/test/browser matrix;
8. explicit out-of-scope boundaries.

Then implement, run agent acceptance, fix findings, update WP-087, and report evidence. Do not mark WP-087 Resolved until all direction families and legacy WP-086 state pass.

OUT OF SCOPE

- changing WP-079 ratings, taxonomy, eligibility, or ranking;
- production promotion of the generalized Module 2→3 slice;
- deleting the old Module 2–3 path;
- Module 1 vocabulary redesign;
- Module 4–7 instructional redesign;
- Module 8–9 APA/submission redesign;
- broad visual-system changes;
- AI-generated or automatically rewritten student evidence, explanations, thesis, or proof directions.
```
