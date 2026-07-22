"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  getModule6DraftRow,
  getModule7DraftRow,
} from "@/lib/artifacts/readArtifactsClient";
import { projectModule7SuccessEvidence } from "@/lib/module7/module7SuccessProjection";
import { buildModule7SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 7 success: writing finished / preparation next.
 * Never claims submitted or APA done. Mount advance unchanged.
 */
export default function ModuleSevenSuccess() {
  const { data: session } = useSession();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [projection, setProjection] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [m7, m6] = await Promise.all([
        getModule7DraftRow(),
        getModule6DraftRow(),
      ]);
      if (cancelled) return;
      const draftMeta =
        m7.ok && m7.data?.draft_meta && typeof m7.data.draft_meta === "object"
          ? m7.data.draft_meta
          : null;
      const sectionCount =
        typeof draftMeta?.sectionCount === "number"
          ? draftMeta.sectionCount
          : Array.isArray(draftMeta?.sections)
            ? draftMeta.sections.length
            : null;
      setProjection(
        projectModule7SuccessEvidence({
          module7: m7.ok ? m7.data : null,
          module6: m6.ok ? m6.data : null,
          sectionCount,
        })
      );
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.email) return;
      try {
        await advanceCurrentModuleOnSuccess({
          userEmail: session.user.email,
          completedModuleNumber: 7,
        });
        setReady(true);
      } catch {
        setReady(true);
      }
    };
    run();
  }, [session?.user?.email]);

  if (!projection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your revision summary…
        </p>
      </div>
    );
  }

  const resolved = buildModule7SuccessExperience({
    revisedEssaySaved: projection.revisedEssaySaved,
    sectionCount: projection.sectionCount,
    wordTotal: projection.wordTotal,
    wordExpectationLabel: projection.wordExpectationLabel,
    continueEnabled: ready,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="7"
      data-to-module="8"
      data-presentation="card"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module7-success-heading"
        primaryTestId="module7-continue-module8"
        statusMessage={!ready ? "Saving your progress…" : null}
        onPrimaryAction={(action) => {
          if (!ready || !action?.href) return;
          router.push(action.href);
        }}
      />
    </div>
  );
}
