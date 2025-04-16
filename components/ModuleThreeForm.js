// JavaScript source code
"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";

const questionGroups = [
  {
    title: "Audience & Purpose",
    questions: [
      "What is the audience of the speech? (Use a phrase, not a full sentence)",
      "What is the purpose of the speech? (Use a phrase, not a full sentence)",
      "What is the audience of the letter? (Use a phrase, not a full sentence)",
      "What is the purpose of the letter? (Use a phrase, not a full sentence)",
    ],
  },
  {
    title: "Speech: Appeals Adapted to Audience",
    questions: ["", "", ""], // will be filled dynamically
  },
  {
    title: "Speech: Appeals Adapted to Purpose",
    questions: ["", "", ""],
  },
  {
    title: "Letter: Appeals Adapted to Audience",
    questions: ["", "", ""],
  },
  {
    title: "Letter: Appeals Adapted to Purpose",
    questions: ["", "", ""],
  },
];

export default function ModuleThreeForm() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState(Array(16).fill(""));
  const [customLabels, setCustomLabels] = useState(null);
  const { data: session } = useSession();

  const currentGroup = questionGroups[step];
  const groupStartIndex = questionGroups
    .slice(0, step)
    .reduce((sum, group) => sum + group.questions.length, 0);

  const handleChange = (i, value) => {
    const updated = [...responses];
    updated[groupStartIndex + i] = value;
    setResponses(updated);
  };

  const generateCustomLabels = () => {
    const speechAudience = responses[0] || "the speech audience";
    const speechPurpose = responses[1] || "the speech's purpose";
    const letterAudience = responses[2] || "the letter audience";
    const letterPurpose = responses[3] || "the letter's purpose";

    const dynamicLabels = [
      // Step 1: Speech - Audience
      `How does King use Ethos when addressing ${speechAudience}?`,
      `How does King use Pathos when addressing ${speechAudience}?`,
      `How does King use Logos when addressing ${speechAudience}?`,

      // Step 2: Speech - Purpose
      `How does King use Ethos to support his purpose of ${speechPurpose}?`,
      `How does King use Pathos to support his purpose of ${speechPurpose}?`,
      `How does King use Logos to support his purpose of ${speechPurpose}?`,

      // Step 3: Letter - Audience
      `How does King use Ethos when addressing ${letterAudience}?`,
      `How does King use Pathos when addressing ${letterAudience}?`,
      `How does King use Logos when addressing ${letterAudience}?`,

      // Step 4: Letter - Purpose
      `How does King use Ethos to support his purpose of ${letterPurpose}?`,
      `How does King use Pathos to support his purpose of ${letterPurpose}?`,
      `How does King use Logos to support his purpose of ${letterPurpose}?`,
    ];

    setCustomLabels(dynamicLabels);
  };

  const handleSubmit = async () => {
    const email = session?.user?.email;

    if (!email) {
      alert("You must be signed in to save your responses.");
      return;
    }

    const { data, error } = await supabase.from("module3_responses").insert({
      user_email: email,
      responses,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Supabase error:", error.message);
      alert("Something went wrong: " + error.message);
    } else {
      alert("Responses saved successfully!");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold">{currentGroup.title}</h2>

      {currentGroup.questions.map((question, i) => (
        <div key={i} className="mb-4">
          <label className="block font-semibold mb-1">
            {step > 0 && customLabels
              ? customLabels[groupStartIndex + i - 4]
              : question}
          </label>

          <textarea
            value={responses[groupStartIndex + i]}
            onChange={(e) => handleChange(i, e.target.value)}
            className="w-full border rounded p-2 min-h-[80px]"
          />
        </div>
      ))}

      {step === questionGroups.length - 1 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Review Your Responses</h3>
          <ul className="space-y-2">
            {responses.map((r, i) => (
              <li key={i} className="text-sm bg-gray-100 p-2 rounded">
                <strong>Q{i + 1}:</strong> {r || <em className="text-red-500">No response</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex justify-between">
        {step > 0 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-4 py-2 bg-gray-300 rounded"
          >
            Back
          </button>
        )}
        {step < questionGroups.length - 1 ? (
          <button
            onClick={() => {
              if (step === 0) generateCustomLabels();
              setStep(step + 1);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded"
            disabled={
              currentGroup.questions.some((_, i) => !responses[groupStartIndex + i])
            }
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            Submit
          </button>
        )}
      </div>
    </div>
  );
}
