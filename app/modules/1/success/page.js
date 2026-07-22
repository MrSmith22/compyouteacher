"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MODULE1_ADVANCE_STATES,
  MODULE1_ADVANCE_ERROR_MESSAGE,
  MODULE1_SAVING_MESSAGE,
  canNavigateToModule2,
  canStartModule1Advancement,
  createModule1AdvancementController,
  interpretModule1AdvancementWrite,
} from "@/lib/module1/module1SuccessAdvancement";
import { buildModule1SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * POST /api/module1/complete — session-authenticated server CAS.
 * Email is never sent from the client.
 */
async function requestModule1Completion() {
  const response = await fetch("/api/module1/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!payload || typeof payload !== "object") {
    return {
      ok: false,
      reason: "write_failure",
      error: { message: "Invalid completion response." },
    };
  }

  return {
    ok: Boolean(payload.ok),
    reason: payload.reason || (payload.ok ? "advanced" : "write_failure"),
    alreadyAdvanced: Boolean(payload.alreadyAdvanced),
    currentModule: payload.currentModule ?? null,
    attempts: payload.attempts ?? null,
    error: payload.ok
      ? null
      : { message: payload.error?.message || payload.reason || "failed" },
  };
}

/**
 * Module 1 success: save advancement via authenticated API before enabling Module 2.
 * Reload is idempotent (already-advanced counts as success).
 */
function Module1SuccessContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const scoreParam = params.get("score");
  const score = scoreParam && scoreParam !== "-" ? scoreParam : null;

  const [advanceState, setAdvanceState] = useState(
    MODULE1_ADVANCE_STATES.IDLE
  );
  const [errorMessage, setErrorMessage] = useState("");
  const controllerRef = useRef(createModule1AdvancementController());
  const cancelledRef = useRef(false);

  async function runAdvancement() {
    const email = session?.user?.email;
    if (!email) return;

    if (
      !canStartModule1Advancement(advanceState, {
        inFlight: controllerRef.current.inFlight,
      })
    ) {
      return;
    }

    const began = controllerRef.current.begin();
    if (!began.accepted) return;

    setAdvanceState(MODULE1_ADVANCE_STATES.SAVING);
    setErrorMessage("");

    try {
      const result = await requestModule1Completion();

      if (cancelledRef.current) return;

      const interpreted = interpretModule1AdvancementWrite({
        writeError: result?.ok ? null : result?.error || { message: "failed" },
        alreadyAdvanced: Boolean(result?.alreadyAdvanced),
        reason: result?.reason || "",
      });

      if (!interpreted.ok) {
        setAdvanceState(MODULE1_ADVANCE_STATES.ERROR);
        setErrorMessage(interpreted.message || MODULE1_ADVANCE_ERROR_MESSAGE);
        return;
      }

      setAdvanceState(MODULE1_ADVANCE_STATES.READY);
      setErrorMessage("");
    } catch {
      if (cancelledRef.current) return;
      setAdvanceState(MODULE1_ADVANCE_STATES.ERROR);
      setErrorMessage(MODULE1_ADVANCE_ERROR_MESSAGE);
    } finally {
      controllerRef.current.end(began.generation);
    }
  }

  useEffect(() => {
    cancelledRef.current = false;
    if (status === "loading") return;
    if (!session?.user?.email) {
      return;
    }
    runAdvancement();
    return () => {
      cancelledRef.current = true;
      controllerRef.current.reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email, status]);

  const continueEnabled = canNavigateToModule2(advanceState);
  const isSaving = advanceState === MODULE1_ADVANCE_STATES.SAVING;
  const isError = advanceState === MODULE1_ADVANCE_STATES.ERROR;

  const resolved = buildModule1SuccessExperience({
    quizScoreLabel: score ? `Check-in score: ${score}%` : null,
    conceptsCompleted: "Ethos, pathos, and logos ready for source reading",
    continueEnabled,
  });

  return (
    <SuccessExperienceShell
      experience={resolved.experience}
      headingId="module1-success-heading"
      primaryTestId="module1-continue-module2"
      statusMessage={
        isSaving
          ? MODULE1_SAVING_MESSAGE
          : isError
            ? errorMessage || MODULE1_ADVANCE_ERROR_MESSAGE
            : null
      }
      onPrimaryAction={(action) => {
        if (!action?.href || !continueEnabled) return;
        router.push(action.href);
      }}
    >
      {isError ? (
        <button
          type="button"
          data-testid="module1-advance-retry"
          className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white"
          disabled={controllerRef.current.inFlight}
          onClick={() => {
            setAdvanceState(MODULE1_ADVANCE_STATES.ERROR);
            runAdvancement();
          }}
        >
          Try saving again
        </button>
      ) : null}
    </SuccessExperienceShell>
  );
}

export default function Module1Success() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
          <p className="text-sm text-theme-dark/80">{MODULE1_SAVING_MESSAGE}</p>
        </div>
      }
    >
      <Module1SuccessContent />
    </Suspense>
  );
}
