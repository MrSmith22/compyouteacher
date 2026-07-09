"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleEightSuccess() {
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
          <Link
            href="/modules/9"
            className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
          >
            Continue to Module 9
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-block bg-gray-300 text-gray-600 px-6 py-2 rounded shadow cursor-not-allowed"
          >
            Continue to Module 9
          </button>
        )}
      </div>
    </div>
  );
}
