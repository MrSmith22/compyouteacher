"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";

const questionGroups = [
  {
    title: "Audience & Purpose",
    questions: [
      "What is the audience of the speech? (Use a short phrase, not a full sentence.)",
      "What is the purpose of the speech? (Use a short phrase, not a full sentence.)",
      "What is the audience of the letter? (Use a short phrase, not a full sentence.)",
      "What is the purpose of the letter? (Use a short phrase, not a full sentence.)",
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
  const router = useRouter();
  const { data: session } = useSession();

  const [structureChoice, setStructureChoice] = useState("");
  const [thesis, setThesis] = useState("");
  const [responses, setResponses] = useState(Array(16).fill(""));
  const [customLabels, setCustomLabels] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const savingRef = useRef(false);
  const thesisStepLoggedRef = useRef(false);

  const isPhrase = (txt = "") => txt.trim().split(/\s+/).length <= 6;

  // step 0..4 = question groups, step 5 = thesis planning page
  const [step, setStep] = useState(0);
  const isThesisStep = step === questionGroups.length;

  const currentGroup =
    step < questionGroups.length ? questionGroups[step] : null;

  const groupStartIndex =
    step < questionGroups.length
      ? questionGroups
          .slice(0, step)
          .reduce((sum, g) => sum + g.questions.length, 0)
      : 0;

  // handy shortcuts for earlier work
  const speechAudience = responses[0] || "the speech audience";
  const speechPurpose = responses[1] || "the speech purpose";
  const letterAudience = responses[2] || "the letter audience";
  const letterPurpose = responses[3] || "the letter purpose";

  // Load existing data
  useEffect(() => {
    const fetchExisting = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data, error } = await supabase
        .from("module3_responses")
        .select("responses, thesis, updated_at")
        .eq("user_email", email)
        .single();

      if (!error && data) {
        if (Array.isArray(data.responses)) {
          setResponses(data.responses);
          generateCustomLabels(data.responses);
        }
        if (data.thesis) setThesis(data.thesis);
        if (data.updated_at) setLastSaved(new Date(data.updated_at));
      }

      setLoaded(true);
    };

    if (session?.user?.email) fetchExisting();
  }, [session]);

  // Log when the thesis step is first viewed
  useEffect(() => {
    const email = session?.user?.email;
    if (!email) return;

    if (isThesisStep && !thesisStepLoggedRef.current) {
      thesisStepLoggedRef.current = true;
      logActivity(email, "thesis_step_viewed", {
        module: 3,
        screen: "module3_thesis_step",
      });
    }
  }, [isThesisStep, session?.user?.email]);

  const handleChange = (i, val) => {
    const updated = [...responses];
    updated[groupStartIndex + i] = val;
    setResponses(updated);
  };

  // Dynamic question generation based on audience/purpose phrases
  const generateCustomLabels = (prefill = responses) => {
    const [sa, sp, la, lp] = [
      prefill[0] || "the speech audience",
      prefill[1] || "the speech purpose",
      prefill[2] || "the letter audience",
      prefill[3] || "the letter purpose",
    ];
    setCustomLabels([
      // speech audience
      `In the speech, how does King use Ethos when speaking to ${sa}?`,
      `In the speech, how does King use Pathos when speaking to ${sa}?`,
      `In the speech, how does King use Logos when speaking to ${sa}?`,
      // speech purpose
      `In the speech, how does King use Ethos to support his purpose of ${sp}?`,
      `In the speech, how does King use Pathos to support his purpose of ${sp}?`,
      `In the speech, how does King use Logos to support his purpose of ${sp}?`,
      // letter audience
      `In the letter, how does King use Ethos when speaking to ${la}?`,
      `In the letter, how does King use Pathos when speaking to ${la}?`,
      `In the letter, how does King use Logos when speaking to ${la}?`,
      // letter purpose
      `In the letter, how does King use Ethos to support his purpose of ${lp}?`,
      `In the letter, how does King use Pathos to support his purpose of ${lp}?`,
      `In the letter, how does King use Logos to support his purpose of ${lp}?`,
    ]);
  };

  // Autosave every 20 seconds
  useEffect(() => {
    if (!session?.user?.email || !loaded) return;

    const id = setInterval(async () => {
      if (savingRef.current) return;
      savingRef.current = true;

      const { error } = await supabase
        .from("module3_responses")
        .upsert(
          {
            user_email: session.user.email,
            responses,
            thesis,
            updated_at: new Date().toISOString(),
          },
          { onConflict: ["user_email"] }
        );

      if (error) {
        console.error("autosave error →", error);
      } else {
        setLastSaved(new Date());
      }

      savingRef.current = false;
    }, 20000);

    return () => clearInterval(id);
  }, [responses, thesis, session, loaded]);

  const handleSubmit = async () => {
    const email = session?.user?.email;
    if (!email) {
      alert("You must be signed in to save your responses.");
      return;
    }

    const { error } = await supabase
      .from("module3_responses")
      .upsert(
        {
          user_email: email,
          responses,
          thesis,
          updated_at: new Date().toISOString(),
        },
        { onConflict: ["user_email"] }
      );

    if (error) {
      alert("Something went wrong: " + error.message);
      return;
    }

    try {
      const answeredCount = responses.filter(
        (r) => r && r.trim().length > 0
      ).length;

      await logActivity(email, "thesis_saved", {
        module: 3,
        structureChoice: structureChoice || null,
        responsesAnswered: answeredCount,
        thesisLength: thesis.trim().length,
      });

      await logActivity(email, "module_completed", {
        module: 3,
        source: "module3_submit",
      });
    } catch (err) {
      console.error("Error logging Module 3 completion:", err);
    }

    router.push("/modules/3/success");
  };

  // ---------------- render ----------------

  if (!loaded) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-theme-light rounded shadow">
        <p className="text-sm text-theme-dark/80">Loading your work...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 bg-theme-light rounded shadow">
      {/* header */}
      {!isThesisStep && currentGroup && (
        <div className="rounded-xl border border-theme-blue/30 bg-white p-4 shadow-sm">
          <h2 className="text-2xl font-extrabold text-theme-blue mb-2 text-center">
            {currentGroup.title}
          </h2>

          {step === 0 && (
            <>
              <p className="text-sm text-theme-dark/80 mb-3 text-center">
                First capture your big picture ideas. Use short phrases to name
                the audience and purpose for each text. These four phrases will
                become the base of your whole essay.
              </p>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-theme-green mb-2">
                  🎬 Thesis Statement Walkthrough
                </h3>
                <video
                  width="100%"
                  height="360"
                  controls
                  className="rounded shadow"
                >
                  <source src="/videos/thesis-intro.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </>
          )}

          {step > 0 && (
            <p className="text-sm text-theme-dark/80 text-center">
              Now zoom in on one text at a time. For each rhetorical appeal{" "}
              <span className="font-semibold">
                (Ethos, Pathos, Logos: credibility, emotion, and logic)
              </span>{" "}
              explain how King shapes it for the audience or purpose you already
              named.
            </p>
          )}
        </div>
      )}

      {/* question cards for steps 0–4 */}
      {!isThesisStep &&
        currentGroup &&
        currentGroup.questions.map((q, i) => (
          <div key={i} className="bg-white p-4 rounded shadow mb-4">
            <label className="block font-semibold text-theme-dark mb-1">
              {step > 0 && customLabels
                ? customLabels[groupStartIndex + i - 4]
                : q}
            </label>
            <textarea
              value={responses[groupStartIndex + i]}
              onChange={(e) => handleChange(i, e.target.value)}
              className="w-full border rounded p-2 min-h-[80px]"
            />
            {step === 0 &&
              i < 4 &&
              responses[groupStartIndex + i] &&
              !isPhrase(responses[groupStartIndex + i]) && (
                <p className="text-xs text-theme-red mt-1">
                  Keep it short, just a phrase.
                </p>
              )}
          </div>
        ))}

      {/* thesis structure + writing step */}
      {isThesisStep && (
        <div className="space-y-6">
          {/* recap card */}
          <div className="rounded-xl border border-theme-green/40 bg-white p-4 shadow-sm">
            <h2 className="text-2xl font-extrabold text-theme-green mb-2 text-center">
              Plan and Write Your Thesis
            </h2>
            <p className="text-sm text-theme-dark/80 mb-3">
              Your thesis should grow out of thinking you have already done. Use
              the recap below as a reminder of your ideas about{" "}
              <span className="font-semibold">audience</span>,{" "}
              <span className="font-semibold">purpose</span>, and{" "}
              <span className="font-semibold">
                rhetorical appeals (Ethos, Pathos, Logos)
              </span>{" "}
              in each text.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-theme-blue/40 bg-theme-blue/5 p-3">
                <h3 className="text-sm font-semibold text-theme-blue mb-1">
                  Speech recap
                </h3>
                <p className="text-xs text-theme-dark/80">
                  <span className="font-semibold">Audience: </span>
                  {speechAudience}
                </p>
                <p className="text-xs text-theme-dark/80 mt-1">
                  <span className="font-semibold">Purpose: </span>
                  {speechPurpose}
                </p>
                <p className="text-xs text-theme-dark/60 mt-2">
                  You also explained how King used rhetorical appeals for this
                  crowd in earlier questions.
                </p>
              </div>

              <div className="rounded-lg border border-theme-orange/40 bg-theme-orange/5 p-3">
                <h3 className="text-sm font-semibold text-theme-orange mb-1">
                  Letter recap
                </h3>
                <p className="text-xs text-theme-dark/80">
                  <span className="font-semibold">Audience: </span>
                  {letterAudience}
                </p>
                <p className="text-xs text-theme-dark/80 mt-1">
                  <span className="font-semibold">Purpose: </span>
                  {letterPurpose}
                </p>
                <p className="text-xs text-theme-dark/60 mt-2">
                  You also described how King shapes his rhetorical appeals for
                  this group of readers.
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg bg-theme-light p-3 text-xs text-theme-dark/80 space-y-1">
              <p className="font-semibold">Possible similarities</p>
              <ul className="list-disc list-inside">
                <li>
                  The audiences you named are similar or overlapping in some
                  way.
                </li>
                <li>
                  The purposes you named feel similar, even if the situations
                  are different.
                </li>
                <li>
                  King uses the same rhetorical appeal (Ethos, Pathos, or
                  Logos) in a similar way in both texts.
                </li>
              </ul>
              <p className="font-semibold mt-2">Possible differences</p>
              <ul className="list-disc list-inside">
                <li>
                  The audiences are very different, so King adjusts his appeals
                  in different ways.
                </li>
                <li>
                  The purposes are different, so King leans on different
                  appeals or different tones.
                </li>
                <li>
                  One text uses more Ethos, while the other uses more Pathos or
                  Logos.
                </li>
              </ul>
            </div>
          </div>

          {/* choose structure */}
          <div className="bg-white p-4 rounded shadow space-y-4">
            <h3 className="text-lg font-semibold text-theme-dark">
              Step 1. Choose how your essay will be organized
            </h3>
            <p className="text-sm text-theme-dark/80">
              Pick the pattern that matches the opinion you are starting to
              form. Remember that the word{" "}
              <span className="font-semibold">appeals</span> means{" "}
              <span className="font-semibold">
                rhetorical appeals: Ethos (credibility), Pathos (emotion), and
                Logos (logic and evidence)
              </span>
              .
            </p>

            <div className="space-y-3">
              <label className="block rounded-lg border border-theme-blue/30 bg-theme-blue/5 p-3 cursor-pointer">
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="structure"
                    value="similarities-then-differences"
                    checked={structureChoice === "similarities-then-differences"}
                    onChange={(e) => setStructureChoice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="ml-6">
                  <p className="font-semibold text-sm">
                    Similarities then differences
                  </p>
                  <p className="text-xs text-theme-dark/80">
                    Use this if you think the speech and letter share important
                    things in common in audience, purpose, or rhetorical
                    appeals, but also have clear differences that matter.
                  </p>
                </div>
              </label>

              <label className="block rounded-lg border border-theme-gold/40 bg-theme-gold/5 p-3 cursor-pointer">
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="structure"
                    value="differences-then-similarities"
                    checked={structureChoice === "differences-then-similarities"}
                    onChange={(e) => setStructureChoice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="ml-6">
                  <p className="font-semibold text-sm">
                    Differences then similarities
                  </p>
                  <p className="text-xs text-theme-dark/80">
                    Use this if you want to start by showing how the texts are
                    different in audience, purpose, or appeals, and then show
                    how they still connect or work toward a similar idea.
                  </p>
                </div>
              </label>

              <label className="block rounded-lg border border-theme-green/40 bg-theme-green/5 p-3 cursor-pointer">
                <div className="flex items-start gap-2">
                  <input
                    type="radio"
                    name="structure"
                    value="appeals-organization"
                    checked={structureChoice === "appeals-organization"}
                    onChange={(e) => setStructureChoice(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="ml-6">
                  <p className="font-semibold text-sm">
                    Appeals organization
                  </p>
                  <p className="text-xs text-theme-dark/80">
                    Use this if you want each body paragraph to focus on one
                    rhetorical appeal at a time. For example, one paragraph for
                    Ethos in both texts, one for Pathos, and one for Logos,
                    always linking back to audience and purpose.
                  </p>
                </div>
              </label>
            </div>

            {structureChoice && (
              <div className="mt-4 p-3 bg-theme-light rounded text-sm">
                <p className="font-semibold mb-1">Suggested thesis frame</p>
                {structureChoice === "similarities-then-differences" && (
                  <p>
                    Although both the speech and the letter address{" "}
                    <span className="underline">{speechAudience}</span> and{" "}
                    <span className="underline">{letterAudience}</span> using
                    strong rhetorical appeals, they differ in how they use
                    Ethos, Pathos, and Logos to reach their purposes of{" "}
                    <span className="underline">{speechPurpose}</span> and{" "}
                    <span className="underline">{letterPurpose}</span>.
                  </p>
                )}
                {structureChoice === "differences-then-similarities" && (
                  <p>
                    While the speech and the letter aim at different audiences
                    and purposes, King uses similar rhetorical appeals of Ethos,
                    Pathos, and Logos in both texts to argue for justice and
                    equal rights.
                  </p>
                )}
                {structureChoice === "appeals-organization" && (
                  <p>
                    In both the speech and the letter, King adjusts his
                    rhetorical appeals of Ethos, Pathos, and Logos to fit the
                    audience and purpose of each text, which shapes how readers
                    understand his message about justice.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* thesis box */}
          {structureChoice && (
            <div className="bg-white p-4 rounded shadow space-y-3">
              <h3 className="text-lg font-semibold text-theme-dark">
                Step 2. Write your full thesis
              </h3>
              <p className="text-sm text-theme-dark/80">
                Use the frame above as a helper, but put the thesis in your own
                words. Make sure you mention both texts, connect to audience and
                purpose, and refer to rhetorical appeals{" "}
                <span className="font-semibold">
                  (Ethos, Pathos, Logos)
                </span>
                .
              </p>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                className="w-full border rounded p-2 min-h-[100px]"
              />
            </div>
          )}
        </div>
      )}

      {/* footer / navigation */}
      <div className="flex justify-between items-center mt-4">
        {lastSaved && (
          <span className="text-xs text-gray-500">
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Back
            </button>
          )}

          {!isThesisStep && (
            <button
              onClick={() => {
                if (step === 0) generateCustomLabels();
                setStep(step + 1);
              }}
              disabled={
                step === 0
                  ? currentGroup?.questions.some((_, i) => {
                      const ans = responses[groupStartIndex + i];
                      return !ans || !isPhrase(ans);
                    })
                  : currentGroup?.questions.some(
                      (_, i) => !responses[groupStartIndex + i]
                    )
              }
              className="px-4 py-2 bg-theme-blue text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          )}

          {isThesisStep && (
            <button
              onClick={handleSubmit}
              disabled={!structureChoice || !thesis.trim()}
              className="px-4 py-2 bg-theme-green text-white rounded disabled:opacity-50"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}