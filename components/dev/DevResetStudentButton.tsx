"use client";

/**
 * DEV ONLY: Resets all data for the currently signed-in student via POST /api/dev/reset-student.
 * This component must never be enabled in production. It is gated by NODE_ENV !== "development"
 * and the API route returns 404 in production. Use only for local development to wipe a student
 * and start over.
 */

import { useState } from "react";
import { useSession } from "next-auth/react";

const SCARY_MESSAGE =
  "This will PERMANENTLY delete all assignment data, T-charts, outlines, read-aloud, activity logs, and storage files for this student. This cannot be undone. Type OK to proceed.";

export default function DevResetStudentButton() {
  const { data: session } = useSession();
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  if (process.env.NODE_ENV !== "development") return null;

  const email = session?.user?.email ?? "";

  async function handleClick() {
    if (!email) {
      setResult({ error: "No session email" });
      return;
    }

    const confirmed = window.confirm(SCARY_MESSAGE);
    if (!confirmed) return;

    setResult(null);
    setWorking(true);

    try {
      const res = await fetch("/api/dev/reset-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-dev-reset-secret":
            process.env.NEXT_PUBLIC_DEV_RESET_SECRET ?? "",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setResult({ status: res.status, ...data });
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={working || !email}
        className="w-fit rounded border border-red-600 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        {working ? "Resetting…" : "Dev: Reset this student"}
      </button>
      {result !== null && (
        <pre className="max-h-48 overflow-auto rounded border border-gray-300 bg-gray-50 p-2 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
