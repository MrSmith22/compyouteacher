# Cursor Prompt 22 — Phase 7 Beta-Readiness Sweep

Use this prompt only after WP-100 is Resolved and both student and teacher production pathways are using the accepted artifact, workspace, success, submission, and progress contracts.

```text
Run the complete Phase 7 beta-readiness validation and objective remediation sweep for the current MLK rhetorical-analysis assignment.

This task must produce defined release evidence, not merely a green build. Build a machine-readable acceptance matrix, execute it across isolated development/test fixtures and a clean production build, repair objective blockers within the accepted product architecture, log larger product decisions separately, and deliver an honest beta-readiness report.

The agent owns all technically automatable testing: account setup, navigation, clicking, responsive checks, keyboard checks, accessible-name/structure checks, refresh/resume, failure injection, API verification, artifact tracing, screenshots, database assertions, and production-bundle checks. Do not assign routine acceptance to Jason.

The only expected human remainder is moderated usability judgment with target-age students and any external condition that remains truly inaccessible after the agent exhausts safe in-scope alternatives.

MANDATORY READING BEFORE EDITING OR TESTING

1. .cursor/rules/writing-processor-revision-strategy.mdc
2. docs/project-standards/walkthroughs/complete-walkthrough-revision-strategy-2026-07-20.md in full, especially:
   - evidence/limitations
   - Sections 1–6
   - Phase 7 and exit condition
   - Epics A–H
   - Section 9 acceptance framework
   - Sections 10–12
3. docs/project-standards/cognitive-load-charter.md
4. docs/project-standards/writing-artifact-decision-architecture.md
5. docs/working-set-v1.md
6. docs/writing-learning-process-v1.md
7. docs/design-system-v1.md
8. the complete walkthrough issue log, including all Open / Needs Verification issues and WP-080–WP-100 evidence
9. all implementation prompts 01–21 and their accepted issue evidence
10. all Module 1–9 artifact contracts, compatibility adapters, health checks, persistence, progression, rollouts, success routes, and handoffs
11. all teacher settings/progress/submission contracts
12. all dev seeds/fixtures/panel actions and their production-denial boundaries
13. all current test scripts, package scripts, CI configuration, migrations, runbooks, production build configuration, and environment contracts

Create one new bounded issue, WP-101. Keep it Open while the matrix is being built/executed. Use Needs Verification only when code is complete but required acceptance remains. Mark Resolved only when every objective release criterion is Pass or an explicitly approved non-blocking limitation with a linked issue.

Do not mark old issues Resolved merely because related tests pass. Re-audit every remaining Open / Needs Verification item against its original acceptance criteria. Update status only with direct evidence.

FIRST PROGRESS REPORT — RELEASE TEST READINESS AUDIT

Before changing product code, report:

TEST INFRASTRUCTURE

- current unit/integration/browser/production test commands and approximate coverage by module;
- browser driver, accessibility tooling, viewport/zoom/reduced-motion support, network interception, file upload support, and screenshot/output locations;
- current deterministic seeds and which required scenarios they cover;
- missing fixtures, non-idempotent seeds, hardcoded accounts, destructive reset behavior, shared-state contamination, and production-only assumptions;
- test parallelism/isolation risks;
- current CI/runtime limits and expected sweep duration;
- how secrets, OAuth tokens, service-role credentials, private URLs, student prose, and screenshots will be protected.

ACCOUNT AND DATA ISOLATION

- how to create/reset an isolated fresh student without deleting unrelated data;
- how to seed returning students at every module boundary;
- how teacher fixtures are assignment-scoped;
- how acceptance-created notes, grading/settings changes, Docs, and submissions will be restored or isolated;
- how production acceptance will avoid synthetic writes or use only reversible, explicitly recorded changes;
- how durable receipts prevent re-upload and how test identities avoid colliding with accepted submissions.

COVERAGE GAPS

- map every Phase 7 requirement and Section 9 scenario to existing tests/fixtures or a missing test;
- map every current production state family from the WP-097 coverage registry to browser acceptance;
- map every module transition and success route;
- map every Open / Needs Verification issue to evidence already available or missing;
- identify external integrations that need real-service, mock-contract, and recovery-path coverage;
- identify whether assignment cloning exists, is partial, or is only an architectural expectation;
- identify blockers requiring product decisions, schema changes, external credentials, or human usability work.

PROPOSED MATRIX

Before editing, provide:

- machine-readable matrix schema;
- scenario ids and fixture ownership;
- pass/fail/blocked/not-applicable definitions;
- release-severity policy;
- artifact-evidence collection plan;
- product-fix boundary;
- report structure;
- files expected to change;
- estimated automated runs and production acceptance plan.

Do not begin broad product changes until the matrix makes the current gaps visible.

MACHINE-READABLE BETA MATRIX

Create a versioned, machine-readable manifest and runner/report output covering at least:

- scenario id/title;
- risk area/epic;
- fixture/account state;
- environment/layer: pure, API integration, dev browser, production browser, external service;
- modules/routes/state families;
- preconditions;
- actions;
- expected UI, artifact, persistence, downstream, accessibility, and privacy outcomes;
- cleanup/restore action;
- result: pass | fail | blocked | not applicable;
- evidence pointers: test name, API assertion, screenshot, log-safe metadata;
- linked issue ids;
- release severity if failed;
- timestamp/build commit.

The matrix must fail the overall sweep when a required scenario has no implementation, was silently skipped, has stale evidence, or lacks cleanup confirmation.

Do not allow a scenario to pass from a screenshot alone when persistence/downstream truth is part of the requirement.

RELEASE-SEVERITY POLICY

Classify findings:

- Blocker: data loss/cross-user exposure, false submission/completion, inaccessible primary path, broken auth, corrupted artifact chain, unrecoverable failure.
- Critical: primary learning path cannot complete, saved work disappears, wrong artifact/source used, production/dev split, teacher sees wrong student/submission.
- High: required instruction/context hidden, local repair impossible, returning student forced to replay/skip, major accessibility/responsive failure.
- Medium: significant clarity/density/consistency problem with a usable safe path.
- Low: polish or subjective improvement.

Automatically fix objective Blocker/Critical/High findings that stay within accepted architecture. Add regression coverage and rerun the affected matrix.

If a fix requires a meaningful new product decision, new authorization model, destructive migration, external coordination, or large scope beyond the accepted strategy:

- create a new bounded issue;
- mark the matrix scenario Blocked;
- keep WP-101 unresolved if the finding prevents beta;
- do not invent permission or silently waive it.

Medium/Low findings may be fixed when localized and safe or logged with an explicit beta-impact decision. Never downgrade a finding merely to close WP-101.

FRESH-ACCOUNT END-TO-END

Run a clean student from sign-in/assignment start through final receipt and dashboard.

Verify at every module:

- one dominant task and correct desk/work/shelf hierarchy;
- explicit action, teaching feedback, and readiness;
- authoritative save before navigation;
- refresh resumes the same state;
- success page truth and next-stage handoff;
- no internal labels leak into prose;
- artifacts remain traceable and editable locally;
- no duplicate completion/activity writes;
- current rollout mode is authoritative/database-backed;
- no console/runtime errors or failed required requests.

Complete Google Doc preparation, guided APA, PDF download protocol, valid PDF selection/inspection/upload, durable receipt, direct receipt reopen, and final student dashboard.

Do not use developer shortcuts for the primary fresh-account path after initial isolated-account creation. The path must prove the real production UI sequence.

RETURNING-ACCOUNT MATRIX

Resume an isolated student at every module boundary and major in-module persistence boundary.

At minimum:

- before/after each Module 1 concept microstep and quiz gate;
- Module 2 partial evidence, selected direction, custom mapping, direction change;
- every Module 3 evidence-to-argument family;
- Module 4 intro/body/conclusion plan and review repair;
- Module 5 reorder/edit/review/finalize;
- Module 6 each section family, evidence move, advanced mode, review;
- Module 7 read-aloud, section revision, before/after, whole-essay fix/return, final review;
- Module 8 creating/verifying/ready/recovery;
- Module 9 guided move/help/fixed/Doc inspection/PDF selection/upload retry/receipt;
- success pages and student dashboard;
- teacher Progress/Submissions/detail/settings views.

Verify refresh, direct route, new browser context/session where feasible, stale client rejection, no replay/skip, correct focus, and unchanged downstream artifacts.

ARTIFACT QUALITY AND CONTRADICTION FIXTURES

Build deterministic, synthetic fixtures for Section 9.4 scenarios:

1. Clean strong student path.
2. Minimal but valid path.
3. One source missing.
4. Evidence assigned to the wrong work.
5. Thesis changed after plans exist.
6. Duplicate body paragraphs.
7. Fragment saved in reasoning.
8. Plan and draft disagree.
9. Quotation without explanation.
10. Conclusion introduces a new claim.
11. Transition with missing/wrong adjacent context.
12. Draft substantially below advisory target.
13. Draft below required minimum.
14. Essay above configured range.
15. Teacher changes word-count settings after drafting.
16. Teacher changes formatting expectations after guided progress.
17. Stale/mismatched Google Doc.
18. Google Doc unavailable or permission lost.
19. Legacy and rebuilt artifacts mixed.
20. Malformed/future-version state.

For each, verify:

- health/mismatch is identified only when supported;
- student prose is never silently rewritten/erased;
- highest-leverage guidance is offered with uncertainty limits;
- local repair reaches the correct artifact;
- returning to review preserves destination;
- downstream artifacts invalidate/review appropriately;
- completion is not falsely certified.

END-TO-END ARTIFACT TRACE

Select at least one final body paragraph and programmatically/browser-trace:

submitted PDF paragraph
→ durable final receipt
→ verified Google Doc/current document signature
→ Module 7 revised paragraph/before-after
→ Module 6 assembled prose/sentence moves
→ Module 5 ordered outline
→ Module 4 paragraph plan/evidence/context/reasoning
→ Module 3 thesis proof direction
→ Module 2 comparison direction/evidence pair
→ source passage provenance.

Verify stable identity through reorder and reload, no plan labels in prose, correct source provenance, and honest confidence when a link cannot be proven.

Produce a machine-readable trace report using metadata/hashes/short safe excerpts only in protected test output. Do not log full student prose or copyrighted source text.

RESPONSIVE, KEYBOARD, AND ACCESSIBILITY

For every layout family and success/teacher family, test:

- 390×844;
- 1440×900;
- 200% browser zoom;
- reduced motion;
- keyboard-only operation;
- visible focus;
- semantic headings/landmarks;
- accessible names/descriptions/errors;
- disclosure expanded/collapsed state;
- radio/checkbox/file input operation;
- modal/drawer focus trap and focus return;
- no color-only meaning;
- no essential horizontal scrolling;
- no clipped controls/content;
- live-region behavior where asynchronous status matters.

Use automated accessibility tooling if available and manually inspect the accessibility tree/tab sequence through the browser driver. Do not claim full screen-reader usability solely from axe or DOM assertions. Record the tested technical scope honestly; leave actual target-user assistive-technology usability to the human study if necessary.

GOOGLE ACCOUNT AND DOCUMENT RECOVERY

Cover real-service behavior when safely accessible and executable contract mocks for destructive/unavailable cases:

- signed out/expired auth;
- popup blocked;
- user denies permission;
- creation succeeds;
- verification succeeds;
- existing current Doc reused;
- stale Doc updated;
- mismatched Doc recovery;
- Doc deleted/unavailable;
- permission lost;
- network/API timeout/5xx;
- duplicate create prevention;
- replaced Doc invalidates guided checks appropriately;
- direct resume after recovery;
- teacher sees Doc availability but not submission without receipt.

Never expose OAuth tokens or private Doc URLs in reports/logs. Do not create/delete a real user document without scoped test ownership and cleanup.

PDF AND SUBMISSION FAILURE MATRIX

Verify:

- tiny valid PDF displays bytes/KB;
- zero-byte file rejected;
- `.pdf` extension with non-PDF payload rejected;
- valid PDF with unexpected MIME accepted only under validated contract;
- malformed/truncated PDF rejected according to current server contract;
- wrong file can be reselected before upload;
- five PDF inspection checks gate upload;
- network failure retains selected file/check state where browser allows;
- server 400/409/500 recovery;
- duplicate upload rejected without replacing receipt;
- durable upload before success navigation;
- persistent receipt fields and same final PDF on dashboard/teacher submission;
- missing receipt recovery;
- refresh/direct receipt reopen;
- already-submitted student bypasses preparation;
- teacher grading changes do not alter receipt.

TEACHER CONFIGURATION

Verify with reversible database-backed operations:

- word count off/advisory/required/range;
- invalid range rejection preserves prior value;
- writing spine, evidence argument, vocabulary transfer, and submission protocol remain independent;
- settings refresh across teacher/student sessions;
- missing schema/config error is recoverable and does not use production file fallback;
- changing settings updates only intended guidance/gates;
- rollback values restore prior modes without deleting student artifacts;
- teacher Progress/Submissions/detail projection remains accurate;
- notes/grading failure rollback;
- anonymous/student teacher-route denial.

Restore every acceptance-modified setting/status/note and assert restoration.

ASSIGNMENT CLONING/CONFIGURATION READINESS

Audit rather than assume assignment cloning exists.

If a supported cloning path exists, test that a clone:

- receives a new assignment id/name;
- copies intended teacher configuration only;
- does not copy student assignments, prose, artifacts, Docs, receipts, notes, grading, or activity;
- preserves independent rollout/settings values or applies documented safe defaults;
- resolves prompt/source/section/formatting configuration without MLK hardcoding;
- keeps teacher authorization/scope correct.

If no supported cloning path exists:

- do not invent a hidden production feature during this sweep;
- audit hardcoded assignment assumptions;
- create a bounded issue with the minimum architecture/product decision needed;
- classify whether missing cloning blocks this beta or a later multi-assignment beta;
- exercise pure configuration cloning/identity helpers only if they already exist.

SECURITY, PRIVACY, AND PRODUCTION DENIAL

Verify:

- anonymous/student/teacher authorization boundaries;
- cross-student and cross-role access denial;
- assignment membership checks;
- roster/detail least-data responses;
- no prose/source/notes/private URLs in list APIs or logs;
- final links only to authorized users;
- dev panel/reset/seeds/fixtures absent or denied in production;
- no synthetic identities in production chunks;
- no client-controlled rollout/config truth;
- no secrets in bundles/reports/screenshots.

PRODUCTION BUILD ACCEPTANCE

Run a clean production build without overrides.

Verify:

- all four instructional rollouts and settings are database-backed and unchanged;
- fresh/returning representative student paths;
- all module/success/dashboard routes;
- teacher Progress/Submissions/Settings;
- real durable receipt identity;
- authorization denials;
- no fixture/dev strings;
- no uncaught console errors or required-request failures;
- rollback/read compatibility with current persisted artifacts.

Use real database-backed rows for truth checks when available. Use isolated executable fixtures for destructive/rare cases. Clearly separate the evidence.

OBJECTIVE REMEDIATION RULES

For every failed required scenario:

1. Reproduce deterministically.
2. Name root cause and affected artifact/contract.
3. Fix the smallest correct boundary.
4. Add focused regression coverage.
5. Rerun the affected scenario, module batch, artifact handoff, and proportional full suite.
6. Update the issue log.

Do not paper over failures by loosening expectations, adding arbitrary waits, seeding impossible state, hiding errors, or skipping scenarios.

If a browser wait is flaky, anchor it to authoritative UI/network/state rather than increasing a global timeout without diagnosis.

BETA-READINESS REPORT

Create a dated report under docs/project-standards/walkthroughs that includes:

- tested commit/environment;
- matrix summary by epic/risk/layer;
- exact automated/browser/production totals;
- fresh and returning account evidence;
- artifact trace result;
- accessibility technical scope and limits;
- Google Docs/PDF/submission evidence;
- teacher configuration/restoration evidence;
- authorization/privacy evidence;
- Open/Needs Verification issue disposition;
- fixed findings and regression tests;
- blocked/non-blocking findings with issue ids;
- human-only target-age usability plan;
- release recommendation: Ready for controlled beta | Ready with stated limitations | Not ready;
- rollback/monitoring notes.

Do not state “beta ready” if a required Blocker/Critical/High scenario is failed, skipped, stale, or blocked without an approved release decision.

AUTOMATED ACCEPTANCE FOR THE HARNESS

Test the beta harness itself:

- manifest schema/version validation;
- no duplicate/missing scenario ids;
- required scenario coverage;
- skip/blocked rules;
- fixture idempotency and cleanup;
- artifact evidence presence;
- sensitive-output redaction;
- stale-evidence/build-commit detection;
- failure exit code;
- report totals equal matrix results;
- production fixture denial.

ACCEPTANCE CRITERIA

- Every Phase 7 and Section 9 required scenario has current evidence.
- Fresh student completes the full real pathway.
- Returning students resume at every boundary without replay/loss/skip.
- Strong/minimal/incomplete/contradictory artifacts behave honestly and recoverably.
- Final paragraph trace is inspectable end to end.
- Responsive/keyboard/accessibility technical checks cover every layout family.
- Google Doc and PDF failure/retry paths preserve trust.
- Teacher settings changes are reversible and scoped.
- Teacher/student authorization and privacy checks pass.
- Production build has no dev infrastructure or fixture leakage.
- Objective beta blockers are fixed with regression coverage or remain explicitly blocking.
- Beta report gives an evidence-backed release recommendation.
- WP-101 contains exact evidence and issue dispositions before Resolved.

OUT OF SCOPE

- Inventing assignment cloning if no supported product path exists.
- New curriculum, prompts, sources, grading rubrics, automated feedback, or analytics.
- Broad redesign not required by an objective failed acceptance criterion.
- Destructive production testing.
- Legacy-path removal solely for cleanup.
- Claiming target-age usability without actual target-age participants.

FIRST RESPONSE REQUIRED

Before product edits, provide:

1. Test infrastructure/account/data-isolation audit.
2. Coverage-gap map against every Phase 7/Section 9 requirement.
3. Proposed machine-readable matrix and severity policy.
4. Fixture/cleanup/production-safety plan.
5. Artifact-trace plan.
6. Google Docs/PDF/teacher configuration plan.
7. Assignment-cloning readiness finding.
8. Files expected to change.
9. Estimated automated execution and beta-report plan.

Then build the harness, execute the sweep, remediate objective blockers within scope, rerun affected and proportional suites, perform production acceptance, update WP-101 and related issues, and deliver the evidence-backed beta-readiness report. Leave only actual target-age usability judgment or genuinely inaccessible external conditions for human follow-up.
```
