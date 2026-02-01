"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  advanceCurrentModuleOnSuccess,
  ensureStudentAssignmentRow,
} from "@/lib/supabase/helpers/studentAssignments";

const ASSIGNMENT_NAME = "MLK Essay Assignment";

export default function ModuleFiveSuccess() {
  const { data: session } = useSession();
  const [ready, setReady] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  useEffect(() => {
    const run = async () => {
      const email = session?.user?.email;
      if (!email) return;

      setReady(false);
      setErrMsg("");

      try {
        // Make sure the assignment row exists first
        await ensureStudentAssignmentRow({
          userEmail: email,
          assignmentName: ASSIGNMENT_NAME,
          startingModule: 6,
        });

        // Then advance to at least module 6
        await advanceCurrentModuleOnSuccess({
          userEmail: email,
          assignmentName: ASSIGNMENT_NAME,
          completedModuleNumber: 5,
        });

        setReady(true);
      } catch (e) {
        console.error("Module 5 success advance failed:", e);
        setErrMsg("Progress could not be updated. Refresh and try again.");
      }
    };

    run();
  }, [session?.user?.email]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">🎉</div>

        <h1 className="text-3xl font-bold text-theme-green">Module 5 Complete!</h1>

        <p className="text-lg text-theme-dark">
          Great work finalizing your outline! You’re ready to start drafting your essay.
        </p>

        {!ready && !errMsg && <p className="text-sm text-gray-600">Saving your progress…</p>}

        {errMsg && <p className="text-sm text-red-700">{errMsg}</p>}

        {ready ? (
          <Link
            href="/modules/6"
            className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
          >
            Start Module 6 →
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-block bg-gray-300 text-gray-600 px-6 py-2 rounded shadow cursor-not-allowed"
          >
            Start Module 6 →
          </button>
        )}
      </div>
    </div>
  );
}