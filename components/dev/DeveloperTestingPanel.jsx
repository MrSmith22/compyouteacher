"use client";

/**
 * Developer Testing Panel
 *
 * DEV ONLY — accelerates walkthrough verification without recreating student progress.
 * Mounted only when NODE_ENV === "development". Never ships in production UI.
 *
 * Uses /api/dev/panel and existing helpers (export-to-docs, reset-student,
 * openSavedSourceTexts). Does not change production application behavior.
 */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  getRestartWarning,
  hasDownstreamAssignmentWork,
  RESTART_ACTIONS,
  RESTART_ACTION_LABELS,
  resolveBrowserCacheClearMode,
} from "@/lib/module1/restartHelpers";
import {
  clearModule1FlowCache,
  clearStudentCache,
} from "@/lib/storage/studentCache";
import { openSavedSourceTexts } from "@/lib/sources/openSavedSourceTexts";
import { upsertModule9Checklist } from "@/lib/supabase/helpers/module9Checklist";
import {
  isRhetoricalSituationDevBypassAvailable,
  readRhetoricalSituationDevBypassFlag,
  writeRhetoricalSituationDevBypassFlag,
} from "@/lib/module2/rhetoricalSituationGate";

function clearBrowserCacheForDevAction(action, email) {
  if (!email) return;
  const mode = resolveBrowserCacheClearMode(action);
  if (mode === "module1_flow_only") {
    clearModule1FlowCache(email);
    return;
  }
  if (mode === "all_user_scoped") {
    clearStudentCache(email);
  }
}

function logDev(...args) {
  console.log("[Dev Panel]", ...args);
}

async function panelAction(action, payload = {}) {
  const res = await fetch("/api/dev/panel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Action failed: ${action}`);
  }
  return data;
}

async function fetchStatus() {
  const res = await fetch("/api/dev/panel", { credentials: "include" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error || "Could not load status");
  }
  return data.status;
}

const btn =
  "rounded border border-slate-400 bg-white px-2 py-1 text-[11px] font-medium text-slate-800 hover:bg-slate-100 disabled:opacity-40";
const btnDanger =
  "rounded border border-red-500 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-40";
const sectionTitle =
  "mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-500";

export default function DeveloperTestingPanel() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const email = session?.user?.email ?? "";

  const refresh = useCallback(async () => {
    if (!email) {
      setStatus(null);
      return;
    }
    try {
      const next = await fetchStatus();
      setStatus(next);
    } catch (err) {
      logDev("Status refresh failed", err);
    }
  }, [email]);

  useEffect(() => {
    if (sessionStatus !== "authenticated") return;
    refresh();
    const id = window.setInterval(refresh, 8000);
    return () => window.clearInterval(id);
  }, [sessionStatus, refresh]);

  async function run(label, fn) {
    setBusy(true);
    setMessage("");
    try {
      const detail = await fn();
      const nextMessage =
        typeof detail === "string" && detail.trim() ? detail : label;
      logDev(nextMessage);
      setMessage(nextMessage);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logDev("Error:", msg);
      setMessage(`Error: ${msg}`);
    } finally {
      setBusy(false);
    }
  }

  async function jumpToModule(moduleNumber) {
    await run(`Jumped to Module ${moduleNumber}`, async () => {
      await panelAction("setModule", { module: moduleNumber });
      const path = moduleNumber >= 10 ? "/dashboard" : `/modules/${moduleNumber}`;
      router.push(path);
      return `Jump to module (progression only) → M${moduleNumber}`;
    });
  }

  async function restartModule1WithWarning() {
    const downstream = hasDownstreamAssignmentWork({
      currentModule: status?.currentModule,
      hasTcharts: Boolean(status?.observationsCount),
      hasLaterArtifacts: Boolean(
        status?.outlineExists || status?.draft6Present || status?.draft7Present
      ),
    });
    const warning = getRestartWarning(RESTART_ACTIONS.RESTART_MODULE_1, {
      hasDownstream: downstream,
    });
    const ok = window.confirm(`${warning.title}\n\n${warning.message}`);
    if (!ok) return;
    await run(RESTART_ACTION_LABELS[RESTART_ACTIONS.RESTART_MODULE_1], async () => {
      await panelAction("restartModule1");
      clearBrowserCacheForDevAction(RESTART_ACTIONS.RESTART_MODULE_1, email);
      router.push("/modules/1/prompt");
      return "Restart Module 1 complete — Step 1 Question 1";
    });
  }

  async function restartEntireAssignmentWithWarning() {
    const warning = getRestartWarning(RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT);
    const ok = window.confirm(`${warning.title}\n\n${warning.message}`);
    if (!ok) return;
    const typed = window.prompt("Type OK to confirm full assignment restart:");
    if (typed !== "OK") return;
    await run(
      RESTART_ACTION_LABELS[RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT],
      async () => {
        await panelAction("restartEntireAssignment");
        clearBrowserCacheForDevAction(
          RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT,
          email
        );
        router.push("/modules/1/prompt");
        return "Restart the entire assignment complete — Module 1 Step 1 Q1";
      }
    );
  }

  async function createOrRebuildGoogleDoc() {
    await run("Google Doc created/rebuilt", async () => {
      const prepared = await panelAction("prepareGoogleDocExport");
      const res = await fetch("/api/export-to-docs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: prepared.text, email }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(result.error || "Export to Google Docs failed");
      }
    });
  }

  async function handleModule9Toggle(key, enabled) {
    await run(
      `Module 9 ${key} → ${enabled ? "on" : "off"}`,
      async () => {
        if (key === "checklist") {
          if (enabled) {
            await upsertModule9Checklist({
              userEmail: email,
              items: Array(6).fill(true),
            });
          } else {
            await panelAction("module9Shortcut", { key: "checklist", enabled: false });
          }
          return;
        }

        if (key === "googleDoc" && enabled) {
          await panelAction("module9Shortcut", {
            key: "googleDoc",
            enabled: true,
          });
          return;
        }

        await panelAction("module9Shortcut", { key, enabled });
      }
    );
  }

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  if (sessionStatus === "unauthenticated") {
    return null;
  }

  return (
    <div className="fixed bottom-3 right-3 z-[9999] max-w-[min(100vw-1.5rem,22rem)] font-sans shadow-xl">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-t-lg border border-slate-700 bg-slate-800 px-3 py-2 text-left text-xs font-semibold text-white"
      >
        Developer Testing Panel {open ? "▾" : "▸"}
      </button>

      {open ? (
        <div className="max-h-[min(70vh,36rem)] space-y-3 overflow-y-auto rounded-b-lg border border-t-0 border-slate-700 bg-slate-50 p-3 text-slate-900">
          {message ? (
            <p className="rounded bg-slate-200 px-2 py-1 text-[11px] text-slate-700">
              {message}
            </p>
          ) : null}

          <section>
            <p className={sectionTitle}>Status</p>
            <div className="space-y-0.5 rounded border border-slate-200 bg-white p-2 text-[11px] leading-snug">
              <div>User: {status?.userEmail || email || "—"}</div>
              <div>Assignment: {status?.assignmentName || "—"}</div>
              <div>
                Assignment row:{" "}
                {status?.assignmentRowFound
                  ? "found"
                  : status?.assignmentError
                    ? `error (${status.assignmentError})`
                    : "missing"}
              </div>
              <div>Current module: {status?.currentModule ?? "—"}</div>
              <div>
                Outline exists:{" "}
                {status?.outlineExists
                  ? status?.outlineFinalized
                    ? "Yes (finalized)"
                    : "Yes"
                  : "No"}
              </div>
              <div>
                Draft exists:{" "}
                {status?.draft6Present
                  ? status?.draft6Locked
                    ? "Yes (locked)"
                    : "Yes"
                  : "No"}
              </div>
              <div>
                Revision exists:{" "}
                {status?.draft7Present
                  ? status?.draft7FinalReady
                    ? "Yes (final)"
                    : "Yes"
                  : "No"}
              </div>
              <div>Paragraph plans: {status?.paragraphPlans ?? 0}</div>
              <div>Observations: {status?.observationsCount ?? 0}</div>
              <div>
                Google Doc:{" "}
                {status?.googleDoc || status?.googleDocUrl
                  ? "Yes"
                  : status?.googleDocError
                    ? `No (${status.googleDocError})`
                    : "No"}
              </div>
              <div>PDF: {status?.pdf || status?.pdfUploaded ? "Yes" : "No"}</div>
              <div>Quiz: {status?.quizComplete ? status.quizScore || "Done" : "No"}</div>
              <div>Checklist: {status?.checklistComplete ? "Complete" : "Incomplete"}</div>
              <div>Module 9+ complete: {status?.moduleComplete ? "Yes" : "No"}</div>
            </div>
            <button type="button" className={`${btn} mt-1`} disabled={busy} onClick={() => run("Status refreshed", refresh)}>
              Refresh status
            </button>
          </section>

          <section>
            <p className={sectionTitle}>Seed prerequisites</p>
            <div className="flex flex-wrap gap-1">
              {[
                [2, "Seed through Module 2"],
                [3, "Seed through Module 3"],
                [4, "Seed through Module 4"],
                [5, "Seed through Module 5"],
                [6, "Seed through Module 6"],
                [7, "Seed through Module 7"],
              ].map(([n, label]) => (
                <button
                  key={n}
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() =>
                    run(label, async () => {
                      await panelAction("seedThrough", { target: n });
                    })
                  }
                >
                  {label}
                </button>
              ))}
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Seeded complete essay", async () => {
                    await panelAction("seedThrough", { target: "completeEssay" });
                  })
                }
              >
                Seed complete essay
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Seeded Module 9 ready", async () => {
                    const result = await panelAction("seedThrough", {
                      target: "module9Ready",
                      module9Options: {
                        googleDoc: true,
                        checklist: true,
                        quiz: true,
                        pdf: true,
                        moduleComplete: false,
                      },
                    });
                    const docSrc = result?.artifacts?.googleDoc?.source || "—";
                    const pdfSrc = result?.artifacts?.pdf?.source || "—";
                    return `Seeded Module 9 ready (Doc: ${docSrc}; PDF: ${pdfSrc})`;
                  })
                }
              >
                Seed Module 9 ready
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Jump to module (progression only)</p>
            <p className="mb-1 text-[10px] leading-snug text-slate-600">
              Changes dashboard resume only. Does not delete saved artifacts.
            </p>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() => jumpToModule(n)}
                >
                  {`M${n}`}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Explicit restarts</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={btnDanger}
                disabled={busy}
                onClick={restartModule1WithWarning}
              >
                Restart Module 1
              </button>
              <button
                type="button"
                className={btnDanger}
                disabled={busy}
                onClick={restartEntireAssignmentWithWarning}
              >
                Restart the entire assignment
              </button>
            </div>
          </section>

          {isRhetoricalSituationDevBypassAvailable() ? (
            <section>
              <p className={sectionTitle}>Module 2 lesson bypass</p>
              <p className="mb-1 text-[10px] leading-snug text-slate-600">
                Development only. Lets you open T Charts without finishing Meet
                the two situations.
              </p>
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() =>
                    run("Lesson bypass on", async () => {
                      writeRhetoricalSituationDevBypassFlag(true);
                      return "Meet-the-two-situations bypass enabled for this tab";
                    })
                  }
                >
                  Enable lesson bypass
                </button>
                <button
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() =>
                    run("Lesson bypass off", async () => {
                      writeRhetoricalSituationDevBypassFlag(false);
                      return "Meet-the-two-situations bypass cleared";
                    })
                  }
                >
                  Clear lesson bypass
                </button>
                <span className="self-center text-[10px] text-slate-600">
                  {readRhetoricalSituationDevBypassFlag() ? "ON" : "OFF"}
                </span>
              </div>
            </section>
          ) : null}

          <section>
            <p className={sectionTitle}>Progress</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Previous module", async () => {
                    const result = await panelAction("previousModule");
                    router.push(`/modules/${result.module}`);
                  })
                }
              >
                Previous Module
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Next module", async () => {
                    const result = await panelAction("nextModule");
                    router.push(
                      result.module >= 10 ? "/dashboard" : `/modules/${result.module}`
                    );
                  })
                }
              >
                Next Module
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Current module completed", async () => {
                    const result = await panelAction("completeCurrentModule");
                    router.push(
                      result.module >= 10 ? "/dashboard" : `/modules/${result.module}`
                    );
                  })
                }
              >
                Complete Current Module
              </button>
              <button
                type="button"
                className={btnDanger}
                disabled={busy}
                onClick={() =>
                  run("Module reset complete", async () => {
                    const result = await panelAction("resetCurrentModule");
                    if (email && result?.module === 1) {
                      clearBrowserCacheForDevAction(
                        "reset_current_module_m1",
                        email
                      );
                    }
                    if (result?.resumePath) {
                      router.push(result.resumePath);
                    } else {
                      window.location.reload();
                    }
                    return result?.actionLabel || "Module reset complete";
                  })
                }
              >
                {status?.currentModule === 1
                  ? "Restart Module 1"
                  : "Reset Current Module"}
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Module 9 shortcuts</p>
            <div className="space-y-1 text-[11px]">
              {[
                ["googleDoc", "Google Doc created", !!status?.googleDocUrl],
                ["checklist", "APA checklist complete", !!status?.checklistComplete],
                ["quiz", "Quiz complete", !!status?.quizComplete],
                ["pdf", "PDF uploaded", !!status?.pdfUploaded],
                ["moduleComplete", "Module complete", !!status?.moduleComplete],
              ].map(([key, label, checked]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(e) => handleModule9Toggle(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Export</p>
            <div className="flex flex-wrap gap-1">
              <button type="button" className={btn} disabled={busy} onClick={createOrRebuildGoogleDoc}>
                Create Google Doc
              </button>
              <button
                type="button"
                className={btnDanger}
                disabled={busy}
                onClick={() =>
                  run("Google Doc deleted", async () => {
                    await panelAction("deleteGoogleDoc");
                  })
                }
              >
                Delete Google Doc
              </button>
              <button type="button" className={btn} disabled={busy} onClick={createOrRebuildGoogleDoc}>
                Rebuild Google Doc
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>WP-030 Doc recovery simulations</p>
            <p className="mb-1 text-[10px] text-amber-800">
              Simulations only. Stale-link does not delete Drive files. Affects the
              signed-in development student only.
            </p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Simulated missing exported_docs row", async () => {
                    await panelAction("simulateMissingExportedDoc");
                  })
                }
              >
                Simulate: missing row
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Simulated stale/inaccessible document_id", async () => {
                    await panelAction("simulateStaleGoogleDoc");
                  })
                }
              >
                Simulate: stale document ID
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Simulated verified current document", async () => {
                    await panelAction("simulateVerifiedGoogleDoc");
                  })
                }
              >
                Simulate: verified current Doc
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Simulated temporary verification failure (one-shot)", async () => {
                    await panelAction("simulateTemporaryVerificationFailure");
                  })
                }
              >
                Simulate: temporary verify failure
              </button>
              <button
                type="button"
                className={btn}
                disabled={busy}
                onClick={() =>
                  run("Simulated one-word Doc content mismatch", async () => {
                    await panelAction("simulateDocContentMismatch");
                  })
                }
              >
                Simulate: Doc content mismatch
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Source texts</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  openSavedSourceTexts({ speech: true, letter: false });
                  logDev("Opened speech");
                }}
              >
                Open Speech
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  openSavedSourceTexts({ speech: false, letter: true });
                  logDev("Opened letter");
                }}
              >
                Open Letter
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  openSavedSourceTexts({ speech: true, letter: true });
                  logDev("Opened both sources");
                }}
              >
                Open Both
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Storage</p>
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                className={btn}
                onClick={() => {
                  localStorage.clear();
                  logDev("Local storage cleared");
                  setMessage("Local storage cleared");
                }}
              >
                Clear Local Storage
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  sessionStorage.clear();
                  logDev("Session storage cleared");
                  setMessage("Session storage cleared");
                }}
              >
                Clear Session Storage
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  const n = email ? clearStudentCache(email) : 0;
                  logDev(`Module cache cleared (${n} keys)`);
                  setMessage(`Module cache cleared (${n} keys)`);
                }}
              >
                Clear Module Cache
              </button>
              <button
                type="button"
                className={btn}
                onClick={() => {
                  logDev("Reload");
                  window.location.reload();
                }}
              >
                Reload
              </button>
            </div>
          </section>

          <section>
            <p className={sectionTitle}>Database</p>
            <button
              type="button"
              className={btnDanger}
              disabled={busy || !email}
              onClick={() =>
                run("Restart the entire assignment", async () => {
                  const warning = getRestartWarning(
                    RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT
                  );
                  const confirmed = window.confirm(
                    `${warning.title}\n\n${warning.message}`
                  );
                  if (!confirmed) return;
                  const typed = window.prompt("Type OK to confirm full assignment restart:");
                  if (typed !== "OK") throw new Error("Reset cancelled");

                  const result = await panelAction("restartEntireAssignment");
                  if (!result.ok) {
                    throw new Error(result.reason || "Restart failed");
                  }
                  if (email) {
                    clearBrowserCacheForDevAction(
                      RESTART_ACTIONS.RESTART_ENTIRE_ASSIGNMENT,
                      email
                    );
                  }
                  window.location.href = "/modules/1/prompt";
                  return "Restart the entire assignment complete";
                })
              }
            >
              Restart the entire assignment
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
