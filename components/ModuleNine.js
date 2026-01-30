"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  getExportedDocLink,
  getStudentExport,
} from "@/lib/supabase/helpers/studentExports";
import { getFinalTextForExport } from "@/lib/supabase/helpers/studentDrafts";
import { logActivity } from "../lib/logActivity";

export default function ModuleNine() {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [review, setReview] = useState([]); // per-question report

  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [exportUrl, setExportUrl] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [finalPdfRow, setFinalPdfRow] = useState(null);

  // track that we have already logged module_started once
  const hasLoggedStartRef = useRef(false);

  const questions = [
    {
      q: "What is the correct font for APA Style papers?",
      opts: ["Times New Roman, 12 pt", "Calibri, 8 pt", "Arial, 14 pt"],
      a: "Times New Roman, 12 pt",
    },
    {
      q: "What spacing should be used in an APA formatted paper?",
      opts: ["Single", "1.5 spacing", "Double"],
      a: "Double",
    },
    {
      q: "Where does the title page appear in an APA paper?",
      opts: ["At the end", "After the abstract", "As the first page"],
      a: "As the first page",
    },
    {
      q: "Which of the following is a correct in text citation in APA?",
      opts: ["(Smith, 2020)", "[Smith 2020]", "Smith, 2020:"],
      a: "(Smith, 2020)",
    },
    {
      q: "How should the reference page be formatted?",
      opts: [
        "Double spaced, alphabetical order",
        "Single spaced, numbered list",
        "Double spaced, chronological order",
      ],
      a: "Double spaced, alphabetical order",
    },
    {
      q: "What is the correct page header on the title page?",
      opts: [
        "Title of the paper only",
        "Page number only",
        "Title and page number, right aligned",
      ],
      a: "Title and page number, right aligned",
    },
    {
      q: "What belongs on the title page in APA format?",
      opts: [
        "Title, author, institution, course, instructor, date",
        "Only the title and author name",
        "Title, table of contents, and date",
      ],
      a: "Title, author, institution, course, instructor, date",
    },
    {
      q: "Which of these is a proper APA reference for a book?",
      opts: [
        "Smith, J. (2020). *Writing Well*. New York: Penguin.",
        "Smith, J. 2020. Writing Well. Penguin.",
        "Writing Well by J. Smith (2020). Penguin",
      ],
      a: "Smith, J. (2020). *Writing Well*. New York: Penguin.",
    },
    {
      q: "Should APA papers include an abstract?",
      opts: [
        "Yes, for most academic papers",
        "No, it is optional",
        "Only if the teacher requires it",
      ],
      a: "Yes, for most academic papers",
    },
    {
      q: "What is the correct order for an APA paper?",
      opts: [
        "Title Page → Abstract → Body → References",
        "Introduction → Body → References → Title Page",
        "Title Page → References → Body → Abstract",
      ],
      a: "Title Page → Abstract → Body → References",
    },
  ];

  // start with blank answers
  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(""));
  }, []);

  // log module_started once when session is ready
  useEffect(() => {
    if (!session?.user?.email) return;
    if (hasLoggedStartRef.current) return;
    hasLoggedStartRef.current = true;

    logActivity(session.user.email, "module_started", {
      module: 9,
    });
  }, [session]);

  // Load any previously exported Google Doc link
  useEffect(() => {
    (async () => {
      if (!session?.user?.email) return;
      const { data, error } = await getExportedDocLink({
        userEmail: session.user.email,
      });
      if (error) console.warn(error);
      if (data?.web_view_link) setExportUrl(data.web_view_link);
    })();
  }, [session]);

  // Load existing final PDF export (Module 9, kind = final_pdf)
  useEffect(() => {
    (async () => {
      if (!session?.user?.email) return;
      const result = await getStudentExport({
        userEmail: session.user.email,
        module: 9,
        kind: "final_pdf",
      });
      if (result.error) {
        console.warn(result.error);
        setFinalPdfRow(null);
        return;
      }
      if (result.data) setFinalPdfRow(result.data);
      else setFinalPdfRow(null);
    })();
  }, [session?.user?.email]);

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
      return {
        i,
        question: item.q,
        selected,
        correctAnswer: item.a,
        correct,
        options: item.opts,
      };
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

      await logActivity(session.user.email, "quiz_submitted", {
        module: 9,
        score: total,
        total: questions.length,
        details: report.map((r) => ({
          index: r.i,
          correct: r.correct,
        })),
      });
    }
  };

  const handleExportToGoogleDocs = async () => {
    if (!session?.user?.email) return;

    const email = session.user.email;
    const { text } = await getFinalTextForExport({ userEmail: email });

    if (!text) {
      alert(
        "Could not find your essay text yet. Finish Modules 6 and 7, then try again."
      );
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

    await logActivity(email, "export_to_docs", {
      module: 9,
      url: result.url,
    });

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

      const safeEmail = session.user.email.replace(/[^a-zA-Z0-9._-]/g, "_");
      const originalName = pdfFile.name.replace(/\s+/g, "_");
      const path = `${safeEmail}/${Date.now()}-${originalName}`;

      // Upload to existing bucket: final-pdfs
      const { error: uploadErr } = await supabase.storage
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

      const { data: pub } = supabase
        .storage
        .from("final-pdfs")
        .getPublicUrl(path);
      const publicUrl = pub?.publicUrl || null;

      const docId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `doc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

      const { error: rowErr } = await supabase.from("student_exports").insert({
        doc_id: docId,
        user_email: session.user.email,
        module: 9,
        kind: "final_pdf",
        file_name: originalName,
        storage_path: path,
        public_url: publicUrl,
        web_view_link: publicUrl || "",
        uploaded_at: new Date().toISOString(),
      });

      if (rowErr) {
        console.error("[student_exports insert error]", rowErr);
        alert(`Save failed: ${rowErr.message || "Unknown error"}`);
        return;
      }

      await logActivity(session.user.email, "pdf_uploaded", {
        module: 9,
        file_name: originalName,
        storage_path: path,
        public_url: publicUrl,
      });

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
    <div className="min-h-screen bg-theme-light">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Intro / teaching card */}
        <header className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 space-y-3">
          <h1 className="text-3xl font-extrabold text-theme-blue">
            📘 Module 9: APA Format and Final Submission
          </h1>
          <p className="text-gray-700 text-sm md:text-base">
            In this module you will take a short APA style review quiz, move
            your final draft into an APA formatted Google Doc, and then submit
            a PDF of your essay. APA style is a set of rules for how the paper
            looks on the page, not a new kind of essay. You are polishing the
            presentation of strong thinking you have already done.
          </p>
          <div className="bg-theme-light border border-gray-200 rounded-lg px-4 py-3 text-sm">
            <p className="font-semibold mb-1">What you will do in this module:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Review the APA checklist below.</li>
              <li>Take the APA mini quiz to check your understanding.</li>
              <li>
                Open the APA Google Docs template and copy your final essay into
                that document.
              </li>
              <li>
                Use the checklist to adjust font, spacing, title page, page
                numbers, and references so they match APA rules.
              </li>
              <li>
                Download the Google Doc as a PDF and upload your final paper in
                the section at the bottom of this page.
              </li>
            </ol>
          </div>
        </header>

        {/* APA checklist + template + external help */}
        <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 space-y-3 shadow-sm">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="checklist">
              📋
            </span>
            APA Formatting Checklist
          </h2>
          <p className="text-sm text-gray-700">
            Use this checklist while you work in the Google Doc. Think of it as
            a style uniform. Every student paper will not say the same thing,
            but they all wear the same APA clothing.
          </p>
          <ul className="list-disc ml-6 text-sm space-y-1 text-gray-800">
            <li>Font: Times New Roman, size 12.</li>
            <li>Spacing: double spaced everywhere, including references.</li>
            <li>Margins: one inch on all sides.</li>
            <li>
              Title page: includes title, your name, school, course, teacher,
              and date in the correct spots.
            </li>
            <li>
              Page numbers: page number in the top right corner of every page.
            </li>
            <li>
              References page: starts on a new page, entries in alphabetical
              order by author last name, double spaced.
            </li>
          </ul>
          <p className="text-sm text-gray-700">
            📄 Google Doc template (already set up for you):{" "}
            <a
              href="https://docs.google.com/document/d/14oSW0QNGaDbnmF3QL3UzFku2dJIgw3nGDV6K-HGvNtY/copy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-theme-blue underline"
            >
              Copy APA Google Docs Template
            </a>
          </p>
          <p className="text-xs text-gray-600">
            Open the template, click the button to make your own copy, then
            paste your final essay into the body of that document. Replace the
            placeholder text on the title page with your own information.
          </p>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-theme-dark mb-1">
              Need more help with APA style?
            </h3>
            <ul className="list-disc ml-6 text-xs text-gray-700 space-y-1">
              <li>
                Official APA sample student paper:{" "}
                <a
                  href="https://apastyle.apa.org/style-grammar-guidelines/paper-format/student-annotated"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-blue underline"
                >
                  APA Style student paper example
                </a>
              </li>
              <li>
                Purdue OWL APA Formatting and Style Guide:{" "}
                <a
                  href="https://owl.purdue.edu/owl/research_and_citation/apa_style/apa_formatting_and_style_guide/general_format.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-theme-blue underline"
                >
                  Purdue OWL APA guide
                </a>
              </li>
            </ul>
            <p className="text-xs text-gray-600 mt-1">
              You do not have to read every word. Use the examples to double
              check things like the title page, page numbers, in text
              citations, and reference entries.
            </p>
          </div>
        </section>

        {/* QUIZ */}
        <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="quiz">
              ✏️
            </span>
            APA Mini Quiz
          </h2>
          <p className="text-sm text-gray-700">
            This quiz is practice. It helps you notice the biggest APA rules
            before you format your Google Doc. If you miss some questions, use
            the checklist and resources above to fix your paper.
          </p>

          {questions.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <p className="font-medium text-sm md:text-base">
                {idx + 1}. {item.q}
              </p>
              {item.opts.map((opt, oIdx) => {
                const chosen = userAnswers[idx];
                const isCorrect = submitted && opt === item.a;
                const isWrongChoice =
                  submitted && chosen === opt && chosen !== item.a;

                return (
                  <label
                    key={oIdx}
                    className={`block text-sm ${
                      isCorrect ? "text-green-700" : ""
                    } ${isWrongChoice ? "text-red-700" : ""}`}
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
                    {submitted && isCorrect && (
                      <span className="ml-2 text-xs">✓ correct</span>
                    )}
                    {submitted && isWrongChoice && (
                      <span className="ml-2 text-xs">✗</span>
                    )}
                  </label>
                );
              })}
              {submitted && userAnswers[idx] !== item.a && (
                <div className="text-xs text-gray-700">
                  Correct answer:{" "}
                  <span className="font-semibold">{item.a}</span>
                </div>
              )}
              <hr className="my-2" />
            </div>
          ))}

          {!submitted ? (
            <button
              onClick={handleSubmit}
              className="bg-theme-green text-white px-6 py-3 rounded shadow text-sm font-semibold"
            >
              ✅ Submit Quiz
            </button>
          ) : (
            <div className="space-y-3">
              <div className="text-theme-green font-semibold text-sm">
                🎯 You scored {score} / {questions.length}.
              </div>

              <p className="text-sm text-gray-700">
                Next, you will send your final essay to a Google Doc that is
                already set up in APA style. Then you will download a PDF and
                turn it in here.
              </p>

              <button
                onClick={handleExportToGoogleDocs}
                className="bg-theme-blue text-white px-6 py-3 rounded shadow text-sm font-semibold"
              >
                ✍ Export Final Draft to Google Docs (APA Format)
              </button>

              {exportUrl && (
                <div className="mt-4 border rounded-lg p-3 bg-theme-light shadow-sm text-sm">
                  <div className="font-semibold mb-2">Your Google Doc</div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <a
                      className="text-theme-blue underline"
                      href={exportUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open your document
                    </a>
                    <button
                      className="px-3 py-1 border rounded text-xs"
                      onClick={() => navigator.clipboard.writeText(exportUrl)}
                    >
                      Copy link
                    </button>
                  </div>
                  {popupBlocked && (
                    <p className="text-xs text-orange-700 mt-2">
                      If a popup blocker stopped the new tab, use the link
                      above or allow popups for this site.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </section>

        {/* FINAL PDF UPLOAD */}
        {submitted && (
          <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-theme-dark flex items-center gap-2">
              <span role="img" aria-label="upload">
                📤
              </span>
              Submit Your Final Essay as a PDF
            </h2>
            <p className="text-sm text-gray-700">
              In Google Docs, choose File → Download → PDF. Save the file where
              you can find it, then upload that PDF here. This is the version
              your teacher will grade.
            </p>

            {finalPdfRow && (
              <div className="rounded-lg border border-gray-200 bg-theme-light px-4 py-3 text-sm">
                <p className="text-gray-700">We already have a final PDF on file.</p>
                {(finalPdfRow.public_url || finalPdfRow.web_view_link) && (
                  <a
                    href={finalPdfRow.public_url || finalPdfRow.web_view_link}
                    target="_blank"
                    rel="noreferrer"
                    className="text-theme-blue underline mt-1 inline-block"
                  >
                    Open final PDF
                  </a>
                )}
              </div>
            )}

            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0] || null)}
              className="mb-2 text-sm"
            />

            <button
              onClick={handleUploadPDF}
              disabled={!pdfFile || uploading}
              className={`bg-theme-orange text-white px-6 py-2 rounded shadow text-sm font-semibold ${
                !pdfFile || uploading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
            >
              {uploading ? "Uploading…" : "📎 Upload Final PDF"}
            </button>

            {pdfFile && !uploading && (
              <div className="text-xs text-gray-600 mt-1">
                Selected: {pdfFile.name}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}