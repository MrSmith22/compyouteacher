"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import { logActivity } from "@/lib/logActivity";
import { MLK_ESSAY_PROMPT } from "@/lib/assignments/mlkEssayPrompt";

/** Keyword-based checklist status. Found = green only when confident; else "Check this" (gray). No red. */
function getChecklistStatus(text) {
  const v = (text || "").toLowerCase();

  const a = (v.includes("compare") || v.includes("comparing")) && (v.includes("contrast") || v.includes("contrasting"));
  const b = v.includes("ethos") && v.includes("pathos") && v.includes("logos");
  const c = v.includes("audience") && v.includes("purpose");
  const d = (v.includes("speech") || v.includes("dream")) && (v.includes("letter") || v.includes("birmingham"));

  return [
    { label: "Compare and contrast", status: a ? "found" : "check" },
    { label: "Ethos, pathos, logos", status: b ? "found" : "check" },
    { label: "Audience and purpose", status: c ? "found" : "check" },
    { label: "Evidence from both texts (speech and letter)", status: d ? "found" : "check" },
  ];
}

const modules = [
  {
    id: 1,
    title: "Module 1: Review of Rhetorical Strategies",
    description:
      "Watch a video on Ethos, Pathos & Logos and complete a quiz.",
    content: {
      videoFile: "/videos/Ethos Pathos and Logos Explained.mp4",
      quiz: [
        {
          question: "What is the main purpose of the video?",
          options: [
            "To explain how to cook eggs in different ways",
            "To teach readers how to improve their public speaking voice",
            "To introduce the concept of rhetoric and its main strategies",
            "To describe Aristotle’s life and achievements",
          ],
          answer:
            "To introduce the concept of rhetoric and its main strategies",
        },
        {
          question: "What does the term rhetoric refer to in the video?",
          options: [
            "The ability to speak loudly and clearly",
            "The art of effective and persuasive writing and speaking",
            "The process of writing fictional stories",
            "The study of ancient Greek literature",
          ],
          answer:
            "The art of effective and persuasive writing and speaking",
        },
        {
          question: "Which of the following best describes ethos?",
          options: [
            "Making the audience laugh to build interest",
            "Appealing to the audience’s emotions",
            "Presenting strong data and facts",
            "Establishing credibility and trustworthiness",
          ],
          answer: "Establishing credibility and trustworthiness",
        },
        {
          question:
            "A chef on a cooking show who wears a professional uniform and describes their years of experience is using which rhetorical strategy?",
          options: ["Pathos", "Logos", "Ethos", "Satire"],
          answer: "Ethos",
        },
        {
          question: "Which of these is an example of pathos?",
          options: [
            "Explaining how a law works in logical steps",
            "Sharing a touching story about a sick puppy to encourage donations",
            "Listing your degrees and awards in a speech",
            "Quoting historical data to support your point",
          ],
          answer:
            "Sharing a touching story about a sick puppy to encourage donations",
        },
        {
          question:
            "According to the video, why is pathos often effective in persuasion?",
          options: [
            "It is based on historical facts",
            "It appeals to the audience's trust",
            "It overrides logic and creates urgency through emotion",
            "It shows the speaker’s qualifications",
          ],
          answer:
            "It overrides logic and creates urgency through emotion",
        },
        {
          question:
            "What does logos focus on when trying to persuade an audience?",
          options: [
            "Trust and reputation",
            "Humor and sarcasm",
            "Clear evidence and logical reasoning",
            "Feelings and empathy",
          ],
          answer: "Clear evidence and logical reasoning",
        },
        {
          question:
            "A dentist shows patients a study on sugar and tooth decay. This is an example of which rhetorical strategy?",
          options: ["Logos", "Ethos", "Pathos", "Irony"],
          answer: "Logos",
        },
        {
          question:
            "Why might political candidates use fear or anger in their speeches, according to the video?",
          options: [
            "To avoid logical arguments",
            "To reduce audience attention",
            "To appeal to the audience’s emotions and influence decisions",
            "To seem more trustworthy and experienced",
          ],
          answer:
            "To appeal to the audience’s emotions and influence decisions",
        },
        {
          question:
            "How can someone become better at rhetoric, based on the video?",
          options: [
            "Memorize every persuasive technique",
            "Focus only on emotional appeals",
            "Avoid learning from others to stay original",
            "Study skilled speakers and writers and practice using rhetorical strategies",
          ],
          answer:
            "Study skilled speakers and writers and practice using rhetorical strategies",
        },
      ],
    },
  },
];

export default function ModuleOne() {
  const [currentModuleIndex] = useState(0);
  const currentModule = modules[currentModuleIndex];

  const [assignmentBreakdown, setAssignmentBreakdown] = useState("");
  const [breakdownSaved, setBreakdownSaved] = useState(false);
  const [breakdownConfirmed, setBreakdownConfirmed] = useState(false);

  const [userAnswers, setUserAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const router = useRouter();
  const { data: session } = useSession();
  const videoSectionRef = useRef(null);

  const checklistItems = useMemo(() => getChecklistStatus(assignmentBreakdown), [assignmentBreakdown]);

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };

  const isQuizCorrect = (index) => {
    return (
      userAnswers[index] &&
      userAnswers[index].toLowerCase() ===
        currentModule.content.quiz[index].answer.toLowerCase()
    );
  };

  const getScoreData = () => {
    const total = currentModule.content.quiz.length;

    const correct = currentModule.content.quiz.reduce((acc, q, i) => {
      return acc + (isQuizCorrect(i) ? 1 : 0);
    }, 0);

    const percent = Math.round((correct / total) * 100);

    return { correct, total, percent };
  };

  const handleSubmitQuiz = async () => {
    if (quizSubmitted) return;

    if (!session?.user?.email) {
      alert("You must be signed in to submit the quiz.");
      return;
    }

    setQuizSubmitted(true);

    const { correct, total, percent } = getScoreData();
    const userEmail = session.user.email;

    // 1) Save quiz result to module1_quiz_results
    try {
      const { error } = await supabase.from("module1_quiz_results").insert({
        user_email: userEmail,
        score: correct,
        total,
        answers: userAnswers, // stored as jsonb
      });

      if (error) {
        console.error("Error saving Module 1 quiz result:", error);
      }
    } catch (err) {
      console.error("Unexpected error saving Module 1 quiz result:", err);
    }

    // 2) Log quiz_submitted with rich metadata
    try {
      await logActivity(userEmail, "quiz_submitted", 1, {
        quiz: "rhetoric_module1",
        correct,
        total,
        percent,
        answers: userAnswers,
      });
    } catch (err) {
      console.error("Error logging quiz_submitted for Module 1:", err);
    }

    // 3) Log module_completed with summary metadata
    try {
      await logActivity(userEmail, "module_completed", 1, {
        quiz: "rhetoric_module1",
        correct,
        total,
        percent,
      });
    } catch (err) {
      console.error("Error logging module_completed for Module 1:", err);
    }

    // 4) Navigate to success screen
    setTimeout(() => {
      router.push(`/modules/1/success?score=${percent}`);
    }, 1000);
  };

  const handleSaveBreakdown = () => {
    const trimmed = assignmentBreakdown.trim();
    if (!trimmed) return;
    setBreakdownSaved(true);
  };

  const handleEditBreakdown = () => {
    setBreakdownSaved(false);
  };

  const handleContinueToVideo = () => {
    setBreakdownConfirmed(true);
    setTimeout(() => {
      videoSectionRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="p-4 bg-theme-light shadow rounded max-w-3xl mx-auto">
      <h2 className="text-3xl font-extrabold text-center text-theme-blue mb-2">
        {currentModule.title}
      </h2>
      <p className="text-center text-theme-muted mb-6">
        {currentModule.description}
      </p>

      {/* Essay Prompt - displayed above Assignment Breakdown */}
      <div className="mb-6 p-4 border rounded bg-white">
        <h3 className="text-xl font-semibold text-theme-dark mb-2">
          Essay Prompt
        </h3>
        <p className="text-theme-dark whitespace-pre-line">
          {MLK_ESSAY_PROMPT}
        </p>
      </div>

      {/* Why We Use Words Like 'Ethos' and 'Audience' - below What This Means, above Assignment Breakdown */}
      <div className="mb-6 p-4 border rounded bg-white">
        <h3 className="text-lg font-semibold text-theme-dark mb-2">
          Why We Use Words Like &apos;Ethos&apos; and &apos;Audience&apos;
        </h3>
        <p className="text-theme-dark whitespace-pre-line">
          {`Academic vocabulary exists because it allows us to say complex ideas clearly and precisely.

For example, the word "ethos" quickly communicates the idea of credibility and trust.
Without that word, we would need a longer explanation every time.

The simpler explanation above is meant to help you understand the task.
But the official vocabulary is more accurate and more efficient.

Part of becoming a stronger writer is learning how to use precise language to think and communicate more clearly.`}
        </p>
      </div>

      {/* Assignment Breakdown step - before video and quiz */}
      {!breakdownConfirmed && (
        <div className="mb-6 p-4 rounded border border-theme-blue/30 bg-white">
          <h3 className="text-xl font-semibold text-theme-blue mb-3">
            Assignment Breakdown
          </h3>

          {!breakdownSaved ? (
            <>
              <label className="block font-medium text-theme-dark mb-2">
                In 1 to 3 sentences, explain what this assignment is asking you to do.
              </label>
              <textarea
                value={assignmentBreakdown}
                onChange={(e) => setAssignmentBreakdown(e.target.value)}
                className="border border-gray-300 p-2 rounded w-full text-theme-dark"
                rows={4}
                placeholder="Example: I need to compare and contrast how Dr. King uses ethos, pathos, and logos in his speech and letter, and explain how his choices connect to audience and purpose."
              />
              <button
                onClick={handleSaveBreakdown}
                disabled={!assignmentBreakdown.trim()}
                className={`mt-3 px-4 py-2 rounded text-white ${
                  assignmentBreakdown.trim() ? "bg-theme-blue" : "bg-gray-400"
                }`}
              >
                Save
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-theme-muted mb-2">Your response:</p>
              <p className="p-3 rounded bg-theme-light border border-gray-200 text-theme-dark mb-4">
                {assignmentBreakdown}
              </p>
              <p className="text-sm font-medium text-theme-dark mb-2">Checklist:</p>
              <ul className="space-y-2 mb-4">
                {checklistItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        item.status === "found" ? "text-theme-green" : "text-theme-muted"
                      }`}
                    >
                      {item.status === "found" ? "✓ Found" : "○ Check this"}
                    </span>
                    <span className="text-theme-dark">{item.label}</span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <button
                  onClick={handleEditBreakdown}
                  className="px-4 py-2 rounded bg-gray-200 text-theme-dark hover:bg-gray-300"
                >
                  Edit My Response
                </button>
                <button
                  onClick={handleContinueToVideo}
                  className="px-4 py-2 rounded bg-theme-blue text-white hover:opacity-90"
                >
                  Yes, This Is Clear, Continue
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Video - shown after Assignment Breakdown is confirmed */}
      {breakdownConfirmed && (
        <div ref={videoSectionRef} className="mb-6">
          <video width="100%" height="315" controls>
            <source src={currentModule.content.videoFile} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {/* Quiz - shown after Assignment Breakdown is confirmed */}
      {breakdownConfirmed && (
      <div className="mb-4">
        <h3 className="text-2xl font-semibold mb-4 text-theme-green">
          Quiz
        </h3>
        {currentModule.content.quiz.map((q, index) => (
          <div key={index} className="mb-4">
            <p className="font-medium mb-2 text-theme-dark">
              {q.question}
            </p>
            <select
              value={userAnswers[index] || ""}
              onChange={(e) => handleAnswerChange(index, e.target.value)}
              className="border p-2 rounded w-full"
              disabled={quizSubmitted}
            >
              <option value="">Select an answer</option>
              {q.options.map((option, i) => (
                <option key={i} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {quizSubmitted && (
              <p
                className={`mt-1 text-sm font-semibold ${
                  isQuizCorrect(index) ? "text-green-600" : "text-red-600"
                }`}
              >
                {isQuizCorrect(index) ? "Correct" : "Incorrect"}
              </p>
            )}
          </div>
        ))}
        {!quizSubmitted && (
          <button
            onClick={handleSubmitQuiz}
            className="bg-theme-blue text-white px-4 py-2 rounded"
          >
            Submit Quiz
          </button>
        )}
      </div>
      )}
    </div>
  );
}