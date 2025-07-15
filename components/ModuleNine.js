"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function ModuleNine() {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [pdfFile, setPdfFile] = useState(null);

  const questions = [
    { question: "What is the correct font for APA Style papers?", options: ["Times New Roman, 12 pt", "Calibri, 8 pt", "Arial, 14 pt"], answer: "Times New Roman, 12 pt" },
    { question: "What spacing should be used in an APA-formatted paper?", options: ["Single", "1.5 spacing", "Double"], answer: "Double" },
    { question: "Where does the title page appear in an APA paper?", options: ["At the end", "After the abstract", "As the first page"], answer: "As the first page" },
    { question: "Which of the following is a correct in-text citation in APA?", options: ["(Smith, 2020)", "[Smith 2020]", "Smith, 2020:"], answer: "(Smith, 2020)" },
    { question: "How should the reference page be formatted?", options: ["Double spaced, alphabetical order", "Single spaced, numbered list", "Double spaced, chronological order"], answer: "Double spaced, alphabetical order" },
    { question: "What is the correct page header on the title page?", options: ["Title of the paper only", "Page number only", "Title and page number, right-aligned"], answer: "Title and page number, right-aligned" },
    { question: "What belongs on the title page in APA format?", options: ["Title, author, institution, course, instructor, date", "Only the title and author name", "Title, table of contents, and date"], answer: "Title, author, institution, course, instructor, date" },
    { question: "Which of these is a proper APA reference for a book?", options: ["Smith, J. (2020). *Writing Well*. New York: Penguin.", "Smith, J. 2020. Writing Well. Penguin.", "Writing Well by J. Smith (2020). Penguin"], answer: "Smith, J. (2020). *Writing Well*. New York: Penguin." },
    { question: "Should APA papers include an abstract?", options: ["Yes, for most academic papers", "No, it's optional", "Only if the teacher requires it"], answer: "Yes, for most academic papers" },
    { question: "What is the correct order for an APA paper?", options: ["Title Page → Abstract → Body → References", "Introduction → Body → References → Title Page", "Title Page → References → Body → Abstract"], answer: "Title Page → Abstract → Body → References" },
  ];

  const [userAnswers, setUserAnswers] = useState(Array(questions.length).fill(""));

  const handleChange = (index, value) => {
    const updated = [...userAnswers];
    updated[index] = value;
    setUserAnswers(updated);
  };

  const handleSubmit = async () => {
    let total = 0;
    userAnswers.forEach((ans, idx) => {
      if (ans === questions[idx].answer) total++;
    });

    setScore(total);
    setSubmitted(true);

    if (session?.user?.email) {
      await supabase
        .from("module9_quiz")
        .upsert({
          user_email: session.user.email,
          score: total,
          total: questions.length,
          submitted_at: new Date().toISOString(),
        });
    }
  };

  const handleFileChange = (e) => {
    setPdfFile(e.target.files[0]);
  };

  const handleUploadPDF = async () => {
    if (!pdfFile) {
      alert("Please select a PDF file first.");
      return;
    }

    const filename = `final-essay-${session.user.email}-${Date.now()}.pdf`;

    const { error } = await supabase.storage
      .from("final-pdfs")
      .upload(filename, pdfFile, {
        contentType: "application/pdf",
      });

    if (error) {
      console.error("Upload error:", error.message || error);
      alert("Failed to upload PDF.");
      return;
    }

    router.push("/modules/9/success");
  };

  if (!session) return <p className="p-6">Loading…</p>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-theme-blue">📘 Module 9: APA Mini Quiz & Final Submission</h1>

      <section className="border border-gray-300 p-4 rounded bg-blue-50 space-y-2">
        <h2 className="text-xl font-semibold">📋 APA Formatting Checklist</h2>
        <ul className="list-disc ml-6 text-sm">
          <li>Times New Roman, 12pt font</li>
          <li>Double spacing throughout</li>
          <li>Title page with title, author, institution, course, instructor, and date</li>
          <li>Page header with title and page number, right-aligned</li>
          <li>References page: double spaced and in alphabetical order</li>
        </ul>
        <p className="mt-2">
          📄 Use this template:{" "}
          <a href="https://docs.google.com/document/d/14oSW0QNGaDbnmF3QL3UzFku2dJIgw3nGDV6K-HGvNtY/copy" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">
            Copy APA Google Docs Template
          </a>
        </p>
      </section>

      {questions.map((q, idx) => (
        <div key={idx} className="space-y-2">
          <p className="font-medium">{idx + 1}. {q.question}</p>
          {q.options.map((opt, oIdx) => (
            <label key={oIdx} className="block">
              <input
                type="radio"
                name={`q-${idx}`}
                value={opt}
                disabled={submitted}
                checked={userAnswers[idx] === opt}
                onChange={() => handleChange(idx, opt)}
                className="mr-2"
              />
              {opt}
            </label>
          ))}
        </div>
      ))}

      {!submitted ? (
        <button
          onClick={handleSubmit}
          className="bg-theme-blue text-white px-6 py-3 rounded shadow"
        >
          ✅ Submit Quiz
        </button>
      ) : (
        <>
          <div className="text-green-700 font-semibold">
            You scored {score} out of {questions.length}.
          </div>

          <section className="mt-8 border border-gray-200 p-4 rounded bg-gray-50">
            <h2 className="text-lg font-semibold mb-2">📤 Submit Final Essay as PDF</h2>
            <p className="text-sm text-gray-600 mb-2">
              After formatting your essay in Google Docs, download it as a PDF and upload it here.
            </p>

            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="mb-2"
            />

            <button
              onClick={handleUploadPDF}
              disabled={!pdfFile}
              className={`bg-theme-green text-white px-6 py-2 rounded shadow ${
                !pdfFile ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              📎 Upload Final PDF
            </button>
          </section>
        </>
      )}
    </div>
  );
}