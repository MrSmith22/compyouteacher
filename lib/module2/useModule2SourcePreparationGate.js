"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { isModule2SourcePreparationComplete } from "@/lib/module2/module2SourceReadiness";

/**
 * Defensive gate: redirect to Module 2 when persisted source texts are incomplete.
 * Used on analysis-phase routes and later modules that assume both texts exist.
 */
export function useModule2SourcePreparationGate({
  redirectTo = "/modules/2",
  enabled = true,
} = {}) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [state, setState] = useState({ loading: true, ready: false });

  useEffect(() => {
    if (!enabled) {
      setState({ loading: false, ready: true });
      return;
    }

    if (status === "loading") return;

    if (!session?.user?.email) {
      setState({ loading: false, ready: false });
      return;
    }

    let cancelled = false;
    setState({ loading: true, ready: false });

    fetch("/api/module2/sources")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        const ready = isModule2SourcePreparationComplete(data);
        if (!ready) {
          router.replace(redirectTo);
        }
        setState({ loading: false, ready });
      })
      .catch(() => {
        if (cancelled) return;
        router.replace(redirectTo);
        setState({ loading: false, ready: false });
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, session?.user?.email, status, router, redirectTo]);

  return state;
}
