// app/dashboard/page.js
"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import DevResetStudentButton from "@/components/dev/DevResetStudentButton";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [finalPdf, setFinalPdf] = useState(null);
  const [error, setError] = useState(null);

  const [highestScoreModule, setHighestScoreModule] = useState(1);

  const email = session?.user?.email ?? null;

  // Load assignment, module scores, and final PDF info for this student
  useEffect(() => {
    if (!email) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Student assignment row (MLK Essay Assignment only)
        const { data: aRow, error: aErr } = await supabase
          .from("student_assignments")
          .select("*")
          .eq("user_email", email)
          .eq("assignment_name", "MLK Essay Assignment")
          .maybeSingle();

        if (aErr) throw aErr;
        setAssignment(aRow || null);

        // Highest module found in module_scores
        const { data: scoreRows, error: sErr } = await supabase
          .from("module_scores")
          .select("module")
          .eq("user_email", email)
          .order("module", { ascending: false })
          .limit(1);

        if (sErr) {
          console.warn("module_scores fetch error:", sErr);
          setHighestScoreModule(1);
        } else {
          const m =
            Array.isArray(scoreRows) && scoreRows.length > 0
              ? Number(scoreRows[0]?.module)
              : 1;
          setHighestScoreModule(Number.isFinite(m) && m > 0 ? m : 1);
        }

        // Final PDF for Module 9
        const { data: exportRow, error: eErr } = await supabase
          .from("student_exports")
          .select("*")
          .eq("user_email", email)
          .eq("module", 9)
          .eq("kind", "final_pdf")
          .maybeSingle();

        if (eErr) {
          console.warn("student_exports fetch error:", eErr);
        }

        setFinalPdf(exportRow || null);
      } catch (err) {
        console.error("Student dashboard load error:", err);
        setError(err?.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [email]);

  // Compute derived current module
  const derivedCurrentModule = useMemo(() => {
    const aModule =
      typeof assignment?.current_module === "number" ? assignment.current_module : 1;

    const sModule =
      typeof highestScoreModule === "number" ? highestScoreModule : 1;

    return Math.max(aModule || 1, sModule || 1);
  }, [assignment, highestScoreModule]);

  // If assignment exists but its module is behind what we can infer, update it
  useEffect(() => {
    if (!email) return;
    if (!assignment) return;
    if (finalPdf) return;

    const aModule =
      typeof assignment.current_module === "number" ? assignment.current_module : 1;

    if (derivedCurrentModule <= aModule) return;

    const bump = async () => {
      try {
        const { data, error } = await supabase
          .from("student_assignments")
          .upsert({
            user_email: email,
            assignment_name: assignment.assignment_name || "MLK Essay Assignment",
            status: assignment.status || "in_progress",
            current_module: derivedCurrentModule,
            started_at: assignment.started_at || new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (error) {
          console.warn("Error bumping current_module:", error);
          return;
        }

        if (data) setAssignment(data);
      } catch (e) {
        console.warn("Error bumping current_module:", e);
      }
    };

    bump();
  }, [email, assignment, derivedCurrentModule, finalPdf]);

  // Determine label and target module for the main button
  const getButtonState = () => {
    if (!email) {
      return { label: "Sign in to start", disabled: true, module: null };
    }

    if (finalPdf) {
      return { label: "Review Assignment", disabled: false, module: 9 };
    }

    if (!assignment) {
      return { label: "Start Assignment", disabled: false, module: 1 };
    }

    const currentModule = derivedCurrentModule || 1;

    if (
      (assignment.status === "not_started" || !assignment.status) &&
      currentModule === 1
    ) {
      return { label: "Start Module 1", disabled: false, module: 1 };
    }

    return {
      label: `Continue with Module ${currentModule}`,
      disabled: false,
      module: currentModule,
    };
  };

  const handlePrimaryClick = async () => {
    const { module, disabled } = getButtonState();
    if (disabled || !email || !module) return;

    // If assignment row does not exist, create it
    if (!assignment) {
      try {
        const { data, error } = await supabase
          .from("student_assignments")
          .upsert({
            user_email: email,
            assignment_name: "MLK Essay Assignment",
            current_module: module,
            status: "in_progress",
            started_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .maybeSingle();

        if (error) {
          console.error("Error creating student_assignments row:", error);
        } else {
          setAssignment(data);
        }
      } catch (err) {
        console.error("Error in handlePrimaryClick upsert:", err);
      }
    } else {
      // Keep DB in sync if the button is sending the student past the stored module
      const aModule =
        typeof assignment.current_module === "number" ? assignment.current_module : 1;

      if (module > aModule) {
        try {
          const { data, error } = await supabase
            .from("student_assignments")
            .upsert({
              user_email: email,
              assignment_name: assignment.assignment_name || "MLK Essay Assignment",
              status: assignment.status || "in_progress",
              current_module: module,
              started_at: assignment.started_at || new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .select()
            .maybeSingle();

          if (!error && data) setAssignment(data);
        } catch (e) {
          console.warn("Error syncing current_module on click:", e);
        }
      }
    }

    router.push(`/modules/${module}`);
  };

  // Session guards
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light text-theme-dark">
        <p>Loading...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light text-theme-dark">
        <div className="space-y-4 text-center">
          <p className="text-md">Not signed in</p>
          <button
            className="bg-theme-blue hover:bg-blue-700 text-white px-4 py-2 rounded"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const buttonState = getButtonState();

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark">
      <main className="max-w-4xl mx-auto p-10 space-y-8">
        <header>
          <h1 className="text-3xl font-extrabold mb-6 text-theme-green">Student Dashboard</h1>
          <p className="text-md text-gray-700">
            Signed in as{" "}
            <span className="font-semibold">{session.user.email}</span>
          </p>
          <DevResetStudentButton />
        </header>

        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded text-sm">
            Error loading your data: {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-gray-700">Loading your assignment...</div>
        ) : (
          <section className="bg-white shadow p-6 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold mb-2">MLK Essay Assignment</h3>
              <p className="text-sm text-gray-700 mb-3">
                A guided writing process that moves from rhetorical analysis to
                a polished argumentative essay.
              </p>

              <div className="text-xs text-gray-600 space-y-1">
                <div>
                  Status:{" "}
                  {finalPdf
                    ? "Completed, final PDF submitted"
                    : assignment?.status || "Not started"}
                </div>

                {!finalPdf && (
                  <div>Current module: {derivedCurrentModule || 1}</div>
                )}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 min-w-[190px]">
              <button
                type="button"
                onClick={handlePrimaryClick}
                disabled={buttonState.disabled}
                className={`px-4 py-2 rounded text-sm font-semibold shadow ${
                  buttonState.disabled
                    ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                    : "bg-theme-blue text-white hover:bg-blue-700"
                }`}
              >
                {buttonState.label}
              </button>

              {finalPdf && (
                <a
                  href={finalPdf.public_url || finalPdf.web_view_link || "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-theme-blue underline text-center"
                >
                  Open final PDF
                </a>
              )}
            </div>
          </section>
        )}

        <button
          className="bg-theme-red hover:bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </main>
    </div>
  );
}