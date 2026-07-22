"use client";

/**
 * WP-085 / WP-088 — Hydrate authoritative rollout modes for client gates.
 * Writing-spine (M4–7) and evidence-argument (M2–3) stay independent.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
} from "@/lib/assignments/writingSpineModeCache";
import {
  setEvidenceArgumentModeCache,
  clearEvidenceArgumentModeCache,
  setEvidenceArgumentHydrateFailed,
} from "@/lib/assignments/evidenceArgumentModeCache";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";

export default function WritingSpineProvider({ children }) {
  const { status } = useSession();
  const [ready, setReady] = useState(status !== "authenticated");

  useEffect(() => {
    if (status !== "authenticated") {
      clearWritingSpineModeCache();
      clearEvidenceArgumentModeCache();
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
          // Leave cache empty so development DX default (rebuilt) still works locally
          // until the migration is applied; production shows recoverable failure.
          if (json?.evidenceArgumentSchemaOk === false) {
            if (process.env.NODE_ENV === "production") {
              setEvidenceArgumentHydrateFailed(true);
            }
          } else if (json?.evidenceArgumentMode) {
            setEvidenceArgumentModeCache(json.evidenceArgumentMode);
          } else if (json?.schemaOk === false) {
            setEvidenceArgumentHydrateFailed(true);
          }
        } else {
          setEvidenceArgumentHydrateFailed(true);
          console.warn("[wp088-rollout] client hydrate failed", json?.error || res.status);
        }
      } catch (err) {
        setEvidenceArgumentHydrateFailed(true);
        console.warn("[wp085/wp088-rollout] client hydrate failed", err);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  // Do not block the tree on hydrate — gates use DX/safe defaults until cache fills.
  void ready;
  return children;
}
