"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModuleRoleTransitionCard from "@/components/transitions/ModuleRoleTransitionCard";
import { getModuleRoleTransition } from "@/lib/transitions/moduleRoleTransitions";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { getExportedDocLink } from "@/lib/supabase/helpers/studentExports";
import {
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
} from "@/lib/ui/hierarchyContract";
import { isSuccessExperienceFoundationEnabled } from "@/lib/dev/isSuccessExperienceFoundationEnabled";
import { buildModule8SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

const TRANSITION = getModuleRoleTransition(8, 9);

export default function ModuleEightSuccess() {
  const router = useRouter();
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);
  const [docEvidence, setDocEvidence] = useState({
    title: null,
    verifiedLabel: null,
  });
  const foundationEnabled = isSuccessExperienceFoundationEnabled();

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.email) return;
      try {
        if (foundationEnabled) {
          const docResult = await getExportedDocLink({
            userEmail: session.user.email,
          });
          if (docResult?.data?.web_view_link) {
            setDocEvidence({
              title: "Submission Google Doc",
              verifiedLabel:
                "Verified Google Doc contains your newest finished essay",
            });
          }
        }
        await advanceCurrentModuleOnSuccess({
          userEmail: session.user.email,
          completedModuleNumber: 8,
        });
        setReady(true);
      } catch {
        setReady(true);
      }
    };
    run();
  }, [session?.user?.email, foundationEnabled]);

  if (foundationEnabled) {
    const resolved = buildModule8SuccessExperience({
      docTitle: docEvidence.title,
      verifiedLabel:
        docEvidence.verifiedLabel ||
        "Submission document prepared for Module 9",
      continueEnabled: ready,
    });
    return (
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module8-success-heading"
        statusMessage={!ready ? "Saving your progress…" : null}
        primaryTestId="module8-success-continue"
        onPrimaryAction={(action) => {
          if (!ready || !action?.href) return;
          router.push(action.href);
        }}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-light px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-border-soft/70 bg-white px-6 py-8 shadow-soft md:px-10">
        <ModuleRoleTransitionCard
          transition={TRANSITION}
          status={!ready ? "Saving your progress…" : null}
        >
          <button
            type="button"
            onClick={() => router.push("/modules/9")}
            disabled={!ready}
            className={
              ready
                ? `inline-flex items-center justify-center ${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`
                : "inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
            }
            data-testid="module8-success-continue"
          >
            {TRANSITION.actionLabel}
          </button>
        </ModuleRoleTransitionCard>
      </div>
    </div>
  );
}
