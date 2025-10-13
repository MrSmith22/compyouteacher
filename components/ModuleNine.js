"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ModuleNine() {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [review, setReview] = useState([]); // per-question report (shown inline)

  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  const questions = [
    { q: "What is the correct font for APA Style papers?", opts: ["Times New Roman, 12 pt", "Calibri, 8 pt", "Arial, 14 pt"], a: "Times New Roman, 12 pt" },
    { q: "What spacing should be used in an APA-formatted paper?", opts: ["Single", "1.5 spacing", "Double"], a: "Double" },
    { q: "Where does the title page appear in an APA paper?", opts: ["At the end", "After the abstract", "As the first page"], a: "As the first page" },
    { q: "Which of the following is a correct in-text citation in APA?", opts: ["(Smith, 2020)", "[Smith 2020]", "Smith, 2020:"], a: "(Smith, 2020)" },
    { q: "How should the reference page be formatted?", opts: ["Double spaced, alphabetical order", "Single spaced, numbered list", "Double spaced, chronological order"], a: "Double spaced, alphabetical order" },
    { q: "What is the correct page header on the title page?", opts: ["Title of the paper only", "Page number only", "Title and page number, right-aligned"], a: "Title and page number, right-aligned" },
    { q: "What belongs on the title page in APA format?", opts: ["Title, author, institution, course, instructor, date", "Only the title and author name", "Title, table of contents, and date"], a: "Title, author, institution, course, instructor, date" },
    { q: "Which of these is a proper APA reference for a book?", opts: ["Smith, J. (2020). *Writing Well*. New York: Penguin.", "Smith, J. 2020. Writing Well. Penguin.", "Writing Well by J. Smith (2020). Penguin"], a: "Smith, J. (2020). *Writing Well*. New York: Penguin." },
    { q: "Should APA papers include an abstract?", opts: ["Yes, for most academic papers", "No, it's optional", "Only if the teacher requires it"], a: "Yes, for most academic papers" },
    { q: "What is the correct order for an APA paper?", opts: ["Title Page → Abstract → Body → References", "Introduction → Body → References → Title Page", "Title Page → References → Body → Abstract"], a: "Title Page → Abstract → Body → References" },
  ];

  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(""));
  }, []);

  // Load any previously exported Google Doc link
  useEffect(() => {
    (async () => {
      if (!session?.user?.email) return;
      const { data } = await supabase
        .from("exported_docs")
        .select("web_view_link")
        .eq("user_email", session.user.email)
        .maybeSingle();
      if (data?.web_view_link) setExportUrl(data.web_view_link);
    })();
  }, [session]);

  const handleAnswer = (idx, val) => {
    const copy = [...userAnswers];
    copy[idx] = val;
    setUserAnswers(copy);
  };

  const handleSubmit = async () => {
    let total = 0;
    const report = questions.map((item, i) => {
      const selected = userAnswers[i] || "";
      const correct = selected === item.a;
      if (correct) total += 1;
      return { i, question: item.q, selected, correctAnswer: item.a, correct, options: item.opts };
    });
    setScore(total);
    setReview(report);
    setSubmitted(true);

    if (session?.user?.email) {
      await supabase.from("module9_quiz").upsert({
        user_email: session.user.email,
        score: total,
        total: questions.length,
        submitted_at: new Date().toISOString(),
      });
    }
  };

  const handleExportToGoogleDocs = async () => {
    if (!session?.user?.email) return;

    const email = session.user.email;
    let text = "";

    // 1) Prefer finalized text from Module 7
    const { data: m7 } = await supabase
      .from("student_drafts")
      .select("final_text")
      .eq("user_email", email)
      .eq("module", 7)
      .maybeSingle();

    if (m7?.final_text) {
      text = m7.final_text;
    } else {
      // 2) Fall back to Module 6 draft (full_text)
      const { data: m6 } = await supabase
        .from("student_drafts")
        .select("full_text")
        .eq("user_email", email)
        .eq("module", 6)
        .maybeSingle();
      if (m6?.full_text) text = m6.full_text;
    }

    if (!text) {
      alert("Could not find your essay text yet. Finish Modules 6–7, then try again.");
      return;
    }

    const res = await fetch("/api/export-to-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, email }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert("Failed to export to Google Docs.");
      return;
    }

    setExportUrl(result.url);

    const win = window.open(result.url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      setPopupBlocked(true);
    }
  };

  const handleUploadPDF = async () => {
    if (!session?.user?.email) return;
    if (!pdfFile) {
      alert("Please select a PDF first.");
      return;
    }

    try {
      setUploading(true);

      // Clean path + keep original filename (spaces -> underscores)
      const safeEmail = session.user.email.replace(/[^a-zA-Z0-9._-]/g, "_");
      const originalName = pdfFile.name.replace(/\s+/g, "_");
      const path = `${safeEmail}/${Date.now()}-${originalName}`;

      // Upload to existing bucket: final-pdfs
      const { error: uploadErr } = await supabase
        .storage
        .from("final-pdfs")
        .upload(path, pdfFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: "application/pdf",
        });

      if (uploadErr) {
        console.error("[PDF upload error]", uploadErr);
        alert(`Upload failed: ${uploadErr.message || "Unknown error"}`);
        return;
      }

      // Public URL for quick access
      const { data: pub } = supabase.storage.from("final-pdfs").getPublicUrl(path);
      const publicUrl = pub?.publicUrl || null;

  // Record a row so teachers can find it easily
// Generate a doc_id since the column is NOT NULL in your table
const docId =
  (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : `doc_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;

const { error: rowErr } = await supabase
  .from("student_exports")
  .insert({
    doc_id: docId, // ✅ required by your schema
    user_email: session.user.email,
    module: 9,
    kind: "final_pdf",
    file_name: originalName,
    storage_path: path,
    public_url: publicUrl,          // ✅ link to the file
    web_view_link: publicUrl || "", // ✅ satisfies NOT NULL column
    uploaded_at: new Date().toISOString(),
  });

if (rowErr) {
  console.error("[student_exports insert error]", rowErr);
  alert(`Save failed: ${rowErr.message || "Unknown error"}`);
  return;
}

console.log("✅ student_exports record inserted successfully.");

// Success screen
router.push("/modules/9/success");
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (!session) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-extrabold text-theme-blue mb-2">📘 Module 9: APA Mini Quiz</h1>

      <section className="border p-4 rounded bg-theme-light space-y-2 shadow">
        <h2 className="text-xl font-semibold text-theme-dark">📋 APA Formatting Checklist</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>Times New Roman, 12pt font</li>
          <li>Double spacing throughout</li>
          <li>Title page with all required info</li>
          <li>Page header with title and page number</li>
          <li>References page in alphabetical order</li>
        </ul>
        <p className="mt-2">
          📄 Use this template:{" "}
          <a
            href="https://docs.google.com/document/d/14oSW0QNGaDbnmF3QL3UzFku2dJIgw3nGDV6K-HGvNtY/copy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-theme-blue underline"
          >
            Copy APA Google Docs Template
          </a>
        </p>
      </section>

      {/* QUIZ */}
      {questions.map((item, idx) => (
        <div key={idx} className="space-y-2">
          <p className="font-medium">{idx + 1}. {item.q}</p>
          {item.opts.map((opt, oIdx) => {
            const chosen = userAnswers[idx];
            const isCorrect = submitted && opt === item.a;
            const isWrongChoice = submitted && chosen === opt && chosen !== item.a;

            return (
              <label
                key={oIdx}
                className={`block ${isCorrect ? "text-green-700" : ""} ${isWrongChoice ? "text-red-700" : ""}`}
              >
                <input
                  type="radio"
                  name={`q-${idx}`}
                  value={opt}
                  disabled={submitted}
                  checked={userAnswers[idx] === opt}
                  onChange={() => handleAnswer(idx, opt)}
                  className="mr-2"
                />
                {opt}
                {submitted && isCorrect && <span className="ml-2 text-xs">✓ correct</span>}
                {submitted && isWrongChoice && <span className="ml-2 text-xs">✗</span>}
              </label>
            );
          })}
          {submitted && userAnswers[idx] !== item.a && (
            <div className="text-sm text-gray-700">
              Correct answer: <span className="font-semibold">{item.a}</span>
            </div>
          )}
          <hr className="my-2" />
        </div>
      ))}

      {!submitted ? (
        <button onClick={handleSubmit} className="bg-theme-green text-white px-6 py-3 rounded shadow">
          ✅ Submit Quiz
        </button>
      ) : (
        <div className="space-y-4">
          <div className="text-theme-green font-semibold">
            🎯 You scored {score} / {questions.length}.
          </div>

          <button onClick={handleExportToGoogleDocs} className="bg-theme-blue text-white px-6 py-3 rounded shadow">
            ✍ Export Final Draft to Google Docs (APA Format)
          </button>

          {exportUrl && (
            <div className="mt-4 border rounded p-3 bg-white shadow">
              <div className="font-semibold mb-2">Your Google Doc</div>
              <div className="flex items-center gap-3">
                <a className="text-theme-blue underline" href={exportUrl} target="_blank" rel="noreferrer">
                  Open your document
                </a>
                <button className="px-3 py-1 border rounded" onClick={() => navigator.clipboard.writeText(exportUrl)}>
                  Copy link
                </button>
              </div>
              {popupBlocked && (
                <p className="text-sm text-orange-700 mt-2">
                  It looks like a popup blocker stopped the new tab. Use the link above,
                  or allow popups for localhost.
                </p>
              )}
            </div>
          )}

          {/* FINAL PDF UPLOAD */}
          <section className="mt-8 border p-4 rounded bg-white shadow">
            <h2 className="text-lg font-semibold mb-2 text-theme-dark">📤 Submit Final Essay as PDF</h2>
            <p className="text-sm text-gray-600 mb-2">Download your Google Doc as a PDF and upload it here.</p>

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0] || null)}
              className="mb-2"
            />

            <button
              onClick={handleUploadPDF}
              disabled={!pdfFile || uploading}
              className={`bg-theme-orange text-white px-6 py-2 rounded shadow ${(!pdfFile || uploading) ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {uploading ? "Uploading…" : "📎 Upload Final PDF"}
            </button>

            {pdfFile && !uploading && (
              <div className="text-xs text-gray-600 mt-1">Selected: {pdfFile.name}</div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}