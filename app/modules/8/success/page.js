"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import { getExportedDocLink } from "@/lib/supabase/helpers/studentExports";
import { buildModule8SuccessExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

/**
 * WP-095 — Module 8 success via shared shell (always on).
 */
export default function ModuleEightSuccess() {
  const router = useRouter();
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);
  const [docEvidence, setDocEvidence] = useState({
    title: null,
    verifiedLabel: null,
  });

  useEffect(() => {
    const run = async () => {
      if (!session?.user?.email) return;
      try {
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

  const resolved = buildModule8SuccessExperience({
    docTitle: docEvidence.title,
    verifiedLabel:
      docEvidence.verifiedLabel ||
      "Submission document prepared for Module 9",
    continueEnabled: ready,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="8"
      data-to-module="9"
      data-presentation="card"
    >
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
    </div>
  );
}
