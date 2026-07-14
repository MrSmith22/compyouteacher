"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModuleRoleTransitionCard from "@/components/transitions/ModuleRoleTransitionCard";
import { getModuleRoleTransition } from "@/lib/transitions/moduleRoleTransitions";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { HIERARCHY_ACTION_PRIMARY_CLASS, HIERARCHY_FOCUS_RING_CLASS } from "@/lib/ui/hierarchyContract";

const TRANSITION = getModuleRoleTransition(8, 9);

export default function ModuleEightSuccess() {
  const router = useRouter();
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.email) return;
      try {
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
  }, [session?.user?.email]);

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
