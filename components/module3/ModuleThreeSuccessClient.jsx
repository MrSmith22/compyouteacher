"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  MODULE_THREE_SUCCESS_COMPLETED_MODULE,
  SUCCESS_PRIMARY_CTA_LABEL,
} from "@/lib/module3/moduleThreeSuccessHelpers";

function sourceAccentClass(sourceType) {
  if (sourceType === "letter") {
    return "border-l-[3px] border-l-theme-orange";
  }
  return "border-l-[3px] border-l-theme-blue";
}

export default function ModuleThreeSuccessClient({ summary }) {
  const { data: session } = useSession();
  const headingRef = useRef(null);

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: MODULE_THREE_SUCCESS_COMPLETED_MODULE,
    }).catch(() => {});
  }, [session?.user?.email]);

  useEffect(() => {
    headingRef.current?.focus?.();
  }, []);

  const thesis = summary?.thesis;
  const proofPlan = summary?.proofPlan;
  const evidence = summary?.evidence;
  const argumentMap = summary?.argumentMap;
  const argumentReady = Boolean(
    evidence?.bothWorksVerified && (!argumentMap?.available || argumentMap?.ready)
  );

  return (
    <div className="min-h-screen bg-theme-light px-4 py-10 text-theme-dark">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <header className="space-y-3 text-left">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            Module 3
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-extrabold leading-tight text-theme-green outline-none md:text-4xl"
          >
            Module 3 complete.
          </h1>
          <p className="text-base leading-relaxed text-theme-dark md:text-lg">
            {summary?.accomplishment}
          </p>
        </header>

        <section
          className="rounded-xl border border-border-soft/80 bg-white px-5 py-6 shadow-soft"
          aria-labelledby="argument-ready-heading"
          data-testid="module3-success-argument"
        >
          <h2
            id="argument-ready-heading"
            className="text-xl font-bold text-text-primary md:text-2xl"
          >
            {argumentReady
              ? "Your argument is ready for planning."
              : "Keep strengthening both works before you plan."}
          </h2>

          {argumentMap?.available ? (
            <section
              className="mt-6 space-y-4"
              aria-labelledby="success-argument-map-heading"
              data-testid="wp086-success-argument-map"
            >
              <h3
                id="success-argument-map-heading"
                className="text-base font-semibold text-text-primary md:text-lg"
              >
                The argument you earned.
              </h3>
              <ol className="list-decimal space-y-3 pl-5 text-sm text-text-primary">
                <li>
                  <span className="font-medium">Your comparison: </span>
                  {argumentMap.direction || "—"}
                  {argumentMap.familyLabel ? (
                    <span
                      className="mt-1 block text-xs text-text-muted"
                      data-testid="wp087-success-family"
                    >
                      {argumentMap.familyLabel}
                    </span>
                  ) : null}
                </li>
                <li>
                  <span className="font-medium">Speech evidence: </span>
                  {argumentMap.speechPassage
                    ? `“${argumentMap.speechPassage}”`
                    : "—"}
                  {argumentMap.speechExplanation ? (
                    <span className="mt-1 block text-text-muted">
                      {argumentMap.speechExplanation}
                    </span>
                  ) : null}
                </li>
                <li>
                  <span className="font-medium">Letter evidence: </span>
                  {argumentMap.letterPassage
                    ? `“${argumentMap.letterPassage}”`
                    : "—"}
                  {argumentMap.letterExplanation ? (
                    <span className="mt-1 block text-text-muted">
                      {argumentMap.letterExplanation}
                    </span>
                  ) : null}
                </li>
                <li>
                  <span className="font-medium">Your thesis: </span>
                  {argumentMap.thesis || "—"}
                </li>
                <li>
                  <span className="font-medium">How you will prove it: </span>
                  {(argumentMap.proofDirections || []).join(" · ") || "—"}
                </li>
              </ol>
            </section>
          ) : null}

          <div className="mt-6 space-y-6">
            <section aria-labelledby="success-thesis-heading">
              <h3
                id="success-thesis-heading"
                className="text-base font-semibold text-text-primary md:text-lg"
              >
                Your thesis.
              </h3>
              <p className="mt-1 text-sm text-text-muted">
                This is the main point your essay will work to prove.
              </p>
              {thesis?.available ? (
                <blockquote className="mt-3 rounded-xl border-2 border-theme-orange/35 bg-theme-orange/[0.06] px-4 py-4 text-base font-medium leading-relaxed text-text-primary whitespace-pre-wrap">
                  {thesis.text}
                </blockquote>
              ) : (
                <p
                  role="status"
                  className="mt-3 rounded-lg border border-border-soft bg-surface-soft/60 px-4 py-3 text-sm text-text-muted"
                >
                  {thesis?.fallback}
                </p>
              )}
            </section>

            <section aria-labelledby="success-proof-heading">
              <h3
                id="success-proof-heading"
                className="text-base font-semibold text-text-primary md:text-lg"
              >
                What your essay will need to show.
              </h3>
              {proofPlan?.empty ? (
                <p
                  role="status"
                  className="mt-3 rounded-lg border border-border-soft bg-surface-soft/60 px-4 py-3 text-sm text-text-muted"
                >
                  {proofPlan.emptyFallback}
                </p>
              ) : (
                <>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    {proofPlan?.compatNote}
                  </p>
                  <ol className="mt-3 space-y-3">
                    {(proofPlan?.items || []).map((item) => (
                      <li
                        key={`proof-slot-${item.slotIndex}`}
                        className="rounded-xl border border-border-soft/80 bg-surface-soft/40 px-4 py-3"
                      >
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                          {item.label}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-primary">
                          {item.text}
                        </p>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </section>

            <section aria-labelledby="success-evidence-heading">
              <h3
                id="success-evidence-heading"
                className="text-base font-semibold text-text-primary md:text-lg"
              >
                Your evidence foundation.
              </h3>
              {evidence?.speechCount > 0 || evidence?.letterCount > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {evidence.speechCount > 0 ? (
                    <li
                      className={`rounded-lg border border-theme-blue/25 bg-theme-blue/[0.05] px-3 py-3 text-sm text-text-primary ${sourceAccentClass(
                        "speech"
                      )}`}
                    >
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-theme-blue">
                        Speech
                      </span>
                      <span className="mt-1 block">{evidence.speechSummary}</span>
                    </li>
                  ) : null}
                  {evidence.letterCount > 0 ? (
                    <li
                      className={`rounded-lg border border-theme-orange/25 bg-theme-orange/[0.05] px-3 py-3 text-sm text-text-primary ${sourceAccentClass(
                        "letter"
                      )}`}
                    >
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-theme-orange">
                        Letter
                      </span>
                      <span className="mt-1 block">{evidence.letterSummary}</span>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <p
                role="status"
                className="mt-3 text-sm leading-relaxed text-text-muted"
                data-testid="module3-success-both-works"
              >
                {evidence?.bothWorksVerified
                  ? evidence.confirmedMessage
                  : evidence?.oneWorkNotReadyMessage ||
                    evidence?.unverifiedMessage}
              </p>
            </section>

            <section aria-labelledby="success-assignment-heading">
              <h3
                id="success-assignment-heading"
                className="text-base font-semibold text-text-primary md:text-lg"
              >
                How this fits the assignment.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {summary?.assignmentConnection}
              </p>
            </section>
          </div>
        </section>

        <section
          className="rounded-xl border-2 border-theme-blue/25 bg-white px-5 py-6 shadow-soft"
          aria-labelledby="module4-handoff-heading"
        >
          <h2
            id="module4-handoff-heading"
            className="text-xl font-bold text-text-primary md:text-2xl"
          >
            What happens in Module 4.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-text-muted md:text-base">
            {summary?.module4Handoff}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:items-start">
            <Link
              href={summary?.module4Href || "/modules/4"}
              className="inline-flex w-full items-center justify-center rounded-xl bg-theme-blue px-6 py-3 text-center text-base font-semibold text-white shadow-soft transition hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-theme-blue/25 sm:w-auto"
            >
              {summary?.primaryCtaLabel || SUCCESS_PRIMARY_CTA_LABEL}
            </Link>
            <Link
              href={summary?.reviewHref || "/modules/3"}
              className="text-sm font-medium text-theme-blue underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-theme-blue/30"
            >
              {summary?.secondaryReviewLabel || "Review Module 3 work"}
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
