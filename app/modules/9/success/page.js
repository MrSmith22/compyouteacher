"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { logActivity } from "@/lib/logActivity";
import { advanceCurrentModuleOnSuccess } from "@/lib/supabase/helpers/studentAssignments";

export default function ModuleNineSuccessPage() {
  const { data: session } = useSession();
  const router = useRouter();

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
    }

    onLoad();
  }, [session]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white shadow rounded-lg p-8 max-w-lg w-full text-center">
        <h1 className="text-2xl font-bold mb-2 text-theme-blue">
          ✅ Final PDF Submitted!
        </h1>
        <p className="text-gray-700 mb-4">
          Your APA-formatted essay PDF has been uploaded successfully.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="mt-4 px-6 py-2 rounded bg-theme-blue text-white shadow hover:opacity-90"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}