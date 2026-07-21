"use client";

/**
 * WP-084 — Smallest teacher control for assignment word-count expectation.
 */

import { useEffect, useState } from "react";
import {
  DEFAULT_ASSIGNMENT_ID,
  DEFAULT_ASSIGNMENT_NAME,
} from "@/lib/assignments/identity";
import { WORD_COUNT_MODES } from "@/lib/assignments/wordCountSettings";

const MODE_LABELS = {
  off: "Off — no word-count target",
  advisory_minimum: "Advisory minimum",
  required_minimum: "Required minimum",
  advisory_range: "Advisory range",
  required_range: "Required range",
};

export default function TeacherWordCountSettings() {
  const [mode, setMode] = useState("off");
  const [minimum, setMinimum] = useState("");
  const [maximum, setMaximum] = useState("");
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
          `/api/teacher/assignment-settings?assignmentId=${encodeURIComponent(DEFAULT_ASSIGNMENT_ID)}`
        );
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Could not load settings.");
          return;
        }
        const s = json.settings || {};
        setMode(s.mode || "off");
        setMinimum(s.minimum == null ? "" : String(s.minimum));
        setMaximum(s.maximum == null ? "" : String(s.maximum));
        setStatus(
          json.source === "default_off"
            ? "Using safe default: off (no saved teacher target yet)."
            : "Loaded saved teacher settings."
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

  const needsMin =
    mode === "advisory_minimum" ||
    mode === "required_minimum" ||
    mode === "advisory_range" ||
    mode === "required_range";
  const needsMax = mode === "advisory_range" || mode === "required_range";

  const save = async () => {
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const res = await fetch("/api/teacher/assignment-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignmentId: DEFAULT_ASSIGNMENT_ID,
          assignmentName: DEFAULT_ASSIGNMENT_NAME,
          mode,
          minimum: needsMin && minimum !== "" ? Number(minimum) : null,
          maximum: needsMax && maximum !== "" ? Number(maximum) : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        setError(json?.error || "Could not save settings.");
        setStatus("Previous saved setting was not changed.");
        return;
      }
      const s = json.settings || {};
      setMode(s.mode || "off");
      setMinimum(s.minimum == null ? "" : String(s.minimum));
      setMaximum(s.maximum == null ? "" : String(s.maximum));
      setStatus("Saved. Students see this on their next load.");
    } catch (e) {
      setError(String(e?.message || e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      className="space-y-3 rounded-xl border border-theme-light bg-white p-4 shadow-sm"
      data-testid="teacher-word-count-settings"
    >
      <h2 className="text-lg font-semibold text-theme-dark">
        Assignment word-count expectation
      </h2>
      <p className="text-sm text-theme-muted">
        For <strong>{DEFAULT_ASSIGNMENT_NAME}</strong>. This is your requirement for
        this assignment—not a universal high-school rule. Existing work defaults to
        Off until you save a target.
      </p>
      {loading ? (
        <p className="text-sm text-theme-muted">Loading…</p>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-theme-dark">
            Mode
            <select
              className="mt-1 w-full rounded-lg border border-theme-light px-3 py-2 text-sm"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              data-testid="teacher-word-count-mode"
            >
              {WORD_COUNT_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m] || m}
                </option>
              ))}
            </select>
          </label>
          {needsMin ? (
            <label className="block text-sm font-medium text-theme-dark">
              Minimum words
              <input
                type="number"
                min={0}
                step={1}
                className="mt-1 w-full rounded-lg border border-theme-light px-3 py-2 text-sm"
                value={minimum}
                onChange={(e) => setMinimum(e.target.value)}
                data-testid="teacher-word-count-min"
              />
            </label>
          ) : null}
          {needsMax ? (
            <label className="block text-sm font-medium text-theme-dark">
              Maximum words
              <input
                type="number"
                min={0}
                step={1}
                className="mt-1 w-full rounded-lg border border-theme-light px-3 py-2 text-sm"
                value={maximum}
                onChange={(e) => setMaximum(e.target.value)}
                data-testid="teacher-word-count-max"
              />
            </label>
          ) : null}
          <button
            type="button"
            className="min-h-[44px] rounded-md bg-theme-blue px-4 text-sm font-semibold text-white disabled:opacity-50"
            disabled={saving}
            onClick={save}
            data-testid="teacher-word-count-save"
          >
            {saving ? "Saving…" : "Save word-count setting"}
          </button>
        </div>
      )}
      {error ? (
        <p className="text-sm text-theme-red" role="alert" data-testid="teacher-word-count-error">
          {error}
        </p>
      ) : null}
      {status ? (
        <p className="text-sm text-theme-muted" role="status" data-testid="teacher-word-count-status">
          {status}
        </p>
      ) : null}
    </section>
  );
}
