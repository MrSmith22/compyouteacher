"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

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
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Your paper is ready!
        </h1>

        <p className="text-lg text-theme-dark">
          You prepared your Google Doc and got your paper ready to turn in.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 9, you&apos;ll demonstrate your understanding of APA formatting
          and submit your final PDF.
        </p>

        {!ready ? (
          <p className="text-sm text-gray-600">Saving your progress…</p>
        ) : null}

        {ready ? (
          <button
            type="button"
            onClick={() => router.push("/modules/9")}
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-theme-blue px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-800 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-theme-dark focus-visible:ring-offset-2"
            data-testid="module8-success-continue"
          >
            Continue to Module 9
          </button>
        ) : (
          <button
            type="button"
            disabled
            className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gray-300 px-6 py-2 text-sm font-semibold text-gray-600 shadow cursor-not-allowed"
            data-testid="module8-success-continue"
          >
            Continue to Module 9
          </button>
        )}
      </div>
    </div>
  );
}
