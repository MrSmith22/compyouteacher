"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { getOutlineRow } from "@/lib/artifacts/readArtifactsClient";
import {
  MODULE5_SUCCESS_COMPLETED_MODULE,
  buildModule5SuccessSummary,
} from "@/lib/module5/module5SuccessHelpers";
import { buildModule5SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 5 success via shared shell (Plan stage, outline order).
 * Mount advance stays outside the pure builder.
 */
export default function ModuleFiveSuccessClient() {
  const { data: session } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const result = await getOutlineRow(5);
      if (cancelled) return;
      if (!result.ok) {
        setSummary(buildModule5SuccessSummary({ readFailed: true }));
        return;
      }
      setSummary(
        buildModule5SuccessSummary({
          outlineRow: result.data,
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
    if (!email || !summary || summary.incomplete) {
      return;
    }
    advanceCurrentModuleOnSuccess({
      userEmail: email,
      completedModuleNumber: MODULE5_SUCCESS_COMPLETED_MODULE,
    })
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [session?.user?.email, summary]);

  if (!summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your outline summary…
        </p>
      </div>
    );
  }

  const bodyCards = Array.isArray(summary.bodyCards) ? summary.bodyCards : [];
  const sectionMapLabel = bodyCards.length
    ? ["Introduction", ...bodyCards.map((_, i) => `Body ${i + 1}`), "Conclusion"].join(
        " → "
      )
    : null;

  const resolved = buildModule5SuccessExperience({
    incomplete: Boolean(summary.incomplete),
    incompleteMessage: summary.incompleteMessage || null,
    readFailed: Boolean(summary.readFailed),
    bodyCount: bodyCards.length,
    sectionMapLabel,
    expectedDraftSections: summary.expectedDraftSections ?? null,
    continueEnabled: ready && !summary.incomplete,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="5"
      data-to-module="6"
      data-presentation="reuse"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module5-success-heading"
        primaryTestId="module5-continue-module6"
        secondaryTestId="module5-review"
        statusMessage={
          !summary.incomplete && !ready ? "Saving your progress…" : null
        }
        onPrimaryAction={(action) => {
          if (!action?.href) return;
          if (!summary.incomplete && !ready) return;
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
