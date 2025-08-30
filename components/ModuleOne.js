"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
            "To describe Aristotle’s life and achievements"
          ],
          answer: "To introduce the concept of rhetoric and its main strategies"
        },
        {
          question: "What does the term rhetoric refer to in the video?",
          options: [
            "The ability to speak loudly and clearly",
            "The art of effective and persuasive writing and speaking",
            "The process of writing fictional stories",
            "The study of ancient Greek literature"
          ],
          answer: "The art of effective and persuasive writing and speaking"
        },
        {
          question: "Which of the following best describes ethos?",
          options: [
            "Making the audience laugh to build interest",
            "Appealing to the audience’s emotions",
            "Presenting strong data and facts",
            "Establishing credibility and trustworthiness"
          ],
          answer: "Establishing credibility and trustworthiness"
        },
        {
          question:
            "A chef on a cooking show who wears a professional uniform and describes their years of experience is using which rhetorical strategy?",
          options: ["Pathos", "Logos", "Ethos", "Satire"],
          answer: "Ethos"
        },
        {
          question: "Which of these is an example of pathos?",
          options: [
            "Explaining how a law works in logical steps",
            "Sharing a touching story about a sick puppy to encourage donations",
            "Listing your degrees and awards in a speech",
            "Quoting historical data to support your point"
          ],
          answer:
            "Sharing a touching story about a sick puppy to encourage donations"
        },
        {
          question: "According to the video, why is pathos often effective in persuasion?",
          options: [
            "It is based on historical facts",
            "It appeals to the audience's trust",
            "It overrides logic and creates urgency through emotion",
            "It shows the speaker’s qualifications"
          ],
          answer: "It overrides logic and creates urgency through emotion"
        },
        {
          question: "What does logos focus on when trying to persuade an audience?",
          options: [
            "Trust and reputation",
            "Humor and sarcasm",
            "Clear evidence and logical reasoning",
            "Feelings and empathy"
          ],
          answer: "Clear evidence and logical reasoning"
        },
        {
          question:
            "A dentist shows patients a study on sugar and tooth decay. This is an example of which rhetorical strategy?",
          options: ["Logos", "Ethos", "Pathos", "Irony"],
          answer: "Logos"
        },
        {
          question:
            "Why might political candidates use fear or anger in their speeches, according to the video?",
          options: [
            "To avoid logical arguments",
            "To reduce audience attention",
            "To appeal to the audience’s emotions and influence decisions",
            "To seem more trustworthy and experienced"
          ],
          answer: "To appeal to the audience’s emotions and influence decisions"
        },
        {
          question: "How can someone become better at rhetoric, based on the video?",
          options: [
            "Memorize every persuasive technique",
            "Focus only on emotional appeals",
            "Avoid learning from others to stay original",
            "Study skilled speakers and writers and practice using rhetorical strategies"
          ],
          answer:
            "Study skilled speakers and writers and practice using rhetorical strategies"
        }
      ]
    }
  }
];

export default function ModuleOne() {
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const currentModule = modules[currentModuleIndex];

  const [userAnswers, setUserAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const router = useRouter();

  const handleAnswerChange = (index, value) => {
    const updatedAnswers = [...userAnswers];
    updatedAnswers[index] = value;
    setUserAnswers(updatedAnswers);
  };

  const handleSubmitQuiz = () => {
    setQuizSubmitted(true);
    setTimeout(() => {
      const pct = getScore();
      router.push(`/modules/1/success?score=${pct}`);
    }, 1000);
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

  return (
    <div className="p-4 bg-theme-light shadow rounded max-w-3xl mx-auto">
      <h2 className="text-3xl font-extrabold text-center text-theme-blue mb-2">
        {currentModule.title}
      </h2>
      <p className="text-center text-theme-muted mb-6">
        {currentModule.description}
      </p>

      {/* Video */}
      <div className="mb-6">
        <video width="100%" height="315" controls>
          <source src={currentModule.content.videoFile} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Quiz */}
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
    </div>
  );
}