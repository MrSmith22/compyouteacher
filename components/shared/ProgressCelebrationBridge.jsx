"use client";

/**
 * WP-056 — Quiet mid-module orientation bridge after a successful forward step.
 * Local presentation only — never persisted, never timed out.
 */

export default function ProgressCelebrationBridge({
  module,
  fromStep = "",
  toStep = "",
  message = "",
}) {
  const text = String(message || "").trim();
  if (!text) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="progress-celebration-bridge"
      data-module={String(module ?? "")}
      data-from-step={String(fromStep ?? "")}
      data-to-step={String(toStep ?? "")}
      className="rounded-lg border border-theme-green/25 bg-theme-green/[0.06] px-3 py-2.5 text-left text-sm leading-relaxed text-text-primary"
    >
      <p>{text}</p>
    </div>
  );
}
