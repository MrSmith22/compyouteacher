# Cursor Prompt 15 — Success-Screen Family and Dashboard Foundation

Use this prompt only after WP-093 is Resolved and the rebuilt Modules 1–9 pathways are database-backed in production. This is the first Phase 6 visual-system slice. It establishes a reusable family of truthful completion experiences and a clearer completed-assignment dashboard without changing the instructional or submission architecture that has already been accepted.

```text
Build the Phase 6 success-screen and completed-dashboard foundation as one representative, development-gated visual-system slice. Replace generic narrow completion cards with purposeful variants that celebrate what the student actually accomplished, show trustworthy evidence of that accomplishment, make the next use of the work obvious, and use the page width intentionally. Apply the foundation to four representative success moments—Module 1, Module 6, Module 8, and Module 9—and to the completed-assignment dashboard state.

This is a visual hierarchy, semantic color, transition, and completion-evidence task. It is not a rewrite of Modules 1–9, a new progression system, or a change to artifact persistence, PDF trust, rollout modes, grading, or teacher settings.

The rebuilt instructional and submission pathways are accepted and production-promoted. Preserve all of their state, actions, routes, recovery paths, and rollout controls.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.11–3.16, especially success screens and dashboard
   - Section 4.5
   - Dashboard required revisions and acceptance criteria
   - Section 6, especially page composition, color semantics, local transitions, and the success-screen family
   - Phase 6 and its exit condition
   - Epic H
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. WP-010, WP-017, WP-018, WP-047, WP-050, WP-052, WP-056, WP-061, WP-069, WP-080, and WP-093 in docs/project-standards/walkthroughs/issue-log.md
9. Every current success route and its client/helper, including app/modules/1–9/success
10. app/dashboard/page.js and every helper that supplies progress, final-PDF, submission-time, receipt, and assignment-status data
11. components/shared/ProgressCelebrationBridge.jsx
12. components/transitions/ModuleRoleTransitionCard.jsx and lib/transitions/moduleRoleTransitions.js
13. lib/ui/moduleProgressCelebrations.js
14. lib/ui/hierarchyContract.js
15. lib/ui/instructionalColorContract.js
16. lib/ui/progressiveDisclosureContract.js
17. ModulePageShell and the existing workspace/layout shells
18. success, transition, accessibility, receipt, dashboard, completion-activity, and responsive tests
19. WP-080 final-PDF validation, durable receipt, success route, dashboard synchronization, and production evidence
20. WP-093 production rollout evidence. Do not couple this visual slice to writing_spine_mode, evidence_argument_mode, vocabulary_transfer_mode, or submission_protocol_mode.

Create one new bounded issue, WP-094. Do not reopen resolved issues. Add evidence notes to related open or Needs Verification issues only when this implementation truly supplies that evidence. Keep WP-094 Open during implementation and Needs Verification until automated and agent-run browser acceptance pass. Human aesthetic judgment may be named as a final remainder, but routine browser testing belongs to the agent.

FIRST PROGRESS REPORT — COMPLETION-SYSTEM AUDIT

Before editing, report:

- every Module 1–9 success route, its success-page implementation, route source, primary action, secondary action, progression/completion write, loading state, error state, direct-reopen behavior, and next destination;
- which success pages are server components, client components, or wrappers around specialized success clients;
- every place success or dashboard navigation can log completion, and how duplicate activity is prevented;
- the actual persisted evidence available at each success moment: completed vocabulary/interpretation, sources/evidence, argument map, plan/outline, drafted/revised section or essay, verified Google Doc, submitted PDF receipt;
- which evidence can be shown truthfully without adding persistence, inventing completion, leaking private prose, or making another instruction page;
- all current success-screen titles, body copy, progress indicators, celebrations, transition components, widths, responsive layouts, colors, and actions;
- where the current designs use a narrow centered card, excessive empty space, repeated explanatory copy, inconsistent status language, or an action disconnected from the accomplishment;
- the current completed-dashboard data path, duplicate or competing status language, submission timestamp, final PDF link, receipt link, resubmission policy, progress summary, and development-only controls;
- the current design tokens and semantic color roles that can be reused rather than creating a parallel palette;
- the current transition and progress contracts that can be composed into the new experience rather than replaced;
- the precise mapping from Modules 1–9 to the shared journey language:
  - Understand
  - Read and notice
  - Develop an argument
  - Plan
  - Draft
  - Revise
  - Prepare
  - Submit;
- the minimum shared contract capable of representing learning milestone, artifact completed, phase transition, and final submission receipt without forcing all four into the same card;
- the smallest safe development gate and representative fixtures needed to verify the visual family without altering the accepted production pages yet;
- files expected to change and the exact automated/browser acceptance plan.

Do not edit until the audit distinguishes truthful artifact evidence from decorative celebration and identifies the existing action/persistence contract for each representative surface.

PROBLEM TO SOLVE

The walkthrough found that several success screens are technically clear but emotionally and spatially flat. They often place a small generic card in the center of a large page, repeat broad claims, underuse color, and provide little visible connection between what the student completed and what happens next. The final Module 9 receipt is trustworthy after WP-080, but it should also feel like the culmination of the whole process. The dashboard communicates completion but needs a more coherent final status, action hierarchy, and accomplishment trail.

One universal celebratory card is not the solution. A saved section, a completed draft, a phase transition, and a durable submission receipt have different jobs and require different evidence. Build one family with shared language and visual rules but intentionally different emphasis.

TARGET EXPERIENCE

Every representative success screen should answer, in this order:

1. What did I just accomplish?
2. What trustworthy evidence shows that it is complete?
3. Where does this work go next?
4. What is the one primary action now?

The completed dashboard should answer:

1. Is the assignment truly submitted?
2. When was it submitted?
3. Where can I open the final paper and receipt?
4. What major stages did I complete?
5. What should I do if a submitted file needs to change?

SHARED SUCCESS-EXPERIENCE CONTRACT

Create a pure shared resolver/contract, with names appropriate to the repository, that can describe at least:

- `variant`: learning milestone | artifact completed | phase transition | final receipt;
- module and journey stage;
- truthful status and accomplishment title;
- one concise accomplishment explanation;
- zero to three evidence items derived from real state;
- completed/current/future journey stages;
- primary action label, destination, and explanation;
- optional secondary action or recovery action;
- celebration intensity and accessible decorative treatment;
- receipt-specific fields only when a durable receipt exists;
- loading, unavailable, and recovery states;
- compact completed-dashboard presentation.

The resolver must be deterministic and presentation-only. It must not write completion state, infer an artifact that is not present, fabricate counts, copy private student prose into telemetry, or turn a rollout setting into evidence of student completion.

Prefer composition around the existing transition, progress, hierarchy, disclosure, and color contracts. Do not create another isolated design system.

SUCCESS VARIANTS

1. Learning milestone — representative Module 1 success
   - Emphasize understanding the student can now use, not merely “Module 1 complete.”
   - Show a compact, truthful indication of the concepts or interpretation artifact completed if available.
   - Preview how that understanding will be used while reading sources in Module 2.
   - Celebration is warm but restrained.

2. Artifact completed — representative Module 6 success
   - Emphasize that a complete draft now exists.
   - Show a compact essay/section map, section-completion summary, or word total only if derived from the accepted draft helpers.
   - Make the shift from drafting to revising explicit: the next task is to strengthen existing writing, not start over.
   - Do not expose the full essay as a wall of text.

3. Phase transition — representative Module 8 success
   - Emphasize that the verified submission document is ready and writing is finished.
   - Show the verified Google Doc state or other already-available document evidence without exposing private URLs in logs.
   - Preview the guided APA/PDF protocol in one concise sequence.
   - Do not reintroduce the old Module 8 formatting or readiness checklist.

4. Final submission receipt — Module 9 success
   - Preserve every WP-080 receipt guarantee and field: filename, submitted time, file size, receipt id/status, PDF link, trail, direct refresh/reopen, focus management, and missing-receipt recovery.
   - Make the durable receipt the visual and semantic center, not a decorative afterthought.
   - Add proportionate culmination: the student completed the entire process, not just an upload.
   - Show the full journey as completed in a compact form.
   - Keep “submitted/received” language strictly dependent on durable receipt evidence.
   - The dashboard action should be clear and secondary to the receipt itself.

JOURNEY LANGUAGE AND PROGRESS

Use the shared stage language consistently:

- Module 1: Understand
- Module 2: Read and notice
- Module 3: Develop an argument
- Modules 4–5: Plan
- Module 6: Draft
- Module 7: Revise
- Module 8: Prepare
- Module 9: Submit

When several modules share a stage, do not display a misleading eight-of-nine count. Represent stage completion honestly. The current stage should be unmistakable; completed stages should be calm confirmation; future stages should be secondary. A student should not need to read a paragraph to determine where they are.

The journey indicator is orientation, not another checklist. It must not add gates or require interaction.

PAGE COMPOSITION

Desktop:

- Use the available width intentionally with a calm, bounded composition rather than a tiny centered card in decorative emptiness.
- Prefer a responsive two-region composition when useful: accomplishment/evidence and next action/receipt context.
- Keep one dominant heading, one primary action, and a clear reading order.
- Do not stretch prose into overly long line lengths merely to fill space.

Mobile:

- Stack in task order: accomplishment → evidence/receipt → next action → compact journey/secondary help.
- No horizontal overflow at 390×844.
- No essential context should require hovering.
- Primary controls must remain at least 44px and appear before optional reference content in focus order.

Use progressive disclosure only for genuinely optional detail. Do not hide the accomplishment, receipt truth, primary action, or recovery state.

SEMANTIC COLOR AND CELEBRATION

Use existing semantic roles for coaching, student work, current action, completion, warning/recovery, and reference. Color must reinforce meaning and always have a text/icon/structural cue; never make color the only signal.

Create one restrained code-native celebratory motif or shared decorative layer that can scale by variant. It may use shapes, gradients, a path/trail, or other lightweight UI treatment. It must:

- feel appropriate for high-school students rather than childish;
- never obscure text or controls;
- avoid a required animation;
- respect `prefers-reduced-motion`;
- add no external asset dependency;
- remain legible in supported contrast modes;
- be lightest for a learning milestone and richest for the final receipt.

Do not add constant confetti, autoplay sound, gamified points, badges without meaning, or decorative colors unrelated to the semantic palette.

COMPLETED DASHBOARD FOUNDATION

For the completed MLK assignment state:

- show one authoritative `Submitted`/`Essay completed` status, not repeated competing lines;
- show the latest durable submission timestamp;
- make `Open final PDF` the clear primary artifact action;
- keep `View submission receipt` available and tied to the same final submission;
- add a compact eight-stage accomplishment trail using the shared journey contract;
- explain the resubmission policy in one concise sentence: contact the teacher before attempting to replace an accepted submission, consistent with existing behavior;
- keep sign-out and non-assignment account actions visually secondary;
- keep development reset/testing controls development-only and outside the student completion card;
- show an honest recovery state if the assignment says complete but the receipt/artifact cannot be found;
- avoid turning the dashboard into another lesson or success page.

The dashboard must continue to derive final PDF and receipt truth from the accepted final-export data path. Do not cache a duplicate receipt object in client state or create another completion table.

REPRESENTATIVE DEVELOPMENT GATE

Place the new success/dashboard foundation behind one explicit development-only visual gate. The gate may enable the representative Module 1, Module 6, Module 8, Module 9, and completed-dashboard presentations for the current MLK assignment. Production remains on the accepted existing presentation until this foundation is accepted and later promoted.

The gate must:

- be presentation-only;
- never alter actions, completion writes, artifact selection, receipt authority, or progression;
- not be student-controlled;
- have one clear helper rather than scattered `NODE_ENV` checks;
- be easy to remove or promote in the next prompt;
- keep production bundles free of seed controls and fixture copy.

Add development fixtures or panel actions only if required to reach representative states quickly. Fixtures must use synthetic data, preserve receipt safety, and never appear in production builds. Prefer existing seeds where they already establish the needed state.

PRESERVE EXISTING BEHAVIOR

- Preserve every success route and destination.
- Preserve idempotent module-completion activity.
- Preserve direct refresh and authenticated reopening.
- Preserve Module 9 missing-receipt recovery and heading focus.
- Preserve final PDF validation and durable receipt authority.
- Preserve dashboard/final-PDF URL identity.
- Preserve all independent assignment rollout modes.
- Preserve errors and recovery paths; redesign their presentation only when necessary for consistency.
- Do not write progress merely because a success component rendered.
- Do not auto-redirect a success page before the student can understand it.

AUTOMATED TESTS

Add focused WP-094 tests for at least:

1. Contract normalization and all four variants.
2. Module-to-journey-stage mapping, including Modules 4–5 sharing Plan.
3. Truthful evidence omission when an artifact is absent.
4. Exactly one primary action per representative variant.
5. Receipt variant cannot claim submission without durable receipt data.
6. Module 9 receipt fields, refresh/direct reopen, focus, and recovery remain intact.
7. Dashboard shows one completion status, latest timestamp, same final PDF, receipt link, compact trail, and recovery when receipt is absent.
8. No render-time completion write and no duplicate activity.
9. Visual gate is development-only and presentation-only.
10. Semantic color roles and reduced-motion treatment are used from shared contracts/tokens.
11. Production bundle/source denial for seed and fixture copy.
12. Existing success, transition, dashboard, WP-080, WP-091–093, accessibility, and relevant progression tests remain green.

Prefer behavioral tests over source-string assertions. Snapshot tests may supplement but not replace contract and route behavior tests.

AGENT-RUN BROWSER ACCEPTANCE

Use existing synthetic/dev states and run the checks at 390×844 and 1440×900. The agent, not Jason, owns these checks.

1. Module 1 success:
   - learning-milestone treatment is visible;
   - accomplishment and evidence precede the next action;
   - Continue reaches Module 2 exactly as before;
   - refresh does not duplicate completion.
2. Module 6 success:
   - complete-draft evidence is truthful and compact;
   - drafting → revising transition is clear;
   - full essay is not dumped into the primary view;
   - Continue reaches Module 7.
3. Module 8 success:
   - verified-document evidence is clear;
   - no old APA checklist returns;
   - writing-finished → guided submission transition is concise;
   - Continue reaches Module 9.
4. Module 9 valid receipt:
   - receipt is persistent and visually primary;
   - filename, time, size, id/status, PDF action, and trail are present;
   - full journey reads completed;
   - refresh and direct reopen retain the same receipt;
   - initial focus lands on the receipt heading.
5. Module 9 missing receipt:
   - no success claim or celebration implies submission;
   - recovery action returns to Module 9.
6. Completed dashboard:
   - status appears once;
   - submission time is visible;
   - final PDF and receipt point to the same accepted submission;
   - compact journey and resubmission policy are clear;
   - development tools remain outside the student completion surface.
7. Keyboard:
   - focus order follows the visual/task order;
   - primary action precedes secondary/reference actions;
   - focus is visible.
8. Responsive and visual stability:
   - no horizontal overflow;
   - no content hidden behind decorative layers;
   - no layout shift that moves the primary action after hydration;
   - line lengths remain readable at desktop width.
9. Reduced motion:
   - the page remains complete and celebratory with reduced motion enabled.
10. Production build:
   - existing production success/dashboard presentation remains unchanged under the gate;
   - no development fixtures, panel labels, or synthetic evidence appear in production chunks.

Record screenshots or structured browser evidence for all representative variants and both viewport sizes. Human review should be requested only for the subjective question of whether the celebration level and visual tone feel age-appropriate; do not offload functional or responsive verification.

ACCEPTANCE CRITERIA

- One shared contract supports four meaningfully different success variants.
- Representative screens visibly answer accomplishment, evidence, next use, and action in that order.
- The design uses page width intentionally without creating long unreadable text.
- Celebration is proportionate, semantic, accessible, and strongest only for final submission.
- Journey language is consistent and honest across shared stages.
- Module 9 receipt trust is unchanged or strengthened.
- Dashboard completion truth is singular, actionable, and synchronized with the receipt.
- No completion/progression behavior changes under the presentation gate.
- Automated and agent browser acceptance pass at both viewports.
- WP-094 contains implementation and acceptance evidence.

OUT OF SCOPE

- Generalizing the new success family to Modules 2, 3, 4, 5, and 7.
- Production promotion of this visual foundation.
- Broad redesign of instructional workspaces, sidebars, shelves, or teacher dashboard.
- New achievement points, grading, analytics, notifications, or certificates.
- Changing any Module 1–9 instructional sequence or persistence schema.
- Changing PDF validation, storage, receipt authority, or resubmission policy.
- Removing legacy success components or rollout paths.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. The complete success/dashboard audit.
2. The proposed shared contract and four variant definitions.
3. The exact artifact evidence available for each representative page.
4. The journey-stage mapping.
5. The development-gate boundary.
6. Files expected to change.
7. Automated and browser acceptance plan.

Then implement, test, perform agent-owned browser acceptance, update WP-094 and only genuinely affected issue evidence, and report any remaining human-only visual-tone judgment separately.
```
