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
    <div className="min-h-screen flex items-center justify-center bg-theme-light p-6">
      <div className="bg-white shadow rounded-xl border border-gray-200 p-8 max-w-lg w-full text-center space-y-4">
        <h1 className="text-2xl font-bold text-theme-orange">
          Success!
        </h1>
        <p className="text-gray-700">
          Your APA-formatted essay has been submitted. Use the links below to open your documents, or go back to your dashboard.
        </p>

        {loaded && (
          <div className="space-y-3 text-center">
            {finalPdfLink && (
              <div>
                <a
                  href={finalPdfLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded bg-theme-blue text-white text-sm font-semibold shadow hover:brightness-110"
                >
                  Open final PDF
                </a>
              </div>
            )}
            {exportUrl && (
              <div>
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded bg-theme-green text-white text-sm font-semibold shadow hover:brightness-110"
                >
                  Open Google Doc
                </a>
              </div>
            )}
            {!hasLinks && (
              <p className="text-sm text-gray-600">
                Links to your documents are not available here, but your submission was recorded. You can return to Module 9 from your dashboard to access your documents if needed.
              </p>
            )}
          </div>
        )}

        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-6 py-2 rounded bg-theme-red text-white shadow hover:brightness-110 font-semibold"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}