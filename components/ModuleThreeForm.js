// JavaScript source code
"use client";

import { useState, useEffect } from "react";
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
    questions: ["", "", ""],
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

  useEffect(() => {
    const fetchResponses = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data, error } = await supabase
        .from("module3_responses")
        .select("responses")
        .eq("user_email", email)
        .single();

      if (data) {
        setResponses(data.responses);
        generateCustomLabelsFromPrefill(data.responses);
      }

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching responses:", error.message);
      }
    };

    fetchResponses();
  }, [session]);

  const handleChange = (i, value) => {
    const updated = [...responses];
    updated[groupStartIndex + i] = value;
    setResponses(updated);
  };

  const generateCustomLabelsFromPrefill = (prefill = responses) => {
    const speechAudience = prefill[0] || "the speech audience";
    const speechPurpose = prefill[1] || "the speech's purpose";
    const letterAudience = prefill[2] || "the letter audience";
    const letterPurpose = prefill[3] || "the letter's purpose";

    const dynamicLabels = [
      `How does King use Ethos when addressing ${speechAudience}?`,
      `How does King use Pathos when addressing ${speechAudience}?`,
      `How does King use Logos when addressing ${speechAudience}?`,

      `How does King use Ethos to support his purpose of ${speechPurpose}?`,
      `How does King use Pathos to support his purpose of ${speechPurpose}?`,
      `How does King use Logos to support his purpose of ${speechPurpose}?`,

      `How does King use Ethos when addressing ${letterAudience}?`,
      `How does King use Pathos when addressing ${letterAudience}?`,
      `How does King use Logos when addressing ${letterAudience}?`,

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

    const { data, error } = await supabase.from("module3_responses").upsert({
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

      {step === 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">🎬 Thesis Statement Walkthrough</h3>
          <video width="100%" height="360" controls>
            <source src="/videos/thesis-intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

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
              if (step === 0) generateCustomLabelsFromPrefill();
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
