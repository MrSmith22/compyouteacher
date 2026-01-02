"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import useRole from "@/lib/useRole";

export default function StudentDetailPage() {
  const { role, loading: roleLoading } = useRole();
  const params = useParams();

  // email comes from the dynamic route [...]/student/[email]
  const rawEmail = params?.email || "";
  const email = decodeURIComponent(rawEmail);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [detail, setDetail] = useState({
    rhetoricQuiz: null,
    module9Quiz: null,
    drafts: [],
    outlines: [],
    finalPdfs: [],
    activity: [],
  });

  useEffect(() => {
    if (!email) return;

    async function fetchDetail() {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) Rhetoric / Module 1 quiz (module1_quiz_results)
        const { data: m1Rows, error: m1Err } = await supabase
          .from("module1_quiz_results")
          .select("score, total, created_at")
          .eq("user_email", email)
          .order("created_at", { ascending: false })
          .limit(1);

        if (m1Err) {
          console.error("Error fetching module1_quiz_results:", m1Err);
        }

        const rhetoricQuiz = m1Rows && m1Rows.length > 0 ? m1Rows[0] : null;

        // 2) Module 9 quiz (module9_quiz)
        const { data: m9Rows, error: m9Err } = await supabase
          .from("module9_quiz")
          .select("score, total, submitted_at")
          .eq("user_email", email)
          .order("submitted_at", { ascending: false })
          .limit(1);

        if (m9Err) {
          console.error("Error fetching module9_quiz:", m9Err);
        }

        const module9Quiz = m9Rows && m9Rows.length > 0 ? m9Rows[0] : null;

        // 3) Drafts (student_drafts) – modules 6 and 7 mainly
        const { data: draftRows, error: dErr } = await supabase
          .from("student_drafts")
          .select("module, full_text, final_text, final_ready, updated_at")
          .eq("user_email", email)
          .order("module", { ascending: true });

        if (dErr) {
          console.error("Error fetching student_drafts:", dErr);
        }

        const drafts = draftRows || [];

        // 4) Outlines (student_outlines)
        const { data: outlineRows, error: oErr } = await supabase
          .from("student_outlines")
          .select("module, outline, finalized, updated_at")
          .eq("user_email", email)
          .order("module", { ascending: true });

        if (oErr) {
          console.error("Error fetching student_outlines:", oErr);
        }

        const outlines = outlineRows || [];

        // 5) Final PDFs (student_exports, kind = 'final_pdf')
        const { data: exportRows, error: eErr } = await supabase
          .from("student_exports")
          .select("module, file_name, public_url, uploaded_at, kind")
          .eq("user_email", email)
          .eq("kind", "final_pdf")
          .order("uploaded_at", { ascending: false });

        if (eErr) {
          console.error("Error fetching student_exports:", eErr);
        }

        const finalPdfs = exportRows || [];

        // 6) Activity log (student_activity_log)
        const { data: activityRows, error: aErr } = await supabase
          .from("student_activity_log")
          .select("action, module, metadata, created_at")
          .eq("user_email", email)
          .order("created_at", { ascending: false })
          .limit(25);

        if (aErr) {
          console.error("Error fetching student_activity_log:", aErr);
        }

        const activity = activityRows || [];

        setDetail({
          rhetoricQuiz,
          module9Quiz,
          drafts,
          outlines,
          finalPdfs,
          activity,
        });
      } catch (err) {
        console.error("Unexpected error loading student detail:", err);
        setErrorMsg("Unexpected error loading student data.");
      } finally {
        setLoading(false);
      }
    }

    fetchDetail();
  }, [email]);

  // Role gate
  if (roleLoading) {
    return <div className="p-6">Checking role…</div>;
  }

  if (role !== "teacher") {
    return (
      <div className="p-6 text-red-700">
        You are signed in as a student. Only teachers can view this page.
      </div>
    );
  }

  if (!email) {
    return (
      <div className="p-6">
        <p>Missing student email in URL.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            🧑‍🏫 Student Detail: {email}
          </h1>
          <p className="text-sm text-gray-600">
            View this student&apos;s quiz scores, drafts, outlines, final PDFs, and
            recent activity.
          </p>
        </div>
        <Link
          href="/modules/10"
          className="text-theme-blue underline text-sm"
        >
          ← Back to Teacher Dashboard
        </Link>
      </div>

      {errorMsg && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">
          Error loading data: {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Loading student data…</p>
      ) : (
        <>
          {/* Quick Scores */}
          <section className="grid md:grid-cols-2 gap-4">
            <div className="border rounded p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Module 1 Rhetoric Quiz</h2>
              {detail.rhetoricQuiz ? (
                <p>
                  Score:{" "}
                  <span className="font-semibold">
                    {detail.rhetoricQuiz.score} / {detail.rhetoricQuiz.total}
                  </span>
                  <br />
                  <span className="text-xs text-gray-600">
                    Last attempt:{" "}
                    {detail.rhetoricQuiz.created_at
                      ? new Date(detail.rhetoricQuiz.created_at).toLocaleString()
                      : "unknown"}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">No attempts recorded yet.</p>
              )}
            </div>

            <div className="border rounded p-4 bg-white shadow-sm">
              <h2 className="text-lg font-semibold mb-2">Module 9 APA Quiz</h2>
              {detail.module9Quiz ? (
                <p>
                  Score:{" "}
                  <span className="font-semibold">
                    {detail.module9Quiz.score} / {detail.module9Quiz.total}
                  </span>
                  <br />
                  <span className="text-xs text-gray-600">
                    Last attempt:{" "}
                    {detail.module9Quiz.submitted_at
                      ? new Date(detail.module9Quiz.submitted_at).toLocaleString()
                      : "unknown"}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-gray-600">No attempts recorded yet.</p>
              )}
            </div>
          </section>

          {/* Drafts */}
          <section className="border rounded p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Drafts (Modules 6–7)</h2>
            {detail.drafts.length === 0 ? (
              <p className="text-sm text-gray-600">
                No drafts saved yet in <code>student_drafts</code>.
              </p>
            ) : (
              <div className="space-y-4">
                {detail.drafts.map((d, idx) => (
                  <div key={idx} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <div className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Module {d.module}</span>{" "}
                      {d.final_ready ? "(marked final in-app)" : ""}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      Last updated:{" "}
                      {d.updated_at
                        ? new Date(d.updated_at).toLocaleString()
                        : "unknown"}
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-theme-blue">
                        View draft text
                      </summary>
                      <div className="mt-2 whitespace-pre-wrap text-gray-800">
                        {d.final_text || d.full_text || "(no text stored)"}
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Outlines */}
          <section className="border rounded p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Outlines (Module 5)</h2>
            {detail.outlines.length === 0 ? (
              <p className="text-sm text-gray-600">
                No outlines saved yet in <code>student_outlines</code>.
              </p>
            ) : (
              <div className="space-y-4">
                {detail.outlines.map((o, idx) => (
                  <div key={idx} className="border-t pt-3 first:border-t-0 first:pt-0">
                    <div className="text-sm text-gray-700 mb-1">
                      <span className="font-semibold">Module {o.module}</span>{" "}
                      {o.finalized ? "(finalized)" : "(in progress)"}
                    </div>
                    <div className="text-xs text-gray-500 mb-1">
                      Last updated:{" "}
                      {o.updated_at
                        ? new Date(o.updated_at).toLocaleString()
                        : "unknown"}
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-theme-blue">
                        View outline JSON
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(o.outline, null, 2)}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Final PDFs */}
          <section className="border rounded p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Final PDF Submissions</h2>
            {detail.finalPdfs.length === 0 ? (
              <p className="text-sm text-gray-600">
                No final PDFs recorded yet in <code>student_exports</code>.
              </p>
            ) : (
              <ul className="space-y-2">
                {detail.finalPdfs.map((f, idx) => (
                  <li key={idx} className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">
                        {f.file_name || `Module ${f.module} PDF`}
                      </div>
                      <div className="text-xs text-gray-500">
                        Module {f.module} • Uploaded:{" "}
                        {f.uploaded_at
                          ? new Date(f.uploaded_at).toLocaleString()
                          : "unknown"}
                      </div>
                    </div>
                    <a
                      href={f.public_url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-theme-blue underline text-sm"
                    >
                      Open PDF
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Activity log */}
          <section className="border rounded p-4 bg-white shadow-sm">
            <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
            {detail.activity.length === 0 ? (
              <p className="text-sm text-gray-600">
                No activity logged yet in <code>student_activity_log</code>.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {detail.activity.map((ev, idx) => (
                  <li key={idx} className="border-b pb-2 last:border-b-0">
                    <div className="flex justify-between">
                      <span className="font-semibold">
                        {ev.action} {ev.module ? `(Module ${ev.module})` : ""}
                      </span>
                      <span className="text-xs text-gray-500">
                        {ev.created_at
                          ? new Date(ev.created_at).toLocaleString()
                          : ""}
                      </span>
                    </div>
                    {ev.metadata && (
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                        {JSON.stringify(ev.metadata, null, 2)}
                      </pre>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}