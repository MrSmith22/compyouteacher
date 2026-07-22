"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  MODULE_THREE_SUCCESS_COMPLETED_MODULE,
} from "@/lib/module3/moduleThreeSuccessHelpers";
import { buildModule3SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 3 success via shared shell.
 * Mount advance stays outside the pure builder.
 */
export default function ModuleThreeSuccessClient({ summary }) {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: MODULE_THREE_SUCCESS_COMPLETED_MODULE,
    }).catch(() => {});
  }, [session?.user?.email]);

  const argumentMap = summary?.argumentMap;
  const evidence = summary?.evidence;
  const proofPlan = summary?.proofPlan;
  const argumentReady = Boolean(
    evidence?.bothWorksVerified && (!argumentMap?.available || argumentMap?.ready)
  );
  const proofItems = Array.isArray(proofPlan?.items) ? proofPlan.items : [];
  const proofDirectionLabels = proofItems
    .map((item) => (typeof item?.text === "string" ? item.text.trim() : ""))
    .filter(Boolean);

  const resolved = buildModule3SuccessExperience({
    argumentReady,
    proofDirectionCount: proofItems.length,
    proofDirectionLabels,
    directionLabel: argumentMap?.direction || null,
    familyLabel: argumentMap?.familyLabel || null,
    continueEnabled: true,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="3"
      data-to-module="4"
      data-presentation="reuse"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module3-success-heading"
        primaryTestId="module3-continue-module4"
        secondaryTestId="module3-review"
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
