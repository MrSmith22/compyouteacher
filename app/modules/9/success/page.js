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

export default function ModuleNineSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [finalPdfRow, setFinalPdfRow] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function onLoad() {
      if (!session?.user?.email) return;

      await logActivity(session.user.email, "module_completed", {
        module: 9,
        metadata: { source: "final_pdf_success_page" },
      });
      await advanceCurrentModuleOnSuccess({
        userEmail: session.user.email,
        completedModuleNumber: 9,
      }).catch(() => {});

      const [pdfResult, docResult] = await Promise.all([
        getStudentExport({
          userEmail: session.user.email,
          module: 9,
          kind: "final_pdf",
        }),
        getExportedDocLink({ userEmail: session.user.email }),
      ]);
      if (pdfResult.data) setFinalPdfRow(pdfResult.data);
      if (docResult.data?.web_view_link) setExportUrl(docResult.data.web_view_link);
      setLoaded(true);
    }

    onLoad();
  }, [session]);

  const finalPdfLink = finalPdfRow?.public_url || finalPdfRow?.web_view_link;
  const hasLinks = !!finalPdfLink || !!exportUrl;

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-light px-4 py-10">
      <div className="w-full max-w-xl space-y-8 rounded-2xl border border-theme-green/25 bg-white px-6 py-8 shadow-soft md:px-10 md:py-10">
        <header className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-theme-green">
            Writing Processor complete
          </p>
          <h1 className="text-3xl font-bold leading-tight text-theme-dark md:text-4xl">
            Your essay was submitted successfully.
          </h1>
          <p className="mx-auto max-w-md text-base leading-relaxed text-text-primary">
            Great work. Your teacher now has the PDF you uploaded. You do not need to
            submit anything else for this assignment.
          </p>
        </header>

        <section className="space-y-3 rounded-xl border border-border-soft/70 bg-surface-soft/40 px-5 py-4 text-left">
          <h2 className="text-sm font-semibold text-text-primary">
            What you can do now
          </h2>
          <p className="text-sm leading-relaxed text-text-muted">
            You may keep copies of your work for your records. These buttons open the
            files you already created—they do not submit your essay again.
          </p>

          {loaded ? (
            <div className="space-y-4 pt-1">
              {finalPdfLink ? (
                <div className="space-y-1.5">
                  <a
                    href={finalPdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-theme-blue px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110"
                  >
                    Open your submitted PDF
                  </a>
                  <p className="text-xs leading-relaxed text-text-muted">
                    This is the PDF your teacher received. Open it if you want to check
                    what was turned in.
                  </p>
                </div>
              ) : null}

              {exportUrl ? (
                <div className="space-y-1.5">
                  <a
                    href={exportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg bg-theme-green px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:brightness-110"
                  >
                    Open your Google Doc
                  </a>
                  <p className="text-xs leading-relaxed text-text-muted">
                    This is your working Google Doc. You can keep it for your records or
                    for future writing.
                  </p>
                </div>
              ) : null}

              {!hasLinks ? (
                <p className="text-sm leading-relaxed text-text-muted">
                  Your submission was recorded. Document links are not available on this
                  screen right now. You can return to your dashboard, and ask your teacher
                  if you need help finding your files.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Loading your document links…</p>
          )}
        </section>

        <section className="space-y-2 text-left text-sm leading-relaxed text-text-primary">
          <h2 className="text-sm font-semibold">If you notice a mistake later</h2>
          <p className="text-text-muted">
            Contact your teacher before you try to change or resubmit anything. Do not
            upload a new PDF on your own unless your teacher asks you to.
          </p>
        </section>

        <div className="space-y-4 border-t border-border-soft/60 pt-6 text-center">
          <p className="text-base font-medium leading-relaxed text-theme-dark">
            You finished the Writing Processor—from reading and planning all the way to
            a submitted essay. That is a real accomplishment. Be proud of the work you
            put in.
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="rounded-lg bg-theme-dark px-6 py-3 text-sm font-semibold text-white shadow-soft hover:brightness-110"
          >
            Back to Dashboard
          </button>
          <p className="text-xs text-text-muted">
            Returns you to your class dashboard. Your submission stays saved.
          </p>
        </div>
      </div>
    </div>
  );
}
