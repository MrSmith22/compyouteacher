"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import Button from "@/components/ui/Button";
import InfoCallout from "@/components/ui/InfoCallout";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { parseModule2Observation } from "@/lib/parseModule2Observation";
import { getTChartEntries } from "@/lib/supabase/helpers/tchartEntries";
import ModuleThreeEvidenceCard from "@/components/module3/ModuleThreeEvidenceCard";
import ModuleThreeProgress from "@/components/module3/ModuleThreeProgress";
import ModuleThreeStepFrame from "@/components/module3/ModuleThreeStepFrame";
import ModuleThreeThinkingCanvas from "@/components/module3/ModuleThreeThinkingCanvas";
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
    question: "Which quotes seem to belong together?",
  },
  {
    id: STEP_IDS.PATTERNS,
    question: "What do these quotes seem to have in common?",
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

const ANSWER_INPUT_CLASS =
  "w-full rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-3 text-base text-text-primary shadow-sm placeholder:text-text-muted/60 focus:border-theme-dark/35 focus:outline-none focus:ring-4 focus:ring-theme-dark/[0.06]";

const QUIET_TEXTAREA_CLASS =
  "min-h-[80px] w-full rounded-lg border border-border-soft/80 bg-white p-3 text-sm leading-relaxed text-text-primary focus:border-theme-blue/30 focus:outline-none focus:ring-2 focus:ring-theme-blue/10";

const PRIMARY_ACTION_BUTTON_CLASS = "w-full py-3.5 text-base font-semibold";

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

function normalizeGuidedEvidence(rows) {
  return (rows || []).map((row) => ({
    id: `guided:${row.id}`,
    sourceType: row.source_type || row.source_id || "speech",
    sourceLabel: sourceLabelForType(row.source_type || row.source_id || "speech"),
    sourceTitle:
      row.source_title || sourceTitleForType(row.source_type || row.source_id || "speech"),
    originLabel: "Guided observation",
    quote: safeText(row.quote),
    observation: safeText(row.student_observation),
    audienceEffect: safeText(row.audience_effect),
    purposeConnection: safeText(row.purpose_connection),
    essentialQuestionConnection: safeText(row.essential_question_connection),
    tags: [
      safeText(row.rhetorical_strategy),
      safeText(row.observation_stage),
      row.teacher_guided ? "teacher-guided" : "",
    ].filter(Boolean),
    updatedAt: row.updated_at || row.created_at || "",
  }));
}

function normalizeTchartEvidence(rows) {
  return (rows || []).map((row) => {
    const parsed = parseModule2Observation(row?.observation);
    const sourceType = row?.type || "speech";

    return {
      id: `tchart:${sourceType}:${row?.category || "note"}`,
      sourceType,
      sourceLabel: sourceLabelForType(sourceType),
      sourceTitle: sourceTitleForType(sourceType),
      originLabel: "Module 2 T-chart",
      quote: safeText(row?.quote),
      observation: safeText(parsed.main || row?.observation),
      audienceEffect: safeText(parsed.audience),
      purposeConnection: safeText(parsed.purpose),
      essentialQuestionConnection: "",
      tags: [safeText(row?.category), "t-chart"].filter(Boolean),
      updatedAt: row?.updated_at || row?.created_at || "",
    };
  });
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
        ? "Pick a few quotes and group the ones that belong together."
        : "Which group do you want to explore?",
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
    const hasConnection = connection?.selected && safeText(connection.note);

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
  const { data: session, status } = useSession();
  const userEmail = session?.user?.email ?? null;

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [persistError, setPersistError] = useState("");
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(STEP_IDS.REVIEW);

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
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [clusterDraftName, setClusterDraftName] = useState("");
  const [clusterDraftEvidenceIds, setClusterDraftEvidenceIds] = useState([]);
  const clusterReflectionRef = useRef(null);

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
        };
      })
      .filter(Boolean);

    return mapped.length > 0
      ? mapped
      : [makePatternNotice("pattern-1"), makePatternNotice("pattern-2")];
  });
  const [selectedPatternId, setSelectedPatternId] = useState(() => {
    const persisted = initialCanvasArtifacts?.patternArtifacts ?? [];
    if (!Array.isArray(persisted) || persisted.length === 0) return "";
    const selected = persisted.find((artifact) => {
      const payload = artifact?.payload || artifact;
      return Boolean(payload?.isSelected);
    });
    const selectedPayload = selected?.payload || selected || null;
    return selectedPayload?.id || "";
  });

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

        const combinedEvidence = [
          ...normalizeGuidedEvidence(guidedRows),
          ...normalizeTchartEvidence(tchartRows),
        ];

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

  const currentStepIndex = visibleSteps.findIndex((step) => step.id === currentStep);
  const isLastStep =
    visibleSteps[visibleSteps.length - 1]?.id === currentStep;

  const availableTags = useMemo(() => {
    const tags = new Set();
    for (const evidence of evidenceItems) {
      for (const tag of evidence.tags) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [evidenceItems]);

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

  const clusterDraftEvidence = useMemo(
    () =>
      workingEvidence.filter((evidence) => clusterDraftEvidenceIds.includes(evidence.id)),
    [clusterDraftEvidenceIds, workingEvidence]
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

  const workingEvidenceMinimum = useMemo(() => {
    if (evidenceItems.length < 2) {
      return 2;
    }
    return evidenceItems.length >= 3 ? 3 : 2;
  }, [evidenceItems.length]);

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
    return selectedClusterEvidence.filter((evidence) => {
      const connection = evidenceConnections[evidence.id];
      return connection?.selected && safeText(connection.note);
    });
  }, [evidenceConnections, selectedClusterEvidence]);

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
        return (
          evidenceItems.length >= 2 &&
          workingEvidenceIds.length >= workingEvidenceMinimum &&
          evidenceClusters.length >= 1 &&
          Boolean(selectedCluster) &&
          selectedCluster.evidenceIds.length >= 2
        );
      case STEP_IDS.PATTERNS:
        return (
          Boolean(selectedCluster) &&
          filledPatternNotices.length >= 2 &&
          Boolean(selectedPattern) &&
          selectedPattern.evidenceIds.length >= 2
        );
      case STEP_IDS.IDEA:
        return (
          safeText(ideaStatement).length >= 15 &&
          safeText(ideaWhyMatters).length >= 15
        );
      case STEP_IDS.CONNECT:
        return connectedEvidence.length >= 2;
      case STEP_IDS.EVALUATE:
        if (!evidenceStrength || !safeText(gapNote)) {
          return false;
        }
        if (evidenceStrength === "strong") {
          return true;
        }
        return Boolean(pathDecision);
      case STEP_IDS.GATHER:
        return strengthenedEvidence.length >= 1;
      case STEP_IDS.CLAIM:
        return (
          safeText(workingClaim).length >= 10 &&
          safeText(supportRationale).length >= 10
        );
      default:
        return false;
    }
  }, [
    connectedEvidence.length,
    currentStep,
    evidenceClusters.length,
    evidenceItems.length,
    evidenceStrength,
    filledPatternNotices.length,
    gapNote,
    ideaStatement,
    ideaWhyMatters,
    pathDecision,
    selectedCluster,
    selectedPattern,
    strengthenedEvidence.length,
    supportRationale,
    workingClaim,
    workingEvidenceIds.length,
    workingEvidenceMinimum,
  ]);

  const continueHint = useMemo(() => {
    if (canGoNext) {
      return "";
    }

    switch (currentStep) {
      case STEP_IDS.REVIEW:
        if (evidenceItems.length < 2) {
          return "You need at least two quotes from Module 2 before you can move on.";
        }
        if (workingEvidenceIds.length < workingEvidenceMinimum) {
          return `Choose at least ${workingEvidenceMinimum} quotes above.`;
        }
        if (evidenceClusters.length < 1) {
          return "Give your group a name below, then save it.";
        }
        if (!selectedCluster || selectedCluster.evidenceIds.length < 2) {
          return "Choose which group you want to explore.";
        }
        return "";
      case STEP_IDS.PATTERNS:
        return "Write two things you notice, choose one to explore, and link at least two quotes to it.";
      case STEP_IDS.IDEA:
        return "Write your idea and a sentence about why it feels worth exploring.";
      case STEP_IDS.CONNECT:
        return "Pick at least two quotes and explain how each one helps your idea.";
      case STEP_IDS.EVALUATE:
        return "Say how strong your support feels, name what is weakest, and choose what to do next.";
      case STEP_IDS.GATHER:
        return "Choose a quote and write how it helps fill the gap you noticed.";
      case STEP_IDS.CLAIM:
        return "Write your claim and a short note about why your quotes support it.";
      default:
        return "";
    }
  }, [
    canGoNext,
    currentStep,
    evidenceClusters.length,
    evidenceItems.length,
    selectedCluster,
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
    const previousStep = visibleSteps[currentStepIndex - 1];
    if (previousStep) {
      setCurrentStep(previousStep.id);
    }
  }

  function toggleWorkingEvidence(evidenceId) {
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

    const result = await upsertPatternArtifact({
      id: next.id,
      userEmail,
      text: safeText(next.text),
      evidenceIds: Array.isArray(next.evidenceIds) ? next.evidenceIds : [],
      isSelected: selectedPatternId === next.id,
    });

    if (!result.ok) {
      setPersistError(result.error?.message || "Could not save your pattern.");
      return false;
    }

    setPersistError("");
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

    ideaPersistTimerRef.current = setTimeout(async () => {
      const result = await upsertIdeaArtifact({
        userEmail,
        statement,
        whyMatters,
        clusterId: clusterId || null,
        patternId: patternId || null,
        evidenceMap: evidenceMap ?? {},
      });

      if (!result.ok) {
        setPersistError(result.error?.message || "Could not save your idea.");
        return;
      }

      setPersistError("");
    }, 500);
  }

  function schedulePersistClaim(workingClaimText, rationale, clusterId, patternId) {
    if (!userEmail) return;

    if (claimPersistTimerRef.current) {
      clearTimeout(claimPersistTimerRef.current);
    }

    claimPersistTimerRef.current = setTimeout(async () => {
      const result = await upsertClaimArtifact({
        userEmail,
        workingClaim: workingClaimText,
        supportRationale: rationale,
        clusterId: clusterId || null,
        patternId: patternId || null,
      });

      if (!result.ok) {
        setPersistError(result.error?.message || "Could not save your claim.");
        return;
      }

      setPersistError("");
    }, 500);
  }

  function schedulePersistThesis(thesis, proofPlanLines, clusterId, patternId) {
    if (!userEmail) return;

    if (thesisPersistTimerRef.current) {
      clearTimeout(thesisPersistTimerRef.current);
    }

    thesisPersistTimerRef.current = setTimeout(async () => {
      const result = await upsertThesisArtifact({
        userEmail,
        thesis,
        proofPlan: Array.isArray(proofPlanLines) ? proofPlanLines : [],
        clusterId: clusterId || null,
        patternId: patternId || null,
      });

      if (!result.ok) {
        setPersistError(result.error?.message || "Could not save your thesis.");
        return;
      }

      setPersistError("");
    }, 500);
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

  function applySelectedCluster(clusterId) {
    if (clusterId !== selectedClusterId && selectedClusterId) {
      resetDownstreamThinking();
    }
    setSelectedClusterId(clusterId);
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

    if (!normalizedName || clusterDraftEvidenceIds.length < 2) {
      return;
    }

    const reflection = safeText(clusterReflectionRef.current?.value || "") || null;
    const nextCluster = makeEvidenceCluster(
      `cluster-${evidenceClusters.length + 1}`,
      normalizedName,
      clusterDraftEvidenceIds,
      reflection
    );

    setEvidenceClusters((previous) => [...previous, nextCluster]);
    applySelectedCluster(nextCluster.id);
    await persistEvidenceCluster({
      id: nextCluster.id,
      clusterName: normalizedName,
      reflection,
      evidenceIds: clusterDraftEvidenceIds,
    });
    setClusterDraftName("");
    setClusterDraftEvidenceIds([...workingEvidenceIds]);
    if (clusterReflectionRef.current) {
      clusterReflectionRef.current.value = "";
    }
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

  let stepContent = null;

  if (currentStep === STEP_IDS.REVIEW) {
    const shouldChooseExistingCluster =
      evidenceClusters.length > 0 && !safeText(selectedClusterId);
    stepContent = (
      <ModuleThreeStepFrame
        question="Which quotes seem to belong together?"
        whyMatters={[
          "You’ve already collected evidence from the texts. You’re not starting over.",
          "Now we look across what you gathered and start noticing what connects.",
        ]}
        example="Several quotes talk about hope. That might be a group worth naming."
        successLooksLike={[
          "You have a few quotes you want to work with.",
          "You named a group that feels connected.",
          "You chose which group to explore first.",
        ]}
        coachingMessage="There is no single right answer. If the quotes feel connected to you, they are worth trying together. Use simple words."
        nextStepText="When your group feels ready, you will ask what those quotes have in common."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <div className="rounded-lg bg-surface-soft/40 px-4 py-3 text-left">
            <p className="text-sm leading-relaxed text-text-muted">
              Everything you collected in Module 2 is still here. Think of the notebook on the
              left as what you’ve been carrying with you — your sources, your quotes, and your
              notes. Now we start making sense of it.
            </p>
          </div>

          <details className="rounded-lg bg-surface-soft/50">
            <summary className="cursor-pointer list-none px-4 py-2 text-xs text-text-muted">
              Your assignment question (reference)
            </summary>
            <p className="border-t border-border-soft/60 px-4 py-3 text-sm leading-relaxed text-text-muted">
              {ASSIGNMENT.task.prompt}
            </p>
          </details>

          <WorkingSetSection
            label="Selected quotes"
            description="These are the passages you are grouping and naming right now."
          >
            <div id="selected-quotes-basket" className="space-y-5">
              <div className="space-y-1 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  My work on the desk
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  {shouldChooseExistingCluster
                    ? "You already have at least one saved group. Choose one below to explore."
                    : "Pick a few quotes that feel connected. Then give that group a short name in your own words."}
                </p>
              </div>

              {workingEvidence.length === 0 ? (
                <p className="text-center text-sm text-text-muted">
                  {shouldChooseExistingCluster
                    ? "Choose a saved group below (or add new quotes from the shelf to make another group)."
                    : "Choose quotes from the reference shelf below. They will land here."}
                </p>
              ) : (
                <>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {workingEvidence.map((evidence) => (
                      <div
                        key={`selected-${evidence.id}`}
                        className="flex items-start justify-between gap-2 rounded-lg bg-surface-soft/50 px-3 py-3"
                      >
                        <div className="min-w-0 text-left">
                          <p className="text-sm text-text-primary">{evidence.sourceLabel}</p>
                          <p className="mt-1 text-xs text-text-muted">
                            {evidenceSummaryLine(evidence)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleWorkingEvidence(evidence.id)}
                          className="shrink-0 text-xs text-text-muted hover:text-text-primary"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4 border-t border-border-soft/60 pt-4">
                    <label className="block text-left">
                      <span className="mb-2 block text-base font-medium text-text-primary">
                        What should we call this group?
                      </span>
                      <input
                        value={clusterDraftName}
                        onChange={(event) => setClusterDraftName(event.target.value)}
                        placeholder="A short name for what connects these quotes"
                        className={ANSWER_INPUT_CLASS}
                      />
                    </label>

                    <label className="block text-left">
                      <span className="mb-2 block text-sm text-text-muted">
                        What connects them? (optional)
                      </span>
                      <textarea
                        ref={clusterReflectionRef}
                        placeholder="A quick note in your own words"
                        className={QUIET_TEXTAREA_CLASS}
                      />
                    </label>

                    <Button
                      type="button"
                      onClick={createEvidenceCluster}
                      disabled={
                        safeText(clusterDraftName).length === 0 ||
                        clusterDraftEvidenceIds.length < 2
                      }
                      variant="primary"
                      tone="success"
                      size="lg"
                      className={PRIMARY_ACTION_BUTTON_CLASS}
                    >
                      Save this group
                    </Button>
                    {clusterDraftEvidenceIds.length < 2 ? (
                      <p className="text-xs text-text-muted">
                        Pick at least two quotes from the shelf below.
                      </p>
                    ) : null}
                  </div>
                </>
              )}

              {evidenceClusters.length > 0 ? (
                <div className="space-y-3 border-t border-border-soft/60 pt-4">
                  <p className="text-sm text-text-muted">
                    Which group should we explore first?
                  </p>
                  {evidenceClusters.map((cluster) => (
                    <div
                      key={cluster.id}
                      className={`rounded-lg p-4 ${
                        selectedClusterId === cluster.id
                          ? "bg-theme-blue/8 ring-1 ring-theme-blue/20"
                          : "bg-surface-soft/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="text-left">
                          <p className="text-base font-medium text-text-primary">
                            {cluster.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {cluster.evidenceIds.length} quote
                            {cluster.evidenceIds.length === 1 ? "" : "s"}
                          </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-text-primary">
                          <input
                            type="radio"
                            name="selected-cluster"
                            checked={selectedClusterId === cluster.id}
                            onChange={() => applySelectedCluster(cluster.id)}
                          />
                          Start with this one
                        </label>
                      </div>

                      <div className="mt-3 grid gap-2 md:grid-cols-2">
                        {cluster.evidenceIds.map((clusterEvidenceId) => {
                          const evidence = evidenceItems.find(
                            (item) => item.id === clusterEvidenceId
                          );

                          if (!evidence) {
                            return null;
                          }

                          return (
                            <ModuleThreeEvidenceCard
                              key={`${cluster.id}-${evidence.id}`}
                              evidence={evidence}
                              marker={evidenceMarkers[evidence.id] || ""}
                              compact
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </WorkingSetSection>

          <ReferenceSection
            label="All your quotes"
            description="On the shelf — add any that belong on your desk."
          >
            <div className="space-y-4">
              <details className="rounded-lg bg-surface-soft/60">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs text-text-muted">
                  Filter or search
                </summary>
                <div className="grid gap-3 border-t border-border-soft/60 px-3 py-3 md:grid-cols-3">
                  <label className="text-left">
                    <span className="mb-1 block text-xs font-medium text-text-muted">
                      Source
                    </span>
                    <select
                      value={sourceFilter}
                      onChange={(event) => setSourceFilter(event.target.value)}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="all">All sources</option>
                      <option value="speech">Speech</option>
                      <option value="letter">Letter</option>
                    </select>
                  </label>
                  <label className="text-left">
                    <span className="mb-1 block text-xs font-medium text-text-muted">
                      Tag
                    </span>
                    <select
                      value={tagFilter}
                      onChange={(event) => setTagFilter(event.target.value)}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="all">All tags</option>
                      {availableTags.map((tag) => (
                        <option key={tag} value={tag}>
                          {tag}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-left">
                    <span className="mb-1 block text-xs font-medium text-text-muted">
                      Sort
                    </span>
                    <select
                      value={sortMode}
                      onChange={(event) => setSortMode(event.target.value)}
                      className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                    >
                      <option value="source">By source</option>
                      <option value="tag">By tag</option>
                      <option value="recent">Most recent</option>
                    </select>
                  </label>
                </div>
                <div className="border-t border-border-soft/60 px-3 py-3">
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search quotes or notes"
                    className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </details>

              {evidenceItems.length === 0 ? (
                <p className="text-sm text-text-muted">
                  Your quotes from Module 2 will show up here. Go back and save at least
                  two before continuing.
                </p>
              ) : evidenceGroups.length === 0 ? (
                <p className="text-sm text-text-muted">
                  No quotes match this filter. Try changing it, or collect more in
                  Module 2.
                </p>
              ) : (
                <div className="space-y-4">
                  {evidenceGroups.map(([sourceType, evidenceGroup]) => (
                    <div key={sourceType} className="space-y-2">
                      <p className="text-left text-xs font-medium text-text-muted">
                        {sourceLabelForType(sourceType)}
                      </p>
                      <div className="space-y-2">
                        {evidenceGroup.map((evidence) => (
                          <ModuleThreeEvidenceCard
                            key={evidence.id}
                            evidence={evidence}
                            selected={workingEvidenceIds.includes(evidence.id)}
                            onToggleSelected={toggleWorkingEvidence}
                            marker={evidenceMarkers[evidence.id] || ""}
                            onMarkerChange={updateEvidenceMarker}
                            showArtifactLabel={false}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ReferenceSection>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.PATTERNS) {
    stepContent = (
      <ModuleThreeStepFrame
        question="What do these quotes seem to have in common?"
        whyMatters={[
          "A pattern moves you from collecting quotes to seeing what they mean.",
          "When you name what repeats or contrasts, you start to find your argument.",
        ]}
        example="Several of your quotes talk about hope. That might be a pattern."
        successLooksLike={[
          "You wrote at least two things your quotes seem to share.",
          "You chose one pattern to keep exploring.",
          "That pattern is linked to at least two quotes.",
        ]}
        coachingMessage="Do not worry if your first answer is rough. A pattern is something you notice across the whole group — not just a topic word."
        nextStepText="Then you will ask what that pattern might mean."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label={selectedCluster?.name || "Your group"}
            description="What do these quotes seem to have in common?"
          >
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  My answer
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Write a few honest notices. Then choose the one you want to explore further.
                </p>
              </div>

              {patternNotices.map((notice, index) => (
                <div
                  key={notice.id}
                  className={`rounded-lg p-4 ${
                    selectedPatternId === notice.id
                      ? "bg-theme-orange/[0.07] ring-1 ring-theme-orange/25"
                      : "bg-surface-soft/50"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <p className="text-left text-sm text-text-muted">
                      {patternNotices.length > 1
                        ? `Another thing you notice (${index + 1})`
                        : "What do you notice?"}
                    </p>

                    <label className="flex items-center gap-2 text-sm text-text-primary">
                      <input
                        type="radio"
                        name="selected-pattern"
                        checked={selectedPatternId === notice.id}
                        onChange={() => {
                          setSelectedPatternId(notice.id);
                          if (userEmail) {
                            selectPatternArtifact({
                              userEmail,
                              patternId: notice.id,
                            }).then((result) => {
                              if (!result.ok) {
                                setPersistError(
                                  result.error?.message ||
                                    "Could not save your pattern choice."
                                );
                              } else {
                                setPersistError("");
                              }
                            });
                          }
                        }}
                      />
                      Explore this one
                    </label>
                  </div>

                  <textarea
                    value={notice.text}
                    onChange={(event) =>
                      updatePatternNotice(notice.id, { text: event.target.value })
                    }
                    placeholder="What repeats, contrasts, or builds across these quotes?"
                    className={`mt-3 ${ANSWER_TEXTAREA_CLASS}`}
                  />

                  <div className="mt-4 space-y-2 text-left">
                    <p className="text-xs text-text-muted">
                      Which quotes helped you see this?
                    </p>
                    <div className="grid gap-2 md:grid-cols-2">
                      {selectedClusterEvidence.map((evidence) => (
                        <label
                          key={`${notice.id}-${evidence.id}`}
                          className="flex items-start gap-2 rounded-lg bg-surface-soft/70 p-3 text-sm"
                        >
                          <input
                            type="checkbox"
                            checked={notice.evidenceIds.includes(evidence.id)}
                            onChange={() => togglePatternEvidence(notice.id, evidence.id)}
                            className="mt-1"
                          />
                          <span>
                            <span className="block font-medium text-text-primary">
                              {evidence.sourceLabel}
                            </span>
                            <span className="block text-text-muted">
                              {evidenceSummaryLine(evidence)}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <Button type="button" onClick={addPatternNotice} variant="tertiary" size="sm">
                Add another thing you notice
              </Button>
            </div>
          </WorkingSetSection>

          <ReferenceSection
            label="Quotes in this group"
            description="On the shelf — glance back while you write."
          >
            <div className="grid gap-3 md:grid-cols-2">
              {selectedClusterEvidence.map((evidence) => (
                <ModuleThreeEvidenceCard
                  key={`pattern-evidence-${evidence.id}`}
                  evidence={evidence}
                  marker={evidenceMarkers[evidence.id] || ""}
                  compact
                />
              ))}
            </div>
          </ReferenceSection>

          {evidenceClusters.filter((cluster) => cluster.id !== selectedClusterId).length >
          0 ? (
            <ReferenceSection
              label="Your other groups"
              description="Not on your desk right now."
            >
              <div className="space-y-2">
                {evidenceClusters
                  .filter((cluster) => cluster.id !== selectedClusterId)
                  .map((cluster) => (
                    <p key={cluster.id} className="text-sm text-text-muted">
                      {cluster.name} ({cluster.evidenceIds.length} quotes)
                    </p>
                  ))}
              </div>
            </ReferenceSection>
          ) : null}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.IDEA) {
    stepContent = (
      <ModuleThreeStepFrame
        question="What might this pattern mean?"
        whyMatters={[
          "A pattern tells you what you noticed — an idea is your first guess at what it means.",
          "You are not proving anything yet. You are exploring.",
        ]}
        example="If your pattern is about hope, your idea might be: the speaker uses hope to motivate action."
        successLooksLike={[
          "You wrote one clear idea in your own words.",
          "You said why it feels worth exploring.",
          "Your idea goes beyond just summarizing the quotes.",
        ]}
        coachingMessage="Don't worry if your first answer isn't perfect. It just needs to be clear enough to test."
        nextStepText="Then you will connect your quotes to this idea and explain how each one helps."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Your idea"
            description="What might this pattern mean?"
          >
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                My answer
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                There isn’t one perfect idea. Start with a clear guess you can test.
              </p>
            </div>

            {selectedPattern?.text ? null : (
              <p className="mb-4 text-sm text-text-muted">
                Choose a pattern from the shelf below first.
              </p>
            )}

            <label className="block text-left">
              <span className="mb-2 block text-base font-medium text-text-primary">
                What might this pattern mean?
              </span>
              <textarea
                value={ideaStatement}
                onChange={(event) => {
                  const value = event.target.value;
                  setIdeaStatement(value);
                  schedulePersistIdea(
                    value,
                    ideaWhyMatters,
                    selectedClusterId,
                    selectedPatternId,
                    evidenceConnections
                  );
                }}
                placeholder="Write a possible idea in your own words"
                className={ANSWER_TEXTAREA_CLASS}
              />
            </label>

            <label className="mt-4 block text-left">
              <span className="mb-2 block text-sm text-text-muted">
                Why does this feel worth exploring?
              </span>
              <textarea
                value={ideaWhyMatters}
                onChange={(event) => {
                  const value = event.target.value;
                  setIdeaWhyMatters(value);
                  schedulePersistIdea(
                    ideaStatement,
                    value,
                    selectedClusterId,
                    selectedPatternId,
                    evidenceConnections
                  );
                }}
                placeholder="What makes this idea interesting or important?"
                className={QUIET_TEXTAREA_CLASS}
              />
            </label>
          </WorkingSetSection>

          <ReferenceSection
            label="Your pattern"
            description="The notice you are building from, and its quotes."
          >
            {selectedPattern?.text ? (
              <p className="mb-4 text-sm text-text-primary">{selectedPattern.text}</p>
            ) : (
              <p className="mb-4 text-sm text-text-muted">
                Go back and choose a pattern to explore.
              </p>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {selectedPatternEvidence.map((evidence) => (
                <ModuleThreeEvidenceCard
                  key={`idea-pattern-${evidence.id}`}
                  evidence={evidence}
                  marker={evidenceMarkers[evidence.id] || ""}
                  compact
                />
              ))}
            </div>
          </ReferenceSection>

          {patternNotices.filter((notice) => notice.id !== selectedPatternId).length >
          0 ? (
            <ReferenceSection
              label="Other patterns you noticed"
              description="On the shelf — you are exploring one at a time."
            >
              <div className="space-y-2">
                {patternNotices
                  .filter((notice) => notice.id !== selectedPatternId && safeText(notice.text))
                  .map((notice) => (
                    <p key={notice.id} className="text-sm text-text-muted">
                      {notice.text}
                    </p>
                  ))}
              </div>
            </ReferenceSection>
          ) : null}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.CONNECT) {
    stepContent = (
      <ModuleThreeStepFrame
        question="How does each quote help this idea?"
        whyMatters={[
          "An idea only gets stronger when you can explain how your quotes support it.",
          "This is where you start building real proof.",
        ]}
        successLooksLike={[
          "You chose at least two quotes for your idea.",
          "Each quote has a connection note in your own words.",
          "You can explain how each quote helps.",
        ]}
        coachingMessage="A quote does not support an idea by itself — you have to explain the connection in your own words."
        nextStepText="Then you will ask whether your support feels strong enough."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Your connections"
            description="Explain how each quote helps your idea."
          >
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  My answer
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  Select the quotes that help your idea, then explain the connection in simple language.
                </p>
              </div>

              {selectedClusterEvidence.map((evidence) => {
                const connection =
                  evidenceConnections[evidence.id] || createEmptyConnection();

                return (
                  <div
                    key={`connect-${evidence.id}`}
                    className="space-y-3 rounded-lg bg-surface-soft/40 p-4"
                  >
                    <ModuleThreeEvidenceCard
                      evidence={evidence}
                      marker={evidenceMarkers[evidence.id] || ""}
                      compact
                    />

                    <label className="flex items-center gap-2 text-sm text-text-primary">
                      <input
                        type="checkbox"
                        checked={connection.selected}
                        onChange={() => toggleConnectionSelection(evidence.id)}
                      />
                      This quote helps my idea
                    </label>

                    {connection.selected ? (
                      <>
                        <label className="block text-left">
                          <span className="mb-1 block text-xs text-text-muted">
                            In what way?
                          </span>
                          <select
                            value={connection.relation}
                            onChange={(event) =>
                              updateConnection(
                                evidence.id,
                                "relation",
                                event.target.value
                              )
                            }
                            className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                          >
                            <option value="supports">Supports</option>
                            <option value="complicates">Complicates</option>
                            <option value="sharpens">Sharpens</option>
                          </select>
                        </label>

                        <label className="block text-left">
                          <span className="mb-2 block text-base font-medium text-text-primary">
                            How does this quote help your idea?
                          </span>
                          <textarea
                            value={connection.note}
                            onChange={(event) =>
                              updateConnection(
                                evidence.id,
                                "note",
                                event.target.value
                              )
                            }
                            placeholder="Explain the connection in your own words"
                            className={ANSWER_TEXTAREA_CLASS}
                          />
                        </label>
                      </>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </WorkingSetSection>

          <ReferenceSection
            label="Your idea"
            description="On the shelf — the idea you are connecting quotes to."
          >
            {ideaStatement ? (
              <p className="text-sm text-text-primary">{ideaStatement}</p>
            ) : (
              <p className="text-sm text-text-muted">No idea written yet.</p>
            )}
          </ReferenceSection>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.EVALUATE) {
    stepContent = (
      <ModuleThreeStepFrame
        question="Is my support strong enough yet?"
        whyMatters={[
          "Before you argue a point, you need to know whether your quotes can actually back it up.",
          "Being honest here saves you from arguing something you cannot prove.",
        ]}
        successLooksLike={[
          "You named how strong your support feels.",
          "You said what still feels weakest.",
          "If support is thin, you chose what to do next.",
        ]}
        coachingMessage="Needing more support does not mean your idea is bad — it just means your thinking needs more proof."
        nextStepText="If support feels thin, you can look for another quote. If it feels ready, you will state the point you want to prove."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Your judgment"
            description="How strong does your support feel right now?"
          >
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                My answer
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Be honest. This helps you avoid making a claim your evidence can’t really support yet.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                {
                  value: "weak",
                  label: "Weak",
                  description: "Interesting idea, but thin support.",
                },
                {
                  value: "developing",
                  label: "Developing",
                  description: "Has promise, needs more work.",
                },
                {
                  value: "strong",
                  label: "Strong",
                  description: "Ready to support a claim.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-lg p-4 text-left transition-all duration-150 ${
                    evidenceStrength === option.value
                      ? "bg-theme-blue/10 ring-1 ring-theme-blue/25"
                      : "bg-surface-soft/50 hover:bg-surface-soft"
                  }`}
                >
                  <input
                    type="radio"
                    name="evidence-strength"
                    value={option.value}
                    checked={evidenceStrength === option.value}
                    onChange={(event) => {
                      const nextStrength = event.target.value;
                      setEvidenceStrength(nextStrength);
                      if (nextStrength === "strong") {
                        setPathDecision("");
                      }
                    }}
                    className="sr-only"
                  />
                  <p className="text-sm font-semibold text-text-primary">{option.label}</p>
                  <p className="mt-1 text-sm text-text-muted">{option.description}</p>
                </label>
              ))}
            </div>

            <label className="mt-4 block text-left">
              <span className="mb-2 block text-base font-medium text-text-primary">
                What still feels weakest?
              </span>
              <textarea
                value={gapNote}
                onChange={(event) => setGapNote(event.target.value)}
                placeholder="Relevance, range, explanation — or something else?"
                className={QUIET_TEXTAREA_CLASS}
              />
            </label>

            {evidenceStrength && evidenceStrength !== "strong" ? (
              <div className="mt-4 space-y-2 text-left">
                <p className="text-sm text-text-muted">What would you like to do?</p>
                <label className="flex items-start gap-2 rounded-lg bg-surface-soft/60 p-3 text-sm">
                  <input
                    type="radio"
                    name="path-decision"
                    value="gather_more_evidence"
                    checked={pathDecision === "gather_more_evidence"}
                    onChange={(event) => setPathDecision(event.target.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-text-primary">
                      Look for another quote
                    </span>
                    <span className="block text-text-muted">
                      Fill the gap before stating your point.
                    </span>
                  </span>
                </label>

                <label className="flex items-start gap-2 rounded-lg bg-surface-soft/60 p-3 text-sm">
                  <input
                    type="radio"
                    name="path-decision"
                    value="move_forward"
                    checked={pathDecision === "move_forward"}
                    onChange={(event) => setPathDecision(event.target.value)}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-medium text-text-primary">
                      Move on with what I have
                    </span>
                    <span className="block text-text-muted">
                      State your point with the support you have.
                    </span>
                  </span>
                </label>
              </div>
            ) : null}
          </WorkingSetSection>

          <ReferenceSection
            label="Connections you made"
            description="On the shelf — what you are judging."
          >
            {ideaStatement ? (
              <p className="mb-4 text-sm text-text-muted">
                <span className="font-medium text-text-primary">Your idea: </span>
                {ideaStatement}
              </p>
            ) : null}

            {connectedEvidence.length === 0 ? (
              <p className="text-sm text-text-muted">
                Go back and connect at least two quotes to your idea first.
              </p>
            ) : (
              <div className="space-y-3">
                {connectedEvidence.map((evidence) => {
                  const connection = evidenceConnections[evidence.id];
                  return (
                    <div key={`evaluate-${evidence.id}`} className="text-left">
                      <p className="text-sm text-text-primary">{evidence.sourceLabel}</p>
                      <p className="mt-1 text-xs text-text-muted">
                        {connection?.relation} — {connection?.note}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </ReferenceSection>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.GATHER) {
    stepContent = (
      <ModuleThreeStepFrame
        question="What kind of quote is still missing?"
        whyMatters={[
          "You are going back on purpose — not to collect random quotes, but to fill a specific gap.",
          "Strong arguments need the right support, not just more of it.",
        ]}
        successLooksLike={[
          "You found quotes that address your gap.",
          "You explained how each new quote helps.",
          "Your support feels stronger than before.",
        ]}
        coachingMessage="Don't grab random quotes. Look for ones that answer the exact weakness you noticed."
        nextStepText="When your support feels ready, you will ask what point your quotes help you prove."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Quotes filling the gap"
            description="On your desk — explain how each one helps."
          >
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                My work on the desk
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Pick quotes that fix the exact weakness you noticed. Then explain how each one helps.
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
                  .filter((evidence) => workingEvidenceIds.includes(evidence.id))
                  .map((evidence) => (
                    <div key={`gather-working-${evidence.id}`} className="space-y-3">
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
                            checked={selectedCluster.evidenceIds.includes(evidence.id)}
                            onChange={() =>
                              setEvidenceClusters((previous) =>
                                previous.map((cluster) => {
                                  if (cluster.id !== selectedCluster.id) {
                                    return cluster;
                                  }

                                  const nextEvidenceIds = cluster.evidenceIds.includes(
                                    evidence.id
                                  )
                                    ? cluster.evidenceIds.filter((id) => id !== evidence.id)
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
                            updateStrengtheningNote(evidence.id, event.target.value)
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

          <ReferenceSection
            label="All your quotes"
            description="On the shelf — your idea, your gap, and quotes to choose from."
          >
            <div className="mb-4 grid gap-3 md:grid-cols-2">
              <div>
                <p className="text-xs text-text-muted">Your idea</p>
                <p className="mt-0.5 text-sm text-text-primary">{ideaStatement}</p>
              </div>
              <div>
                <p className="text-xs text-text-muted">The gap you noticed</p>
                <p className="mt-0.5 text-sm text-text-primary">{gapNote}</p>
              </div>
            </div>

            <div className="space-y-3">
              {evidenceItems
                .filter((evidence) => !workingEvidenceIds.includes(evidence.id))
                .map((evidence) => (
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
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.CLAIM) {
    stepContent = (
      <ModuleThreeStepFrame
        question="What point do these quotes help you prove?"
        whyMatters={[
          "This is where your idea becomes an argument you can actually defend.",
          "A claim is the point your quotes help you prove.",
        ]}
        example="A claim says something specific: 'The speaker uses hope to push listeners toward action.'"
        successLooksLike={[
          "You wrote one clear claim.",
          "You explained why your quotes support it.",
          "Your claim matches the support you have.",
        ]}
        coachingMessage="Your claim should say something your quotes can support — not something anyone could say about any text."
        nextStepText="Then you will turn that point into one clear sentence for your essay."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Your argument"
            description="What point do these quotes help you prove?"
          >
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                My answer
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Say the point clearly. Then explain how your quotes support it in your own words.
              </p>
            </div>

            <label className="block text-left">
              <span className="mb-2 block text-base font-medium text-text-primary">
                What point do these quotes help you prove?
              </span>
              <textarea
                value={workingClaim}
                onChange={(event) => {
                  const value = event.target.value;
                  setWorkingClaim(value);
                  schedulePersistClaim(
                    value,
                    supportRationale,
                    selectedClusterId,
                    selectedPatternId
                  );
                }}
                placeholder="Write the point you want to argue"
                className={ANSWER_TEXTAREA_CLASS}
              />
            </label>

            <label className="mt-4 block text-left">
              <span className="mb-2 block text-sm text-text-muted">
                Why do your quotes support this?
              </span>
              <textarea
                value={supportRationale}
                onChange={(event) => {
                  const value = event.target.value;
                  setSupportRationale(value);
                  schedulePersistClaim(
                    workingClaim,
                    value,
                    selectedClusterId,
                    selectedPatternId
                  );
                }}
                placeholder="A few sentences in your own words"
                className={QUIET_TEXTAREA_CLASS}
              />
            </label>
          </WorkingSetSection>

          <ReferenceSection
            label="Supporting quotes"
            description="On the shelf — the evidence behind this argument."
          >
            {ideaStatement ? (
              <p className="mb-4 text-sm text-text-muted">
                <span className="font-medium text-text-primary">Your idea: </span>
                {ideaStatement}
              </p>
            ) : null}

            {supportEvidence.length > 0 ? (
              <div className="space-y-2">
                {supportEvidence.map((evidence) => (
                  <div key={`claim-support-${evidence.id}`} className="text-left text-sm">
                    <p className="text-text-primary">{evidence.sourceLabel}</p>
                    <p className="text-xs text-text-muted">
                      {safeText(strengtheningNotes[evidence.id]) ||
                        evidenceConnections[evidence.id]?.note ||
                        evidenceSummaryLine(evidence)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                Your connected quotes will appear here as you build your argument.
              </p>
            )}
          </ReferenceSection>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.THESIS) {
    stepContent = (
      <ModuleThreeStepFrame
        question="How would you explain your main point in one clear sentence?"
        whyMatters={[
          "A thesis is your argument in one clear sentence — the sentence your whole essay will prove.",
          "You are not starting over. You are sharpening what you already built.",
        ]}
        example="A thesis takes your claim and makes it one sentence: 'By appealing to hope, the speaker motivates listeners to act.'"
        successLooksLike={[
          "You wrote one clear thesis sentence.",
          "Your thesis says only what your quotes can prove.",
          "You listed the main parts your essay will need to explain.",
        ]}
        coachingMessage="Your thesis is not a new idea — it is your claim, written clearly enough to guide your essay."
        nextStepText="You will carry this thesis and essay plan into the next stage of writing."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-8">
          <WorkingSetSection
            label="Your main sentence"
            description="How would you explain your main point in one clear sentence?"
          >
            <div className="space-y-1 text-left">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                My answer
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Keep it simple and specific. This sentence should say only what your quotes can prove.
              </p>
            </div>

            <label className="block text-left">
              <span className="mb-2 block text-base font-medium text-text-primary">
                How would you say your main point in one clear sentence?
              </span>
              <textarea
                value={thesisStatement}
                onChange={(event) => {
                  const value = event.target.value;
                  setThesisStatement(value);
                  schedulePersistThesis(
                    value,
                    proofPlan,
                    selectedClusterId,
                    selectedPatternId
                  );
                }}
                placeholder="One sentence that states your argument"
                className={ANSWER_TEXTAREA_CLASS}
              />
            </label>

            <div className="mt-6 space-y-3 border-t border-border-soft/60 pt-5">
              <p className="text-sm text-text-muted">
                What will your essay need to prove? List up to three parts.
              </p>

              {proofPlan.map((line, index) => (
                <label key={`proof-plan-${index}`} className="block text-left">
                  <span className="mb-2 block text-sm text-text-muted">
                    Part {index + 1} your essay will prove
                  </span>
                  <textarea
                    value={line}
                    onChange={(event) => updateProofPlan(index, event.target.value)}
                    placeholder="One part your argument will need to explain"
                    className={QUIET_TEXTAREA_CLASS}
                  />
                </label>
              ))}
            </div>

            {safeText(thesisStatement) ? (
              <div className="mt-5 rounded-lg bg-theme-green/[0.06] px-4 py-4 text-left">
                <p className="text-sm text-text-primary">
                  Good. You have a main sentence and a start on your essay plan.
                </p>
                <p className="mt-1 text-sm text-text-muted">
                  When you are ready, you can carry this into the next stage of writing.
                </p>
              </div>
            ) : null}
          </WorkingSetSection>

          <ReferenceSection
            label="The point you want to prove"
            description="On the shelf — what your main sentence grows from."
          >
            {workingClaim ? (
              <p className="text-sm text-text-primary">{workingClaim}</p>
            ) : (
              <p className="text-sm text-text-muted">
                Go back and write the point you want to argue — your main sentence grows
                from it.
              </p>
            )}
          </ReferenceSection>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      <ModuleThreeProgress
        steps={visibleSteps}
        currentStepId={currentStep}
        onStepChange={setCurrentStep}
      />

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

      {stepContent}

      <div className="flex flex-col gap-4 border-t border-border-soft/50 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {continueHint ? (
          <p className="text-xs leading-relaxed text-text-muted">{continueHint}</p>
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
        ) : null}
        </div>
      </div>
    </div>
  );
}
