"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";

export default function ModuleTwoVideo() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Log when Module 2 is started
  useEffect(() => {
    if (!session?.user?.email) return;

    async function logStart() {
      try {
        await logActivity(session.user.email, "module_started", {
          module: 2,
        });
      } catch (err) {
        console.error("Error logging module 2 start:", err);
      }
    }

    logStart();
  }, [session]);

  const handleNext = () => {
    // open Google search in a new tab
    window.open(
      "https://www.google.com/search?q=full+text+I+Have+a+Dream+speech",
      "_blank",
      "noopener,noreferrer"
    );
    // navigate to the URL/transcript step in this tab
    router.push("/modules/2/source");
  };

  if (status === "loading") {
    return <div className="p-6">Loading…</div>;
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-extrabold mb-2">
          Module 2 — Analyze the Speech & Letter
        </h1>

        <p className="text-sm text-gray-600 mb-4">
          Step 1 — Watch Dr. King’s <em>I Have a Dream</em> speech below.
          When you’re done, click <strong>Next</strong>. We’ll open a Google
          search in a new tab to help you find a full transcript, and this tab
          will move forward to collect the URL and your pasted text.
        </p>

        {/* Local video file */}
        <div className="mb-6">
          <video width="100%" height="auto" controls>
            <source src="/videos/IHaveADreamSpeech.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        <button
          onClick={handleNext}
          className="bg-theme-blue text-white px-4 py-2 rounded"
        >
          Next
        </button>
      </div>
    </div>
  );
}