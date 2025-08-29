"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleTen() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFileUrl, setSelectedFileUrl] = useState("");

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
      <h1 className="text-2xl font-bold">Module 10: Teacher Dashboard</h1>
      <p className="text-sm text-gray-600 mb-4">View submitted final PDFs from students.</p>

      {loading ? (
        <p>Loading submissions...</p>
      ) : submissions.length === 0 ? (
        <p>No submissions found.</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((file, index) => (
            <li key={index} className="border p-2 rounded shadow">
              <button
                className="text-blue-700 underline"
                onClick={() => setSelectedFileUrl(file.url)}
              >
                {file.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedFileUrl && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">📄 PDF Preview</h2>
          <iframe
            src={selectedFileUrl}
            className="w-full h-[600px] border rounded shadow"
            title="PDF Preview"
          />
        </div>
      )}
    </div>
  );
}