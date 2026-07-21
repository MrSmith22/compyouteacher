"use client";

/**
 * WP-085 — Hydrate the authoritative writing-spine mode for client gates.
 */

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  setWritingSpineModeCache,
  clearWritingSpineModeCache,
} from "@/lib/assignments/writingSpineModeCache";
import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments/identity";

export default function WritingSpineProvider({ children }) {
  const { status } = useSession();
  const [ready, setReady] = useState(status !== "authenticated");

  useEffect(() => {
    if (status !== "authenticated") {
      clearWritingSpineModeCache();
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
        if (res.ok && json?.mode) {
          setWritingSpineModeCache(json.mode);
        }
      } catch (err) {
        console.warn("[wp085-rollout] client hydrate failed", err);
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
