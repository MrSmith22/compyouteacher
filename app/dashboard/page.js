// app/dashboard/page.js
"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getStudentAssignment,
  ensureStudentAssignmentRow,
} from "@/lib/supabase/helpers/studentAssignments";
import { getFinalPdfExport } from "@/lib/supabase/helpers/studentExports";
import DevResetStudentButton from "@/components/dev/DevResetStudentButton";

const ASSIGNMENT_NAME = "MLK Essay Assignment";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [finalPdf, setFinalPdf] = useState(null);
  const [error, setError] = useState(null);

  const email = session?.user?.email ?? null;

  // Load assignment and final PDF info for this student
  useEffect(() => {
    if (!email) return;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        // Student assignment row (we assume a single main essay assignment for now)
        const { data: aRow, error: aErr } = await getStudentAssignment({
          userEmail: email,
          assignmentName: ASSIGNMENT_NAME,
        });

        if (aErr) throw aErr;
        setAssignment(aRow || null);

        // Final PDF for Module 9
        const { data: exportRow, error: eErr } = await getFinalPdfExport({
          userEmail: email,
        });

        if (eErr) {
          console.warn("student_exports fetch error:", eErr);
        }

        setFinalPdf(exportRow || null);
      } catch (err) {
        console.error("Student dashboard load error:", err);
        setError(err.message || "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [email]);

  // Determine label and target module from current_module only (single gating source)
  const getButtonState = () => {
    if (!email) {
      return {
        label: "Sign in to start",
        disabled: true,
        module: null,
      };
    }

    if (!assignment) {
      return {
        label: "Start Assignment",
        disabled: false,
        module: 1,
      };
    }

    const currentModule =
      typeof assignment.current_module === "number"
        ? assignment.current_module
        : 1;

    if (
      (assignment.status === "not_started" || !assignment.status) &&
      currentModule === 1
    ) {
      return {
        label: "Start Module 1",
        disabled: false,
        module: 1,
      };
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
        const { data, error } = await ensureStudentAssignmentRow({
          userEmail: email,
          assignmentName: ASSIGNMENT_NAME,
          startingModule: module,
        });

        if (error) {
          console.error("Error creating student_assignments row:", error);
        } else {
          setAssignment(data);
        }
      } catch (err) {
        console.error("Error in handlePrimaryClick:", err);
      }
    }

    // Navigate to the chosen module
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
  const hasFinalPdf = !!finalPdf;

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
          <div className="text-sm text-gray-700">
            Loading your assignment...
          </div>
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
                  {hasFinalPdf ? "Essay completed" : (assignment?.status || "Not started")}
                </div>
                {hasFinalPdf ? (
                  <div>Essay completed</div>
                ) : (
                  assignment?.current_module != null && (
                    <div>Current module: {assignment.current_module}</div>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-2 min-w-[190px]">
              {hasFinalPdf ? (
                <span
                  className="px-4 py-2 rounded text-sm font-semibold shadow bg-theme-green text-white cursor-default inline-block text-center"
                  aria-label="Essay completed"
                >
                  Essay completed
                </span>
              ) : (
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
              )}

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