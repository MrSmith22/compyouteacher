# Cursor Prompt 16 — Generalize and Promote the Success System

Use this prompt only after WP-094 is Resolved. This completes the Phase 6 success-screen work by extending the accepted family to Modules 2, 3, 4, 5, and 7, then promoting the coherent nine-module success and completed-dashboard presentation to production.

```text
Generalize the accepted WP-094 success-experience family to the five remaining module success routes—Modules 2, 3, 4, 5, and 7—and production-promote the complete success/dashboard presentation only after all nine module routes pass agent-owned acceptance.

This task extends an accepted visual and semantic contract. Do not redesign SuccessExperienceShell, SuccessJourneyTrail, SuccessCelebrationMotif, the four success variants, or the completed-dashboard foundation unless browser evidence reveals a concrete defect. Do not change instructional flows, persistence, progression, rollout modes, PDF trust, grading, or artifact ownership.

WP-094 is the foundation and must remain behaviorally intact. Preserve its representative Module 1, 6, 8, and 9 implementations and completed-dashboard behavior while adding truthful module-specific evidence for the remaining five success moments.

MANDATORY READING BEFORE EDITING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md
   - Sections 1–2
   - Sections 3.11–3.16
   - every Module 1–9 success requirement
   - Dashboard required revisions and acceptance criteria
   - Section 6, especially the shared journey, page composition, semantic color, local transitions, and success-screen family
   - Phase 6 and its exit condition
   - Epic H
   - Sections 8–9
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. Prompt 15 and the complete WP-094 issue entry, implementation, tests, browser script, screenshots/evidence, and production-gate findings
9. lib/ui/successExperienceContract.js
10. lib/ui/writingJourneyStages.js
11. components/success/SuccessExperienceShell.jsx
12. components/success/SuccessJourneyTrail.jsx
13. components/success/SuccessCelebrationMotif.jsx
14. components/success/CompletedDashboardFoundation.jsx
15. lib/dev/isSuccessExperienceFoundationEnabled.js
16. Module 1, 6, 8, and 9 success integrations and app/dashboard/page.js
17. every current Module 2, 3, 4, 5, and 7 success route, client, helper, loader, progression write, action, and error/recovery state
18. Module 2 saved-source/evidence and essay-direction contracts
19. Module 3 evidence-to-argument contract, thesis/proof plan, success client, and Module 4 handoff
20. Module 4 plan/bucket/essay-map success helpers and Module 5 handoff
21. Module 5 outline artifact, reorder identity, success client, and Module 6 handoff
22. Module 7 final revised essay, whole-essay review, word-count setting, success route, and Module 8 handoff
23. WP-010, WP-017, WP-018, WP-047, WP-050, WP-052, WP-056, WP-061, WP-069, WP-080, WP-085, WP-088, WP-091, WP-093, and WP-094 in the issue log
24. all success, transition, artifact handoff, idempotent completion, accessibility, responsive, dashboard, receipt, and production-bundle tests

Create one new bounded issue, WP-095. Do not reopen WP-094. Keep WP-095 Open during implementation and Needs Verification until generalization, production promotion, production-build browser acceptance, route/direct-reopen checks, and dev-infrastructure denial all pass. Update older issues only with evidence this work genuinely supplies.

FIRST PROGRESS REPORT — GENERALIZATION AND PRODUCTION AUDIT

Before editing, report:

- the exact component/helper/data path for each remaining Module 2, 3, 4, 5, and 7 success page;
- every persisted artifact that is actually available when each success route renders;
- which artifact fields are trustworthy enough for compact evidence and which must not be inferred;
- the current title, explanation, actions, next route, loading/error behavior, direct reopen behavior, and completion/progression write for each page;
- whether each success page can render independently after refresh or depends on transient client state;
- every render-time or mount-time activity/progression side effect and its idempotency protection;
- the correct success variant, journey stage, celebration intensity, and truthful evidence projection for each remaining module;
- how the shared Plan stage will distinguish Module 4 planning from Module 5 outlining without pretending they are different journey stages;
- how Module 7 will distinguish a completed revised essay from the Module 6 completed draft and from Module 8 preparation;
- all direct `isSuccessExperienceFoundationEnabled` calls and the smallest safe path from development-only presentation to production presentation;
- whether the visual-only promotion needs any database setting. The default decision should be no new setting or migration because this contract changes presentation only; justify any contrary proposal before editing;
- how code/deployment rollback preserves every artifact and route without maintaining a second student-state model;
- development fixtures, browser scripts, panel actions, fixture strings, or build artifacts that must remain excluded from production;
- exact production-build acceptance for all nine success routes and completed dashboard;
- files expected to change and automated/browser test plan.

Do not edit until each evidence projection is tied to an existing authoritative artifact and the promotion boundary is explicit.

GENERALIZATION CONTRACT

Extend the existing pure successExperienceContract with module-specific builders/projections for Modules 2, 3, 4, 5, and 7. Do not create separate shells or copy the WP-094 JSX into each route.

Every builder must return the accepted shared shape and must:

- omit unavailable evidence rather than inventing a fallback achievement;
- derive labels/counts from shared artifact helpers where they exist;
- keep private student prose out of decorative summaries and telemetry;
- expose at most three compact evidence items;
- preserve one primary action and the existing destination;
- preserve existing recovery and secondary actions only when genuinely useful;
- use the shared journey-stage resolver;
- remain deterministic and presentation-only;
- never write progression, activity, artifacts, or rollout settings.

MODULE 2 — EVIDENCE SET READY

Use an artifact-completed or phase-transition treatment according to the accepted contract audit. The page should communicate that the student has selected a workable comparison and is ready to develop an argument—not that analysis is already finished.

Truthful evidence may include, only when present:

- the two works/sources represented;
- the selected rhetorical relationship/direction in student-facing language;
- confirmation that supporting evidence exists for both works.

Do not dump quotations, internal option ids, schema versions, sourceParagraphIndex values, or diagnostic metadata. The next use is Module 3: explain the relationship and build the argument.

MODULE 3 — ARGUMENT MAP READY

Use an artifact-completed treatment. Emphasize that the student now has a comparative argument that can guide planning.

Truthful evidence may include, only when present:

- a concise thesis-ready/argument-ready status;
- the number or student-facing names of proof directions;
- a compact argument-map structure without reproducing long student prose.

Preserve the accepted Module 3 success/handoff behavior and Module 4 consumption of thesis and proofPlan. Never rewrite or normalize student work merely to display the success page.

MODULE 4 — WRITING PLAN READY

Use an artifact-completed treatment within the shared Plan journey stage. Make clear that the student has decided what each essay section will do; the formal outline comes next.

Truthful evidence may include, only when present:

- Introduction / required Body Paragraphs / Conclusion coverage;
- body-paragraph purposes or jobs in compact labels;
- evidence allocation readiness derived from the saved plan.

Use stable student-facing section labels. Never show array indices, bucket ids, paragraph implementation labels, full quotations, or incomplete fields as complete.

MODULE 5 — OUTLINE READY

Use an artifact-completed or phase-transition treatment within the same shared Plan stage. Make the difference from Module 4 explicit in one sentence: the plan identified the parts; the outline placed them in writing order.

Truthful evidence may include, only when present:

- ordered section map;
- number of body paragraphs;
- readiness of sentence moves or outline components derived from the saved outline.

Respect sourceParagraphIndex identity after reorder. Do not expose Roman numerals as the only way to understand the structure, and do not show implementation ids.

MODULE 7 — REVISED ESSAY READY

Use an artifact-completed and phase-transition treatment consistent with the accepted variants. Emphasize that the essay has been strengthened and writing is finished; preparation is next.

Truthful evidence may include, only when present:

- complete revised-essay status;
- section count/map;
- shared-helper word total and teacher expectation status, if configured and already available;
- completed whole-essay review checks without restating the whole checklist.

Do not display the full essay, claim it is submitted, or imply APA preparation is complete. Preserve the newest Module 7 essay as the authoritative text Module 8 receives.

SHARED PLAN-STAGE SEMANTICS

Modules 4 and 5 both map to Plan. The trail must not show a fake extra stage or regress from Plan to Plan. Use concise module-specific accomplishment copy while the journey indicator remains stage-based.

When reopening Module 4 success after Module 5 is already complete, do not misrepresent the overall assignment as currently at an earlier stage if authoritative progress says otherwise. Audit and define whether the success page shows:

- the stage this artifact completed; and
- the furthest authoritative overall stage separately when needed.

Do not silently change the accepted WP-094 trail semantics. Add a pure projection only if direct-reopen evidence demonstrates the need.

PRODUCTION PROMOTION

After all nine success pages use the accepted family and pass development acceptance:

- make the shared success/dashboard presentation the normal production presentation;
- remove the development-only decision from student-facing rendering;
- do not add a database rollout column for a presentation-only change unless the audit proves an operational necessity;
- retain legacy JSX only if it is still needed for a documented recovery/compatibility path; otherwise remove dead duplicate presentation code after tests prove parity;
- preserve the shared pure contract as the single source of truth;
- remove or retire `isSuccessExperienceFoundationEnabled` rather than converting it to `return true` while leaving misleading development semantics;
- keep development seeds, test fixtures, browser harness labels, and testing panel actions inaccessible in production;
- make rollback a normal code/deployment rollback that changes presentation only and never alters student data;
- do not couple success rendering to any instructional rollout mode;
- ensure server and client success routes do not hydrate from legacy to rebuilt or shift actions after load.

No migration should be necessary. If Cursor finds that a success screen lacks artifact data on direct reopen, repair its authoritative read path or render honest reduced evidence. Do not create a new persistence table merely to decorate a success page.

PAGE COMPOSITION, COLOR, AND CELEBRATION

Reuse the accepted WP-094 shell and motif. Generalized pages must:

- keep accomplishment → evidence → next use → action as the semantic order;
- use page width intentionally at desktop without overly long prose lines;
- stack in task order on mobile;
- use existing semantic color roles with non-color cues;
- use variant-appropriate celebration intensity;
- respect reduced motion;
- avoid duplicate journey trails, nested success cards, repeated headings, and repeated next-step copy;
- keep optional details disclosed and primary truth visible;
- retain 44px primary controls and visible focus.

Do not make every page visually identical. Shared structure should create familiarity while artifact evidence and transition emphasis distinguish the module’s accomplishment.

PRESERVE ALL ACCEPTED TRUST AND PROGRESSION CONTRACTS

- Module completion logging remains idempotent.
- Rendering success never creates completion.
- Back/direct route/refresh behavior remains intact.
- Every primary action reaches the same next module as before.
- Module 9 receipt remains highest-authority terminal evidence.
- Missing Module 9 receipt remains recovery, not celebration.
- Dashboard final PDF and receipt remain synchronized.
- Already-submitted students never replay preparation.
- All four assignment instructional rollout settings remain independent and database-backed.
- No student artifact is rewritten for display.
- No automatic redirect removes the student’s opportunity to understand completion.

AUTOMATED TESTS

Add focused WP-095 behavioral coverage for at least:

1. Module 2 builder with complete, partial, and missing evidence-pair artifacts.
2. Module 3 builder with current, legacy-compatible, partial, and missing argument maps.
3. Module 4 builder with stable section labels and honest incomplete-plan omission.
4. Module 5 builder preserving outline order and durable paragraph identity.
5. Module 7 builder using the newest revised essay and shared word-count helper.
6. Modules 4 and 5 sharing Plan without duplicate/fake journey stages.
7. One primary action and unchanged destination on every Module 1–9 success route.
8. Direct reopen with missing/partial artifacts produces honest reduced evidence or recovery, never invented completion.
9. No success render writes progression/activity and completion stays idempotent.
10. The production presentation no longer depends on a development gate.
11. No dev fixture/panel/browser-harness strings in production bundles.
12. All WP-094, WP-080, success accessibility, role-transition, handoff, dashboard, and progression tests.

The previously reported WP-052 test expecting `Start Paragraph 1` may not be waived automatically. Audit whether the accepted student-facing label is now `Start Body Paragraph 1`. If the product behavior is correct and the test is stale, update that test in a separate, explicit WP-052 evidence change with justification. If behavior is wrong, fix behavior. Do not carry a knowingly stale red test into production acceptance.

AGENT-RUN BROWSER ACCEPTANCE

The agent owns routine acceptance. Verify development/generalization first, then a clean production build without visual overrides.

At both 390×844 and 1440×900:

1. Open all nine success routes from valid representative completed states.
2. For every page verify:
   - truthful accomplishment;
   - artifact evidence when available;
   - no fabricated evidence when unavailable;
   - clear next use;
   - exactly one primary action;
   - correct next destination;
   - no duplicate trail/title/status/action;
   - no horizontal overflow or decorative obstruction;
   - stable layout through hydration;
   - logical visible keyboard focus order.
3. Refresh and directly reopen every success route.
4. Confirm refresh/direct reopen does not duplicate completion activity.
5. Specifically verify Module 2 does not claim argument completion.
6. Specifically verify Module 3 argument map still hands off to Module 4.
7. Specifically verify Module 4 vs Module 5 Plan-stage distinction.
8. Reorder Module 5 body paragraphs before success and confirm displayed order/labels remain correct.
9. Specifically verify Module 7 uses the newest revised essay and does not claim submission.
10. Re-run WP-094 representative M1/M6/M8/M9 and dashboard checks to catch regressions.
11. Verify Module 9 valid receipt, missing receipt, refresh, direct reopen, focus, and identical dashboard PDF.
12. Verify completed dashboard has one status, submission time, PDF, receipt, trail, policy, and no student-surface dev controls.
13. Enable reduced motion and confirm every page remains complete.
14. Production build:
    - the shared presentation renders on all nine success routes and completed dashboard;
    - no development gate/override is required;
    - `/api/dev/panel` and reset endpoints remain denied;
    - no fixture/seed strings occur in production chunks;
    - existing production instructional flows and rollout API values remain unchanged.
15. If legacy presentation code is removed, verify missing/partial artifact and error/recovery states before declaring it dead.

Capture structured evidence and screenshots for the five newly generalized pages plus a representative regression set from WP-094. Human review is limited to subjective age-fit and visual tone; functional acceptance is not a human remainder.

ACCEPTANCE CRITERIA

- All nine success routes use one accepted family with module-specific truthful evidence.
- Modules 2, 3, 4, 5, and 7 preserve their existing artifact and progression contracts.
- Plan-stage semantics remain honest across Modules 4–5.
- Direct reopen and partial-data states do not fabricate accomplishment evidence.
- The completed dashboard and final receipt remain synchronized and trustworthy.
- The system renders normally in production without a development visual gate.
- No new database mode or student-state table is introduced without a proven need.
- Dev infrastructure remains absent/denied in production.
- All relevant tests, including the audited WP-052 transition expectation, are green.
- Agent browser acceptance passes at both viewports and reduced motion.
- WP-095 records full implementation and production evidence before Resolved.

OUT OF SCOPE

- Redesigning instructional module workspaces, sidebars, desks, shelves, or teacher dashboard.
- Changing success actions, progression rules, artifact schemas, or instructional rollout modes.
- Adding points, grades, certificates, social sharing, notifications, or analytics.
- Changing submission validation, receipt authority, or resubmission rules.
- Removing legacy instructional pathways.
- Broad typography or brand redesign unrelated to the success family.

FIRST RESPONSE REQUIRED

Before editing, provide:

1. The five-route artifact/action/direct-reopen audit.
2. Proposed module-specific builders, variants, evidence, and celebration intensity.
3. Shared Plan-stage handling for Modules 4–5.
4. Production-promotion and rollback boundary, including why no database migration is needed.
5. Files expected to change.
6. Automated and browser acceptance plan.

Then implement, test, perform agent-owned development and production-build acceptance, resolve any newly found regressions, update WP-095 and related issue evidence, and report any genuinely subjective human-only visual judgment separately.
```
