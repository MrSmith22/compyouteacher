"use client";

/**
 * WP-088 — Ops/teacher control for evidence-to-argument rollout (not a student setting).
 * Independent from writing-spine presentation so M2–3 rollback does not flip M4–7.
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import { EVIDENCE_ARGUMENT_MODES } from "@/lib/assignments/evidenceArgumentRollout";

const MODE_LABELS = {
  rebuilt: "Rebuilt Modules 2–3 evidence-to-argument spine (production path)",
  legacy: "Legacy Module 2–3 presentation (rollback — preserves slice state)",
};

export default function TeacherEvidenceArgumentRollout() {
  const [mode, setMode] = useState("legacy");
  const [source, setSource] = useState("");
  const [writingSpineMode, setWritingSpineMode] = useState("");
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
          `/api/teacher/evidence-argument-rollout?assignmentId=${encodeURIComponent(DEFAULT_ASSIGNMENT_ID)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Could not load evidence-argument rollout mode.");
          return;
        }
        setMode(json.mode || "legacy");
        setSource(json.source || "");
        setWritingSpineMode(json.writingSpineMode || "");
        setStatus(
          json.schemaOk === false
            ? "Schema missing — apply the evidence_argument_mode migration."
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
      const res = await fetch("/api/teacher/evidence-argument-rollout", {
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
        setError(json?.error || "Could not save evidence-argument rollout mode.");
        setStatus("Previous mode was not changed.");
        return;
      }
      setMode(json.mode || mode);
      setSource(json.source || "database");
      setWritingSpineMode(json.writingSpineMode || writingSpineMode);
      setStatus(
        "Saved. Students see this presentation on their next load. Slice state, thesis, and proof plan are not deleted. Modules 4–7 writing-spine mode is unchanged."
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
      data-testid="teacher-evidence-argument-rollout"
    >
      <h2 className="text-lg font-semibold text-theme-dark">
        Evidence-to-argument presentation (ops)
      </h2>
      <p className="text-sm text-theme-muted">
        Controls whether <strong>{DEFAULT_ASSIGNMENT_NAME}</strong> uses the rebuilt
        Modules 2–3 evidence-to-argument path or legacy presentation. Rollback does
        not erase evidence selections, schema-v2 slice state, thesis, or proof plan.
        Independent from Modules 4–7 writing-spine mode
        {writingSpineMode ? ` (currently ${writingSpineMode})` : ""}. Emergency
        override: <code className="text-xs">EVIDENCE_ARGUMENT_MODE_OVERRIDE</code>.
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
              data-testid="teacher-evidence-argument-mode"
            >
              {EVIDENCE_ARGUMENT_MODES.map((m) => (
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
            data-testid="teacher-evidence-argument-save"
          >
            {saving ? "Saving…" : "Save presentation mode"}
          </button>
        </div>
      )}
      {source ? (
        <p
          className="text-xs text-theme-muted"
          data-testid="teacher-evidence-argument-source"
        >
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
