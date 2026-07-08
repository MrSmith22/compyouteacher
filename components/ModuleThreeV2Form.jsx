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
    shortLabel: "Review Evidence",
  },
  {
    id: STEP_IDS.PATTERNS,
    shortLabel: "Notice Patterns",
  },
  {
    id: STEP_IDS.IDEA,
    shortLabel: "Explore Idea",
  },
  {
    id: STEP_IDS.CONNECT,
    shortLabel: "Connect Evidence",
  },
  {
    id: STEP_IDS.EVALUATE,
    shortLabel: "Evaluate Strength",
  },
  {
    id: STEP_IDS.GATHER,
    shortLabel: "Gather More Evidence",
    optional: true,
  },
  {
    id: STEP_IDS.CLAIM,
    shortLabel: "Develop Claim",
  },
  {
    id: STEP_IDS.THESIS,
    shortLabel: "Turn Into Thesis",
  },
];

function makePatternNotice(id) {
  return {
    id,
    text: "",
    evidenceIds: [],
  };
}

function makeEvidenceCluster(id, name, evidenceIds) {
  return {
    id,
    name,
    evidenceIds,
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
        ? "Choose a few quotes, then group the ones that belong together."
        : "Pick the group you want to study next.",
    [STEP_IDS.PATTERNS]: "Notice what your quotes have in common and write it down.",
    [STEP_IDS.IDEA]: "Turn that pattern into one possible idea.",
    [STEP_IDS.CONNECT]: "Explain how each quote helps your idea.",
    [STEP_IDS.EVALUATE]: "Be honest about whether your support is strong enough.",
    [STEP_IDS.GATHER]: "Find quotes that fill the gap you noticed.",
    [STEP_IDS.CLAIM]: "Write the point you think you can argue.",
    [STEP_IDS.THESIS]: "Turn that point into one clear thesis sentence.",
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
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [currentStep, setCurrentStep] = useState(STEP_IDS.REVIEW);

  const [sourceFilter, setSourceFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [sortMode, setSortMode] = useState("source");
  const [searchText, setSearchText] = useState("");

  const [workingEvidenceIds, setWorkingEvidenceIds] = useState([]);
  const [evidenceMarkers, setEvidenceMarkers] = useState({});
  const [evidenceClusters, setEvidenceClusters] = useState([]);
  const [selectedClusterId, setSelectedClusterId] = useState("");
  const [clusterDraftName, setClusterDraftName] = useState("");
  const [clusterDraftEvidenceIds, setClusterDraftEvidenceIds] = useState([]);
  const clusterReflectionRef = useRef(null);

  const [patternNotices, setPatternNotices] = useState([
    makePatternNotice("pattern-1"),
    makePatternNotice("pattern-2"),
  ]);
  const [selectedPatternId, setSelectedPatternId] = useState("");

  const [ideaStatement, setIdeaStatement] = useState("");
  const [ideaWhyMatters, setIdeaWhyMatters] = useState("");

  const [evidenceConnections, setEvidenceConnections] = useState({});
  const [evidenceStrength, setEvidenceStrength] = useState("");
  const [gapNote, setGapNote] = useState("");
  const [pathDecision, setPathDecision] = useState("");
  const [strengtheningNotes, setStrengtheningNotes] = useState({});

  const [workingClaim, setWorkingClaim] = useState("");
  const [supportRationale, setSupportRationale] = useState("");

  const [thesisStatement, setThesisStatement] = useState("");
  const [proofPlan, setProofPlan] = useState(["", "", ""]);

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
  const stepNumber = currentStepIndex >= 0 ? currentStepIndex + 1 : 1;
  const totalSteps = visibleSteps.length;
  const isLastStep =
    visibleSteps[visibleSteps.length - 1]?.id === currentStep;
  const previousMove =
    currentStepIndex > 0 ? visibleSteps[currentStepIndex - 1] : null;
  const nextMove =
    currentStepIndex >= 0 ? visibleSteps[currentStepIndex + 1] || null : null;

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
          return `Choose at least ${workingEvidenceMinimum} quotes using the checkboxes above.`;
        }
        if (evidenceClusters.length < 1) {
          return "Scroll down, pick quotes that belong together, name the group, and click Create group.";
        }
        if (!selectedCluster || selectedCluster.evidenceIds.length < 2) {
          return "Select which group you want to work with next.";
        }
        return "";
      case STEP_IDS.PATTERNS:
        return "Write two patterns, choose one to explore, and link at least two quotes to it.";
      case STEP_IDS.IDEA:
        return "Write your idea and a sentence about why it feels worth exploring.";
      case STEP_IDS.CONNECT:
        return "Pick at least two quotes and explain how each one helps your idea.";
      case STEP_IDS.EVALUATE:
        return "Pick how strong your support feels, name what is weakest, and choose what to do next.";
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

  function updatePatternNotice(patternId, patch) {
    setPatternNotices((previous) =>
      previous.map((notice) =>
        notice.id === patternId ? { ...notice, ...patch } : notice
      )
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

        return { ...notice, evidenceIds: nextEvidenceIds };
      })
    );
  }

  function addPatternNotice() {
    setPatternNotices((previous) => [
      ...previous,
      makePatternNotice(`pattern-${previous.length + 1}`),
    ]);
  }

  function resetDownstreamThinking() {
    setPatternNotices([makePatternNotice("pattern-1"), makePatternNotice("pattern-2")]);
    setSelectedPatternId("");
    setIdeaStatement("");
    setIdeaWhyMatters("");
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

  function createEvidenceCluster() {
    const normalizedName = safeText(clusterDraftName);

    if (!normalizedName || clusterDraftEvidenceIds.length < 2) {
      return;
    }

    const nextCluster = makeEvidenceCluster(
      `cluster-${evidenceClusters.length + 1}`,
      normalizedName,
      clusterDraftEvidenceIds
    );

    setEvidenceClusters((previous) => [...previous, nextCluster]);
    applySelectedCluster(nextCluster.id);
    setClusterDraftName("");
    setClusterDraftEvidenceIds([]);
    if (clusterReflectionRef.current) {
      clusterReflectionRef.current.value = "";
    }
  }

  function toggleConnectionSelection(evidenceId) {
    setEvidenceConnections((previous) => {
      const current = previous[evidenceId] || createEmptyConnection();
      return {
        ...previous,
        [evidenceId]: {
          ...current,
          selected: !current.selected,
        },
      };
    });
  }

  function updateConnection(evidenceId, field, value) {
    setEvidenceConnections((previous) => ({
      ...previous,
      [evidenceId]: {
        ...(previous[evidenceId] || createEmptyConnection()),
        [field]: value,
      },
    }));
  }

  function updateStrengtheningNote(evidenceId, value) {
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
  }

  function updateProofPlan(index, value) {
    setProofPlan((previous) =>
      previous.map((item, itemIndex) => (itemIndex === index ? value : item))
    );
  }

  useEffect(() => {
    setClusterDraftEvidenceIds((previousIds) =>
      previousIds.filter((id) => workingEvidenceIds.includes(id))
    );
  }, [workingEvidenceIds]);

  if (loading) {
    return (
      <div className="rounded-xl bg-theme-light p-6 shadow-soft">
        <p className="text-sm text-theme-dark/80">Loading Module 3 workspace...</p>
      </div>
    );
  }

  if (!userEmail) {
    return (
      <div className="rounded-xl bg-theme-light p-6 shadow-soft">
        <p className="text-sm text-theme-dark/80">
          Sign in to open the Module 3 thinking workspace.
        </p>
      </div>
    );
  }

  const thinkingCanvasPane = <ModuleThreeThinkingCanvas canvasState={canvasState} />;

  let stepContent = null;

  if (currentStep === STEP_IDS.REVIEW) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="Which quotes seem to belong together?"
        whyMatters={[
          "You already collected evidence — now it is time to see what connects.",
          "Grouping related quotes is the first step toward building an argument.",
        ]}
        primaryAction="Choose quotes"
        example="Several quotes talk about hope. That might be a group worth naming."
        successLooksLike={[
          "You chose a few quotes to work with.",
          "You created at least one named group.",
          "You picked which group to explore next.",
        ]}
        coachingMessage="There is no single right answer. If the quotes feel connected to you, they are worth trying together."
        nextStepText="When your group is ready, you will look across it and notice what those quotes show together."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center gap-1 py-2 text-center text-sm">
            <p className="font-semibold text-text-primary">Read these quotes.</p>
            <span aria-hidden="true" className="text-lg text-theme-blue">
              ↓
            </span>
            <p className="font-semibold text-text-primary">
              Choose the ones that belong together.
            </p>
            <span aria-hidden="true" className="text-lg text-theme-blue">
              ↓
            </span>
            <p className="font-semibold text-text-primary">Give that group a name.</p>
          </div>

          <div className="rounded-xl border border-theme-blue/15 bg-theme-blue/5 px-4 py-3 text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
              Your writing task
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-primary">
              {ASSIGNMENT.task.prompt}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-left">
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  Your quotes ({filteredEvidence.length})
                </p>
                {evidenceItems.length > 0 ? (
                  <p className="mt-0.5 text-sm text-text-muted">
                    Check Choose quote on a few passages, then scroll down to group them.
                  </p>
                ) : null}
              </div>
              <details className="rounded-lg border border-border-soft bg-surface">
                <summary className="cursor-pointer list-none px-3 py-2 text-xs font-medium text-theme-blue transition-colors duration-150 hover:bg-theme-blue/5">
                  Filter or search
                </summary>
                <div className="grid gap-3 border-t border-border-soft px-3 py-3 md:grid-cols-3">
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
                <div className="border-t border-border-soft px-3 py-3">
                  <input
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Search quotes or notes"
                    className="w-full rounded-lg border border-border-soft bg-white px-3 py-2 text-sm text-text-primary"
                  />
                </div>
              </details>
            </div>

            {evidenceItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-soft bg-surface-soft px-4 py-5 text-left">
                <p className="text-sm font-semibold text-text-primary">No quotes yet.</p>
                <p className="mt-1 text-sm text-text-muted">
                  Module 3 starts with quotes you collected in Module 2. Go back and save at
                  least two before continuing here.
                </p>
              </div>
            ) : evidenceGroups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border-soft bg-surface-soft px-4 py-5 text-left">
                <p className="text-sm font-semibold text-text-primary">No quotes match this filter.</p>
                <p className="mt-1 text-sm text-text-muted">
                  Try changing the filter, or go back to Module 2 to collect more quotes first.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {evidenceGroups.map(([sourceType, evidenceGroup]) => (
                  <div key={sourceType} className="space-y-3">
                    <h2 className="text-left text-base font-bold text-text-primary">
                      {sourceLabelForType(sourceType)}
                    </h2>
                    <div className="space-y-3">
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

          <div className="rounded-2xl border-2 border-theme-blue/20 bg-theme-blue/5 p-5">
            <div className="space-y-4 text-left">
              <div>
                <h2 className="text-xl font-bold text-text-primary">
                  {evidenceClusters.length === 0
                    ? "Create your first group"
                    : "Create another group"}
                </h2>
              </div>

              {workingEvidence.length === 0 ? (
                <div className="rounded-lg border border-dashed border-theme-blue/25 bg-surface px-4 py-4">
                  <p className="text-sm font-semibold text-text-primary">No quotes chosen yet.</p>
                  <p className="mt-1 text-sm text-text-muted">
                    Choose a few quotes above first. Your group will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-text-muted">
                    Pick at least two quotes that feel connected, then name the group.
                  </p>

                  <div className="grid gap-2 md:grid-cols-2">
                    {workingEvidence.map((evidence) => {
                      const isChosen = clusterDraftEvidenceIds.includes(evidence.id);

                      return (
                        <button
                          key={`cluster-draft-${evidence.id}`}
                          type="button"
                          onClick={() => toggleClusterDraftEvidence(evidence.id)}
                          className={`rounded-xl border px-4 py-3 text-left transition-all duration-150 ${
                            isChosen
                              ? "border-theme-blue bg-theme-blue/15 shadow-soft ring-2 ring-theme-blue/20"
                              : "border-border-soft bg-surface hover:border-theme-blue/30"
                          }`}
                        >
                          <p className="text-sm font-semibold text-text-primary">
                            {evidence.sourceLabel} · {evidence.tags[0] || "passage"}
                          </p>
                          <p className="mt-1 text-sm text-text-muted">
                            {evidenceSummaryLine(evidence)}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {clusterDraftEvidence.length > 0 ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {clusterDraftEvidence.map((evidence) => (
                        <ModuleThreeEvidenceCard
                          key={`cluster-preview-${evidence.id}`}
                          evidence={evidence}
                          marker={evidenceMarkers[evidence.id] || ""}
                          compact
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border-soft bg-surface px-4 py-4">
                      <p className="text-sm font-semibold text-text-primary">
                        No quotes in this group yet.
                      </p>
                      <p className="mt-1 text-sm text-text-muted">
                        Click the quotes above that belong together. They will show up here.
                      </p>
                    </div>
                  )}

                  <label className="block text-left">
                    <span className="mb-1 block text-sm font-semibold text-text-primary">
                      Name this group
                    </span>
                    <input
                      value={clusterDraftName}
                      onChange={(event) => setClusterDraftName(event.target.value)}
                      placeholder="e.g. Appeals to justice"
                      className="w-full rounded-lg border border-theme-blue/25 bg-white px-3 py-2.5 text-sm text-text-primary"
                    />
                  </label>

                  <label className="block text-left">
                    <span className="mb-1 block text-sm font-medium text-text-muted">
                      Why do these belong together? (optional)
                    </span>
                    <textarea
                      ref={clusterReflectionRef}
                      placeholder="A quick note about what connects them"
                      className="min-h-[72px] w-full rounded-lg border border-border-soft bg-white p-3 text-sm text-text-primary"
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
                    className="w-full sm:w-auto"
                  >
                    Create group
                  </Button>
                </div>
              )}
            </div>
          </div>

          {evidenceClusters.length > 0 ? (
            <div className="space-y-3">
              <p className="text-left text-sm font-semibold text-text-primary">
                Pick the group to explore next
              </p>
              {evidenceClusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className={`rounded-xl border p-4 ${
                    selectedClusterId === cluster.id
                      ? "border-theme-blue bg-theme-blue/10 ring-2 ring-theme-blue/15"
                      : "border-border-soft bg-surface"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="text-left">
                      <h2 className="text-base font-bold text-text-primary">
                        {cluster.name}
                      </h2>
                      <p className="mt-0.5 text-sm text-text-muted">
                        {cluster.evidenceIds.length} quote
                        {cluster.evidenceIds.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <label className="flex items-center gap-2 text-sm font-semibold text-theme-blue">
                      <input
                        type="radio"
                        name="selected-cluster"
                        checked={selectedClusterId === cluster.id}
                        onChange={() => applySelectedCluster(cluster.id)}
                      />
                      Use this group
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
          ) : (
            <div className="rounded-lg border border-dashed border-border-soft bg-surface-soft px-4 py-4 text-left">
              <p className="text-sm font-semibold text-text-primary">No groups yet.</p>
              <p className="mt-1 text-sm text-text-muted">
                After you choose a few related quotes, your first group will appear here.
              </p>
            </div>
          )}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.PATTERNS) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="What do these quotes seem to show together?"
        whyMatters={[
          "A pattern moves you from collecting quotes to seeing what they mean.",
          "When you name what repeats or contrasts, you start to find your argument.",
        ]}
        primaryAction="Write a pattern"
        example="Several of your quotes talk about hope. That might be a pattern."
        successLooksLike={[
          "You wrote at least two pattern ideas.",
          "You chose one pattern to keep exploring.",
          "That pattern is linked to at least two quotes.",
        ]}
        coachingMessage="A pattern is not just a topic word — it is something you notice across the whole group."
        nextStepText="Next you will ask what that pattern might mean and write one possible idea."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          {selectedCluster ? (
            <div className="rounded-xl border border-theme-dark-blue/20 bg-theme-dark-blue/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-dark-blue">
                Your group: {selectedCluster.name}
              </p>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-2">
            {selectedClusterEvidence.map((evidence) => (
              <ModuleThreeEvidenceCard
                key={`pattern-evidence-${evidence.id}`}
                evidence={evidence}
                marker={evidenceMarkers[evidence.id] || ""}
              />
            ))}
          </div>

          <div className="space-y-4">
            {patternNotices.map((notice, index) => (
              <div
                key={notice.id}
                className={`rounded-xl border p-4 ${
                  selectedPatternId === notice.id
                    ? "border-theme-orange/40 bg-theme-orange/5 ring-2 ring-theme-orange/15"
                    : "border-border-soft bg-surface"
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h2 className="text-left text-base font-bold text-text-primary">
                    Pattern {index + 1}
                  </h2>

                  <label className="flex items-center gap-2 text-sm font-semibold text-theme-orange">
                    <input
                      type="radio"
                      name="selected-pattern"
                      checked={selectedPatternId === notice.id}
                      onChange={() => setSelectedPatternId(notice.id)}
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
                  className="mt-3 min-h-[96px] w-full rounded-lg border border-theme-orange/25 bg-white p-3 text-sm text-text-primary focus:border-theme-orange focus:outline-none focus:ring-2 focus:ring-theme-orange/15"
                />

                <div className="mt-4 space-y-2 text-left">
                  <p className="text-sm font-medium text-text-muted">
                    Which quotes helped you see this?
                  </p>
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedClusterEvidence.map((evidence) => (
                      <label
                        key={`${notice.id}-${evidence.id}`}
                        className="flex items-start gap-2 rounded-lg border border-border-soft bg-surface-soft p-3 text-sm"
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
          </div>

          <Button type="button" onClick={addPatternNotice} variant="secondary">
            Add another pattern
          </Button>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.IDEA) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="What idea might this pattern be pointing toward?"
        whyMatters={[
          "A pattern tells you what you noticed — an idea is your first guess at what it means.",
          "You are not proving anything yet. You are exploring.",
        ]}
        primaryAction="Write an idea"
        example="If your pattern is about hope, your idea might be: the speaker uses hope to motivate action."
        successLooksLike={[
          "You wrote one clear idea.",
          "You explained why it feels worth exploring.",
          "Your idea goes beyond just summarizing the quotes.",
        ]}
        coachingMessage="Your first idea does not need to be perfect. It just needs to be clear enough to test."
        nextStepText="Next you will connect your quotes to this idea and explain how each one helps."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          {selectedPattern?.text ? (
            <div className="rounded-xl border border-theme-orange/20 bg-theme-orange/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-orange">
                Your pattern
              </p>
              <p className="mt-1 text-sm text-text-primary">{selectedPattern.text}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-soft bg-surface-soft px-4 py-4 text-left">
              <p className="text-sm font-semibold text-text-primary">No pattern selected yet.</p>
              <p className="mt-1 text-sm text-text-muted">
                Go back to the previous step and choose a pattern to explore.
              </p>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {selectedPatternEvidence.map((evidence) => (
              <ModuleThreeEvidenceCard
                key={`idea-pattern-${evidence.id}`}
                evidence={evidence}
                marker={evidenceMarkers[evidence.id] || ""}
              />
            ))}
          </div>

          <label className="block text-left">
            <span className="mb-2 block text-sm font-semibold text-text-primary">
              Your idea
            </span>
            <textarea
              value={ideaStatement}
              onChange={(event) => setIdeaStatement(event.target.value)}
              placeholder="What might this pattern mean?"
              className="min-h-[110px] w-full rounded-lg border-2 border-theme-deep-green/25 bg-white p-3 text-sm text-text-primary focus:border-theme-deep-green focus:outline-none focus:ring-2 focus:ring-theme-deep-green/15"
            />
          </label>

          <label className="block text-left">
            <span className="mb-2 block text-sm font-medium text-text-muted">
              Why does this feel worth exploring?
            </span>
            <textarea
              value={ideaWhyMatters}
              onChange={(event) => setIdeaWhyMatters(event.target.value)}
              placeholder="What makes this idea interesting or important?"
              className="min-h-[88px] w-full rounded-lg border border-border-soft bg-white p-3 text-sm text-text-primary"
            />
          </label>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.CONNECT) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="How does each quote help this idea?"
        whyMatters={[
          "An idea only gets stronger when you can explain how your quotes support it.",
          "This is where you start building real proof.",
        ]}
        primaryAction="Connect evidence"
        successLooksLike={[
          "You chose at least two quotes for your idea.",
          "Each quote has a connection note in your own words.",
          "You can explain how each quote helps.",
        ]}
        coachingMessage="A quote does not support an idea by itself — you have to explain the connection."
        nextStepText="Next you will check whether your support feels strong enough to move forward."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          {ideaStatement ? (
            <div className="rounded-xl border border-theme-deep-green/20 bg-theme-deep-green/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-deep-green">
                Your idea
              </p>
              <p className="mt-1 text-sm text-text-primary">{ideaStatement}</p>
            </div>
          ) : null}

          <div className="space-y-4">
            {selectedClusterEvidence.map((evidence) => {
              const connection =
                evidenceConnections[evidence.id] || createEmptyConnection();

              return (
                <ModuleThreeEvidenceCard
                  key={`connect-${evidence.id}`}
                  evidence={evidence}
                  marker={evidenceMarkers[evidence.id] || ""}
                >
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-theme-blue">
                      <input
                        type="checkbox"
                        checked={connection.selected}
                        onChange={() => toggleConnectionSelection(evidence.id)}
                      />
                      Use this quote
                    </label>

                    {connection.selected ? (
                      <>
                        <label className="block text-left">
                          <span className="mb-1 block text-sm font-medium text-text-muted">
                            How does it connect?
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
                          <span className="mb-1 block text-sm font-semibold text-text-primary">
                            Your connection note
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
                            placeholder="Explain how this quote helps your idea"
                            className="min-h-[88px] w-full rounded-lg border-2 border-theme-blue/20 bg-white p-3 text-sm text-text-primary focus:border-theme-blue focus:outline-none focus:ring-2 focus:ring-theme-blue/15"
                          />
                        </label>
                      </>
                    ) : null}
                  </div>
                </ModuleThreeEvidenceCard>
              );
            })}
          </div>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.EVALUATE) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="Is my support strong enough yet?"
        whyMatters={[
          "Before you write a claim, you need to know whether your quotes can actually back it up.",
          "Being honest here saves you from arguing something you cannot prove.",
        ]}
        primaryAction="Rate your support"
        successLooksLike={[
          "You picked a support level: weak, developing, or strong.",
          "You named what still feels weakest.",
          "If support is thin, you chose your next move.",
        ]}
        coachingMessage="Needing more support does not mean your idea is bad — it just means your thinking needs more proof."
        nextStepText="If your support is thin, you can gather more quotes. If it feels ready, you will write your claim."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          {ideaStatement ? (
            <div className="rounded-xl border border-theme-deep-green/20 bg-theme-deep-green/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-deep-green">
                Your idea
              </p>
              <p className="mt-1 text-sm text-text-primary">{ideaStatement}</p>
            </div>
          ) : null}

          <div className="space-y-3">
            {connectedEvidence.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border-soft bg-surface-soft px-4 py-4 text-left">
                <p className="text-sm font-semibold text-text-primary">No connections yet.</p>
                <p className="mt-1 text-sm text-text-muted">
                  Go back and connect at least two quotes to your idea first.
                </p>
              </div>
            ) : (
              connectedEvidence.map((evidence) => {
                const connection = evidenceConnections[evidence.id];
                return (
                  <div
                    key={`evaluate-${evidence.id}`}
                    className="rounded-xl border border-border-soft bg-surface-soft p-4 text-left"
                  >
                    <p className="text-sm font-semibold text-text-primary">
                      {evidence.sourceLabel}
                    </p>
                    <p className="mt-1 text-sm text-text-muted">
                      {connection?.relation} — {connection?.note}
                    </p>
                  </div>
                );
              })
            )}
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
                className={`cursor-pointer rounded-xl border p-4 text-left transition-all duration-150 ${
                  evidenceStrength === option.value
                    ? "border-theme-blue bg-theme-blue/10 ring-2 ring-theme-blue/15"
                    : "border-border-soft bg-surface hover:border-theme-blue/25"
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

          <label className="block text-left">
            <span className="mb-2 block text-sm font-semibold text-text-primary">
              What feels weakest?
            </span>
            <textarea
              value={gapNote}
              onChange={(event) => setGapNote(event.target.value)}
              placeholder="Relevance, range, explanation — or something else?"
              className="min-h-[88px] w-full rounded-lg border border-border-soft bg-white p-3 text-sm text-text-primary"
            />
          </label>

          {evidenceStrength && evidenceStrength !== "strong" ? (
            <div className="space-y-2 rounded-xl border border-theme-orange/20 bg-theme-orange/5 p-4 text-left">
              <p className="text-sm font-semibold text-text-primary">What do you want to do?</p>
              <label className="flex items-start gap-2 rounded-lg border border-border-soft bg-surface p-3 text-sm">
                <input
                  type="radio"
                  name="path-decision"
                  value="gather_more_evidence"
                  checked={pathDecision === "gather_more_evidence"}
                  onChange={(event) => setPathDecision(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-text-primary">Gather more quotes</span>
                  <span className="block text-text-muted">
                    Fill the gap before writing your claim.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-2 rounded-lg border border-border-soft bg-surface p-3 text-sm">
                <input
                  type="radio"
                  name="path-decision"
                  value="move_forward"
                  checked={pathDecision === "move_forward"}
                  onChange={(event) => setPathDecision(event.target.value)}
                  className="mt-1"
                />
                <span>
                  <span className="block font-medium text-text-primary">Move forward anyway</span>
                  <span className="block text-text-muted">
                    Write your claim with what you have.
                  </span>
                </span>
              </label>
            </div>
          ) : null}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.GATHER) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="What kind of quote is still missing?"
        whyMatters={[
          "You are going back on purpose — not to collect random quotes, but to fill a specific gap.",
          "Strong arguments need the right support, not just more of it.",
        ]}
        primaryAction="Find missing quotes"
        successLooksLike={[
          "You found quotes that address your gap.",
          "You explained how each new quote helps.",
          "Your support feels stronger than before.",
        ]}
        coachingMessage="Do not grab random quotes. Look for ones that answer the exact weakness you noticed."
        nextStepText="When your support feels ready, you will turn your idea into a claim you can defend."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-theme-deep-green/20 bg-theme-deep-green/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-deep-green">
                Your idea
              </p>
              <p className="mt-1 text-sm text-text-primary">{ideaStatement}</p>
            </div>
            <div className="rounded-xl border border-theme-orange/20 bg-theme-orange/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-orange">
                Your gap
              </p>
              <p className="mt-1 text-sm text-text-primary">{gapNote}</p>
            </div>
          </div>

          <div className="space-y-4">
            {evidenceItems.map((evidence) => (
              <ModuleThreeEvidenceCard
                key={`gather-${evidence.id}`}
                evidence={evidence}
                selected={workingEvidenceIds.includes(evidence.id)}
                onToggleSelected={toggleWorkingEvidence}
                marker={evidenceMarkers[evidence.id] || ""}
                onMarkerChange={updateEvidenceMarker}
                showArtifactLabel={false}
              >
                {workingEvidenceIds.includes(evidence.id) ? (
                  <div className="space-y-3">
                    {selectedCluster ? (
                      <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
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
                        Add to my group
                      </label>
                    ) : null}

                    <label className="block text-left">
                      <span className="mb-1 block text-sm font-semibold text-text-primary">
                        How does this quote fill the gap?
                      </span>
                      <textarea
                        value={strengtheningNotes[evidence.id] || ""}
                        onChange={(event) =>
                          updateStrengtheningNote(evidence.id, event.target.value)
                        }
                        placeholder="Explain how this quote strengthens your idea"
                        className="min-h-[88px] w-full rounded-lg border-2 border-theme-blue/20 bg-white p-3 text-sm text-text-primary focus:border-theme-blue focus:outline-none focus:ring-2 focus:ring-theme-blue/15"
                      />
                    </label>
                  </div>
                ) : (
                  <p className="text-sm text-text-muted">
                    Choose this quote if it helps fill your gap.
                  </p>
                )}
              </ModuleThreeEvidenceCard>
            ))}
          </div>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.CLAIM) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="What point can I now argue?"
        whyMatters={[
          "This is where your idea becomes an argument you can actually defend.",
          "A claim is the point your quotes help you prove.",
        ]}
        primaryAction="Write a claim"
        example="A claim says something specific: 'The speaker uses hope to push listeners toward action.'"
        successLooksLike={[
          "You wrote one clear claim.",
          "You explained why your quotes support it.",
          "Your claim matches the support you have.",
        ]}
        coachingMessage="A claim should say something your quotes can support — not something anyone could say about any text."
        nextStepText="Next you will turn that claim into one clear thesis sentence for your essay."
        sidebar={thinkingCanvasPane}
      >
        <div className="space-y-5">
          {ideaStatement ? (
            <div className="rounded-xl border border-theme-deep-green/20 bg-theme-deep-green/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-deep-green">
                Your idea
              </p>
              <p className="mt-1 text-sm text-text-primary">{ideaStatement}</p>
            </div>
          ) : null}

          {supportEvidence.length > 0 ? (
            <details className="rounded-lg border border-border-soft bg-surface-soft">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-theme-blue">
                Your supporting quotes ({supportEvidence.length})
              </summary>
              <div className="space-y-2 border-t border-border-soft px-4 py-3">
                {supportEvidence.map((evidence) => (
                  <div key={`claim-support-${evidence.id}`} className="text-left text-sm">
                    <p className="font-medium text-text-primary">{evidence.sourceLabel}</p>
                    <p className="text-text-muted">
                      {safeText(strengtheningNotes[evidence.id]) ||
                        evidenceConnections[evidence.id]?.note ||
                        evidenceSummaryLine(evidence)}
                    </p>
                  </div>
                ))}
              </div>
            </details>
          ) : (
            <div className="rounded-lg border border-dashed border-border-soft bg-surface-soft px-4 py-4 text-left">
              <p className="text-sm font-semibold text-text-primary">No support quotes yet.</p>
              <p className="mt-1 text-sm text-text-muted">
                Your connected quotes will appear here as you build your argument.
              </p>
            </div>
          )}

          <label className="block text-left">
            <span className="mb-2 block text-sm font-semibold text-text-primary">
              Your claim
            </span>
            <textarea
              value={workingClaim}
              onChange={(event) => setWorkingClaim(event.target.value)}
              placeholder="What point can you argue with your quotes?"
              className="min-h-[110px] w-full rounded-lg border-2 border-theme-blue/25 bg-white p-3 text-sm text-text-primary focus:border-theme-blue focus:outline-none focus:ring-2 focus:ring-theme-blue/15"
            />
          </label>

          <label className="block text-left">
            <span className="mb-2 block text-sm font-medium text-text-muted">
              Why do your quotes support this?
            </span>
            <textarea
              value={supportRationale}
              onChange={(event) => setSupportRationale(event.target.value)}
              placeholder="Briefly explain why your quotes back up this claim"
              className="min-h-[88px] w-full rounded-lg border border-border-soft bg-white p-3 text-sm text-text-primary"
            />
          </label>
        </div>
      </ModuleThreeStepFrame>
    );
  }

  if (currentStep === STEP_IDS.THESIS) {
    stepContent = (
      <ModuleThreeStepFrame
        stepNumber={stepNumber}
        totalSteps={totalSteps}
        question="How do I turn this into the main sentence of my essay?"
        whyMatters={[
          "A thesis is your argument in one clear sentence — the sentence your whole essay will prove.",
          "You are not starting over. You are sharpening what you already built.",
        ]}
        primaryAction="Write a thesis"
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
        <div className="space-y-5">
          {workingClaim ? (
            <div className="rounded-xl border border-theme-blue/20 bg-theme-blue/5 px-4 py-3 text-left">
              <p className="text-xs font-semibold uppercase tracking-wide text-theme-blue">
                Your claim
              </p>
              <p className="mt-1 text-sm text-text-primary">{workingClaim}</p>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-border-soft bg-surface-soft px-4 py-4 text-left">
              <p className="text-sm font-semibold text-text-primary">No claim yet.</p>
              <p className="mt-1 text-sm text-text-muted">
                Go back and write your claim first — your thesis grows from it.
              </p>
            </div>
          )}

          <label className="block text-left">
            <span className="mb-2 block text-sm font-semibold text-text-primary">
              Your thesis
            </span>
            <textarea
              value={thesisStatement}
              onChange={(event) => setThesisStatement(event.target.value)}
              placeholder="One clear sentence that states your main argument"
              className="min-h-[110px] w-full rounded-lg border-2 border-theme-dark/20 bg-white p-3 text-sm text-text-primary focus:border-theme-dark focus:outline-none focus:ring-2 focus:ring-theme-dark/10"
            />
          </label>

          <div className="space-y-3 rounded-xl border border-theme-orange/20 bg-theme-orange/5 p-4 text-left">
            <p className="text-sm font-semibold text-text-primary">
              What will your essay need to prove?
            </p>
            <p className="text-sm text-text-muted">
              List up to three main directions of proof.
            </p>

            {proofPlan.map((line, index) => (
              <label key={`proof-plan-${index}`} className="block text-left">
                <span className="mb-1 block text-sm font-medium text-text-muted">
                  Direction {index + 1}
                </span>
                <textarea
                  value={line}
                  onChange={(event) => updateProofPlan(index, event.target.value)}
                  placeholder="One part your argument will need to explain"
                  className="min-h-[72px] w-full rounded-lg border border-border-soft bg-white p-3 text-sm text-text-primary"
                />
              </label>
            ))}
          </div>

          {safeText(thesisStatement) ? (
            <div className="rounded-xl border border-theme-green/25 bg-theme-green/5 px-4 py-4 text-left">
              <p className="text-sm font-semibold text-theme-green">
                You did it.
              </p>
              <p className="mt-1 text-sm text-text-muted">
                You have a thesis and the start of an essay plan. That is real progress.
              </p>
            </div>
          ) : null}
        </div>
      </ModuleThreeStepFrame>
    );
  }

  return (
    <div className="space-y-4 pb-6">
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

      {stepContent}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        {continueHint ? (
          <p className="text-sm text-text-muted">{continueHint}</p>
        ) : (
          <span />
        )}

        <div className="flex flex-wrap items-center justify-end gap-2">
        {currentStepIndex > 0 ? (
          <Button type="button" onClick={goBack} variant="secondary">
            {previousMove ? `Back` : "Previous"}
          </Button>
        ) : null}

        {!isLastStep ? (
          <Button
            type="button"
            onClick={goNext}
            disabled={!canGoNext}
            variant="primary"
          >
            {nextMove ? `Continue to ${nextMove.shortLabel}` : "Continue"}
          </Button>
        ) : null}
        </div>
      </div>
    </div>
  );
}
