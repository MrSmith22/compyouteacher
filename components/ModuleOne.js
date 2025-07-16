"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

const modules = [
  {
    id: 1,
    title: "Module 1: Review of Rhetorical Strategies",
    description:
      "In this module, you will refresh your understanding of ethos, pathos, logos, audience, and purpose so you can analyze how Dr. King applies these elements in his I Have a Dream speech and Letter from Birmingham Jail while developing your essay.",
    content: {
      videoFile: "/videos/Ethos Pathos and Logos Explained.mp4",
      quiz: [
        {
          question: "What is the main purpose of the passage?",
          options: [
            "To explain how to cook eggs in different ways",
            "To teach readers how to improve their public speaking voice",
            "To introduce the concept of rhetoric and its main strategies",
            "To describe Aristotle’s life and achievements"
          ],
          answer: "To introduce the concept of rhetoric and its main strategies",
          explanation: "The passage introduces and defines rhetoric and its key strategies."
        },
        {
          question: "What does the term rhetoric refer to in the passage?",
          options: [
            "The ability to speak loudly and clearly",
            "The art of effective and persuasive writing and speaking",
            "The process of writing fictional stories",
            "The study of ancient Greek literature"
          ],
          answer: "The art of effective and persuasive writing and speaking",
          explanation: "Rhetoric is defined as the art of persuasion through writing and speaking."
        },
        {
          question: "Which of the following best describes ethos?",
          options: [
            "Making the audience laugh to build interest",
            "Appealing to the audience’s emotions",
            "Presenting strong data and facts",
            "Establishing credibility and trustworthiness"
          ],
          answer: "Establishing credibility and trustworthiness",
          explanation: "Ethos relies on the speaker's credibility to persuade the audience."
        },
        {
          question: "What does logos focus on when trying to persuade an audience?",
          options: [
            "Trust and reputation",
            "Humor and sarcasm",
            "Clear evidence and logical reasoning",
            "Feelings and empathy"
          ],
          answer: "Clear evidence and logical reasoning",
          explanation: "Logos appeals to reason and logic with evidence and facts."
        },
        {
          question: "According to the passage, why is pathos often effective in persuasion?",
          options: [
            "It is based on historical facts",
            "It appeals to the audience's trust",
            "It overrides logic and creates urgency through emotion",
            "It shows the speaker’s qualifications"
          ],
          answer: "It overrides logic and creates urgency through emotion",
          explanation: "Pathos uses emotion to influence the audience and create urgency."
        },
        {
          question: "Why might political candidates use fear or anger in their speeches, according to the passage?",
          options: [
            "To avoid logical arguments",
            "To reduce audience attention",
            "To appeal to the audience’s emotions and influence decisions",
            "To seem more trustworthy and experienced"
          ],
          answer: "To appeal to the audience’s emotions and influence decisions",
          explanation: "Fear and anger are emotional appeals to motivate the audience."
        },
        {
          question: "How can someone become better at rhetoric, based on the passage?",
          options: [
            "Memorize every persuasive technique",
            "Focus only on emotional appeals",
            "Avoid learning from others to stay original",
            "Study skilled speakers and writers and practice using rhetorical strategies"
          ],
          answer: "Study skilled speakers and writers and practice using rhetorical strategies",
          explanation: "Improving rhetoric comes from studying and practicing the techniques."
        },
        {
          question: "A chef on a cooking show who wears a professional uniform and describes their years of experience is using which rhetorical strategy?",
          options: ["Pathos", "Logos", "Ethos", "Satire"],
          answer: "Ethos",
          explanation: "The chef establishes credibility and trust (ethos) through experience and appearance."
        },
        {
          question: "A dentist shows patients a study on sugar and tooth decay. This is an example of which rhetorical strategy?",
          options: ["Logos", "Ethos", "Pathos", "Irony"],
          answer: "Logos",
          explanation: "The dentist uses evidence and data (logos) to make the point."
        },
        {
          question: "Which of these is an example of pathos?",
          options: [
            "Explaining how a law works in logical steps",
            "Sharing a touching story about a sick puppy to encourage donations",
            "Listing your degrees and awards in a speech",
            "Quoting historical data to support your point"
          ],
          answer: "Sharing a touching story about a sick puppy to encourage donations",
          explanation: "Pathos appeals to emotion, like sadness, to persuade."
        }
      ]
    },
  },
];

export default function ModuleOne() {
  const [currentModuleIndex] = useState(0);
  const currentModule = modules[currentModuleIndex];

  const [userAnswers, setUserAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAttempt = async () => {
      const { data } = await supabase
        .from("module_scores")
        .select("*")
        .eq("module", currentModule.id)
        .single();

      if (data) {
        setAttempted(true);
      }
    };

    fetchAttempt();
  }, [currentModule.id]);

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmitQuiz = async () => {
    const score = getScore();
    setQuizSubmitted(true);

    if (!attempted) {
      const { error } = await supabase.from("module_scores").insert([
        {
          module: currentModule.id,
          score,
        },
      ]);
      if (!error) setAttempted(true);
    }
  };

  const handleContinue = () => {
  const pct = getScore();
  router.push(`/modules/1/success?score=${pct}`);
};


  const isQuizCorrect = (index) => {
    return (
      userAnswers[index] &&
      userAnswers[index].toLowerCase() ===
        currentModule.content.quiz[index].answer.toLowerCase()
    );
  };

  const getScore = () => {
    const correctCount = currentModule.content.quiz.reduce((acc, q, i) => {
      return acc + (isQuizCorrect(i) ? 1 : 0);
    }, 0);
    return Math.round((correctCount / currentModule.content.quiz.length) * 100);
  };

  if (attempted && !quizSubmitted) {
    return (
      <div className="p-4 bg-theme-light shadow rounded max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-red-600">
          You have already attempted this quiz.
        </h2>
        <p className="mt-2">
          Please contact your teacher if you need an additional attempt.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-theme-light shadow rounded max-w-3xl mx-auto">
      <h2 className="text-3xl font-extrabold text-theme-blue mb-2">
        {currentModule.title}
      </h2>
      <p className="text-theme-muted mb-6">{currentModule.description}</p>

      <div className="mb-6">
        <video width="100%" height="315" controls>
          <source src={currentModule.content.videoFile} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      <div className="mb-4">
        <h3 className="text-2xl font-semibold mb-4 text-theme-green">Quiz</h3>
        {currentModule.content.quiz.map((q, index) => (
          <div key={index} className="mb-4">
            <p className="font-medium mb-2 text-theme-dark">{q.question}</p>
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
              <>
                <p
                  className={`mt-1 text-sm font-semibold ${
                    isQuizCorrect(index) ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isQuizCorrect(index) ? "Correct" : "Incorrect"}
                </p>
                <p className="text-sm text-gray-700 mt-1 italic">
                  Explanation: {q.explanation}
                </p>
              </>
            )}
          </div>
        ))}

        {!quizSubmitted ? (
          <button
            onClick={handleSubmitQuiz}
            className="bg-theme-blue text-white px-4 py-2 rounded"
          >
            Submit Quiz
          </button>
        ) : (
          <button
            onClick={handleContinue}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
