"use client";

/**
 * WP-094 — Restrained celebratory motif. Scales by intensity; respects reduced motion.
 * Code-native Tailwind only — no external assets.
 */

export default function SuccessCelebrationMotif({
  intensity = "light",
  reducedMotion = false,
}) {
  const washOpacity =
    intensity === "rich" ? "opacity-100" : intensity === "medium" ? "opacity-80" : "opacity-50";
  const arcOpacity =
    intensity === "rich" ? "opacity-50" : intensity === "medium" ? "opacity-35" : "opacity-20";

  return (
    <div
      aria-hidden="true"
      data-testid="success-celebration-motif"
      data-intensity={intensity}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <div
        className={`absolute inset-x-[-10%] top-[-20%] h-[55%] bg-[radial-gradient(ellipse_at_50%_0%,rgba(55,115,3,0.18),transparent_70%)] ${washOpacity} motion-reduce:transition-none`}
      />
      <div
        className={`absolute left-[-20%] top-[-55%] h-[90%] w-[140%] rounded-full border-2 border-theme-green/30 ${arcOpacity} motion-reduce:transition-none`}
      />
      <div
        className={`absolute left-[-5%] top-[-40%] h-[70%] w-[110%] rounded-full border-2 border-theme-green/20 ${arcOpacity} motion-reduce:transition-none`}
      />
    </div>
  );
}
