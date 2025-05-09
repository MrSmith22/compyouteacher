"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleNine() {
  const { data: session } = useSession();
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const questions = [
  {
    question: "What is the correct font for APA Style papers?",
    options: ["Times New Roman, 12 pt", "Calibri, 8 pt", "Arial, 14 pt"],
    answer: "Times New Roman, 12 pt",
  },
  {
    question: "What spacing should be used in an APA-formatted paper?",
    options: ["Single", "1.5 spacing", "Double"],
    answer: "Double",
  },
  {
    question: "Where does the title page appear in an APA paper?",
    options: ["At the end", "After the abstract", "As the first page"],
    answer: "As the first page",
  },
  {
    question: "Which of the following is a correct in-text citation in APA?",
    options: ["(Smith, 2020)", "[Smith 2020]", "Smith, 2020:"],
    answer: "(Smith, 2020)",
  },
  {
    question: "How should the reference page be formatted?",
    options: [
      "Double spaced, alphabetical order",
      "Single spaced, numbered list",
      "Double spaced, chronological order"
    ],
    answer: "Double spaced, alphabetical order",
  },
  {
    question: "What is the correct page header on the title page?",
    options: [
      "Title of the paper only",
      "Page number only",
      "Title and page number, right-aligned"
    ],
    answer: "Title and page number, right-aligned",
  },
  {
    question: "What belongs on the title page in APA format?",
    options: [
      "Title, author, institution, course, instructor, date",
      "Only the title and author name",
      "Title, table of contents, and date"
    ],
    answer: "Title, author, institution, course, instructor, date",
  },
  {
    question: "Which of these is a proper APA reference for a book?",
    options: [
      "Smith, J. (2020). *Writing Well*. New York: Penguin.",
      "Smith, J. 2020. Writing Well. Penguin.",
      "Writing Well by J. Smith (2020). Penguin"
    ],
    answer: "Smith, J. (2020). *Writing Well*. New York: Penguin.",
  },
  {
    question: "Should APA papers include an abstract?",
    options: [
      "Yes, for most academic papers",
      "No, it's optional",
      "Only if the teacher requires it"
    ],
    answer: "Yes, for most academic papers",
  },
  {
    question: "What is the correct order for an APA paper?",
    options: [
      "Title Page → Abstract → Body → References",
      "Introduction → Body → References → Title Page",
      "Title Page → References → Body → Abstract"
    ],
    answer: "Title Page → Abstract → Body → References",
  },
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
      const { error } = await supabase
        .from("module9_quiz")
        .upsert({
          user_email: session.user.email,
          score: total,
          total: questions.length,
          submitted_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error saving quiz result:", error.message);
        alert("Failed to save your quiz score.");
      } else {
        console.log("Quiz score saved to Supabase.");
      }
    }
  };

    const handleExportToGoogleDocs = async () => {
    if (!session?.user?.email) return;

    const { data, error } = await supabase
      .from("student_drafts")
      .select("final_text")
      .eq("user_email", session.user.email)
      .eq("module", 6)
      .single();

    if (error || !data?.final_text) {
      alert("Could not find your final essay text.");
      console.error(error);
      return;
    }

    const response = await fetch("/api/export-to-docs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
     body: JSON.stringify({
  text: data.final_text,
  email: session.user.email, // ✅ this enables sharing with the logged-in student
})

    });

    const result = await response.json();

    if (response.ok) {
      window.open(result.url, "_blank");
    } else {
      alert("Failed to export to Google Docs.");
      console.error(result.error);
    }
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📘 Module 9: APA Mini Quiz</h1>
      <p className="text-sm text-gray-600">
        Test your knowledge of APA formatting before finalizing your paper.
      </p>

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
          className="bg-blue-700 text-white px-6 py-3 rounded shadow"
        >
          ✅ Submit Quiz
        </button>
           ) : (
        <>
          <div className="text-green-700 font-semibold">
            You scored {score} out of {questions.length}.
          </div>

          <button
            onClick={handleExportToGoogleDocs}
            className="bg-green-700 text-white px-6 py-3 rounded shadow mt-4"
          >
            ✍ Export Final Draft to Google Docs (APA Format)
          </button>
        </>
      )}
    </div>
  );
}
