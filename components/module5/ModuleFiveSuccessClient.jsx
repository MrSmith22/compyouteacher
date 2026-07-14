"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { getOutlineRow } from "@/lib/artifacts/readArtifactsClient";
import {
  MODULE5_SUCCESS_COMPLETED_MODULE,
  MODULE5_SUCCESS_LAYOUT_CONTRACT,
  MODULE5_SUCCESS_STAGES,
  buildModule5SuccessSummary,
  getModule5SuccessStageMeta,
  resolveModule5SuccessAdvance,
  resolveModule5SuccessBack,
} from "@/lib/module5/module5SuccessHelpers";

/**
 * CP-H Module 5 success — staged read-only artifact map.
 * Progression advance is allowed; outline/prose writes are not.
 */
export default function ModuleFiveSuccessClient() {
  const { data: session } = useSession();
  const headingRef = useRef(null);
  const [stage, setStage] = useState(MODULE5_SUCCESS_STAGES.CELEBRATE);
  const [summary, setSummary] = useState(null);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getOutlineRow(5);
      if (cancelled) return;
      if (!result.ok) {
        setSummary(buildModule5SuccessSummary({ readFailed: true }));
        setLoadError(result.error?.message || "Load failed");
        return;
      }
      setSummary(
        buildModule5SuccessSummary({
          outlineRow: result.data,
          readFailed: false,
        })
      );
      setLoadError("");
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || !summary || summary.incomplete) {
      if (summary && !summary.incomplete) setReady(false);
      return;
    }
    advanceCurrentModuleOnSuccess({
      userEmail: email,
      completedModuleNumber: MODULE5_SUCCESS_COMPLETED_MODULE,
    })
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [session?.user?.email, summary]);

  useEffect(() => {
    headingRef.current?.focus?.();
  }, [stage, summary?.incomplete]);

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your outline summary…
        </p>
      </div>
    );
  }

  if (summary.incomplete) {
    return (
      <div
        className="min-h-screen overflow-x-hidden bg-theme-light px-4 py-10 text-theme-dark"
        data-cph-layout={MODULE5_SUCCESS_LAYOUT_CONTRACT.viewports.join("-")}
      >
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <header className="space-y-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Module 5
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-extrabold leading-tight outline-none md:text-4xl"
            >
              {summary.readFailed ? "Could not load your outline" : "Finish your outline"}
            </h1>
            <p
              role="status"
              className="rounded-lg border border-theme-orange/35 bg-theme-orange/5 px-4 py-3 text-sm leading-relaxed"
            >
              {summary.incompleteMessage}
              {loadError ? ` (${loadError})` : ""}
            </p>
          </header>
          <Link
            href={summary.primaryHref}
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-xl bg-theme-blue px-6 py-3 text-center text-base font-semibold text-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark sm:w-auto"
          >
            {summary.primaryLabel}
          </Link>
        </div>
      </div>
    );
  }

  const meta = getModule5SuccessStageMeta(stage);

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-theme-light px-4 py-8 text-theme-dark md:py-10"
      data-cph-layout={MODULE5_SUCCESS_LAYOUT_CONTRACT.viewports.join("-")}
    >
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
            {meta.eyebrow}
          </p>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-3xl font-extrabold leading-tight text-theme-green outline-none md:text-4xl"
          >
            {meta.heading}
          </h1>
        </header>

        {stage === MODULE5_SUCCESS_STAGES.CELEBRATE ? (
          <section
            className="space-y-4"
            aria-label="What you accomplished"
            data-testid="module-role-transition"
            data-from-module="5"
            data-to-module="6"
            data-presentation="reuse"
          >
            <p className="text-base leading-relaxed md:text-lg">{summary.accomplishment}</p>
            <div className="rounded-xl border border-theme-blue/25 bg-white px-4 py-3 shadow-soft">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-theme-blue">
                Your thesis · saved
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-base font-medium">
                {summary.thesis.text}
              </p>
            </div>
            <p className="text-sm text-text-muted">
              {summary.bodyCards.length} body section
              {summary.bodyCards.length === 1 ? "" : "s"} ready for drafting
              {summary.conclusion.available ? " · conclusion notes saved" : ""}
            </p>
          </section>
        ) : null}

        {stage === MODULE5_SUCCESS_STAGES.EXPLORE ? (
          <section className="space-y-3" aria-label="Outline artifact map">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {summary.bodyCards.map((card, index) => (
                <li
                  key={card.id}
                  className="rounded-xl border border-border-soft bg-white px-4 py-3 shadow-soft"
                  aria-label={card.ariaLabel}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                    Body {index + 1}
                    {card.job ? " · job saved" : ""}
                  </p>
                  <p className="mt-1 text-sm font-semibold break-words">{card.title}</p>
                  {card.job ? (
                    <p className="mt-1 text-xs text-text-muted break-words">Job: {card.job}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-text-muted">
                    {card.evidenceCount} evidence item
                    {card.evidenceCount === 1 ? "" : "s"}
                    {card.hasReasoning ? " · reasoning saved" : ""}
                  </p>
                </li>
              ))}
            </ul>
            {summary.conclusion.available ? (
              <div className="rounded-xl border border-border-soft bg-white px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  Conclusion notes
                </p>
                {summary.conclusion.summary ? (
                  <p className="mt-1 text-sm break-words">{summary.conclusion.summary}</p>
                ) : null}
                {summary.conclusion.finalThought ? (
                  <p className="mt-1 text-sm break-words">{summary.conclusion.finalThought}</p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {stage === MODULE5_SUCCESS_STAGES.HANDOFF ? (
          <section className="space-y-3" aria-label="What comes next">
            <p className="text-base leading-relaxed">{summary.handoff}</p>
            <p className="text-sm text-text-muted">
              Module 6 expects about {summary.expectedDraftSections} prose sections from this
              outline.
            </p>
            {!ready ? (
              <p className="text-sm text-text-muted" role="status">
                Saving your progress…
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {stage !== MODULE5_SUCCESS_STAGES.CELEBRATE ? (
              <button
                type="button"
                className="min-h-[44px] rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark"
                onClick={() => setStage(resolveModule5SuccessBack(stage).stage)}
              >
                Back
              </button>
            ) : (
              <Link
                href={summary.secondaryHref}
                className="inline-flex min-h-[44px] items-center rounded-lg px-3 text-sm font-semibold text-theme-blue underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark"
              >
                {summary.secondaryLabel}
              </Link>
            )}
          </div>
          <div>
            {stage === MODULE5_SUCCESS_STAGES.HANDOFF ? (
              <Link
                href={summary.primaryHref}
                aria-disabled={!ready}
                className={`inline-flex min-h-[44px] items-center rounded-lg bg-theme-blue px-4 py-2 font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark ${
                  ready ? "" : "pointer-events-none opacity-50"
                }`}
              >
                {meta.primaryActionLabel}
              </Link>
            ) : (
              <button
                type="button"
                className="min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark"
                onClick={() => {
                  const next = resolveModule5SuccessAdvance(stage);
                  if (!next.exit) setStage(next.stage);
                }}
              >
                {meta.primaryActionLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
