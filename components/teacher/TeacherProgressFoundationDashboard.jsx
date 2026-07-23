"use client";

/**
 * WP-099 — Teacher progress visibility foundation UI (development-gated).
 * Progress / Submissions / Settings jobs. Detail drawer with focus trap.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import TeacherWordCountSettings from "@/components/teacher/TeacherWordCountSettings";
import TeacherWritingSpineRollout from "@/components/teacher/TeacherWritingSpineRollout";
import TeacherEvidenceArgumentRollout from "@/components/teacher/TeacherEvidenceArgumentRollout";
import TeacherVocabularyTransferRollout from "@/components/teacher/TeacherVocabularyTransferRollout";
import TeacherSubmissionProtocolRollout from "@/components/teacher/TeacherSubmissionProtocolRollout";

const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;

const FILTERS = [
  { id: "all", label: "All" },
  { id: "in_progress", label: "In progress" },
  { id: "needs_attention", label: "Needs attention" },
  { id: "ready_for_next", label: "Ready / Preparing" },
  { id: "submitted", label: "Submitted" },
];

const gradingStatusOptions = [
  { value: "ungraded", label: "Ungraded" },
  { value: "in_review", label: "In review" },
  { value: "graded", label: "Graded" },
];

function statusBadgeClass(status) {
  switch (status) {
    case "submitted":
      return "bg-theme-green text-white";
    case "needs_attention":
      return "bg-theme-orange text-white";
    case "ready_for_next":
      return "bg-theme-blue text-white";
    case "not_started":
      return "bg-gray-200 text-theme-dark";
    default:
      return "bg-theme-light text-theme-dark";
  }
}

function formatWhen(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

function trailSummary(trail) {
  if (!Array.isArray(trail)) return "—";
  const present = trail.filter((t) => t.present).map((t) => t.label);
  if (present.length === 0) return "None yet";
  if (present.length <= 3) return present.join(" · ");
  return `${present.slice(0, 2).join(" · ")} · +${present.length - 2}`;
}

export default function TeacherProgressFoundationDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const titleId = useId();
  const drawerTitleId = useId();

  const [role, setRole] = useState(null);
  const [tab, setTab] = useState("progress");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roster, setRoster] = useState(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  // Foundation UI defaults to synthetic fixtures for deterministic verification.
  const [useFixtures, setUseFixtures] = useState(true);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailStudentId, setDetailStudentId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState("");
  const [gradingStatus, setGradingStatus] = useState("ungraded");
  const [gradingStatusState, setGradingStatusState] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);

  const openButtonRef = useRef(null);
  const drawerRef = useRef(null);
  const noteTimerRef = useRef(null);

  useEffect(() => {
    const loadRole = async () => {
      try {
        const res = await fetch("/api/role");
        if (!res.ok) throw new Error("Failed to fetch role");
        const data = await res.json();
        setRole(data.role || "student");
      } catch {
        setRole("student");
      }
    };
    loadRole();
  }, []);

  const loadRoster = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const qs = useFixtures ? "?source=fixtures" : "";
      const res = await fetch(`/api/teacher/roster${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) {
        throw new Error(data.error || "Could not load roster");
      }
      setRoster(data);
    } catch (err) {
      setError(err?.message || "Could not load roster");
      setRoster(null);
    } finally {
      setLoading(false);
    }
  }, [useFixtures]);

  useEffect(() => {
    if (!session?.user?.email) return;
    if (role && role !== "teacher") return;
    loadRoster();
  }, [session?.user?.email, role, loadRoster]);

  const filteredStudents = useMemo(() => {
    const students = roster?.students || [];
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (filter === "in_progress" && s.overallStatus !== "in_progress") return false;
      if (filter === "needs_attention" && s.overallStatus !== "needs_attention")
        return false;
      if (filter === "ready_for_next" && s.overallStatus !== "ready_for_next")
        return false;
      if (filter === "submitted" && s.overallStatus !== "submitted") return false;
      if (!q) return true;
      const hay = `${s.displayName || ""} ${s.email || ""} ${s.studentId || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [roster, filter, search]);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setDetailStudentId(null);
    setDetail(null);
    setDetailError(null);
    setNoteDraft("");
    setHistoryOpen(false);
    if (openButtonRef.current) {
      openButtonRef.current.focus();
    }
    openButtonRef.current = null;
  }, []);

  const openDetail = useCallback(
    async (student, triggerEl) => {
      openButtonRef.current = triggerEl || null;
      setDetailOpen(true);
      setDetailStudentId(student.studentId || student.email);
      setDetail(null);
      setDetailError(null);
      setDetailLoading(true);
      setHistoryOpen(false);
      try {
        const key = student.email || student.studentId;
        const qs = useFixtures
          ? `?source=fixtures&studentId=${encodeURIComponent(student.studentId)}&email=${encodeURIComponent(student.email || "")}`
          : `?email=${encodeURIComponent(key)}`;
        const res = await fetch(`/api/teacher/student-progress${qs}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) {
          throw new Error(data.error || "Could not load student");
        }
        setDetail(data.student);
        setNoteDraft(data.student?.note || "");
        setGradingStatus(data.student?.finalPdf?.gradingStatus || "ungraded");
      } catch (err) {
        setDetailError(err?.message || "Could not load student");
      } finally {
        setDetailLoading(false);
      }
    },
    [useFixtures]
  );

  // Focus trap + Escape
  useEffect(() => {
    if (!detailOpen) return;
    const node = drawerRef.current;
    const focusables = () =>
      node
        ? Array.from(
            node.querySelectorAll(
              'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
          ).filter((el) => !el.hasAttribute("disabled"))
        : [];

    const t = window.setTimeout(() => {
      const list = focusables();
      if (list[0]) list[0].focus();
    }, 0);

    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDetail();
        return;
      }
      if (e.key !== "Tab" || !node) return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, [detailOpen, closeDetail, detailLoading]);

  const saveNote = useCallback(
    async (value) => {
      if (useFixtures) {
        setNoteStatus("Saved (fixture)");
        return;
      }
      const email = detail?.email;
      if (!email) return;
      setNoteStatus("Saving…");
      try {
        const res = await fetch("/api/teacher/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentEmail: email,
            assignmentName: ASSIGNMENT_NAME,
            note: value,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.error || "Save failed");
        setNoteStatus("Saved");
      } catch (err) {
        setNoteStatus(err?.message || "Save failed");
      }
    },
    [detail?.email, useFixtures]
  );

  const onNoteChange = (value) => {
    setNoteDraft(value);
    if (noteTimerRef.current) window.clearTimeout(noteTimerRef.current);
    noteTimerRef.current = window.setTimeout(() => saveNote(value), 600);
  };

  const saveGrading = async (next) => {
    setGradingStatus(next);
    if (useFixtures) {
      setGradingStatusState("Saved (fixture)");
      return;
    }
    const email = detail?.email;
    if (!email) return;
    setGradingStatusState("Saving…");
    try {
      const res = await fetch("/api/teacher/submissions/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentEmail: email, gradingStatus: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || "Save failed");
      setGradingStatusState("Saved");
    } catch (err) {
      setGradingStatusState(err?.message || "Save failed");
    }
  };

  if (sessionStatus === "loading" || role === null) {
    return <div className="p-6 text-theme-muted">Loading…</div>;
  }

  if (!session?.user) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-theme-dark">Teacher Dashboard</h1>
        <p className="mt-2 text-theme-muted">Sign in to continue.</p>
        <a
          href="/api/auth/signin"
          className="mt-3 inline-block rounded bg-theme-blue px-4 py-2 text-white"
        >
          Sign in
        </a>
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

  const summary = roster?.summary;

  return (
    <div
      className="mx-auto max-w-6xl space-y-5 rounded bg-theme-light p-4 shadow-sm sm:p-6"
      data-wp099-teacher-progress-foundation="1"
    >
      <header className="border-b border-theme-blue pb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-theme-muted">
          {ASSIGNMENT_NAME}
        </p>
        <h1 id={titleId} className="text-3xl font-extrabold tracking-tight text-theme-blue">
          Student progress
        </h1>
        <p className="mt-1 text-sm text-theme-muted">
          See where each student is in the writing journey. Submission means a saved final PDF
          receipt—not a quiz score or Google Doc alone.
        </p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Teacher dashboard sections">
        {[
          { id: "progress", label: "Progress" },
          { id: "submissions", label: "Submissions" },
          { id: "settings", label: "Settings" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-theme-blue ${
              tab === t.id
                ? "bg-theme-blue text-white"
                : "border border-theme-light bg-white text-theme-dark"
            }`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-theme-muted">
          <input
            type="checkbox"
            checked={useFixtures}
            onChange={(e) => setUseFixtures(e.target.checked)}
          />
          Synthetic fixtures (dev)
        </label>
      </div>

      {tab === "progress" && (
        <section aria-labelledby={titleId} className="space-y-3">
          {summary && (
            <div className="flex flex-wrap gap-3 text-sm" data-wp099-summary="1">
              <span className="rounded bg-white px-2 py-1 border border-theme-light">
                Total {summary.total}
              </span>
              <span className="rounded bg-white px-2 py-1 border border-theme-light">
                In progress {summary.in_progress}
              </span>
              <span className="rounded bg-white px-2 py-1 border border-theme-light">
                Needs attention {summary.needs_attention}
              </span>
              <span className="rounded bg-white px-2 py-1 border border-theme-light">
                Ready {summary.ready_for_next}
              </span>
              <span className="rounded bg-white px-2 py-1 border border-theme-light">
                Submitted {summary.submitted}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="wp099-filter">
              Filter students
            </label>
            <select
              id="wp099-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-theme-light bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-blue"
            >
              {FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="wp099-search">
              Search students
            </label>
            <input
              id="wp099-search"
              type="search"
              placeholder="Search name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-52 rounded-lg border border-theme-light px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-theme-blue"
            />
            <button
              type="button"
              className="rounded-lg border border-theme-light bg-white px-3 py-2 text-sm font-medium"
              onClick={loadRoster}
            >
              Refresh
            </button>
          </div>

          {loading && <p className="text-theme-muted">Loading roster…</p>}
          {error && <p className="font-medium text-theme-red">Error: {error}</p>}

          {!loading && !error && (
            <div className="overflow-x-auto rounded-xl border border-theme-light bg-white shadow-sm">
              <table className="min-w-full text-sm" data-wp099-roster="1">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border border-theme-light px-3 py-2">Student</th>
                    <th className="border border-theme-light px-3 py-2">Stage</th>
                    <th className="border border-theme-light px-3 py-2">Current work</th>
                    <th className="border border-theme-light px-3 py-2">Updated</th>
                    <th className="border border-theme-light px-3 py-2">Trail</th>
                    <th className="border border-theme-light px-3 py-2">Receipt</th>
                    <th className="border border-theme-light px-3 py-2"> </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-theme-light px-3 py-6 text-center text-theme-muted"
                      >
                        No students match this view.
                      </td>
                    </tr>
                  )}
                  {filteredStudents.map((s) => (
                    <tr key={s.studentId} className="align-top">
                      <td className="border border-theme-light px-3 py-2">
                        <div className="font-medium text-theme-dark">
                          {s.displayName || s.email || s.studentId}
                        </div>
                        {s.displayName && s.email && (
                          <div className="text-xs text-theme-muted">{s.email}</div>
                        )}
                        <span
                          className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[11px] font-semibold ${statusBadgeClass(s.overallStatus)}`}
                        >
                          {s.overallStatus.replaceAll("_", " ")}
                        </span>
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        {s.currentWorkStageId || "—"}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        {s.currentWorkLabel}
                      </td>
                      <td className="border border-theme-light px-3 py-2 whitespace-nowrap">
                        {formatWhen(s.latestUpdateAt)}
                      </td>
                      <td className="border border-theme-light px-3 py-2 text-xs text-theme-muted">
                        {trailSummary(s.artifactTrail)}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        {s.receiptStatus?.submitted ? "Yes" : "No"}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        <button
                          type="button"
                          className="rounded bg-theme-blue px-2 py-1 text-xs font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-theme-blue"
                          data-wp099-view-student={s.studentId}
                          onClick={(e) => openDetail(s, e.currentTarget)}
                        >
                          View student
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "submissions" && (
        <section className="space-y-3" data-wp099-submissions="1">
          <h2 className="text-lg font-semibold text-theme-dark">Submissions / review</h2>
          <p className="text-sm text-theme-muted">
            Only students with a durable final PDF receipt appear here. Google Docs are reviewed
            from the student detail panel—not as submissions.
          </p>
          <div className="overflow-x-auto rounded-xl border border-theme-light bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-gray-100 text-left">
                  <th className="border border-theme-light px-3 py-2">Student</th>
                  <th className="border border-theme-light px-3 py-2">Submitted</th>
                  <th className="border border-theme-light px-3 py-2">Grading</th>
                  <th className="border border-theme-light px-3 py-2"> </th>
                </tr>
              </thead>
              <tbody>
                {(roster?.submissions || []).length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-theme-light px-3 py-6 text-center text-theme-muted"
                    >
                      No receipt-backed submissions yet.
                    </td>
                  </tr>
                )}
                {(roster?.submissions || []).map((s) => {
                  const full =
                    (roster?.students || []).find((r) => r.studentId === s.studentId) || s;
                  return (
                    <tr key={s.studentId}>
                      <td className="border border-theme-light px-3 py-2">
                        {s.displayName || s.email}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        {formatWhen(s.submittedAt)}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        {s.gradingStatus || "ungraded"}
                      </td>
                      <td className="border border-theme-light px-3 py-2">
                        <button
                          type="button"
                          className="rounded bg-theme-blue px-2 py-1 text-xs font-semibold text-white"
                          onClick={(e) => openDetail(full, e.currentTarget)}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "settings" && (
        <section className="space-y-4" data-wp099-settings="1">
          <h2 className="text-lg font-semibold text-theme-dark">Assignment settings</h2>
          <div className="space-y-3 rounded-xl border border-theme-light bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-theme-muted">
              Student expectations
            </h3>
            <TeacherWordCountSettings />
          </div>
          <div className="space-y-3 rounded-xl border border-theme-light bg-white p-4">
            <h3 className="text-sm font-bold uppercase tracking-wide text-theme-muted">
              Instructional pathway controls
            </h3>
            <details className="rounded border border-theme-light p-3">
              <summary className="cursor-pointer text-sm font-semibold text-theme-dark">
                Advanced rollouts
              </summary>
              <div className="mt-3 space-y-4">
                <TeacherWritingSpineRollout />
                <TeacherEvidenceArgumentRollout />
                <TeacherVocabularyTransferRollout />
                <TeacherSubmissionProtocolRollout />
              </div>
            </details>
          </div>
        </section>
      )}

      {detailOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end bg-black/40"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeDetail();
          }}
        >
          <aside
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={drawerTitleId}
            className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-4 shadow-xl sm:p-5"
            data-wp099-student-detail="1"
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <h2 id={drawerTitleId} className="text-xl font-bold text-theme-dark">
                  {detail?.progress?.displayName ||
                    detail?.email ||
                    detailStudentId ||
                    "Student"}
                </h2>
                <p className="text-sm text-theme-muted">{detail?.email}</p>
              </div>
              <button
                type="button"
                className="rounded border border-theme-light px-2 py-1 text-sm"
                onClick={closeDetail}
                data-wp099-close-detail="1"
              >
                Close
              </button>
            </div>

            {detailLoading && <p className="text-theme-muted">Loading…</p>}
            {detailError && <p className="text-theme-red">{detailError}</p>}

            {detail && !detailLoading && (
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-theme-dark">
                    {detail.progress?.currentWorkLabel}
                  </p>
                  <p className="text-theme-muted">
                    Status: {detail.progress?.overallStatus?.replaceAll("_", " ")}
                  </p>
                  {detail.progress?.attentionReasons?.length > 0 && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-theme-orange">
                      {detail.progress.attentionReasons.map((r) => (
                        <li key={r.code}>
                          {r.message}
                          {r.safeAction ? ` (${r.safeAction.replaceAll("_", " ")})` : ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold">Artifact trail</h3>
                  <ul className="mt-1 space-y-1">
                    {(detail.progress?.artifactTrail || []).map((t) => (
                      <li key={t.id} className="flex justify-between gap-2">
                        <span>{t.label}</span>
                        <span>{t.present ? "Yes" : "—"}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold">Documents</h3>
                  {detail.googleDoc?.url ? (
                    <a
                      href={detail.googleDoc.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-theme-blue underline"
                    >
                      Open Google Doc
                    </a>
                  ) : (
                    <p className="text-theme-muted">No Google Doc pointer saved.</p>
                  )}
                  {detail.finalPdf?.url ? (
                    <div>
                      <a
                        href={detail.finalPdf.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-theme-blue underline"
                      >
                        Open final PDF
                      </a>
                      <p className="text-xs text-theme-muted">
                        {detail.finalPdf.fileName || "PDF"}
                        {detail.finalPdf.fileSize != null
                          ? ` · ${(detail.finalPdf.fileSize / 1024).toFixed(1)} KB`
                          : ""}
                      </p>
                    </div>
                  ) : (
                    <p className="text-theme-muted">No final PDF receipt.</p>
                  )}
                </div>

                {detail.finalPdf && (
                  <div>
                    <label className="font-semibold" htmlFor="wp099-grade">
                      Grading status
                    </label>
                    <select
                      id="wp099-grade"
                      value={gradingStatus}
                      onChange={(e) => saveGrading(e.target.value)}
                      className="mt-1 block w-full rounded border border-theme-light px-2 py-1"
                    >
                      {gradingStatusOptions.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                    {gradingStatusState && (
                      <p className="text-xs text-theme-muted">{gradingStatusState}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="font-semibold" htmlFor="wp099-note">
                    Teacher notes
                  </label>
                  <textarea
                    id="wp099-note"
                    value={noteDraft}
                    onChange={(e) => onNoteChange(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded border border-theme-light px-2 py-1"
                  />
                  {noteStatus && (
                    <p className="text-xs text-theme-muted">{noteStatus}</p>
                  )}
                </div>

                <details
                  open={historyOpen}
                  onToggle={(e) => setHistoryOpen(e.currentTarget.open)}
                >
                  <summary className="cursor-pointer font-semibold">
                    {detail.historicalRecords?.label || "Historical records"}
                  </summary>
                  <div className="mt-2 space-y-1 text-theme-muted">
                    <p>
                      Quiz:{" "}
                      {detail.historicalRecords?.quiz
                        ? `${detail.historicalRecords.quiz.percent ?? "—"}% (historical only — not readiness)`
                        : "None"}
                    </p>
                    <p>
                      Checklist:{" "}
                      {detail.historicalRecords?.checklist
                        ? detail.historicalRecords.checklist.complete
                          ? "Recorded complete (historical — not formatting proof)"
                          : "Incomplete record"
                        : "None"}
                    </p>
                  </div>
                </details>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
