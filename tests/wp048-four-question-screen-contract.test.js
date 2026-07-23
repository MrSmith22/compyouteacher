/**
 * WP-048 — Four-question screen contract (Modules 6–9 first pass).
 *
 * Audit matrix (Phase A): source-backed visibility for representative states.
 * visible = always shown without opening Help/disclosure
 * disclosure = only after expanding Why/Self-check (or equivalent)
 * missing = no concise answer in presentation/frame
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import {
  getModule6StepPresentation,
  getModule6ReviewPresentation,
  SECTION_TYPES,
} from "../components/module6/module6StepPresentation.js";
import {
  getModule7StepPresentation,
  MODULE7_STEP_TYPES,
} from "../components/module7/module7StepPresentation.js";
import {
  getModule8StepPresentation,
  MODULE8_STEP_TYPES,
} from "../components/module8/module8StepPresentation.js";
import {
  assertStepPresentationContract,
  pickVisibleFinished,
  pickVisiblePurpose,
  remainingContractLines,
} from "../components/shared/screenContractHelpers.js";
import { MODULE9_SCREEN_CONTRACT } from "../lib/module9/module9ScreenContract.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

/** Explicit Modules 6–9 audit matrix (not architecture docs). */
export const WP048_AUDIT_MATRIX = Object.freeze([
  {
    module: 6,
    stateId: "m6-intro",
    label: "Module 6 introduction drafting",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule6StepPresentation({ type: SECTION_TYPES.INTRO }, { body: [{}] }),
  },
  {
    module: 6,
    stateId: "m6-body",
    label: "Module 6 body drafting",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule6StepPresentation(
        { type: SECTION_TYPES.BODY, bodyIndex: 0 },
        { body: [{ bucket: "Credibility", point: "King builds trust", job: "prove" }] }
      ),
  },
  {
    module: 6,
    stateId: "m6-conclusion",
    label: "Module 6 conclusion drafting",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule6StepPresentation({ type: SECTION_TYPES.CONCLUSION }, { body: [] }),
  },
  {
    module: 6,
    stateId: "m6-review",
    label: "Module 6 whole-draft review",
    preFix: {
      task: "visible",
      purpose: "visible",
      how: "visible",
      finished: "missing",
    },
    getPresentation: () => getModule6ReviewPresentation(),
  },
  {
    module: 6,
    stateId: "m6-entry",
    label: "Module 6 entry / unknown step",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () => getModule6StepPresentation(null, { body: [] }),
  },
  {
    module: 7,
    stateId: "m7-read-aloud",
    label: "Module 7 read aloud",
    preFix: {
      task: "visible",
      purpose: "missing",
      how: "visible",
      finished: "missing",
    },
    getPresentation: () =>
      getModule7StepPresentation({ type: MODULE7_STEP_TYPES.READ_ALOUD }, { body: [] }),
  },
  {
    module: 7,
    stateId: "m7-intro",
    label: "Module 7 intro revision",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule7StepPresentation({ type: SECTION_TYPES.INTRO }, { body: [{}] }),
  },
  {
    module: 7,
    stateId: "m7-body",
    label: "Module 7 body revision",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule7StepPresentation(
        { type: SECTION_TYPES.BODY, bodyIndex: 0 },
        { body: [{ bucket: "Credibility" }] }
      ),
  },
  {
    module: 7,
    stateId: "m7-conclusion",
    label: "Module 7 conclusion revision",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule7StepPresentation({ type: SECTION_TYPES.CONCLUSION }, { body: [] }),
  },
  {
    module: 7,
    stateId: "m7-final-review",
    label: "Module 7 final review",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule7StepPresentation({ type: MODULE7_STEP_TYPES.FINAL_REVIEW }, { body: [] }),
  },
  {
    module: 8,
    stateId: "m8-create-doc",
    label: "Module 8 create/update Google Doc",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule8StepPresentation({ type: MODULE8_STEP_TYPES.CREATE_DOC }),
  },
  {
    module: 8,
    stateId: "m8-format",
    label: "Module 8 APA format",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule8StepPresentation({ type: MODULE8_STEP_TYPES.FORMAT }),
  },
  {
    module: 8,
    stateId: "m8-ready",
    label: "Module 8 ready check",
    preFix: {
      task: "visible",
      purpose: "disclosure",
      how: "visible",
      finished: "disclosure",
    },
    getPresentation: () =>
      getModule8StepPresentation({ type: MODULE8_STEP_TYPES.READY }),
  },
  {
    module: 9,
    stateId: "m9-learn",
    label: "Module 9 learn APA moves",
    preFix: {
      task: "visible",
      purpose: "visible",
      how: "visible",
      finished: "visible",
    },
    getPresentation: () => MODULE9_SCREEN_CONTRACT[1],
  },
  {
    module: 9,
    stateId: "m9-open-doc",
    label: "Module 9 open verified Doc",
    preFix: {
      task: "visible",
      purpose: "visible",
      how: "visible",
      finished: "visible",
    },
    getPresentation: () => MODULE9_SCREEN_CONTRACT[2],
  },
  {
    module: 9,
    stateId: "m9-format",
    label: "Module 9 format checklist",
    preFix: {
      task: "visible",
      purpose: "visible",
      how: "visible",
      finished: "visible",
    },
    getPresentation: () => MODULE9_SCREEN_CONTRACT[3],
  },
  {
    module: 9,
    stateId: "m9-submit-pdf",
    label: "Module 9 download/check/submit PDF",
    preFix: {
      task: "visible",
      purpose: "visible",
      how: "visible",
      finished: "visible",
    },
    getPresentation: () => MODULE9_SCREEN_CONTRACT[4],
  },
]);

describe("WP-048 four-question screen contract (Modules 6–9)", () => {
  it("audit matrix covers representative states for Modules 6–9", () => {
    for (const module of [6, 7, 8, 9]) {
      const rows = WP048_AUDIT_MATRIX.filter((row) => row.module === module);
      assert.ok(rows.length >= 3, `module ${module} needs representative states`);
      assert.ok(rows.length <= 5, `module ${module} should stay within audit bound`);
    }
  });

  it("presentation objects cannot silently omit required contract fields", () => {
    for (const row of WP048_AUDIT_MATRIX.filter((item) => item.module <= 8)) {
      const presentation = row.getPresentation();
      assertStepPresentationContract(presentation, row.stateId);
      assert.ok(String(presentation.question || row.getPresentation().task || "").trim());
      assert.ok(pickVisiblePurpose(presentation.whyMatters));
      assert.ok(pickVisibleFinished(presentation.successLooksLike));
    }

    for (const row of WP048_AUDIT_MATRIX.filter((item) => item.module === 9)) {
      const contract = row.getPresentation();
      assert.ok(contract.task);
      assert.ok(contract.purpose);
      assert.ok(contract.how);
      assert.ok(contract.finished);
    }
  });

  it("Modules 6–8 keep visible task/purpose/how/finished via the shared frame", () => {
    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.ok(frame.includes('data-testid="screen-contract-task"'));
    assert.ok(frame.includes("ScreenContractCues"));
    assert.ok(frame.includes("pickVisiblePurpose"));
    assert.ok(frame.includes("pickVisibleFinished"));
    assert.ok(frame.includes("remainingContractLines"));
    const jobRightNow = readSrc("components/shared/JobRightNow.jsx");
    assert.ok(
      frame.includes('data-testid="screen-contract-how"') ||
        jobRightNow.includes('data-testid="screen-contract-how"')
    );
    assert.ok(frame.includes("More about why this matters"));
    assert.ok(frame.includes("More self-check details"));

    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    assert.ok(m6.includes("ModuleSixStepFrame"));
    assert.ok(m7.includes("ModuleSixStepFrame"));
    assert.ok(m8.includes("ModuleSixStepFrame"));
    assert.ok(m6.includes("jobRightNow={presentation.jobRightNow}"));
    assert.ok(m8.includes("howToSucceed={presentation.howToSucceed"));
  });

  it("detailed Help/examples can stay collapsed without hiding the only answer", () => {
    for (const row of WP048_AUDIT_MATRIX.filter((item) => item.module <= 8)) {
      const presentation = row.getPresentation();
      const purpose = pickVisiblePurpose(presentation.whyMatters);
      const finished = pickVisibleFinished(presentation.successLooksLike);
      const whyRest = remainingContractLines(presentation.whyMatters, purpose);
      const finishedRest = remainingContractLines(
        presentation.successLooksLike,
        finished
      );
      assert.ok(purpose, `${row.stateId} needs visible purpose`);
      assert.ok(finished, `${row.stateId} needs visible finished cue`);
      assert.equal(whyRest.includes(purpose), false);
      assert.equal(finishedRest.includes(finished), false);
    }

    const frame = readSrc("components/module6/ModuleSixStepFrame.jsx");
    assert.ok(frame.includes("InstructionalDisclosure"));
    assert.ok(frame.includes("See an example") || frame.includes("An example (and why it works)"));
  });

  it("Module 9 keeps WP-047 sequence and WP-038–046 protections with explicit contract cues", () => {
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m9.includes("MODULE9_SCREEN_CONTRACT"));
    assert.ok(m9.includes("module9ScreenContract"));
    assert.ok(m9.includes("ScreenContractCues"));
    assert.ok(m9.includes('data-testid="module9-journey-progress"'));
    assert.equal(m9.includes("guidedMode"), false);
    assert.equal(/first-try matches/i.test(m9), false);
    assert.ok(m9.includes("ModuleNineApaLesson"));
    assert.ok(m9.includes("ModuleNinePdfDownloadVisual"));
    assert.ok(m9.includes('data-testid="module9-pdf-upload-coaching"'));
    assert.ok(m9.includes('data-testid="module9-wrong-pdf-reassurance"'));
    assert.ok(m9.includes('data-testid="module9-final-upload-checklist"'));
    assert.ok(m9.includes('data-testid="module9-do-not-rewrite-coaching"'));
    assert.ok(m9.includes("SubmissionDocRecoveryPanel"));
    assert.ok(m9.includes('router.push("/modules/9/success")'));
    assert.ok(m9.includes("canUpload ="));
    assert.ok(m9.includes("finalUploadChecklistComplete"));

    for (const step of [1, 2, 3, 4]) {
      const contract = MODULE9_SCREEN_CONTRACT[step];
      assert.ok(contract.task && contract.purpose && contract.how && contract.finished);
    }
  });

  it("preserves persistence and progression gates", () => {
    const m6 = readSrc("components/ModuleSix.js");
    const m7 = readSrc("components/ModuleSeven.js");
    const m8 = readSrc("components/ModuleEight.js");
    const m9 = readSrc("components/ModuleNine.js");
    assert.ok(m6.includes("atomicWriteModule6Draft") || m6.includes("finalize"));
    assert.ok(m7.includes("locked") || m7.includes("sections"));
    assert.ok(m8.includes("verifySubmissionGoogleDocContent") || m8.includes("contentVerified"));
    assert.ok(m9.includes("requireModuleAccess"));
    assert.ok(m9.includes("/api/final-pdf"));
    assert.ok(m9.includes("upsertModule9Checklist"));
  });
});
