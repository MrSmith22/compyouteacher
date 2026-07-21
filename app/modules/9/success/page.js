"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ModuleRoleTransitionCard from "@/components/transitions/ModuleRoleTransitionCard";
import { getModuleRoleTransition } from "@/lib/transitions/moduleRoleTransitions";
import { logActivity } from "@/lib/logActivity";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  getExportedDocLink,
  getStudentExport,
} from "@/lib/supabase/helpers/studentExports";
import {
  HIERARCHY_ACTION_PRIMARY_CLASS,
  HIERARCHY_ACTION_SECONDARY_CLASS,
  HIERARCHY_FOCUS_RING_CLASS,
  HIERARCHY_TASK_CLASS,
} from "@/lib/ui/hierarchyContract";
import { openExternalResource } from "@/lib/ui/openExternalResource";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import { formatFileSize } from "@/lib/exports/finalPdfValidation";

const TRANSITION = getModuleRoleTransition(9, null);
const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;

const ACCOMPLISHMENT_TRAIL = [
  "Understood",
  "Analyzed",
  "Planned",
  "Drafted",
  "Revised",
  "Formatted",
  "Submitted",
];

function formatSubmittedAt(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ModuleNineSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [finalPdfRow, setFinalPdfRow] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [hasReceipt, setHasReceipt] = useState(false);

  useEffect(() => {
    async function onLoad() {
      if (!session?.user?.email) return;

      const [pdfResult, docResult] = await Promise.all([
        getStudentExport({
          userEmail: session.user.email,
          module: 9,
          kind: "final_pdf",
        }),
        getExportedDocLink({ userEmail: session.user.email }),
      ]);

      const receipt = pdfResult.data || null;
      const receiptOk = !!(
        receipt &&
        (receipt.public_url || receipt.web_view_link || receipt.storage_path)
      );

      setFinalPdfRow(receipt);
      setHasReceipt(receiptOk);
      if (docResult.data?.web_view_link) setExportUrl(docResult.data.web_view_link);
      setLoaded(true);

      // Only certify completion once a durable receipt exists.
      // module_completed is idempotent across refresh/direct navigation.
      if (receiptOk) {
        await logActivity(session.user.email, "module_completed", {
          module: 9,
          metadata: {
            source: "final_pdf_success_page",
            doc_id: receipt.doc_id || null,
          },
        });
        await advanceCurrentModuleOnSuccess({
          userEmail: session.user.email,
          completedModuleNumber: 9,
        }).catch(() => {});
      }
    }

    onLoad();
  }, [session]);

  useEffect(() => {
    if (!loaded) return;
    const heading = document.getElementById("module9-receipt-heading");
    if (heading && typeof heading.focus === "function") {
      heading.focus({ preventScroll: true });
    }
  }, [loaded, hasReceipt]);

  const finalPdfLink = finalPdfRow?.public_url || finalPdfRow?.web_view_link;
  const submittedAtLabel = formatSubmittedAt(finalPdfRow?.uploaded_at);
  const fileSizeLabel =
    finalPdfRow?.file_size != null
      ? formatFileSize(finalPdfRow.file_size)
      : null;

  if (loaded && !hasReceipt) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4 py-10">
        <div
          className="w-full max-w-xl space-y-6 rounded-2xl border border-theme-green/25 bg-white px-6 py-8 shadow-soft md:px-10 md:py-10"
          data-testid="module9-receipt-missing"
        >
          <h1
            id="module9-receipt-heading"
            tabIndex={-1}
            className={`${HIERARCHY_TASK_CLASS} text-theme-dark`}
          >
            Submission receipt not found
          </h1>
          <p className="text-base leading-relaxed text-text-primary">
            We could not find a saved final PDF for this assignment. Your paper
            has not been recorded as submitted from this screen.
          </p>
          <p className="text-sm leading-relaxed text-text-muted">
            Return to Module 9 to select and upload your PDF. If you already
            uploaded and still see this message, contact your teacher.
          </p>
          <button
            type="button"
            onClick={() => router.push("/modules/9")}
            className={`inline-flex items-center justify-center ${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS} bg-theme-dark`}
            data-testid="module9-receipt-recover"
          >
            Back to Module 9 upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light px-4 py-10 md:px-8">
      <div className="mx-auto w-full max-w-3xl space-y-8">
        <section
          className="rounded-2xl border border-theme-green/30 bg-white px-6 py-8 shadow-soft md:px-10 md:py-10"
          data-testid="module9-submission-receipt"
          aria-labelledby="module9-receipt-heading"
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-theme-green">
            Submission received
          </p>
          <h1
            id="module9-receipt-heading"
            tabIndex={-1}
            className={`${HIERARCHY_TASK_CLASS} mt-2 text-theme-dark`}
          >
            Your paper was received
          </h1>
          <p className="mt-3 max-w-prose text-base leading-relaxed text-text-primary">
            This page is your lasting receipt. Refresh or reopen it anytime—the
            details below come from the PDF that was saved for your teacher.
          </p>

          {!loaded ? (
            <p className="mt-6 text-sm text-text-muted" role="status">
              Loading your receipt…
            </p>
          ) : (
            <dl
              className="mt-6 grid gap-4 rounded-xl border border-border-soft/70 bg-surface-soft/50 px-5 py-5 sm:grid-cols-2"
              data-testid="module9-receipt-details"
            >
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Status
                </dt>
                <dd className="mt-1 text-sm font-medium text-theme-green">
                  Submitted
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Assignment
                </dt>
                <dd className="mt-1 text-sm text-text-primary">{ASSIGNMENT_NAME}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Submitted file
                </dt>
                <dd
                  className="mt-1 break-all text-sm text-text-primary"
                  data-testid="module9-receipt-filename"
                >
                  {finalPdfRow?.file_name || "document.pdf"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Submitted
                </dt>
                <dd
                  className="mt-1 text-sm text-text-primary"
                  data-testid="module9-receipt-submitted-at"
                >
                  {submittedAtLabel || "Saved"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  File size
                </dt>
                <dd
                  className="mt-1 text-sm text-text-primary"
                  data-testid="module9-receipt-file-size"
                >
                  {fileSizeLabel || "Recorded with your upload"}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                  Upload status
                </dt>
                <dd className="mt-1 text-sm text-text-primary">Accepted and saved</dd>
              </div>
              {finalPdfRow?.doc_id ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                    Receipt ID
                  </dt>
                  <dd
                    className="mt-1 break-all font-mono text-xs text-text-muted"
                    data-testid="module9-receipt-id"
                  >
                    {finalPdfRow.doc_id}
                  </dd>
                </div>
              ) : null}
            </dl>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            {finalPdfLink ? (
              <button
                type="button"
                className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                onClick={() => openExternalResource(finalPdfLink)}
                data-testid="module9-success-open-pdf"
                aria-label="View submitted PDF in a new tab"
              >
                View submitted PDF
              </button>
            ) : null}
            {exportUrl ? (
              <button
                type="button"
                className={`${HIERARCHY_ACTION_SECONDARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS}`}
                onClick={() => openExternalResource(exportUrl)}
                data-testid="module9-success-open-doc"
                aria-label="Open your Google Doc in a new tab"
              >
                Open your Google Doc
              </button>
            ) : null}
          </div>

          <p className="mt-4 text-sm leading-relaxed text-text-muted">
            Contact your teacher before you try to change or resubmit anything. Do
            not upload a new PDF on your own unless your teacher asks you to.
          </p>
        </section>

        <section
          className="rounded-2xl border border-border-soft/70 bg-white px-6 py-6 shadow-soft md:px-8"
          data-testid="module9-accomplishment-trail"
          aria-label="Writing process completed"
        >
          <p className="text-sm font-semibold text-text-primary">
            What you completed
          </p>
          <ol className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-text-primary">
            {ACCOMPLISHMENT_TRAIL.map((label, index) => (
              <li key={label} className="inline-flex items-center gap-2">
                <span className="font-medium text-theme-green">{label}</span>
                {index < ACCOMPLISHMENT_TRAIL.length - 1 ? (
                  <span className="text-text-muted" aria-hidden="true">
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </section>

        <div className="rounded-2xl border border-theme-green/20 bg-white px-6 py-8 shadow-soft md:px-10 md:py-10">
          <ModuleRoleTransitionCard transition={TRANSITION} />

          <div className="mt-8 space-y-3 border-t border-border-soft/60 pt-6 text-left">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className={`inline-flex items-center justify-center ${HIERARCHY_ACTION_PRIMARY_CLASS} ${HIERARCHY_FOCUS_RING_CLASS} bg-theme-dark`}
              data-testid="module9-success-dashboard"
            >
              {TRANSITION.actionLabel}
            </button>
            <p className="text-xs text-text-muted">
              Returns you to your class dashboard. Your submission stays saved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
