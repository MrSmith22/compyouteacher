"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  getModule6DraftRow,
  getOutlineRow,
} from "@/lib/artifacts/readArtifactsClient";
import {
  MODULE6_SUCCESS_COMPLETED_MODULE,
  MODULE6_SUCCESS_LAYOUT_CONTRACT,
  buildModule6SuccessSummary,
} from "@/lib/module6/module6SuccessHelpers";
import { buildModule6SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 6 success via shared shell.
 * Progression advance is allowed; draft/prose writes are not.
 */
export default function ModuleSixSuccessClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [ready, setReady] = useState(false);

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

  const cards = summary.sectionCards || [];
  const wordTotal = cards.reduce(
    (sum, card) => sum + (Number(card.wordCount) || 0),
    0
  );
  const sectionSummary = cards.map((card) => card.label).join(" · ");
  const resolved = buildModule6SuccessExperience({
    sectionCount: summary.sectionCount ?? cards.length,
    wordTotal,
    sectionSummary: sectionSummary || null,
    continueEnabled: ready,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="6"
      data-to-module="7"
      data-presentation="reuse"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module6-success-heading"
        statusMessage={!ready ? "Saving your progress…" : null}
        onPrimaryAction={(action) => {
          if (!ready || !action?.href) return;
          router.push(action.href);
        }}
        onSecondaryAction={(action) => {
          if (!action?.href) return;
          router.push(action.href);
        }}
      />
    </div>
  );
}
