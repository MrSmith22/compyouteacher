/**
 * CP-E navigation persistence — destination-step saves with ordering safety.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const {
  STEP_B1_SCAFFOLD,
  STEP_B1_ROLE,
  STEP_B1_EVIDENCE,
  STEP_B1_REASONING,
  STEP_B2_SCAFFOLD,
  STEP_B2_ROLE,
  STEP_B2_EVIDENCE,
  STEP_B2_REASONING,
  STEP_B3_SCAFFOLD,
  STEP_B3_ROLE,
  STEP_B3_EVIDENCE,
  STEP_B3_REASONING,
  STEP_THIRD_DECISION,
  STEP_REFLECTION,
  STEP_PATTERN,
  STEP_HANDOFF,
} = require("../components/module4/module4FlowSteps.js");
const {
  PARAGRAPH_PART_EDIT_STEPS,
  editStepForParagraphPart,
} = require("../lib/module4/module4ParagraphPlanArtifactHelpers.js");
const { resolveModule4BackTarget } = require("../lib/module4/module4HandoffHelpers.js");
const {
  createModule4NavigationSession,
  resolveModule4GoNextTarget,
  resolveModule4Paragraph3DecisionTarget,
  isValidModule4FlowStep,
  MODULE4_NAV_SAVE_ERROR,
} = require("../lib/module4/module4NavigationSave.js");
const {
  MODULE4_SAVE_REASONS,
  shouldScheduleModule4Autosave,
} = require("../lib/module4/module4SaveCoordinator.js");

function buildPayloadFactory(state) {
  return (signature, targetStep, overrides = {}) => {
    const next = {
      ...state,
      ...overrides,
      flow_state: {
        step: targetStep,
        wantThirdBucket:
          overrides.wantThirdBucket !== undefined
            ? overrides.wantThirdBucket
            : state.wantThirdBucket,
        patternChoice: overrides.patternChoice ?? state.patternChoice ?? "",
        module4UpstreamSignature: signature,
      },
      reflection: overrides.reflection ?? state.reflection ?? "",
      buckets: overrides.buckets ?? state.buckets ?? [],
    };
    return next;
  };
}

function mockWrite(serverState) {
  return async (payload) => {
    serverState.lastPayload = JSON.parse(JSON.stringify(payload));
    serverState.flowStep = payload.flow_state.step;
    serverState.buckets = JSON.parse(JSON.stringify(payload.buckets || []));
    serverState.reflection = payload.reflection || "";
    serverState.wantThirdBucket = payload.flow_state.wantThirdBucket;
    serverState.patternChoice = payload.flow_state.patternChoice;
    serverState.module4UpstreamSignature =
      payload.flow_state.module4UpstreamSignature;
    return { ok: true };
  };
}

describe("Module 4 navigation save coordinator", () => {
  const baseBuckets = [
    {
      claim: "Point one",
      paragraphRole: "analyze_speech",
      evidenceKeys: ["tchart:speech:pathos"],
      reasoning: "Reasoning one",
    },
    {
      claim: "Point two",
      paragraphRole: "analyze_letter",
      evidenceKeys: ["tchart:letter:ethos"],
      reasoning: "Reasoning two",
    },
    {
      claim: "Optional third draft",
      paragraphRole: "",
      evidenceKeys: [],
      reasoning: "",
    },
  ];

  it("1. Continue saves destination step", async () => {
    const server = { flowStep: STEP_B1_SCAFFOLD };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
      initialState: { buckets: baseBuckets },
    });
    const state = { buckets: baseBuckets, wantThirdBucket: false };
    const target = resolveModule4GoNextTarget(STEP_B1_SCAFFOLD);
    assert.equal(target, STEP_B1_ROLE);
    const result = await session.persistAndNavigateTo(target, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory(state),
    });
    assert.equal(result.ok, true);
    assert.equal(session.getFlowStep(), STEP_B1_ROLE);
    assert.equal(server.flowStep, STEP_B1_ROLE);
  });

  it("2. Back saves resolved target step", async () => {
    const server = { flowStep: STEP_B1_ROLE };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_ROLE,
    });
    const target = resolveModule4BackTarget({
      flowStep: STEP_B1_ROLE,
      hasValidSavedPattern: true,
    });
    assert.equal(target, STEP_B1_SCAFFOLD);
    const result = await session.persistAndNavigateTo(target, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(result.ok, true);
    assert.equal(server.flowStep, STEP_B1_SCAFFOLD);
  });

  it("3. Start Paragraph 1 saves its destination", async () => {
    const server = { flowStep: STEP_HANDOFF };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_HANDOFF,
    });
    const result = await session.persistAndNavigateTo(STEP_B1_SCAFFOLD, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(result.ok, true);
    assert.equal(server.flowStep, STEP_B1_SCAFFOLD);
  });

  it("4. Paragraph 3 Yes saves decision + P3 destination atomically", async () => {
    const server = { flowStep: STEP_THIRD_DECISION };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_THIRD_DECISION,
      initialState: { buckets: baseBuckets.slice(0, 2), wantThirdBucket: null },
    });
    const nextBuckets = [...baseBuckets.slice(0, 2), baseBuckets[2]];
    const target = resolveModule4Paragraph3DecisionTarget(true);
    assert.equal(target, STEP_B3_SCAFFOLD);
    const result = await session.persistAndNavigateTo(target, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({
        buckets: baseBuckets.slice(0, 2),
        wantThirdBucket: null,
      }),
      overrides: { wantThirdBucket: true, buckets: nextBuckets },
    });
    assert.equal(result.ok, true);
    assert.equal(server.flowStep, STEP_B3_SCAFFOLD);
    assert.equal(server.wantThirdBucket, true);
    assert.equal(server.buckets.length, 3);
  });

  it("5. Paragraph 3 No saves decision + reflection destination atomically", async () => {
    const server = { flowStep: STEP_THIRD_DECISION };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_THIRD_DECISION,
      initialState: { buckets: baseBuckets, wantThirdBucket: null },
    });
    const target = resolveModule4Paragraph3DecisionTarget(false);
    assert.equal(target, STEP_REFLECTION);
    const result = await session.persistAndNavigateTo(target, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({
        buckets: baseBuckets,
        wantThirdBucket: null,
      }),
      overrides: { wantThirdBucket: false, buckets: baseBuckets },
    });
    assert.equal(result.ok, true);
    assert.equal(server.flowStep, STEP_REFLECTION);
    assert.equal(server.wantThirdBucket, false);
  });

  it("6. Declined P3 draft remains preserved in memory according to existing rules", async () => {
    const bucketsWithDraft = JSON.parse(JSON.stringify(baseBuckets));
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_THIRD_DECISION,
      initialState: { buckets: bucketsWithDraft, wantThirdBucket: null },
    });
    const server = {};
    await session.persistAndNavigateTo(STEP_REFLECTION, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({
        buckets: bucketsWithDraft,
        wantThirdBucket: null,
      }),
      overrides: { wantThirdBucket: false, buckets: bucketsWithDraft },
    });
    assert.equal(bucketsWithDraft[2].claim, "Optional third draft");
    assert.equal(server.buckets[2].claim, "Optional third draft");
  });

  it("7–8. Final-review Edit point/job/evidence/reasoning save routing targets", async () => {
    const server = { flowStep: STEP_REFLECTION };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_REFLECTION,
      initialState: { buckets: baseBuckets },
    });
    const cases = [
      ["point", 0, PARAGRAPH_PART_EDIT_STEPS.point[0]],
      ["job", 0, PARAGRAPH_PART_EDIT_STEPS.job[0]],
      ["evidence", 0, PARAGRAPH_PART_EDIT_STEPS.evidence[0]],
      ["reasoning", 0, PARAGRAPH_PART_EDIT_STEPS.reasoning[0]],
      ["point", 1, PARAGRAPH_PART_EDIT_STEPS.point[1]],
      ["job", 1, PARAGRAPH_PART_EDIT_STEPS.job[1]],
    ];
    for (const [part, index, expected] of cases) {
      const step = editStepForParagraphPart(index, part);
      assert.equal(step, expected);
      const result = await session.persistAndNavigateTo(step, {
        writeFn: mockWrite(server),
        buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
      });
      assert.equal(result.ok, true);
      assert.equal(server.flowStep, expected);
    }
  });

  it("9. Reload after navigation resumes the destination", async () => {
    const server = { flowStep: STEP_B1_SCAFFOLD };
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
    });
    await session.persistAndNavigateTo(STEP_B1_ROLE, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    const reloaded = createModule4NavigationSession({
      initialFlowStep: server.flowStep,
      initialState: {
        buckets: server.buckets,
        wantThirdBucket: server.wantThirdBucket,
      },
    });
    assert.equal(reloaded.getFlowStep(), STEP_B1_ROLE);
  });

  it("10. Pending autosave plus Continue leaves newest text and destination on mock server", async () => {
    const server = {};
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
      initialState: {
        buckets: baseBuckets,
        reflection: "",
        wantThirdBucket: false,
      },
    });
    const state = {
      buckets: [
        {
          ...baseBuckets[0],
          claim: "Newest point text before Continue",
        },
        baseBuckets[1],
      ],
      reflection: "",
      wantThirdBucket: false,
    };
    session.markStudentMutation();
    const scheduled = session.scheduleAutosaveEpoch();
    assert.equal(session.canRunScheduledAutosave(scheduled), true);

    const target = resolveModule4GoNextTarget(STEP_B1_SCAFFOLD);
    const nav = await session.persistAndNavigateTo(target, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory(state),
      overrides: { buckets: state.buckets },
    });
    assert.equal(nav.ok, true);
    assert.equal(server.flowStep, STEP_B1_ROLE);
    assert.equal(server.buckets[0].claim, "Newest point text before Continue");

    const autosave = await session.runAutosave({
      scheduledEpoch: scheduled,
      writeFn: mockWrite(server),
      provenanceModel: null,
      buildPayload: (signature) =>
        buildPayloadFactory({
          ...state,
          buckets: [{ ...state.buckets[0], claim: "Stale autosave text" }],
        })(signature, STEP_B1_SCAFFOLD),
    });
    assert.equal(autosave.skipped, true);
    assert.equal(server.buckets[0].claim, "Newest point text before Continue");
  });

  it("11. Late autosave cannot overwrite navigation", async () => {
    const server = {};
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
      initialState: { buckets: baseBuckets },
    });
    const scheduled = session.scheduleAutosaveEpoch();
    session.markStudentMutation();
    await session.persistAndNavigateTo(STEP_B1_ROLE, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    const late = await session.runAutosave({
      scheduledEpoch: scheduled,
      writeFn: mockWrite(server),
      provenanceModel: null,
      buildPayload: (signature) =>
        buildPayloadFactory({
          buckets: [{ ...baseBuckets[0], claim: "Too late" }],
        })(signature, STEP_B1_SCAFFOLD),
    });
    assert.equal(late.stale, true);
    assert.notEqual(server.buckets?.[0]?.claim, "Too late");
    assert.equal(server.flowStep, STEP_B1_ROLE);
  });

  it("12. Failed navigation save does not change visible step", async () => {
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
    });
    const result = await session.persistAndNavigateTo(STEP_B1_ROLE, {
      writeFn: async () => ({ ok: false, error: "network down" }),
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(result.ok, false);
    assert.equal(session.getFlowStep(), STEP_B1_SCAFFOLD);
  });

  it("13–14. Failure renders alert path and Retry succeeds once", async () => {
    let attempts = 0;
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
    });
    const failOnce = async () => {
      attempts += 1;
      if (attempts === 1) return { ok: false, error: "network down" };
      return { ok: true };
    };
    const first = await session.persistAndNavigateTo(STEP_B1_ROLE, {
      writeFn: failOnce,
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(first.ok, false);
    assert.equal(session.getNavError(), "network down");
    const retry = await session.retryNavigation({
      writeFn: failOnce,
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(retry.ok, true);
    assert.equal(session.getFlowStep(), STEP_B1_ROLE);
    assert.equal(attempts, 2);
  });

  it("15. Double navigation is guarded", async () => {
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
    });
    let inFlight = false;
    const slowWrite = async (payload) => {
      inFlight = true;
      await new Promise((r) => setTimeout(r, 20));
      inFlight = false;
      return { ok: true, payload };
    };
    const p1 = session.persistAndNavigateTo(STEP_B1_ROLE, {
      writeFn: slowWrite,
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    const blocked = await session.persistAndNavigateTo(STEP_B1_EVIDENCE, {
      writeFn: slowWrite,
      buildPayload: buildPayloadFactory({ buckets: baseBuckets }),
    });
    assert.equal(blocked.blocked, true);
    await p1;
    assert.equal(session.coordinator.getPostCount(), 1);
  });

  it("16. Finish failure does not open success", async () => {
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_REFLECTION,
      initialState: { reflection: "Final reflection", buckets: baseBuckets },
    });
    let routed = false;
    const result = await session.persistAndNavigateTo(STEP_REFLECTION, {
      writeFn: async () => ({ ok: false, error: "save failed" }),
      buildPayload: buildPayloadFactory({
        reflection: "Final reflection",
        buckets: baseBuckets,
      }),
      overrides: { reflection: "Final reflection" },
    });
    if (result.ok) routed = true;
    assert.equal(routed, false);
    assert.equal(session.getFlowStep(), STEP_REFLECTION);
  });

  it("17. Finish success persists newest reflection before success", async () => {
    const server = {};
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_REFLECTION,
      initialState: { reflection: "Old", buckets: baseBuckets },
    });
    const result = await session.persistAndNavigateTo(STEP_REFLECTION, {
      writeFn: mockWrite(server),
      buildPayload: buildPayloadFactory({
        reflection: "Old",
        buckets: baseBuckets,
      }),
      overrides: { reflection: "Newest reflection before finish" },
    });
    assert.equal(result.ok, true);
    assert.equal(server.reflection, "Newest reflection before finish");
    assert.equal(server.flowStep, STEP_REFLECTION);
  });

  it("18. Passive viewing still performs zero writes", () => {
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
    });
    session.coordinator.notePassiveView();
    assert.equal(shouldScheduleModule4Autosave({ studentDirty: false }), false);
    assert.equal(session.coordinator.getPostCount(), 0);
  });

  it("19. Upstream acknowledgement behavior remains correct", async () => {
    const session = createModule4NavigationSession({
      initialFlowStep: STEP_B1_SCAFFOLD,
      initialSignature: "old-sig",
    });
    const ack = await session.coordinator.persist({
      provenanceModel: {
        ready: true,
        signature: "new-sig",
        needsReview: false,
      },
      persistReason: MODULE4_SAVE_REASONS.ACKNOWLEDGE,
      buildPayload: (signature) => ({
        flow_state: { module4UpstreamSignature: signature },
      }),
      writeFn: async () => ({ ok: true }),
    });
    assert.equal(ack.ok, true);
    assert.equal(session.coordinator.getSavedSignature(), "new-sig");
  });

  it("20. resolveModule4GoNextTarget and edit routing constants stay aligned", () => {
    assert.equal(resolveModule4GoNextTarget(STEP_PATTERN), STEP_B1_SCAFFOLD);
    assert.equal(resolveModule4GoNextTarget(STEP_B2_REASONING), STEP_THIRD_DECISION);
    assert.equal(resolveModule4GoNextTarget(STEP_B3_REASONING), STEP_REFLECTION);
    assert.equal(editStepForParagraphPart(0, "point"), STEP_B1_SCAFFOLD);
    assert.equal(editStepForParagraphPart(0, "job"), STEP_B1_ROLE);
    assert.equal(editStepForParagraphPart(0, "evidence"), STEP_B1_EVIDENCE);
    assert.equal(editStepForParagraphPart(0, "reasoning"), STEP_B1_REASONING);
    assert.equal(isValidModule4FlowStep(STEP_REFLECTION), true);
    assert.equal(isValidModule4FlowStep(999), false);
  });

  it("production ModuleFour wires persistAndNavigateTo and nav Retry", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleFour.js"),
      "utf8"
    );
    assert.ok(src.includes("persistAndNavigateTo"));
    assert.ok(src.includes("module4-navigation-save-error"));
    assert.ok(src.includes("resolveModule4GoNextTarget"));
    assert.ok(src.includes("cancelPendingAutosave"));
    assert.ok(src.includes("persistEpochRef"));
    assert.equal(src.includes("await flushSave();\n    setFlowStep"), false);
  });
});
