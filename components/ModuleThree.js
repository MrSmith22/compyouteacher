"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  { title: "Speech: Appeals Adapted to Audience", questions: ["", "", ""] },
  { title: "Speech: Appeals Adapted to Purpose", questions: ["", "", ""] },
  { title: "Letter: Appeals Adapted to Audience", questions: ["", "", ""] },
  { title: "Letter: Appeals Adapted to Purpose", questions: ["", "", ""] },
];

export default function ModuleThree() {
  const router = useRouter();
  const { data: session } = useSession();

  const [structureChoice, setStructureChoice] = useState("");
  const [thesis, setThesis] = useState("");

  const isPhrase = (txt = "") => txt.trim().split(/\s+/).length <= 6;

  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState(Array(16).fill(""));
  const [customLabels, setCustomLabels] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const savingRef = useRef(false);

  const currentGroup = questionGroups[step];
  const groupStartIndex = questionGroups.slice(0, step).reduce((sum, g) => sum + g.questions.length, 0);

  useEffect(() => {
    const fetchExisting = async () => {
      const email = session?.user?.email;
      if (!email) return;
      const { data } = await supabase
        .from("module3_responses")
        .select("responses, thesis, updated_at")
        .eq("user_email", email)
        .single();

      if (data) {
        setResponses(data.responses);
        generateCustomLabels(data.responses);
        if (data.thesis) setThesis(data.thesis);
        if (data.updated_at) setLastSaved(new Date(data.updated_at));
      }
    };
    fetchExisting();
  }, [session]);

  const handleChange = (i, val) => {
    const updated = [...responses];
    updated[groupStartIndex + i] = val;
    setResponses(updated);
  };

  const generateCustomLabels = (prefill = responses) => {
    const [sa, sp, la, lp] = [
      prefill[0] || "the speech audience",
      prefill[1] || "the speech's purpose",
      prefill[2] || "the letter audience",
      prefill[3] || "the letter's purpose",
    ];
    setCustomLabels([
      `How does King use Ethos when addressing ${sa}?`,
      `How does King use Pathos when addressing ${sa}?`,
      `How does King use Logos when addressing ${sa}?`,
      `How does King use Ethos to support his purpose of ${sp}?`,
      `How does King use Pathos to support his purpose of ${sp}?`,
      `How does King use Logos to support his purpose of ${sp}?`,
      `How does King use Ethos when addressing ${la}?`,
      `How does King use Pathos when addressing ${la}?`,
      `How does King use Logos when addressing ${la}?`,
      `How does King use Ethos to support his purpose of ${lp}?`,
      `How does King use Pathos to support his purpose of ${lp}?`,
      `How does King use Logos to support his purpose of ${lp}?`,
    ]);
  };

  useEffect(() => {
    if (!session?.user?.email) return;
    const id = setInterval(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      await supabase.from("module3_responses").upsert({
        user_email: session.user.email,
        responses,
        thesis,
        created_at: new Date().toISOString(),
      });
      setLastSaved(new Date());
      savingRef.current = false;
    }, 20000);
    return () => clearInterval(id);
  }, [responses, thesis, session]);

  const handleSubmit = async () => {
    const email = session?.user?.email;
    if (!email) {
      alert("You must be signed in to save your responses.");
      return;
    }

    const { error } = await supabase.from("module3_responses").upsert({
      user_email: email,
      responses,
      thesis,
      created_at: new Date().toISOString(),
    });

    if (error) {
      alert("Something went wrong: " + error.message);
    } else {
      router.push("/modules/3/success");
    }
  };

  const guidanceText = () => {
    switch (structureChoice) {
      case "similarities-then-differences":
        return "Start your thesis by noting one or more similarities between the speech and the letter based on your observations, then point out a key difference supported by specific examples from your notes.";
      case "differences-then-similarities":
        return "Focus your thesis on a major difference you found, then show how they also share some similarities — draw directly from your ethos, pathos, logos, audience, and purpose observations.";
      case "appeals-organization":
        return "Use your ethos, pathos, and logos observations to describe how King organizes his appeals differently in the speech and letter to address his audience and purpose.";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 bg-theme-light rounded shadow">
      <h2 className="text-3xl font-extrabold text-theme-green text-center">
        {currentGroup.title}
      </h2>

      {step === 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-theme-blue mb-2">
            🎬 Thesis Statement Walkthrough
          </h3>
          <video width="100%" height="360" controls className="rounded shadow">
            <source src="/videos/thesis-intro.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      )}

      {currentGroup.questions.map((q, i) => (
        <div key={i} className="bg-white p-4 rounded shadow mb-4">
          <label className="block font-semibold text-theme-dark mb-1">
            {step > 0 && customLabels ? customLabels[groupStartIndex + i - 4] : q}
          </label>
          <textarea
            value={responses[groupStartIndex + i]}
            onChange={(e) => handleChange(i, e.target.value)}
            className="w-full border rounded p-2 min-h-[80px]"
          />
          {step === 0 && i < 4 && responses[groupStartIndex + i] && !isPhrase(responses[groupStartIndex + i]) && (
            <p className="text-xs text-theme-red mt-1">Keep it short — just a phrase.</p>
          )}
        </div>
      ))}

      {step === questionGroups.length - 1 && (
        <div className="mt-6 bg-white p-4 rounded shadow space-y-6">
          <h3 className="text-lg font-semibold text-theme-dark mb-4">📌 Write Your Thesis Statement</h3>

          <div className="space-y-2">
            <label className="block font-semibold text-theme-dark mb-1">Choose your structure:</label>
            <div className="space-y-1">
              {["similarities-then-differences", "differences-then-similarities", "appeals-organization"].map((val) => (
                <label className="block" key={val}>
                  <input
                    type="radio"
                    name="structure"
                    value={val}
                    checked={structureChoice === val}
                    onChange={(e) => setStructureChoice(e.target.value)}
                  />
                  <span className="ml-2 capitalize">{val.replace(/-/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>

          {structureChoice && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <p className="font-semibold mb-1">Suggested Thesis Template:</p>
              {structureChoice === "similarities-then-differences" && (
                <p>Although both works ___, they differ in ___ because ___.</p>
              )}
              {structureChoice === "differences-then-similarities" && (
                <p>While ___ differs between the two works, both share ___ through ___.</p>
              )}
              {structureChoice === "appeals-organization" && (
                <p>Dr. King uses ethos, pathos, and logos differently to address ___ in each text.</p>
              )}

              <div className="mt-3 p-2 bg-white rounded shadow">
                <p className="text-sm text-theme-dark">
                  <strong>Guidance:</strong> {guidanceText()}
                </p>
              </div>
            </div>
          )}

          {structureChoice && (
            <div className="mt-4">
              <label className="block font-semibold text-theme-dark mb-1">Your full thesis:</label>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                className="w-full border rounded p-2 min-h-[80px]"
              />
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        {lastSaved && (
          <span className="text-xs text-gray-500">Saved {lastSaved.toLocaleTimeString()}</span>
        )}
        <div className="ml-auto flex gap-2">
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} className="px-4 py-2 bg-gray-300 rounded">
              Back
            </button>
          )}
          {step < questionGroups.length - 1 ? (
            <button
              onClick={() => {
                if (step === 0) generateCustomLabels();
                setStep(step + 1);
              }}
              disabled={
                step === 0
                  ? currentGroup.questions.some((_, i) => {
                      const ans = responses[groupStartIndex + i];
                      return !ans || !isPhrase(ans);
                    })
                  : currentGroup.questions.some((_, i) => !responses[groupStartIndex + i])
              }
              className="px-4 py-2 bg-theme-blue text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-theme-green text-white rounded"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
