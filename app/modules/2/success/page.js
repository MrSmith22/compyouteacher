"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { projectModule2SuccessEvidence } from "@/lib/module2/module2SuccessProjection";
import { buildModule2SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 2 success: evidence-ready transition (not analysis finished).
 * Mount advance stays outside the pure builder.
 */
export default function ModuleTwoSuccess() {
  const { data: session } = useSession();
  const router = useRouter();
  const { speech, letter } = mlkAssignmentDefinition.sources;
  const [ready, setReady] = useState(false);
  const [projection, setProjection] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [sourcesRes, bundleRes] = await Promise.all([
          fetch("/api/module2/sources"),
          fetch("/api/module2/artifact-bundle"),
        ]);
        const sourcesJson = sourcesRes.ok
          ? await sourcesRes.json().catch(() => null)
          : null;
        const bundleJson = bundleRes.ok
          ? await bundleRes.json().catch(() => ({}))
          : {};
        if (cancelled) return;
        setProjection(
          projectModule2SuccessEvidence({
            sources: sourcesJson,
            matrixBundle: bundleJson?.matrixBundle ?? null,
            speechTitle: speech?.title,
            letterTitle: letter?.title,
          })
        );
      } catch {
        if (cancelled) return;
        setProjection(
          projectModule2SuccessEvidence({
            speechTitle: speech?.title,
            letterTitle: letter?.title,
          })
        );
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [speech?.title, letter?.title]);

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 2,
    })
      .then(() => setReady(true))
      .catch(() => setReady(true));
  }, [session?.user?.email]);

  if (!projection) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your evidence summary…
        </p>
      </div>
    );
  }

  const resolved = buildModule2SuccessExperience({
    sourcesReady: projection.sourcesReady,
    speechTitle: projection.speechTitle,
    letterTitle: projection.letterTitle,
    directionLabel: projection.directionLabel,
    bothWorksEvidence: projection.bothWorksEvidence,
    continueEnabled: ready,
  });

  return (
    <SuccessExperienceShell
      experience={resolved.experience}
      headingId="module2-success-heading"
      primaryTestId="module2-continue-module3"
      statusMessage={!ready ? "Saving your progress…" : null}
      onPrimaryAction={(action) => {
        if (!ready || !action?.href) return;
        router.push(action.href);
      }}
    />
  );
}
