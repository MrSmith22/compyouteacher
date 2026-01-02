"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useSession } from "next-auth/react";

export default function StudentResponses() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  /* teacher list – add more emails as needed */
  const allowedTeachers = ["jsmith@essex.k12.va.us"];
  if (!allowedTeachers.includes(userEmail)) {
    return (
      <p className="text-red-500">
        You do not have access to view this data.
      </p>
    );
  }

  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");

  /* fetch all rows */
  useEffect(() => {
    const fetchRows = async () => {
      const { data, error } = await supabase
        .from("module3_responses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) console.error(error.message);
      else setRows(data);
    };

    fetchRows();
  }, []);

  /* handle feedback save */
  const saveFeedback = async (id, comment, score) => {
    const { error } = await supabase
      .from("module3_responses")
      .update({ teacher_comment: comment, teacher_score: score })
      .eq("id", id);

    if (error) alert("Error: " + error.message);
    else alert("Feedback saved!");
  };

  const displayed = rows.filter((r) =>
    r.user_email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* filter + export bar (export unchanged) */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
      </div>

      {displayed.length === 0 ? (
        <p>No matching submissions.</p>
      ) : (
        displayed.map((row) => (
          <details key={row.id} className="border rounded p-4 bg-white shadow">
            <summary className="cursor-pointer font-semibold">
              {row.user_email}{" "}
              <span className="text-sm text-gray-500">
                ({new Date(row.created_at).toLocaleString()})
              </span>
            </summary>

            {/* student answers */}
            <ul className="mt-3 space-y-1 list-decimal list-inside text-sm">
              {row.responses.map((resp, i) => (
                <li key={i}>
                  <strong>Q{i + 1}:</strong>{" "}
                  {resp || <em className="text-red-500">No response</em>}
                </li>
              ))}
            </ul>

            {/* teacher feedback panel */}
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold mb-2">Teacher Feedback</h4>

              <textarea
                defaultValue={row.teacher_comment ?? ""}
                id={`comment-${row.id}`}
                className="w-full border rounded p-2 mb-2"
                rows={3}
              />

              <input
                type="number"
                defaultValue={row.teacher_score ?? ""}
                id={`score-${row.id}`}
                className="border rounded px-2 py-1 w-24 mr-2"
                placeholder="Score"
                min={0}
                max={100}
              />

              <button
                onClick={() =>
                  saveFeedback(
                    row.id,
                    document.getElementById(`comment-${row.id}`).value,
                    Number(document.getElementById(`score-${row.id}`).value)
                  )
                }
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Save Feedback
              </button>
            </div>
          </details>
        ))
      )}
    </div>
  );
}
