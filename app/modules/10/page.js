// app/modules/10/page.js  (or components/ModuleTen.js)
// Teacher Dashboard - Phase 2 Step 1

"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";

export default function ModuleTen() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // 1) Get all students from student_assignments (master list)
        const { data: assignments, error: assignErr } = await supabase
          .from("student_assignments")
          .select("id, user_email, assignment_name, current_module, status, updated_at")
          .order("updated_at", { ascending: false });

        if (assignErr) {
          console.error("[student_assignments error]", assignErr);
          setErrorMsg("Could not load student assignments.");
          setRows([]);
          return;
        }

        // If nothing in student_assignments, we can stop here
        if (!assignments || assignments.length === 0) {
          setRows([]);
          return;
        }

        // 2) Get all final PDFs from student_exports
        const { data: exportsData, error: exportsErr } = await supabase
          .from("student_exports")
          .select("user_email, module, kind, file_name, public_url, uploaded_at")
          .eq("kind", "final_pdf");

        if (exportsErr) {
          console.error("[student_exports error]", exportsErr);
          // Not fatal – dashboard can still show student list
        }

        // Build a lookup: user_email -> latest final_pdf record
        const latestPdfByEmail = new Map();

        if (exportsData && exportsData.length > 0) {
          // Sort by uploaded_at so the newest is last, then Map.set() will keep the newest
          const sortedExports = [...exportsData].sort((a, b) => {
            const tA = a.uploaded_at ? new Date(a.uploaded_at).getTime() : 0;
            const tB = b.uploaded_at ? new Date(b.uploaded_at).getTime() : 0;
            return tA - tB;
          });

          for (const rec of sortedExports) {
            latestPdfByEmail.set(rec.user_email, rec);
          }
        }

        // 3) Merge assignments + final PDF info
        const combined = assignments.map((a) => {
          const pdf = latestPdfByEmail.get(a.user_email) || null;
          return {
            user_email: a.user_email,
            assignment_name: a.assignment_name,
            current_module: a.current_module,
            status: a.status,
            updated_at: a.updated_at,
            final_pdf_name: pdf?.file_name || null,
            final_pdf_url: pdf?.public_url || null,
            final_pdf_uploaded_at: pdf?.uploaded_at || null,
          };
        });

        setRows(combined);
      } catch (err) {
        console.error("[Teacher Dashboard load error]", err);
        setErrorMsg("Error loading data.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-extrabold text-theme-blue">
          🧑‍🏫 Teacher Dashboard (Module 10)
        </h1>
        <p className="text-sm text-theme-dark">
          View students, their current module, assignment status, and final PDF submissions.
        </p>
      </header>

      {loading && <p>Loading dashboard…</p>}

      {!loading && errorMsg && (
        <div className="p-3 rounded bg-red-100 text-red-800 text-sm">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && rows.length === 0 && (
        <p className="text-sm text-gray-600">
          No student assignment records found yet in <code>student_assignments</code>.
        </p>
      )}

      {!loading && !errorMsg && rows.length > 0 && (
        <div className="overflow-x-auto border rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-theme-light">
              <tr>
                <th className="px-3 py-2 text-left font-semibold border-b">Student Email</th>
                <th className="px-3 py-2 text-left font-semibold border-b">Assignment</th>
                <th className="px-3 py-2 text-left font-semibold border-b">Current Module</th>
                <th className="px-3 py-2 text-left font-semibold border-b">Status</th>
                <th className="px-3 py-2 text-left font-semibold border-b">Final PDF</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="px-3 py-2 border-b align-top">{row.user_email}</td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.assignment_name || <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.current_module ?? <span className="text-gray-400 italic">—</span>}
                  </td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.status || <span className="text-gray-400 italic">not started</span>}
                  </td>
                  <td className="px-3 py-2 border-b align-top">
                    {row.final_pdf_url ? (
                      <div className="flex flex-col gap-1">
                        <a
                          href={row.final_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-theme-blue underline"
                        >
                          {row.final_pdf_name || "View PDF"}
                        </a>
                        {row.final_pdf_uploaded_at && (
                          <span className="text-xs text-gray-500">
                            Uploaded{" "}
                            {new Date(row.final_pdf_uploaded_at).toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">
                        No final PDF uploaded yet
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <section className="text-xs text-gray-500 space-y-1">
        <div>
          <strong>Data sources:</strong> student_assignments, student_exports
        </div>
        <div>
          Next steps (Phase 2): add per-module completion & scores, and drill-down links
          into each student’s drafts, outlines, and quizzes.
        </div>
      </section>
    </div>
  );
}