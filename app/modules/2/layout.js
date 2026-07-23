"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Panel from "@/components/ui/Panel";
import { isPathAllowedForModule } from "@/lib/supabase/helpers/moduleGate";
import {
  isModule2AnalysisPhasePath,
  isModule2SourcePreparationComplete,
} from "@/lib/module2/module2SourceReadiness";
import {
  getModule2AnalysisAccessDecision,
  readRhetoricalSituationDevBypassFlag,
} from "@/lib/module2/rhetoricalSituationGate";
import {
  MODULE2_DENIED_MESSAGE,
  MODULE2_ENTRY_GATE_STATES,
  MODULE2_ENTRY_RECHECK,
  MODULE2_GATE_ERROR_MESSAGE,
  MODULE2_SAFE_DENIAL_PATH,
  MODULE2_WAITING_MESSAGE,
  interpretModule2EntryAccess,
  resolveAnalysisPhaseRedirect,
  resolveModule2WaitingExhausted,
  shouldRecheckModule2Entry,
} from "@/lib/module2/module2EntryGate";

/**
 * Module 2 family gate.
 * Never redirects `/modules/2` → `/modules/2`.
 * Distinguishes checking / allowed / waiting_for_progress / denied / error.
 */
export default function ModuleTwoLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gateState, setGateState] = useState(MODULE2_ENTRY_GATE_STATES.CHECKING);
  const [gateMessage, setGateMessage] = useState("");
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) {
      // Stay on checking only while NextAuth is still resolving.
      // Unauthenticated must not infinite-spin as CHECKING.
      if (status === "unauthenticated") {
        setGateState(MODULE2_ENTRY_GATE_STATES.DENIED);
        setGateMessage(MODULE2_DENIED_MESSAGE);
      } else {
        setGateState(MODULE2_ENTRY_GATE_STATES.CHECKING);
      }
      return;
    }
    if (!pathname?.startsWith("/modules/2")) {
      setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
      return;
    }

    let cancelled = false;
    let recheckTimer = null;

    async function readCurrentModule() {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);
        const res = await fetch("/api/assignments/progress", {
          method: "GET",
          headers: { Accept: "application/json" },
          cache: "no-store",
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) {
          return { fetchError: true, currentModule: 0 };
        }
        const payload = await res.json();
        return {
          fetchError: false,
          currentModule:
            typeof payload?.currentModule === "number"
              ? payload.currentModule
              : 0,
        };
      } catch {
        return { fetchError: true, currentModule: 0 };
      }
    }

    async function evaluateAnalysisPhase() {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      try {
        const statusRes = await fetch("/api/module2/rhetorical-situation-status", {
          signal: controller.signal,
          cache: "no-store",
        });
        if (cancelled) return;

        if (!statusRes.ok) {
          const res = await fetch("/api/module2/sources", {
            signal: controller.signal,
            cache: "no-store",
          });
          if (cancelled) return;
          const sourceData = res.ok ? await res.json() : null;
          const sourcesOk = isModule2SourcePreparationComplete(sourceData);
          const access = getModule2AnalysisAccessDecision({
            sourcesReady: sourcesOk,
            lessonSatisfied:
              sourcesOk && readRhetoricalSituationDevBypassFlag(),
          });
          if (!access.allowed) {
            const target = resolveAnalysisPhaseRedirect({
              pathname,
              proposedRedirect: access.redirectTo || "/modules/2",
            });
            if (target) {
              router.replace(target);
              setGateState(MODULE2_ENTRY_GATE_STATES.DENIED);
              setGateMessage(access.message || MODULE2_DENIED_MESSAGE);
              return;
            }
            // Already on the corrective destination — render it.
            setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
            return;
          }
          setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
          return;
        }

        const statusData = await statusRes.json();
        if (cancelled) return;
        const lessonSatisfied =
          Boolean(statusData.lessonComplete) ||
          readRhetoricalSituationDevBypassFlag();
        const access = getModule2AnalysisAccessDecision({
          sourcesReady: Boolean(statusData.sourcesReady),
          lessonSatisfied,
        });

        if (!access.allowed) {
          const target = resolveAnalysisPhaseRedirect({
            pathname,
            proposedRedirect: access.redirectTo || "/modules/2",
          });
          if (target) {
            router.replace(target);
            setGateState(MODULE2_ENTRY_GATE_STATES.DENIED);
            setGateMessage(access.message || MODULE2_DENIED_MESSAGE);
            return;
          }
          setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
          return;
        }

        setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
      } catch {
        if (!cancelled) {
          setGateState(MODULE2_ENTRY_GATE_STATES.ERROR);
          setGateMessage(MODULE2_GATE_ERROR_MESSAGE);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    }

    async function runGate(attempt = 0) {
      try {
        setGateState(
          attempt === 0
            ? MODULE2_ENTRY_GATE_STATES.CHECKING
            : MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS
        );
        if (attempt > 0) {
          setGateMessage(MODULE2_WAITING_MESSAGE);
        }

        const { fetchError, currentModule } = await readCurrentModule();
        if (cancelled) return;

        const entry = interpretModule2EntryAccess({
          currentModule,
          minModule: 2,
          fetchError,
        });

        if (entry.state === MODULE2_ENTRY_GATE_STATES.ERROR) {
          setGateState(MODULE2_ENTRY_GATE_STATES.ERROR);
          setGateMessage(entry.message || MODULE2_GATE_ERROR_MESSAGE);
          return;
        }

        if (entry.state === MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS) {
          if (
            shouldRecheckModule2Entry({
              state: entry.state,
              attempt: attempt + 1,
              maxAttempts: MODULE2_ENTRY_RECHECK.maxAttempts,
            })
          ) {
            setGateState(MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS);
            setGateMessage(MODULE2_WAITING_MESSAGE);
            recheckTimer = setTimeout(() => {
              if (!cancelled) runGate(attempt + 1);
            }, MODULE2_ENTRY_RECHECK.intervalMs);
            return;
          }

          const denied = resolveModule2WaitingExhausted({ pathname });
          setGateState(denied.state);
          setGateMessage(denied.message);
          if (denied.redirectTo) {
            router.replace(denied.redirectTo);
          }
          return;
        }

        // Family access allowed — optionally enforce analysis-phase readiness.
        const moduleOk = isPathAllowedForModule(pathname, currentModule);
        if (!moduleOk) {
          const denied = resolveModule2WaitingExhausted({ pathname });
          setGateState(denied.state);
          setGateMessage(denied.message);
          if (denied.redirectTo) {
            router.replace(denied.redirectTo);
          }
          return;
        }

        if (isModule2AnalysisPhasePath(pathname)) {
          await evaluateAnalysisPhase();
          return;
        }

        setGateState(MODULE2_ENTRY_GATE_STATES.ALLOWED);
        setGateMessage("");
      } catch {
        if (!cancelled) {
          setGateState(MODULE2_ENTRY_GATE_STATES.ERROR);
          setGateMessage(MODULE2_GATE_ERROR_MESSAGE);
        }
      }
    }

    runGate(0);

    return () => {
      cancelled = true;
      if (recheckTimer) clearTimeout(recheckTimer);
    };
  }, [pathname, session?.user?.email, status, router, retryToken]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <Panel className="max-w-md w-full space-y-3 text-center">
          <h1 className="text-xl font-bold text-theme-dark">Please sign in</h1>
          <p className="text-sm text-theme-dark/80">
            Sign in to access Module 2 activities.
          </p>
          <a
            href="/api/auth/signin"
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
          >
            Sign in
          </a>
        </Panel>
      </div>
    );
  }

  if (
    pathname?.startsWith("/modules/2") &&
    gateState === MODULE2_ENTRY_GATE_STATES.CHECKING
  ) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80" data-testid="module2-gate-checking">
          Loading…
        </p>
      </div>
    );
  }

  if (
    pathname?.startsWith("/modules/2") &&
    gateState === MODULE2_ENTRY_GATE_STATES.WAITING_FOR_PROGRESS
  ) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <Panel className="max-w-md w-full space-y-3 text-center">
          <p
            className="text-sm text-theme-dark/80"
            data-testid="module2-gate-waiting"
            aria-live="polite"
          >
            {gateMessage || MODULE2_WAITING_MESSAGE}
          </p>
        </Panel>
      </div>
    );
  }

  if (
    pathname?.startsWith("/modules/2") &&
    gateState === MODULE2_ENTRY_GATE_STATES.ERROR
  ) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <Panel className="max-w-md w-full space-y-4 text-center">
          <p
            role="alert"
            className="text-sm text-theme-red"
            data-testid="module2-gate-error"
          >
            {gateMessage || MODULE2_GATE_ERROR_MESSAGE}
          </p>
          <button
            type="button"
            data-testid="module2-gate-retry"
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            onClick={() => setRetryToken((n) => n + 1)}
          >
            Retry
          </button>
        </Panel>
      </div>
    );
  }

  if (
    pathname?.startsWith("/modules/2") &&
    gateState === MODULE2_ENTRY_GATE_STATES.DENIED
  ) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <Panel className="max-w-md w-full space-y-4 text-center">
          <p
            role="alert"
            className="text-sm text-theme-dark"
            data-testid="module2-gate-denied"
          >
            {gateMessage || MODULE2_DENIED_MESSAGE}
          </p>
          <Link
            href={MODULE2_SAFE_DENIAL_PATH}
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            data-testid="module2-gate-return-success"
          >
            Return to Module 1 success
          </Link>
        </Panel>
      </div>
    );
  }

  return <>{children}</>;
}
