"use client";

/**
 * Minimal always-visible four-question cues.
 * Does not replace module-specific strategy cards or examples.
 */
export default function ScreenContractCues({
  purpose = "",
  how = "",
  finished = "",
  showHow = true,
}) {
  const purposeText = String(purpose || "").trim();
  const howText = showHow ? String(how || "").trim() : "";
  const finishedText = String(finished || "").trim();
  if (!purposeText && !howText && !finishedText) return null;

  return (
    <div className="max-w-3xl space-y-2 text-left" data-testid="screen-contract-cues">
      {purposeText ? (
        <p
          className="text-sm leading-relaxed text-text-primary md:text-base"
          data-testid="screen-contract-purpose"
        >
          <span className="font-semibold text-text-primary">Why this matters: </span>
          {purposeText}
        </p>
      ) : null}
      {howText ? (
        <p
          className="text-sm leading-relaxed text-text-primary md:text-base"
          data-testid="screen-contract-how"
        >
          <span className="font-semibold text-text-primary">How to succeed: </span>
          {howText}
        </p>
      ) : null}
      {finishedText ? (
        <p
          className="text-sm leading-relaxed text-text-primary md:text-base"
          data-testid="screen-contract-finished"
        >
          <span className="font-semibold text-text-primary">You’re ready when: </span>
          {finishedText}
        </p>
      ) : null}
    </div>
  );
}
