"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import { getTChartEntries } from "@/lib/supabase/helpers/tchartEntries";
import { parseModule2Observation } from "@/lib/parseModule2Observation";

const APPEAL_CATEGORIES = ["ethos", "pathos", "logos"];

const appealGroups = [
  {
    title: "Speech: Appeals Adapted to Audience",
    sourceType: "speech",
    showTchart: true,
  },
  {
    title: "Speech: Appeals Adapted to Purpose",
    sourceType: "speech",
    showTchart: true,
  },
  {
    title: "Letter: Appeals Adapted to Audience",
    sourceType: "letter",
    showTchart: true,
  },
  {
    title: "Letter: Appeals Adapted to Purpose",
    sourceType: "letter",
    showTchart: true,
  },
];

const guidedFields = [
  {
    title: "Speech — Audience",
    responseIndex: 0,
    label:
      "Who is Dr. King primarily addressing in the I Have a Dream speech?",
    hint: "Use a short phrase only (about six words or fewer), not a full sentence.",
  },
  {
    title: "Letter — Audience",
    responseIndex: 2,
    label: "Who is the Letter from Birmingham Jail mainly written for?",
    hint: "Short phrase only (about six words or fewer).",
  },
  {
    title: "Speech — Purpose",
    responseIndex: 1,
    label: "What is King trying to accomplish in the speech?",
    hint: "Short phrase only (about six words or fewer).",
  },
  {
    title: "Letter — Purpose",
    responseIndex: 3,
    label: "What is King trying to accomplish in the letter?",
    hint: "Short phrase only (about six words or fewer).",
  },
];

const WELCOME_STEP = 0;
const GUIDED_START = 1;
const GUIDED_END = 4;
const APPEAL_STEP_START = 5;
const THESIS_STEP = APPEAL_STEP_START + appealGroups.length;

function normalizeResponses(arr) {
  const next = Array.isArray(arr) ? [...arr] : [];
  while (next.length < 16) next.push("");
  return next.slice(0, 16);
}

function buildTchartLookup(rows) {
  const map = {};
  for (const row of rows || []) {
    if (!APPEAL_CATEGORIES.includes(row.category)) continue;
    const key = `${row.category}-${row.type}`;
    map[key] = row;
  }
  return map;
}

function TChartScaffoldCard({ category, sourceType, row }) {
  const parsed = parseModule2Observation(row?.observation);
  const quote = (row?.quote || "").trim();
  const hasBody =
    quote ||
    parsed.main ||
    parsed.audience ||
    parsed.purpose ||
    (row?.observation || "").trim();

  if (!hasBody) {
    return (
      <div className="rounded-lg border border-dashed border-theme-blue/30 bg-theme-light/90 p-3 text-left text-xs text-theme-dark/75">
        No saved Module 2 note for this appeal yet. You can still answer here,
        or go back to Module 2 to add a quote and observation.
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-theme-blue/25 bg-theme-blue/5 p-3 text-left text-xs space-y-2 text-theme-dark/90">
      <p className="font-semibold text-theme-blue capitalize">
        Module 2 · {category} · {sourceType}
      </p>
      {quote ? (
        <p>
          <span className="font-semibold text-theme-dark">Quote: </span>
          <span className="italic">&ldquo;{quote}&rdquo;</span>
        </p>
      ) : null}
      {parsed.main ? (
        <p>
          <span className="font-semibold text-theme-dark">Your explanation: </span>
          {parsed.main}
        </p>
      ) : row?.observation?.trim() && !quote ? (
        <p>
          <span className="font-semibold text-theme-dark">Your note: </span>
          {row.observation.trim()}
        </p>
      ) : null}
      {parsed.audience ? (
        <p>
          <span className="font-semibold text-theme-dark">Audience effect: </span>
          {parsed.audience}
        </p>
      ) : null}
      {parsed.purpose ? (
        <p>
          <span className="font-semibold text-theme-dark">Purpose connection: </span>
          {parsed.purpose}
        </p>
      ) : null}
    </div>
  );
}

export default function ModuleThreeForm() {
  const router = useRouter();
  const { data: session } = useSession();

  const [structureChoice, setStructureChoice] = useState("");
  const [thesis, setThesis] = useState("");
  const [responses, setResponses] = useState(() => normalizeResponses([]));
  const [customLabels, setCustomLabels] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [tchartRows, setTchartRows] = useState([]);
  const savingRef = useRef(false);
  const thesisStepLoggedRef = useRef(false);

  const isPhrase = (txt = "") => txt.trim().split(/\s+/).length <= 6;

  const [step, setStep] = useState(WELCOME_STEP);
  const isWelcomeStep = step === WELCOME_STEP;
  const isGuidedStep = step >= GUIDED_START && step <= GUIDED_END;
  const isAppealStep = step >= APPEAL_STEP_START && step < THESIS_STEP;
  const isThesisStep = step === THESIS_STEP;

  const appealStepIndex = isAppealStep ? step - APPEAL_STEP_START : -1;
  const currentAppealGroup =
    isAppealStep && appealGroups[appealStepIndex]
      ? appealGroups[appealStepIndex]
      : null;

  const groupStartIndex =
    isAppealStep && currentAppealGroup
      ? 4 + appealStepIndex * 3
      : isGuidedStep
        ? guidedFields[step - GUIDED_START].responseIndex
        : 0;

  const tchartLookup = useMemo(
    () => buildTchartLookup(tchartRows),
    [tchartRows]
  );

  const speechAudience = responses[0] || "the speech audience";
  const speechPurpose = responses[1] || "the speech purpose";
  const letterAudience = responses[2] || "the letter audience";
  const letterPurpose = responses[3] || "the letter purpose";

  const generateCustomLabels = useCallback((prefill) => {
    const r = normalizeResponses(prefill);
    const [sa, sp, la, lp] = [
      r[0] || "the speech audience",
      r[1] || "the speech purpose",
      r[2] || "the letter audience",
      r[3] || "the letter purpose",
    ];
    setCustomLabels([
      `In the speech, how does King use Ethos when speaking to ${sa}?`,
      `In the speech, how does King use Pathos when speaking to ${sa}?`,
      `In the speech, how does King use Logos when speaking to ${sa}?`,
      `In the speech, how does King use Ethos to support his purpose of ${sp}?`,
      `In the speech, how does King use Pathos to support his purpose of ${sp}?`,
      `In the speech, how does King use Logos to support his purpose of ${sp}?`,
      `In the letter, how does King use Ethos when speaking to ${la}?`,
      `In the letter, how does King use Pathos when speaking to ${la}?`,
      `In the letter, how does King use Logos when speaking to ${la}?`,
      `In the letter, how does King use Ethos to support his purpose of ${lp}?`,
      `In the letter, how does King use Pathos to support his purpose of ${lp}?`,
      `In the letter, how does King use Logos to support his purpose of ${lp}?`,
    ]);
  }, []);

  useEffect(() => {
    const fetchExisting = async () => {
      const email = session?.user?.email;
      if (!email) {
        setLoaded(true);
        return;
      }

      const [{ data: m3, error: m3Error }, tchartResult] = await Promise.all([
        supabase
          .from("module3_responses")
          .select("responses, thesis, updated_at, structure_choice")
          .eq("user_email", email)
          .maybeSingle(),
        getTChartEntries({ userEmail: email }),
      ]);

      if (tchartResult?.data) {
        setTchartRows(tchartResult.data);
      }

      if (!m3Error && m3) {
        if (Array.isArray(m3.responses)) {
          const norm = normalizeResponses(m3.responses);
          setResponses(norm);
          generateCustomLabels(norm);
        }
        if (m3.thesis) setThesis(m3.thesis);
        if (m3.structure_choice != null && m3.structure_choice !== "") {
          setStructureChoice(m3.structure_choice);
        }
        if (m3.updated_at) setLastSaved(new Date(m3.updated_at));
      }

      setLoaded(true);
    };

    fetchExisting();
  }, [session?.user?.email, generateCustomLabels]);

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

  const handleChangeAtIndex = (idx, val) => {
    const updated = [...responses];
    updated[idx] = val;
    setResponses(updated);
  };

  const handleAppealChange = (i, val) => {
    const idx = groupStartIndex + i;
    handleChangeAtIndex(idx, val);
  };

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
            structure_choice: structureChoice || null,
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
  }, [responses, thesis, structureChoice, session, loaded]);

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
          structure_choice: structureChoice || null,
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

  const canGoNext = () => {
    if (isWelcomeStep) return true;
    if (isGuidedStep) {
      const field = guidedFields[step - GUIDED_START];
      const ans = responses[field.responseIndex];
      return ans && isPhrase(ans);
    }
    if (isAppealStep && currentAppealGroup) {
      for (let i = 0; i < 3; i++) {
        if (!responses[groupStartIndex + i]?.trim()) return false;
      }
      return true;
    }
    return false;
  };

  const goNext = () => {
    if (step === GUIDED_END) {
      setResponses((prev) => {
        generateCustomLabels(prev);
        return prev;
      });
    }
    setStep((s) => s + 1);
  };

  const goBack = () => setStep(step - 1);

  if (!loaded) {
    return (
      <div className="max-w-3xl mx-auto p-6 bg-theme-light rounded shadow">
        <p className="text-sm text-theme-dark/80 text-left">
          Loading your work...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 bg-theme-light rounded shadow">
      {/* Welcome */}
      {isWelcomeStep && (
        <div className="rounded-xl border border-theme-blue/30 bg-white p-4 shadow-sm space-y-4 text-left">
          <h2 className="text-2xl font-extrabold text-theme-blue">
            Welcome to Module 3
          </h2>
          <p className="text-sm text-theme-dark/85 leading-relaxed">
            In Module 2 you collected trustworthy texts and recorded{" "}
            <span className="font-semibold">Ethos</span>,{" "}
            <span className="font-semibold">Pathos</span>, and{" "}
            <span className="font-semibold">Logos</span> with quotes. In this
            module you will name each text&apos;s{" "}
            <span className="font-semibold">audience</span> and{" "}
            <span className="font-semibold">purpose</span>, explain how King&apos;s
            appeals reach that audience and serve that purpose, and draft a{" "}
            <span className="font-semibold">comparative thesis</span>. Your Module
            2 notes will appear beside the connection questions so you are not
            working from memory alone.
          </p>
          <div>
            <h3 className="text-sm font-semibold text-theme-green mb-2">
              Thesis statement walkthrough (optional)
            </h3>
            <video width="100%" height="360" controls className="rounded shadow">
              <source src="/videos/thesis-intro.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}

      {/* Guided audience / purpose — one field per step */}
      {isGuidedStep && (
        <div className="rounded-xl border border-theme-blue/30 bg-white p-4 shadow-sm space-y-3 text-left">
          <h2 className="text-2xl font-extrabold text-theme-blue">
            {guidedFields[step - GUIDED_START].title}
          </h2>
          <p className="text-sm text-theme-dark/85 leading-relaxed">
            Take this one piece at a time. A clear phrase here will anchor the
            rest of your essay.
          </p>
          <p className="text-xs text-theme-dark/70">
            Tip: Picture who would be in the room or who would open the letter.
            Then name that group in plain language.
          </p>
        </div>
      )}

      {isGuidedStep && (
        <div className="bg-white p-4 rounded shadow space-y-2 text-left">
          <label className="block font-semibold text-theme-dark">
            {guidedFields[step - GUIDED_START].label}
          </label>
          <p className="text-xs text-theme-dark/75">
            {guidedFields[step - GUIDED_START].hint}
          </p>
          <textarea
            value={responses[guidedFields[step - GUIDED_START].responseIndex]}
            onChange={(e) =>
              handleChangeAtIndex(
                guidedFields[step - GUIDED_START].responseIndex,
                e.target.value
              )
            }
            className="w-full border rounded p-2 min-h-[80px]"
          />
          {responses[guidedFields[step - GUIDED_START].responseIndex] &&
            !isPhrase(
              responses[guidedFields[step - GUIDED_START].responseIndex]
            ) && (
              <p className="text-xs text-theme-red">
                Keep it short—just a phrase (about six words or fewer).
              </p>
            )}
        </div>
      )}

      {/* Appeal groups with Module 2 scaffold */}
      {isAppealStep && currentAppealGroup && (
        <div className="rounded-xl border border-theme-blue/30 bg-white p-4 shadow-sm space-y-3 text-left">
          <h2 className="text-2xl font-extrabold text-theme-blue">
            {currentAppealGroup.title}
          </h2>
          <p className="text-sm text-theme-dark/85 leading-relaxed">
            Below each prompt you&apos;ll see what you saved in Module 2 for that
            appeal. Use it as evidence while you explain how King shapes{" "}
            <span className="font-semibold">Ethos</span>,{" "}
            <span className="font-semibold">Pathos</span>, and{" "}
            <span className="font-semibold">Logos</span> for the audience or
            purpose you named earlier.
          </p>
        </div>
      )}

      {isAppealStep &&
        currentAppealGroup &&
        APPEAL_CATEGORIES.map((cat, i) => {
          const labelIdx = groupStartIndex + i - 4;
          const prompt =
            customLabels && customLabels[labelIdx] != null
              ? customLabels[labelIdx]
              : "";
          const row = tchartLookup[`${cat}-${currentAppealGroup.sourceType}`];

          return (
            <div key={`${cat}-${i}`} className="bg-white p-4 rounded shadow space-y-3">
              {currentAppealGroup.showTchart ? (
                <TChartScaffoldCard
                  category={cat}
                  sourceType={currentAppealGroup.sourceType}
                  row={row}
                />
              ) : null}
              <div className="text-left">
                <label className="block font-semibold text-theme-dark mb-1">
                  {prompt}
                </label>
                <textarea
                  value={responses[groupStartIndex + i]}
                  onChange={(e) => handleAppealChange(i, e.target.value)}
                  className="w-full border rounded p-2 min-h-[80px]"
                />
              </div>
            </div>
          );
        })}

      {/* Thesis */}
      {isThesisStep && (
        <div className="space-y-6">
          <div className="rounded-xl border border-theme-green/40 bg-white p-4 shadow-sm text-left">
            <h2 className="text-2xl font-extrabold text-theme-green mb-2">
              Plan and Write Your Thesis
            </h2>
            <p className="text-sm text-theme-dark/80 mb-3 leading-relaxed">
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

            <div className="mt-3 rounded-lg bg-theme-light p-3 text-xs text-theme-dark/80 space-y-1 text-left">
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

          <div className="bg-white p-4 rounded shadow space-y-4 text-left">
            <h3 className="text-lg font-semibold text-theme-dark">
              Step 1. Choose how your essay will be organized
            </h3>
            <p className="text-sm text-theme-dark/80 leading-relaxed">
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
              <label className="flex gap-3 rounded-lg border border-theme-blue/30 bg-theme-blue/5 p-3 cursor-pointer text-left">
                <input
                  type="radio"
                  name="structure"
                  value="similarities-then-differences"
                  checked={structureChoice === "similarities-then-differences"}
                  onChange={(e) => setStructureChoice(e.target.value)}
                  className="mt-1 shrink-0"
                />
                <span>
                  <span className="font-semibold text-sm block">
                    Similarities then differences
                  </span>
                  <span className="text-xs text-theme-dark/80">
                    Use this if you think the speech and letter share important
                    things in common in audience, purpose, or rhetorical
                    appeals, but also have clear differences that matter.
                  </span>
                </span>
              </label>

              <label className="flex gap-3 rounded-lg border border-theme-gold/40 bg-theme-gold/5 p-3 cursor-pointer text-left">
                <input
                  type="radio"
                  name="structure"
                  value="differences-then-similarities"
                  checked={structureChoice === "differences-then-similarities"}
                  onChange={(e) => setStructureChoice(e.target.value)}
                  className="mt-1 shrink-0"
                />
                <span>
                  <span className="font-semibold text-sm block">
                    Differences then similarities
                  </span>
                  <span className="text-xs text-theme-dark/80">
                    Use this if you want to start by showing how the texts are
                    different in audience, purpose, or appeals, and then show
                    how they still connect or work toward a similar idea.
                  </span>
                </span>
              </label>

              <label className="flex gap-3 rounded-lg border border-theme-green/40 bg-theme-green/5 p-3 cursor-pointer text-left">
                <input
                  type="radio"
                  name="structure"
                  value="appeals-organization"
                  checked={structureChoice === "appeals-organization"}
                  onChange={(e) => setStructureChoice(e.target.value)}
                  className="mt-1 shrink-0"
                />
                <span>
                  <span className="font-semibold text-sm block">
                    Appeals organization
                  </span>
                  <span className="text-xs text-theme-dark/80">
                    Use this if you want each body paragraph to focus on one
                    rhetorical appeal at a time. For example, one paragraph for
                    Ethos in both texts, one for Pathos, and one for Logos,
                    always linking back to audience and purpose.
                  </span>
                </span>
              </label>
            </div>

            {structureChoice && (
              <div className="mt-4 p-3 bg-theme-light rounded text-sm text-left">
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

          {structureChoice && (
            <div className="bg-white p-4 rounded shadow space-y-3 text-left">
              <h3 className="text-lg font-semibold text-theme-dark">
                Step 2. Write your full thesis
              </h3>
              <p className="text-sm text-theme-dark/80 leading-relaxed">
                Use the frame above as a helper, but put the thesis in your own
                words. Make sure you mention both texts, connect to audience and
                purpose, and refer to rhetorical appeals{" "}
                <span className="font-semibold">(Ethos, Pathos, Logos)</span>.
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

      <div className="flex justify-between items-center mt-4">
        {lastSaved && (
          <span className="text-xs text-gray-500">
            Saved {lastSaved.toLocaleTimeString()}
          </span>
        )}
        <div className="ml-auto flex gap-2">
          {step > WELCOME_STEP && (
            <button
              type="button"
              onClick={goBack}
              className="px-4 py-2 bg-gray-300 rounded"
            >
              Back
            </button>
          )}

          {!isThesisStep && (
            <button
              type="button"
              onClick={goNext}
              disabled={!canGoNext()}
              className="px-4 py-2 bg-theme-blue text-white rounded disabled:opacity-50"
            >
              Next
            </button>
          )}

          {isThesisStep && (
            <button
              type="button"
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
