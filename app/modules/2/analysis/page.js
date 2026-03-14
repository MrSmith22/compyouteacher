"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Panel from "@/components/ui/Panel";
import { requireModuleAccess } from "@/lib/supabase/helpers/moduleGate";

const ASSIGNMENT_NAME = "MLK Essay Assignment";

export default function ModuleTwoAnalysisPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [gateOk, setGateOk] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gate: allow /modules/2/analysis only when current_module >= 2 (no redirect loop)
  useEffect(() => {
    if (!session?.user?.email) {
      setLoading(false);
      setGateOk(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    requireModuleAccess({
      userEmail: session.user.email,
      assignmentName: ASSIGNMENT_NAME,
      minModule: 2,
    })
      .then(({ ok }) => {
        if (!cancelled) setGateOk(ok);
      })
      .catch(() => {
        if (!cancelled) setGateOk(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.user?.email]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (gateOk === false) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6">
        <div className="max-w-3xl mx-auto">
          <Panel className="space-y-4">
            <h1 className="text-xl font-bold text-theme-dark">
              Complete Module 2 first
            </h1>
            <p className="text-theme-dark/90">
              Finish gathering your speech and letter sources in Module 2, then
              return here.
            </p>
            <button
              type="button"
              onClick={() => router.push("/modules/2")}
              className="bg-theme-blue text-white px-4 py-2 rounded-lg font-medium"
            >
              Go to Module 2
            </button>
          </Panel>
        </div>
      </div>
    );
  }

  if (gateOk !== true) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-extrabold text-theme-dark">
          Module 2 Analysis
        </h1>

        <Panel className="space-y-4">
          <h2 className="text-xl font-bold text-theme-dark">
            Begin rhetorical analysis
          </h2>
          <p className="text-left text-theme-dark/90">
            You are collecting evidence that will later help you compare how
            King uses rhetorical strategies in both texts.
          </p>
          <p className="text-left text-theme-dark/90">
            You now have working copies of both texts saved in the app.
          </p>
          <p className="text-left text-theme-dark/90">
            In this part of the assignment, you will begin identifying how Dr.
            Martin Luther King Jr. uses rhetorical strategies in both the speech
            and the letter.
          </p>
          <p className="text-left text-theme-dark/90">As you work, you should:</p>
          <ol className="list-decimal list-inside space-y-1 text-theme-dark/90 ml-2">
            <li>Read carefully</li>
            <li>Find a short quote that stands out</li>
            <li>Decide whether it shows ethos, pathos, or logos</li>
            <li>Save that evidence into your analysis work</li>
          </ol>
        </Panel>

        <Panel className="space-y-4">
          <h2 className="text-xl font-bold text-theme-dark">
            Keep your texts open while you work
          </h2>
          <p className="text-left text-theme-dark/90">
            As you analyze, keep either your saved copy or the original source
            open in another tab so you can find short, accurate quotes.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href="/texts/speech"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium text-center hover:opacity-90"
            >
              Open My Saved Speech Copy
            </a>
            <a
              href="/texts/letter"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-theme-blue text-white px-4 py-2 rounded-lg font-medium text-center hover:opacity-90"
            >
              Open My Saved Letter Copy
            </a>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <h2 className="text-xl font-bold text-theme-dark">
            Next step
          </h2>
          <p className="text-left text-theme-dark/90">
            You will work through one rhetorical appeal at a time: Ethos, then
            Pathos, then Logos. For each appeal you will choose one quote from
            the speech and one from the letter and explain how they support
            King&apos;s purpose.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              onClick={async () => {
                if (session?.user?.email) {
                  try {
                    await fetch("/api/assignments/resume", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        assignment_name: "MLK Essay Assignment",
                        resume_path: "/modules/2/tcharts",
                      }),
                    });
                  } catch (err) {
                    console.error("Resume path update failed:", err);
                  }
                }
                router.push("/modules/2/tcharts");
              }}
              className="bg-theme-green text-white px-4 py-2 rounded-lg font-medium hover:opacity-90"
            >
              Begin analysis
            </button>
            <button
              type="button"
              onClick={() => router.push("/modules/2")}
              className="text-theme-blue font-medium underline"
            >
              Back to Module 2
            </button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
