"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ModulePageShell from "@/components/layout/ModulePageShell";
import WorkspaceCenter from "@/components/layout/WorkspaceCenter";
import WorkspaceColumns from "@/components/layout/WorkspaceColumns";
import WorkspaceGuide from "@/components/layout/WorkspaceGuide";
import WorkspaceSidebar from "@/components/layout/WorkspaceSidebar";
import { mlkAssignmentDefinition } from "@/lib/assignments";
import { logActivity } from "@/lib/logActivity";

const MODULE1_NEED_HELP_ID = "module-1-need-help";

const PROMPT_MC = {
  task_verb: {
    label: "1) What are the main action word(s) in this assignment?",
    choices: ["Summarize", "Persuade", "Compare and contrast", "Describe"],
    correct: "Compare and contrast",
    emptyNudge: "Pick the main action word(s) the assignment asks you to do.",
    wrongNudge: "This assignment is compare and contrast. Your action word(s) should reflect that.",
  },
  task_type: {
    label: "2) What are you producing?",
    choices: [
      "A poem",
      "A compare and contrast essay",
      "A speech",
      "A book report",
    ],
    correct: "A compare and contrast essay",
    emptyNudge: "Name what you are producing. Example: compare and contrast essay.",
    wrongNudge: "You are writing an essay, not just answers or a summary.",
  },
  analysis_focus: {
    label: "3) What are you comparing?",
    choices: [
      "Martin Luther King Jr. and Malcolm X",
      "Two historical events",
      "How Dr. King uses rhetorical appeals in two texts",
      "The civil rights movement and World War II",
    ],
    correct: "How Dr. King uses rhetorical appeals in two texts",
    emptyNudge: "What are you comparing? Think: King’s rhetoric in the speech and the letter.",
    wrongNudge: "Include both texts: the speech and the letter.",
  },
  required_angle: {
    label: "4) What evidence should you use?",
    choices: [
      "Personal opinions only",
      "Information from social media",
      "Specific evidence from both works",
      "Information from any source you choose",
    ],
    correct: "Specific evidence from both works",
    emptyNudge: "What evidence should you use? Read the assignment carefully.",
    wrongNudge: "Your essay must use specific evidence from both King texts.",
  },
};

/** Question 5: open-ended paraphrase — length only, no keyword matching. */
const PARAPHRASE_MIN_LENGTH = 25;

function nudge(field, value) {
  const mc = PROMPT_MC[field];
  if (mc) {
    const v = (value || "").trim();
    if (!v) return mc.emptyNudge;
    if (v === mc.correct) return null;
    if (field === "task_verb" && (v.includes("compare") || v.includes("contrast"))) {
      return null;
    }
    if (field === "task_type" && v.toLowerCase().includes("essay")) return null;
    if (
      field === "analysis_focus" &&
      v.toLowerCase().includes("speech") &&
      v.toLowerCase().includes("letter")
    ) {
      return null;
    }
    return mc.wrongNudge;
  }

  if (field === "student_paraphrase") {
    const trimmed = (value || "").trim();
    if (!trimmed) {
      return "Write the assignment in your own words in one or two sentences.";
    }
    if (trimmed.length < PARAPHRASE_MIN_LENGTH) {
      return `Add a little more detail (at least ${PARAPHRASE_MIN_LENGTH} characters).`;
    }
    return null;
  }

  return null;
}

function MultipleChoice({ name, value, choices, onChange }) {
  return (
    <div className="space-y-2 mt-1">
      {choices.map((choice) => (
        <label
          key={choice}
          className="flex items-start gap-2 cursor-pointer text-theme-dark"
        >
          <input
            type="radio"
            name={name}
            value={choice}
            checked={value === choice}
            onChange={(e) => onChange(e.target.value)}
            className="mt-1"
          />
          <span>{choice}</span>
        </label>
      ))}
    </div>
  );
}

function scrollToNeedHelp(event) {
  event.preventDefault();
  const el = document.getElementById(MODULE1_NEED_HELP_ID);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
  const firstDetails = el.querySelector("details");
  if (firstDetails && !firstDetails.open) {
    firstDetails.open = true;
  }
}

function NeedHelpJumpLink() {
  return (
    <a
      href={`#${MODULE1_NEED_HELP_ID}`}
      onClick={scrollToNeedHelp}
      className="inline-flex items-center gap-2 rounded-lg border-2 border-theme-orange/40 bg-theme-orange/10 px-3.5 py-2 text-sm font-semibold text-theme-orange shadow-soft transition hover:bg-theme-orange/15 focus:outline-none focus:ring-2 focus:ring-theme-orange/30"
    >
      Need Help
      <span className="text-xs font-medium text-theme-orange/80">
        ↓ assignment & tips
      </span>
    </a>
  );
}

export default function ModuleOnePromptPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { prompt } = mlkAssignmentDefinition;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [taskVerb, setTaskVerb] = useState("");
  const [taskType, setTaskType] = useState("");
  const [analysisFocus, setAnalysisFocus] = useState("");
  const [requiredAngle, setRequiredAngle] = useState("");
  const [studentParaphrase, setStudentParaphrase] = useState("");

  const nudges = useMemo(() => {
    return {
      taskVerb: nudge("task_verb", taskVerb),
      taskType: nudge("task_type", taskType),
      analysisFocus: nudge("analysis_focus", analysisFocus),
      requiredAngle: nudge("required_angle", requiredAngle),
      studentParaphrase: nudge("student_paraphrase", studentParaphrase),
    };
  }, [taskVerb, taskType, analysisFocus, requiredAngle, studentParaphrase]);

  const canContinue = useMemo(() => {
    const paraphrase = studentParaphrase.trim();
    return (
      !nudges.taskVerb &&
      !nudges.taskType &&
      !nudges.analysisFocus &&
      !nudges.requiredAngle &&
      paraphrase.length >= PARAPHRASE_MIN_LENGTH
    );
  }, [nudges, studentParaphrase]);

  useEffect(() => {
    async function load() {
      if (!session?.user?.email) return;

      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/module1/prompt");
        const data = await res.json();

        if (!res.ok) {
          setError(data?.error || "Could not load your saved work.");
          setLoading(false);
          return;
        }

        if (data) {
          setTaskVerb(data.task_verb || "");
          setTaskType(data.task_type || "");
          setAnalysisFocus(data.analysis_focus || "");
          setRequiredAngle(data.required_angle || "");
          setStudentParaphrase(data.student_paraphrase || "");
        }
      } catch (e) {
        setError("Could not load your saved work.");
      } finally {
        setLoading(false);
      }
    }

    if (status === "authenticated") load();
  }, [session, status]);

  const handleSave = async () => {
    if (!session?.user?.email) return;

    setSaving(true);
    setError(null);

    try {
      const res = await fetch("/api/module1/prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_verb: taskVerb,
          task_type: taskType,
          analysis_focus: analysisFocus,
          required_angle: requiredAngle,
          student_paraphrase: studentParaphrase,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Could not save your work.");
        setSaving(false);
        return;
      }

      try {
        await logActivity(session.user.email, "module1_prompt_saved", {
          module: 1,
        });
      } catch {}

      router.push("/modules/1");
    } catch (e) {
      setError("Could not save your work.");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <ModulePageShell>
        <p className="p-2 text-text-muted">Loading your assignment…</p>
      </ModulePageShell>
    );
  }

  if (!session?.user?.email) {
    return (
      <ModulePageShell>
        <p className="p-2 text-text-muted">Please sign in.</p>
      </ModulePageShell>
    );
  }

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
                Step 1 of 2 · Break down the prompt
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                Next: video and vocabulary quiz
              </p>
            </div>
          </aside>
        </WorkspaceSidebar>

        <WorkspaceCenter className="min-w-0">
          <div className="space-y-6 md:space-y-8">
            <header className="space-y-3 py-1 text-left md:py-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-text-muted">
                Start here
              </p>
              <h1 className="max-w-4xl text-[1.85rem] font-bold leading-[1.1] tracking-tight text-text-primary md:text-[2.5rem] md:leading-[1.08]">
                Break down what this essay is asking you to do.
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-text-muted md:text-base">
                This is a quick pre-writing check, not a graded quiz.
              </p>
              <div className="pt-1">
                <NeedHelpJumpLink />
              </div>
            </header>

            <div className="rounded-xl border-2 border-theme-orange/40 bg-theme-orange/10 px-5 py-5 shadow-soft ring-1 ring-theme-orange/15">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange">
                Your job right now
              </p>
              <p className="mt-2 text-base font-semibold leading-snug text-text-primary">
                Read the assignment under Need Help, then answer the five
                questions.
              </p>
              <ol className="mt-4 list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-text-primary md:text-base">
                <li>
                  Open{" "}
                  <span className="inline-flex items-center rounded-md border border-theme-orange/30 bg-theme-orange/10 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-theme-orange">
                    Need Help · Assignment
                  </span>{" "}
                  and read the essay prompt.
                </li>
                <li>Answer questions 1–4 about what the assignment asks.</li>
                <li>Write the assignment in your own words (question 5).</li>
              </ol>
              <p className="mt-4 text-sm font-medium leading-relaxed text-text-primary">
                Start with question 1 below.
              </p>
            </div>

            <div className="space-y-5 rounded-xl border border-border-soft/70 bg-white/80 px-4 py-5 shadow-soft sm:px-5">
              <div>
                <label className="font-medium text-theme-dark">
                  {PROMPT_MC.task_verb.label}
                </label>
                <MultipleChoice
                  name="taskVerb"
                  value={taskVerb}
                  choices={PROMPT_MC.task_verb.choices}
                  onChange={setTaskVerb}
                />
                {nudges.taskVerb && (
                  <p className="text-sm text-red-600 mt-1">{nudges.taskVerb}</p>
                )}
              </div>

              <div>
                <label className="font-medium text-theme-dark">
                  {PROMPT_MC.task_type.label}
                </label>
                <MultipleChoice
                  name="taskType"
                  value={taskType}
                  choices={PROMPT_MC.task_type.choices}
                  onChange={setTaskType}
                />
                {nudges.taskType && (
                  <p className="text-sm text-red-600 mt-1">{nudges.taskType}</p>
                )}
              </div>

              <div>
                <label className="font-medium text-theme-dark">
                  {PROMPT_MC.analysis_focus.label}
                </label>
                <MultipleChoice
                  name="analysisFocus"
                  value={analysisFocus}
                  choices={PROMPT_MC.analysis_focus.choices}
                  onChange={setAnalysisFocus}
                />
                {nudges.analysisFocus && (
                  <p className="text-sm text-red-600 mt-1">
                    {nudges.analysisFocus}
                  </p>
                )}
              </div>

              <div>
                <label className="font-medium text-theme-dark">
                  {PROMPT_MC.required_angle.label}
                </label>
                <MultipleChoice
                  name="requiredAngle"
                  value={requiredAngle}
                  choices={PROMPT_MC.required_angle.choices}
                  onChange={setRequiredAngle}
                />
                {nudges.requiredAngle && (
                  <p className="text-sm text-red-600 mt-1">
                    {nudges.requiredAngle}
                  </p>
                )}
              </div>

              <div>
                <label className="font-medium text-theme-dark">
                  5) In your own words, what is this essay asking you to do?
                </label>
                <p className="text-sm text-theme-dark/70 mt-1">
                  Write one or two sentences in your own words. There is no
                  single right phrasing—describe what you think the essay is
                  asking you to do. You might mention the texts, rhetorical
                  appeals, or audience and purpose if that helps you explain
                  your thinking.
                </p>
                <textarea
                  value={studentParaphrase}
                  onChange={(e) => setStudentParaphrase(e.target.value)}
                  className="mt-2 min-h-[7rem] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-3 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20"
                  rows={4}
                  placeholder="Write one or two sentences."
                />
                {nudges.studentParaphrase && (
                  <p className="text-sm text-red-600 mt-1">
                    {nudges.studentParaphrase}
                  </p>
                )}
              </div>

              {error && <p className="text-red-600 font-semibold">{error}</p>}

              <button
                onClick={handleSave}
                disabled={!canContinue || saving}
                className={`px-4 py-2 rounded text-white ${
                  !canContinue || saving ? "bg-gray-400" : "bg-theme-blue"
                }`}
              >
                {saving ? "Saving…" : "Save and Continue to the Video and Quiz"}
              </button>
            </div>

            <section
              id={MODULE1_NEED_HELP_ID}
              className="scroll-mt-24 space-y-4 rounded-xl border-2 border-theme-orange/25 bg-theme-orange/[0.04] px-4 py-5 md:px-5"
              aria-labelledby="module-1-need-help-heading"
            >
              <div className="space-y-1 text-left">
                <p
                  id="module-1-need-help-heading"
                  className="text-[11px] font-semibold uppercase tracking-[0.2em] text-theme-orange"
                >
                  Need Help
                </p>
                <p className="text-sm leading-relaxed text-text-muted">
                  The assignment and coaching live here. Use them when you need
                  them—then keep answering above.
                </p>
              </div>

              <details
                className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5"
                open
              >
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Your essay assignment
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-text-muted whitespace-pre-line">
                  {prompt}
                </p>
              </details>

              <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Why this matters
                </summary>
                <div className="mt-2 space-y-2 text-sm leading-relaxed text-text-muted">
                  <p>
                    Welcome to The Writing Processor. Today you are starting a
                    full essay, step by step. You do not have to do everything
                    at once.
                  </p>
                  <p>
                    Strong writers pause, read carefully, and translate the
                    prompt into a simple plan before they learn new vocabulary.
                    Words like ethos, pathos, and logos come next in the video.
                    For now, focus on the direction of the assignment.
                  </p>
                  <p>
                    Vocabulary helps you say big ideas in fewer words. At the
                    beginning, understanding comes first. Precision comes next.
                  </p>
                </div>
              </details>

              <details className="rounded-lg border border-border-soft/60 bg-white/70 px-4 py-2.5">
                <summary className="cursor-pointer list-none text-xs font-medium text-text-muted">
                  Self-check before you continue
                </summary>
                <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-text-muted marker:text-text-muted/60">
                  <li>You can name the main action the assignment asks for.</li>
                  <li>You know what kind of writing you are producing.</li>
                  <li>
                    Your paraphrase says the task in your own words in one or
                    two sentences.
                  </li>
                </ul>
              </details>
            </section>
          </div>
        </WorkspaceCenter>

        <WorkspaceGuide className="opacity-90">
          <aside className="space-y-5 rounded-xl bg-surface-soft/70 px-5 py-5 text-left">
            <div className="space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                From your teacher
              </p>
              <p className="text-sm leading-relaxed text-text-primary">
                Do not try to write the essay yet. Just make sure you understand
                what the assignment is asking. Clear understanding now saves
                confusion later.
              </p>
            </div>

            <div className="space-y-2 border-t border-border-soft/60 pt-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-text-muted">
                What comes next
              </p>
              <p className="text-sm leading-relaxed text-text-muted">
                After you save, you will watch a short video and check key
                vocabulary words you will need for the rest of the essay.
              </p>
            </div>
          </aside>
        </WorkspaceGuide>
      </WorkspaceColumns>
    </ModulePageShell>
  );
}