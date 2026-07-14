// app/modules/7/success/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ModuleRoleTransitionCard from "@/components/transitions/ModuleRoleTransitionCard";
import { getModuleRoleTransition } from "@/lib/transitions/moduleRoleTransitions";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { HIERARCHY_ACTION_PRIMARY_CLASS, HIERARCHY_FOCUS_RING_CLASS } from "@/lib/ui/hierarchyContract";

const TRANSITION = getModuleRoleTransition(7, 8);

export default function ModuleSevenSuccess() {
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-light px-4 py-10">
      <div className="w-full max-w-xl rounded-2xl border border-border-soft/70 bg-white px-6 py-8 shadow-soft md:px-10">
        <ModuleRoleTransitionCard
          transition={TRANSITION}
          status={!ready ? "Saving your progress…" : null}
        >
          {ready ? (
            <Link
              href="/modules/8"
              className={`inline-flex items-center justify-center ${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
            >
              {TRANSITION.actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-lg bg-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600"
            >
              {TRANSITION.actionLabel}
            </button>
          )}
        </ModuleRoleTransitionCard>
      </div>
    </div>
  );
}
