"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

export default function TeacherDashboard() {
  const { data: session, status } = useSession();

  // ROLE + LOAD STATES
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DASHBOARD DATA
  const [rows, setRows] = useState([]);
  const [activityLog, setActivityLog] = useState([]);

  // UI STATE
  const [moduleFilter, setModuleFilter] = useState("all");
  const [submittedOnly, setSubmittedOnly] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activityModuleFilter, setActivityModuleFilter] = useState("all");

  // --------------------------------------------------
  // 1. Determine user role from /api/role
  // --------------------------------------------------
  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch("/api/role");
        if (!res.ok) throw new Error("Failed to fetch role");
        const data = await res.json();
        setRole(data.role || "student");
      } catch (err) {
        console.error("Role fetch error:", err);
        setRole("student");
      }
    };
    loadRole();
  }, []);

  // --------------------------------------------------
  // 2. Load dashboard data + logs
  // --------------------------------------------------
 // --------------------------------------------------
// 2. Load dashboard data + logs (via API)
// --------------------------------------------------
useEffect(() => {
  if (!session?.user?.email) return;
  if (role && role !== "teacher") return;

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/teacher/dashboard");

      // Handle auth / role failures cleanly
      if (res.status === 401) {
        setError("Not signed in");
        setLoading(false);
        return;
      }
      if (res.status === 403) {
        setError("Teacher access only");
        setLoading(false);
        return;
      }

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to load dashboard data");
      }

      const assignments = json.data?.assignments ?? [];
      const moduleScores = json.data?.moduleScores ?? [];
      const module9 = json.data?.module9 ?? [];
      const activity = json.data?.activity ?? [];
      const exports = json.data?.exports ?? [];
      // Module 9 submission: submitted = student_exports row with module=9, kind=final_pdf
      const module9SubmissionList = json.data?.module9SubmissionList ?? [];

      setActivityLog(activity);

      // Build list of all known student emails
      const emailSet = new Set();
      (assignments || []).forEach((a) => emailSet.add(a.user_email));
      (moduleScores || []).forEach((m) => emailSet.add(m.user_email));
      (module9 || []).forEach((m) => emailSet.add(m.user_email));
      (activity || []).forEach((a) => emailSet.add(a.user_email));
      (exports || []).forEach((e) => emailSet.add(e.user_email));

      const allEmails = Array.from(emailSet).filter(Boolean);

      // Merge all student data into one row per student
      const builtRows = allEmails.map((email) => {
        const assign = (assignments || []).find((a) => a.user_email === email);

        const scores = (moduleScores || []).filter((r) => r.user_email === email);
        const m1Score = scores.find((s) => s.module === 1) || null;

        const m9Row = (module9 || []).find((r) => r.user_email === email);

        const acts = (activity || []).filter((a) => a.user_email === email);
        const lastAct = acts[0] || null;

        const exportRow = (exports || []).find(
          (e) => e.user_email === email && e.module === 9
        );
        const submissionInfo = module9SubmissionList.find(
          (s) => s.user_email === email
        );

        const modulesCompleted = acts.filter((a) => a.action === "module_completed").length;

        const currentModule =
          assign?.current_module ??
          lastAct?.module ??
          (m9Row ? 9 : scores.length > 0 ? 1 : 0);

        return {
          email,
          assignmentName: assign?.assignment_name || "MLK Essay Assignment",
          status: assign?.status || "in progress",
          currentModule,
          modulesCompleted,
          rhetoricQuiz:
            m1Score && m1Score.total
              ? `${m1Score.score}/${m1Score.total}`
              : m1Score?.score != null
              ? `${m1Score.score}/10`
              : "—",
          module9Quiz:
            m9Row && m9Row.total
              ? `${m9Row.score}/${m9Row.total}`
              : m9Row?.score != null
              ? `${m9Row.score}/10`
              : "No attempt yet",
          lastActivity: lastAct,
          finalPdfUrl: submissionInfo?.finalPdfUrl ?? exportRow?.public_url ?? exportRow?.web_view_link ?? null,
          finalPdfName: exportRow?.file_name ?? null,
          submittedFinalPdf: submissionInfo?.submittedFinalPdf ?? !!exportRow,
          googleDocUrl: submissionInfo?.googleDocUrl ?? null,
          submittedAt: exportRow?.uploaded_at ?? exportRow?.created_at ?? null,
        };
      });

      setRows(builtRows);
      setLoading(false);
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(err?.message || "Unknown error");
      setLoading(false);
    }
  };

  load();
}, [session, role]);

  // --------------------------------------------------
  // 3. Apply module filter and "Show submitted only" (Module 9)
  // --------------------------------------------------
  const filteredRows = useMemo(() => {
    let list = rows;
    if (moduleFilter !== "all") {
      const n = Number(moduleFilter);
      list = list.filter((r) => Number(r.currentModule) === n);
    }
    if (submittedOnly) {
      list = list.filter((r) => r.submittedFinalPdf === true);
    }
    // Sort: submitted (Module 9 final PDF) first, then by submitted date newest first
    list = [...list].sort((a, b) => {
      if (a.submittedFinalPdf !== b.submittedFinalPdf) {
        return a.submittedFinalPdf ? -1 : 1;
      }
      if (a.submittedFinalPdf && b.submittedFinalPdf && a.submittedAt && b.submittedAt) {
        return new Date(b.submittedAt) - new Date(a.submittedAt);
      }
      return 0;
    });
    return list;
  }, [rows, moduleFilter, submittedOnly]);

  // --------------------------------------------------
  // 4. Selected student's activity timeline
  // --------------------------------------------------
  const timeline = useMemo(() => {
    if (!selectedEmail) return [];
    let list = activityLog.filter((a) => a.user_email === selectedEmail);

    if (activityModuleFilter !== "all") {
      list = list.filter(
        (a) => Number(a.module) === Number(activityModuleFilter)
      );
    }

    return list;
  }, [selectedEmail, activityLog, activityModuleFilter]);

  // --------------------------------------------------
  // 5. Role + session guards
  // --------------------------------------------------
  if (status === "loading" || role === null) {
    return <div className="p-6">Loading…</div>;
  }

  if (!session?.user?.email) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Please sign in</h1>
        <Link
          href="/api/auth/signin"
          className="bg-theme-blue text-white px-4 py-2 rounded inline-block mt-2"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (role !== "teacher") {
    return (
      <div className="p-6 text-theme-red">
        <h1 className="text-2xl font-bold">Teacher Access Only</h1>
        <p>You are signed in as {session.user.email}, but you are not a teacher.</p>
      </div>
    );
  }

  // --------------------------------------------------
  // 6. Render Teacher Dashboard UI
  // --------------------------------------------------
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 bg-theme-light rounded shadow-sm">
      <header className="border-b border-theme-blue pb-3 flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold text-theme-blue tracking-tight">
          Teacher Dashboard
        </h1>
        <p className="text-sm text-theme-muted">
          View progress, activity logs, quiz scores, and final PDFs for each student.
        </p>
      </header>

      {/* TOP FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white rounded px-4 py-3 border border-theme-light">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-theme-dark">
              Filter by current module:
            </label>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="border border-theme-light rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-theme-green focus:border-theme-green bg-theme-light"
            >
              <option value="all">All</option>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                <option key={m} value={m}>
                  Module {m}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={submittedOnly}
              onChange={(e) => setSubmittedOnly(e.target.checked)}
              className="rounded border-theme-light text-theme-blue focus:ring-theme-blue"
            />
            <span className="text-sm text-theme-dark">Show submitted only</span>
          </label>
        </div>

        <div className="text-xs text-theme-muted">
          Data sources: <span className="font-medium text-theme-dark">
            student_assignments
          </span>
          , module_scores, module9_quiz, student_activity_log, student_exports.
        </div>
      </div>

      {/* ERROR + LOADING */}
      {loading && <div className="text-theme-muted">Loading data…</div>}
      {error && <div className="text-theme-red font-medium">Error: {error}</div>}

      {/* MAIN TABLE */}
      {!loading && (
        <div className="overflow-x-auto bg-white rounded-lg shadow relative">
          <table className="min-w-full text-sm">
            <thead className="bg-theme-blue text-white">
              <tr>
                {/* sticky header cell */}
                <th className="px-4 py-2 border border-theme-light text-left sticky left-0 z-20 bg-theme-blue">
                  Student
                </th>
                <th className="px-4 py-2 border border-theme-light text-left">
                  Assignment / Status
                </th>
                <th className="px-4 py-2 border border-theme-light text-center">
                  Current Module
                </th>
                <th className="px-4 py-2 border border-theme-light text-center">
                  Modules Completed
                </th>
                <th className="px-4 py-2 border border-theme-light text-center">
                  Rhetoric Quiz
                </th>
                <th className="px-4 py-2 border border-theme-light text-center">
                  Module 9 Quiz
                </th>
                <th className="px-4 py-2 border border-theme-light text-left">
                  Last Activity
                </th>
                <th className="px-4 py-2 border border-theme-light text-left">
                  Submitted At
                </th>
                <th className="px-4 py-2 border border-theme-light text-left">
                  Module 9 submission
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row, idx) => {
                const baseRowBg =
                  selectedEmail === row.email
                    ? "bg-theme-light"
                    : idx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";

                return (
                  <tr
                    key={row.email}
                    onClick={() =>
                      setSelectedEmail(
                        selectedEmail === row.email ? null : row.email
                      )
                    }
                    className={`cursor-pointer ${baseRowBg} hover:bg-yellow-50 transition-colors`}
                  >
                    {/* sticky student cell */}
                    <td
                      className={`border border-theme-light px-4 py-2 font-medium text-theme-dark sticky left-0 z-10 ${baseRowBg}`}
                    >
                      {row.email}
                    </td>
                    <td className="border border-theme-light px-4 py-2">
                      <div className="font-semibold text-theme-dark">
                        {row.assignmentName}
                      </div>
                      <div className="text-xs text-theme-muted">
                        Status: {row.status}
                      </div>
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-center">
                      {row.finalPdfUrl ? "Completed" : row.currentModule ?? "—"}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-center">
                      {row.modulesCompleted ?? 0}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-center">
                      {row.rhetoricQuiz}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-center">
                      {row.module9Quiz}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-xs">
                      {row.lastActivity ? (
                        <>
                          <div className="font-semibold text-theme-dark">
                            {row.lastActivity.action}{" "}
                            {row.lastActivity.module
                              ? `(Module ${row.lastActivity.module})`
                              : ""}
                          </div>
                          <div className="text-theme-muted">
                            {new Date(
                              row.lastActivity.created_at
                            ).toLocaleString()}
                          </div>
                        </>
                      ) : (
                        <span className="text-theme-muted">
                          No activity yet
                        </span>
                      )}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-xs">
                      {row.submittedAt
                        ? new Date(row.submittedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : "\u2014"}
                    </td>
                    <td className="border border-theme-light px-4 py-2 text-xs">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={
                            row.submittedFinalPdf
                              ? "text-theme-green font-medium"
                              : "text-theme-muted"
                          }
                        >
                          {row.submittedFinalPdf ? "Submitted" : "Not submitted"}
                        </span>
                        {row.submittedFinalPdf && (
                          <span className="inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium text-white bg-theme-green">
                            Essay Complete
                          </span>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {row.finalPdfUrl ? (
                            <a
                              href={row.finalPdfUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-2 py-1 rounded text-white text-xs font-medium bg-theme-blue hover:opacity-90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open final PDF
                            </a>
                          ) : row.submittedFinalPdf ? (
                            <span className="text-theme-muted text-xs">
                              No PDF link
                            </span>
                          ) : null}
                          {row.googleDocUrl ? (
                            <a
                              href={row.googleDocUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-block px-2 py-1 rounded text-white text-xs font-medium bg-theme-green hover:opacity-90"
                              onClick={(e) => e.stopPropagation()}
                            >
                              Open Google Doc
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredRows.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="border border-theme-light px-4 py-3 text-center text-theme-muted"
                  >
                    No students match this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TIMELINE SECTION */}
      {selectedEmail && (
        <section className="bg-white rounded-lg shadow p-4 space-y-3 border border-theme-light">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-theme-dark">
              Activity Timeline — {selectedEmail}
            </h2>

            <div className="flex items-center gap-2">
              <label className="text-xs text-theme-dark">
                Filter by module:
              </label>
              <select
                value={activityModuleFilter}
                onChange={(e) => setActivityModuleFilter(e.target.value)}
                className="border border-theme-light rounded px-2 py-1 text-xs bg-theme-light focus:outline-none focus:ring-2 focus:ring-theme-green"
              >
                <option value="all">All</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                  <option key={m} value={m}>
                    Module {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {timeline.length === 0 ? (
            <p className="text-sm text-theme-muted">No activity yet.</p>
          ) : (
            <ol className="border-l border-theme-light pl-4 space-y-2 text-sm">
              {timeline.map((act) => (
                <li key={act.id}>
                  <div className="flex gap-2">
                    <span className="h-2 w-2 mt-2 bg-theme-green rounded-full" />
                    <div>
                      <div className="font-semibold text-theme-dark">
                        {act.action}{" "}
                        {act.module ? `(Module ${act.module})` : ""}
                      </div>
                      <div className="text-xs text-theme-muted">
                        {new Date(act.created_at).toLocaleString()}
                      </div>

                      {act.metadata && (
                        <pre className="bg-theme-light border border-theme-light p-2 mt-1 text-[11px] rounded overflow-auto text-theme-dark">
                          {JSON.stringify(act.metadata, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}