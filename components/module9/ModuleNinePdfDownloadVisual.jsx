"use client";

/**
 * WP-043 — Code-native Google Docs PDF download path model.
 * Schematic menu only — no account info, real docs, or remote images.
 */

export default function ModuleNinePdfDownloadVisual({ className = "" }) {
  return (
    <figure
      className={`overflow-x-hidden rounded-lg border border-role-instruction/25 bg-role-instruction/[0.04] px-3 py-3 sm:px-4 ${className}`}
      data-testid="module9-pdf-download-visual"
      data-instructional-color-role="instruction"
      aria-labelledby="module9-pdf-download-visual-caption"
    >
      <div
        className="mx-auto w-full max-w-[340px] overflow-hidden rounded-md border border-border-soft/80 bg-white shadow-soft"
        role="img"
        aria-label="Google Docs menu path: File, then Download, then PDF Document (.pdf)"
      >
        {/* Stylized doc chrome — generic, not a signed-in Google UI replica */}
        <div className="border-b border-border-soft/70 bg-surface-soft/80 px-2 py-1.5">
          <p className="truncate text-[10px] font-medium text-text-muted">
            Your submission document
          </p>
          <div
            className="mt-1 flex flex-wrap gap-1 text-[10px] font-semibold text-text-primary"
            aria-hidden="true"
          >
            <span className="rounded bg-role-instruction/15 px-1.5 py-0.5 text-role-instruction">
              File
            </span>
            <span className="px-1 py-0.5 text-text-muted">Edit</span>
            <span className="px-1 py-0.5 text-text-muted">View</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 p-2 sm:flex-row sm:items-start sm:gap-2">
          {/* File menu */}
          <ul
            className="min-w-0 flex-1 rounded border border-border-soft bg-white py-1 text-[11px] leading-snug text-text-primary shadow-soft"
            aria-label="File menu"
          >
            <li className="px-2 py-1 text-text-muted">New</li>
            <li className="px-2 py-1 text-text-muted">Open</li>
            <li className="flex items-center justify-between gap-1 bg-role-instruction/15 px-2 py-1 font-semibold text-role-instruction">
              <span>Download</span>
              <span aria-hidden="true">▸</span>
            </li>
            <li className="px-2 py-1 text-text-muted">Share</li>
          </ul>

          {/* Download submenu */}
          <ul
            className="min-w-0 flex-1 rounded border border-role-instruction/30 bg-white py-1 text-[11px] leading-snug text-text-primary shadow-soft"
            aria-label="Download submenu"
          >
            <li className="px-2 py-1 text-text-muted">Microsoft Word (.docx)</li>
            <li className="bg-role-instruction/15 px-2 py-1.5 font-semibold text-role-instruction">
              PDF Document (.pdf)
            </li>
            <li className="px-2 py-1 text-text-muted">Plain Text (.txt)</li>
          </ul>
        </div>

        <p className="border-t border-border-soft/60 px-2 py-1.5 text-center text-[10px] font-medium text-text-muted">
          File → Download → PDF Document (.pdf)
        </p>
      </div>

      <figcaption
        id="module9-pdf-download-visual-caption"
        className="mt-2 text-sm leading-relaxed text-text-primary"
      >
        In your Google Doc: open <strong>File</strong>, choose{" "}
        <strong>Download</strong>, then choose <strong>PDF Document (.pdf)</strong>.
      </figcaption>
    </figure>
  );
}
