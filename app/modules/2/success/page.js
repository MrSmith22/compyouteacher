"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleTwoSuccess() {
  const { data: session } = useSession();
  const router = useRouter();
  const { speech, letter } = mlkAssignmentDefinition.sources;

  useEffect(() => {
    if (!session?.user?.email) return;
    advanceCurrentModuleOnSuccess({
      userEmail: session.user.email,
      completedModuleNumber: 2,
    }).catch(() => {});
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 2 complete!
        </h1>

        <p className="text-lg text-theme-dark">
          You saved working copies of Dr. King&apos;s <em>{speech.title}</em> speech and{" "}
          <em>{letter.title}</em>, then collected evidence and explained how it connects to
          ethos, pathos, and logos.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 3, you will group those quotes, sharpen a thesis, and build a proof
          plan—the thinking your paragraph plans will grow from.
        </p>

        <button
          type="button"
          onClick={() => router.push("/modules/3")}
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          Continue to Module 3 — analyze the evidence
        </button>
      </div>
    </div>
  );
}
