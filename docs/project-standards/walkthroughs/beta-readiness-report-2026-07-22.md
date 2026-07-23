# Beta-readiness report — MLK rhetorical analysis (WP-101)

**Date:** 2026-07-22  
**Tested commit:** `767338d0f95bee2d65743d2f9cecdabd05fbb4ee`  
**Assignment:** `mlk-rhetorical-analysis`  
**Environments:** local development (`http://127.0.0.1:3000`); production build `.next-wp101-prod` on `http://127.0.0.1:3016`  
**Matrix:** [`docs/project-standards/beta-matrix/v1/manifest.json`](../beta-matrix/v1/manifest.json) (schema `1.0.0`, **153** scenarios)  
**Results:** [`beta-matrix-results/767338d0f95bee2d65743d2f9cecdabd05fbb4ee.json`](./beta-matrix-results/767338d0f95bee2d65743d2f9cecdabd05fbb4ee.json)

---

## Release recommendation

**Ready with stated limitations** for a **single-assignment MLK controlled beta**.

Objective Blocker/Critical/High trust, path, privacy, submission, and production-denial scenarios in the matrix are **Pass**. Remaining limitations are explicitly logged (WP-102, WP-103) or are instructional Open/Needs Verification items that do not fail the objective release gate.

Do **not** claim target-age usability without a moderated student study.

---

## Matrix summary

| Result | Count |
|---|---:|
| pass | 153 |
| fail | 0 |
| blocked | 0 |
| not_applicable | 0 |
| **Gate** | **ok** |

### By layer (approximate)

| Layer | Role |
|---|---|
| pure / api | Contradiction fixtures, PDF/Doc/teacher/security contracts, WP-097 coverage, suites, harness |
| dev_browser | Fresh isolation, returning boundaries, a11y technical, PDF file-input presence |
| prod_browser | Clean build routes, panel 404, fixture denial, chunk scan |

### By epic / risk (high level)

- **A** Artifact honesty — 20 §9.4 contradiction fixtures + lineage trace  
- **E** Teacher config / cloning audit  
- **F** Google Doc recovery contracts + panel sims  
- **G** PDF/submission trust + FRESH completion  
- **H** Workspace coverage (42 families) + returning + a11y  
- **ops** Harness, security, production  

---

## Automated totals

| Suite | Result |
|---|---|
| `tests/wp101-beta-harness.test.js` | 13/13 |
| Related regression (wp080, wp081 health, wp084, wp093, wp097 registry, wp100, wp101) | 84/84 |
| `scripts/wp101-browser-acceptance.mjs` | 24/24 |
| `scripts/wp101-prod-acceptance.mjs` | 4/4 |
| Matrix gate | 153/153 pass |

Browser screenshots: `/tmp/wp101-browser/` (not committed).  
Prod screenshots: `/tmp/wp101-browser/prod/` (not committed).

---

## Fresh and returning account evidence

**Fresh (`FRESH.e2e_real_ui`):** Pass with limitation.

- `restartEntireAssignment` on isolated/dev student session  
- Module 1 entry verified (empty/start instructional surface)  
- Durable completion via `seedThrough completeEssay` (production PDF pipeline when available)  
- Module 9 / dashboard inspected after seed  

**Limitation (WP-103):** Does not click every Module 2–8 control without seeds. Returning-boundary matrix + module suites cover resume contracts.

**Returning (`RETURN.*`):** 21/21 pass — seed + route + refresh for each mapped boundary (M1–M9, dashboard, teacher).

---

## Artifact trace

[`beta-artifact-trace/767338d0f95bee2d65743d2f9cecdabd05fbb4ee.json`](./beta-artifact-trace/767338d0f95bee2d65743d2f9cecdabd05fbb4ee.json)

- Core lineage `coreOk: true`  
- Hashes / short excerpts only (no full student prose or copyrighted source)  
- Plan labels in prose: false  

---

## Accessibility (technical scope and limits)

`A11Y.layout_families` Pass:

- Viewports 390×844 and 1440×900 (no essential horizontal scroll on sampled Module 6)  
- 200% zoom screenshot on Module 9  
- `prefers-reduced-motion: reduce` sampled  
- Keyboard Tab ×12; `main` landmark present; headings present  

**Limits:** Not a full screen-reader usability claim. Visible focus after tab landed on `BODY` in one sample — improve focus rings as polish (not release-blocking). Target-user AT judgment remains human.

---

## Google Docs / PDF / submission

- Doc recovery: panel sims + export/verify source contracts Pass (`DOC.*`)  
- PDF validation: pure contracts Pass (`PDF.*`); browser file-input presence Pass (`PDF.network_retain`)  
- WP-080 suite evidence wired  
- Real OAuth popup / live Google account denial paths: covered by contract/sims; destructive real-Doc create/delete not performed outside scoped seeds  

---

## Teacher configuration / restoration

- Word-count modes, rollouts independence, projection, auth denial: Pass (`TEACH.*`, `SEC.*`)  
- Acceptance mutations use cleanup ledger helpers; teacher settings restore asserted in harness self-test  
- Progress/Submissions privacy: WP-100 suite + prod fixture denial  

---

## Authorization / privacy

- `requireTeacherSession` 401/403  
- Assignment membership (`not_in_assignment`)  
- Roster least-data / no fixture source in production  
- Production: `/api/dev/panel` → 404; client chunks free of synthetic fixture builders  

---

## Open / Needs Verification disposition

| Disposition | Issues |
|---|---|
| Resolved in WP-101 re-audit | WP-005, WP-010, WP-028, WP-029, WP-047 |
| Remain Open (instructional; non-blocking for trust beta) | WP-008, WP-009, WP-019–WP-026 |
| Remain Needs Verification (coaching/voice; subjective or partial) | WP-012–WP-016, WP-048–WP-062 (excl. resolved), WP-073–WP-077 |
| Non-blocking follow-ups | **WP-102** cloning; **WP-103** full fresh click-through |

---

## Fixed findings and regression

No objective Blocker/Critical/High product defects required code fixes during this sweep. Delivery was harness + matrix + evidence. Regression suites above remain green.

---

## Blocked / non-blocking findings

| Finding | Severity | Issue | Beta impact |
|---|---|---|---|
| No assignment cloning path | High (architecture) | WP-102 | Non-blocking (MLK-only beta) |
| Fresh path uses durable seed after M1 | High (verification) | WP-103 | Non-blocking with RETURN.* + suites |
| Module 6–7 coaching density | High/Critical instructional | WP-012–026, etc. | Non-blocking for trust/path; human study |

---

## Human-only target-age usability plan

1. Recruit moderated sessions with target-age students on the MLK assignment.  
2. Observe: dominant task clarity, repair without full replay, Doc/PDF trust language, celebration feel.  
3. Do not treat agent keyboard/DOM checks as AT certification.  
4. Feed findings into new bounded issues — do not reopen WP-101 without new objective failures.

---

## Rollback / monitoring

- Code-only teacher progress promotion already rollback-safe (WP-100).  
- Instructional rollouts remain database-backed and independent.  
- Monitor: final_pdf receipt creation errors, Google Doc verify failures, teacher roster 401/403 rates, `/api/dev/panel` must stay 404 in production.  
- Re-run `npm run test:beta-manifest && npm run test:beta-matrix` after browser/prod external merges on each release candidate commit.

---

## How to re-run

```bash
node scripts/wp101-write-manifest.mjs
# with dev server on :3000
node scripts/wp101-browser-acceptance.mjs
# production
NEXT_DIST_DIR=.next-wp101-prod npx next build
NEXT_DIST_DIR=.next-wp101-prod NODE_ENV=production NEXTAUTH_URL=http://127.0.0.1:3016 npx next start -p 3016 -H 127.0.0.1
WP101_PROD_BASE=http://127.0.0.1:3016 WP101_DIST=.next-wp101-prod node scripts/wp101-prod-acceptance.mjs
node scripts/wp101-run-matrix.mjs
node --test tests/wp101-beta-harness.test.js
```
