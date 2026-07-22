"use client";

/**
 * WP-091 — Ops/teacher control for Module 1 vocabulary-transfer rollout.
 * Independent from writing-spine and evidence-argument presentation modes.
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import { VOCABULARY_TRANSFER_MODES } from "@/lib/assignments/vocabularyTransferRollout";

const MODE_LABELS = {
  rebuilt: "Rebuilt Module 1 transfer vocabulary (production path)",
  legacy: "Legacy Module 1 vocabulary presentation (rollback — preserves lesson state)",
};

export default function TeacherVocabularyTransferRollout() {
  const [mode, setMode] = useState("legacy");
  const [source, setSource] = useState("");
  const [writingSpineMode, setWritingSpineMode] = useState("");
  const [evidenceArgumentMode, setEvidenceArgumentMode] = useState("");
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
          `/api/teacher/vocabulary-transfer-rollout?assignmentId=${encodeURIComponent(DEFAULT_ASSIGNMENT_ID)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Could not load vocabulary-transfer rollout mode.");
          return;
        }
        setMode(json.mode || "legacy");
        setSource(json.source || "");
        setWritingSpineMode(json.writingSpineMode || "");
        setEvidenceArgumentMode(json.evidenceArgumentMode || "");
        setStatus(
          json.schemaOk === false
            ? "Schema missing — apply the vocabulary_transfer_mode migration."
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
      const res = await fetch("/api/teacher/vocabulary-transfer-rollout", {
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
        setError(json?.error || "Could not save vocabulary-transfer rollout mode.");
        setStatus("Previous mode was not changed.");
        return;
      }
      setMode(json.mode || mode);
      setSource(json.source || "database");
      setWritingSpineMode(json.writingSpineMode || writingSpineMode);
      setEvidenceArgumentMode(json.evidenceArgumentMode || evidenceArgumentMode);
      setStatus(
        "Saved. Students see this presentation on their next load. Transfer lesson state is not deleted. Writing-spine and evidence-argument modes are unchanged."
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
      data-testid="teacher-vocabulary-transfer-rollout"
    >
      <h2 className="text-lg font-semibold text-theme-dark">
        Module 1 vocabulary presentation (ops)
      </h2>
      <p className="text-sm text-theme-muted">
        Controls whether <strong>{DEFAULT_ASSIGNMENT_NAME}</strong> uses the rebuilt
        Module 1 transfer vocabulary path or legacy presentation. Rollback does not
        erase lesson choices, King follow-ups, or completion flags. Independent from
        Modules 2–3 evidence-argument
        {evidenceArgumentMode ? ` (currently ${evidenceArgumentMode})` : ""} and
        Modules 4–7 writing-spine
        {writingSpineMode ? ` (currently ${writingSpineMode})` : ""}. Emergency
        override: <code className="text-xs">VOCABULARY_TRANSFER_MODE_OVERRIDE</code>.
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
              data-testid="vocabulary-transfer-mode-select"
            >
              {VOCABULARY_TRANSFER_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m] || m}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="rounded-lg bg-theme-primary px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            onClick={save}
            disabled={saving}
            data-testid="vocabulary-transfer-mode-save"
          >
            {saving ? "Saving…" : "Save vocabulary presentation mode"}
          </button>
          {status ? (
            <p className="text-sm text-theme-muted" role="status">
              {status}
              {source ? ` Source: ${source}.` : ""}
            </p>
          ) : null}
          {error ? (
            <p className="text-sm text-red-700" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </section>
  );
}
