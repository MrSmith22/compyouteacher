// JavaScript source code
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleTen() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .storage
        .from("final-submissions")
        .list("final-pdfs", { limit: 100 });

      if (error) {
        console.error("Error fetching submissions:", error.message);
        setSubmissions([]);
      } else {
        const links = data.map(file => ({
          name: file.name,
          url: `https://euenxgjxuigavklrlgxc.supabase.co/storage/v1/object/public/final-submissions/final-pdfs/${file.name}`,
        }));
        setSubmissions(links);
      }
      setLoading(false);
    };

    fetchSubmissions();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📂 Module 10: Teacher Dashboard</h1>
      <p className="text-sm text-gray-600 mb-4">View submitted final PDFs from students.</p>

      {loading ? (
        <p>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((file, index) => (
            <li key={index} className="border p-2 rounded shadow">
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline"
              >
                {file.name}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
