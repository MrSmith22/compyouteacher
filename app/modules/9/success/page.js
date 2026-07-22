"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/logActivity";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";
import {
  getExportedDocLink,
  getStudentExport,
} from "@/lib/supabase/helpers/studentExports";
import { openExternalResource } from "@/lib/ui/openExternalResource";
import { MLK_ASSIGNMENT_NAME } from "@/lib/assignments";
import { formatFileSize } from "@/lib/exports/finalPdfValidation";
import { buildModule9ReceiptExperience } from "@/lib/ui/successExperienceContract";
import SuccessExperienceShell from "@/components/success/SuccessExperienceShell";

const ASSIGNMENT_NAME = MLK_ASSIGNMENT_NAME;

function formatSubmittedAt(iso) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/**
 * WP-095 — Module 9 receipt success via shared shell (always on).
 */
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

  if (!loaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light px-4">
        <p className="text-sm text-theme-dark/80" role="status">
          Loading your receipt…
        </p>
      </div>
    );
  }

  const finalPdfLink = finalPdfRow?.public_url || finalPdfRow?.web_view_link;
  const submittedAtLabel = formatSubmittedAt(finalPdfRow?.uploaded_at);
  const fileSizeLabel =
    finalPdfRow?.file_size != null
      ? formatFileSize(finalPdfRow.file_size)
      : null;

  if (!hasReceipt) {
    const resolved = buildModule9ReceiptExperience({
      hasDurableReceipt: false,
    });
    return (
      <div data-testid="module9-receipt-missing">
        <SuccessExperienceShell
          experience={resolved.experience}
          headingId="module9-receipt-heading"
          focusOnMount
          onPrimaryAction={(action) => {
            if (!action?.href) return;
            router.push(action.href);
          }}
        />
      </div>
    );
  }

  const resolved = buildModule9ReceiptExperience({
    hasDurableReceipt: true,
    fileName: finalPdfRow?.file_name || "document.pdf",
    submittedAtLabel,
    fileSizeLabel,
    receiptId: finalPdfRow?.doc_id || null,
    pdfHref: finalPdfLink || null,
    docHref: exportUrl || null,
  });

  return (
    <div
      data-testid="module-role-transition"
      data-from-module="9"
      data-presentation="card"
    >
      <SuccessExperienceShell
        experience={resolved.experience}
        headingId="module9-receipt-heading"
        focusOnMount
        primaryTestId="module9-success-dashboard"
        secondaryTestId="module9-success-open-pdf"
        journeyTrailTestId="module9-accomplishment-trail"
        journeyTrailLabel="What you completed"
        onPrimaryAction={(action) => {
          if (!action?.href) return;
          router.push(action.href);
        }}
        onSecondaryAction={(action) => {
          if (!action?.href) return;
          openExternalResource(action.href);
        }}
        receiptSlot={
          <dl
            className="mt-2 grid gap-4 rounded-xl border border-border-soft/70 bg-surface-soft/50 px-5 py-5 sm:grid-cols-2"
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
        }
      >
        <div data-testid="module9-submission-receipt" className="sr-only">
          Submission receipt
        </div>
        <p className="text-sm leading-relaxed text-text-muted">
          Contact your teacher before you try to change or resubmit anything. Do
          not upload a new PDF on your own unless your teacher asks you to.
        </p>
      </SuccessExperienceShell>
    </div>
  );
}
