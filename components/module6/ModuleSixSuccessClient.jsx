"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  getModule6DraftRow,
  getOutlineRow,
} from "@/lib/artifacts/readArtifactsClient";
import {
  MODULE6_SUCCESS_COMPLETED_MODULE,
  MODULE6_SUCCESS_LAYOUT_CONTRACT,
  MODULE6_SUCCESS_STAGES,
  buildModule6SuccessSummary,
  getModule6SuccessStageMeta,
  resolveModule6SuccessAdvance,
  resolveModule6SuccessBack,
} from "@/lib/module6/module6SuccessHelpers";

/**
 * CP-H Module 6 success — staged read-only draft map.
 * Progression advance is allowed; draft/prose writes are not.
 */
export default function ModuleSixSuccessClient() {
  const { data: session } = useSession();
  const headingRef = useRef(null);
  const [stage, setStage] = useState(MODULE6_SUCCESS_STAGES.CELEBRATE);
  const [summary, setSummary] = useState(null);
  const [ready, setReady] = useState(false);
  const [activeSection, setActiveSection] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const [draftRes, outlineRes] = await Promise.all([
        getModule6DraftRow(),
        getOutlineRow(5),
      ]);
      if (cancelled) return;

      if (!draftRes.ok) {
        setSummary(buildModule6SuccessSummary({ readFailed: true }));
        return;
      }

      setSummary(
        buildModule6SuccessSummary({
          draftRow: draftRes.data,
          outline: outlineRes.ok ? outlineRes.data?.outline : null,
          readFailed: false,
        })
      );
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || !summary || summary.incomplete) return;
    advanceCurrentModuleOnSuccess({
      userEmail: email,
      completedModuleNumber: MODULE6_SUCCESS_COMPLETED_MODULE,
    })
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [session?.user?.email, summary]);

  useEffect(() => {
    headingRef.current?.focus?.();
  }, [stage, summary?.incomplete, activeSection]);

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your draft summary…
        </p>
      </div>
    );
  }

  if (summary.incomplete) {
    return (
      <div
        className="min-h-screen overflow-x-hidden bg-theme-light px-4 py-10 text-theme-dark"
        data-cph-layout={MODULE6_SUCCESS_LAYOUT_CONTRACT.viewports.join("-")}
      >
        <div className="mx-auto w-full max-w-2xl space-y-6">
          <header className="space-y-3 text-left">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
              Module 6
            </p>
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="text-3xl font-extrabold leading-tight outline-none md:text-4xl"
            >
              {summary.readFailed ? "Could not load your draft" : "Finish your draft"}
            </h1>
            <p
              role="status"
              className="rounded-lg border border-theme-orange/35 bg-theme-orange/5 px-4 py-3 text-sm leading-relaxed"
            >
              {summary.incompleteMessage}
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

  const meta = getModule6SuccessStageMeta(stage);
  const cards = summary.sectionCards || [];
  const active = cards[activeSection] || cards[0];

  return (
    <div
      className="min-h-screen overflow-x-hidden bg-theme-light px-4 py-8 text-theme-dark md:py-10"
      data-cph-layout={MODULE6_SUCCESS_LAYOUT_CONTRACT.viewports.join("-")}
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

        {stage === MODULE6_SUCCESS_STAGES.CELEBRATE ? (
          <section className="space-y-4" aria-label="What you accomplished">
            <p className="text-base leading-relaxed md:text-lg">{summary.accomplishment}</p>
            <p className="text-sm text-text-muted">
              {summary.sectionCount} draft section
              {summary.sectionCount === 1 ? "" : "s"} locked and ready to strengthen
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {cards.map((card) => (
                <li
                  key={card.id}
                  className="rounded-lg border border-border-soft bg-white px-3 py-2"
                  aria-label={card.ariaLabel}
                >
                  <span className="text-sm font-semibold">{card.label}</span>
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-theme-green">
                    {card.statusLabel}
                  </span>
                  <span className="mt-1 block text-xs text-text-muted">
                    {card.wordCount} words
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {stage === MODULE6_SUCCESS_STAGES.EXPLORE ? (
          <section className="space-y-4" aria-label="Draft section map">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Draft sections"
            >
              {cards.map((card, index) => (
                <button
                  key={`tab-${card.id}`}
                  type="button"
                  role="tab"
                  aria-selected={index === activeSection}
                  aria-controls={`module6-success-panel-${card.id}`}
                  id={`module6-success-tab-${card.id}`}
                  className={`min-h-[44px] rounded-lg px-3 py-2 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark ${
                    index === activeSection
                      ? "bg-theme-blue text-white"
                      : "bg-surface-soft text-text-primary"
                  }`}
                  onClick={() => setActiveSection(index)}
                >
                  {card.label}
                </button>
              ))}
            </div>
            {active ? (
              <div
                role="tabpanel"
                id={`module6-success-panel-${active.id}`}
                aria-labelledby={`module6-success-tab-${active.id}`}
                className="rounded-xl border border-border-soft bg-white px-4 py-3 shadow-soft"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold">{active.label}</p>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-theme-green">
                    {active.statusLabel}
                  </span>
                </div>
                <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words text-sm text-text-primary">
                  {active.preview || "—"}
                  {active.preview && active.preview.length >= 180 ? "…" : ""}
                </p>
              </div>
            ) : null}
          </section>
        ) : null}

        {stage === MODULE6_SUCCESS_STAGES.HANDOFF ? (
          <section className="space-y-3" aria-label="What comes next">
            <p className="text-base leading-relaxed">{summary.handoff}</p>
            {!ready ? (
              <p className="text-sm text-text-muted" role="status">
                Saving your progress…
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {stage !== MODULE6_SUCCESS_STAGES.CELEBRATE ? (
              <button
                type="button"
                className="min-h-[44px] rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark"
                onClick={() => setStage(resolveModule6SuccessBack(stage).stage)}
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
            {stage === MODULE6_SUCCESS_STAGES.HANDOFF ? (
              <Link
                href={summary.primaryHref}
                aria-disabled={!ready}
                className={`inline-flex min-h-[44px] items-center rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark ${
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
                  const next = resolveModule6SuccessAdvance(stage);
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
