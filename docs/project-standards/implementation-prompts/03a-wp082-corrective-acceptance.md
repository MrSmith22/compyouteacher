# Cursor Prompt 03A — WP-082 Corrective Acceptance

Use this prompt only to finish WP-082 after Prompt 03. Do not begin the Body Paragraphs 2–3 rollout, remove the development gate, or change Modules 8–9.

```text
Complete corrective acceptance for WP-082. The introduction/conclusion vertical-slice implementation exists, and the focused automated suite passes, but fresh Codex browser acceptance on July 21, 2026 found three concrete failures. Reproduce and fix them before marking WP-082 Resolved.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/implementation-prompts/03-introduction-conclusion-vertical-slices.md
3. WP-082 in docs/project-standards/walkthroughs/issue-log.md
4. docs/project-standards/cognitive-load-charter.md
5. docs/project-standards/writing-artifact-decision-architecture.md
6. The accepted WP-081 contracts and all current WP-081/WP-082 tests

Keep WP-082 at Needs Verification until every acceptance item below passes. Update the existing WP-082 issue; do not create a new product issue for this corrective pass.

FRESH ACCEPTANCE EVIDENCE

The following checks already passed and must not regress:

- Focused WP-081 + WP-082 automated suite: 55/55.
- Module 6 Introduction advanced mode survived reload as the sole source of truth. Exact test prose remained in the one-box editor and preview; stale sentence moves were not concatenated.
- Introduction desktop layout at 1440x900 and mobile layout at 390x844 had no horizontal overflow.
- The visible focusable DOM order on the Introduction advanced screen was logical: Need Help, Jump to Need Help, whole-section editor, Back to sentence moves, Keep going, developer panel.
- Conclusion revision initially rendered the correct section-specific job, thesis, compact Body Paragraph purposes, recommended targets, and Before/After UI.

FAILURE 1 — MODULE 7 CONCLUSION SAVE + REFRESH DOES NOT SATISFY THE CONTRACT

Fresh reproduction:

1. Seed WP-082.
2. Enter Module 7 and advance to Conclusion.
3. Append a unique marker to the Conclusion editor.
4. Click Save revision.
5. Before refresh, the UI correctly shows the untouched original under Before and the marker under After.
6. Refresh the browser.
7. The app returns to Module 7 read-aloud Step 1 instead of the Conclusion revision workspace. In the observed run, it also displayed that the Module 6 draft was unavailable even though the developer panel reported both Draft exists: Yes and Revision exists: Yes.

Required correction:

- Audit the complete M6 draft -> M7 revision save -> M7 reload path. Do not assume this is only a visual-step problem.
- Saving a Conclusion revision must never erase, detach, or make the Module 6 source draft unreadable.
- A refresh during the Conclusion revision pass must restore a deterministic, local-resume state that lets the student see the same Conclusion revision workspace and the durable Before/After comparison without replaying the read-aloud or earlier sections.
- Persist the minimum legitimate progress state in the established server-backed architecture. Do not paper over the failure with a test-only flag or sessionStorage-only state.
- Preserve the untouched Before baseline; the marker belongs only in After/current prose.
- Verify the same contract for Introduction so the fix is section-aware rather than Conclusion-specific.

Add executable regression coverage for:

- M7 revision save preserves the underlying M6 draft and its sections/full text.
- Conclusion revisionBySectionType survives save/reload with distinct before and after.
- Introduction revisionBySectionType still survives save/reload.
- Resume state identifies the active M7 section without replaying completed work.
- Existing BP1 revision persistence remains green.

FAILURE 2 — THE WP-082 SEED DOES NOT PRODUCE A VERIFIABLE MODULE 5 STATE

Fresh reproduction:

1. Click Seed Intro+Conclusion slice (WP-082).
2. Open /modules/5.
3. Module 5 displays its prerequisite state: thesis absent, body list empty, and Finish the required paragraph plans in Module 4, then return here.
4. The developer panel simultaneously reports Paragraph plans: 2.

This prevents the required live plan -> outline verification and makes the seed an unreliable acceptance fixture.

Required correction:

- Audit seedIntroConclusionVerticalSlice and every helper it calls.
- Seed the complete, internally consistent set of prerequisites that real Module 5 requires, including the thesis and all required body paragraph plans, while retaining the WP-082 Introduction and Conclusion fixtures.
- After seeding, direct navigation and reload of Module 5 must show the writing plan and formal-outline views, including the Introduction and Conclusion move lists.
- The seed must be idempotent and development-only.
- Do not weaken production prerequisite validation to make the seed pass.

Add an executable seed-contract test that uses the same stored shape Module 5 consumes. A source-text grep is not sufficient.

FAILURE 3 — MODULE 4 STILL EXPOSES UNSTABLE “PARAGRAPH N” LABELS

Fresh browser observation after the WP-082 seed:

- The whole-essay map correctly labels Introduction and Conclusion.
- The CTA correctly says Review Body Paragraph 1.
- Individual Module 4 plan/review surfaces still visibly say Paragraph 1 and Paragraph 2.
- components/ModuleFour.js still contains several student-facing strings such as Paragraph 1 and Paragraph 1: build a paragraph....

Required correction:

- Use the shared essay-section label contract on all student-facing Module 4 body-section headings, cards, progress copy, recovery copy, and CTA/supporting text in this path.
- Student-facing body labels are Body Paragraph N. Do not expose array/source ordinals or use bare Paragraph N as the section name.
- Preserve Introduction and Conclusion labels and do not introduce Roman numerals on writing surfaces.
- Planning concepts may still use the generic lowercase word paragraph when discussing what a paragraph is; this correction concerns named essay sections.

Add focused rendering/helper coverage that proves the visible section names are Body Paragraph 1, Body Paragraph 2, etc. Avoid a brittle blanket ban on the ordinary word paragraph.

COACHING-LENGTH JUDGMENT

The visible Introduction and Conclusion coaching is substantially clearer than the old workflow and the active task is findable. It is acceptable for this development slice, but some repeated orientation remains across Start here, Your job right now, Working set, Before you continue, and teacher guidance.

Do not launch a broad copy redesign in this corrective pass. Make only obvious local deletions where two adjacent lines repeat the same instruction. Report the final visible copy so the agent can assess it. No human testing is required merely to count or read visible lines.

AGENT-OWNED ACCEPTANCE

After fixing, Cursor must automatically perform and report all of the following with visible evidence:

1. Seed WP-082, open Module 4, and show stable Introduction, Body Paragraph N, and Conclusion labels on the actual plan/review path.
2. Open Module 5 directly and after reload; show that the seeded prerequisites are accepted and that Introduction and Conclusion move lists appear in both writing-plan and formal-outline representations.
3. Trace Module 6 Introduction advanced mode: replace prose with a unique marker, wait for save, reload, and prove only the advanced prose remains.
4. Trace Module 7 Introduction: enter the workspace, edit, save, refresh/direct reopen, and prove Before is untouched and After/current prose is durable.
5. Trace Module 7 Conclusion the same way. A refresh must not return to read-aloud and must not report the M6 draft missing.
6. Confirm the M6 source draft still exists and is readable after both M7 saves.
7. Exercise a local revision-target change and save without replaying earlier sections.
8. At 1440x900, perform a real keyboard Tab pass through the active editor, alternate target controls, clearer confirmation, Save, and Keep going. Report the focus sequence, not only a static source-order claim.
9. At 390x844 and 1440x900, verify no horizontal overflow and that the editor remains visually primary.
10. Run focused WP-081/WP-082 tests and the proportional Module 4-7 suite.

If browser tooling cannot synthesize Tab correctly, use another agent-owned browser method that can. Do not transfer routine keyboard acceptance to Jason.

STATUS RULE

Mark WP-082 Resolved only when all three failures are corrected and the full agent-owned acceptance above passes. The final report must include:

- root cause for each failure;
- exact files changed;
- tests and exact counts;
- visible browser state transitions before and after refresh;
- Module 4 and Module 5 live evidence;
- responsive and keyboard evidence;
- confirmation that the development gate and out-of-scope boundaries remain unchanged.
```

