"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  MODULE1_ADVANCE_STATES,
  MODULE1_ADVANCE_ERROR_MESSAGE,
  MODULE1_CONTINUE_HREF,
  MODULE1_CONTINUE_LABEL,
  MODULE1_SAVING_MESSAGE,
  canNavigateToModule2,
  canStartModule1Advancement,
  createModule1AdvancementController,
  interpretModule1AdvancementWrite,
} from "@/lib/module1/module1SuccessAdvancement";

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
  const params = useSearchParams();
  const scoreParam = params.get("score");
  const score = scoreParam && scoreParam !== "-" ? scoreParam : null;

  const [advanceState, setAdvanceState] = useState(
    MODULE1_ADVANCE_STATES.IDLE
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [lastFailureReason, setLastFailureReason] = useState("");
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
    setLastFailureReason("");

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
        setLastFailureReason(result?.reason || "write_failure");
        return;
      }

      setAdvanceState(MODULE1_ADVANCE_STATES.READY);
      setErrorMessage("");
      setLastFailureReason("");
    } catch {
      if (cancelledRef.current) return;
      setAdvanceState(MODULE1_ADVANCE_STATES.ERROR);
      setErrorMessage(MODULE1_ADVANCE_ERROR_MESSAGE);
      setLastFailureReason("write_failure");
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 1 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You explained what the essay is asking you to do and checked your
          understanding of ethos, pathos, and logos—the vocabulary you will use
          when you analyze King&apos;s speech and letter.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 2, you will save working copies of both texts and collect
          evidence you can build on—not start over.
        </p>

        {score ? (
          <p className="text-sm text-theme-dark">
            Quiz score:{" "}
            <span className="font-bold text-theme-blue">{score}%</span>
          </p>
        ) : null}

        {isSaving ? (
          <p
            className="text-sm text-theme-dark/80"
            data-testid="module1-advance-saving"
            aria-live="polite"
          >
            {MODULE1_SAVING_MESSAGE}
          </p>
        ) : null}

        {isError ? (
          <div className="space-y-3" data-testid="module1-advance-error">
            <p role="alert" className="text-sm text-theme-red">
              {errorMessage || MODULE1_ADVANCE_ERROR_MESSAGE}
            </p>
            {process.env.NODE_ENV === "development" && lastFailureReason ? (
              <p
                className="text-xs text-theme-dark/60"
                data-testid="module1-advance-reason"
              >
                Dev reason: {lastFailureReason}
              </p>
            ) : null}
            <button
              type="button"
              data-testid="module1-advance-retry"
              className="inline-block bg-theme-blue hover:bg-blue-800 text-white px-6 py-2 rounded shadow transition disabled:opacity-50"
              disabled={controllerRef.current.inFlight}
              onClick={() => {
                setAdvanceState(MODULE1_ADVANCE_STATES.ERROR);
                runAdvancement();
              }}
            >
              Try saving again
            </button>
          </div>
        ) : null}

        {continueEnabled ? (
          <Link
            href={MODULE1_CONTINUE_HREF}
            data-testid="module1-continue-module2"
            className="inline-block bg-theme-blue hover:bg-blue-800 text-white px-6 py-2 rounded shadow transition"
          >
            {MODULE1_CONTINUE_LABEL}
          </Link>
        ) : (
          <button
            type="button"
            disabled
            data-testid="module1-continue-module2-disabled"
            className="inline-block bg-gray-300 text-gray-600 px-6 py-2 rounded shadow cursor-not-allowed"
            aria-disabled="true"
          >
            {MODULE1_CONTINUE_LABEL}
          </button>
        )}
      </div>
    </div>
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
