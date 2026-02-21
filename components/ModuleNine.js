"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { requireModuleAccess } from "@/lib/supabase/helpers/moduleGate";
import {
  getExportedDocLink,
  getStudentExport,
} from "@/lib/supabase/helpers/studentExports";
import { getFinalTextForExport } from "@/lib/supabase/helpers/studentDrafts";
import { logActivity } from "../lib/logActivity";

const ASSIGNMENT_NAME = "MLK Essay Assignment";

export default function ModuleNine() {
  const { data: session } = useSession();
  const router = useRouter();

  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [review, setReview] = useState([]); // per-question report

  const [pdfFile, setPdfFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [exportUrl, setExportUrl] = useState(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [finalPdfRow, setFinalPdfRow] = useState(null);
  const [guidedMode, setGuidedMode] = useState(true);
  const [viewedStep, setViewedStep] = useState(1);
  const [checklistState, setChecklistState] = useState(Array(6).fill(false));

  const hasLoggedStartRef = useRef(false);
  const hasLoggedSubmissionDetectedRef = useRef(false);
  const step2Ref = useRef(null);
  const step3Ref = useRef(null);
  const step4Ref = useRef(null);
  const [gateOk, setGateOk] = useState(null); // null = loading, true/false = result

  const alreadySubmitted = !!finalPdfRow;
  const checklistComplete = checklistState.every(Boolean);
  const activeStep =
    !submitted
      ? 1
      : !exportUrl
        ? 2
        : !checklistComplete
          ? 3
          : !alreadySubmitted
            ? 4
            : 4;

  const CHECKLIST_ITEMS = [
    "Font: Times New Roman, size 12.",
    "Spacing: double spaced everywhere, including references.",
    "Margins: one inch on all sides.",
    "Title page: includes title, your name, school, course, teacher, and date in the correct spots.",
    "Page numbers: page number in the top right corner of every page.",
    "References page: starts on a new page, entries in alphabetical order by author last name, double spaced.",
  ];

  const CHECKLIST_STORAGE_KEY = (email) => `wp:m9_checklist:${email}`;
  const checklistLoadedRef = useRef(false);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email || checklistLoadedRef.current) return;
    checklistLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY(email));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length === 6) {
        setChecklistState(parsed.map(Boolean));
      }
    } catch {
      try {
        localStorage.removeItem(CHECKLIST_STORAGE_KEY(email));
      } catch {
        // ignore
      }
    }
  }, [session?.user?.email]);

  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;
    try {
      localStorage.setItem(
        CHECKLIST_STORAGE_KEY(email),
        JSON.stringify(checklistState)
      );
    } catch {
      // ignore
    }
  }, [session?.user?.email, checklistState]);

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
      q: "MLK's 'I Have a Dream' speech and 'Letter from Birmingham Jail' are best cited as:",
      opts: ["Primary sources", "Secondary sources", "Tertiary sources"],
      a: "Primary sources",
    },
    {
      q: "Do student APA papers always need an abstract?",
      opts: [
        "Yes, always",
        "No, only if the teacher or assignment requires it",
        "Yes, if the paper is longer than 2 pages",
      ],
      a: "No, only if the teacher or assignment requires it",
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

  useEffect(() => {
    setUserAnswers(Array(questions.length).fill(""));
  }, []);

  useEffect(() => {
    if (!session?.user?.email) return;
    (async () => {
      const { ok } = await requireModuleAccess({
        userEmail: session.user.email,
        assignmentName: ASSIGNMENT_NAME,
        minModule: 9,
      });
      setGateOk(ok);
    })();
  }, [session?.user?.email]);

  useEffect(() => {
    if (!session?.user?.email) return;
    if (hasLoggedStartRef.current) return;
    hasLoggedStartRef.current = true;

    logActivity(session.user.email, "module_started", {
      module: 9,
    });
  }, [session]);

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

  useEffect(() => {
    if (!session?.user?.email || !finalPdfRow || hasLoggedSubmissionDetectedRef.current) return;
    hasLoggedSubmissionDetectedRef.current = true;
    logActivity(session.user.email, "submission_detected", { module: 9 });
  }, [session?.user?.email, finalPdfRow]);

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

    const exportRes = await getFinalTextForExport({ userEmail: email });

    await logActivity(email, "export_to_docs_attempt", {
      module: 9,
      status: exportRes.status,
      sourceModule: exportRes.sourceModule,
      details: exportRes.details,
    });

    if (exportRes.status !== "ok" || !exportRes.text) {
      if (exportRes.status === "missing") {
        alert(
          "We could not find your essay text yet. Go back to Module 7 and make sure you completed your revision, then try again."
        );
        return;
      }

      alert(
        "We hit a problem while trying to load your essay text. Please refresh and try again. If it keeps happening, tell your teacher."
      );
      return;
    }

    if (exportRes.sourceModule === 6) {
      alert(
        "We are exporting your Module 6 draft because we could not find a finalized Module 7 version yet. If you revised in Module 7, go back and finalize it first."
      );
    }

    const res = await fetch("/api/export-to-docs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: exportRes.text, email }),
    });

    const result = await res.json();
    if (!res.ok) {
      alert("Failed to export to Google Docs.");
      await logActivity(email, "export_to_docs_failed", {
        module: 9,
        status: "api_failed",
      });
      return;
    }

    setExportUrl(result.url);

    await logActivity(email, "export_to_docs", {
      module: 9,
      url: result.url,
      sourceModule: exportRes.sourceModule,
      status: exportRes.status,
      details: exportRes.details,
    });

    const win = window.open(result.url, "_blank");
    if (!win || win.closed || typeof win.closed === "undefined") {
      setPopupBlocked(true);
    }
  };

  const MAX_PDF_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

  const handleFileSelect = (e) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setPdfFile(null);
      return;
    }
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("File must be a PDF. Please select a file ending in .pdf");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PDF_SIZE_BYTES) {
      setUploadError("File is too large. Maximum size is 15 MB.");
      setPdfFile(null);
      e.target.value = "";
      return;
    }
    setPdfFile(file);
  };

  const canUpload =
    submitted && exportUrl && checklistComplete && !!pdfFile && !uploading;

  const handleUploadPDF = async () => {
    if (!session?.user?.email) return;
    if (!submitted || !exportUrl || !checklistComplete) {
      setUploadError("Complete all previous steps (quiz, export, checklist) before uploading.");
      return;
    }
    if (!pdfFile) {
      setUploadError("Please select a PDF first.");
      return;
    }

    const isPdf =
      pdfFile.type === "application/pdf" ||
      pdfFile.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setUploadError("File must be a PDF.");
      return;
    }
    if (pdfFile.size > MAX_PDF_SIZE_BYTES) {
      setUploadError("File is too large. Maximum size is 15 MB.");
      return;
    }

    setUploadError(null);
    try {
      setUploading(true);

      const formData = new FormData();
      formData.append("file", pdfFile);

      const res = await fetch("/api/final-pdf", {
        method: "POST",
        body: formData,
      });

      const result = await res.json().catch(() => ({}));

      if (res.status === 409) {
        const refetch = await getStudentExport({
          userEmail: session.user.email,
          module: 9,
          kind: "final_pdf",
        });
        if (refetch.data) setFinalPdfRow(refetch.data);
        setUploadError(null);
        alert("Your final PDF has already been submitted. The page has been updated.");
        return;
      }

      if (!res.ok) {
        const msg = result?.error || "Upload failed. Please try again.";
        setUploadError(msg);
        alert(msg);
        return;
      }

      await logActivity(session.user.email, "pdf_uploaded", {
        module: 9,
        file_name: pdfFile.name,
        storage_path: result.storage_path,
        public_url: result.publicUrl,
      });

      setFinalPdfRow((prev) => ({
        ...prev,
        public_url: result.publicUrl,
        web_view_link: result.webViewLink ?? result.publicUrl,
      }));
      router.push("/modules/9/success");
    } catch (err) {
      console.error(err);
      const msg = "Upload failed. Please try again.";
      setUploadError(msg);
      alert(msg);
    } finally {
      setUploading(false);
    }
  };

  if (!session) return <p className="p-6">Loading…</p>;

  if (gateOk === false) {
    return (
      <div className="min-h-screen bg-theme-light flex items-center justify-center p-6">
        <p className="text-theme-dark">Finish Module 8 before starting Module 9.</p>
      </div>
    );
  }

  if (gateOk !== true) {
    return <p className="p-6">Loading…</p>;
  }

  return (
    <div className="min-h-screen bg-theme-light">
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <header className="bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-4 space-y-3">
          <h1 className="text-3xl font-extrabold text-theme-blue">📘 Module 9: APA Format and Final Submission</h1>
          <p className="text-gray-700 text-sm md:text-base">
            In this module you will take a short APA style review quiz, move your final draft into an APA formatted
            Google Doc, and then submit a PDF of your essay. APA style is a set of rules for how the paper looks on
            the page, not a new kind of essay. You are polishing the presentation of strong thinking you have already done.
          </p>
          <div className="bg-theme-light border border-gray-200 rounded-lg px-4 py-3 text-sm">
            <p className="font-semibold mb-1">What you will do in this module:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Review the APA checklist below.</li>
              <li>Take the APA mini quiz to check your understanding.</li>
              <li>Open the APA Google Docs template and copy your final essay into that document.</li>
              <li>Use the checklist to adjust font, spacing, title page, page numbers, and references so they match APA rules.</li>
              <li>Download the Google Doc as a PDF and upload your final paper in the section at the bottom of this page.</li>
            </ol>
          </div>
          {!alreadySubmitted && (
            <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={guidedMode}
                  onChange={(e) => setGuidedMode(e.target.checked)}
                  className="rounded border-gray-300 text-theme-blue"
                />
                Guided mode
              </label>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span
                  className={`px-2 py-1 rounded ${
                    activeStep >= 1 ? "bg-theme-green text-white" : "bg-gray-200"
                  }`}
                >
                  Step 1: Quiz {submitted ? "✓" : ""}
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    activeStep >= 2 ? "bg-theme-green text-white" : "bg-gray-200"
                  }`}
                >
                  Step 2: Export {exportUrl ? "✓" : ""}
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    activeStep >= 3 ? "bg-theme-green text-white" : "bg-gray-200"
                  }`}
                >
                  Step 3: Checklist {checklistComplete ? "✓" : ""}
                </span>
                <span
                  className={`px-2 py-1 rounded ${
                    activeStep >= 4 ? "bg-theme-green text-white" : "bg-gray-200"
                  }`}
                >
                  Step 4: Upload PDF
                </span>
              </div>
            </div>
          )}
        </header>

        {alreadySubmitted && (
          <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-theme-dark">Submitted: Final PDF received</h2>
            <p className="text-sm text-gray-700">Your work for this module is complete. Use the links below to open your documents.</p>
            <div className="flex flex-wrap gap-3">
              {(finalPdfRow?.public_url || finalPdfRow?.web_view_link) && (
                <a
                  href={finalPdfRow.public_url || finalPdfRow.web_view_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded bg-theme-blue text-white text-sm font-semibold shadow hover:opacity-90"
                >
                  Open final PDF
                </a>
              )}
              {exportUrl && (
                <a
                  href={exportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 rounded bg-theme-green text-white text-sm font-semibold shadow hover:opacity-90"
                >
                  Open Google Doc
                </a>
              )}
            </div>
          </section>
        )}

        {(!guidedMode || activeStep <= 3) && (activeStep === 1 || activeStep === 2 || activeStep === 3) && !alreadySubmitted && (
        <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 space-y-3 shadow-sm">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="checklist">📋</span>
            APA Formatting Checklist
          </h2>
          <p className="text-sm text-gray-700">
            Use this checklist while you work in the Google Doc. Think of it as a style uniform. Every student paper will not
            say the same thing, but they all wear the same APA clothing.
          </p>
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
            Open the template, click the button to make your own copy, then paste your final essay into the body of that
            document. Replace the placeholder text on the title page with your own information.
          </p>

          <div className="mt-3 border-t border-gray-200 pt-3">
            <h3 className="text-sm font-semibold text-theme-dark mb-1">Need more help with APA style?</h3>
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
              You do not have to read every word. Use the examples to double check things like the title page, page numbers,
              in text citations, and reference entries.
            </p>
          </div>
        </section>
        )}

        {(!guidedMode || viewedStep === 1) && !alreadySubmitted && (
        <section className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="quiz">✏️</span>
            Step 1 of 4: Quiz{submitted ? " ✓" : ""}
          </h2>
          <p className="text-sm text-gray-700">
            This quiz is practice. It helps you notice the biggest APA rules before you format your Google Doc. If you miss
            some questions, use the checklist and resources above to fix your paper.
          </p>

          {questions.map((item, idx) => (
            <div key={idx} className="space-y-2">
              <p className="font-medium text-sm md:text-base">
                {idx + 1}. {item.q}
              </p>
              {item.opts.map((opt, oIdx) => {
                const chosen = userAnswers[idx];
                const isCorrect = submitted && opt === item.a;
                const isWrongChoice = submitted && chosen === opt && chosen !== item.a;

                return (
                  <label
                    key={oIdx}
                    className={`block text-sm ${isCorrect ? "text-green-700" : ""} ${isWrongChoice ? "text-red-700" : ""}`}
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
                <div className="text-xs text-gray-700">
                  Correct answer: <span className="font-semibold">{item.a}</span>
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
              {alreadySubmitted && (
                <p className="text-sm text-gray-700">
                  Your final PDF has been submitted. Use the links at the top of this page to open your documents.
                </p>
              )}
              {guidedMode && submitted && !alreadySubmitted && (
                <button
                  type="button"
                  onClick={() => {
                    setViewedStep(2);
                    setTimeout(() => step2Ref.current?.scrollIntoView({ behavior: "smooth" }), 0);
                  }}
                  className="bg-theme-blue text-white px-4 py-2 rounded shadow text-sm font-semibold hover:opacity-90"
                >
                  Continue to Step 2 →
                </button>
              )}
            </div>
          )}
        </section>
        )}

        {(!guidedMode || viewedStep === 2) && submitted && !alreadySubmitted && (
        <section ref={step2Ref} className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="export">✍</span>
            Step 2 of 4: Export to Google Docs{exportUrl ? " ✓" : ""}
          </h2>
          <p className="text-sm text-gray-700">
            Send your final essay to a Google Doc that is already set up in APA style. Then you will format it and download a PDF.
          </p>
          <button
            onClick={handleExportToGoogleDocs}
            className="bg-theme-blue text-white px-6 py-3 rounded shadow text-sm font-semibold"
          >
            Export Final Draft to Google Docs (APA Format)
          </button>
          {exportUrl && (
            <div className="mt-4 border rounded-lg p-3 bg-theme-light shadow-sm text-sm">
              <div className="font-semibold mb-2">Your Google Doc</div>
              <div className="flex items-center gap-3 flex-wrap">
                <a className="text-theme-blue underline" href={exportUrl} target="_blank" rel="noreferrer">
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
                  If a popup blocker stopped the new tab, use the link above or allow popups for this site.
                </p>
              )}
            </div>
          )}
          {guidedMode && exportUrl && (
            <button
              type="button"
              onClick={() => {
                setViewedStep(3);
                setTimeout(() => step3Ref.current?.scrollIntoView({ behavior: "smooth" }), 0);
              }}
              className="bg-theme-blue text-white px-4 py-2 rounded shadow text-sm font-semibold hover:opacity-90"
            >
              Continue to Step 3 →
            </button>
          )}
        </section>
        )}

        {(!guidedMode || viewedStep === 3) && submitted && exportUrl && !alreadySubmitted && (
        <section ref={step3Ref} className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
          <h2 className="text-xl font-semibold text-theme-dark flex items-center gap-2">
            <span role="img" aria-label="confirm">✅</span>
            Step 3 of 4: Format Checklist Confirmation{checklistComplete ? " ✓" : ""}
          </h2>
          <p className="text-sm text-gray-700">
            Confirm you have applied each APA formatting item in your Google Doc before uploading your PDF.
          </p>
          <div className="space-y-2">
            {CHECKLIST_ITEMS.map((label, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checklistState[i] || false}
                  onChange={(e) => {
                    const next = [...checklistState];
                    next[i] = e.target.checked;
                    setChecklistState(next);
                  }}
                  className="rounded border-gray-300 text-theme-blue"
                />
                {label}
              </label>
            ))}
          </div>
          {checklistComplete && (
            <p className="text-theme-green text-sm font-medium">All items confirmed. Proceed to upload your PDF.</p>
          )}
          {guidedMode && checklistComplete && (
            <button
              type="button"
              onClick={() => {
                setViewedStep(4);
                setTimeout(() => step4Ref.current?.scrollIntoView({ behavior: "smooth" }), 0);
              }}
              className="bg-theme-blue text-white px-4 py-2 rounded shadow text-sm font-semibold hover:opacity-90"
            >
              Continue to Step 4 →
            </button>
          )}
        </section>
        )}

        {alreadySubmitted && (
          <section className="mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="bg-theme-red text-white px-6 py-3 rounded shadow text-sm font-semibold hover:opacity-90"
            >
              Back to Dashboard
            </button>
          </section>
        )}

        {(!guidedMode || viewedStep === 4) && submitted && exportUrl && checklistComplete && !alreadySubmitted && (
          <section ref={step4Ref} className="border border-gray-200 rounded-xl bg-white px-5 py-4 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold text-theme-dark flex items-center gap-2">
              <span role="img" aria-label="upload">📤</span>
              Step 4 of 4: Submit Your Final Essay as a PDF
            </h2>
            <p className="text-sm text-gray-700">
              In Google Docs, choose File → Download → PDF. Save the file where you can find it, then upload that PDF here.
              This is the version your teacher will grade.
            </p>

            <div className="bg-theme-light border border-gray-200 rounded-lg px-4 py-3 text-xs space-y-1 mb-3">
              <p className="font-semibold">Upload checklist:</p>
              <p>• In Google Docs: File → Download → PDF</p>
              <p>• Make sure your file name ends with .pdf</p>
            </div>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="mb-2 text-sm"
            />

            {uploadError && (
              <div className="rounded-lg border border-theme-red bg-red-50 px-4 py-3 text-sm text-theme-red mb-2">
                {uploadError}
              </div>
            )}

            <button
              onClick={handleUploadPDF}
              disabled={!canUpload}
              className={`bg-theme-orange text-white px-6 py-2 rounded shadow text-sm font-semibold ${
                !canUpload ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {uploading ? "Uploading…" : "📎 Upload Final PDF"}
            </button>

            {pdfFile && !uploading && (
              <div className="text-xs text-gray-600 mt-1">
                Selected: {pdfFile.name}
                {" "}
                ({(pdfFile.size / (1024 * 1024)).toFixed(1)} MB)
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}