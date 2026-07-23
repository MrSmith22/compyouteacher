"use client";

/**
 * WP-087 — Module 3 flow for any gated WP-079 direction (dev-only).
 * Mounted by ModuleThreeV2Form when the development gate is active.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import Button from "@/components/ui/Button";
import EvidenceArgumentSlicePanel, {
  canContinueEvidenceArgumentStep,
} from "@/components/module3/EvidenceArgumentSlicePanel";
import {
  EVIDENCE_ARGUMENT_STEPS,
  createEmptyEvidenceArgumentSliceState,
  adaptLegacyModule3Prose,
  toEvidenceArgumentRecord,
  assembleModule4HandoffFromSlice,
  normalizeEvidenceArgumentSliceState,
  resolveEvidencePairForDirection,
} from "@/lib/artifacts/evidenceArgumentContract";
import { buildEvidenceArgumentDirectionDescriptor } from "@/lib/module2/evidenceArgumentDirectionDescriptor";
import { normalizeEvidenceReader } from "@/lib/module2/normalizeEvidenceReader";
import { evidenceIdsMatch } from "@/lib/shared/evidenceIdAliases";

function safeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default function EvidenceArgumentSliceFlow({
  selectedDirectionLabel = "",
  selectedOptionId = "",
  selectedDirectionSignature = "",
  matrixProvenance = null,
  customMapping = null,
  matrixBundle = null,
  selectedPattern = null,
  initialClaimText = "",
  initialThesisText = "",
  initialProofPlan = [],
  initialPatternText = "",
}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const email = session?.user?.email;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [speechText, setSpeechText] = useState("");
  const [letterText, setLetterText] = useState("");
  const [records, setRecords] = useState([]);
  const [slice, setSlice] = useState(() => createEmptyEvidenceArgumentSliceState());

  const descriptor = useMemo(
    () =>
      buildEvidenceArgumentDirectionDescriptor({
        optionId: selectedOptionId,
        matrixBundle,
        customMapping: customMapping || slice.customMapping,
        signature: selectedDirectionSignature,
        customLabel: selectedDirectionLabel,
        selectedPattern: selectedPattern || {
          optionId: selectedOptionId,
          label: selectedDirectionLabel,
          customMapping,
        },
      }),
    [
      selectedOptionId,
      matrixBundle,
      customMapping,
      slice.customMapping,
      selectedDirectionSignature,
      selectedDirectionLabel,
      selectedPattern,
    ]
  );

  const load = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    setError("");
    try {
      const [sliceRes, sourcesRes, guidedRes, tchartRes] = await Promise.all([
        fetch("/api/module3/evidence-argument-slice"),
        fetch("/api/module2/sources"),
        fetch("/api/module2/observations/guided"),
        fetch("/api/tchart/entries"),
      ]);

      const sliceJson = await sliceRes.json().catch(() => ({}));
      const sourcesJson = await sourcesRes.json().catch(() => ({}));
      const guidedJson = guidedRes.ok
        ? await guidedRes.json().catch(() => ({}))
        : {};
      const guidedRows =
        guidedJson?.ok && Array.isArray(guidedJson.data) ? guidedJson.data : [];
      const tchartJson = tchartRes.ok
        ? await tchartRes.json().catch(() => ({}))
        : {};
      const tchartRows = Array.isArray(tchartJson?.data) ? tchartJson.data : [];

      const speech = safeText(sourcesJson?.speech_full_text || sourcesJson?.mlk_text);
      const letter = safeText(sourcesJson?.letter_full_text || sourcesJson?.lfbj_text);
      setSpeechText(speech);
      setLetterText(letter);

      const normalized = normalizeEvidenceReader({ tchartRows, guidedRows }).map(
        (row) =>
          toEvidenceArgumentRecord(row, {
            speechText: speech,
            letterText: letter,
            selectedDirectionId: selectedOptionId,
            selectedDirectionSignature,
          })
      );
      setRecords(normalized.filter(Boolean));

      const savedSlice =
        sliceJson?.ok && sliceJson.slice
          ? sliceJson.slice
          : createEmptyEvidenceArgumentSliceState();

      const adapted = adaptLegacyModule3Prose({
        claimText: initialClaimText,
        thesisText: initialThesisText,
        proofPlan: initialProofPlan,
        patternText: initialPatternText,
        existingSlice: savedSlice,
      });

      const normalizedSlice = normalizeEvidenceArgumentSliceState(adapted.slice, {
        optionId: selectedOptionId,
        matrixBundle,
        evidenceRecords: normalized,
        customMapping,
        signature: selectedDirectionSignature,
        selectedPattern: selectedPattern || {
          optionId: selectedOptionId,
          label: selectedDirectionLabel,
          customMapping,
        },
      });

      if (!normalizedSlice.upstreamSignature && selectedDirectionSignature) {
        normalizedSlice.upstreamSignature = selectedDirectionSignature;
        if (!normalizedSlice.needsDirectionReview) {
          normalizedSlice.reviewedUpstreamSignature = selectedDirectionSignature;
        }
      }

      setSlice(normalizedSlice);
    } catch (err) {
      setError(err?.message || "Could not load the comparison workspace.");
    } finally {
      setLoading(false);
    }
  }, [
    email,
    selectedOptionId,
    selectedDirectionSignature,
    selectedDirectionLabel,
    customMapping,
    matrixBundle,
    selectedPattern,
    initialClaimText,
    initialThesisText,
    initialProofPlan,
    initialPatternText,
  ]);

  useEffect(() => {
    if (status === "authenticated" && email) {
      load();
    }
  }, [status, email, load]);

  const paired = useMemo(
    () =>
      resolveEvidencePairForDirection({
        descriptor,
        matrixBundle,
        evidenceRecords: records,
        priorSpeechId: slice.speechEvidenceId,
        priorLetterId: slice.letterEvidenceId,
        customMapping: customMapping || slice.customMapping,
      }),
    [
      descriptor,
      matrixBundle,
      records,
      slice.speechEvidenceId,
      slice.letterEvidenceId,
      customMapping,
      slice.customMapping,
    ]
  );

  const speechEvidence = useMemo(() => {
    if (slice.speechEvidenceId) {
      const hit = records.find((r) =>
        evidenceIdsMatch(r.id, slice.speechEvidenceId)
      );
      if (hit) return hit;
    }
    return paired.speech || null;
  }, [records, slice.speechEvidenceId, paired.speech]);

  const letterEvidence = useMemo(() => {
    if (slice.letterEvidenceId) {
      const hit = records.find((r) =>
        evidenceIdsMatch(r.id, slice.letterEvidenceId)
      );
      if (hit) return hit;
    }
    return paired.letter || null;
  }, [records, slice.letterEvidenceId, paired.letter]);

  const speechCandidates = useMemo(() => {
    if (descriptor.speechAppeal) {
      return records.filter(
        (r) =>
          r.sourceKind === "speech" &&
          r.rhetoricalChoice === descriptor.speechAppeal
      );
    }
    return paired.speechCandidates || records.filter((r) => r.sourceKind === "speech");
  }, [records, descriptor.speechAppeal, paired.speechCandidates]);

  const letterCandidates = useMemo(() => {
    if (descriptor.letterAppeal) {
      return records.filter(
        (r) =>
          r.sourceKind === "letter" &&
          r.rhetoricalChoice === descriptor.letterAppeal
      );
    }
    return paired.letterCandidates || records.filter((r) => r.sourceKind === "letter");
  }, [records, descriptor.letterAppeal, paired.letterCandidates]);

  const stepIndex = EVIDENCE_ARGUMENT_STEPS.findIndex(
    (s) => s.id === slice.currentStep
  );
  const safeIndex = stepIndex >= 0 ? stepIndex : 0;
  const stepId = EVIDENCE_ARGUMENT_STEPS[safeIndex].id;
  const isLast = safeIndex === EVIDENCE_ARGUMENT_STEPS.length - 1;

  const canContinue = canContinueEvidenceArgumentStep({
    stepId,
    slice,
    speechEvidence,
    letterEvidence,
    speechText,
    letterText,
    selectedOptionId,
    selectedDirectionSignature,
    directionDescriptor: descriptor,
  });

  async function persist(nextSlice, { syncThesis = false } = {}) {
    setSaving(true);
    setError("");
    try {
      const withDescriptor = {
        ...nextSlice,
        directionDescriptor: descriptor,
        customMapping:
          descriptor.family === "student_created"
            ? customMapping || nextSlice.customMapping
            : null,
      };
      const res = await fetch("/api/module3/evidence-argument-slice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slice: withDescriptor,
          syncThesis,
          matrixProvenance,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        throw new Error(json.error || "Save failed");
      }
      setSlice(json.slice || withDescriptor);
      return true;
    } catch (err) {
      setError(err?.message || "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleContinue() {
    if (!canContinue || saving) return;
    if (isLast) {
      const handoff = assembleModule4HandoffFromSlice(slice);
      const next = {
        ...slice,
        thesisText: handoff.thesis,
        argumentMapConfirmed: true,
        needsDirectionReview: false,
        reviewedUpstreamSignature:
          selectedDirectionSignature || slice.upstreamSignature,
      };
      const ok = await persist(next, { syncThesis: true });
      if (ok) router.push("/modules/3/success");
      return;
    }
    const nextStep = EVIDENCE_ARGUMENT_STEPS[safeIndex + 1].id;
    await persist({ ...slice, currentStep: nextStep });
  }

  async function handleBack() {
    if (safeIndex <= 0 || saving) return;
    const returnStep = slice.repairReturnStep;
    if (returnStep && stepId === "ea_repair") {
      await persist({
        ...slice,
        currentStep: returnStep,
        repairReturnStep: null,
      });
      return;
    }
    const prev = EVIDENCE_ARGUMENT_STEPS[safeIndex - 1].id;
    await persist({ ...slice, currentStep: prev });
  }

  if (loading) {
    return (
      <ModulePageShell>
        <WorkspaceCenter>
          <p className="text-sm text-text-muted">Loading your comparison…</p>
        </WorkspaceCenter>
      </ModulePageShell>
    );
  }

  return (
    <ModulePageShell>
      <WorkspaceCenter className="max-w-4xl space-y-4">
        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <EvidenceArgumentSlicePanel
          stepId={stepId}
          slice={slice}
          onChangeSlice={(next) => setSlice(next)}
          speechEvidence={speechEvidence}
          letterEvidence={letterEvidence}
          speechText={speechText}
          letterText={letterText}
          selectedDirectionLabel={selectedDirectionLabel || descriptor.label}
          selectedOptionId={selectedOptionId}
          selectedDirectionSignature={selectedDirectionSignature}
          directionDescriptor={descriptor}
          speechCandidates={speechCandidates}
          letterCandidates={letterCandidates}
          legacyClaimForReview={slice.legacyClaimForReview || initialClaimText}
        />

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={safeIndex <= 0 || saving}
          >
            Back
          </Button>
          <Button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue || saving}
            data-testid="wp086-continue"
          >
            {saving ? "Saving…" : isLast ? "Finish Module 3" : "Continue"}
          </Button>
        </div>
        <p className="text-xs text-text-muted" aria-live="polite">
          Step {safeIndex + 1} of {EVIDENCE_ARGUMENT_STEPS.length}. Continue
          saves your place — length alone never advances a step.
        </p>
      </WorkspaceCenter>
    </ModulePageShell>
  );
}
