"use client";

import { useEffect, useMemo, useState } from "react";
import Panel from "@/components/ui/Panel";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";

function nudge(field, value) {
  const v = (value || "").toLowerCase();

  if (field === "task_verb") {
    if (!v) return "Pick the main action word the teacher wants you to do.";
    if (v.includes("compare") || v.includes("contrast")) return null;
    return "This assignment is compare and contrast. Your verb should reflect that.";
  }

  if (field === "task_type") {
    if (!v) return "Name what you are producing. Example: compare and contrast essay.";
    if (v.includes("essay")) return null;
    return "You are writing an essay, not just answers or a summary.";
  }

  if (field === "analysis_focus") {
    if (!v) return "What are you comparing? Think: King’s rhetoric in the speech and the letter.";
    if (v.includes("speech") && v.includes("letter")) return null;
    return "Include both texts: the speech and the letter.";
  }

  if (field === "required_angle") {
    if (!v) return "What is the lens? Think: ethos, pathos, logos, plus audience and purpose.";
    const hasAppeals = v.includes("ethos") || v.includes("pathos") || v.includes("logos");
    const hasAudiencePurpose = v.includes("audience") || v.includes("purpose");
    if (hasAppeals && hasAudiencePurpose) return null;
    return "Include the lens: rhetorical appeals and how they connect to audience and purpose.";
  }

  if (field === "student_paraphrase") {
    if (!v) return "Write the assignment in your own words in one or two sentences.";
    if (v.length < 35) return "Make it a little more complete. Include both texts and the rhetorical lens.";
    const hasBothTexts = v.includes("speech") && v.includes("letter");
    if (!hasBothTexts) return "Your paraphrase should mention both the speech and the letter.";
    return null;
  }

  return null;
}

export default function ModuleOnePromptPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

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
    return (
      !nudges.taskVerb &&
      !nudges.taskType &&
      !nudges.analysisFocus &&
      !nudges.requiredAngle &&
      !nudges.studentParaphrase &&
      studentParaphrase.trim().length > 0
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
    return <p className="p-6">Loading…</p>;
  }

  if (!session?.user?.email) {
    return <p className="p-6">Please sign in.</p>;
  }

  return (
    <div className="p-4 bg-theme-light shadow rounded max-w-3xl mx-auto">
      <h2 className="text-3xl font-extrabold text-center text-theme-blue mb-2">
        Module 1: Understand the Assignment
      </h2>
      <div className="max-w-3xl mx-auto mb-6 bg-surface-soft border border-border-soft rounded-lg p-4">
        <p className="text-sm font-semibold text-theme-blue">Step 1 of 2</p>
        <p className="text-sm text-text-primary mt-1">
          Before we learn rhetoric, we need to understand what the essay is asking you to do.
        </p>
        <p className="text-sm text-text-muted mt-1">
          You are not being graded on perfection here. This is a quick pre writing check to make sure you understand the task.
        </p>
      </div>

      {/* Welcome panel */}
      <Panel className="mb-6">
        <h3 className="text-xl font-semibold text-theme-dark mb-3">Welcome</h3>
        <div className="text-theme-dark whitespace-pre-line">
          Welcome to The Writing Processor.
          Today you are starting a full essay, step by step. You do not have to do everything at once.

          Before we learn new vocabulary, we need to understand what the assignment is asking you to do. Strong writers do this every time. They pause, read carefully, and translate the prompt into a simple plan.

          You might not know words like ethos, pathos, logos, audience, or purpose yet. That is normal. You will learn them in the video. For now, your job is to understand the direction of the assignment.

          <span className="block font-semibold text-theme-dark mt-4 mb-2">Why vocabulary matters</span>
          Vocabulary helps you say big ideas in fewer words.
          When you do not know the vocabulary yet, you can still describe the ideas, but it usually takes more words and can be less exact.
          That is okay at the beginning. You are building understanding first. Precision comes next.

          <span className="block font-semibold text-theme-dark mt-4 mb-2">What you will do now</span>
          1. Read the essay assignment.
          2. Break it into parts using the questions below.
          3. Write a one to two sentence version in your own words.
        </div>
      </Panel>

      {/* Your Essay Assignment panel */}
      <Panel className="mb-6">
        <h3 className="text-xl font-semibold text-theme-dark mb-2">Your Essay Assignment</h3>
        <p className="text-theme-dark whitespace-pre-line">
          {`Write a compare and contrast essay explaining how Dr. Martin Luther King Jr. uses ethos, pathos, and logos in both “I Have a Dream” and “Letter from Birmingham Jail.”

In your essay, you must:
• Compare how King uses rhetorical appeals in both texts
• Explain how those appeals connect to audience and purpose
• Support your ideas with specific evidence from both works

Your goal is not to summarize what King says, but to explain how and why he says it the way he does.`}
        </p>
      </Panel>

      <div className="space-y-4">
        <div>
          <label className="font-medium text-theme-dark">1) What is the main action word?</label>
          <input
            value={taskVerb}
            onChange={(e) => setTaskVerb(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Example: compare and contrast"
          />
          {nudges.taskVerb && <p className="text-sm text-red-600 mt-1">{nudges.taskVerb}</p>}
        </div>

        <div>
          <label className="font-medium text-theme-dark">2) What are you producing?</label>
          <input
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Example: a compare and contrast essay"
          />
          {nudges.taskType && <p className="text-sm text-red-600 mt-1">{nudges.taskType}</p>}
        </div>

        <div>
          <label className="font-medium text-theme-dark">3) What are you comparing?</label>
          <input
            value={analysisFocus}
            onChange={(e) => setAnalysisFocus(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Example: King’s rhetoric in the speech and the letter"
          />
          {nudges.analysisFocus && <p className="text-sm text-red-600 mt-1">{nudges.analysisFocus}</p>}
        </div>

        <div>
          <label className="font-medium text-theme-dark">4) What lens must you use?</label>
          <input
            value={requiredAngle}
            onChange={(e) => setRequiredAngle(e.target.value)}
            className="border p-2 rounded w-full"
            placeholder="Example: ethos, pathos, logos, plus audience and purpose"
          />
          {nudges.requiredAngle && <p className="text-sm text-red-600 mt-1">{nudges.requiredAngle}</p>}
        </div>

        <div>
          <label className="font-medium text-theme-dark">
            5) In your own words, what is this essay asking you to do?
          </label>
          <textarea
            value={studentParaphrase}
            onChange={(e) => setStudentParaphrase(e.target.value)}
            className="border p-2 rounded w-full"
            rows={4}
            placeholder="Write one or two sentences."
          />
          {nudges.studentParaphrase && (
            <p className="text-sm text-red-600 mt-1">{nudges.studentParaphrase}</p>
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
    </div>
  );
}