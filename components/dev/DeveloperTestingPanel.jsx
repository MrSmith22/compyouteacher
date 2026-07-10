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
import { clearStudentCache } from "@/lib/storage/studentCache";
import { openSavedSourceTexts } from "@/lib/sources/openSavedSourceTexts";
import { upsertModule9Checklist } from "@/lib/supabase/helpers/module9Checklist";

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
      await fn();
      logDev(label);
      setMessage(label);
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
    });
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
          const result = await panelAction("module9Shortcut", {
            key: "googleDoc",
            enabled: true,
          });
          if (result.needsClientExport && result.text) {
            const res = await fetch("/api/export-to-docs", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: result.text, email }),
            });
            if (!res.ok) {
              const body = await res.json().catch(() => ({}));
              throw new Error(body.error || "Export failed");
            }
          }
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
              <div>Current module: {status?.currentModule ?? "—"}</div>
              <div>Google Doc: {status?.googleDocUrl ? "Yes" : "No"}</div>
              <div>Quiz: {status?.quizComplete ? status.quizScore || "Done" : "No"}</div>
              <div>Checklist: {status?.checklistComplete ? "Complete" : "Incomplete"}</div>
              <div>PDF uploaded: {status?.pdfUploaded ? "Yes" : "No"}</div>
              <div>Draft M6: {status?.draft6Present ? "Yes" : "No"}</div>
              <div>Revision M7: {status?.draft7Present ? "Yes" : "No"}</div>
              <div>Module 9+ complete: {status?.moduleComplete ? "Yes" : "No"}</div>
            </div>
            <button type="button" className={`${btn} mt-1`} disabled={busy} onClick={() => run("Status refreshed", refresh)}>
              Refresh status
            </button>
          </section>

          <section>
            <p className={sectionTitle}>Jump to module</p>
            <div className="flex flex-wrap gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={btn}
                  disabled={busy}
                  onClick={() => jumpToModule(n)}
                >
                  {n === 1 ? "Reset to M1" : `M${n}`}
                </button>
              ))}
            </div>
          </section>

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
                    await panelAction("resetCurrentModule");
                    window.location.reload();
                  })
                }
              >
                Reset Current Module
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
                run("Student reset complete", async () => {
                  const confirmed = window.confirm(
                    "Reset ALL assignment data for this student and start from scratch? Auth stays intact. Type OK in the next prompt."
                  );
                  if (!confirmed) return;
                  const typed = window.prompt("Type OK to confirm full student reset:");
                  if (typed !== "OK") throw new Error("Reset cancelled");

                  const res = await fetch("/api/dev/reset-student", {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "x-dev-reset-secret":
                        process.env.NEXT_PUBLIC_DEV_RESET_SECRET ?? "",
                    },
                    body: JSON.stringify({ email }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!data.ok) {
                    throw new Error(data.reason || "Reset student failed");
                  }
                  if (email) clearStudentCache(email);
                  window.location.href = "/dashboard";
                })
              }
            >
              Reset Student
            </button>
          </section>
        </div>
      ) : null}
    </div>
  );
}
