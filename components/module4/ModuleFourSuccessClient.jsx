"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { MODULE_FOUR_SUCCESS_COMPLETED_MODULE } from "@/lib/module4/module4SuccessHelpers";
import { buildModule4SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 4 success via shared shell.
 * Incomplete/recovery uses the builder recovery path. Mount advance unchanged.
 */
export default function ModuleFourSuccessClient({ summary }) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.email) return;
    if (summary?.incomplete) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: MODULE_FOUR_SUCCESS_COMPLETED_MODULE,
    }).catch(() => {});
  }, [session?.user?.email, summary?.incomplete]);

  const plans = Array.isArray(summary?.paragraphPlans)
    ? summary.paragraphPlans
    : [];
  const jobLabels = plans
    .map((plan) => plan?.job?.label)
    .filter((label) => typeof label === "string" && label.trim());
  const foundation = summary?.evidenceFoundation;

  const resolved = buildModule4SuccessExperience({
    incomplete: Boolean(summary?.incomplete),
    requiredPlanCount: summary?.requiredPlanCount ?? plans.length,
    jobLabels,
    bothWorksEvidence: Boolean(foundation?.bothWorksVerified),
    evidenceCount: foundation?.totalQualifyingEvidence ?? null,
    continueEnabled: !summary?.incomplete,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="4"
      data-to-module="5"
      data-presentation="reuse"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module4-success-heading"
        primaryTestId="module4-continue-module5"
        secondaryTestId="module4-review"
        onPrimaryAction={(action) => {
          if (!action?.href) return;
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
