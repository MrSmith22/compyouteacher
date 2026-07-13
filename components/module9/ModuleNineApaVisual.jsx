"use client";

/**
 * Code-native APA paper models (WP-006 / WP-038).
 * Accessible miniatures — not fabricated Google Docs screenshots.
 */

function PaperShell({ children, label }) {
  return (
    <div
      className="mx-auto w-full max-w-[280px] overflow-hidden rounded-md border-2 border-text-primary/25 bg-white shadow-soft sm:max-w-[320px]"
      role="img"
      aria-label={label}
    >
      {children}
    </div>
  );
}

function FormattingVsRewriting() {
  return (
    <PaperShell label="Ideas stay the same while APA appearance changes">
      <div className="grid grid-cols-2 gap-px bg-border-soft">
        <div className="bg-theme-green/10 px-2 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-theme-green">
            Ideas
          </p>
          <p className="mt-2 text-[11px] leading-snug text-text-primary">
            Your finished essay stays.
          </p>
        </div>
        <div className="bg-theme-blue/10 px-2 py-3 text-center">
          <p className="text-[10px] font-bold uppercase tracking-wide text-theme-blue">
            Appearance
          </p>
          <p className="mt-2 text-[11px] leading-snug text-text-primary">
            Font, spacing, citations change.
          </p>
        </div>
      </div>
    </PaperShell>
  );
}

function PageSetup() {
  return (
    <PaperShell label="Times New Roman 12, double spacing, one-inch margins">
      <div className="relative bg-white p-4">
        <div
          className="pointer-events-none absolute inset-2 border border-dashed border-theme-orange/70"
          aria-hidden="true"
        />
        <p className="text-center text-[10px] font-semibold text-theme-orange">
          1&quot; margin
        </p>
        <div className="mt-3 space-y-2 px-1 font-[Times_New_Roman,Times,serif] text-[11px] leading-[1.9] text-text-primary">
          <p>Double-spaced body text looks like this.</p>
          <p>Lines have room between them for reading.</p>
        </div>
        <p className="mt-3 text-center text-[10px] font-semibold text-text-muted">
          Times New Roman · 12 pt
        </p>
      </div>
    </PaperShell>
  );
}

function TitlePage() {
  return (
    <PaperShell label="Student title page with required centered lines">
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-1 px-4 py-6 text-center font-[Times_New_Roman,Times,serif] text-[11px] leading-relaxed text-text-primary">
        <p className="font-bold">How King Adapts Appeals</p>
        <p className="mt-3">Alex Rivera</p>
        <p>Lincoln Middle School</p>
        <p>English 8</p>
        <p>Ms. Patel</p>
        <p>May 15, 2026</p>
      </div>
    </PaperShell>
  );
}

function PageNumbers() {
  return (
    <PaperShell label="Page number only in the top-right header">
      <div className="min-h-[160px] bg-white">
        <div className="flex justify-end border-b border-border-soft/60 px-3 py-1">
          <span className="font-[Times_New_Roman,Times,serif] text-xs font-semibold text-text-primary">
            1
          </span>
        </div>
        <p className="px-4 py-6 text-center text-[11px] text-text-muted">
          Student header: page number only (top right). No running title required
          for this assignment.
        </p>
      </div>
    </PaperShell>
  );
}

function InTextCitations() {
  return (
    <PaperShell label="Author-date citation example King 1963">
      <div className="space-y-2 px-3 py-4 font-[Times_New_Roman,Times,serif] text-[11px] leading-relaxed text-text-primary">
        <p>
          King argues that injustice anywhere threatens justice everywhere{" "}
          <span className="rounded bg-theme-blue/15 px-0.5 font-semibold">
            (King, 1963)
          </span>
          .
        </p>
        <p className="text-[10px] text-text-muted">Author–date pattern</p>
      </div>
    </PaperShell>
  );
}

function ReferencesPage() {
  return (
    <PaperShell label="References page with hanging indent and alphabetical order">
      <div className="px-3 py-3 font-[Times_New_Roman,Times,serif] text-[11px] text-text-primary">
        <p className="mb-2 text-center font-bold">References</p>
        <p className="leading-[1.8]" style={{ textIndent: "-0.6em", paddingLeft: "0.6em" }}>
          King, M. L., Jr. (1963). I have a dream…
        </p>
        <p
          className="mt-1 leading-[1.8]"
          style={{ textIndent: "-0.6em", paddingLeft: "0.6em" }}
        >
          King, M. L., Jr. (1963). Letter from Birmingham Jail…
        </p>
        <p className="mt-2 text-[10px] text-text-muted">
          New page · A–Z · double spaced · hanging indent
        </p>
      </div>
    </PaperShell>
  );
}

function AbstractExceptions() {
  return (
    <PaperShell label="Paper order without abstract unless required">
      <ol className="space-y-2 px-4 py-4 text-[11px] text-text-primary">
        <li className="rounded bg-theme-blue/10 px-2 py-1 font-semibold">
          1. Title page
        </li>
        <li className="rounded border border-dashed border-text-muted/40 px-2 py-1 text-text-muted">
          Abstract — only if required
        </li>
        <li className="rounded bg-theme-blue/10 px-2 py-1 font-semibold">
          2. Essay body
        </li>
        <li className="rounded bg-theme-blue/10 px-2 py-1 font-semibold">
          3. References
        </li>
      </ol>
    </PaperShell>
  );
}

const VISUALS = {
  "formatting-vs-rewriting": FormattingVsRewriting,
  "page-setup": PageSetup,
  "title-page": TitlePage,
  "page-numbers": PageNumbers,
  "in-text-citations": InTextCitations,
  "references-page": ReferencesPage,
  "abstract-exceptions": AbstractExceptions,
};

export default function ModuleNineApaVisual({
  visualId,
  caption,
  alt,
  className = "",
}) {
  const Visual = VISUALS[visualId];
  if (!Visual) return null;

  return (
    <figure
      className={`space-y-2 overflow-x-hidden ${className}`}
      data-testid="module9-apa-visual"
      data-visual-id={visualId}
    >
      <Visual />
      <figcaption className="text-sm leading-relaxed text-text-primary">
        <span className="sr-only">{alt} </span>
        {caption}
      </figcaption>
    </figure>
  );
}
