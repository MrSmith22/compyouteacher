"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useRole from "@/lib/useRole";

export default function ModuleTen() {
  const { role, loading: roleLoading } = useRole();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setErrorMsg("");

        const [
          { data: assignments, error: assignmentsErr },
          { data: exports, error: exportsErr },
          { data: moduleScores, error: scoresErr },
          { data: module1Quiz, error: mod1Err },
          { data: module9Quiz, error: mod9Err },
        ] = await Promise.all([
          supabase.from("student_assignments").select("*"),
          supabase.from("student_exports").select("*"),
          supabase.from("module_scores").select("*"),
          supabase.from("module1_quiz_results").select("*"),
          supabase
            .from("module9_quiz")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

        if (
          assignmentsErr ||
          exportsErr ||
          scoresErr ||
          mod1Err ||
          mod9Err
        ) {
          throw (
            assignmentsErr ||
            exportsErr ||
            scoresErr ||
            mod1Err ||
            mod9Err
          );
        }

        const emailSet = new Set(
          (assignments || []).map((a) => a.user_email)
        );

        const rows = Array.from(emailSet).map((email) => {
          const assignment = assignments.find(
            (a) => a.user_email === email
          );

          const userExports = (exports || []).filter(
            (e) => e.user_email === email
          );

          const finalExport = userExports
            .filter(
              (e) =>
                e.module === 9 || e.kind === "final_pdf"
            )
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )[0];

          const userScores = (moduleScores || []).filter(
            (s) => s.user_email === email
          );
          const modulesCompleted = userScores.length;

          const mod1Row = (module1Quiz || []).find(
            (q) => q.user_email === email
          );
          const module1QuizScore = mod1Row
            ? `${mod1Row.score} / ${mod1Row.total}`
            : "No attempt yet";

          const latestMod9 = (module9Quiz || []).find(
            (q) => q.user_email === email
          );
          const module9QuizScore = latestMod9
            ? `${latestMod9.score ?? 0} / ${latestMod9.total ?? 10}`
            : "No attempt yet";

          return {
            userEmail: email,
            assignmentName:
              assignment?.assignment_name || "MLK Essay Assignment",
            status: assignment?.status || "Not started",
            currentModule: assignment?.current_module || 1,
            modulesCompleted,
            module1QuizScore,
            module9QuizScore,
            finalPdfUrl: finalExport?.public_url || null,
            finalPdfName: finalExport?.file_name || null,
            finalPdfUploadedAt: finalExport?.uploaded_at || null,
          };
        });

        setRows(rows);
      } catch (err) {
        console.error("Error loading dashboard data:", err);
        setErrorMsg("Error loading data");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  if (roleLoading) {
    return <p className="p-6">Checking permissions…</p>;
  }

  if (role !== "teacher") {
    return (
      <div className="p-6 text-red-700 bg-red-50 rounded">
        <p className="font-semibold mb-2">
          You are signed in as a student.
        </p>
        <p>Only teachers can view the Teacher Dashboard.</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        🧑‍🏫 Teacher Dashboard (Module 10)
      </h1>
      <p className="text-sm text-gray-600 mb-2">
        View students, their current module, assignment status, quiz scores, and final PDF submissions.
      </p>

      {errorMsg && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4 text-sm">
          Error loading data: {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Loading student data…</p>
      ) : rows.length === 0 ? (
        <p>
          No student assignment records found yet in{" "}
          <code>student_assignments</code>.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Student</th>
                <th className="border px-3 py-2 text-left">
                  Assignment / Status
                </th>
                <th className="border px-3 py-2 text-center">
                  Current Module
                </th>
                <th className="border px-3 py-2 text-center">
                  Modules Completed
                </th>
                <th className="border px-3 py-2 text-center">
                  Rhetoric Quiz
                </th>
                <th className="border px-3 py-2 text-center">
                  Module 9 Quiz
                </th>
                <th className="border px-3 py-2 text-center">
                  Final PDF
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userEmail}>
                  <td className="border px-3 py-2 align-top">
                    <div className="font-semibold">{row.userEmail}</div>
                  </td>

                  <td className="border px-3 py-2 align-top text-sm">
                    <div className="font-medium">
                      {row.assignmentName}
                    </div>
                    <div className="text-xs text-gray-500">
                      Status: {row.status}
                    </div>
                  </td>

                  <td className="border px-3 py-2 text-center align-top">
                    {row.currentModule}
                  </td>

                  <td className="border px-3 py-2 text-center align-top">
                    {row.modulesCompleted}
                  </td>

                  <td className="border px-3 py-2 text-center align-top">
                    {row.module1QuizScore}
                  </td>

                  <td className="border px-3 py-2 text-center align-top">
                    {row.module9QuizScore}
                  </td>

                  <td className="border px-3 py-2 text-center align-top">
                    {row.finalPdfUrl ? (
                      <div className="space-y-1">
                        <a
                          href={row.finalPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 underline"
                        >
                          View PDF
                        </a>
                        {row.finalPdfUploadedAt && (
                          <div className="text-xs text-gray-500">
                            Uploaded{" "}
                            {new Date(
                              row.finalPdfUploadedAt
                            ).toLocaleString()}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No final PDF uploaded
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="text-xs text-gray-500 space-y-1">
        <div>
          <strong>Data sources:</strong>{" "}
          <code>student_assignments</code>,{" "}
          <code>module_scores</code>,{" "}
          <code>module1_quiz_results</code>,{" "}
          <code>module9_quiz</code>,{" "}
          <code>student_exports</code>.
        </div>
        <div>
          Next steps (Phase 2): add per-module completion & scores, and
          drill-down links into each student’s drafts, outlines, and
          quizzes.
        </div>
      </section>
    </div>
  );
}