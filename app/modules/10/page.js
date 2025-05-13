// JavaScript source code
// app/modules/10/page.js
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleTen() {
  const [submissions, setSubmissions] = useState([]);
  const [quizScores, setQuizScores] = useState([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchSubmissions = async () => {
      const { data, error } = await supabase
        .from("student_drafts")
        .select("user_email, module, final_text, final_ready, updated_at");

      if (!error) setSubmissions(data);
      else console.error("Error fetching submissions:", error.message);
    };

    const fetchScores = async () => {
      const { data, error } = await supabase
        .from("module9_quiz")
        .select("user_email, score, total");

      if (!error) setQuizScores(data);
      else console.error("Error fetching quiz scores:", error.message);
    };

    fetchSubmissions();
    fetchScores();
  }, []);

  const getScore = (email) => {
    const match = quizScores.find((s) => s.user_email === email);
    return match ? `${match.score}/${match.total}` : "—";
  };

  const filtered = submissions.filter((row) =>
    row.user_email.toLowerCase().includes(filter.toLowerCase())
  );

  const handleExport = () => {
    const csv = [
      ["Email", "Module", "Submitted", "Updated", "Quiz Score"],
      ...filtered.map((row) => [
        row.user_email,
        `Module ${row.module}`,
        row.final_ready ? "Yes" : "No",
        new Date(row.updated_at).toLocaleDateString(),
        getScore(row.user_email)
      ])
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "submissions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">📊 Module 10: Teacher Dashboard</h1>
      <p className="text-sm text-gray-600 mb-6">View student progress, quiz scores, and submissions.</p>

      <div className="mb-4 flex gap-4 items-center">
        <input
          type="text"
          placeholder="Filter by email..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-2 py-1 rounded text-sm"
        />
        <button
          onClick={handleExport}
          className="bg-indigo-600 text-white px-4 py-2 rounded shadow text-sm"
        >
          ⬇️ Export CSV
        </button>
      </div>

      <div className="overflow-auto border rounded">
        <table className="w-full text-sm text-left table-auto">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-2">Email</th>
              <th className="p-2">Module</th>
              <th className="p-2">Submitted?</th>
              <th className="p-2">Updated</th>
              <th className="p-2">Quiz Score</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{row.user_email}</td>
                <td className="p-2">Module {row.module}</td>
                <td className="p-2">{row.final_ready ? "✅" : "—"}</td>
                <td className="p-2">{new Date(row.updated_at).toLocaleDateString()}</td>
                <td className="p-2">{getScore(row.user_email)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
