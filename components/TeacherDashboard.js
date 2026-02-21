"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";

const ASSIGNMENT_NAME = "MLK Essay Assignment";
const gradingStatusOptions = [
  { value: "ungraded", label: "Ungraded" },
  { value: "in_review", label: "In review" },
  { value: "graded", label: "Graded" },
];
const gradingStatusBadgeClasses = {
  ungraded: "bg-gray-200 text-theme-dark",
  in_review: "bg-theme-orange text-white",
  graded: "bg-theme-green text-white",
};
const gradingStatusLabels = {
  ungraded: "Ungraded",
  in_review: "In review",
  graded: "Graded",
};

export default function TeacherDashboard() {
  const { data: session, status } = useSession();

  // ROLE + LOAD STATES
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // DASHBOARD DATA
  const [rows, setRows] = useState([]);
  const [activityLog, setActivityLog] = useState([]);
  const [overview, setOverview] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // UI STATE
  const [moduleFilter, setModuleFilter] = useState("all");
  const [submittedOnly, setSubmittedOnly] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [activityModuleFilter, setActivityModuleFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notesByEmail, setNotesByEmail] = useState({});
  const [notesStatusByEmail, setNotesStatusByEmail] = useState({});
  const [gradingStatusStatusByEmail, setGradingStatusStatusByEmail] =
    useState({});
  const saveTimersRef = useRef({});
  const hasFetchedOverviewRef = useRef(false);

  // Phase 1 quick filters (client-side on overview)
  const [overviewFilter, setOverviewFilter] = useState("all");
  const [overviewSearch, setOverviewSearch] = useState("");

  // Phase 2: per-student detail view
  const [viewPanelOpen, setViewPanelOpen] = useState(false);
  const [viewPanelEmail, setViewPanelEmail] = useState(null);
  const [studentDetailByEmail, setStudentDetailByEmail] = useState({});
  const [viewPanelLoading, setViewPanelLoading] = useState(false);
  const [viewPanelRefreshing, setViewPanelRefreshing] = useState(false);
  const [viewPanelError, setViewPanelError] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState(null);

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
          gradingStatus:
            submissionInfo?.gradingStatus ??
            exportRow?.grading_status ??
            "ungraded",
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
  // 2b. Load Phase 1 overview (Module 10)
  // --------------------------------------------------
  useEffect(() => {
    if (!session?.user?.email) return;
    if (role !== "teacher") {
      hasFetchedOverviewRef.current = false;
      return;
    }
    if (hasFetchedOverviewRef.current) return;

    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const res = await fetch("/api/teacher/overview");
        if (!res.ok) throw new Error("Failed to load overview");
        const data = await res.json();
        setOverview(Array.isArray(data) ? data : []);
        return true;
      } catch (err) {
        setOverviewError(err?.message || "Overview load failed");
        setOverview([]);
        return false;
      } finally {
        setOverviewLoading(false);
      }
    };
    loadOverview().then((success) => {
      if (success) hasFetchedOverviewRef.current = true;
    });
  }, [session, role]);

  // --------------------------------------------------
  // 2c. Phase 2: Fetch student detail when View panel opens
  // --------------------------------------------------
  useEffect(() => {
    if (!viewPanelOpen || !viewPanelEmail || !session?.user?.email) return;
    if (viewPanelEmail in studentDetailByEmail) return; // already cached

    let cancelled = false;
    setViewPanelLoading(true);
    setViewPanelError(null);

    const fetchDetail = async () => {
      try {
        const res = await fetch(
          `/api/teacher/student?email=${encodeURIComponent(viewPanelEmail)}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          const errMsg = data?.error || "Failed to load student detail";
          setViewPanelError(errMsg);
          setStudentDetailByEmail((prev) => ({
            ...prev,
            [viewPanelEmail]: { error: errMsg },
          }));
          return;
        }

        setStudentDetailByEmail((prev) => ({
          ...prev,
          [viewPanelEmail]: { data },
        }));
      } catch (err) {
        if (cancelled) return;
        const errMsg = err?.message || "Failed to load student detail";
        setViewPanelError(errMsg);
        setStudentDetailByEmail((prev) => ({
          ...prev,
          [viewPanelEmail]: { error: errMsg },
        }));
      } finally {
        if (!cancelled) setViewPanelLoading(false);
      }
    };

    fetchDetail();
    return () => {
      cancelled = true;
    };
  }, [viewPanelOpen, viewPanelEmail, session?.user?.email]);

  const openViewPanel = (row) => {
    setViewPanelEmail(row.user_email);
    setViewPanelOpen(true);
    setViewPanelError(null);
    logActivity("teacher_view_student", { student_email: row.user_email });
  };

  const closeViewPanel = () => {
    setViewPanelOpen(false);
    setViewPanelEmail(null);
  };

  const filteredOverview = useMemo(() => {
    let list = overview;
    if (overviewFilter !== "all") {
      if (overviewFilter === "done") {
        list = list.filter((r) => r.final_ready && r.has_final_pdf);
      } else if (overviewFilter === "needs_pdf") {
        list = list.filter((r) => r.final_ready && !r.has_final_pdf);
      } else if (overviewFilter === "quiz_under_70") {
        list = list.filter(
          (r) => r.quiz_percent != null && r.quiz_percent < 70
        );
      } else if (overviewFilter === "in_progress") {
        list = list.filter((r) => !r.final_ready);
      }
    }
    if (overviewSearch.trim()) {
      const s = overviewSearch.trim().toLowerCase();
      list = list.filter((r) =>
        (r.user_email ?? "").toLowerCase().includes(s)
      );
    }
    return list;
  }, [overview, overviewFilter, overviewSearch]);

  const buildNudgeMessage = (row) => {
    const parts = [
      `Student: ${row.user_email}`,
      `Locked: ${row.final_ready ? "Yes" : "No"}`,
      `Quiz: ${row.quiz_completed ? `${row.quiz_score ?? "—"}/${row.quiz_total ?? "—"} (${row.quiz_percent ?? "—"}%)` : "Not taken"}`,
      `PDF submitted: ${row.has_final_pdf ? "Yes" : "No"}`,
      "",
    ];
    if (!row.final_ready) {
      parts.push("Next step: Finish Module 8 and lock your final draft.");
    } else if (row.final_ready && !row.has_final_pdf) {
      parts.push("Next step: Export to Google Docs, download PDF, upload in Module 9.");
    } else if (row.quiz_percent != null && row.quiz_percent < 70) {
      parts.push("Next step: Retake quiz review, use checklist, then verify formatting.");
    } else {
      parts.push("You are done. Nice work.");
    }
    return parts.join("\n");
  };

  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 1500);
    } catch (err) {
      console.warn("Copy failed:", err);
    }
  };

  const refreshViewPanel = async () => {
    if (!viewPanelEmail || !session?.user?.email) return;
    setViewPanelRefreshing(true);
    setViewPanelError(null);
    logActivity("teacher_refresh_student", { student_email: viewPanelEmail });
    try {
      const res = await fetch(
        `/api/teacher/student?email=${encodeURIComponent(viewPanelEmail)}`
      );
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data?.error || "Failed to refresh";
        setViewPanelError(errMsg);
        setStudentDetailByEmail((prev) => ({
          ...prev,
          [viewPanelEmail]: { error: errMsg },
        }));
        return;
      }
      setStudentDetailByEmail((prev) => ({
        ...prev,
        [viewPanelEmail]: { data },
      }));
    } catch (err) {
      const errMsg = err?.message || "Failed to refresh";
      setViewPanelError(errMsg);
      setStudentDetailByEmail((prev) => ({
        ...prev,
        [viewPanelEmail]: { error: errMsg },
      }));
    } finally {
      setViewPanelRefreshing(false);
    }
  };

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
  const selectedRow = useMemo(() => {
    if (!selectedEmail) return null;
    return rows.find((row) => row.email === selectedEmail) || null;
  }, [rows, selectedEmail]);

  useEffect(() => {
    if (!drawerOpen && !viewPanelOpen) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        if (viewPanelOpen) {
          closeViewPanel();
        } else {
          setDrawerOpen(false);
          setSelectedEmail(null);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen, viewPanelOpen]);

  useEffect(() => {
    if (!drawerOpen || !selectedEmail || !session?.user?.email) return;
    let active = true;
    const teacherEmail = session.user.email;
    const storageKey = `teacherNotes:${teacherEmail}:${selectedEmail}:${ASSIGNMENT_NAME}`;

    const loadNotes = async () => {
      try {
        const res = await fetch(
          `/api/teacher/notes?studentEmail=${encodeURIComponent(
            selectedEmail
          )}&assignmentName=${encodeURIComponent(ASSIGNMENT_NAME)}`
        );
        if (!res.ok) throw new Error("Notes fetch failed");
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Notes fetch failed");
        if (!active) return;
        const note = typeof json.note === "string" ? json.note : "";
        setNotesByEmail((prev) => ({ ...prev, [selectedEmail]: note }));
        setNotesStatusByEmail((prev) => ({ ...prev, [selectedEmail]: "Saved" }));
        try {
          localStorage.removeItem(storageKey);
        } catch (err) {
          console.warn("Unable to clear local notes:", err);
        }
      } catch (err) {
        console.warn("Notes fetch failed:", err);
        try {
          const stored = localStorage.getItem(storageKey);
          if (stored !== null && active) {
            setNotesByEmail((prev) => ({ ...prev, [selectedEmail]: stored }));
          }
        } catch (err2) {
          console.warn("Unable to load local notes:", err2);
        }
        if (active) {
          setNotesStatusByEmail((prev) => ({
            ...prev,
            [selectedEmail]: "Save failed",
          }));
        }
      }
    };

    loadNotes();
    return () => {
      active = false;
    };
  }, [drawerOpen, selectedEmail, session?.user?.email]);

  const handleNoteChange = (studentEmail, nextValue) => {
    setNotesByEmail((prev) => ({ ...prev, [studentEmail]: nextValue }));
    setNotesStatusByEmail((prev) => ({ ...prev, [studentEmail]: "Saving..." }));

    const teacherEmail = session?.user?.email;
    const storageKey = teacherEmail
      ? `teacherNotes:${teacherEmail}:${studentEmail}:${ASSIGNMENT_NAME}`
      : null;
    const timers = saveTimersRef.current;
    if (timers[studentEmail]) {
      clearTimeout(timers[studentEmail]);
    }
    timers[studentEmail] = setTimeout(async () => {
      try {
        const res = await fetch("/api/teacher/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail,
            assignmentName: ASSIGNMENT_NAME,
            note: nextValue,
          }),
        });
        if (!res.ok) throw new Error("Notes save failed");
        const json = await res.json();
        if (!json?.ok) throw new Error(json?.error || "Notes save failed");
        setNotesStatusByEmail((prev) => ({ ...prev, [studentEmail]: "Saved" }));
        if (storageKey) {
          try {
            localStorage.removeItem(storageKey);
          } catch (err) {
            console.warn("Unable to clear local notes:", err);
          }
        }
      } catch (err) {
        console.warn("Notes save failed:", err);
        setNotesStatusByEmail((prev) => ({
          ...prev,
          [studentEmail]: "Save failed",
        }));
        if (storageKey) {
          try {
            localStorage.setItem(storageKey, nextValue);
          } catch (err2) {
            console.warn("Unable to save local notes:", err2);
          }
        }
      }
    }, 700);
  };

  const handleGradingStatusChange = async (studentEmail, nextStatus) => {
    const previousStatus =
      rows.find((row) => row.email === studentEmail)?.gradingStatus ??
      "ungraded";
    setRows((prev) =>
      prev.map((row) =>
        row.email === studentEmail ? { ...row, gradingStatus: nextStatus } : row
      )
    );
    setGradingStatusStatusByEmail((prev) => ({
      ...prev,
      [studentEmail]: "Saving...",
    }));

    try {
      const res = await fetch("/api/teacher/submissions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentEmail,
          gradingStatus: nextStatus,
        }),
      });
      if (!res.ok) throw new Error("Status save failed");
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || "Status save failed");
      setGradingStatusStatusByEmail((prev) => ({
        ...prev,
        [studentEmail]: "Saved",
      }));
    } catch (err) {
      console.warn("Grading status update failed:", err);
      setRows((prev) =>
        prev.map((row) =>
          row.email === studentEmail
            ? { ...row, gradingStatus: previousStatus }
            : row
        )
      );
      setGradingStatusStatusByEmail((prev) => ({
        ...prev,
        [studentEmail]: "Save failed",
      }));
    }
  };

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

      {/* Phase 1: Student Progress Overview */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold text-theme-dark">Phase 1: Student Progress Overview</h2>
        {!overviewLoading && !overviewError && overview.length > 0 && (
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <select
              value={overviewFilter}
              onChange={(e) => setOverviewFilter(e.target.value)}
              className="border border-theme-light rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-blue bg-white"
            >
              <option value="all">All</option>
              <option value="needs_pdf">Needs PDF</option>
              <option value="quiz_under_70">Quiz &lt; 70</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <input
              type="text"
              placeholder="Search email…"
              value={overviewSearch}
              onChange={(e) => setOverviewSearch(e.target.value)}
              className="border border-theme-light rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-theme-blue"
            />
            {copyFeedback && (
              <span className="text-xs text-theme-green font-medium">
                {copyFeedback}
              </span>
            )}
          </div>
        )}
        {overviewLoading && <div className="text-theme-muted">Loading overview…</div>}
        {overviewError && <div className="text-theme-red font-medium">Error: {overviewError}</div>}
        {!overviewLoading && !overviewError && (
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-theme-light">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-2 text-left border border-theme-light">Email</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Current Module</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Locked</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Final PDF</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Quiz</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Ready</th>
                  <th className="px-4 py-2 text-center border border-theme-light">View</th>
                  <th className="px-4 py-2 text-center border border-theme-light">Nudge</th>
                </tr>
              </thead>
              <tbody>
                {filteredOverview.map((row) => {
                  const readyChip =
                    row.final_ready && row.has_final_pdf
                      ? { label: "Done", cls: "bg-theme-green text-white" }
                      : row.final_ready && !row.has_final_pdf
                        ? { label: "Needs PDF", cls: "bg-theme-orange text-white" }
                        : { label: "In progress", cls: "bg-gray-200 text-theme-dark" };
                  const quizText = row.quiz_completed
                    ? `${row.quiz_score ?? "—"}/${row.quiz_total ?? "—"}${row.quiz_percent != null ? ` (${row.quiz_percent}%)` : ""}`
                    : "Not taken";
                  return (
                    <tr key={row.user_email} className="hover:bg-gray-50">
                      <td className="px-4 py-2 border border-theme-light">{row.user_email}</td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        {row.current_module ?? "—"}
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        {row.final_ready ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        {row.has_final_pdf ? "✓" : "✗"}
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        {quizText}
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        <span
                          className={`inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ${readyChip.cls}`}
                        >
                          {readyChip.label}
                        </span>
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openViewPanel(row);
                          }}
                          className="px-3 py-1 rounded text-sm font-medium text-white bg-theme-blue hover:opacity-90"
                        >
                          View
                        </button>
                      </td>
                      <td className="px-4 py-2 border border-theme-light text-center">
                        <button
                          type="button"
                          onClick={async (e) => {
                            e.stopPropagation();
                            await copyToClipboard(buildNudgeMessage(row), "Copied");
                          }}
                          className="px-3 py-1 rounded text-sm font-medium bg-gray-100 text-theme-dark hover:bg-gray-200"
                        >
                          Copy Nudge
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredOverview.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-3 text-center text-theme-muted border border-theme-light"
                    >
                      {overview.length === 0
                        ? "No students in overview."
                        : "No students match this filter."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Phase 2: Student Detail View Panel */}
      {viewPanelOpen && viewPanelEmail && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeViewPanel}
            aria-hidden="true"
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[420px] bg-white border border-gray-200 rounded-l-xl shadow-lg z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
              <h2 className="text-lg font-semibold text-theme-dark truncate pr-2">
                {viewPanelEmail}
              </h2>
              <button
                type="button"
                onClick={closeViewPanel}
                className="shrink-0 text-theme-dark hover:text-theme-blue text-sm font-semibold p-1"
                aria-label="Close panel"
              >
                ✕
              </button>
            </div>

            {viewPanelLoading && (
              <div className="text-theme-muted text-sm">Loading…</div>
            )}
            {(viewPanelError || studentDetailByEmail[viewPanelEmail]?.error) && (
              <div className="text-theme-red font-medium text-sm mb-4">
                Error: {viewPanelError || studentDetailByEmail[viewPanelEmail]?.error}
              </div>
            )}

            {!viewPanelLoading && (
              <>
                {(() => {
                  const overviewRow = overview.find(
                    (r) => r.user_email === viewPanelEmail
                  );
                  const cached = studentDetailByEmail[viewPanelEmail];
                  const detail = cached?.data;
                  const locked =
                    detail?.module8?.final_ready ?? overviewRow?.final_ready ?? false;
                  const hasPdf = !!detail?.final_pdf?.url;
                  const hasDoc = !!detail?.google_doc?.url;

                  const formatDate = (val) =>
                    val ? new Date(val).toLocaleString() : null;

                  const sizeBytes = detail?.final_pdf?.file_size;
                  const pdfMb =
                    typeof sizeBytes === "number" && Number.isFinite(sizeBytes)
                      ? (sizeBytes / (1024 * 1024)).toFixed(1)
                      : null;

                  return (
                    <div className="space-y-4 text-sm">
                      {/* Actions row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(viewPanelEmail, "Email copied")
                          }
                          className="px-2 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-theme-dark hover:bg-gray-200"
                        >
                          Copy Email
                        </button>
                        <button
                          type="button"
                          onClick={refreshViewPanel}
                          disabled={viewPanelRefreshing}
                          className="px-2 py-1.5 rounded-lg text-xs font-medium bg-theme-blue text-white hover:opacity-90 disabled:opacity-60"
                        >
                          {viewPanelRefreshing ? "Refreshing…" : "Refresh"}
                        </button>
                        {copyFeedback && (
                          <span className="text-xs text-theme-green font-medium">
                            {copyFeedback}
                          </span>
                        )}
                      </div>

                      {/* Status chips */}
                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium bg-gray-100 text-theme-dark">
                          Module {overviewRow?.current_module ?? "—"}
                        </span>
                        <span
                          className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${
                            locked ? "bg-theme-green text-white" : "bg-gray-200 text-theme-dark"
                          }`}
                        >
                          {locked ? "Locked" : "Not locked"}
                        </span>
                      </div>

                      {/* Module 8 Locked Final Text */}
                      <section>
                        <div className="text-xs uppercase tracking-wide text-theme-muted mb-2">
                          Module 8 Locked Final Text
                        </div>
                        {detail?.module8?.final_text ? (
                          <>
                            {detail.module8.updated_at && (
                              <p className="text-xs text-theme-muted mb-1">
                                Last updated: {formatDate(detail.module8.updated_at)}
                              </p>
                            )}
                            <pre className="bg-gray-50 border border-theme-light rounded-xl p-4 text-xs whitespace-pre-wrap max-h-48 overflow-y-auto">
                              {detail.module8.final_text}
                            </pre>
                          </>
                        ) : (
                          <p className="text-theme-muted">No locked draft found.</p>
                        )}
                      </section>

                      {/* Module 9 Quiz */}
                      <section>
                        <div className="text-xs uppercase tracking-wide text-theme-muted mb-2">
                          Module 9 Quiz
                        </div>
                        {detail?.quiz ? (
                          <>
                            <p className="text-theme-dark">
                              Score: {detail.quiz.score}/{detail.quiz.total}
                              {detail.quiz.percent != null
                                ? ` (${detail.quiz.percent}%)`
                                : ""}
                            </p>
                            {detail.quiz.submitted_at && (
                              <p className="text-xs text-theme-muted">
                                Submitted: {formatDate(detail.quiz.submitted_at)}
                              </p>
                            )}
                            <p className="text-xs text-theme-muted mt-1 italic">
                              {detail.quiz.percent != null && detail.quiz.percent < 70
                                ? "Likely needs APA help. Consider conferencing before accepting final formatting."
                                : "Quiz indicates basic APA readiness."}
                            </p>
                          </>
                        ) : (
                          <p className="text-theme-muted">Quiz not submitted yet.</p>
                        )}
                      </section>

                      {/* Module 9 Submission Links */}
                      <section>
                        <div className="text-xs uppercase tracking-wide text-theme-muted mb-2">
                          Module 9 Submission Links
                        </div>
                        <div className="mb-2">
                          {hasPdf ? (
                            <span className="text-theme-green font-medium">
                              Submitted
                            </span>
                          ) : (
                            <span className="text-theme-red font-medium">
                              Not submitted yet
                            </span>
                          )}
                          {hasPdf &&
                            (detail.final_pdf.uploaded_at ?? detail.final_pdf.created_at) && (
                              <span className="text-theme-muted text-xs ml-2">
                                Uploaded:{" "}
                                {formatDate(
                                  detail.final_pdf.uploaded_at ??
                                    detail.final_pdf.created_at
                                )}
                              </span>
                            )}
                        </div>
                        {!hasPdf && hasDoc && (
                          <p className="text-amber-700 text-xs mb-2">
                            Student exported doc but did not upload PDF yet.
                          </p>
                        )}
                        {hasPdf && !hasDoc && (
                          <p className="text-amber-700 text-xs mb-2">
                            Student uploaded PDF but export link not found. They
                            may have used the template manually.
                          </p>
                        )}
                        <div className="flex flex-wrap gap-2 items-center">
                          {detail?.final_pdf?.url ? (
                            <>
                              <a
                                href={detail.final_pdf.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block px-3 py-2 rounded-xl text-white text-sm font-medium bg-theme-blue hover:opacity-90 shadow-sm"
                              >
                                Final PDF
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    detail.final_pdf.url,
                                    "PDF link copied"
                                  )
                                }
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-theme-dark hover:bg-gray-200"
                              >
                                Copy link
                              </button>
                            </>
                          ) : null}
                          {detail?.google_doc?.url ? (
                            <>
                              <a
                                href={detail.google_doc.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block px-3 py-2 rounded-xl text-white text-sm font-medium bg-theme-green hover:opacity-90 shadow-sm"
                              >
                                Google Doc
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  copyToClipboard(
                                    detail.google_doc.url,
                                    "Doc link copied"
                                  )
                                }
                                className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 text-theme-dark hover:bg-gray-200"
                              >
                                Copy link
                              </button>
                            </>
                          ) : null}
                          {!hasPdf && !hasDoc && (
                            <p className="text-theme-muted">
                              No submission links found.
                            </p>
                          )}
                        </div>
                        {detail?.final_pdf?.file_name && (
                          <p className="text-xs text-theme-muted mt-2">
                            File: {detail.final_pdf.file_name}
                            {pdfMb != null ? ` (${pdfMb} MB)` : ""}
                          </p>
                        )}
                        {detail?.google_doc?.created_at && (
                          <p className="text-xs text-theme-muted mt-1">
                            Doc created: {formatDate(detail.google_doc.created_at)}
                          </p>
                        )}
                        <p className="text-xs text-theme-muted mt-2">
                          {detail?.checklist
                            ? `Checklist: ${detail.checklist.complete ? "Complete" : "Incomplete"}${
                                detail.checklist.updated_at
                                  ? ` — ${formatDate(detail.checklist.updated_at)}`
                                  : ""
                              }`
                            : "Checklist: Not started"}
                        </p>
                      </section>
                    </div>
                  );
                })()}
              </>
            )}
          </aside>
        </>
      )}

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
                const isSelected = drawerOpen && selectedEmail === row.email;
                const baseRowBg =
                  isSelected
                    ? "bg-theme-light"
                    : idx % 2 === 0
                    ? "bg-white"
                    : "bg-gray-50";
                const selectionAccent = isSelected
                  ? "border-l-4 border-theme-green"
                  : "border-l-4 border-transparent";

                return (
                  <tr
                    key={row.email}
                    onClick={() => {
                      setSelectedEmail(row.email);
                      setDrawerOpen(true);
                    }}
                    className={`cursor-pointer ${baseRowBg} hover:bg-theme-light transition-colors ${selectionAccent}`}
                  >
                    {/* sticky student cell */}
                    <td
                      className={`border border-theme-light px-4 py-2 font-medium text-theme-dark sticky left-0 z-10 ${baseRowBg} ${selectionAccent}`}
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
                        {row.submittedFinalPdf && (
                          <span
                            className={`inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium ${
                              gradingStatusBadgeClasses[row.gradingStatus] ||
                              "bg-gray-200 text-theme-dark"
                            }`}
                          >
                            {gradingStatusLabels[row.gradingStatus] || "Ungraded"}
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

      {/* SUBMISSION DETAIL DRAWER */}
      {drawerOpen && selectedRow && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => {
              setDrawerOpen(false);
              setSelectedEmail(null);
            }}
          />
          <aside className="fixed right-0 top-0 h-full w-full sm:w-[360px] bg-white border border-gray-200 rounded-l-xl shadow-lg z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-2">
              <h2 className="text-lg font-semibold text-theme-dark">
                Submission Details
              </h2>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setSelectedEmail(null);
                }}
                className="text-theme-dark hover:text-theme-blue text-sm font-semibold"
                aria-label="Close drawer"
              >
                X
              </button>
            </div>

            <div className="mt-4 space-y-4 text-sm text-theme-dark">
              <section className="space-y-1">
                <div className="text-xs uppercase tracking-wide text-theme-muted">
                  Student info
                </div>
                <div className="font-medium">{selectedRow.email}</div>
                <div className="text-theme-muted">
                  Status: {selectedRow.status}
                </div>
                <div className="text-theme-muted">
                  Current module: {selectedRow.currentModule ?? "0"}
                </div>
                <div className="text-theme-muted">
                  Module 9 quiz: {selectedRow.module9Quiz || "No attempt yet"}
                </div>
              </section>

              <section className="space-y-2">
                <div className="text-xs uppercase tracking-wide text-theme-muted">
                  Links
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedRow.googleDocUrl ? (
                    <a
                      href={selectedRow.googleDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 rounded text-white text-xs font-medium bg-theme-green hover:opacity-90"
                    >
                      Open Google Doc
                    </a>
                  ) : (
                    <span className="text-theme-muted text-xs">
                      No Google Doc link
                    </span>
                  )}
                  {selectedRow.finalPdfUrl ? (
                    <a
                      href={selectedRow.finalPdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block px-3 py-1.5 rounded text-white text-xs font-medium bg-theme-blue hover:opacity-90"
                    >
                      Open final PDF
                    </a>
                  ) : (
                    <span className="text-theme-muted text-xs">
                      No final PDF
                    </span>
                  )}
                </div>
                {selectedRow.finalPdfUrl && (
                  <a
                    href={selectedRow.finalPdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="text-theme-blue underline text-xs"
                  >
                    Download PDF
                  </a>
                )}
              </section>

              <section className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-theme-muted">
                  Grading status
                </label>
                <select
                  value={selectedRow.gradingStatus}
                  onChange={(event) =>
                    handleGradingStatusChange(
                      selectedRow.email,
                      event.target.value
                    )
                  }
                  disabled={!selectedRow.submittedFinalPdf}
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-green disabled:bg-gray-100"
                >
                  {gradingStatusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {gradingStatusStatusByEmail[selectedRow.email] && (
                  <p className="text-xs text-theme-muted">
                    {gradingStatusStatusByEmail[selectedRow.email]}
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <label className="text-xs uppercase tracking-wide text-theme-muted">
                  Quick notes
                </label>
                <textarea
                  rows={4}
                  value={notesByEmail[selectedRow.email] ?? ""}
                  onChange={(event) =>
                    handleNoteChange(selectedRow.email, event.target.value)
                  }
                  className="w-full border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-green"
                />
                <p className="text-xs text-theme-muted">
                  Saved to your teacher notes with a local fallback
                </p>
                {notesStatusByEmail[selectedRow.email] && (
                  <p className="text-xs text-theme-muted">
                    {notesStatusByEmail[selectedRow.email]}
                  </p>
                )}
              </section>
            </div>
          </aside>
        </>
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