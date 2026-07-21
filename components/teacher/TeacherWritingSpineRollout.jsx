"use client";

/**
 * WP-085 — Ops/teacher control for writing-spine rollout (not a student setting).
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import { WRITING_SPINE_MODES } from "@/lib/assignments/writingSpineRollout";

const MODE_LABELS = {
  rebuilt: "Rebuilt Modules 4–7 spine (production path)",
  legacy: "Legacy presentation (rollback — preserves rebuilt data)",
};

export default function TeacherWritingSpineRollout() {
  const [mode, setMode] = useState("legacy");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/teacher/assignment-rollout?assignmentId=${encodeURIComponent(DEFAULT_ASSIGNMENT_ID)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Could not load rollout mode.");
          return;
        }
        setMode(json.mode || "legacy");
        setSource(json.source || "");
        setStatus(
          json.schemaOk === false
            ? "Schema missing — apply the writing_spine_mode migration."
            : `Loaded from ${json.source}.`
        );
      } catch (e) {
        if (!cancelled) setError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/teacher/assignment-rollout", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: DEFAULT_ASSIGNMENT_ID,
          assignmentName: DEFAULT_ASSIGNMENT_NAME,
          mode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Could not save rollout mode.");
        setStatus("Previous mode was not changed.");
        return;
      }
      setMode(json.mode || mode);
      setSource(json.source || "database");
      setStatus(
        "Saved. Students see this presentation on their next load. Rebuilt drafts are not deleted."
      );
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="space-y-3 rounded-xl border border-theme-light bg-white p-4 shadow-sm"
      data-testid="teacher-writing-spine-rollout"
    >
      <h2 className="text-lg font-semibold text-theme-dark">
        Writing-spine presentation (ops)
      </h2>
      <p className="text-sm text-theme-muted">
        Controls whether <strong>{DEFAULT_ASSIGNMENT_NAME}</strong> uses the rebuilt
        Modules 4–7 path or legacy presentation. Rollback does not erase rebuilt
        moves, revisions, or final text. Emergency override:{" "}
        <code className="text-xs">WRITING_SPINE_MODE_OVERRIDE</code>.
      </p>
      {loading ? (
        <p className="text-sm text-theme-muted">Loading…</p>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-theme-dark">
            Presentation mode
            <select
              className="mt-1 w-full rounded-lg border border-theme-light px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              data-testid="teacher-writing-spine-mode"
            >
              {WRITING_SPINE_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m] || m}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="min-h-[44px] rounded-md bg-theme-blue px-4 text-sm font-semibold text-white disabled:opacity-50"
            disabled={saving}
            onClick={save}
            data-testid="teacher-writing-spine-save"
          >
            {saving ? "Saving…" : "Save presentation mode"}
          </button>
        </div>
      )}
      {source ? (
        <p className="text-xs text-theme-muted" data-testid="teacher-writing-spine-source">
          Source: {source}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-theme-red" role="alert">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-theme-muted" role="status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
