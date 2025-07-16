"use client";

import { useState, useEffect } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { supabase } from "../../lib/supabaseClient";
import Sidebar from "./components/Sidebar";
import StudentResponses from "./components/StudentResponses";

export default function Dashboard() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState([]);
  const [teacherStats, setTeacherStats] = useState({
    started: 0,
    completed: 0,
    ungraded: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);

  const teacherEmails = ["jsmith@essex.k12.va.us", "jason.smith@kqps.net"];
  const isTeacher = teacherEmails.includes(session?.user?.email);

  useEffect(() => {
    if (!session?.user?.email) return;

    // student’s own assignments
    const fetchAssignments = async () => {
      const { data, error } = await supabase
        .from("student_assignments")
        .select("*")
        .eq("user_email", session.user.email)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error(error.message);
      } else {
        setAssignments(data);
      }
    };

    fetchAssignments();
  }, [session]);

  useEffect(() => {
    if (!isTeacher) return;

    const fetchTeacherStats = async () => {
      setLoadingStats(true);

      try {
        // get all students’ MLK assignments
        const { data: students, error: studentsError } = await supabase
          .from("student_assignments")
          .select("status")
          .eq("assignment_name", "MLK Essay");

        if (studentsError) throw studentsError;

        const started = students.filter((s) =>
          ["started", "in progress"].includes(s.status)
        ).length;

        const completed = students.filter((s) => s.status === "completed").length;

        // get ungraded count from module3_responses
        const { data: responses, error: responsesError } = await supabase
          .from("module3_responses")
          .select("teacher_score");

        if (responsesError) throw responsesError;

        const ungraded = responses.filter((r) => r.teacher_score == null).length;

        setTeacherStats({ started, completed, ungraded });
      } catch (err) {
        console.error("Error fetching teacher stats:", err.message);
      }

      setLoadingStats(false);
    };

    fetchTeacherStats();
  }, [isTeacher]);

  return (
    <div className="flex min-h-screen bg-theme-light text-theme-dark">
      <Sidebar />

      <div className="flex-1 p-10">
        <h1 className="text-3xl font-extrabold mb-6">Welcome to Your Dashboard</h1>

        {session ? (
          <>
            <p className="text-md text-gray-600 mb-4">
              Signed in as <span className="font-semibold">{session.user.email}</span>
            </p>

            {/* Student Assignments Section */}
            {!isTeacher && (
              <div className="mb-8 bg-white shadow p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">Your Assignments</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Continue your current assignment(s) or start a new one.
                </p>

                {assignments.length === 0 ? (
                  <p>No assignments yet.</p>
                ) : (
                  <ul className="space-y-4">
                    {assignments.map((a) => (
                      <li key={a.id} className="border rounded p-4">
                        <h4 className="font-semibold">{a.assignment_name}</h4>
                        <p className="text-sm text-gray-600">
                          Status: <strong>{a.status}</strong> — Module:{" "}
                          <strong>{a.current_module}</strong>
                        </p>
                        <a
                          href={`/modules/${a.current_module}`}
                          className="inline-block mt-2 bg-theme-blue hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
                        >
                          {a.status === "not started" ? "Start" : "Continue"} Assignment
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Teacher Summary Section */}
            {isTeacher && (
              <div className="mt-10 bg-white shadow p-6 rounded-lg">
                <h3 className="text-xl font-bold mb-2">📋 Teacher Summary</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Overview of student progress on current assignments.
                </p>

                {loadingStats ? (
                  <p>Loading teacher stats…</p>
                ) : (
                  <div className="space-y-2">
                    <div className="border rounded p-4">
                      <h4 className="font-semibold">MLK Essay</h4>
                      <p className="text-sm text-gray-600">
                        Students Started: <strong>{teacherStats.started}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Students Completed: <strong>{teacherStats.completed}</strong>
                      </p>
                      <p className="text-sm text-gray-600">
                        Students Ungraded: <strong>{teacherStats.ungraded}</strong>
                      </p>
                      <a
                        href="/modules/10"
                        className="inline-block mt-2 bg-theme-blue hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
                      >
                        📄 View Teacher Dashboard
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Teacher detailed responses */}
            {isTeacher && (
              <div className="mt-10">
                <StudentResponses />
              </div>
            )}

            <div className="mt-6">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-md">Not signed in</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
