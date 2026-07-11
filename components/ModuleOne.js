"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import { supabase } from "@/lib/supabaseClient";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { logActivity } from "@/lib/logActivity";

const VOCAB_LATER_USES = [
  {
    term: "Rhetoric",
    laterUse:
      "You will use this word when you talk about how King tries to persuade people in both texts.",
  },
  {
    term: "Ethos",
    laterUse:
      "You will look for places where King builds trust or credibility in the speech and the letter.",
  },
  {
    term: "Pathos",
    laterUse:
      "You will notice where King appeals to feelings to move his audience.",
  },
  {
    term: "Logos",
    laterUse:
      "You will find where King uses reasons, evidence, or logic to support his point.",
  },
  {
    term: "Audience and purpose",
    laterUse:
      "You will connect King’s choices to who he was speaking to and what he wanted them to understand or do.",
  },
];

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
    title: "Module 1: Understand the Assignment",
    description:
      "Step 2 of 2: learn rhetorical vocabulary with a short video and quiz.",
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

export default function ModuleOne({ savedStudentParaphrase = "" }) {
  const [currentModuleIndex] = useState(0);
  const currentModule = modules[currentModuleIndex];
  const { prompt } = mlkAssignmentDefinition;

  const hasSavedParaphrase = !!savedStudentParaphrase.trim();

  const [assignmentBreakdown, setAssignmentBreakdown] = useState("");
  const [breakdownSaved, setBreakdownSaved] = useState(false);
  const [breakdownConfirmed, setBreakdownConfirmed] = useState(hasSavedParaphrase);

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
    <ModulePageShell>
      <WorkspaceColumns variant="drafting" className="gap-5 xl:gap-8">
        <WorkspaceSidebar className="opacity-80 lg:col-span-1">
          <aside className="space-y-4 rounded-xl bg-surface-soft/70 px-4 py-5 text-left">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Module 1
              </p>
              <p className="text-sm font-semibold text-text-primary">
                Understand the Assignment
              </p>
            </div>
            <div className="space-y-1 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                Where you are
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Step 2 of 2 · Learn the vocabulary
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                You already finished Step 1: breaking down the prompt.
              </p>
            </div>
            {hasSavedParaphrase ? (
              <div className="space-y-1 border-t border-border-soft/60 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                  Your understanding
                </p>
                <p className="text-sm leading-relaxed text-text-primary whitespace-pre-line">
                  {savedStudentParaphrase}
                </p>
              </div>
            ) : null}
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0">
          <div className="space-y-6 md:space-y-8">
            <header className="space-y-3 py-1 text-left md:py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Start here
              </p>
              <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                You now know what the assignment asks. Next, learn the words you
                will need to analyze the texts.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                Step 2 of 2 · Watch a short video, see how each term will help
                later, then check your understanding with a quiz.
              </p>
            </header>

            <div className="rounded-xl border border-border-soft/70 bg-surface-soft/40 px-4 py-4 sm:px-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                What you will do
              </p>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                <li>Watch the short video on rhetoric, ethos, pathos, and logos.</li>
                <li>See how each term will help you analyze King&apos;s speech and letter.</li>
                <li>Take the quiz to check that the words make sense.</li>
              </ol>
            </div>

            <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                Your job right now
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                Learn the vocabulary that will help you talk about King&apos;s
                rhetoric in later modules.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-text-primary">
                You already explained the assignment in your own words. These
                words give you a clearer, shorter way to say the same ideas when
                you analyze the texts.
              </p>
            </div>

            {/* Legacy fallback only — normal path arrives with a saved paraphrase */}
            {!breakdownConfirmed && !hasSavedParaphrase && (
              <div className="space-y-4 rounded-xl border border-theme-blue/30 bg-white/80 px-4 py-5 shadow-soft sm:px-5">
                <h2 className="text-lg font-semibold text-theme-blue">
                  Assignment Breakdown
                </h2>

                {!breakdownSaved ? (
                  <>
                    <label className="block font-medium text-theme-dark">
                      In 1 to 3 sentences, explain what this assignment is asking
                      you to do.
                    </label>
                    <textarea
                      value={assignmentBreakdown}
                      onChange={(e) => setAssignmentBreakdown(e.target.value)}
                      className="mt-2 min-h-[7rem] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-3 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20"
                      rows={4}
                      placeholder="Example: I need to compare and contrast how Dr. King uses ethos, pathos, and logos in his speech and letter, and explain how his choices connect to audience and purpose."
                    />
                    <button
                      onClick={handleSaveBreakdown}
                      disabled={!assignmentBreakdown.trim()}
                      className={`mt-3 px-4 py-2 rounded text-white ${
                        assignmentBreakdown.trim()
                          ? "bg-theme-blue"
                          : "bg-gray-400"
                      }`}
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-theme-muted">Your response:</p>
                    <p className="rounded-lg border border-border-soft/60 bg-surface-soft/50 p-3 text-theme-dark">
                      {assignmentBreakdown}
                    </p>
                    <p className="text-sm font-medium text-theme-dark">
                      Checklist:
                    </p>
                    <ul className="space-y-2">
                      {checklistItems.map((item, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span
                            className={`text-sm font-medium ${
                              item.status === "found"
                                ? "text-theme-green"
                                : "text-theme-muted"
                            }`}
                          >
                            {item.status === "found" ? "✓ Found" : "○ Check this"}
                          </span>
                          <span className="text-theme-dark">{item.label}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap gap-3">
                      <button
                        onClick={handleEditBreakdown}
                        className="rounded bg-gray-200 px-4 py-2 text-theme-dark hover:bg-gray-300"
                      >
                        Edit My Response
                      </button>
                      <button
                        onClick={handleContinueToVideo}
                        className="rounded bg-theme-blue px-4 py-2 text-white hover:opacity-90"
                      >
                        Yes, This Is Clear, Continue
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {breakdownConfirmed && (
              <>
                <section className="space-y-3" aria-labelledby="module-1-video-heading">
                  <h2
                    id="module-1-video-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    1. Watch the video
                  </h2>
                  <p className="text-sm leading-relaxed text-text-muted">
                    This short video introduces rhetoric and the main strategies
                    you will look for in King&apos;s writing.
                  </p>
                  <div ref={videoSectionRef}>
                    <video width="100%" height="315" controls className="rounded-xl">
                      <source
                        src={currentModule.content.videoFile}
                        type="video/mp4"
                      />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </section>

                <section
                  className="space-y-3 rounded-xl border border-border-soft/70 bg-white/80 px-4 py-5 shadow-soft sm:px-5"
                  aria-labelledby="module-1-terms-heading"
                >
                  <h2
                    id="module-1-terms-heading"
                    className="text-lg font-semibold text-text-primary"
                  >
                    2. How you will use these words later
                  </h2>
                  <p className="text-sm leading-relaxed text-text-muted">
                    You do not need to memorize perfect definitions yet. Focus on
                    what each word will help you notice when you analyze the
                    speech and the letter.
                  </p>
                  <ul className="space-y-3">
                    {VOCAB_LATER_USES.map((item) => (
                      <li
                        key={item.term}
                        className="rounded-lg border border-border-soft/60 bg-surface-soft/40 px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-text-primary">
                          {item.term}
                        </p>
                        <p className="mt-1 text-sm leading-relaxed text-text-muted">
                          {item.laterUse}
                        </p>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className="space-y-4" aria-labelledby="module-1-quiz-heading">
                  <div className="space-y-2">
                    <h2
                      id="module-1-quiz-heading"
                      className="text-lg font-semibold text-text-primary"
                    >
                      3. Check your understanding
                    </h2>
                    <p className="text-sm leading-relaxed text-text-muted">
                      Answer each question about the video. This checks that the
                      vocabulary is clear enough to use later.
                    </p>
                  </div>

                  {currentModule.content.quiz.map((q, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-border-soft/70 bg-white/80 px-4 py-4 shadow-soft"
                    >
                      <p className="font-medium text-theme-dark">
                        {index + 1}. {q.question}
                      </p>
                      <select
                        value={userAnswers[index] || ""}
                        onChange={(e) =>
                          handleAnswerChange(index, e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-border-soft p-2"
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
                            isQuizCorrect(index)
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {isQuizCorrect(index) ? "Correct" : "Incorrect"}
                        </p>
                      )}
                    </div>
                  ))}

                  <div className="rounded-xl border border-border-soft/60 bg-surface-soft/40 px-4 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-text-muted">
                      Self-check before you continue
                    </p>
                    <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted">
                      <li>You watched the video (or carefully reviewed it).</li>
                      <li>
                        You can tell how ethos, pathos, and logos will help you
                        analyze the two King texts.
                      </li>
                      <li>Every quiz question has an answer selected.</li>
                    </ul>
                  </div>

                  {!quizSubmitted && (
                    <button
                      onClick={handleSubmitQuiz}
                      className="rounded bg-theme-blue px-4 py-2 text-white"
                    >
                      Submit Quiz
                    </button>
                  )}
                </section>
              </>
            )}
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90">
          <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Precise words help you say big ideas in fewer words. Learn them
                now so later modules feel clearer when you analyze evidence.
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                After this quiz, you move to Module 2 to gather the two King
                source texts you will analyze with these words.
              </p>
            </div>

            <details className="rounded-lg border border-border-soft/60 bg-white/60 px-4 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Why this matters
              </summary>
              <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-muted">
                <p>
                  Academic vocabulary exists because it lets us say complex ideas
                  clearly and precisely. For example, &quot;ethos&quot; quickly
                  communicates credibility and trust.
                </p>
                <p>
                  Your Step 1 paraphrase helped you understand the task. These
                  official words are more accurate and efficient for the analysis
                  ahead.
                </p>
              </div>
            </details>

            <details className="rounded-lg border border-border-soft/60 bg-white/60 px-4 py-2.5">
              <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                Essay assignment (reference)
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
                {prompt}
              </p>
            </details>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}