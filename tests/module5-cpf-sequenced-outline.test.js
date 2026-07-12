/**
 * CP-F — Module 5 sequenced outline + job-preserving mapping.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const mapper = require("../lib/module4/mapStudentBucketsToOutline.js");
const stages = require("../lib/module5/module5OutlineStageHelpers.js");
const persist = require("../lib/module5/outlinePersistenceHelpers.js");
const {
  buildDraftSectionSteps,
} = require("../components/module6/module6StepPresentation.js");

const POINT =
  "King builds trust differently for each audience in the speech and letter.";
const REASONING =
  "The speech quotation builds hope for a public audience, while the letter quotation builds moral pressure for clergy—together they prove the contrast in my thesis.";

function plannedBucket(overrides = {}) {
  return {
    claim: POINT,
    paragraphRole: "show_difference",
    reasoning: REASONING,
    suggestionId: "proof-0",
    evidenceKeys: ["tchart:speech:pathos"],
    evidenceSnippets: [
      {
        quote: "I have a dream",
        observation: "Speech pathos moment",
      },
    ],
    ...overrides,
  };
}

function twoPlanned() {
  return [
    plannedBucket({
      claim: "Speech builds public hope through pathos.",
      paragraphRole: "analyze_speech",
      suggestionId: "proof-0",
      evidenceKeys: ["tchart:speech:pathos"],
      evidenceSnippets: [
        { quote: "I have a dream", observation: "Speech hope" },
      ],
    }),
    plannedBucket({
      claim: "Letter builds clerical pressure through ethos.",
      paragraphRole: "analyze_letter",
      suggestionId: "proof-1",
      evidenceKeys: ["tchart:letter:ethos"],
      evidenceSnippets: [
        { quote: "I have the honor", observation: "Letter ethos" },
      ],
    }),
  ];
}

function threePlanned() {
  return [
    ...twoPlanned(),
    plannedBucket({
      claim: "Both works reject waiting for justice as a shared pattern.",
      paragraphRole: "compare_both",
      suggestionId: "proof-2",
      evidenceKeys: ["tchart:speech:pathos", "tchart:letter:pathos"],
      evidenceSnippets: [
        { quote: "I have a dream", observation: "Speech" },
        { quote: "nobodiness", observation: "Letter" },
      ],
    }),
  ];
}

describe("CP-F Module 5 mapper and stages", () => {
  it("1. Real mapper preserves Module 4 job", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    assert.equal(body[0].job, "Analyze the speech");
    assert.equal(body[0].jobId, "analyze_speech");
    assert.equal(body[1].job, "Analyze the letter");
  });

  it("2. Custom job displays without custom:", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: [
        plannedBucket({
          paragraphRole: "custom:Compare the openings carefully",
        }),
        plannedBucket({ paragraphRole: "analyze_letter" }),
      ],
      wantThirdBucket: false,
    });
    assert.equal(body[0].job, "Compare the openings carefully");
    assert.equal(body[0].job.includes("custom:"), false);
  });

  it("3. Legacy role maps to readable label", () => {
    assert.equal(mapper.jobLabelForOutline("similarity"), "Show an important similarity");
    assert.equal(mapper.jobLabelForOutline("diff_speech"), "Shows a difference in the speech");
  });

  it("4. Point/evidence/reasoning remain exact", () => {
    const buckets = twoPlanned();
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets,
      wantThirdBucket: false,
    });
    assert.equal(body[0].point, buckets[0].claim);
    assert.equal(body[0].reasoning, buckets[0].reasoning);
    assert.equal(body[0].evidence[0].quote, "I have a dream");
  });

  it("5. Original paragraph index is preserved after reorder", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const reordered = stages.moveOutlineBodyCard(body, 1, 0);
    assert.equal(reordered[0].sourceParagraphIndex, 1);
    assert.equal(reordered[1].sourceParagraphIndex, 0);
    assert.equal(reordered[0].order, 0);
  });

  it("6. wantThirdBucket=true imports three required valid paragraphs", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: threePlanned(),
      wantThirdBucket: true,
    });
    assert.equal(body.length, 3);
  });

  it("7. wantThirdBucket=false imports only two", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: threePlanned(),
      wantThirdBucket: false,
    });
    assert.equal(body.length, 2);
    assert.ok(body.every((c) => c.sourceParagraphIndex < 2));
  });

  it("8. Declined P3 draft is omitted", () => {
    const buckets = threePlanned();
    buckets[2].claim = "Draft third still here";
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets,
      wantThirdBucket: false,
    });
    assert.equal(body.length, 2);
    assert.ok(!body.some((c) => /Draft third/.test(c.point)));
  });

  it("9. Incomplete bucket does not become a phantom body paragraph", () => {
    const buckets = twoPlanned();
    buckets[1] = {
      claim: "x",
      paragraphRole: "",
      reasoning: "",
      evidenceKeys: [],
      evidenceSnippets: [],
    };
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets,
      wantThirdBucket: false,
    });
    assert.equal(body.length, 1);
  });

  it("10–11. First import once; reload does not duplicate", () => {
    const imported = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const first = stages.resolveModule5ImportDecision({
      savedBody: [],
      importedBody: imported,
    });
    assert.equal(first.action, "first_import");
    assert.equal(first.body.length, 2);

    const reload = stages.resolveModule5ImportDecision({
      savedBody: first.body,
      importedBody: imported,
    });
    assert.equal(reload.action, "resume_saved");
    assert.equal(reload.body.length, 2);
  });

  it("12. Saved Module 5 edits are not overwritten by passive upstream reads", () => {
    const imported = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const saved = stages.normalizeOutlineBodyOrder([
      {
        ...imported[0],
        point: "Student edited outline point",
        bucket: "Student edited outline point",
      },
      imported[1],
    ]);
    const decision = stages.resolveModule5ImportDecision({
      savedBody: saved,
      importedBody: imported.map((c, i) =>
        i === 0
          ? {
              ...c,
              point: "Upstream changed point",
              sourceSignature: "different-sig",
            }
          : c
      ),
    });
    assert.equal(decision.action, "upstream_review");
    assert.equal(decision.body[0].point, "Student edited outline point");
    assert.ok(decision.changedSources.length >= 1);
  });

  it("13. Stage 1 has no editing fields in production UI", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    const helpers = fs.readFileSync(
      path.join(__dirname, "../lib/module5/module5OutlineStageHelpers.js"),
      "utf8"
    );
    assert.ok(src.includes("MODULE5_STAGE.BRING_IN"));
    assert.ok(helpers.includes("Arrange my body paragraphs"));
    assert.ok(src.includes("presentation.primaryActionLabel"));
    // Bring-in stage shows thesis as read-only copy, not a thesis textarea editor.
    assert.ok(src.includes("Thesis (read-only here)"));
  });

  it("14–16. Stage 2 accessible reorder persists explicit unique order", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const moved = stages.moveOutlineBodyCard(body, 0, 1);
    assert.equal(moved[0].sourceParagraphIndex, 1);
    assert.equal(stages.reorderBodyIdsUnique(moved), true);
    const gate = stages.evaluateModule5StageGate({
      stage: stages.MODULE5_STAGE.ORDER,
      thesis: POINT,
      body: moved,
    });
    assert.equal(gate.ok, true);
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    assert.ok(src.includes('aria-label={`Move paragraph ${i + 1} earlier`}'));
    assert.ok(src.includes("Move later"));
  });

  it("17–19. Stage 3 one paragraph; reviewed collapse; imported valid needs no retype", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const gate = stages.evaluateModule5StageGate({
      stage: stages.MODULE5_STAGE.REVIEW_BODY,
      thesis: POINT,
      body,
      bodyReviewIndex: 0,
    });
    assert.equal(gate.ok, true);
    const presentation = stages.getModule5StagePresentation(
      stages.MODULE5_STAGE.REVIEW_BODY,
      { body, bodyReviewIndex: 0 }
    );
    assert.match(presentation.question, /still say what I mean/i);
    assert.equal(presentation.primaryActionLabel, "Next paragraph");
  });

  it("20. Conclusion planning is sequenced", () => {
    const m0 = stages.getModule5StagePresentation(stages.MODULE5_STAGE.CONCLUSION, {
      conclusionMicro: 0,
    });
    const m1 = stages.getModule5StagePresentation(stages.MODULE5_STAGE.CONCLUSION, {
      conclusionMicro: 1,
    });
    assert.match(m0.question, /reader understand/i);
    assert.match(m1.question, /argument matter/i);
  });

  it("21. Final review presentation hierarchy", () => {
    const p = stages.getModule5StagePresentation(stages.MODULE5_STAGE.FINALIZE);
    assert.match(p.question, /ready for Module 6/i);
    assert.equal(p.primaryActionLabel, "Finish my outline");
  });

  it("22. Mechanical gates block missing point/job/evidence/reasoning", () => {
    const bad = {
      bucket: "",
      point: "",
      job: "",
      jobId: "analyze_speech",
      evidence: [],
      reasoning: "",
      points: [],
      sourceParagraphIndex: 0,
    };
    const result = stages.validateOutlineBodyCardForGate(bad);
    assert.equal(result.valid, false);
  });

  it("23. Legacy missing-job outline still loads safely", () => {
    const legacy = {
      bucket: "Speech ethos",
      points: ["detail", "reasoning note"],
      // no job fields
    };
    assert.equal(stages.isLegacyMissingJobCard(legacy), true);
    const result = stages.validateOutlineBodyCardForGate(legacy);
    assert.equal(result.valid, true);
  });

  it("24–25. Pattern order guidance transparent and non-mutating; custom invents none", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const frozen = JSON.stringify(body);
    const guidance = stages.buildOutlineOrderGuidance({
      provenanceModel: {
        ready: true,
        kind: "largest_contrast",
        becauseYouExplanation: "Because you rated Speech pathos high.",
      },
      body,
    });
    assert.equal(guidance.appliesAutomatically, false);
    assert.ok(guidance.reason);
    assert.equal(JSON.stringify(body), frozen);

    const custom = stages.buildOutlineOrderGuidance({
      provenanceModel: { ready: true, kind: "student_created" },
      body,
    });
    assert.equal(custom.available, false);
    assert.equal(custom.inventsOrder, false);
  });

  it("26. Passive view performs no writes (controller)", () => {
    const controller = persist.createOutlineWriteController();
    assert.equal(controller.getPostCount?.() ?? controller.getQueueLength(), 0);
    assert.equal(
      persist.shouldAutosaveOutline({
        hydrationReady: true,
        locked: false,
        importing: false,
        signature: persist.outlineContentSignature({
          thesis: "",
          body: [],
          conclusion: { summary: "", finalThought: "" },
        }),
        lastPostedSignature: persist.createHydrationAutosaveGate({
          thesis: "",
          body: [],
          conclusion: { summary: "", finalThought: "" },
        }).lastPostedSignature,
      }),
      false
    );
  });

  it("27–28. Navigation destination stage is part of outline payload signature", () => {
    const a = persist.buildAutosaveRequestBody(
      stages.writeModule5UiState(
        {
          thesis: POINT,
          body: [{ bucket: "a", points: ["x"] }],
          conclusion: { summary: "enough summary", finalThought: "enough thought!" },
        },
        { stage: stages.MODULE5_STAGE.ORDER }
      )
    );
    assert.equal(a.outline.module5Ui.stage, stages.MODULE5_STAGE.ORDER);
    const sig1 = persist.outlineContentSignature(a.outline);
    const b = stages.writeModule5UiState(a.outline, {
      stage: stages.MODULE5_STAGE.REVIEW_BODY,
      bodyReviewIndex: 0,
    });
    const sig2 = persist.outlineContentSignature(b);
    assert.notEqual(sig1, sig2);
  });

  it("29–32. Finish ordering via createOutlineWriteController", async () => {
    const controller = persist.createOutlineWriteController();
    const outline = {
      thesis: POINT,
      body: mapper.buildOutlineBodyFromModule4Plans({
        buckets: twoPlanned(),
        wantThirdBucket: false,
      }),
      conclusion: {
        summary: "Readers should see the contrast clearly.",
        finalThought: "The comparison still matters today.",
      },
    };
    controller.noteLocalEdit();
    let finalizeSeen = false;
    let autosaveAfter = false;

    const pending = controller.beginAutosave(async () => {
      await new Promise((r) => setTimeout(r, 30));
      if (finalizeSeen) autosaveAfter = true;
      return { ok: true, outline };
    }, outline);

    const fin = await controller.finalize({
      outline,
      cancelPendingTimer: () => {},
      sendFinalize: async (latest) => {
        finalizeSeen = true;
        assert.equal(latest.thesis, POINT);
        return { ok: true };
      },
    });
    assert.equal(fin.ok, true);
    assert.equal(fin.navigate, true);
    await pending;
    assert.equal(autosaveAfter, false);

    // Failed finalize allows later autosave
    const controller2 = persist.createOutlineWriteController();
    controller2.noteLocalEdit();
    const fail = await controller2.finalize({
      outline,
      cancelPendingTimer: () => {},
      sendFinalize: async () => ({ ok: false, error: "network" }),
    });
    assert.equal(fail.ok, false);
    assert.equal(controller2.areAutosavesAllowed(), true);
  });

  it("33. Finalized reload gate suppresses echo write", () => {
    const outline = {
      thesis: POINT,
      body: [],
      conclusion: { summary: "a", finalThought: "b" },
    };
    const gate = persist.createHydrationAutosaveGate(outline);
    assert.equal(
      persist.shouldAutosaveOutline({
        hydrationReady: true,
        locked: true,
        importing: false,
        signature: gate.lastPostedSignature,
        lastPostedSignature: gate.lastPostedSignature,
      }),
      false
    );
  });

  it("34–36. Module 6 body-section count matches order and tolerates legacy job", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const reordered = stages.moveOutlineBodyCard(body, 1, 0);
    const steps = buildDraftSectionSteps({
      thesis: POINT,
      body: reordered,
      conclusion: { summary: "s", finalThought: "f" },
    });
    const bodies = steps.filter((s) => s.type === "body");
    assert.equal(bodies.length, 2);
    assert.equal(bodies[0].title, reordered[0].bucket);
    assert.equal(bodies[0].job, reordered[0].job);

    const legacySteps = buildDraftSectionSteps({
      body: [{ bucket: "Legacy card", points: ["a"] }],
    });
    assert.equal(legacySteps.filter((s) => s.type === "body").length, 1);
    assert.equal(legacySteps[1].job, null);
  });

  it("37–38. Layout contract and production staged experience", () => {
    assert.deepEqual(stages.CPF_LAYOUT_CONTRACT.viewports, [320, 390, 768, 1440]);
    assert.equal(stages.CPF_LAYOUT_CONTRACT.desktop.shellMaxPx, 1180);
    assert.equal(stages.CPF_LAYOUT_CONTRACT.desktop.mainWorkspaceMaxPx, 820);
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    assert.ok(src.includes("persistAndNavigateStage"));
    assert.ok(src.includes("Finish my outline"));
    assert.ok(src.includes("module5-finalize-error"));
    assert.ok(src.includes("ProgressDots"));
    assert.ok(src.includes("ModuleFiveStepFrame"));
    assert.equal(src.includes("ModuleThreeStepFrame"), false);
    assert.equal(src.includes("Add paragraph plan"), false);
  });

  it("39. applyUpstreamBodyCardUpdate is explicit only", () => {
    const imported = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const saved = [
      { ...imported[0], point: "Kept edit", bucket: "Kept edit" },
      imported[1],
    ];
    const nextImported = [
      { ...imported[0], point: "Fresh upstream", bucket: "Fresh upstream" },
      imported[1],
    ];
    const updated = stages.applyUpstreamBodyCardUpdate({
      savedBody: saved,
      importedBody: nextImported,
      sourceParagraphIndex: 0,
    });
    assert.equal(updated[0].point, "Fresh upstream");
    assert.equal(updated[1].point, imported[1].point);
  });

  it("40. Import merge policy documented constants", () => {
    assert.equal(stages.MODULE5_IMPORT_MERGE_POLICY.reloadResumesSavedOutline, true);
    assert.equal(stages.MODULE5_IMPORT_MERGE_POLICY.noWriteOnPassiveComparison, true);
    assert.equal(stages.MODULE5_IMPORT_MERGE_POLICY.conclusionNeverErasedByUpstream, true);
  });
});

describe("CP-F repair — outline hydration read-state safety", () => {
  const hydration = require("../lib/module5/module5HydrationHelpers.js");

  const savedOutlineRow = {
    finalized: false,
    outline: {
      thesis: POINT,
      body: [
        {
          bucket: "Saved speech point",
          point: "Saved speech point",
          job: "Analyze the speech",
          jobId: "analyze_speech",
          order: 0,
          sourceParagraphIndex: 0,
          evidence: [{ quote: "dream", observation: "hope" }],
          reasoning: REASONING,
          points: ["dream", REASONING],
        },
        {
          bucket: "Saved letter point",
          point: "Saved letter point",
          job: "Analyze the letter",
          jobId: "analyze_letter",
          order: 1,
          sourceParagraphIndex: 1,
          evidence: [{ quote: "honor", observation: "ethos" }],
          reasoning: REASONING,
          points: ["honor", REASONING],
        },
      ],
      conclusion: {
        summary: "Saved conclusion summary text.",
        finalThought: "Saved final thought remains.",
      },
    },
  };

  const importBody = mapper.buildOutlineBodyFromModule4Plans({
    buckets: twoPlanned(),
    wantThirdBucket: false,
  });

  it("H1. Existing saved outline + GET failure → zero writes", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: savedOutlineRow,
    });
    session.setFailNextGet(true);
    const gen = session.beginHydration();
    const result = await session.hydrate({
      generation: gen,
      importBody,
      upstreamOk: true,
    });
    assert.equal(
      result.readState,
      hydration.MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_READ_FAILED
    );
    assert.equal(result.canWrite, false);
    assert.equal(session.getWriteCount(), 0);
    assert.equal(session.attemptWrite(importBody[0]).blocked, true);
    assert.equal(session.getWriteCount(), 0);
    assert.deepEqual(session.getServerOutline(), savedOutlineRow);
  });

  it("H2. GET failure + student attempts Continue → zero writes", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: savedOutlineRow,
    });
    session.setFailNextGet(true);
    const gen = session.beginHydration();
    await session.hydrate({ generation: gen, importBody, upstreamOk: true });
    assert.equal(
      hydration.shouldAllowModule5OutlineWrites({
        readState: session.getReadState(),
        hydrationReady: true,
        locked: false,
      }),
      false
    );
    assert.equal(session.attemptWrite({ thesis: "overwrite" }).blocked, true);
    assert.equal(session.getWriteCount(), 0);
  });

  it("H3. GET failure + Retry succeeds → exact saved outline restored", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: savedOutlineRow,
    });
    session.setFailNextGet(true);
    const failGen = session.beginHydration();
    await session.hydrate({
      generation: failGen,
      importBody,
      upstreamOk: true,
    });
    assert.equal(session.getLocalOutline(), null);

    const retryGen = session.beginHydration();
    const result = await session.hydrate({
      generation: retryGen,
      importBody,
      upstreamOk: true,
    });
    assert.equal(
      result.readState,
      hydration.MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED
    );
    assert.deepEqual(session.getLocalOutline(), savedOutlineRow.outline);
    assert.equal(session.getWriteCount(), 0);
    assert.equal(result.imported, false);
  });

  it("H4. Confirmed no row → first import allowed", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: null,
    });
    const gen = session.beginHydration();
    const result = await session.hydrate({
      generation: gen,
      importBody,
      upstreamOk: true,
    });
    assert.equal(
      result.readState,
      hydration.MODULE5_OUTLINE_READ_STATE.CONFIRMED_NO_SAVED_OUTLINE
    );
    assert.equal(result.imported, true);
    assert.equal(session.getLocalOutline().body.length, 2);
    assert.equal(session.getWriteCount(), 0);
  });

  it("H5. Confirmed no row + first navigation → imported outline saved once", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: null,
    });
    const gen = session.beginHydration();
    await session.hydrate({ generation: gen, importBody, upstreamOk: true });
    const payload = session.getLocalOutline();
    const write = session.attemptWrite(payload);
    assert.equal(write.ok, true);
    assert.equal(session.getWriteCount(), 1);
    assert.deepEqual(session.getServerOutline().outline.body, payload.body);
  });

  it("H6. Failed upstream after saved outline loads → saved usable, comparison unavailable", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: savedOutlineRow,
    });
    const gen = session.beginHydration();
    const result = await session.hydrate({
      generation: gen,
      importBody,
      upstreamOk: false,
    });
    assert.equal(
      result.readState,
      hydration.MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED
    );
    assert.equal(result.upstreamAvailable, false);
    assert.ok(result.upstreamMessage);
    assert.deepEqual(session.getLocalOutline(), savedOutlineRow.outline);
    assert.equal(session.getWriteCount(), 0);
    assert.equal(session.attemptWrite(savedOutlineRow.outline).ok, true);
    assert.equal(session.getWriteCount(), 1);
  });

  it("H7. Superseded Retry response cannot replace newer successful hydration", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: savedOutlineRow,
    });

    let resolveStaleGet;
    const staleGetPromise = new Promise((resolve) => {
      resolveStaleGet = resolve;
    });

    const staleGen = session.beginHydration();
    session.setGetHandler(() => staleGetPromise);
    const stalePromise = session.hydrate({
      generation: staleGen,
      importBody,
      upstreamOk: true,
    });

    session.setGetHandler(null);
    session.setServerOutline(savedOutlineRow);
    const freshGen = session.beginHydration();
    const fresh = await session.hydrate({
      generation: freshGen,
      importBody,
      upstreamOk: true,
    });
    assert.equal(fresh.applied, true);
    assert.deepEqual(session.getLocalOutline(), savedOutlineRow.outline);

    // Late stale response: empty/import-looking success that must not apply.
    resolveStaleGet({ ok: true, data: null });
    const stale = await stalePromise;
    assert.equal(stale.stale, true);
    assert.equal(stale.applied, false);
    assert.deepEqual(session.getLocalOutline(), savedOutlineRow.outline);
    assert.equal(
      session.getReadState(),
      hydration.MODULE5_OUTLINE_READ_STATE.SAVED_OUTLINE_LOADED
    );
  });

  it("H8. Failed upstream with confirmed no row does not seed writable import overwrite risk", async () => {
    const session = hydration.createModule5HydrationSession({
      initialServerOutline: null,
    });
    const gen = session.beginHydration();
    const result = await session.hydrate({
      generation: gen,
      importBody,
      upstreamOk: false,
    });
    assert.equal(result.imported, false);
    assert.equal(session.getLocalOutline().body.length, 0);
    assert.equal(session.getWriteCount(), 0);
  });
});

describe("CP-F repair — provenance order guidance production wiring", () => {
  it("P1. Production no longer hardcodes provenanceModel: null", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    assert.equal(src.includes("provenanceModel: null"), false);
    assert.ok(src.includes("buildModule4ProvenanceModel"));
    assert.ok(src.includes("buildOutlineOrderGuidance({"));
    assert.ok(src.includes("provenanceModel,"));
    assert.ok(src.includes("/api/module3/patterns"));
  });

  it("P2. Contrast provenance can show justified guidance", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const guidance = stages.buildOutlineOrderGuidance({
      provenanceModel: {
        ready: true,
        kind: "largest_contrast",
        becauseYouExplanation: "Because you rated Speech pathos high.",
      },
      body,
    });
    assert.equal(guidance.available, true);
    assert.match(guidance.reason, /contrast/i);
    assert.equal(guidance.appliesAutomatically, false);
  });

  it("P3. Similarity/dominant/trace wording matches direction family", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const similarity = stages.buildOutlineOrderGuidance({
      provenanceModel: { ready: true, kind: "meaningful_similarity" },
      body,
    });
    assert.match(similarity.reason, /shared ground|similarity/i);

    const dominant = stages.buildOutlineOrderGuidance({
      provenanceModel: { ready: true, kind: "dominant_per_work" },
      body,
    });
    assert.match(dominant.reason, /appeal|clearest paragraph/i);

    const trace = stages.buildOutlineOrderGuidance({
      provenanceModel: {
        ready: true,
        kind: "combined_dominant_across_works",
      },
      body,
    });
    assert.match(trace.reason, /appeal|clearest paragraph/i);
  });

  it("P4. Student-created or legacy/no-provenance does not invent guidance", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    assert.equal(
      stages.buildOutlineOrderGuidance({
        provenanceModel: { ready: true, kind: "student_created" },
        body,
      }).available,
      false
    );
    assert.equal(
      stages.buildOutlineOrderGuidance({
        provenanceModel: null,
        body,
      }).available,
      false
    );
    assert.equal(
      stages.buildOutlineOrderGuidance({
        provenanceModel: { ready: false, kind: "largest_contrast" },
        body,
      }).available,
      false
    );
  });

  it("P5. Guidance never mutates body order", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    // Put letter first so contrast guidance may suggest a different order.
    const reordered = stages.moveOutlineBodyCard(body, 1, 0);
    const frozen = JSON.stringify(reordered);
    const guidance = stages.buildOutlineOrderGuidance({
      provenanceModel: { ready: true, kind: "largest_contrast" },
      body: reordered,
    });
    assert.ok(guidance.available);
    assert.equal(JSON.stringify(reordered), frozen);
    assert.equal(guidance.appliesAutomatically, false);
  });

  it("P6. Reload preserves the student’s chosen order", () => {
    const body = mapper.buildOutlineBodyFromModule4Plans({
      buckets: twoPlanned(),
      wantThirdBucket: false,
    });
    const studentOrder = stages.moveOutlineBodyCard(body, 1, 0);
    const decision = stages.resolveModule5ImportDecision({
      savedBody: studentOrder,
      importedBody: body,
      savedConclusion: {
        summary: "enough summary text here",
        finalThought: "enough final thought here",
      },
    });
    assert.equal(decision.body[0].jobId, studentOrder[0].jobId);
    assert.equal(decision.body[1].jobId, studentOrder[1].jobId);
    // Guidance remains advisory only after reload.
    const guidance = stages.buildOutlineOrderGuidance({
      provenanceModel: { ready: true, kind: "largest_contrast" },
      body: decision.body,
    });
    assert.equal(guidance.appliesAutomatically, false);
    assert.equal(decision.body[0].jobId, "analyze_letter");
  });
});

describe("CP-F repair — Module 4 source signature evidence keys", () => {
  it("S1. Signature includes evidence keys when snippets unavailable", () => {
    const bucket = {
      claim: POINT,
      paragraphRole: "analyze_speech",
      reasoning: REASONING,
      suggestionId: "proof-0",
      evidenceKeys: ["tchart:speech:pathos", "tchart:letter:ethos"],
      // no evidenceSnippets
    };
    const sig = mapper.buildModule4ParagraphSourceSignature(bucket, 0, []);
    assert.match(sig, /keys:tchart:speech:pathos,tchart:letter:ethos/);
    assert.match(sig, /analyze_speech|Analyze the speech/i);
    assert.ok(sig.includes(POINT));
    assert.ok(sig.includes(REASONING));
    assert.ok(sig.includes("proof-0"));
    assert.ok(sig.startsWith("0::"));
  });

  it("S2. Signature includes resolved quote/observation when available", () => {
    const bucket = {
      claim: POINT,
      paragraphRole: "analyze_speech",
      reasoning: REASONING,
      suggestionId: "proof-0",
      evidenceKeys: ["row-1"],
    };
    const rows = [
      {
        id: "row-1",
        quote: "I have a dream",
        observation: "Speech hope moment",
      },
    ];
    const sig = mapper.buildModule4ParagraphSourceSignature(bucket, 1, rows);
    assert.match(sig, /keys:row-1/);
    assert.match(sig, /I have a dream/);
    assert.match(sig, /Speech hope moment/);
    assert.ok(sig.startsWith("1::"));
  });

  it("S3. Evidence selection change alters signature; timestamp-only does not", () => {
    const base = {
      claim: POINT,
      paragraphRole: "show_difference",
      reasoning: REASONING,
      suggestionId: "proof-0",
      evidenceKeys: ["a", "b"],
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const sigA = mapper.buildModule4ParagraphSourceSignature(base, 0, []);
    const sigTimestamp = mapper.buildModule4ParagraphSourceSignature(
      { ...base, updatedAt: "2026-07-12T00:00:00.000Z" },
      0,
      []
    );
    assert.equal(sigA, sigTimestamp);

    const sigEvidence = mapper.buildModule4ParagraphSourceSignature(
      { ...base, evidenceKeys: ["a", "c"] },
      0,
      []
    );
    assert.notEqual(sigA, sigEvidence);
  });

  it("S4. Production ModuleFive uses hydration helpers and read-failure UI", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFive.js"),
      "utf8"
    );
    assert.ok(src.includes("module5HydrationHelpers"));
    assert.ok(src.includes("saved_outline_read_failed") || src.includes("SAVED_OUTLINE_READ_FAILED"));
    assert.ok(src.includes('role="alert"'));
    assert.ok(src.includes("module5-outline-read-error"));
    assert.ok(src.includes("module5-outline-read-retry"));
    assert.ok(src.includes("shouldAllowModule5OutlineWrites"));
    assert.ok(src.includes("mayPerformModule5FirstImport"));
  });
});

describe("CP-F repair — Module 5 desktop workspace presentation", () => {
  const moduleFiveSrc = fs.readFileSync(
    path.join(__dirname, "../components/ModuleFive.js"),
    "utf8"
  );
  const frameSrc = fs.readFileSync(
    path.join(__dirname, "../components/module5/ModuleFiveStepFrame.jsx"),
    "utf8"
  );
  const moduleThreeFrameSrc = fs.readFileSync(
    path.join(__dirname, "../components/module3/ModuleThreeStepFrame.jsx"),
    "utf8"
  );
  const workspaceColumnsSrc = fs.readFileSync(
    path.join(__dirname, "../components/layout/WorkspaceColumns.jsx"),
    "utf8"
  );

  it("L1. Module 5 does not use the narrow default Module 3 desktop grid", () => {
    assert.equal(moduleFiveSrc.includes("ModuleThreeStepFrame"), false);
    assert.equal(moduleFiveSrc.includes("WorkspaceColumns"), false);
    assert.ok(moduleFiveSrc.includes("ModuleFiveStepFrame"));
    assert.equal(
      frameSrc.includes('variant="default"') ||
        frameSrc.includes("WorkspaceColumns"),
      false
    );
    // Default Module 3 squeeze grid must not appear in Module 5 frame.
    assert.equal(
      frameSrc.includes(
        "xl:grid-cols-[minmax(240px,0.24fr)_minmax(0,0.52fr)_minmax(240px,0.24fr)]"
      ),
      false
    );
  });

  it("L2. Desktop main workspace has a bounded but substantially wider width", () => {
    assert.ok(frameSrc.includes("max-w-[1180px]"));
    assert.ok(frameSrc.includes("lg:max-w-[820px]"));
    assert.ok(frameSrc.includes('data-cpf-main-max="820"'));
    assert.equal(stages.CPF_LAYOUT_CONTRACT.desktop.mainWorkspaceMinComfortPx, 680);
    assert.ok(moduleFiveSrc.includes("max-w-[1200px]"));
  });

  it("L3. Question heading can occupy the main workspace width", () => {
    assert.ok(frameSrc.includes('data-module5-question="true"'));
    assert.ok(frameSrc.includes("w-full max-w-none"));
    // Must not inherit Module 3's max-w-3xl question squeeze.
    const questionBlock = frameSrc.slice(
      frameSrc.indexOf("data-module5-question"),
      frameSrc.indexOf("data-module5-question") + 280
    );
    assert.equal(questionBlock.includes("max-w-3xl"), false);
    assert.equal(questionBlock.includes("max-w-2xl"), false);
  });

  it("L4. Paragraph cards use the main-column width", () => {
    assert.ok(moduleFiveSrc.includes('data-module5-paragraph-cards="true"'));
    assert.ok(moduleFiveSrc.includes('data-module5-paragraph-card="true"'));
    assert.ok(moduleFiveSrc.includes('"w-full rounded-lg border bg-white'));
    assert.ok(frameSrc.includes('data-module5-stage-content="true"'));
    assert.ok(frameSrc.includes("w-full min-w-0"));
  });

  it("L5. Teacher guidance moves to a rail only at an appropriate desktop breakpoint", () => {
    assert.ok(
      frameSrc.includes(
        "lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)]"
      )
    );
    assert.ok(frameSrc.includes('data-module5-teacher-rail="true"'));
    assert.ok(frameSrc.includes("lg:sticky"));
    assert.equal(stages.CPF_LAYOUT_CONTRACT.desktop.teacherRailAtLg, true);
    // Must not use Module 3 empty left sidebar pattern.
    assert.equal(frameSrc.includes("WorkspaceSidebar"), false);
    assert.equal(stages.CPF_LAYOUT_CONTRACT.desktop.noEmptyLeftSidebar, true);
  });

  it("L6. 320/390/768 remain single-column or otherwise comfortably readable", () => {
    assert.ok(frameSrc.includes("grid grid-cols-1"));
    assert.equal(stages.CPF_LAYOUT_CONTRACT.tablet.singleColumnBelowLg, true);
    assert.equal(stages.CPF_LAYOUT_CONTRACT.mobile.singleColumn, true);
    // Two-column rail must be lg+, not md (768).
    assert.equal(frameSrc.includes("md:grid-cols-["), false);
  });

  it("L7. No horizontal overflow contract", () => {
    assert.ok(frameSrc.includes("overflow-x-hidden"));
    assert.ok(moduleFiveSrc.includes("overflow-x-hidden"));
    assert.equal(stages.CPF_LAYOUT_CONTRACT.mobile.noHorizontalOverflow, true);
  });

  it("L8. Primary actions retain 44px targets", () => {
    assert.ok(moduleFiveSrc.includes("min-h-[44px]"));
    assert.equal(stages.CPF_LAYOUT_CONTRACT.mobile.minActionTargetPx, 44);
    const primaryMatches = moduleFiveSrc.match(/min-h-\[44px\]/g) || [];
    assert.ok(primaryMatches.length >= 3);
  });

  it("L9. Only one incomplete-Module-4 warning is rendered", () => {
    assert.ok(moduleFiveSrc.includes("module5-incomplete-module4-warning"));
    assert.equal(moduleFiveSrc.includes("No complete Module 4 paragraph plans found yet"), false);
    // Footer stageGate message is suppressed when BRING_IN has fewer than 2 cards.
    assert.ok(
      moduleFiveSrc.includes(
        "!(stage === MODULE5_STAGE.BRING_IN && outline.length < 2)"
      )
    );
    const warningOccurrences = (
      moduleFiveSrc.match(
        /Finish the required paragraph plans in Module 4, then return here\./g
      ) || []
    ).length;
    assert.equal(warningOccurrences, 1);
  });

  it("L10. Module 3 production layout remains unchanged", () => {
    assert.ok(moduleThreeFrameSrc.includes("WorkspaceColumns"));
    assert.ok(moduleThreeFrameSrc.includes("WorkspaceSidebar"));
    assert.ok(moduleThreeFrameSrc.includes("WorkspaceCenter"));
    assert.ok(moduleThreeFrameSrc.includes("WorkspaceGuide"));
    assert.ok(
      workspaceColumnsSrc.includes(
        "xl:grid-cols-[minmax(240px,0.24fr)_minmax(0,0.52fr)_minmax(240px,0.24fr)]"
      )
    );
  });

  it("L11. No persistence or flow logic changes in this presentation repair", () => {
    assert.ok(moduleFiveSrc.includes("shouldAllowModule5OutlineWrites"));
    assert.ok(moduleFiveSrc.includes("createOutlineWriteController"));
    assert.ok(moduleFiveSrc.includes("buildModule4ProvenanceModel"));
    assert.ok(moduleFiveSrc.includes("mayPerformModule5FirstImport"));
    assert.ok(moduleFiveSrc.includes("persistAndNavigateStage"));
    // Presentation-only: Module 5 still does not write on passive open.
    assert.ok(moduleFiveSrc.includes("createHydrationAutosaveGate"));
    assert.ok(moduleFiveSrc.includes("studentDirtyRef"));
  });
});
