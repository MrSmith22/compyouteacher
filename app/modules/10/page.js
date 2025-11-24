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
    async function fetchData() {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1) Base table: student_assignments
        const { data: assignments, error: aErr } = await supabase
          .from("student_assignments")
          .select("user_email, assignment_name, current_module, status")
          .order("user_email", { ascending: true });

        if (aErr) {
          console.error("Error fetching student_assignments:", aErr);
          setErrorMsg(aErr.message || "Error loading assignments");
          setRows([]);
          setLoading(false);
          return;
        }

        if (!assignments || assignments.length === 0) {
          setRows([]);
          setLoading(false);
          return;
        }

        const emails = Array.from(
          new Set(assignments.map((a) => a.user_email))
        );

        let exports = [];
        let scores = [];
        let module9 = [];
        let apaQuiz = [];

        if (emails.length > 0) {
          // 2) Final PDFs and exports
          const { data: expData, error: expErr } = await supabase
            .from("student_exports")
            .select(
              "user_email, file_name, kind, public_url, uploaded_at, module"
            )
            .in("user_email", emails);

          if (expErr) {
            console.error("Error fetching student_exports:", expErr);
          } else if (expData) {
            exports = expData;
          }

          // 3) Module scores (for modules that store grades here)
          const { data: scoreData, error: scoreErr } = await supabase
            .from("module_scores")
            .select("user_email, module, score")
            .in("user_email", emails);

          if (scoreErr) {
            console.error("Error fetching module_scores:", scoreErr);
          } else if (scoreData) {
            scores = scoreData;
          }

          // 4) Module 9 quiz results
          const { data: m9Data, error: m9Err } = await supabase
            .from("module9_quiz")
            .select("user_email, score, total, submitted_at")
            .in("user_email", emails);

          if (m9Err) {
            console.error("Error fetching module9_quiz:", m9Err);
          } else if (m9Data) {
            module9 = m9Data;
          }

          // 5) APA quiz results (if used in your flow)
          const { data: apaData, error: apaErr } = await supabase
            .from("module1_quiz_results")
            .select("user_email, score, total, created_at")
            .in("user_email", emails);

          if (apaErr) {
            console.error("Error fetching module1_quiz_results:", apaErr);
          } else if (apaData) {
            apaQuiz = apaData;
          }
        }

        // Group data by student
        const combined = assignments.map((a) => {
          const userEmail = a.user_email;

          // All scores for this student
          const userScores = scores.filter((s) => s.user_email === userEmail);
          const modulesCompleted = userScores.length;

          // Latest Module 9 quiz
          const userM9 = module9
            .filter((r) => r.user_email === userEmail)
            .sort(
              (a, b) =>
                new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0)
            )[0];

          // Latest APA quiz
          const userApa = apaQuiz
            .filter((r) => r.user_email === userEmail)
            .sort(
              (a, b) =>
                new Date(b.created_at || 0) - new Date(a.created_at || 0)
            )[0];

          // Final PDFs for this student
          const userExports = exports.filter(
            (e) => e.user_email === userEmail && e.kind === "final_pdf"
          );

          const mainPdf = userExports[0] || null;
          const extraPdfCount = userExports.length > 1
            ? userExports.length - 1
            : 0;

          return {
            userEmail,
            assignmentName: a.assignment_name,
            currentModule: a.current_module,
            status: a.status,
            modulesCompleted,
            moduleScores: userScores,
            module9Quiz: userM9
              ? { score: userM9.score, total: userM9.total }
              : null,
            apaQuiz: userApa
              ? { score: userApa.score, total: userApa.total }
              : null,
            finalPdf: mainPdf,
            extraPdfCount,
          };
        });

        setRows(combined);
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error loading teacher dashboard:", err);
        setErrorMsg("Unexpected error loading data.");
        setLoading(false);
      }
    }

    fetchData();
  }, []);

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

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-1">
        🧑‍🏫 Teacher Dashboard (Module 10)
      </h1>
      <p className="text-sm text-gray-600 mb-4">
        View students, their current module, assignment status, quiz scores, and final PDF submissions.
      </p>

      {errorMsg && (
        <div className="bg-red-100 text-red-800 px-4 py-2 rounded mb-4">
          Error loading data: {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Loading student data…</p>
      ) : rows.length === 0 ? (
        <p>No student assignment records found yet in student_assignments.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Student</th>
                <th className="border px-3 py-2 text-left">Assignment / Status</th>
                <th className="border px-3 py-2 text-center">Current Module</th>
                <th className="border px-3 py-2 text-center">Modules Completed</th>
                <th className="border px-3 py-2 text-center">Rhetoric Quiz</th>
                <th className="border px-3 py-2 text-center">Module 9 Quiz</th>
                <th className="border px-3 py-2 text-left">Final PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userEmail}>
                  <td className="border px-3 py-2 align-top">
                    <div className="font-semibold">{row.userEmail}</div>
                  </td>
                  <td className="border px-3 py-2 align-top">
                    <div className="font-semibold">{row.assignmentName || "Essay 1"}</div>
                    <div className="text-xs text-gray-600">
                      Status: {row.status || "not started"}
                    </div>
                  </td>
                  <td className="border px-3 py-2 text-center align-top">
                    {row.currentModule ?? "–"}
                  </td>
                  <td className="border px-3 py-2 text-center align-top">
                    {row.modulesCompleted}
                  </td>
                  <td className="border px-3 py-2 text-center align-top">
                    {row.apaQuiz
                      ? `${row.apaQuiz.score} / ${row.apaQuiz.total}`
                      : "No attempt yet"}
                  </td>
                  <td className="border px-3 py-2 text-center align-top">
                    {row.module9Quiz
                      ? `${row.module9Quiz.score} / ${row.module9Quiz.total}`
                      : "No attempt yet"}
                  </td>
                  <td className="border px-3 py-2 align-top">
                    {row.finalPdf ? (
                      <div className="space-y-1">
                        <a
                          href={row.finalPdf.public_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-700 underline"
                        >
                          {row.finalPdf.file_name || "View PDF"}
                        </a>
                        {row.extraPdfCount > 0 && (
                          <div className="text-xs text-gray-600">
                            + {row.extraPdfCount} more PDF
                            {row.extraPdfCount > 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">
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

      <div className="text-xs text-gray-500 mt-4">
        Data sources: <code>student_assignments</code>, <code>module_scores</code>,{" "}
        <code>module9_quiz</code>, <code>module1_quiz_results</code>, <code>student_exports</code>.
      </div>
    </div>
  );
}