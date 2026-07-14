"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import InfoCallout from "@/components/ui/InfoCallout";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { normalizeEvidenceForModule3 } from "@/lib/module2/normalizeEvidenceReader";
import {
  buildModuleThreeMatrixHandoffPresentation,
  buildCustomMatrixOption,
  buildActiveAdoptedDirection,
  canContinueFromMatrixPattern,
  canCompleteCustomMatrixDirection,
  createSerializedWriteController,
  materializeMatrixPatternArtifact,
  matrixPatternArtifactId,
  resolveClaimInternalStage,
  resolveThesisInternalStage,
  resolveQualifyingEvidenceIds,
  restoreActiveDirectionFromSavedPattern,
  evaluateAllDownstreamArtifactsForUpstreamChange,
  evaluateDownstreamMatrixReview,
  confirmMatrixReview,
  resolveCurrentUpstreamSignature,
  createMatrixReviewState,
  CLAIM_INTERNAL_STAGES,
  THESIS_INTERNAL_STAGES,
  MATRIX_REVIEW_MESSAGE,
} from "@/lib/module3/moduleThreeMatrixHandoffHelpers";
import { readAdditiveMatrixFields } from "@/lib/module3/matrixArtifactFields";
import ModuleThreeMatrixReviewBanner from "@/components/module3/ModuleThreeMatrixReviewBanner";
import { getTChartEntries } from "@/lib/supabase/helpers/tchartEntries";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import ModuleThreeProgress from "@/components/module3/ModuleThreeProgress";
import ModuleThreeConnectEvidenceStep from "@/components/module3/ModuleThreeConnectEvidenceStep";
import ModuleThreeEvaluateStrengthStep from "@/components/module3/ModuleThreeEvaluateStrengthStep";
import ModuleThreeExploreIdeaStep from "@/components/module3/ModuleThreeExploreIdeaStep";
import ModuleThreeNoticePatternsStep from "@/components/module3/ModuleThreeNoticePatternsStep";
import ModuleThreeReviewEvidenceStep from "@/components/module3/ModuleThreeReviewEvidenceStep";
import ModuleThreeStepFrame from "@/components/module3/ModuleThreeStepFrame";
import ModuleThreeThinkingCanvas from "@/components/module3/ModuleThreeThinkingCanvas";
import ReopenSourceTextsControl from "@/components/sources/ReopenSourceTextsControl";
import {
  ReferenceSection,
  WorkingSetSection,
} from "@/components/module3/ModuleThreeDeskFrame";
import {
  deleteClaimArtifact,
  deleteIdeaArtifact,
  deleteThesisArtifact,
  selectPatternArtifact,
  upsertClaimArtifact,
  upsertEvidenceClusterArtifact,
  upsertIdeaArtifact,
  upsertPatternArtifact,
  upsertThesisArtifact,
} from "@/lib/artifacts/writeArtifacts";
import {
  REVIEW_QUOTE_MINIMUM,
  DUPLICATE_GROUP_MESSAGE,
  canContinueFromReview,
  findDuplicateCluster,
  getReviewContinueHint,
  getReviewReadyMessage,
  getSaveGroupConfirmationMessage,
  hasDownstreamThinking,
  resolveGroupSelectionAction,
} from "@/lib/module3/reviewEvidenceHelpers";
import { getPatternsContinueHint, canContinueFromPatterns } from "@/lib/module3/noticePatternsHelpers";
import {
  IDEA_STATEMENT_MINIMUM,
  IDEA_WHY_MINIMUM,
  canContinueFromExploreIdea,
  getExploreIdeaContinueHint,
  getExploreIdeaReadyMessage,
} from "@/lib/module3/exploreIdeaHelpers";
import {
  CONNECT_MINIMUM,
  getConnectContinueHint,
  getConnectEvidencePhase,
  getConnectReadyMessage,
  getConnectWorkingEvidence,
  getEarlierPassStageIds,
  inferUiChoiceFromConnection,
  isValidExplainedConnection,
} from "@/lib/module3/connectEvidenceHelpers";
import {
  canContinueFromEvaluate,
  getArtifactChainReadinessLabel,
  getBothWorksEvidenceStatus,
  getEvaluateFormContinueHint,
  getEvaluateReadyMessage,
  getGatherFocusModel,
  relationLabelForStored,
} from "@/lib/module3/evaluateStrengthHelpers";
import ModuleThreeArtifactChain from "@/components/module3/ModuleThreeArtifactChain";
import ModuleThreeBuildArgumentStep from "@/components/module3/ModuleThreeBuildArgumentStep";
import {
  canContinueFromClaim,
  canContinueFromThesis,
  getClaimContinueHint,
  getClaimReadyMessage,
  getThesisContinueHint,
  getThesisReadyMessage,
  resolveSupportRationale,
} from "@/lib/module3/buildArgumentHelpers";
import {
  getArtifactChainStageForStep,
  getInitialModuleThreePhase,
} from "@/lib/module3/moduleThreePhaseModel";

const ASSIGNMENT = mlkAssignmentDefinition;
const SOURCE_LABELS = {
  speech: ASSIGNMENT.sources.speech.label,
  letter: ASSIGNMENT.sources.letter.label,
};

const STEP_IDS = {
  REVIEW: "review_evidence",
  PATTERNS: "notice_patterns",
  IDEA: "explore_idea",
  CONNECT: "connect_evidence",
  EVALUATE: "evaluate_strength",
  GATHER: "gather_more_evidence",
  CLAIM: "develop_claim",
  THESIS: "turn_claim_into_thesis",
};

const STEP_DEFINITIONS = [
  {
    id: STEP_IDS.REVIEW,
    question: "Put related quotations into groups.",
  },
  {
    id: STEP_IDS.PATTERNS,
    question: "What do these quotations seem to have in common?",
  },
  {
    id: STEP_IDS.IDEA,
    question: "What might this pattern mean?",
  },
  {
    id: STEP_IDS.CONNECT,
    question: "How does each quote help this idea?",
  },
  {
    id: STEP_IDS.EVALUATE,
    question: "Is my support strong enough yet?",
  },
  {
    id: STEP_IDS.GATHER,
    question: "What kind of quote is still missing?",
    optional: true,
  },
  {
    id: STEP_IDS.CLAIM,
    question: "What point do these quotes help you prove?",
  },
  {
    id: STEP_IDS.THESIS,
    question: "How would you explain your main point in one clear sentence?",
  },
];

const ANSWER_TEXTAREA_CLASS =
  "min-h-[140px] w-full rounded-xl border-2 border-theme-dark/20 bg-white p-4 text-base leading-relaxed text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const QUIET_TEXTAREA_CLASS =
  "min-h-[80px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

function makePatternNotice(id) {
  return {
    id,
    text: "",
    evidenceIds: [],
  };
}

function makeEvidenceCluster(id, name, evidenceIds, reflection = null) {
  return {
    id,
    name,
    evidenceIds,
    reflection,
  };
}

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function sourceTitleForType(sourceType) {
  return ASSIGNMENT.sources[sourceType]?.title || "Saved source";
}

function sourceLabelForType(sourceType) {
  return SOURCE_LABELS[sourceType] || "Source";
}

function evidenceSummaryLine(evidence) {
  const quote = safeText(evidence.quote);
  const observation = safeText(evidence.observation);

  if (quote) {
    return quote.length > 80 ? `${quote.slice(0, 80)}...` : quote;
  }

  if (observation) {
    return observation.length > 80
      ? `${observation.slice(0, 80)}...`
      : observation;
  }

  return `${evidence.sourceLabel} evidence`;
}

function previewText(value, maxLength = 110) {
  const text = safeText(value);
  if (!text) {
    return "";
  }

  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function evidenceArtifactLabel(artifact) {
  const sourceLabel = artifact?.sourceType
    ? sourceLabelForType(artifact.sourceType)
    : "Evidence";
  const descriptor =
    safeText(artifact?.sourceTitle) ||
    safeText(artifact?.rhetoricalStrategy) ||
    safeText(artifact?.category) ||
    "Saved note";

  return `${sourceLabel} · ${descriptor}`;
}

function evidenceArtifactPreview(artifact) {
  return (
    previewText(artifact?.quote, 90) ||
    previewText(artifact?.studentObservation, 90) ||
    "No preview available yet."
  );
}

function thesisArtifactItems(thesisArtifact, thesisStatement) {
  const items = [];

  if (safeText(thesisStatement)) {
    items.push({
      id: "local-thesis",
      label: "Current thesis draft",
      preview: previewText(thesisStatement, 100),
    });
  }

  if (thesisArtifact?.thesis) {
    items.push({
      id: thesisArtifact.id,
      label: "Stored thesis artifact",
      preview: previewText(thesisArtifact.thesis, 100),
    });
  }

  return items;
}

function createEmptyConnection() {
  return {
    selected: false,
    relation: "supports",
    note: "",
  };
}

function normalizeEvidenceConnectionsFromArtifact(artifact) {
  if (!artifact) return {};
  const payload = artifact?.payload || artifact;
  const map = payload?.evidenceMap;
  if (!map || typeof map !== "object") return {};

  const out = {};
  for (const [evidenceId, entry] of Object.entries(map)) {
    if (!entry || typeof entry !== "object") continue;
    out[evidenceId] = {
      selected: Boolean(entry.selected),
      relation: typeof entry.relation === "string" ? entry.relation : "supports",
      note: typeof entry.note === "string" ? entry.note : "",
    };
  }
  return out;
}

function computeProgressStory({
  currentStep,
  evidenceItems,
  evidenceClusters,
  filledPatternNotices,
  ideaStatement,
  connectedEvidence,
  evidenceStrength,
  strengthenedEvidence,
  workingClaim,
  thesisStatement,
  filledProofPlan,
}) {
  const completed = [];

  if (evidenceItems.length > 0) {
    completed.push("I collected quotes.");
  }
  if (evidenceClusters.length > 0) {
    completed.push("I grouped related quotes.");
  }
  if (filledPatternNotices.length > 0) {
    completed.push("I noticed a pattern.");
  }
  if (safeText(ideaStatement)) {
    completed.push("I wrote an idea worth exploring.");
  }
  if (connectedEvidence.length >= 2) {
    completed.push("I connected quotes to my idea.");
  }
  if (evidenceStrength) {
    completed.push("I checked how strong my support feels.");
  }
  if (strengthenedEvidence.length > 0) {
    completed.push("I found quotes to fill a gap.");
  }
  if (safeText(workingClaim)) {
    completed.push("I wrote a working claim.");
  }
  if (safeText(thesisStatement)) {
    completed.push("I turned my claim into a thesis.");
  }
  if (filledProofPlan.length > 0) {
    completed.push("I started my essay plan.");
  }

  const nextByStep = {
    [STEP_IDS.REVIEW]:
      evidenceClusters.length === 0
        ? "Choose related quotations and save them as a group."
        : "Choose which saved group you want to explore.",
    [STEP_IDS.PATTERNS]: "What repeats or contrasts across your quotes?",
    [STEP_IDS.IDEA]: "What might this pattern mean?",
    [STEP_IDS.CONNECT]: "How does each quote help your idea?",
    [STEP_IDS.EVALUATE]: "How strong does your support feel right now?",
    [STEP_IDS.GATHER]: "What quote would fill the gap you noticed?",
    [STEP_IDS.CLAIM]: "What point can your quotes help you prove?",
    [STEP_IDS.THESIS]: "How would you say your main point in one sentence?",
  };

  return {
    completed,
    next: nextByStep[currentStep] || "",
  };
}

function mergeSupportEvidence(workingEvidence, evidenceConnections, strengtheningNotes) {
  const supportMap = new Map();

  for (const evidence of workingEvidence) {
    const connection = evidenceConnections[evidence.id];
    const strengtheningNote = safeText(strengtheningNotes[evidence.id]);
    const hasConnection = isValidExplainedConnection(connection);

    if (hasConnection || strengtheningNote) {
      supportMap.set(evidence.id, evidence);
    }
  }

  return Array.from(supportMap.values());
}

export default function ModuleThreeV2Form({
  initialCanvasArtifacts = {
    evidenceArtifacts: [],
    evidenceClusterArtifacts: [],
    patternArtifacts: [],
    ideaArtifact: null,
    claimArtifact: null,
    sourceContextArtifacts: [],
    thesisArtifact: null,
    outlineArtifact: null,
    draftArtifact: null,
  },
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email ?? null;

  // One-time hydration: computed once when Module 3 opens, from durable
  // artifacts only. After this, Next/Back and developer controls own the
  // current step; nothing recalculates or snaps the student elsewhere.
  const initialHydrationRef = useRef(null);
  if (initialHydrationRef.current === null) {
    initialHydrationRef.current = getInitialModuleThreePhase({
      clusterArtifacts: initialCanvasArtifacts?.evidenceClusterArtifacts ?? [],
      patternArtifacts: initialCanvasArtifacts?.patternArtifacts ?? [],
      ideaArtifact: initialCanvasArtifacts?.ideaArtifact ?? null,
      claimArtifact: initialCanvasArtifacts?.claimArtifact ?? null,
      thesisArtifact: initialCanvasArtifacts?.thesisArtifact ?? null,
    });
  }
  const initialHydration = initialHydrationRef.current;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [persistError, setPersistError] = useState("");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(initialHydration.phase);

  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState("source");
  const [searchText, setSearchText] = useState("");

  const [workingEvidenceIds, setWorkingEvidenceIds] = useState([]);
  const [evidenceMarkers, setEvidenceMarkers] = useState({});
  const [evidenceClusters, setEvidenceClusters] = useState(() => {
    const persisted = initialCanvasArtifacts?.evidenceClusterArtifacts ?? [];
    if (!Array.isArray(persisted) || persisted.length === 0) return [];

    return persisted
      .map((artifact) => {
        const payload = artifact?.payload || artifact;
        const identity = artifact?.identity || null;
        const id = identity?.sourceId || payload?.id || "";
        const name = payload?.clusterName || payload?.name || "";
        const evidenceIds = payload?.evidenceIds || [];
        if (!id || !name) return null;
        return makeEvidenceCluster(id, name, evidenceIds, payload?.reflection ?? null);
      })
      .filter(Boolean);
  });
  const [selectedClusterId, setSelectedClusterId] = useState(
    initialHydration.clusterId || ""
  );
  const [clusterDraftName, setClusterDraftName] = useState("");
  const [clusterDraftEvidenceIds, setClusterDraftEvidenceIds] = useState([]);
  const [saveConfirmation, setSaveConfirmation] = useState("");
  const [duplicateGroupMessage, setDuplicateGroupMessage] = useState("");
  const [pendingGroupSwitch, setPendingGroupSwitch] = useState(null);
  const saveConfirmationTimerRef = useRef(null);

  const [patternNotices, setPatternNotices] = useState(() => {
    const persisted = initialCanvasArtifacts?.patternArtifacts ?? [];
    if (!Array.isArray(persisted) || persisted.length === 0) {
      return [makePatternNotice("pattern-1"), makePatternNotice("pattern-2")];
    }

    const mapped = persisted
      .map((artifact) => {
        const payload = artifact?.payload || artifact;
        const id = payload?.id || "";
        if (!id) return null;
        return {
          id,
          text: typeof payload?.text === "string" ? payload.text : "",
          evidenceIds: Array.isArray(payload?.evidenceIds) ? payload.evidenceIds : [],
          // Additive CP-D fields must survive hydrate for review + restore.
          ...readAdditiveMatrixFields(payload),
        };
      })
      .filter(Boolean);

    return mapped.length > 0
      ? mapped
      : [makePatternNotice("pattern-1"), makePatternNotice("pattern-2")];
  });
  const [selectedPatternId, setSelectedPatternId] = useState(
    // Resolved by the phase model: most reliable durable reference first
    // (thesis, claim, idea, then persisted isSelected), validated so an
    // orphan ID is never selected.
    initialHydration.patternId || ""
  );

  const [ideaStatement, setIdeaStatement] = useState(() => {
    const artifact = initialCanvasArtifacts?.ideaArtifact;
    if (!artifact) return "";
    const payload = artifact?.payload || artifact;
    return typeof payload?.statement === "string" ? payload.statement : "";
  });
  const [ideaWhyMatters, setIdeaWhyMatters] = useState(() => {
    const artifact = initialCanvasArtifacts?.ideaArtifact;
    if (!artifact) return "";
    const payload = artifact?.payload || artifact;
    return typeof payload?.whyMatters === "string" ? payload.whyMatters : "";
  });
  const ideaPersistTimerRef = useRef(null);

  const [evidenceConnections, setEvidenceConnections] = useState(() =>
    normalizeEvidenceConnectionsFromArtifact(initialCanvasArtifacts?.ideaArtifact)
  );
  const [evidenceStrength, setEvidenceStrength] = useState("");
  const [gapNote, setGapNote] = useState("");
  const [pathDecision, setPathDecision] = useState("");
  const [strengtheningNotes, setStrengtheningNotes] = useState({});
  const [matrixHandoff, setMatrixHandoff] = useState(null);
  const [matrixPresentation, setMatrixPresentation] = useState(null);
  const [matrixHandoffLoading, setMatrixHandoffLoading] = useState(true);
  const [matrixAdoptBusy, setMatrixAdoptBusy] = useState(false);
  const [matrixAdoptError, setMatrixAdoptError] = useState("");
  const [matrixDirectionAdopted, setMatrixDirectionAdopted] = useState(false);
  const [matrixBundleRaw, setMatrixBundleRaw] = useState(null);
  // Evidence rows from the Module 2 artifact-bundle (usable before shelf hydrate).
  const [matrixEvidenceRecords, setMatrixEvidenceRecords] = useState([]);
  const [activeAdoptedDirection, setActiveAdoptedDirection] = useState(null);
  const [artifactReviewFlags, setArtifactReviewFlags] = useState({
    pattern: false,
    idea: false,
    claim: false,
    thesis: false,
  });
  const [reviewConfirmBusy, setReviewConfirmBusy] = useState(false);
  const [reviewConfirmError, setReviewConfirmError] = useState("");
  const [ideaMatrixMeta, setIdeaMatrixMeta] = useState(() => {
    const artifact = initialCanvasArtifacts?.ideaArtifact;
    const payload = artifact?.payload || artifact || {};
    return {
      matrixProvenance: payload.matrixProvenance || null,
      matrixReview: payload.matrixReview || null,
    };
  });
  const [claimMatrixMeta, setClaimMatrixMeta] = useState(() => {
    const artifact = initialCanvasArtifacts?.claimArtifact;
    const payload = artifact?.payload || artifact || {};
    return {
      matrixProvenance: payload.matrixProvenance || null,
      matrixReview: payload.matrixReview || null,
    };
  });
  const [thesisMatrixMeta, setThesisMatrixMeta] = useState(() => {
    const artifact = initialCanvasArtifacts?.thesisArtifact;
    const payload = artifact?.payload || artifact || {};
    return {
      matrixProvenance: payload.matrixProvenance || null,
      matrixReview: payload.matrixReview || null,
    };
  });
  const patternWriteControllerRef = useRef(createSerializedWriteController());
  const ideaWriteControllerRef = useRef(createSerializedWriteController());
  const claimWriteControllerRef = useRef(createSerializedWriteController());
  const thesisWriteControllerRef = useRef(createSerializedWriteController());
  const [claimInternalStage, setClaimInternalStage] = useState(() =>
    resolveClaimInternalStage({
      workingClaim: (() => {
        const artifact = initialCanvasArtifacts?.claimArtifact;
        if (!artifact) return "";
        const payload = artifact?.payload || artifact;
        return typeof payload?.workingClaim === "string" ? payload.workingClaim : "";
      })(),
    })
  );
  const [thesisInternalStage, setThesisInternalStage] = useState(() =>
    resolveThesisInternalStage({
      thesisStatement: (() => {
        const artifact = initialCanvasArtifacts?.thesisArtifact;
        if (!artifact) return "";
        const payload = artifact?.payload || artifact;
        return typeof payload?.thesis === "string" ? payload.thesis : "";
      })(),
      proofPlan: (() => {
        const artifact = initialCanvasArtifacts?.thesisArtifact;
        if (!artifact) return ["", "", ""];
        const payload = artifact?.payload || artifact;
        const persisted = Array.isArray(payload?.proofPlan) ? payload.proofPlan : [];
        return persisted;
      })(),
    })
  );

  const [workingClaim, setWorkingClaim] = useState(() => {
    const artifact = initialCanvasArtifacts?.claimArtifact;
    if (!artifact) return "";
    const payload = artifact?.payload || artifact;
    return typeof payload?.workingClaim === "string" ? payload.workingClaim : "";
  });
  const [supportRationale, setSupportRationale] = useState(() => {
    const artifact = initialCanvasArtifacts?.claimArtifact;
    if (!artifact) return "";
    const payload = artifact?.payload || artifact;
    return typeof payload?.supportRationale === "string" ? payload.supportRationale : "";
  });
  const claimPersistTimerRef = useRef(null);

  const [thesisStatement, setThesisStatement] = useState(() => {
    const artifact = initialCanvasArtifacts?.thesisArtifact;
    if (!artifact) return "";
    const payload = artifact?.payload || artifact;
    return typeof payload?.thesis === "string" ? payload.thesis : "";
  });
  const [proofPlan, setProofPlan] = useState(() => {
    const artifact = initialCanvasArtifacts?.thesisArtifact;
    if (!artifact) return ["", "", ""];
    const payload = artifact?.payload || artifact;
    const persisted = Array.isArray(payload?.proofPlan) ? payload.proofPlan : [];
    const normalized = persisted.map((item) => (typeof item === "string" ? item : ""));
    while (normalized.length < 3) normalized.push("");
    return normalized.slice(0, 3);
  });
  const thesisPersistTimerRef = useRef(null);

  useEffect(() => {
    if (status !== "authenticated" || !userEmail) return;
    let cancelled = false;
    async function loadMatrixHandoff() {
      setMatrixHandoffLoading(true);
      try {
        const res = await fetch("/api/module2/artifact-bundle?evidence=1");
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setMatrixBundleRaw(null);
          setMatrixEvidenceRecords([]);
          setMatrixPresentation(
            buildModuleThreeMatrixHandoffPresentation({
              matrixBundle: null,
              evidenceRecords: [],
            })
          );
          setMatrixHandoff({ mode: "legacy_pattern_path" });
          return;
        }
        const bundle = json?.matrixBundle || null;
        setMatrixBundleRaw(bundle);
        const evidenceRecords = Array.isArray(json?.evidence)
          ? json.evidence
          : [];
        setMatrixEvidenceRecords(evidenceRecords);
        const presentation = buildModuleThreeMatrixHandoffPresentation({
          matrixBundle: bundle,
          evidenceRecords,
          existingModule3: {
            patterns: patternNotices,
            selectedPatternId,
            ideaStatement,
            workingClaim,
            thesisStatement,
            proofPlan,
          },
        });
        setMatrixPresentation(presentation);
        setMatrixHandoff({
          mode: presentation.mode,
          selectedPattern: presentation.selectedPattern,
          cta: presentation.cta,
          remaining: presentation.reviewReason,
        });

        const selectedNotice =
          patternNotices.find((p) => p.id === selectedPatternId) ||
          patternNotices.find((p) => p.matrixProvenance?.selectedPatternOptionId);

        const restored = restoreActiveDirectionFromSavedPattern({
          pattern: selectedNotice,
          evidenceRecords,
        });
        if (restored) {
          setActiveAdoptedDirection(restored);
          setMatrixDirectionAdopted(true);
        } else {
          const expectedId = presentation.selectedPattern?.optionId
            ? matrixPatternArtifactId(presentation.selectedPattern.optionId)
            : "";
          if (
            expectedId &&
            (selectedPatternId === expectedId ||
              patternNotices.some((p) => p.id === expectedId))
          ) {
            setMatrixDirectionAdopted(true);
            if (presentation.selectedPattern) {
              setActiveAdoptedDirection(
                buildActiveAdoptedDirection({
                  option: {
                    ...presentation.selectedPattern,
                    provenance: {
                      ratings: presentation.selectedPattern.ratings || {},
                      evidenceIds: presentation.selectedPattern.evidenceIds || [],
                      appeals: presentation.selectedPattern.appeals || [],
                    },
                  },
                  evidenceRecords,
                  audiencePurposeReasoning:
                    presentation.audiencePurposeReasoning || "",
                })
              );
            }
          }
        }

        const currentSig = resolveCurrentUpstreamSignature({
          matrixBundle: bundle,
          directionOptionId:
            restored?.optionId ||
            selectedNotice?.matrixProvenance?.selectedPatternOptionId ||
            presentation.selectedPattern?.optionId ||
            null,
          directionKind:
            restored?.kind ||
            selectedNotice?.matrixProvenance?.selectedPatternKind ||
            presentation.selectedPattern?.kind ||
            null,
          directionLabel:
            restored?.label ||
            selectedNotice?.matrixProvenance?.selectedPatternLabel ||
            selectedNotice?.text ||
            "",
          directionEvidenceIds:
            restored?.evidenceIds ||
            selectedNotice?.matrixProvenance?.evidenceIds ||
            selectedNotice?.evidenceIds ||
            [],
          audiencePurposeReasoning: presentation.audiencePurposeReasoning || "",
        }) || presentation.signature;

        if (currentSig) {
          const evalAll = evaluateAllDownstreamArtifactsForUpstreamChange({
            currentSignature: currentSig,
            pattern: selectedNotice,
            idea: {
              matrixProvenance: ideaMatrixMeta.matrixProvenance,
              matrixReview: ideaMatrixMeta.matrixReview,
            },
            claim: {
              matrixProvenance: claimMatrixMeta.matrixProvenance,
              matrixReview: claimMatrixMeta.matrixReview,
            },
            thesis: {
              matrixProvenance: thesisMatrixMeta.matrixProvenance,
              matrixReview: thesisMatrixMeta.matrixReview,
            },
          });
          const nextFlags = {
            pattern: Boolean(
              evalAll.artifacts.pattern.needsReview ||
                selectedNotice?.matrixReview?.needsReview
            ),
            idea: Boolean(
              evalAll.artifacts.idea.needsReview ||
                ideaMatrixMeta.matrixReview?.needsReview
            ),
            claim: Boolean(
              evalAll.artifacts.claim.needsReview ||
                claimMatrixMeta.matrixReview?.needsReview
            ),
            thesis: Boolean(
              evalAll.artifacts.thesis.needsReview ||
                thesisMatrixMeta.matrixReview?.needsReview
            ),
          };
          setArtifactReviewFlags(nextFlags);

          if (evalAll.artifacts.idea.needsReview) {
            setIdeaMatrixMeta((prev) => ({
              ...prev,
              matrixReview: createMatrixReviewState({
                needsReview: true,
                reasonCodes: ["upstream_matrix_signature_changed"],
                reviewedSignature: prev.matrixReview?.reviewedSignature || null,
                reviewedAt: prev.matrixReview?.reviewedAt || null,
              }),
            }));
          }
          if (evalAll.artifacts.claim.needsReview) {
            setClaimMatrixMeta((prev) => ({
              ...prev,
              matrixReview: createMatrixReviewState({
                needsReview: true,
                reasonCodes: ["upstream_matrix_signature_changed"],
                reviewedSignature: prev.matrixReview?.reviewedSignature || null,
                reviewedAt: prev.matrixReview?.reviewedAt || null,
              }),
            }));
          }
          if (evalAll.artifacts.thesis.needsReview) {
            setThesisMatrixMeta((prev) => ({
              ...prev,
              matrixReview: createMatrixReviewState({
                needsReview: true,
                reasonCodes: ["upstream_matrix_signature_changed"],
                reviewedSignature: prev.matrixReview?.reviewedSignature || null,
                reviewedAt: prev.matrixReview?.reviewedAt || null,
              }),
            }));
          }
          if (evalAll.artifacts.pattern.needsReview && selectedNotice) {
            setPatternNotices((prev) =>
              prev.map((p) =>
                p.id === selectedNotice.id
                  ? {
                      ...p,
                      matrixReview: createMatrixReviewState({
                        needsReview: true,
                        reasonCodes: ["upstream_matrix_signature_changed"],
                        reviewedSignature:
                          p.matrixReview?.reviewedSignature || null,
                        reviewedAt: p.matrixReview?.reviewedAt || null,
                      }),
                    }
                  : p
              )
            );
          }
        }
      } catch {
        if (!cancelled) {
          setMatrixBundleRaw(null);
          setMatrixEvidenceRecords([]);
          setMatrixPresentation(
            buildModuleThreeMatrixHandoffPresentation({
              matrixBundle: null,
              evidenceRecords: [],
            })
          );
          setMatrixHandoff({ mode: "legacy_pattern_path" });
        }
      } finally {
        if (!cancelled) setMatrixHandoffLoading(false);
      }
    }
    loadMatrixHandoff();
    return () => {
      cancelled = true;
    };
    // Intentionally hydrate once after auth — do not re-run on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userEmail]);

  useEffect(() => {
    if (status === "loading") {
      return;
    }

    if (!userEmail) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadEvidence() {
      setLoading(true);
      setLoadError("");

      try {
        const [guidedResponse, tchartResult] = await Promise.all([
          fetch("/api/module2/observations/guided"),
          getTChartEntries({ userEmail }),
        ]);

        let guidedRows = [];

        if (guidedResponse.ok) {
          const guidedJson = await guidedResponse.json();
          if (guidedJson?.ok && Array.isArray(guidedJson.data)) {
            guidedRows = guidedJson.data;
          } else if (!cancelled) {
            setLoadError(
              guidedJson?.error ||
                "Module 3 could not load guided observations."
            );
          }
        } else if (!cancelled) {
          setLoadError("Module 3 could not load guided observations.");
        }

        const tchartRows =
          !tchartResult?.error && Array.isArray(tchartResult?.data)
            ? tchartResult.data
            : [];

        const combinedEvidence = normalizeEvidenceForModule3(
          { guidedRows, tchartRows },
          { sourceTitleForType, sourceLabelForType }
        );

        if (!cancelled) {
          setEvidenceItems(combinedEvidence);
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error?.message || "Module 3 could not load evidence.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvidence();

    return () => {
      cancelled = true;
    };
  }, [status, userEmail]);

  const visibleSteps = useMemo(() => {
    if (pathDecision === "gather_more_evidence") {
      return STEP_DEFINITIONS;
    }

    return STEP_DEFINITIONS.filter((step) => step.id !== STEP_IDS.GATHER);
  }, [pathDecision]);

  useEffect(() => {
    const stillVisible = visibleSteps.some((step) => step.id === currentStep);
    if (!stillVisible) {
      setCurrentStep(STEP_IDS.CLAIM);
    }
  }, [currentStep, visibleSteps]);

  useEffect(() => {
    if (currentStep !== STEP_IDS.PATTERNS) {
      return;
    }

    setPatternNotices((previous) => {
      if (previous.length >= 2) {
        return previous;
      }

      const next = [...previous];
      while (next.length < 2) {
        next.push(makePatternNotice(`pattern-${next.length + 1}`));
      }
      return next;
    });
  }, [currentStep]);

  const currentStepIndex = visibleSteps.findIndex((step) => step.id === currentStep);
  const isLastStep =
    visibleSteps[visibleSteps.length - 1]?.id === currentStep;

  const filteredEvidence = useMemo(() => {
    const lowerSearch = searchText.trim().toLowerCase();

    const next = evidenceItems.filter((evidence) => {
      if (sourceFilter !== "all" && evidence.sourceType !== sourceFilter) {
        return false;
      }

      if (tagFilter !== "all" && !evidence.tags.includes(tagFilter)) {
        return false;
      }

      if (!lowerSearch) {
        return true;
      }

      const searchable = [
        evidence.sourceLabel,
        evidence.sourceTitle,
        evidence.quote,
        evidence.observation,
        evidence.audienceEffect,
        evidence.purposeConnection,
        evidence.essentialQuestionConnection,
        ...evidence.tags,
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(lowerSearch);
    });

    return [...next].sort((left, right) => {
      if (sortMode === "recent") {
        return right.updatedAt.localeCompare(left.updatedAt);
      }

      if (sortMode === "tag") {
        return (left.tags[0] || "").localeCompare(right.tags[0] || "");
      }

      return `${left.sourceLabel} ${left.sourceTitle}`.localeCompare(
        `${right.sourceLabel} ${right.sourceTitle}`
      );
    });
  }, [evidenceItems, searchText, sortMode, sourceFilter, tagFilter]);

  const evidenceGroups = useMemo(() => {
    const grouped = new Map();

    for (const evidence of filteredEvidence) {
      if (!grouped.has(evidence.sourceType)) {
        grouped.set(evidence.sourceType, []);
      }
      grouped.get(evidence.sourceType).push(evidence);
    }

    return Array.from(grouped.entries());
  }, [filteredEvidence]);

  const workingEvidence = useMemo(
    () => evidenceItems.filter((evidence) => workingEvidenceIds.includes(evidence.id)),
    [evidenceItems, workingEvidenceIds]
  );

  const selectedCluster = useMemo(
    () => evidenceClusters.find((cluster) => cluster.id === selectedClusterId) || null,
    [evidenceClusters, selectedClusterId]
  );

  const selectedClusterEvidence = useMemo(() => {
    if (!selectedCluster) {
      return [];
    }

    return evidenceItems.filter((evidence) =>
      selectedCluster.evidenceIds.includes(evidence.id)
    );
  }, [evidenceItems, selectedCluster]);

  const workingEvidenceMinimum = REVIEW_QUOTE_MINIMUM;

  const markerCounts = useMemo(() => {
    return workingEvidenceIds.reduce(
      (counts, evidenceId) => {
        const marker = evidenceMarkers[evidenceId];
        if (marker) {
          counts[marker] += 1;
        }
        return counts;
      },
      { important: 0, surprising: 0, repeated: 0 }
    );
  }, [evidenceMarkers, workingEvidenceIds]);

  const filledPatternNotices = useMemo(
    () => patternNotices.filter((notice) => safeText(notice.text)),
    [patternNotices]
  );

  const selectedPattern = useMemo(
    () => patternNotices.find((notice) => notice.id === selectedPatternId) || null,
    [patternNotices, selectedPatternId]
  );

  const selectedPatternEvidence = useMemo(() => {
    if (!selectedPattern) {
      return [];
    }

    return selectedClusterEvidence.filter((evidence) =>
      selectedPattern.evidenceIds.includes(evidence.id)
    );
  }, [selectedClusterEvidence, selectedPattern]);

  const connectedEvidence = useMemo(() => {
    return selectedClusterEvidence.filter((evidence) =>
      isValidExplainedConnection(evidenceConnections[evidence.id])
    );
  }, [evidenceConnections, selectedClusterEvidence]);

  const bothWorksEvidence = useMemo(
    () =>
      getBothWorksEvidenceStatus({
        selectedClusterEvidence,
        evidenceConnections,
      }),
    [evidenceConnections, selectedClusterEvidence]
  );

  const gatherFocus = useMemo(
    () =>
      getGatherFocusModel({
        gapNote,
        selectedClusterEvidence,
        evidenceConnections,
        ideaStatement,
      }),
    [evidenceConnections, gapNote, ideaStatement, selectedClusterEvidence]
  );

  useEffect(() => {
    if (currentStep !== STEP_IDS.GATHER) {
      return;
    }
    if (gatherFocus.defaultSourceFilter) {
      setSourceFilter(gatherFocus.defaultSourceFilter);
    }
  }, [currentStep, gatherFocus.defaultSourceFilter]);

  const connectWorking = useMemo(
    () =>
      getConnectWorkingEvidence({
        selectedPatternEvidence,
        selectedClusterEvidence,
      }),
    [selectedClusterEvidence, selectedPatternEvidence]
  );

  const strengthenedEvidence = useMemo(() => {
    return selectedClusterEvidence.filter((evidence) =>
      Boolean(safeText(strengtheningNotes[evidence.id]))
    );
  }, [strengtheningNotes, selectedClusterEvidence]);

  const supportEvidence = useMemo(
    () =>
      mergeSupportEvidence(
        selectedClusterEvidence,
        evidenceConnections,
        strengtheningNotes
      ),
    [evidenceConnections, selectedClusterEvidence, strengtheningNotes]
  );

  const filledProofPlan = useMemo(
    () => proofPlan.map((line) => safeText(line)).filter(Boolean),
    [proofPlan]
  );

  const canvasState = useMemo(() => {
    const persistedEvidence = initialCanvasArtifacts?.evidenceArtifacts ?? [];
    const persistedSourceContexts =
      initialCanvasArtifacts?.sourceContextArtifacts ?? [];
    const persistedThesis = initialCanvasArtifacts?.thesisArtifact ?? null;
    const persistedOutline = initialCanvasArtifacts?.outlineArtifact ?? null;
    const persistedDraft = initialCanvasArtifacts?.draftArtifact ?? null;

    return {
      persisted: {
        sourceContexts: {
          count: persistedSourceContexts.length,
          items: persistedSourceContexts,
        },
      },
      artifacts: {
        evidence: {
          count: persistedEvidence.length,
          items: persistedEvidence.slice(0, 3).map((artifact) => ({
            id: artifact.id,
            label: evidenceArtifactLabel(artifact),
            preview: evidenceArtifactPreview(artifact),
          })),
        },
        evidenceClusters: {
          count: evidenceClusters.length,
          items: evidenceClusters.slice(0, 3).map((cluster) => ({
            id: cluster.id,
            label: cluster.name,
            preview: "Quotes that seem to belong together",
            isSelected: selectedClusterId === cluster.id,
          })),
        },
        patterns: {
          count: filledPatternNotices.length,
          items: filledPatternNotices.slice(0, 2).map((pattern) => ({
            id: pattern.id,
            label: previewText(pattern.text, 90),
            preview: "Built from the quotes in this group",
            isSelected: selectedPatternId === pattern.id,
          })),
        },
        ideas: {
          count: safeText(ideaStatement) ? 1 : 0,
          items: safeText(ideaStatement)
            ? [
                {
                  id: "local-idea",
                  label: previewText(ideaStatement, 95),
                  preview: safeText(ideaWhyMatters)
                    ? `Why it matters: ${previewText(ideaWhyMatters, 90)}`
                    : "",
                },
              ]
            : [],
        },
        claims: {
          count: safeText(workingClaim) ? 1 : 0,
          items: safeText(workingClaim)
            ? [
                {
                  id: "local-claim",
                  label: previewText(workingClaim, 95),
                  preview: safeText(supportRationale)
                    ? `Why it fits the quotes: ${previewText(supportRationale, 90)}`
                    : "",
                },
              ]
            : [],
        },
        thesis: {
          count: thesisArtifactItems(persistedThesis, thesisStatement).length,
          items: thesisArtifactItems(persistedThesis, thesisStatement),
        },
        proofPlan: {
          count: filledProofPlan.length,
          items: filledProofPlan.slice(0, 3).map((line, index) => ({
            id: `proof-plan-${index}`,
            label: previewText(line, 95),
          })),
        },
      },
      relatedArtifacts: {
        outlineStatus: persistedOutline
          ? persistedOutline.finalized
            ? "Available (finalized)"
            : "Available"
          : "Not available yet",
        draftStatus: persistedDraft
          ? persistedDraft.bestAvailableTextStatus === "ok"
            ? "Available"
            : `Available (${persistedDraft.bestAvailableTextStatus})`
          : "Not available yet",
      },
      focus: {
        markerCounts,
        selectedClusterLabel: selectedCluster?.name || "Not selected yet",
        selectedPatternLabel:
          previewText(selectedPattern?.text, 80) || "Not selected yet",
        evidenceStrength: evidenceStrength || "Not evaluated yet",
      },
      progressStory: computeProgressStory({
        currentStep,
        evidenceItems,
        evidenceClusters,
        filledPatternNotices,
        ideaStatement,
        connectedEvidence,
        evidenceStrength,
        strengthenedEvidence,
        workingClaim,
        thesisStatement,
        filledProofPlan,
      }),
    };
  }, [
    connectedEvidence,
    currentStep,
    evidenceClusters,
    evidenceItems,
    evidenceStrength,
    filledPatternNotices,
    filledProofPlan,
    ideaStatement,
    ideaWhyMatters,
    initialCanvasArtifacts,
    markerCounts,
    selectedCluster,
    selectedClusterId,
    selectedPattern,
    selectedPatternId,
    strengthenedEvidence,
    supportRationale,
    thesisStatement,
    workingClaim,
  ]);

  const canGoNext = useMemo(() => {
    switch (currentStep) {
      case STEP_IDS.REVIEW:
        return canContinueFromReview({
          evidenceCount: evidenceItems.length,
          selectedCluster,
        });
      case STEP_IDS.PATTERNS: {
        if (artifactReviewFlags.pattern) return false;
        // Do not apply legacy continue rules while the matrix handoff is unresolved.
        if (matrixHandoffLoading) return false;
        const matrixReady =
          matrixPresentation &&
          !matrixPresentation.useLegacyPatternPath &&
          matrixPresentation.mode !== "matrix_review_required";
        if (matrixReady && matrixDirectionAdopted) {
          return canContinueFromMatrixPattern({
            selectedPattern,
            quoteMinimum: 1,
          });
        }
        if (matrixReady && !matrixDirectionAdopted) {
          return false;
        }
        if (matrixPresentation?.mode === "matrix_review_required") {
          return false;
        }
        return canContinueFromPatterns({
          filledObservationCount: filledPatternNotices.length,
          selectedPattern,
          groupEvidenceIds: selectedCluster?.evidenceIds || [],
          quoteMinimum: 2,
        });
      }
      case STEP_IDS.IDEA:
        if (artifactReviewFlags.idea) return false;
        return canContinueFromExploreIdea({
          statement: ideaStatement,
          whyMatters: ideaWhyMatters,
          statementMinimum: IDEA_STATEMENT_MINIMUM,
          whyMinimum: IDEA_WHY_MINIMUM,
        });
      case STEP_IDS.CONNECT:
        return connectedEvidence.length >= CONNECT_MINIMUM;
      case STEP_IDS.EVALUATE:
        return canContinueFromEvaluate({
          evidenceStrength,
          gapNote,
          pathDecision,
          bothWorksReady: bothWorksEvidence.bothWorksReady,
        });
      case STEP_IDS.GATHER:
        if (gatherFocus.mode === "revise_explanation") {
          return false;
        }
        return strengthenedEvidence.length >= 1;
      case STEP_IDS.CLAIM:
        if (artifactReviewFlags.claim) return false;
        return canContinueFromClaim({
          workingClaim,
          existingSupportRationale: supportRationale,
          selectedClusterEvidence,
          evidenceConnections,
        });
      case STEP_IDS.THESIS:
        if (artifactReviewFlags.thesis) return false;
        return canContinueFromThesis({
          thesisStatement,
          proofPlan,
        });
      default:
        return false;
    }
  }, [
    artifactReviewFlags.claim,
    artifactReviewFlags.idea,
    artifactReviewFlags.pattern,
    artifactReviewFlags.thesis,
    bothWorksEvidence.bothWorksReady,
    connectedEvidence.length,
    currentStep,
    evidenceClusters.length,
    evidenceConnections,
    evidenceItems.length,
    evidenceStrength,
    filledPatternNotices.length,
    gapNote,
    gatherFocus.mode,
    ideaStatement,
    ideaWhyMatters,
    matrixDirectionAdopted,
    matrixHandoffLoading,
    matrixPresentation,
    pathDecision,
    proofPlan,
    selectedCluster,
    selectedClusterEvidence,
    selectedPattern,
    strengthenedEvidence.length,
    supportRationale,
    thesisStatement,
    workingClaim,
    workingEvidenceIds.length,
    workingEvidenceMinimum,
  ]);

  const continueHint = useMemo(() => {
    if (canGoNext) {
      if (currentStep === STEP_IDS.CLAIM) {
        return getClaimReadyMessage();
      }
      if (currentStep === STEP_IDS.THESIS) {
        return getThesisReadyMessage();
      }
      if (currentStep === STEP_IDS.REVIEW) {
        return getReviewReadyMessage(selectedCluster);
      }
      if (currentStep === STEP_IDS.IDEA) {
        return getExploreIdeaReadyMessage();
      }
      if (currentStep === STEP_IDS.CONNECT) {
        return getConnectReadyMessage();
      }
      if (currentStep === STEP_IDS.EVALUATE) {
        return getEvaluateReadyMessage({
          bothWorksReady: bothWorksEvidence.bothWorksReady,
        });
      }
      return "";
    }

    switch (currentStep) {
      case STEP_IDS.REVIEW:
        return getReviewContinueHint({
          evidenceCount: evidenceItems.length,
          savedGroupCount: evidenceClusters.length,
          selectedCluster,
          quoteMinimum: workingEvidenceMinimum,
        });
      case STEP_IDS.PATTERNS:
        return getPatternsContinueHint({
          filledObservationCount: filledPatternNotices.length,
          selectedPattern,
          groupEvidenceIds: selectedCluster?.evidenceIds || [],
          quoteMinimum: 2,
        });
      case STEP_IDS.IDEA:
        return getExploreIdeaContinueHint({
          statement: ideaStatement,
          whyMatters: ideaWhyMatters,
          statementMinimum: IDEA_STATEMENT_MINIMUM,
          whyMinimum: IDEA_WHY_MINIMUM,
        });
      case STEP_IDS.CONNECT: {
        const phase = getConnectEvidencePhase({
          workingEvidence: connectWorking.workingEvidence,
          evidenceConnections,
          minimum: CONNECT_MINIMUM,
        });
        const activeEvidence =
          phase.activeIndex >= 0
            ? connectWorking.workingEvidence[phase.activeIndex]
            : null;
        return getConnectContinueHint({
          workingEvidence: connectWorking.workingEvidence,
          evidenceConnections,
          activeEvidenceId: activeEvidence?.id || "",
          activeUiChoice: activeEvidence
            ? inferUiChoiceFromConnection(
                evidenceConnections[activeEvidence.id]
              )
            : "",
          minimum: CONNECT_MINIMUM,
        });
      }
      case STEP_IDS.EVALUATE:
        return getEvaluateFormContinueHint({
          evidenceStrength,
          gapNote,
          pathDecision,
          bothWorksReady: bothWorksEvidence.bothWorksReady,
          missingSource: bothWorksEvidence.missingSource,
        });
      case STEP_IDS.GATHER:
        if (gatherFocus.mode === "revise_explanation") {
          return "Use Back to return to Connect and revise your explanation.";
        }
        return "Choose a quote and write how it helps fill the gap you noticed.";
      case STEP_IDS.CLAIM:
        return getClaimContinueHint({
          workingClaim,
          existingSupportRationale: supportRationale,
          selectedClusterEvidence,
          evidenceConnections,
        });
      case STEP_IDS.THESIS:
        return getThesisContinueHint({
          thesisStatement,
          proofPlan,
        });
      default:
        return "";
    }
  }, [
    bothWorksEvidence.bothWorksReady,
    bothWorksEvidence.missingSource,
    canGoNext,
    connectWorking.workingEvidence,
    currentStep,
    evidenceClusters.length,
    evidenceConnections,
    evidenceItems.length,
    evidenceStrength,
    filledPatternNotices.length,
    gapNote,
    gatherFocus.mode,
    ideaStatement,
    ideaWhyMatters,
    pathDecision,
    proofPlan,
    selectedCluster,
    selectedClusterEvidence,
    selectedPattern,
    supportRationale,
    thesisStatement,
    workingClaim,
    workingEvidenceIds.length,
    workingEvidenceMinimum,
  ]);

  function goNext() {
    if (!canGoNext) {
      return;
    }

    const nextStep = visibleSteps[currentStepIndex + 1];
    if (nextStep) {
      setCurrentStep(nextStep.id);
    }
  }

  function goBack() {
    if (
      currentStep === STEP_IDS.CLAIM &&
      claimInternalStage === CLAIM_INTERNAL_STAGES.WRITE
    ) {
      setClaimInternalStage(CLAIM_INTERNAL_STAGES.REVIEW);
      return;
    }
    if (
      currentStep === STEP_IDS.THESIS &&
      thesisInternalStage === THESIS_INTERNAL_STAGES.PROOF
    ) {
      setThesisInternalStage(THESIS_INTERNAL_STAGES.WRITE);
      return;
    }
    const previousStep = visibleSteps[currentStepIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  }

  function toggleWorkingEvidence(evidenceId) {
    setDuplicateGroupMessage("");
    setWorkingEvidenceIds((previousIds) => {
      if (previousIds.includes(evidenceId)) {
        return previousIds.filter((id) => id !== evidenceId);
      }
      return [...previousIds, evidenceId];
    });

    if (currentStep === STEP_IDS.REVIEW) {
      setClusterDraftEvidenceIds((previousIds) => {
        if (previousIds.includes(evidenceId)) {
          return previousIds.filter((id) => id !== evidenceId);
        }
        return [...previousIds, evidenceId];
      });
    }
  }

  function updateEvidenceMarker(evidenceId, marker) {
    setEvidenceMarkers((previous) => ({
      ...previous,
      [evidenceId]: marker,
    }));
  }

  function toggleClusterDraftEvidence(evidenceId) {
    setClusterDraftEvidenceIds((previousIds) => {
      if (previousIds.includes(evidenceId)) {
        return previousIds.filter((id) => id !== evidenceId);
      }

      return [...previousIds, evidenceId];
    });
  }

  async function persistPattern(next) {
    if (!userEmail) return true;

    const result = await patternWriteControllerRef.current.enqueue(async () =>
      upsertPatternArtifact({
        id: next.id,
        userEmail,
        text: safeText(next.text),
        evidenceIds: Array.isArray(next.evidenceIds) ? next.evidenceIds : [],
        isSelected: selectedPatternId === next.id || Boolean(next.forceSelected),
        ...(next.matrixProvenance !== undefined
          ? { matrixProvenance: next.matrixProvenance }
          : {}),
        ...(next.matrixReview !== undefined
          ? { matrixReview: next.matrixReview }
          : {}),
      })
    );

    if (!result?.ok) {
      setPersistError(result?.error?.message || "Could not save your pattern.");
      return false;
    }

    setPersistError("");
    return true;
  }

  async function adoptMatrixDirection(optionLike, explicitEvidenceIds = null) {
    if (!optionLike) return false;
    setMatrixAdoptBusy(true);
    setMatrixAdoptError("");
    // Prefer shelf evidence when ready; otherwise use Module 2 bundle evidence.
    const evidenceRecords =
      Array.isArray(evidenceItems) && evidenceItems.length > 0
        ? evidenceItems
        : matrixEvidenceRecords;
    const option = {
      optionId: optionLike.optionId || optionLike.id,
      id: optionLike.optionId || optionLike.id,
      kind: optionLike.kind,
      label: optionLike.label,
      provenance: optionLike.provenance || {
        ratings: optionLike.ratings || {},
        evidenceIds:
          explicitEvidenceIds ||
          optionLike.evidenceIds ||
          [],
        appeals: optionLike.appeals || [],
      },
    };
    if (explicitEvidenceIds) {
      option.provenance = {
        ...option.provenance,
        evidenceIds: explicitEvidenceIds,
      };
    }

    if (!Array.isArray(evidenceRecords) || evidenceRecords.length === 0) {
      setMatrixAdoptError(
        "Your evidence is still loading. Wait a moment, then try again."
      );
      setMatrixAdoptBusy(false);
      return false;
    }

    if (
      option.kind === "student_created" &&
      !canCompleteCustomMatrixDirection({
        customLabel: option.label,
        evidenceIds: option.provenance.evidenceIds,
        evidenceRecords,
      })
    ) {
      setMatrixAdoptError(
        "Connect at least one qualifying quotation before saving this custom direction."
      );
      setMatrixAdoptBusy(false);
      return false;
    }

    const qualifyingIds = resolveQualifyingEvidenceIds(
      option.provenance.evidenceIds || [],
      evidenceRecords
    );
    if (qualifyingIds.length < 1) {
      setMatrixAdoptError(
        "Connect at least one qualifying quotation from your saved evidence before carrying this forward."
      );
      setMatrixAdoptBusy(false);
      return false;
    }

    const active = buildActiveAdoptedDirection({
      option,
      evidenceRecords,
      audiencePurposeReasoning:
        matrixPresentation?.audiencePurposeReasoning || "",
    });

    const { pattern, created } = materializeMatrixPatternArtifact({
      option: {
        ...option,
        provenance: {
          ...(option.provenance || {}),
          evidenceIds: active?.evidenceIds || qualifyingIds,
        },
      },
      evidenceRecords,
      audiencePurposeReasoning:
        matrixPresentation?.audiencePurposeReasoning || "",
      existingPatterns: patternNotices,
    });

    const nextNotices = created
      ? [...patternNotices.filter((p) => p.id !== pattern.id), pattern]
      : patternNotices.map((p) => (p.id === pattern.id ? { ...p, ...pattern } : p));

    setPatternNotices(nextNotices);
    setSelectedPatternId(pattern.id);
    setActiveAdoptedDirection(active);

    const saved = await persistPattern({ ...pattern, forceSelected: true });
    if (!saved) {
      setMatrixAdoptError("Could not save this direction. Stay here and try again.");
      setMatrixAdoptBusy(false);
      return false;
    }

    if (userEmail) {
      const selectResult = await selectPatternArtifact({
        userEmail,
        patternId: pattern.id,
      });
      if (!selectResult.ok) {
        setMatrixAdoptError(
          selectResult.error?.message || "Could not select this direction."
        );
        setMatrixAdoptBusy(false);
        return false;
      }
    }

    // Stamp provenance onto later artifacts without rewriting text.
    if (active?.matrixProvenance) {
      setIdeaMatrixMeta((prev) => ({
        matrixProvenance: active.matrixProvenance,
        matrixReview: prev.matrixReview?.needsReview
          ? prev.matrixReview
          : confirmMatrixReview({ currentSignature: active.signature }),
      }));
      setClaimMatrixMeta((prev) => ({
        matrixProvenance: active.matrixProvenance,
        matrixReview: prev.matrixReview?.needsReview
          ? prev.matrixReview
          : confirmMatrixReview({ currentSignature: active.signature }),
      }));
      setThesisMatrixMeta((prev) => ({
        matrixProvenance: active.matrixProvenance,
        matrixReview: prev.matrixReview?.needsReview
          ? prev.matrixReview
          : confirmMatrixReview({ currentSignature: active.signature }),
      }));
    }

    setMatrixDirectionAdopted(true);
    setMatrixAdoptBusy(false);
    return true;
  }

  async function handleMatrixCarryForward(selected) {
    return adoptMatrixDirection(selected);
  }

  async function handleMatrixChooseOption(option) {
    return adoptMatrixDirection(option);
  }

  async function handleMatrixCustomSubmit(label, evidenceIds = []) {
    const custom = buildCustomMatrixOption(label);
    return adoptMatrixDirection(custom, evidenceIds);
  }

  function handleMatrixRetainExisting() {
    setMatrixDirectionAdopted(true);
    setMatrixAdoptError("");
  }

  async function confirmArtifactReview(artifactKey) {
    setReviewConfirmBusy(true);
    setReviewConfirmError("");
    const signature =
      resolveCurrentUpstreamSignature({
        matrixBundle: matrixBundleRaw,
        directionOptionId: activeAdoptedDirection?.optionId || null,
        directionKind: activeAdoptedDirection?.kind || null,
        directionLabel: activeAdoptedDirection?.label || "",
        directionEvidenceIds: activeAdoptedDirection?.evidenceIds || [],
        audiencePurposeReasoning:
          activeAdoptedDirection?.audiencePurposeReasoning ||
          matrixPresentation?.audiencePurposeReasoning ||
          "",
      }) ||
      activeAdoptedDirection?.signature ||
      matrixPresentation?.signature ||
      null;
    if (!signature) {
      setReviewConfirmError("Could not confirm review without a matrix signature.");
      setReviewConfirmBusy(false);
      return false;
    }
    const nextReview = confirmMatrixReview({ currentSignature: signature });
    const provenance =
      activeAdoptedDirection?.matrixProvenance ||
      (artifactKey === "idea"
        ? ideaMatrixMeta.matrixProvenance
        : artifactKey === "claim"
          ? claimMatrixMeta.matrixProvenance
          : artifactKey === "thesis"
            ? thesisMatrixMeta.matrixProvenance
            : patternNotices.find((p) => p.id === selectedPatternId)
                ?.matrixProvenance) ||
      null;

    let ok = false;
    if (artifactKey === "pattern") {
      const notice = patternNotices.find((p) => p.id === selectedPatternId);
      if (!notice) {
        setReviewConfirmError("No selected pattern to confirm.");
        setReviewConfirmBusy(false);
        return false;
      }
      ok = await persistPattern({
        ...notice,
        matrixProvenance: provenance || notice.matrixProvenance,
        matrixReview: nextReview,
        forceSelected: true,
      });
      if (ok) {
        setPatternNotices((prev) =>
          prev.map((p) =>
            p.id === notice.id
              ? {
                  ...p,
                  matrixProvenance: provenance || notice.matrixProvenance,
                  matrixReview: nextReview,
                }
              : p
          )
        );
      }
    } else if (artifactKey === "idea") {
      const result = await ideaWriteControllerRef.current.enqueue(async () =>
        upsertIdeaArtifact({
          userEmail,
          statement: ideaStatement,
          whyMatters: ideaWhyMatters,
          clusterId: selectedClusterId || null,
          patternId: selectedPatternId || null,
          evidenceMap: evidenceConnections || {},
          matrixProvenance: provenance,
          matrixReview: nextReview,
        })
      );
      ok = Boolean(result?.ok);
      if (ok) {
        setIdeaMatrixMeta({
          matrixProvenance: provenance,
          matrixReview: nextReview,
        });
      }
    } else if (artifactKey === "claim") {
      const result = await claimWriteControllerRef.current.enqueue(async () =>
        upsertClaimArtifact({
          userEmail,
          workingClaim,
          supportRationale,
          clusterId: selectedClusterId || null,
          patternId: selectedPatternId || null,
          matrixProvenance: provenance,
          matrixReview: nextReview,
        })
      );
      ok = Boolean(result?.ok);
      if (ok) {
        setClaimMatrixMeta({
          matrixProvenance: provenance,
          matrixReview: nextReview,
        });
      }
    } else if (artifactKey === "thesis") {
      const result = await thesisWriteControllerRef.current.enqueue(async () =>
        upsertThesisArtifact({
          userEmail,
          thesis: thesisStatement,
          proofPlan,
          clusterId: selectedClusterId || null,
          patternId: selectedPatternId || null,
          matrixProvenance: provenance,
          matrixReview: nextReview,
        })
      );
      ok = Boolean(result?.ok);
      if (ok) {
        setThesisMatrixMeta({
          matrixProvenance: provenance,
          matrixReview: nextReview,
        });
      }
    }

    if (!ok) {
      setReviewConfirmError(
        "Could not save your confirmation. Stay here and try again."
      );
      setReviewConfirmBusy(false);
      return false;
    }

    setArtifactReviewFlags((prev) => ({ ...prev, [artifactKey]: false }));
    setReviewConfirmBusy(false);
    return true;
  }

  function updatePatternNotice(patternId, patch) {
    setPatternNotices((previous) =>
      previous.map((notice) => {
        if (notice.id !== patternId) return notice;
        const next = { ...notice, ...patch };
        persistPattern(next);
        return next;
      })
    );
  }

  function togglePatternEvidence(patternId, evidenceId) {
    setPatternNotices((previous) =>
      previous.map((notice) => {
        if (notice.id !== patternId) {
          return notice;
        }

        const nextEvidenceIds = notice.evidenceIds.includes(evidenceId)
          ? notice.evidenceIds.filter((id) => id !== evidenceId)
          : [...notice.evidenceIds, evidenceId];

        const next = { ...notice, evidenceIds: nextEvidenceIds };
        persistPattern(next);
        return next;
      })
    );
  }

  function addPatternNotice() {
    setPatternNotices((previous) => {
      const next = makePatternNotice(`pattern-${previous.length + 1}`);
      persistPattern(next);
      return [...previous, next];
    });
  }

  function schedulePersistIdea(
    statement,
    whyMatters,
    clusterId,
    patternId,
    evidenceMap
  ) {
    if (!userEmail) return;

    if (ideaPersistTimerRef.current) {
      clearTimeout(ideaPersistTimerRef.current);
    }

    const provenance =
      activeAdoptedDirection?.matrixProvenance || ideaMatrixMeta.matrixProvenance;
    const review = ideaMatrixMeta.matrixReview;

    ideaPersistTimerRef.current = setTimeout(() => {
      ideaWriteControllerRef.current.enqueue(async ({ isLatest }) => {
        if (!isLatest()) return { ok: true, superseded: true };
        const result = await upsertIdeaArtifact({
          userEmail,
          statement,
          whyMatters,
          clusterId: clusterId || null,
          patternId: patternId || null,
          evidenceMap: evidenceMap ?? {},
          ...(provenance ? { matrixProvenance: provenance } : {}),
          ...(review ? { matrixReview: review } : {}),
        });
        if (!isLatest()) return { ok: true, superseded: true };
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not save your idea.");
          return { ok: false };
        }
        setPersistError("");
        if (provenance) {
          setIdeaMatrixMeta((prev) => ({
            matrixProvenance: provenance,
            matrixReview: prev.matrixReview || review,
          }));
        }
        return { ok: true };
      });
    }, 500);
  }

  function schedulePersistClaim(workingClaimText, rationale, clusterId, patternId) {
    if (!userEmail) return;

    if (claimPersistTimerRef.current) {
      clearTimeout(claimPersistTimerRef.current);
    }

    const provenance =
      activeAdoptedDirection?.matrixProvenance || claimMatrixMeta.matrixProvenance;
    const review = claimMatrixMeta.matrixReview;

    claimPersistTimerRef.current = setTimeout(() => {
      claimWriteControllerRef.current.enqueue(async ({ isLatest }) => {
        if (!isLatest()) return { ok: true, superseded: true };
        const result = await upsertClaimArtifact({
          userEmail,
          workingClaim: workingClaimText,
          supportRationale: rationale,
          clusterId: clusterId || null,
          patternId: patternId || null,
          ...(provenance ? { matrixProvenance: provenance } : {}),
          ...(review ? { matrixReview: review } : {}),
        });
        if (!isLatest()) return { ok: true, superseded: true };
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not save your claim.");
          return { ok: false };
        }
        setPersistError("");
        if (provenance) {
          setClaimMatrixMeta((prev) => ({
            matrixProvenance: provenance,
            matrixReview: prev.matrixReview || review,
          }));
        }
        return { ok: true };
      });
    }, 500);
  }

  /**
   * Persist the working claim with a compatible supportRationale.
   * Preserves any existing nonempty rationale; otherwise derives one from
   * the student's own connection notes (compatibility only — not shown as
   * a new answer on this screen).
   */
  function persistWorkingClaim(nextClaim) {
    setWorkingClaim(nextClaim);

    const resolved = resolveSupportRationale({
      existingSupportRationale: supportRationale,
      selectedClusterEvidence,
      evidenceConnections,
    });

    if (
      resolved.source === "derived_from_connection_notes" &&
      resolved.supportRationale &&
      !safeText(supportRationale)
    ) {
      setSupportRationale(resolved.supportRationale);
    }

    schedulePersistClaim(
      nextClaim,
      resolved.supportRationale,
      selectedClusterId,
      selectedPatternId
    );
  }

  function schedulePersistThesis(thesis, proofPlanLines, clusterId, patternId) {
    if (!userEmail) return;

    if (thesisPersistTimerRef.current) {
      clearTimeout(thesisPersistTimerRef.current);
    }

    const provenance =
      activeAdoptedDirection?.matrixProvenance || thesisMatrixMeta.matrixProvenance;
    const review = thesisMatrixMeta.matrixReview;

    thesisPersistTimerRef.current = setTimeout(() => {
      thesisWriteControllerRef.current.enqueue(async ({ isLatest }) => {
        if (!isLatest()) return { ok: true, superseded: true };
        const result = await upsertThesisArtifact({
          userEmail,
          thesis,
          proofPlan: Array.isArray(proofPlanLines) ? proofPlanLines : [],
          clusterId: clusterId || null,
          patternId: patternId || null,
          ...(provenance ? { matrixProvenance: provenance } : {}),
          ...(review ? { matrixReview: review } : {}),
        });
        if (!isLatest()) return { ok: true, superseded: true };
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not save your thesis.");
          return { ok: false };
        }
        setPersistError("");
        if (provenance) {
          setThesisMatrixMeta((prev) => ({
            matrixProvenance: provenance,
            matrixReview: prev.matrixReview || review,
          }));
        }
        return { ok: true };
      });
    }, 500);
  }

  async function flushThesisSave() {
    if (thesisPersistTimerRef.current) {
      clearTimeout(thesisPersistTimerRef.current);
      thesisPersistTimerRef.current = null;
    }

    if (!userEmail) return true;

    const provenance =
      activeAdoptedDirection?.matrixProvenance || thesisMatrixMeta.matrixProvenance;
    const review = thesisMatrixMeta.matrixReview;

    const result = await thesisWriteControllerRef.current.enqueue(async ({ isLatest }) => {
      if (!isLatest()) return { ok: true, superseded: true };
      return upsertThesisArtifact({
        userEmail,
        thesis: thesisStatement,
        proofPlan: Array.isArray(proofPlan) ? proofPlan : [],
        clusterId: selectedClusterId || null,
        patternId: selectedPatternId || null,
        ...(provenance ? { matrixProvenance: provenance } : {}),
        ...(review ? { matrixReview: review } : {}),
      });
    });

    if (!result?.ok) {
      setPersistError(result?.error?.message || "Could not save your thesis.");
      return false;
    }

    setPersistError("");
    return true;
  }

  async function completeModule() {
    if (!canGoNext) return;
    if (artifactReviewFlags.thesis) return;
    if (!userEmail) return;

    const saved = await flushThesisSave();
    if (!saved) return;

    router.push("/modules/3/success");
  }

  function resetDownstreamThinking() {
    setPatternNotices([makePatternNotice("pattern-1"), makePatternNotice("pattern-2")]);
    setSelectedPatternId("");
    setIdeaStatement("");
    setIdeaWhyMatters("");
    if (userEmail) {
      deleteIdeaArtifact({ userEmail }).then((result) => {
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not clear your saved idea.");
        }
      });
      deleteClaimArtifact({ userEmail }).then((result) => {
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not clear your saved claim.");
        }
      });
      deleteThesisArtifact({ userEmail }).then((result) => {
        if (!result.ok) {
          setPersistError(result.error?.message || "Could not clear your saved thesis.");
        }
      });
    }
    setEvidenceConnections({});
    setEvidenceStrength("");
    setGapNote("");
    setPathDecision("");
    setStrengtheningNotes({});
    setWorkingClaim("");
    setSupportRationale("");
    setThesisStatement("");
    setProofPlan(["", "", ""]);
  }

  function commitSelectedCluster(clusterId, { resetDownstream = false } = {}) {
    if (resetDownstream) {
      resetDownstreamThinking();
    }
    setSelectedClusterId(clusterId);
    setPendingGroupSwitch(null);
  }

  function applySelectedCluster(clusterId) {
    const decision = resolveGroupSelectionAction({
      nextClusterId: clusterId,
      currentClusterId: selectedClusterId,
      hasDownstream: hasDownstreamThinking({
        selectedPatternId,
        patternNotices,
        ideaStatement,
        ideaWhyMatters,
        evidenceConnections,
        workingClaim,
        supportRationale,
        thesisStatement,
        proofPlan,
      }),
    });

    if (decision.action === "noop") {
      return;
    }

    if (decision.action === "confirm") {
      const currentCluster =
        evidenceClusters.find((cluster) => cluster.id === selectedClusterId) || null;
      const nextCluster =
        evidenceClusters.find((cluster) => cluster.id === clusterId) || null;
      setPendingGroupSwitch({
        nextClusterId: clusterId,
        currentGroupName: currentCluster?.name || "",
        newGroupName: nextCluster?.name || "",
      });
      return;
    }

    commitSelectedCluster(clusterId, {
      resetDownstream: decision.shouldResetDownstream,
    });
  }

  function cancelPendingGroupSwitch() {
    setPendingGroupSwitch(null);
  }

  function confirmPendingGroupSwitch() {
    if (!pendingGroupSwitch?.nextClusterId) {
      setPendingGroupSwitch(null);
      return;
    }
    commitSelectedCluster(pendingGroupSwitch.nextClusterId, {
      resetDownstream: true,
    });
  }

  async function persistEvidenceCluster(payload) {
    if (!userEmail) {
      return true;
    }

    const result = await upsertEvidenceClusterArtifact({
      ...payload,
      userEmail,
      assignmentId: ASSIGNMENT.identity.assignmentId,
    });

    if (!result.ok) {
      setPersistError(
        result.error?.message || "Could not save your evidence group."
      );
      return false;
    }

    setPersistError("");
    return true;
  }

  async function createEvidenceCluster() {
    const normalizedName = safeText(clusterDraftName);
    const evidenceIds = [...workingEvidenceIds];

    if (!normalizedName || evidenceIds.length < workingEvidenceMinimum) {
      return;
    }

    const duplicate = findDuplicateCluster(evidenceClusters, evidenceIds);
    if (duplicate) {
      setDuplicateGroupMessage(DUPLICATE_GROUP_MESSAGE);
      setSaveConfirmation("");
      return;
    }

    const previousSelectedId = selectedClusterId;
    const previousSelectedCluster =
      evidenceClusters.find((cluster) => cluster.id === previousSelectedId) || null;
    const nextCluster = makeEvidenceCluster(
      `cluster-${evidenceClusters.length + 1}`,
      normalizedName,
      evidenceIds,
      null
    );

    // Saving keeps a possible group. It must not choose it for exploration.
    setEvidenceClusters((previous) => [...previous, nextCluster]);

    const persisted = await persistEvidenceCluster({
      id: nextCluster.id,
      clusterName: normalizedName,
      reflection: null,
      evidenceIds,
    });

    if (!persisted) {
      setEvidenceClusters((previous) =>
        previous.filter((cluster) => cluster.id !== nextCluster.id)
      );
      return;
    }

    setClusterDraftName("");
    setClusterDraftEvidenceIds([]);
    setWorkingEvidenceIds([]);
    setDuplicateGroupMessage("");
    setSaveConfirmation(
      getSaveGroupConfirmationMessage({
        savedName: normalizedName,
        previousSelectedId,
        previousSelectedName: previousSelectedCluster?.name || "",
      })
    );

    if (saveConfirmationTimerRef.current) {
      clearTimeout(saveConfirmationTimerRef.current);
    }
    saveConfirmationTimerRef.current = setTimeout(() => {
      setSaveConfirmation("");
    }, 8000);
  }

  function toggleConnectionSelection(evidenceId) {
    setEvidenceConnections((previous) => {
      const current = previous[evidenceId] || createEmptyConnection();
      const next = {
        ...previous,
        [evidenceId]: {
          ...current,
          selected: !current.selected,
        },
      };
      schedulePersistIdea(
        ideaStatement,
        ideaWhyMatters,
        selectedClusterId,
        selectedPatternId,
        next
      );
      return next;
    });
  }

  function updateConnection(evidenceId, field, value) {
    setEvidenceConnections((previous) => {
      const next = {
        ...previous,
        [evidenceId]: {
          ...(previous[evidenceId] || createEmptyConnection()),
          [field]: value,
        },
      };
      schedulePersistIdea(
        ideaStatement,
        ideaWhyMatters,
        selectedClusterId,
        selectedPatternId,
        next
      );
      return next;
    });
  }

  function applyConnectionPatch(evidenceId, patch) {
    setEvidenceConnections((previous) => {
      const current = previous[evidenceId] || createEmptyConnection();
      const next = {
        ...previous,
        [evidenceId]: {
          selected: Boolean(patch?.selected),
          relation:
            typeof patch?.relation === "string"
              ? patch.relation
              : current.relation,
          note: typeof patch?.note === "string" ? patch.note : current.note,
        },
      };
      schedulePersistIdea(
        ideaStatement,
        ideaWhyMatters,
        selectedClusterId,
        selectedPatternId,
        next
      );
      return next;
    });
  }

  async function updateStrengtheningNote(evidenceId, value) {
    setStrengtheningNotes((previous) => ({
      ...previous,
      [evidenceId]: value,
    }));

    if (!safeText(value) || !selectedClusterId) {
      return;
    }

    setEvidenceClusters((previous) =>
      previous.map((cluster) => {
        if (cluster.id !== selectedClusterId) {
          return cluster;
        }

        if (cluster.evidenceIds.includes(evidenceId)) {
          return cluster;
        }

        return {
          ...cluster,
          evidenceIds: [...cluster.evidenceIds, evidenceId],
        };
      })
    );

    if (userEmail && selectedClusterId && selectedCluster) {
      const nextEvidenceIds = selectedCluster.evidenceIds.includes(evidenceId)
        ? selectedCluster.evidenceIds
        : [...selectedCluster.evidenceIds, evidenceId];
      await persistEvidenceCluster({
        id: selectedCluster.id,
        clusterName: selectedCluster.name,
        reflection: selectedCluster.reflection ?? null,
        evidenceIds: nextEvidenceIds,
      });
    }
  }

  function updateProofPlan(index, value) {
    setProofPlan((previous) => {
      const next = previous.map((item, itemIndex) =>
        itemIndex === index ? value : item
      );
      schedulePersistThesis(
        thesisStatement,
        next,
        selectedClusterId,
        selectedPatternId
      );
      return next;
    });
  }

  useEffect(() => {
    setClusterDraftEvidenceIds((previousIds) =>
      previousIds.filter((id) => workingEvidenceIds.includes(id))
    );
  }, [workingEvidenceIds]);

  if (loading) {
    return (
      <div className="rounded-xl bg-theme-light p-6 shadow-soft">
        <p className="text-sm text-theme-dark/80">Loading your quotes and notes...</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="rounded-xl bg-theme-light p-6 shadow-soft">
        <p className="text-sm text-theme-dark/80">
          Sign in to start thinking with your quotes.
        </p>
      </div>
    );
  }

  const thinkingCanvasPane = <ModuleThreeThinkingCanvas canvasState={canvasState} />;

  // Single shared artifact chain for every Module 3 screen. Step components
  // no longer render their own copy, so it appears exactly once per screen.
  const artifactChainStage = getArtifactChainStageForStep(currentStep);
  const earlierPassStageIds = getEarlierPassStageIds({
    currentStep,
    claimPreview: safeText(workingClaim),
    thesisPreview: safeText(thesisStatement),
    stepsBeforeClaim: [
      STEP_IDS.REVIEW,
      STEP_IDS.PATTERNS,
      STEP_IDS.IDEA,
      STEP_IDS.CONNECT,
      STEP_IDS.EVALUATE,
      STEP_IDS.GATHER,
    ],
  });
  const chainConnectionLabel =
    connectedEvidence.length > 0 || currentStep === STEP_IDS.CONNECT
      ? `${connectedEvidence.length} of ${CONNECT_MINIMUM} explained`
      : "";
  const chainReadinessLabel = getArtifactChainReadinessLabel({
    currentStep,
    bothWorksReady: bothWorksEvidence.bothWorksReady,
    evidenceStrength,
    pathDecision,
    gapNote,
    selectedClusterEvidence,
    evidenceConnections,
  });
  const artifactChain = (
    <ModuleThreeArtifactChain
      groupName={selectedCluster?.name || ""}
      patternText={selectedPattern?.text || ""}
      ideaStatement={safeText(ideaStatement)}
      connectionProgressLabel={chainConnectionLabel}
      readinessLabel={chainReadinessLabel}
      claimPreview={safeText(workingClaim)}
      thesisPreview={safeText(thesisStatement)}
      currentStage={artifactChainStage}
      earlierPassStageIds={earlierPassStageIds}
    />
  );

  let stepContent = null;

  if (currentStep === STEP_IDS.REVIEW) {
    const canSaveGroup =
      safeText(clusterDraftName).length > 0 &&
      workingEvidenceIds.length >= workingEvidenceMinimum;
    let saveDisabledReason = "";
    if (workingEvidenceIds.length < workingEvidenceMinimum) {
      saveDisabledReason = `Choose at least ${workingEvidenceMinimum} related quotations first.`;
    } else if (!safeText(clusterDraftName)) {
      saveDisabledReason = "Give the group a short name before saving.";
    }

    stepContent = (
      <ModuleThreeReviewEvidenceStep
        assignmentPrompt={ASSIGNMENT.task.prompt}
        evidenceItems={evidenceItems}
        evidenceGroups={evidenceGroups}
        workingEvidenceIds={workingEvidenceIds}
        workingEvidence={workingEvidence}
        clusterDraftName={clusterDraftName}
        onClusterDraftNameChange={(value) => {
          setDuplicateGroupMessage("");
          setClusterDraftName(value);
        }}
        evidenceClusters={evidenceClusters}
        selectedClusterId={selectedClusterId}
        onToggleEvidence={toggleWorkingEvidence}
        onSaveGroup={createEvidenceCluster}
        onSelectCluster={applySelectedCluster}
        pendingGroupSwitch={pendingGroupSwitch}
        onCancelGroupSwitch={cancelPendingGroupSwitch}
        onConfirmGroupSwitch={confirmPendingGroupSwitch}
        saveDisabledReason={saveDisabledReason}
        canSaveGroup={canSaveGroup}
        saveConfirmation={saveConfirmation}
        duplicateMessage={duplicateGroupMessage}
        quoteMinimum={workingEvidenceMinimum}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        searchText={searchText}
        setSearchText={setSearchText}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
      />
    );
  }

  if (currentStep === STEP_IDS.PATTERNS) {
    stepContent = (
      <ModuleThreeNoticePatternsStep
        selectedCluster={selectedCluster}
        selectedClusterEvidence={selectedClusterEvidence}
        patternNotices={patternNotices}
        selectedPatternId={selectedPatternId}
        assignmentPrompt={ASSIGNMENT.task.prompt}
        assignmentSources={ASSIGNMENT.sourceIntelligence.sources}
        onUpdateNotice={(patternId, patch) => updatePatternNotice(patternId, patch)}
        onToggleEvidence={togglePatternEvidence}
        onSelectPattern={(patternId) => {
          setSelectedPatternId(patternId);
          if (userEmail) {
            selectPatternArtifact({
              userEmail,
              patternId,
            }).then((result) => {
              if (!result.ok) {
                setPersistError(
                  result.error?.message || "Could not save your pattern choice."
                );
              } else {
                setPersistError("");
              }
            });
          }
        }}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        matrixPresentation={matrixPresentation}
        matrixHandoffLoading={matrixHandoffLoading}
        matrixAdoptBusy={matrixAdoptBusy}
        matrixAdoptError={matrixAdoptError}
        onMatrixCarryForward={handleMatrixCarryForward}
        onMatrixChooseOption={handleMatrixChooseOption}
        onMatrixRetainExisting={handleMatrixRetainExisting}
        onMatrixCustomSubmit={handleMatrixCustomSubmit}
        matrixDirectionAdopted={matrixDirectionAdopted}
        matrixEvidenceCandidates={
          (matrixPresentation?.readableEvidenceProvenance || []).length
            ? matrixPresentation.readableEvidenceProvenance
            : evidenceItems.map((item) => ({
                evidenceId: item.id,
                visibleLabel: `${item.sourceLabel || "Source"} · ${item.appeal || item.strategy || ""} — “${String(item.quote || item.quotation || "Saved evidence").slice(0, 60)}”`,
              }))
        }
        matrixReviewBanner={
          <ModuleThreeMatrixReviewBanner
            visible={artifactReviewFlags.pattern}
            busy={reviewConfirmBusy}
            error={reviewConfirmError}
            onConfirm={() => confirmArtifactReview("pattern")}
          />
        }
      />
    );
  }

  if (currentStep === STEP_IDS.IDEA) {
    const otherPatterns = patternNotices.filter(
      (notice) => notice.id !== selectedPatternId && safeText(notice.text)
    );

    stepContent = (
      <ModuleThreeExploreIdeaStep
        selectedCluster={selectedCluster}
        selectedPattern={selectedPattern}
        selectedPatternEvidence={selectedPatternEvidence}
        ideaStatement={ideaStatement}
        ideaWhyMatters={ideaWhyMatters}
        onIdeaStatementChange={(value) => {
          setIdeaStatement(value);
          schedulePersistIdea(
            value,
            ideaWhyMatters,
            selectedClusterId,
            selectedPatternId,
            evidenceConnections
          );
        }}
        onIdeaWhyMattersChange={(value) => {
          setIdeaWhyMatters(value);
          schedulePersistIdea(
            ideaStatement,
            value,
            selectedClusterId,
            selectedPatternId,
            evidenceConnections
          );
        }}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        otherPatterns={otherPatterns}
        assignmentPrompt={ASSIGNMENT.task.prompt}
        assignmentSources={ASSIGNMENT.sourceIntelligence.sources}
        matrixFraming={
          activeAdoptedDirection?.ideaFraming ||
          matrixPresentation?.ideaFraming ||
          null
        }
        matrixProvenance={
          activeAdoptedDirection
            ? {
                selectedLabel: activeAdoptedDirection.label,
                becauseYouExplanation:
                  activeAdoptedDirection.becauseYouExplanation,
                ratingLines: activeAdoptedDirection.readableRatingLines,
                evidenceLines: activeAdoptedDirection.readableEvidenceLines,
                audiencePurposeReasoning:
                  activeAdoptedDirection.audiencePurposeReasoning,
              }
            : matrixPresentation && !matrixPresentation.useLegacyPatternPath
              ? {
                  selectedLabel: matrixPresentation.selectedPattern?.label || "",
                  becauseYouExplanation: matrixPresentation.becauseYouExplanation,
                  ratingLines: matrixPresentation.readableRatingLines,
                  evidenceLines: matrixPresentation.readableEvidenceProvenance,
                  audiencePurposeReasoning:
                    matrixPresentation.audiencePurposeReasoning,
                }
              : null
        }
        matrixReviewBanner={
          <ModuleThreeMatrixReviewBanner
            visible={artifactReviewFlags.idea}
            busy={reviewConfirmBusy}
            error={reviewConfirmError}
            onConfirm={() => confirmArtifactReview("idea")}
          />
        }
      />
    );
  }

  if (currentStep === STEP_IDS.CONNECT) {
    stepContent = (
      <ModuleThreeConnectEvidenceStep
        selectedCluster={selectedCluster}
        selectedPattern={selectedPattern}
        selectedPatternEvidence={selectedPatternEvidence}
        selectedClusterEvidence={selectedClusterEvidence}
        ideaStatement={ideaStatement}
        evidenceConnections={evidenceConnections}
        onUpdateConnection={applyConnectionPatch}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        assignmentPrompt={ASSIGNMENT.task.prompt}
        assignmentSources={ASSIGNMENT.sourceIntelligence.sources}
      />
    );
  }

  if (currentStep === STEP_IDS.EVALUATE) {
    stepContent = (
      <ModuleThreeEvaluateStrengthStep
        selectedCluster={selectedCluster}
        selectedPattern={selectedPattern}
        ideaStatement={ideaStatement}
        selectedClusterEvidence={selectedClusterEvidence}
        evidenceConnections={evidenceConnections}
        evidenceStrength={evidenceStrength}
        gapNote={gapNote}
        pathDecision={pathDecision}
        onEvaluateStateChange={({
          evidenceStrength: nextStrength,
          gapNote: nextGap,
          pathDecision: nextPath,
        }) => {
          setEvidenceStrength(nextStrength || "");
          setGapNote(nextGap || "");
          setPathDecision(nextPath || "");
        }}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        assignmentPrompt={ASSIGNMENT.task.prompt}
        assignmentSources={ASSIGNMENT.sourceIntelligence.sources}
      />
    );
  }

  if (currentStep === STEP_IDS.GATHER) {
    const otherConnection = gatherFocus.existingOtherConnection;
    const otherConnectionData = otherConnection
      ? evidenceConnections[otherConnection.id]
      : null;
    const shelfEvidence = evidenceItems.filter((evidence) => {
      if (workingEvidenceIds.includes(evidence.id)) {
        return false;
      }
      if (
        gatherFocus.defaultSourceFilter &&
        gatherFocus.defaultSourceFilter !== "all" &&
        sourceFilter !== "all" &&
        evidence.sourceType !== sourceFilter
      ) {
        return false;
      }
      return true;
    });

    stepContent = (
      <ModuleThreeStepFrame
        question={gatherFocus.heading}
        whyMatters={[
          gatherFocus.coaching,
          "You are going back on purpose — not to collect random quotes, but to fill a specific gap.",
        ]}
        successLooksLike={
          gatherFocus.mode === "revise_explanation"
            ? [
                "You returned to Connect and pointed to specific words in your note.",
                "Your explanation no longer only retells the quotation.",
                "Your support feels clearer than before.",
              ]
            : [
                "You found a quotation that addresses your gap.",
                "You explained how the new quotation helps.",
                "Your support feels stronger than before.",
              ]
        }
        coachingMessage={gatherFocus.coaching}
        nextStepText={
          gatherFocus.mode === "revise_explanation"
            ? "Use Back to return to Connect Evidence and revise the thin explanation."
            : "When your support feels ready, you will ask what point your quotes help you prove."
        }
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <div className="rounded-xl border-2 border-theme-orange/35 bg-theme-orange/10 px-4 py-4 text-left">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-orange">
              Why you are here
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-primary">
              {gatherFocus.gapNote || gapNote || "Fill the gap you noticed."}
            </p>
            {gatherFocus.ideaStatement ? (
              <div className="mt-3 border-t border-theme-orange/20 pt-3">
                <p className="text-xs text-text-muted">Your developing idea</p>
                <p className="mt-1 text-sm font-medium text-text-primary">
                  {gatherFocus.ideaStatement}
                </p>
              </div>
            ) : null}
            {otherConnection ? (
              <div className="mt-3 border-t border-theme-orange/20 pt-3">
                <p className="text-xs text-text-muted">
                  Existing{" "}
                  {otherConnection.sourceLabel || otherConnection.sourceType}{" "}
                  connection
                </p>
                <p className="mt-1 text-sm italic text-text-primary">
                  &ldquo;{otherConnection.quote}&rdquo;
                </p>
                {otherConnectionData?.relation ? (
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-theme-blue">
                    {relationLabelForStored(otherConnectionData.relation)}
                  </p>
                ) : null}
                {otherConnectionData?.note ? (
                  <p className="mt-1 text-sm text-text-muted">
                    {otherConnectionData.note}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          {gatherFocus.mode === "revise_explanation" ? (
            <div
              role="status"
              className="rounded-xl border border-theme-blue/25 bg-theme-blue/[0.05] px-4 py-4 text-sm leading-relaxed text-text-primary"
            >
              <p className="font-semibold">Revise — do not hunt for a new quotation yet.</p>
              <p className="mt-2 text-text-muted">
                Use <span className="font-medium text-text-primary">Back</span> to
                return to Connect Evidence. Open the thin connection and point to a
                specific word or detail that helps your idea.
              </p>
            </div>
          ) : (
            <>
              <WorkingSetSection
                label="Quotes filling the gap"
                description="On your desk — explain how each one helps."
              >
                <div className="space-y-1 text-left">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                    My work on the desk
                  </p>
                  <p className="text-sm leading-relaxed text-text-muted">
                    Pick quotes that fix the exact weakness you noticed. Then explain
                    how each one helps.
                  </p>
                </div>

                {evidenceItems.filter((evidence) =>
                  workingEvidenceIds.includes(evidence.id)
                ).length === 0 ? (
                  <p className="text-sm text-text-muted">
                    Pick quotes from the shelf below. They will land here.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {evidenceItems
                      .filter((evidence) =>
                        workingEvidenceIds.includes(evidence.id)
                      )
                      .map((evidence) => (
                        <div
                          key={`gather-working-${evidence.id}`}
                          className="space-y-3"
                        >
                          <ModuleThreeEvidenceCard
                            evidence={evidence}
                            selected
                            onToggleSelected={toggleWorkingEvidence}
                            marker={evidenceMarkers[evidence.id] || ""}
                            showArtifactLabel={false}
                            compact
                          />

                          {selectedCluster ? (
                            <label className="flex items-center gap-2 text-sm text-text-primary">
                              <input
                                type="checkbox"
                                checked={selectedCluster.evidenceIds.includes(
                                  evidence.id
                                )}
                                onChange={() =>
                                  setEvidenceClusters((previous) =>
                                    previous.map((cluster) => {
                                      if (cluster.id !== selectedCluster.id) {
                                        return cluster;
                                      }

                                      const nextEvidenceIds =
                                        cluster.evidenceIds.includes(evidence.id)
                                          ? cluster.evidenceIds.filter(
                                              (id) => id !== evidence.id
                                            )
                                          : [...cluster.evidenceIds, evidence.id];

                                      return {
                                        ...cluster,
                                        evidenceIds: nextEvidenceIds,
                                      };
                                    })
                                  )
                                }
                              />
                              Include in my group
                            </label>
                          ) : null}

                          <label className="block text-left">
                            <span className="mb-2 block text-base font-medium text-text-primary">
                              How does this quote fill the gap?
                            </span>
                            <textarea
                              value={strengtheningNotes[evidence.id] || ""}
                              onChange={(event) =>
                                updateStrengtheningNote(
                                  evidence.id,
                                  event.target.value
                                )
                              }
                              placeholder="Explain how this quote strengthens your idea"
                              className={ANSWER_TEXTAREA_CLASS}
                            />
                          </label>
                        </div>
                      ))}
                  </div>
                )}
              </WorkingSetSection>

              {gatherFocus.showSourceShelf ? (
                <ReferenceSection
                  label="All your quotes"
                  description="On the shelf — your idea, your gap, and quotes to choose from."
                >
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                      Show
                    </p>
                    {[
                      {
                        id: gatherFocus.defaultSourceFilter,
                        label:
                          gatherFocus.missingSource === "letter"
                            ? "Letter first"
                            : gatherFocus.missingSource === "speech"
                              ? "Speech first"
                              : "Focused",
                      },
                      { id: "all", label: "All sources" },
                    ]
                      .filter(
                        (option, index, list) =>
                          option.id &&
                          list.findIndex((item) => item.id === option.id) === index
                      )
                      .map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => setSourceFilter(option.id)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                            sourceFilter === option.id
                              ? "border-theme-blue/40 bg-theme-blue/10 text-theme-blue"
                              : "border-border-soft bg-white text-text-muted"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                  </div>

                  <div className="space-y-3">
                    {shelfEvidence.map((evidence) => (
                      <ModuleThreeEvidenceCard
                        key={`gather-ref-${evidence.id}`}
                        evidence={evidence}
                        selected={false}
                        onToggleSelected={toggleWorkingEvidence}
                        marker={evidenceMarkers[evidence.id] || ""}
                        onMarkerChange={updateEvidenceMarker}
                        showArtifactLabel={false}
                      >
                        <p className="text-xs text-text-muted">
                          Add to your desk if it helps fill the gap.
                        </p>
                      </ModuleThreeEvidenceCard>
                    ))}
                  </div>
                </ReferenceSection>
              ) : null}
            </>
          )}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.CLAIM) {
    stepContent = (
      <ModuleThreeBuildArgumentStep
        mode="claim"
        assignmentPrompt={ASSIGNMENT.task.prompt}
        selectedCluster={selectedCluster}
        selectedPattern={selectedPattern}
        ideaStatement={ideaStatement}
        ideaWhyMatters={ideaWhyMatters}
        selectedClusterEvidence={selectedClusterEvidence}
        evidenceConnections={evidenceConnections}
        workingClaim={workingClaim}
        onWorkingClaimChange={persistWorkingClaim}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        claimInternalStage={claimInternalStage}
        onAdvanceClaimStage={(stage) => setClaimInternalStage(stage)}
        matrixClaimPrompt={
          activeAdoptedDirection?.claimPrompt ||
          matrixPresentation?.claimPrompt ||
          ""
        }
        matrixClaimStarters={
          activeAdoptedDirection?.claimStarters ||
          matrixPresentation?.claimStarters ||
          null
        }
        matrixProvenance={
          activeAdoptedDirection
            ? {
                selectedLabel: activeAdoptedDirection.label,
                becauseYouExplanation:
                  activeAdoptedDirection.becauseYouExplanation,
                ratingLines: activeAdoptedDirection.readableRatingLines,
                evidenceLines: activeAdoptedDirection.readableEvidenceLines,
                audiencePurposeReasoning:
                  activeAdoptedDirection.audiencePurposeReasoning,
              }
            : null
        }
        matrixReviewBanner={
          <ModuleThreeMatrixReviewBanner
            visible={artifactReviewFlags.claim}
            busy={reviewConfirmBusy}
            error={reviewConfirmError}
            onConfirm={() => confirmArtifactReview("claim")}
          />
        }
      />
    );
  }

  if (currentStep === STEP_IDS.THESIS) {
    stepContent = (
      <ModuleThreeBuildArgumentStep
        mode="thesis"
        assignmentPrompt={ASSIGNMENT.task.prompt}
        selectedCluster={selectedCluster}
        selectedPattern={selectedPattern}
        ideaStatement={ideaStatement}
        ideaWhyMatters={ideaWhyMatters}
        selectedClusterEvidence={selectedClusterEvidence}
        evidenceConnections={evidenceConnections}
        workingClaim={workingClaim}
        thesisStatement={thesisStatement}
        onThesisStatementChange={(value) => {
          setThesisStatement(value);
          schedulePersistThesis(
            value,
            proofPlan,
            selectedClusterId,
            selectedPatternId
          );
        }}
        proofPlan={proofPlan}
        onProofPlanChange={updateProofPlan}
        progressCompleted={canvasState.progressStory?.completed || []}
        progressNext={canvasState.progressStory?.next || ""}
        thesisInternalStage={thesisInternalStage}
        onAdvanceThesisStage={(stage) => setThesisInternalStage(stage)}
        matrixThesisPrompt={
          activeAdoptedDirection?.thesisPrompt ||
          matrixPresentation?.thesisPrompt ||
          ""
        }
        matrixProvenance={
          activeAdoptedDirection
            ? {
                selectedLabel: activeAdoptedDirection.label,
                becauseYouExplanation:
                  activeAdoptedDirection.becauseYouExplanation,
                ratingLines: activeAdoptedDirection.readableRatingLines,
                evidenceLines: activeAdoptedDirection.readableEvidenceLines,
                audiencePurposeReasoning:
                  activeAdoptedDirection.audiencePurposeReasoning,
              }
            : null
        }
        matrixReviewBanner={
          <ModuleThreeMatrixReviewBanner
            visible={artifactReviewFlags.thesis}
            busy={reviewConfirmBusy}
            error={reviewConfirmError}
            onConfirm={() => confirmArtifactReview("thesis")}
          />
        }
      />
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <ModuleThreeProgress
        steps={visibleSteps}
        currentStepId={currentStep}
        onStepChange={setCurrentStep}
      />

      {/* Matrix review CTA lives on the pattern step — not a global banner on every screen. */}

      {loadError ? (
        <InfoCallout tone="warning" title="We could not load all of your evidence">
          {loadError}
        </InfoCallout>
      ) : null}

      {persistError ? (
        <InfoCallout tone="warning" title="We could not save your evidence group">
          {persistError}
        </InfoCallout>
      ) : null}

      <ReopenSourceTextsControl />

      {artifactChain}

      {stepContent}

      <div className="flex flex-col gap-4 border-t border-border-soft/50 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {continueHint ? (
          <p
            role="status"
            aria-live="polite"
            className={`max-w-xl text-sm leading-relaxed ${
              currentStep === STEP_IDS.PATTERNS || currentStep === STEP_IDS.IDEA
                ? "rounded-lg border border-theme-orange/35 bg-theme-orange/10 px-3 py-2 text-text-primary"
                : "text-xs text-text-muted"
            }`}
          >
            {continueHint}
          </p>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
        {currentStepIndex > 0 ? (
          <Button type="button" onClick={goBack} variant="tertiary" size="sm">
            Back
          </Button>
        ) : null}

        {!isLastStep ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            variant="primary"
            size="lg"
            className="min-w-[9.5rem] font-semibold"
          >
            Keep going
          </Button>
        ) : (
          <Button
            type="button"
            onClick={completeModule}
            disabled={!canGoNext}
            variant="primary"
            size="lg"
            className="min-w-[9.5rem] font-semibold"
          >
            Finish your thesis and continue
          </Button>
        )}
        </div>
      </div>
    </div>
  );
}
