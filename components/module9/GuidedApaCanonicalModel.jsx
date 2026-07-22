"use client";

/**
 * WP-092 — Code-native canonical student model paper (synthetic topic).
 * Neutral content so it never answers the MLK rhetorical-analysis assignment.
 */

const LOCUS_CLASS = {
  "locus-page-setup": "ring-2 ring-theme-blue/50 bg-theme-blue/5",
  "locus-title-page": "ring-2 ring-theme-blue/50 bg-theme-blue/5",
  "locus-page-numbers": "ring-2 ring-theme-blue/50",
  "locus-body-layout": "ring-2 ring-theme-blue/50 bg-theme-blue/5",
  "locus-citations": "ring-2 ring-amber-400/60 bg-amber-50",
  "locus-references": "ring-2 ring-theme-blue/50 bg-theme-blue/5",
  "locus-paper-order": "ring-2 ring-theme-blue/40",
  "locus-whole-paper": "ring-2 ring-theme-blue/30",
};

export default function GuidedApaCanonicalModel({
  activeLocusId = "locus-page-setup",
  compact = false,
}) {
  const hi = (id) =>
    activeLocusId === id || activeLocusId === "locus-whole-paper"
      ? LOCUS_CLASS[id] || ""
      : "";

  return (
    <figure
      className={`overflow-hidden rounded-xl border border-theme-light bg-white shadow-sm ${
        compact ? "text-[11px] leading-snug" : "text-xs leading-relaxed sm:text-sm"
      }`}
      data-testid="guided-apa-canonical-model"
      aria-label="Model student paper for formatting practice. Topic is community gardens, not the MLK assignment."
    >
      <figcaption className="border-b border-theme-light bg-surface-soft px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-theme-muted">
        Model paper (practice only — not your essay)
      </figcaption>
      <div
        className={`space-y-4 p-3 sm:p-4 font-serif text-theme-dark ${
          compact ? "max-h-64 overflow-y-auto" : "max-h-[28rem] overflow-y-auto"
        }`}
        style={{ fontFamily: "Times New Roman, Times, serif" }}
      >
        {/* Title page */}
        <section
          className={`space-y-2 px-2 py-6 text-center ${hi("locus-title-page")} ${hi("locus-page-setup")}`}
          data-locus="locus-title-page"
        >
          <div
            className={`mb-8 flex justify-end text-[10px] ${hi("locus-page-numbers")}`}
            data-locus="locus-page-numbers"
            aria-label="Page number 1 in the top right"
          >
            1
          </div>
          <p className="font-bold">Community Gardens and Shared Responsibility</p>
          <p>Alex Rivera</p>
          <p>Northfield High School</p>
          <p>ENG 10: Argument Writing</p>
          <p>Ms. Patel</p>
          <p>May 12, 2026</p>
        </section>

        <hr className="border-dashed border-theme-light" />

        {/* Body */}
        <section
          className={`space-y-3 px-2 ${hi("locus-body-layout")} ${hi("locus-paper-order")}`}
          data-locus="locus-body-layout"
        >
          <div className="flex justify-end text-[10px]" aria-hidden>
            2
          </div>
          <h2 className="text-center font-bold">
            Community Gardens and Shared Responsibility
          </h2>
          <p className="indent-6">
            Community gardens ask neighbors to plan, plant, and share harvests. When
            organizers explain both the work and the benefits, people are more willing
            to join (Rivera, 2024). Clear schedules and shared tools keep the project
            fair.
          </p>
          <p className={`indent-6 ${hi("locus-citations")}`} data-locus="locus-citations">
            Two city reports from the same year show different audiences. One flyer
            invites families with weekend hours (City Parks, 2024a). A second briefing
            asks council members for water funding (City Parks, 2024b). The lettered
            years keep those sources distinct.
          </p>
        </section>

        <hr className="border-dashed border-theme-light" />

        {/* References */}
        <section
          className={`space-y-3 px-2 ${hi("locus-references")}`}
          data-locus="locus-references"
        >
          <div className="flex justify-end text-[10px]" aria-hidden>
            3
          </div>
          <h2 className="text-center font-bold">References</h2>
          <p className="pl-6 -indent-6">
            City Parks. (2024a). <em>Weekend garden hours for families</em> [Flyer].
            Northfield Parks Department.
          </p>
          <p className="pl-6 -indent-6">
            City Parks. (2024b). <em>Water funding request for community plots</em>{" "}
            [Briefing]. Northfield City Council.
          </p>
          <p className="pl-6 -indent-6">
            Rivera, A. (2024). Why shared tools matter in school gardens.{" "}
            <em>Youth Civic Review, 12</em>(1), 14–19.
          </p>
        </section>
      </div>
    </figure>
  );
}
