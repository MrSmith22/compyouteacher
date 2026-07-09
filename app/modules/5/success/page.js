"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  advanceCurrentModuleOnSuccess,
  ensureStudentAssignmentRow,
} from "@/lib/supabase/helpers/studentAssignments";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";

const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;

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
        <h1 className="text-3xl font-bold text-theme-green">Module 5 complete!</h1>

        <p className="text-lg text-theme-dark">
          You organized your paragraph plans into an outline and planned how you will close
          the essay. Your thesis, body sections, and conclusion notes are ready to become
          prose—not a fresh start.
        </p>

        <p className="text-sm text-theme-dark/80">
          In Module 6, you will draft one section at a time from the outline you built here.
        </p>

        {!ready && !errMsg && (
          <p className="text-sm text-gray-600">Saving your progress…</p>
        )}

        {errMsg && (
          <p className="text-sm text-red-700">
            {errMsg}{" "}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="underline text-red-800"
            >
              Try again
            </button>
          </p>
        )}

        {ready ? (
          <Link
            href="/modules/6"
            className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
          >
            Continue to Module 6 — draft your essay
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="inline-block bg-gray-300 text-gray-600 px-6 py-2 rounded shadow cursor-not-allowed"
          >
            Continue to Module 6 — draft your essay
          </button>
        )}
      </div>
    </div>
  );
}