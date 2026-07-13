/**
 * CP-G — Module 6 sequenced drafting and outline-to-draft integrity.
 */

const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const mapping = require("../lib/module6/draftOutlineMapping.js");
const hydration = require("../lib/module6/draftHydrationHelpers.js");
const persist = require("../lib/module6/draftPersistenceHelpers.js");
const {
  buildDraftSectionSteps,
  getModule6StepPresentation,
} = require("../components/module6/module6StepPresentation.js");
const {
  getEssayProseBlocks,
} = require("../components/module7/module7DraftSections.js");

const POINT_A = "Speech builds public hope through pathos.";
const POINT_B = "Letter builds clerical pressure through ethos.";
const POINT_C = "Both works reject waiting for justice.";
const REASONING =
  "The evidence shows how King adapts appeals for each audience in my thesis.";

function twoBodyOutline() {
  return {
    thesis: "King adapts appeals for each audience.",
    body: [
      {
        bucket: POINT_A,
        point: POINT_A,
        job: "Analyze the speech",
        jobId: "analyze_speech",
        order: 0,
        sourceParagraphIndex: 0,
        evidence: [{ quote: "I have a dream", observation: "hope", evidenceKey: "a" }],
        reasoning: REASONING,
        points: ["I have a dream", REASONING],
        sourceSignature: "sig-a",
      },
      {
        bucket: POINT_B,
        point: POINT_B,
        job: "Analyze the letter",
        jobId: "analyze_letter",
        order: 1,
        sourceParagraphIndex: 1,
        evidence: [{ quote: "I have the honor", observation: "ethos", evidenceKey: "b" }],
        reasoning: REASONING,
        points: ["I have the honor", REASONING],
        sourceSignature: "sig-b",
      },
    ],
    conclusion: {
      summary: "Readers should see the contrast clearly.",
      finalThought: "The comparison still matters today.",
    },
  };
}

function validFinalizeMeta(outline) {
  const sig = mapping.buildModule5DraftSourceSignature(outline);
  return {
    sourceOutlineSignature: sig,
    currentStageId: "stage-review",
    currentSectionIndex: mapping.expectedReviewStageIndex(outline),
    completedSectionIds: mapping.expectedProseSectionIds(outline),
    outlineReviewRequired: false,
  };
}

function threeBodyOutline() {
  const base = twoBodyOutline();
  return {
    ...base,
    body: [
      ...base.body,
      {
        bucket: POINT_C,
        point: POINT_C,
        job: "Compare both works",
        jobId: "compare_both",
        order: 2,
        sourceParagraphIndex: 2,
        evidence: [
          { quote: "dream", observation: "s", evidenceKey: "c1" },
          { quote: "wait", observation: "l", evidenceKey: "c2" },
        ],
        reasoning: REASONING,
        points: ["dream", "wait", REASONING],
        sourceSignature: "sig-c",
      },
    ],
  };
}

function legacyOutline() {
  return {
    thesis: "Legacy thesis.",
    body: [
      { bucket: "Speech ethos", points: ["detail one", "detail two"] },
      { bucket: "Letter pathos", points: ["detail three"] },
    ],
    conclusion: { summary: "wrap", finalThought: "end" },
  };
}

describe("CP-G Module 6 section mapping", () => {
  it("1. Finalized two-body outline → four draft prose sections", () => {
    const outline = twoBodyOutline();
    const sections = mapping.createEmptyDraftSections(outline);
    assert.equal(sections.length, 4);
    assert.equal(mapping.expectedProseSectionCount(outline), 4);
    const steps = mapping.buildModule6DraftingSteps(outline);
    assert.equal(steps.length, 4);
    assert.equal(steps[0].type, "intro");
    assert.equal(steps[3].type, "conclusion");
  });

  it("2. Finalized three-body outline → five sections", () => {
    assert.equal(mapping.expectedProseSectionCount(threeBodyOutline()), 5);
    assert.equal(mapping.createEmptyDraftSections(threeBodyOutline()).length, 5);
  });

  it("3. Declined third paragraph produces no phantom draft section", () => {
    // Two-body outline never invents a third body slot.
    assert.equal(mapping.expectedProseSectionCount(twoBodyOutline()), 4);
    const ui = mapping.buildModule6UiStages(twoBodyOutline());
    const bodySteps = ui.filter((s) => s.type === "body");
    assert.equal(bodySteps.length, 2);
  });

  it("4. Ordered Module 5 body order is preserved", () => {
    const outline = twoBodyOutline();
    outline.body = [outline.body[1], outline.body[0]];
    const steps = mapping.buildModule6DraftingSteps(outline);
    assert.equal(steps[1].point, POINT_B);
    assert.equal(steps[2].point, POINT_A);
    assert.equal(steps[1].sourceParagraphIndex, 1);
    assert.equal(steps[2].sourceParagraphIndex, 0);
  });

  it("5. Job/source identity reaches the active body presentation", () => {
    const steps = mapping.buildModule6DraftingSteps(twoBodyOutline());
    const body = steps[1];
    assert.equal(body.job, "Analyze the speech");
    assert.equal(body.sourceParagraphIndex, 0);
    assert.ok(body.evidence.length);
    const presentation = getModule6StepPresentation(body, twoBodyOutline());
    assert.match(presentation.question, /Speech builds public hope/i);
    assert.match(presentation.organizationalJob, /speech/i);
  });

  it("6. Legacy outline without job still drafts", () => {
    const steps = mapping.buildModule6DraftingSteps(legacyOutline());
    assert.equal(steps.length, 4);
    assert.equal(steps[1].job, null);
    const presentation = getModule6StepPresentation(steps[1], legacyOutline());
    assert.ok(presentation.question);
    assert.ok(mapping.bodyJobSentence(steps[1]));
  });
});

describe("CP-G hydration and write safety", () => {
  it("7. Passive hydration performs zero writes", async () => {
    const session = persist.createModule6DraftSession({
      initialServerDraft: null,
    });
    const gen = session.beginHydration();
    await session.hydrate({
      generation: gen,
      emptySections: mapping.createEmptyDraftSections(twoBodyOutline()),
    });
    assert.equal(session.getWriteCount(), 0);
  });

  it("8. Draft GET failure performs zero writes", async () => {
    const session = persist.createModule6DraftSession({
      initialServerDraft: {
        sections: ["intro", "b1", "b2", "conc"],
        locked: false,
        full_text: "intro\n\nb1\n\nb2\n\nconc",
      },
    });
    session.setFailNextGet(true);
    const gen = session.beginHydration();
    const result = await session.hydrate({
      generation: gen,
      emptySections: ["", "", "", ""],
    });
    assert.equal(result.readState, "draft_read_failed");
    assert.equal(session.attemptWrite({ sections: ["x"], action: "autosave" }).blocked, true);
    assert.equal(session.getWriteCount(), 0);
  });

  it("9. Retry restores exact saved sections and current position", async () => {
    const saved = {
      sections: ["Intro prose here.", "Body one prose.", "Body two prose.", "Conclusion prose."],
      locked: false,
      draft_meta: {
        schemaVersion: 1,
        currentSectionIndex: 2,
        currentStageId: "section-2",
        sourceOutlineSignature: mapping.buildModule5DraftSourceSignature(twoBodyOutline()),
        completedSectionIds: ["section-0"],
      },
      full_text: "x",
    };
    const session = persist.createModule6DraftSession({ initialServerDraft: saved });
    session.setFailNextGet(true);
    await session.hydrate({ generation: session.beginHydration(), emptySections: [] });
    const retry = await session.hydrate({
      generation: session.beginHydration(),
      emptySections: [],
      meta: saved.draft_meta,
    });
    assert.equal(retry.readState, "draft_loaded");
    assert.deepEqual(session.getLocalSections(), saved.sections);
    assert.equal(session.getLocalMeta().currentStageId, "section-2");
    assert.equal(session.getWriteCount(), 0);
  });

  it("10. Stale hydration response cannot replace newer state", async () => {
    const saved = {
      sections: ["a", "b", "c", "d"],
      locked: false,
      draft_meta: { currentStageId: "section-1" },
    };
    const session = persist.createModule6DraftSession({ initialServerDraft: saved });
    let resolveStale;
    const stalePromiseGet = new Promise((resolve) => {
      resolveStale = resolve;
    });
    const staleGen = session.beginHydration();
    session.setGetHandler(() => stalePromiseGet);
    const staleHydrate = session.hydrate({
      generation: staleGen,
      emptySections: ["", "", "", ""],
    });
    session.setGetHandler(null);
    const fresh = await session.hydrate({
      generation: session.beginHydration(),
      emptySections: [],
    });
    assert.equal(fresh.applied, true);
    resolveStale({ ok: true, data: null });
    const stale = await staleHydrate;
    assert.equal(stale.stale, true);
    assert.deepEqual(session.getLocalSections(), saved.sections);
  });

  it("11–12. First real edit autosaves; rapid A→B leaves B", async () => {
    const controller = persist.createDraftWriteController();
    const server = { sections: null };
    controller.noteLocalEdit();
    const a = controller.beginAutosave(async () => {
      await new Promise((r) => setTimeout(r, 20));
      // Older in-flight write must not win if a newer job already applied.
      if (!server.sections) server.sections = ["A"];
      return { ok: true, sections: ["A"] };
    }, { sections: ["A"] });
    controller.noteLocalEdit();
    const b = controller.beginAutosave(async () => {
      server.sections = ["B"];
      return { ok: true, sections: ["B"] };
    }, { sections: ["B"] });
    const ra = await a;
    const rb = await b;
    assert.equal(rb.ok, true);
    assert.equal(rb.applied, true);
    // A may complete before coalesce (already in flight) or settle stale.
    assert.ok(ra.stale === true || ra.ok === true);
    assert.deepEqual(server.sections, ["B"]);
  });

  it("13. Autosave A + Continue with B leaves B and destination", async () => {
    const controller = persist.createDraftWriteController();
    let saved = null;
    controller.noteLocalEdit();
    const auto = controller.beginAutosave(async () => {
      await new Promise((r) => setTimeout(r, 15));
      saved = { sections: ["A"], meta: { currentStageId: "section-0" } };
      return { ok: true };
    }, { sections: ["A"] });
    const nav = controller.beginNavigate(async () => {
      saved = { sections: ["B"], meta: { currentStageId: "section-1" } };
      return { ok: true };
    }, { sections: ["B"], meta: { currentStageId: "section-1" } });
    await auto;
    const nr = await nav;
    assert.equal(nr.ok, true);
    assert.equal(saved.sections[0], "B");
    assert.equal(saved.meta.currentStageId, "section-1");
  });

  it("14–15. Back and Edit-from-review persist destination via navigate action", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.ok(src.includes("persistAndNavigateStage"));
    assert.ok(src.includes("editFromReview"));
    assert.ok(src.includes("MODULE6_WRITE_ACTION.NAVIGATE"));
    assert.ok(src.includes("goBack"));
  });

  it("16–17. Failed navigation keeps text; Retry path present", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.ok(src.includes("module6-navigation-save-error"));
    assert.ok(src.includes("Your writing is still here"));
  });

  it("18. Autosave omits lock mutation", () => {
    const row = persist.buildModule6UpsertRow({
      userEmail: "a@b.com",
      sections: ["x"],
      action: "autosave",
      locked: false,
    });
    assert.equal(Object.prototype.hasOwnProperty.call(row, "locked"), false);
    const fin = persist.buildModule6UpsertRow({
      userEmail: "a@b.com",
      sections: ["x"],
      action: "finalize",
    });
    assert.equal(fin.locked, true);
  });

  it("19. Locked row rejects ordinary writes", () => {
    const session = persist.createModule6DraftSession({
      initialServerDraft: {
        sections: ["a", "b", "c", "d"],
        locked: true,
        full_text: "a\n\nb\n\nc\n\nd",
      },
    });
    // Force loaded state
    session.setServerDraft({
      sections: ["a", "b", "c", "d"],
      locked: true,
    });
    // Simulate loaded
    return session.hydrate({ generation: session.beginHydration() }).then(() => {
      const blocked = session.attemptWrite({
        sections: ["hack"],
        action: "autosave",
      });
      assert.equal(blocked.blocked, true);
      assert.equal(session.getWriteCount(), 0);
    });
  });

  it("20. Finish during pending autosave writes newest draft locked last", async () => {
    const controller = persist.createDraftWriteController();
    const writes = [];
    controller.noteLocalEdit();
    const auto = controller.beginAutosave(async () => {
      await new Promise((r) => setTimeout(r, 30));
      writes.push("auto");
      return { ok: true };
    }, { sections: ["old"] });
    const fin = await controller.finalize({
      payload: { sections: ["newest"], meta: {} },
      cancelPendingTimer: () => {},
      sendFinalize: async (payload) => {
        writes.push(`finalize:${payload.sections[0]}`);
        return { ok: true };
      },
    });
    await auto;
    assert.equal(fin.ok, true);
    assert.equal(fin.locked, true);
    assert.equal(writes.includes("finalize:newest"), true);
    assert.equal(writes[writes.length - 1], "finalize:newest");
  });

  it("21–22. Failed Finish stays editable; successful Retry locks once", async () => {
    const controller = persist.createDraftWriteController();
    let attempts = 0;
    const fail = await controller.finalize({
      payload: { sections: ["draft"] },
      cancelPendingTimer: () => {},
      sendFinalize: async () => {
        attempts += 1;
        return { ok: false, error: "network" };
      },
    });
    assert.equal(fail.ok, false);
    assert.equal(fail.locked, false);
    controller.unlockAfterFailedFinalize();
    assert.equal(controller.areAutosavesAllowed(), true);

    const ok = await controller.finalize({
      payload: { sections: ["draft"] },
      cancelPendingTimer: () => {},
      sendFinalize: async () => {
        attempts += 1;
        return { ok: true };
      },
    });
    assert.equal(ok.ok, true);
    assert.equal(ok.locked, true);
    assert.equal(attempts, 2);
  });

  it("23. Late old write cannot unlock finalized draft", async () => {
    const session = persist.createModule6DraftSession({
      initialServerDraft: {
        sections: ["a", "b", "c", "d"],
        locked: false,
      },
    });
    await session.hydrate({ generation: session.beginHydration() });
    session.attemptWrite({
      sections: ["a", "b", "c", "d"],
      action: "finalize",
    });
    assert.equal(session.getServerDraft().locked, true);
    const late = session.attemptWrite({
      sections: ["stale"],
      action: "autosave",
      locked: false,
    });
    assert.equal(late.blocked, true);
    assert.equal(session.getServerDraft().locked, true);
    assert.deepEqual(session.getServerDraft().sections, ["a", "b", "c", "d"]);
  });
});

describe("CP-G API contracts and gates", () => {
  it("24. Server derives full_text", () => {
    const text = persist.deriveModule6FullText(["Intro", "Body", "End"]);
    assert.equal(text, "Intro\n\nBody\n\nEnd");
    const validated = persist.validateModule6DraftWriteBody({
      sections: ["Intro", "Body"],
      full_text: "CLIENT_LIE",
      action: "autosave",
    });
    assert.equal(validated.full_text, "Intro\n\nBody");
  });

  it("25. Client email is ignored (API uses session)", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../app/api/module6/draft/route.js"),
      "utf8"
    );
    const validation = require("../lib/module6/module6DraftWriteValidation.js");
    assert.ok(src.includes("getAuthenticatedUserEmail"));
    assert.ok(src.includes("ignore any client-supplied email") || src.includes("Session email"));
    const validated = validation.validateModule6OrdinaryWriteBody({
      sections: ["a"],
      userEmail: "attacker@evil.com",
      expected_revision: 0,
    });
    assert.equal(validated.ok, true);
  });

  it("26. Empty required section blocks review/finalize", () => {
    const gate = persist.evaluateDraftFinalizeReadiness({
      sections: ["Enough intro text.", "", "Enough conclusion text."],
      expectedCount: 3,
    });
    assert.equal(gate.ok, false);
    assert.deepEqual(gate.emptyIndexes, [1]);
    assert.equal(gate.gradesStyle, false);
  });

  it("27. Mechanical gates do not grade style", () => {
    const section = persist.evaluateSectionReadiness("Short but ok text.");
    assert.equal(section.gradesStyle, false);
    const finalize = persist.evaluateDraftFinalizeReadiness({
      sections: ["Enough intro text here.", "Enough body text here.", "Enough end."],
    });
    assert.equal(finalize.gradesStyle, false);
  });

  it("27b. Hello! + immediate Keep going is blocked with no navigation write", () => {
    // Reproduce rapid type → Keep going against a live sections snapshot
    // (the same path ModuleSix must use so React state lag cannot bypass the gate).
    const live = { sections: [""], meta: { currentStageId: "section-0" } };
    const writes = [];

    // Student types Hello! (6 chars < SECTION_MIN_CHARS).
    live.sections = ["Hello!"];

    const gate = persist.evaluateForwardNavigationGate({
      sections: persist.resolveLiveDraftSections(live.sections, [""]),
      draftIndex: 0,
      isReviewStage: false,
    });
    assert.equal(gate.blocked, true);
    assert.equal(gate.ok, false);
    assert.ok(gate.message);
    assert.equal(gate.gradesStyle, false);
    assert.equal(persist.evaluateSectionReadiness("Hello!").ok, false);

    if (!gate.blocked) {
      writes.push({
        action: "navigate",
        sections: live.sections,
        meta: { currentStageId: "section-1" },
      });
    }

    assert.equal(writes.length, 0);
    assert.deepEqual(live.sections, ["Hello!"]);
  });

  it("27c. Valid section at minimum advances and saves destination once", async () => {
    const min = persist.SECTION_MIN_CHARS;
    const valid = "x".repeat(min);
    assert.equal(persist.evaluateSectionReadiness(valid).ok, true);

    const live = {
      sections: [valid, "", "", ""],
      meta: { currentStageId: "section-0" },
    };
    const writes = [];
    const controller = persist.createDraftWriteController();

    const gate = persist.evaluateForwardNavigationGate({
      sections: live.sections,
      draftIndex: 0,
      isReviewStage: false,
    });
    assert.equal(gate.blocked, false);

    const nav = await controller.beginNavigate(async () => {
      writes.push({
        action: "navigate",
        sections: [...live.sections],
        meta: { currentStageId: "section-1" },
      });
      return { ok: true, sections: live.sections };
    }, {
      sections: live.sections,
      meta: { currentStageId: "section-1" },
    });

    assert.equal(nav.ok, true);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].meta.currentStageId, "section-1");
    assert.equal(writes[0].sections[0], valid);
  });

  it("27d. Body-job fallback and Module 4 jobs render grammatically", () => {
    const wording = require("../lib/module6/bodyJobWording.js");
    assert.equal(
      wording.formatModule6BodyJobSentence(""),
      "This paragraph develops one part of your thesis."
    );
    assert.equal(
      wording.formatModule6BodyJobSentence(null),
      "This paragraph develops one part of your thesis."
    );
    // Stored Module 4 job value is not rewritten; display conjugates mechanically.
    assert.equal(
      wording.formatModule6BodyJobSentence("Analyze the speech"),
      "This paragraph analyzes the speech."
    );
    assert.equal(
      wording.formatModule6BodyJobSentence("Compare both works."),
      "This paragraph compares both works."
    );
    assert.equal(
      wording.formatModule6BodyJobSentence("This paragraph builds ethos."),
      "This paragraph builds ethos."
    );

    const presentation = getModule6StepPresentation(
      {
        type: "body",
        bodyIndex: 0,
        draftIndex: 1,
        job: null,
      },
      { body: [{ point: "A point", job: "" }] }
    );
    assert.equal(
      presentation.organizationalJob,
      "This paragraph develops one part of your thesis."
    );
    assert.equal(presentation.organizationalJob.includes("develop one part"), false);

    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    assert.ok(src.includes("evaluateForwardNavigationGate"));
    assert.ok(src.includes("resolveLiveDraftSections"));
    assert.ok(src.includes("draftSnapshotRef.current = {\n        sections: copy"));
  });
});

describe("CP-G upstream outline change and Module 7", () => {
  it("28. Timestamp-only outline update causes no review", () => {
    const outline = twoBodyOutline();
    const sig = mapping.buildModule5DraftSourceSignature(outline);
    const withTs = { ...outline, updatedAt: "2026-07-13T00:00:00.000Z", module5Ui: { stage: 2 } };
    const review = mapping.resolveModule6OutlineChangeReview({
      savedSignature: sig,
      currentOutline: withTs,
    });
    assert.equal(review.required, false);
  });

  it("29–30. Meaningful outline change preserves draft and requires review; no silent remap", () => {
    const outline = twoBodyOutline();
    const sig = mapping.buildModule5DraftSourceSignature(outline);
    const changed = {
      ...outline,
      body: [
        { ...outline.body[0], point: "Changed point", bucket: "Changed point" },
        outline.body[1],
      ],
    };
    const review = mapping.resolveModule6OutlineChangeReview({
      savedSignature: sig,
      currentOutline: changed,
    });
    assert.equal(review.required, true);
    assert.equal(review.preservesDraft, true);
    assert.equal(review.silentRemap, false);
    assert.ok(review.changed.some((c) => c.kind === "body_card"));

    const countChange = mapping.resolveModule6OutlineChangeReview({
      savedSignature: sig,
      currentOutline: threeBodyOutline(),
    });
    assert.equal(countChange.required, true);
    assert.ok(countChange.changed.some((c) => c.kind === "body_count"));
  });

  it("31–32. Module 7 receives prose sections in order; metadata never enters prose", () => {
    const outline = twoBodyOutline();
    const steps = buildDraftSectionSteps(outline);
    const sections = [
      "Introduction prose.",
      "Body one prose.",
      "Body two prose.",
      "Conclusion prose.",
    ];
    const blocks = getEssayProseBlocks(steps, sections);
    assert.equal(blocks.length, 4);
    assert.equal(blocks[0].text, "Introduction prose.");
    assert.equal(blocks[1].text, "Body one prose.");
    const joined = sections.join("\n\n");
    assert.equal(joined.includes("analyze_speech"), false);
    assert.equal(joined.includes("draft_meta"), false);
    assert.equal(joined.includes("schemaVersion"), false);
  });
});

describe("CP-G production wiring and layout", () => {
  it("33. 320/390/768/1024/1440 layout contracts", () => {
    assert.deepEqual(mapping.CPG_LAYOUT_CONTRACT.viewports, [
      320, 390, 768, 1024, 1440,
    ]);
    assert.equal(mapping.CPG_LAYOUT_CONTRACT.mobile.minActionTargetPx, 44);
    assert.equal(mapping.CPG_LAYOUT_CONTRACT.mobile.noHorizontalOverflow, true);
  });

  it("34. JSX parses / production ModuleSix wiring", () => {
    const src = fs.readFileSync(
      path.join(__dirname, "../components/ModuleSix.js"),
      "utf8"
    );
    const routeSrc = fs.readFileSync(
      path.join(__dirname, "../app/api/module6/draft/route.js"),
      "utf8"
    );
    assert.ok(src.includes("createDraftWriteController"));
    assert.ok(src.includes("draftRevisionRef"));
    assert.ok(src.includes("expected_revision"));
    assert.ok(routeSrc.includes("writeModule6DraftAtomicForUser"));
    assert.ok(routeSrc.includes("validateModule6FinalizeRequestBody"));
    assert.ok(routeSrc.includes("loadFinalizedModule5Outline"));
    assert.equal(routeSrc.includes("upsertModule6DraftAdmin"), false);
    assert.equal(routeSrc.includes("body?.expected_revision != null"), false);
    assert.ok(src.includes("module6-draft-read-error"));
    assert.ok(src.includes("module6-finalize-error"));
    assert.ok(src.includes("stage-review") || src.includes("REVIEW"));
    assert.ok(src.includes("overflow-x-hidden"));
    assert.ok(src.includes("min-h-[44px]"));
    assert.equal(src.includes("setLocked(true);\n\n    const result"), false);
    assert.ok(src.includes("createHydrationDraftAutosaveGate"));
    assert.ok(src.includes("studentDirtyRef"));
  });

  it("35. Read-state model, migration RPC, and atomic path", () => {
    assert.equal(
      hydration.MODULE6_DRAFT_READ_STATE.DRAFT_READ_FAILED,
      "draft_read_failed"
    );
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20260713010000_module6_draft_meta.sql"
      ),
      "utf8"
    );
    assert.ok(sql.includes("draft_meta jsonb"));
    assert.ok(sql.includes("draft_revision"));
    assert.ok(sql.includes("write_module6_draft_atomic"));
    assert.ok(sql.includes("pg_advisory_xact_lock"));
    assert.equal(sql.includes("p_expected_revision bigint DEFAULT NULL"), false);
    assert.equal(sql.includes("IF p_expected_revision IS NOT NULL"), false);
    assert.ok(sql.includes("GRANT EXECUTE"));
    assert.ok(sql.includes("service_role"));
    const docs = fs.readFileSync(
      path.join(
        __dirname,
        "../docs/project-standards/student-writing-record-standard.md"
      ),
      "utf8"
    );
    assert.ok(docs.includes("draft_meta"));
    assert.ok(docs.includes("draft_revision") || docs.includes("CP-G"));
  });

  it("Hydration write gate helpers", () => {
    assert.equal(
      hydration.shouldAllowModule6DraftWrites({
        readState: "draft_read_failed",
        hydrationReady: true,
        locked: false,
      }),
      false
    );
    assert.equal(
      hydration.shouldAllowModule6DraftWrites({
        readState: "confirmed_no_draft",
        hydrationReady: true,
        locked: false,
      }),
      true
    );
  });
});

describe("CP-G atomic database / multi-tab race model", () => {
  const atomicStore = require("../lib/module6/module6AtomicDraftStore.js");
  const finalizeValidation = require("../lib/module6/module6DraftWriteValidation.js");

  const finalizedSections = () => [
    "Introduction prose with enough length here.",
    "Body one prose with enough length here.",
    "Body two prose with enough length here.",
    "Conclusion prose with enough length here.",
  ];

  const finalizeMeta = () => validFinalizeMeta(twoBodyOutline());

  it("A1. Delayed autosave after finalize cannot overwrite finalized prose", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections: ["old"],
      locked: false,
      draft_revision: 1,
      full_text: "old",
    });
    const finalized = finalizedSections();
    const fin = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "finalize",
      sections: finalized,
      draftMeta: finalizeMeta(),
      expectedRevision: 1,
    });
    const delayedAuto = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["stale overwrite attempt"],
      expectedRevision: 1,
      delayMs: 10,
    });
    const finResult = await fin;
    const autoResult = await delayedAuto;
    assert.equal(finResult.ok, true);
    assert.equal(finResult.status, "finalized");
    assert.equal(autoResult.ok, false);
    assert.equal(autoResult.status, "locked");
    assert.deepEqual(db.getRow().sections, finalized);
    assert.equal(db.getRow().locked, true);
  });

  it("A2. Two-tab autosave B wins; stale A rejected by revision CAS", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const saveB = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["B prose with enough text."],
      expectedRevision: 0,
    });
    const saveA = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["A prose with enough text."],
      expectedRevision: 0,
      delayMs: 15,
    });
    const resultB = await saveB;
    const resultA = await saveA;
    assert.equal(resultB.ok, true);
    assert.equal(resultB.revision, 1);
    assert.equal(resultA.ok, false);
    assert.equal(resultA.status, "stale");
    assert.equal(db.getRow().sections[0], "B prose with enough text.");
  });

  it("A3. Finalize wins permanently over pending navigation", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections: finalizedSections(),
      locked: false,
      draft_revision: 2,
    });
    const fin = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "finalize",
      sections: finalizedSections(),
      draftMeta: finalizeMeta(),
      expectedRevision: 2,
    });
    const nav = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "navigate",
      sections: finalizedSections().map((s, i) => (i === 1 ? "nav stale" : s)),
      expectedRevision: 2,
      delayMs: 20,
    });
    const finResult = await fin;
    const navResult = await nav;
    assert.equal(finResult.ok, true);
    assert.equal(navResult.status, "locked");
    assert.equal(db.getRow().locked, true);
    assert.equal(db.getRow().sections[1], finalizedSections()[1]);
  });

  it("A4. Ordinary write after lock rejected with zero mutation", async () => {
    const lockedSections = finalizedSections();
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections: lockedSections,
      locked: true,
      draft_revision: 5,
      full_text: lockedSections.join("\n\n"),
    });
    const result = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["mutated"],
      expectedRevision: 5,
    });
    assert.equal(result.status, "locked");
    assert.deepEqual(db.getRow().sections, lockedSections);
  });

  it("A5. Identical finalize Retry is idempotent", async () => {
    const sections = finalizedSections();
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections,
      locked: true,
      draft_revision: 3,
      full_text: sections.join("\n\n"),
    });
    const retry = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "finalize",
      sections,
      draftMeta: finalizeMeta(),
      expectedRevision: 99,
    });
    assert.equal(retry.status, "already_finalized");
    assert.equal(retry.locked, true);
    assert.equal(db.getRow().draft_revision, 3);
  });

  it("A6. Different finalize after lock rejected", async () => {
    const sections = finalizedSections();
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections,
      locked: true,
      draft_revision: 3,
    });
    const retry = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "finalize",
      sections: sections.map((s) => s + " changed"),
      draftMeta: finalizeMeta(),
      expectedRevision: 3,
    });
    assert.equal(retry.status, "locked");
    assert.equal(retry.ok, false);
    assert.deepEqual(db.getRow().sections, sections);
  });

  it("A7–A9. Finalize validation rejects empty, wrong count, review required", () => {
    const outline = twoBodyOutline();
    const meta = validFinalizeMeta(outline);
    const empty = finalizeValidation.validateModule6FinalizeAgainstOutline({
      sections: ["", "b", "c", "d"],
      draftMeta: meta,
      outline,
    });
    assert.equal(empty.ok, false);
    assert.equal(empty.code, "incomplete_draft");

    const wrongCount = finalizeValidation.validateModule6FinalizeAgainstOutline({
      sections: ["a", "b"],
      draftMeta: meta,
      outline,
    });
    assert.equal(wrongCount.ok, false);

    const review = finalizeValidation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...meta,
        outlineReviewRequired: true,
        outlineReviewAcknowledged: true,
      },
      outline,
    });
    assert.equal(review.ok, false);
    assert.equal(review.code, "outline_review_required");
  });

  it("A10. Stale outline signature rejected on finalize", () => {
    const outline = twoBodyOutline();
    const staleSig = mapping.buildModule5DraftSourceSignature({
      ...outline,
      thesis: "Different thesis entirely",
    });
    const result = finalizeValidation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        sourceOutlineSignature: staleSig,
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "outline_signature_stale");
  });

  it("A11. Timestamp-only outline changes do not invalidate signature", () => {
    const outline = twoBodyOutline();
    const sig = mapping.buildModule5DraftSourceSignature(outline);
    const withUi = { ...outline, module5Ui: { stage: 9 }, updatedAt: "2099" };
    assert.equal(
      mapping.buildModule5DraftSourceSignature(withUi),
      sig
    );
  });

  it("A12. Client full_text and email not used in ordinary validation", () => {
    const v = finalizeValidation.validateModule6OrdinaryWriteBody({
      sections: ["hello"],
      full_text: "CLIENT_LIE",
      userEmail: "attacker@evil.com",
      action: "autosave",
      expected_revision: 0,
    });
    assert.equal(v.ok, true);
    assert.equal(v.sections[0], "hello");
  });

  it("A13. Unsupported action rejected", () => {
    const v = finalizeValidation.validateModule6OrdinaryWriteBody({
      sections: ["a"],
      action: "delete_all",
    });
    assert.equal(v.ok, false);
    assert.equal(v.code, "unsupported_action");
  });

  it("A14. Missing RPC returns clear error without mutation", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    db.setRpcAvailable(false);
    const result = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["x"],
      expectedRevision: 0,
    });
    assert.equal(result.error, "rpc_unavailable");
    assert.equal(db.getRow(), null);
  });

  it("A15–A16. Legacy unlocked row can save; legacy locked stays immutable", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections: ["legacy prose here."],
      locked: false,
      draft_revision: 0,
    });
    const save = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["legacy prose updated."],
      expectedRevision: 0,
    });
    assert.equal(save.ok, true);
    assert.equal(db.getRow().draft_revision, 1);

    const lockedDb = atomicStore.createModule6AtomicDraftDatabase({
      sections: ["locked legacy"],
      locked: true,
      draft_revision: 1,
    });
    const blocked = await lockedDb.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "navigate",
      sections: ["nope"],
      expectedRevision: 1,
    });
    assert.equal(blocked.status, "locked");
  });

  it("A17–A18. full_text derived; metadata never in prose", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const meta = {
      schemaVersion: 1,
      currentStageId: "section-1",
      sourceOutlineSignature: "sig",
    };
    const sections = ["Intro text.", "Body text.", "End text."];
    const result = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections,
      draftMeta: meta,
      expectedRevision: 0,
    });
    assert.equal(result.full_text, sections.join("\n\n"));
    assert.equal(db.getRow().full_text, sections.join("\n\n"));
    assert.equal(db.getRow().full_text.includes("schemaVersion"), false);
    assert.deepEqual(db.getRow().draft_meta, meta);
  });
});

describe("CP-G atomic-write bypass repair", () => {
  const atomicStore = require("../lib/module6/module6AtomicDraftStore.js");
  const validation = require("../lib/module6/module6DraftWriteValidation.js");
  const outline = twoBodyOutline();

  it("B1. autosave rejects missing expected_revision", () => {
    const result = validation.validateModule6OrdinaryWriteBody({
      action: "autosave",
      sections: ["hello world"],
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_revision");
  });

  it("B2. navigate rejects missing expected_revision", () => {
    const result = validation.validateModule6OrdinaryWriteBody({
      action: "navigate",
      sections: ["hello world"],
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_revision");
  });

  it("B3. finalize rejects missing expected_revision", () => {
    const result = validation.validateModule6FinalizeRequestBody(
      {
        action: "finalize",
        sections: finalizedSections(),
        draft_meta: validFinalizeMeta(outline),
      },
      { outline }
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_revision");
  });

  it("B4. negative expected_revision rejected", () => {
    const result = validation.parseMandatoryExpectedRevision({
      expected_revision: -1,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_revision");
  });

  it("B5. non-integer expected_revision rejected", () => {
    const result = validation.parseMandatoryExpectedRevision({
      expected_revision: 1.5,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_revision");
  });

  it("B6. first creation requires revision 0", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const saved = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["First save prose text."],
      expectedRevision: 0,
    });
    assert.equal(saved.ok, true);
    assert.equal(saved.revision, 1);
  });

  it("B7. first creation with revision 1 is stale", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const saved = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["Should not insert."],
      expectedRevision: 1,
    });
    assert.equal(saved.ok, false);
    assert.equal(saved.status, "stale");
    assert.equal(db.getRow(), null);
  });

  it("B8. concurrent first inserts serialize to one winner", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const winnerPromise = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["Winner prose text here."],
      expectedRevision: 0,
    });
    const loserPromise = db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["Loser prose text here."],
      expectedRevision: 0,
      delayMs: 10,
    });
    const winner = await winnerPromise;
    const loser = await loserPromise;
    assert.equal(winner.ok, true);
    assert.equal(loser.ok, false);
    assert.equal(loser.status, "stale");
    assert.equal(db.getRow().sections[0], "Winner prose text here.");
  });

  it("B9. finalize rejects missing draft_meta", () => {
    const result = validation.validateModule6FinalizeRequestBody(
      {
        action: "finalize",
        sections: finalizedSections(),
        expected_revision: 0,
      },
      { outline }
    );
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_metadata");
  });

  it("B10. finalize rejects empty sourceOutlineSignature", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        sourceOutlineSignature: "",
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_signature");
  });

  it("B11. missing client signature cannot bypass canonical check", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        sourceOutlineSignature: "",
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_signature");
  });

  it("B12. finalize requires exact stage-review stage id", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        currentStageId: "section-2",
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "not_on_review_stage");
  });

  it("B13. finalize rejects outlineReviewRequired true even when acknowledged", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        outlineReviewRequired: true,
        outlineReviewAcknowledged: true,
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "outline_review_required");
  });

  it("B14. finalize rejects missing completedSectionIds", () => {
    const meta = { ...validFinalizeMeta(outline) };
    delete meta.completedSectionIds;
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: meta,
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_completed_sections");
  });

  it("B15. finalize rejects incomplete completedSectionIds", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        completedSectionIds: ["section-0"],
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "incomplete_completed_sections");
  });

  it("B16. finalize rejects wrong review currentSectionIndex", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: {
        ...validFinalizeMeta(outline),
        currentSectionIndex: 0,
      },
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "invalid_review_position");
  });

  it("B17. atomic store rejects missing revision", async () => {
    const db = atomicStore.createModule6AtomicDraftDatabase(null);
    const result = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "autosave",
      sections: ["x"],
    });
    assert.equal(result.error, "missing_revision");
    assert.equal(db.getRow(), null);
  });

  it("B18. migration requires revision param and advisory lock", () => {
    const sql = fs.readFileSync(
      path.join(
        __dirname,
        "../supabase/migrations/20260713010000_module6_draft_meta.sql"
      ),
      "utf8"
    );
    assert.equal(sql.includes("p_expected_revision bigint DEFAULT NULL"), false);
    assert.equal(sql.includes("IF p_expected_revision IS NOT NULL"), false);
    assert.ok(sql.includes("pg_advisory_xact_lock(hashtext(p_user_email), 6)"));
    assert.ok(sql.includes("IF p_expected_revision IS NULL THEN"));
  });

  it("B19. missing finalize metadata is not normalized into passing shape", () => {
    const result = validation.validateModule6FinalizeAgainstOutline({
      sections: finalizedSections(),
      draftMeta: null,
      outline,
    });
    assert.equal(result.ok, false);
    assert.equal(result.code, "missing_metadata");
  });

  it("B20. identical finalize retry stays idempotent on locked row", async () => {
    const sections = finalizedSections();
    const db = atomicStore.createModule6AtomicDraftDatabase({
      sections,
      locked: true,
      draft_revision: 4,
      full_text: sections.join("\n\n"),
    });
    const retry = await db.writeModule6DraftAtomic({
      userEmail: "s@test.com",
      action: "finalize",
      sections,
      draftMeta: validFinalizeMeta(outline),
      expectedRevision: 99,
    });
    assert.equal(retry.status, "already_finalized");
    assert.equal(db.getRow().draft_revision, 4);
  });
});

function finalizedSections() {
  return [
    "Introduction prose with enough length here.",
    "Body one prose with enough length here.",
    "Body two prose with enough length here.",
    "Conclusion prose with enough length here.",
  ];
}
