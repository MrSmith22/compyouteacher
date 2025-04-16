"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { useSession } from "next-auth/react";

export default function StudentResponses() {
  const [responses, setResponses] = useState([]);
  const [filter, setFilter] = useState("");
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("module3_responses")
        .select("user_email, responses, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching responses:", error.message);
      } else {
        setResponses(data);
      }
    };

    fetchData();
  }, []);

  // 🔐 Only show for allowed teacher email(s)
  const allowedTeachers = ["jsmith@essex.k12.va.us"];
  if (!allowedTeachers.includes(userEmail)) {
    return <p className="text-red-500">You do not have access to view this data.</p>;
  }

  const filtered = responses.filter((entry) =>
    entry.user_email.toLowerCase().includes(filter.toLowerCase())
  );

  const handleExport = () => {
    const rows = [
      ["Email", "Created At", ...Array.from({ length: 16 }, (_, i) => `Q${i + 1}`)],
      ...filtered.map((entry) => [
        entry.user_email,
        new Date(entry.created_at).toLocaleString(),
        ...entry.responses,
      ]),
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "module3_responses.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <input
          type="text"
          placeholder="Filter by email"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border px-3 py-2 rounded w-64"
        />
        <button
          onClick={handleExport}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>
      </div>

      {filtered.length === 0 ? (
        <p>No matching submissions.</p>
      ) : (
        filtered.map((entry, index) => (
          <details key={index} className="border rounded p-4 bg-white shadow">
            <summary className="cursor-pointer font-semibold">
              {entry.user_email}{" "}
              <span className="text-sm text-gray-500">
                ({new Date(entry.created_at).toLocaleString()})
              </span>
            </summary>
            <ul className="mt-3 space-y-2 list-decimal list-inside text-sm">
              {entry.responses.map((response, i) => (
                <li key={i}>
                  <strong>Q{i + 1}:</strong>{" "}
                  {response || <em className="text-red-500">No response</em>}
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </div>
  );
}
