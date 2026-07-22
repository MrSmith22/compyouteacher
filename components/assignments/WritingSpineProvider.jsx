"use client";

/**
 * WP-085 / WP-088 / WP-091 / WP-093 — Hydrate authoritative rollout modes for client gates.
 * Writing-spine (M4–7), evidence-argument (M2–3), vocabulary-transfer (M1),
 * and submission-protocol (M8–9) stay independent.
 *
 * Modes are also published via React context so student UI re-renders after
 * hydrate (module-level caches alone do not trigger React updates).
 */

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
  getEffectiveWritingSpineMode,
} from "@/lib/assignments/writingSpineModeCache";
import {
  setEvidenceArgumentModeCache,
  clearEvidenceArgumentModeCache,
  setEvidenceArgumentHydrateFailed,
  getEffectiveEvidenceArgumentMode,
} from "@/lib/assignments/evidenceArgumentModeCache";
import {
  setVocabularyTransferModeCache,
  clearVocabularyTransferModeCache,
  setVocabularyTransferHydrateFailed,
  getEffectiveVocabularyTransferMode,
} from "@/lib/assignments/vocabularyTransferModeCache";
import {
  setSubmissionProtocolModeCache,
  clearSubmissionProtocolModeCache,
  setSubmissionProtocolHydrateFailed,
  getEffectiveSubmissionProtocolMode,
} from "@/lib/assignments/submissionProtocolModeCache";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";

const AssignmentRolloutContext = createContext({
  writingSpineMode: null,
  evidenceArgumentMode: null,
  vocabularyTransferMode: null,
  submissionProtocolMode: null,
  hydrated: false,
});

export function useAssignmentRollout() {
  return useContext(AssignmentRolloutContext);
}

/** Prefer context mode when present; fall back to effective cache/resolver. */
export function useVocabularyTransferMode() {
  const ctx = useContext(AssignmentRolloutContext);
  if (ctx.vocabularyTransferMode) return ctx.vocabularyTransferMode;
  return getEffectiveVocabularyTransferMode();
}

/** Prefer context mode when present; fall back to effective cache/resolver. */
export function useSubmissionProtocolMode() {
  const ctx = useContext(AssignmentRolloutContext);
  if (ctx.submissionProtocolMode) return ctx.submissionProtocolMode;
  return getEffectiveSubmissionProtocolMode();
}

export default function WritingSpineProvider({ children }) {
  const { status } = useSession();
  const [ready, setReady] = useState(status !== "authenticated");
  const [modes, setModes] = useState({
    writingSpineMode: null,
    evidenceArgumentMode: null,
    vocabularyTransferMode: null,
    submissionProtocolMode: null,
  });

  useEffect(() => {
    if (status !== "authenticated") {
      clearWritingSpineModeCache();
      clearEvidenceArgumentModeCache();
      clearVocabularyTransferModeCache();
      clearSubmissionProtocolModeCache();
      setModes({
        writingSpineMode: null,
        evidenceArgumentMode: null,
        vocabularyTransferMode: null,
        submissionProtocolMode: null,
      });
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/assignment-rollout?assignmentId=${encodeURIComponent(DEFAULT_ASSIGNMENT_ID)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && json?.ok) {
          if (json?.mode) {
            setWritingSpineModeCache(json.mode);
          }
          // WP-088: schema_missing / config failure must not silently become "legacy".
          if (json?.evidenceArgumentSchemaOk === false) {
            if (process.env.NODE_ENV === "production") {
              setEvidenceArgumentHydrateFailed(true);
            }
          }
          if (json?.evidenceArgumentMode) {
            setEvidenceArgumentModeCache(json.evidenceArgumentMode);
          } else if (json?.schemaOk === false) {
            setEvidenceArgumentHydrateFailed(true);
          }

          // WP-091: always apply resolved mode when the API returns one
          // (ops override may yield rebuilt even while the column is missing).
          if (json?.vocabularyTransferMode) {
            setVocabularyTransferModeCache(json.vocabularyTransferMode);
          }

          // WP-093: Modules 8–9 submission protocol
          if (json?.submissionProtocolMode) {
            setSubmissionProtocolModeCache(json.submissionProtocolMode);
          }
          if (
            json?.submissionProtocolSchemaOk === false &&
            json?.submissionProtocolSource === "schema_missing" &&
            process.env.NODE_ENV === "production"
          ) {
            setSubmissionProtocolHydrateFailed(true);
          }

          setModes({
            writingSpineMode: json?.mode || getEffectiveWritingSpineMode(),
            evidenceArgumentMode:
              json?.evidenceArgumentMode || getEffectiveEvidenceArgumentMode(),
            vocabularyTransferMode:
              json?.vocabularyTransferMode ||
              getEffectiveVocabularyTransferMode(),
            submissionProtocolMode:
              json?.submissionProtocolMode ||
              getEffectiveSubmissionProtocolMode(),
          });
        } else {
          setEvidenceArgumentHydrateFailed(true);
          setVocabularyTransferHydrateFailed(true);
          setSubmissionProtocolHydrateFailed(true);
          console.warn("[wp093-rollout] client hydrate failed", json?.error || res.status);
        }
      } catch (err) {
        setEvidenceArgumentHydrateFailed(true);
        setVocabularyTransferHydrateFailed(true);
        setSubmissionProtocolHydrateFailed(true);
        console.warn("[wp085/wp088/wp091/wp093-rollout] client hydrate failed", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  const value = {
    ...modes,
    hydrated: ready,
  };

  return (
    <AssignmentRolloutContext.Provider value={value}>
      {children}
    </AssignmentRolloutContext.Provider>
  );
}
