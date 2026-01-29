"use client";

/**
 * DEV ONLY: Resets all data for the currently signed-in student via POST /api/dev/reset-student.
 * This component must never be enabled in production. It is gated by NODE_ENV !== "development"
 * and the API route returns 404 in production. Use only for local development to wipe a student
 * and start over.
 */

import { useState } from "react";
import { useSession } from "next-auth/react";
import { clearStudentCache } from "@/lib/storage/studentCache";

type DeletedCounts = {
  student_activity_log: number;
  tchart_entries: number;
  student_outlines: number;
  student_drafts: number;
  student_readaloud: number;
};

type ResetApiResult =
  | { ok: true; email: string; deleted: DeletedCounts }
  | { ok: false; email?: string; deleted: DeletedCounts; reason?: string };

const SCARY_MESSAGE =
  "This will PERMANENTLY delete all assignment data, T-charts, outlines, read-aloud, activity logs, and storage files for this student. This cannot be undone. Type OK to proceed.";

const TABLE_LABELS: Record<keyof DeletedCounts, string> = {
  student_activity_log: "Activity log",
  tchart_entries: "T-chart entries",
  student_outlines: "Outlines",
  student_drafts: "Drafts",
  student_readaloud: "Read-aloud",
};

export default function DevResetStudentButton() {
  const { data: session } = useSession();
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<ResetApiResult | { error: string } | null>(null);

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

      const data: ResetApiResult = await res.json();
      setResult(data);

      if (data.ok) {
        clearStudentCache(email);
        window.location.reload();
      }
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Request failed",
      });
    } finally {
      setWorking(false);
    }
  }

  const hasDeleted = (r: ResetApiResult): r is ResetApiResult & { deleted: DeletedCounts } =>
    r.deleted != null;

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
      {result !== null && "error" in result && (
        <p className="text-sm text-red-600">{result.error}</p>
      )}
      {result !== null && hasDeleted(result) && (
        <div className="rounded border border-gray-300 bg-gray-50 p-2 text-xs">
          <p className="mb-1.5 font-medium text-gray-700">
            {result.ok ? "Reset complete" : "Reset completed with errors"}
            {result.email != null && ` · ${result.email}`}
          </p>
          <ul className="list-inside list-disc space-y-0.5 text-gray-600">
            {(Object.keys(result.deleted) as (keyof DeletedCounts)[]).map((key) => (
              <li key={key}>
                {TABLE_LABELS[key]}: {result.deleted[key]} deleted
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
