// JavaScript source code
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";

/*──────────────────────────────────────────────────────────*/
/* CONFIG */
/*──────────────────────────────────────────────────────────*/
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

export default function ModuleThreeForm() {
  const router = useRouter();
  const { data: session } = useSession();

  /* helper – a “phrase” = ≤ 6 words */
  const isPhrase = (txt = "") => txt.trim().split(/\s+/).length <= 6;

  /* state */
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState(Array(16).fill(""));
  const [customLabels, setCustomLabels] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const savingRef = useRef(false);

  const currentGroup = questionGroups[step];
  const groupStartIndex = questionGroups
    .slice(0, step)
    .reduce((sum, g) => sum + g.questions.length, 0);

  /*────────────────────────── Prefill */
  useEffect(() => {
    const fetchExisting = async () => {
      const email = session?.user?.email;
      if (!email) return;
      const { data } = await supabase
        .from("module3_responses")
        .select("responses, updated_at")
        .eq("user_email", email)
        .single();
      if (data) {
        setResponses(data.responses);
        generateCustomLabels(data.responses);
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

  /*────────────────────────── Dynamic labels */
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

  /*────────────────────────── Autosave */
  useEffect(() => {
    if (!session?.user?.email) return;
    const id = setInterval(async () => {
      if (savingRef.current) return;
      savingRef.current = true;
      await supabase.from("module3_responses").upsert({
        user_email: session.user.email,
        responses,
        created_at: new Date().toISOString(),
      });
      setLastSaved(new Date());
      savingRef.current = false;
    }, 20000);
    return () => clearInterval(id);
  }, [responses, session]);

  /*────────────────────────── Submit */
  const handleSubmit = async () => {
    const email = session?.user?.email;
    if (!email) {
      alert("You must be signed in to save your responses.");
      return;
    }
    const { error } = await supabase.from("module3_responses").upsert({
      user_email: email,
      responses,
      created_at: new Date().toISOString(),
    });
    if (error) alert(error.message);
    else router.push("/modules/3/success");
  };

  /*────────────────────────── UI */
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

      {currentGroup.questions.map((q, i) => (
        <div key={i} className="mb-4">
          <label className="block font-semibold mb-1">
            {step > 0 && customLabels ? customLabels[groupStartIndex + i - 4] : q}
          </label>
          <textarea
            value={responses[groupStartIndex + i]}
            onChange={(e) => handleChange(i, e.target.value)}
            className="w-full border rounded p-2 min-h-[80px]"
          />
          {step === 0 && i < 4 && responses[groupStartIndex + i] && !isPhrase(responses[groupStartIndex + i]) && (
            <p className="text-xs text-red-600 mt-1">Keep it short—just a phrase.</p>
          )}
        </div>
      ))}

      {step === questionGroups.length - 1 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Review Your Responses</h3>
          <ul className="space-y-2 text-sm">
            {responses.map((r, i) => (
              <li key={i} className="bg-gray-100 p-2 rounded" style={{ wordBreak: "break-word" }}>
                <strong>Q{i + 1}:</strong> {r || <em className="text-red-500">No response</em>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* footer */}
      <div className="flex justify-between items-center mt-4">
        {lastSaved && (
          <span className="text-xs text-gray-500">Saved {lastSaved.toLocaleTimeString()}</span>
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
                  : currentGroup.questions.some(
                      (_, i) => !responses[groupStartIndex + i]
                    )
              }
              className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
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
    </div>
  );
}

