// components/ModuleSeven.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useMemo } from "react";
import { useSession } from "next-auth/react";
import { MLK_ASSIGNMENT_NAME, mlkRhetoricalAnalysisAssignment } from "@/lib/assignments";
import { requireModuleAccess } from "@/lib/supabase/helpers/moduleGate";
import {
  getModule6DraftRow,
  getModule7DraftRow,
  getOutlineRow,
  getParagraphPlanRow,
  getTChartEntriesRows,
} from "@/lib/artifacts/readArtifactsClient";
import { upsertModule7DraftArtifact } from "@/lib/artifacts/writeArtifacts";
import { parseApiResponse } from "@/lib/api/clientFetch";
import ModuleSixStepFrame from "@/components/module6/ModuleSixStepFrame";
import ModulePageShell from "@/components/layout/ModulePageShell";
import { WorkingSetSection } from "@/components/module3/ModuleThreeDeskFrame";
import ModuleSevenReferenceShelf from "@/components/module7/ModuleSevenReferenceShelf";
import ModuleSevenReadAloud from "@/components/module7/ModuleSevenReadAloud";
import ModuleSevenReadAloudTaskCard from "@/components/module7/ModuleSevenReadAloudTaskCard";
import ModuleSevenReadAloudObservation from "@/components/module7/ModuleSevenReadAloudObservation";
import ModuleSevenReadAloudSecondaryTeaching from "@/components/module7/ModuleSevenReadAloudSecondaryTeaching";
import ModuleSevenStrategyCard from "@/components/module7/ModuleSevenStrategyCard";
import EssayProseView from "@/components/module7/EssayProseView";
import {
  alignSectionsToOutline,
  getSectionCountFromOutline,
  joinSections,
  splitDraftIntoSections,
} from "@/components/module7/module7DraftSections";
import {
  buildDraftSectionSteps,
  getWritingSectionLabel,
} from "@/components/module6/module6StepPresentation";
import { getModule7StepPresentation, MODULE7_STEP_TYPES } from "@/components/module7/module7StepPresentation";
import {
  MODULE7_LAYOUT_CONTRACT,
} from "@/lib/module7/module7RevisionStrategy";
import {
  emptyReadAloudObservation,
  evaluateReadAloudAdvanceGate,
} from "@/lib/module7/module7ReadAloudObservation";
import { logActivity } from "../lib/logActivity";

const READ_ALOUD_STEP = { id: "read-aloud", type: MODULE7_STEP_TYPES.READ_ALOUD };
const FINAL_REVIEW_STEP = {
  id: "final-review",
  type: MODULE7_STEP_TYPES.FINAL_REVIEW,
};

const FULL_DRAFT_READ_CLASS =
  "max-h-[min(480px,60vh)] overflow-y-auto rounded-xl border-2 border-theme-dark/15 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft";

const READ_ALOUD_ESSAY_CLASS =
  "max-h-[min(180px,28vh)] overflow-y-auto rounded-xl border-2 border-theme-dark/15 bg-white px-4 py-3 text-base leading-7 text-text-primary shadow-soft md:max-h-[min(240px,30vh)]";

const REVISION_TEXTAREA_CLASS =
  "min-h-[min(320px,48vh)] w-full resize-y rounded-xl border-2 border-theme-dark/20 bg-white px-4 py-4 text-base leading-7 text-text-primary shadow-soft focus:border-theme-blue/50 focus:outline-none focus:ring-2 focus:ring-theme-blue/20 disabled:cursor-not-allowed disabled:opacity-60";

const ACTION_BUTTON_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-theme-dark";

function pickAudioFormat() {
  const candidates = [
    { mime: "audio/webm;codecs=opus", ext: "webm" },
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },
    { mime: "audio/aac", ext: "m4a" },
  ];
  for (const c of candidates) {
    if (
      typeof MediaRecorder !== "undefined" &&
      MediaRecorder.isTypeSupported?.(c.mime)
    ) {
      return c;
    }
  }
  return { mime: "", ext: "webm" };
}

export default function ModuleSeven() {
  const { data: session } = useSession();
  const router = useRouter();

  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(true);
  const [outlineMissing, setOutlineMissing] = useState(false);

  const [observations, setObservations] = useState([]);
  const [paragraphPlans, setParagraphPlans] = useState([]);
  const [proofPlan, setProofPlan] = useState([]);
  const [thesisText, setThesisText] = useState("");

  const [sections, setSections] = useState([]);
  const [locked, setLocked] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gateBlocked, setGateBlocked] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [readAloudObservation, setReadAloudObservation] = useState(
    emptyReadAloudObservation
  );
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [amp, setAmp] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const hasLoggedStartRef = useRef(false);
  // Dev-only: once Unlock to Test is used, ignore late load results that would
  // re-apply final_ready locking (common with overlapping fetches in development).
  const devUnlockedForTestingRef = useRef(false);
  const [revisionNotice, setRevisionNotice] = useState(null);

  const email = session?.user?.email ?? null;
  const showDevUnlock = process.env.NODE_ENV === "development";
  const assignmentQuestion = mlkRhetoricalAnalysisAssignment.essentialQuestion;

  const sectionSteps = useMemo(
    () => (outline ? buildDraftSectionSteps(outline) : []),
    [outline]
  );

  const totalSteps = sectionSteps.length + 2;
  const isReadAloudStep = currentStepIndex === 0;
  const isFinalReviewStep = currentStepIndex === sectionSteps.length + 1;
  const currentRevisionStep =
    isReadAloudStep || isFinalReviewStep
      ? null
      : sectionSteps[currentStepIndex - 1] ?? null;
  const presentationStep = isReadAloudStep
    ? READ_ALOUD_STEP
    : isFinalReviewStep
      ? FINAL_REVIEW_STEP
      : currentRevisionStep;
  const presentation = useMemo(
    () => getModule7StepPresentation(presentationStep, outline),
    [presentationStep, outline]
  );

  const fullText = useMemo(() => joinSections(sections), [sections]);

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : fullText;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return {
      wordCount: words,
      charCount: raw.length,
    };
  };

  const loadSectionsFromModule6 = async (sectionCount) => {
    const result = await getModule6DraftRow();
    if (!result.ok) {
      console.error("Module 6 fetch error:", result.error);
      return Array(Math.max(sectionCount, 1)).fill("");
    }

    if (Array.isArray(result.data?.sections) && result.data.sections.length) {
      return alignSectionsToOutline(result.data.sections, sectionCount);
    }

    return splitDraftIntoSections(result.data?.full_text ?? "", sectionCount);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      if (!email) return;

      setGateBlocked(false);
      setOutlineLoading(true);
      setOutlineMissing(false);

      const { ok: gateOk } = await requireModuleAccess({
        userEmail: email,
        assignmentName: MLK_ASSIGNMENT_NAME,
        minModule: 7,
      });

      if (cancelled) return;

      if (!gateOk) {
        setGateBlocked(true);
        setOutlineLoading(false);
        return;
      }

      const outlineResult = await getOutlineRow(5);

      if (cancelled) return;

      if (!outlineResult.ok) {
        console.error("Error loading outline for Module 7:", outlineResult.error);
      }

      const outlineRow = outlineResult.data;
      const hasOutline = !!outlineRow?.outline;
      const sectionCount = getSectionCountFromOutline(outlineRow?.outline);

      setOutline(outlineRow?.outline ?? null);
      setThesisText(String(outlineRow?.outline?.thesis || "").trim());
      setOutlineMissing(!hasOutline);
      setOutlineLoading(false);

      if (!hasOutline) {
        return;
      }

      const [m7Result, obsResult, planResult] = await Promise.all([
        getModule7DraftRow(),
        getTChartEntriesRows(),
        getParagraphPlanRow(),
      ]);

      if (cancelled) return;

      if (!obsResult.ok) {
        console.error("Error loading observations for Module 7:", obsResult.error);
      }
      setObservations(obsResult.data || []);

      if (planResult.ok && Array.isArray(planResult.data?.buckets)) {
        setParagraphPlans(planResult.data.buckets);
      }

      try {
        const thesisRes = await fetch("/api/module3/thesis");
        const thesisJson = await parseApiResponse(thesisRes);
        if (cancelled) return;
        const thesisRow = thesisJson?.thesis ?? null;
        if (thesisRow) {
          if (!String(outlineRow?.outline?.thesis || "").trim() && thesisRow.thesis) {
            setThesisText(String(thesisRow.thesis).trim());
          }
          if (Array.isArray(thesisRow.proofPlan)) {
            setProofPlan(
              thesisRow.proofPlan.map((line) => String(line || "").trim()).filter(Boolean)
            );
          }
        }
      } catch (err) {
        console.error("Error loading thesis for Module 7 reference shelf:", err);
      }

      if (cancelled) return;

      if (!m7Result.ok) {
        console.error("Module 7 fetch error:", m7Result.error);
      }

      const m7Data = m7Result.data;
      let initialSections;

      if (m7Data?.full_text) {
        initialSections = splitDraftIntoSections(m7Data.full_text, sectionCount);
        // WP-070: do not re-lock after Unlock to Test (stale/overlapping loads).
        if (!devUnlockedForTestingRef.current) {
          setLocked(m7Data.final_ready === true);
        }
      } else {
        initialSections = await loadSectionsFromModule6(sectionCount);
        if (cancelled) return;
        if (!devUnlockedForTestingRef.current) {
          setLocked(false);
        }
      }

      setSections(initialSections);

      let publicUrl = null;
      try {
        const res = await fetch("/api/readaloud?module=7");
        const json = await res.json().catch(() => ({}));
        if (res.ok && json?.ok) {
          publicUrl = json.publicUrl ?? null;
        }
      } catch {
        // ignore network errors
      }

      if (cancelled) return;

      setAudioURL(publicUrl);

      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        const metrics = getTextMetrics(joinSections(initialSections));
        logActivity(email, "module_started", {
          module: 7,
          from_module6: !m7Data?.full_text,
          has_audio: !!publicUrl,
          ...metrics,
        });
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function loadDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {}
      const list = await navigator.mediaDevices.enumerateDevices();
      const inputs = list.filter((d) => d.kind === "audioinput");
      setDevices(inputs);
      const saved = localStorage.getItem("chosenMicId") || "";
      setSelectedDeviceId(saved || inputs[0]?.deviceId || "");
    }
    loadDevices();
    navigator.mediaDevices?.addEventListener?.("devicechange", loadDevices);
    return () =>
      navigator.mediaDevices?.removeEventListener?.("devicechange", loadDevices);
  }, []);

  useEffect(() => {
    if (sectionSteps.length === 0) return;
    const maxIndex = sectionSteps.length;
    if (currentStepIndex > maxIndex) {
      setCurrentStepIndex(maxIndex);
    }
  }, [sectionSteps.length, currentStepIndex]);

  function stopMeter() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  }

  function startMeter(stream) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = new Ctx();
    audioCtxRef.current = ctx;
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    analyserRef.current = analyser;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    function tick() {
      analyser.getByteTimeDomainData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += Math.abs(dataArray[i] - 128);
      }
      const amplitude = sum / dataArray.length;
      setAmp(Number(amplitude.toFixed(1)));
      rafRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  async function getBlobDurationSeconds(blob) {
    const url = URL.createObjectURL(blob);
    try {
      const audio = new Audio(url);

      const duration = await new Promise((resolve, reject) => {
        const t = setTimeout(() => reject(new Error("duration timeout")), 4000);

        audio.addEventListener(
          "loadedmetadata",
          () => {
            clearTimeout(t);
            resolve(audio.duration);
          },
          { once: true }
        );

        audio.addEventListener(
          "error",
          () => {
            clearTimeout(t);
            reject(new Error("audio load failed"));
          },
          { once: true }
        );
      });

      if (typeof duration !== "number" || !Number.isFinite(duration)) return null;

      const seconds = Math.round(duration);
      return Math.max(1, seconds);
    } catch {
      return null;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const startRecording = async () => {
    if (!email) {
      alert("Sign in to record a read-aloud and save your revision.");
      return;
    }
    if (audioURL) {
      const confirmOverwrite = confirm(
        "You already recorded a read-aloud. Record again and replace it?"
      );
      if (!confirmOverwrite) return;
      setReadAloudObservation(emptyReadAloudObservation());
    }

    try {
      const audioConstraints = selectedDeviceId
        ? {
            deviceId: { exact: selectedDeviceId },
            echoCancellation: true,
            noiseSuppression: true,
          }
        : { echoCancellation: true, noiseSuppression: true };

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      startMeter(stream);

      const chosen = pickAudioFormat();
      const mr = new MediaRecorder(
        stream,
        chosen.mime ? { mimeType: chosen.mime } : undefined
      );
      mediaRecorderRef.current = mr;
      audioChunksRef.current = [];

      mr.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mr.onstop = async () => {
        stopMeter();

        const blob = new Blob(audioChunksRef.current, {
          type: chosen.mime || "audio/*",
        });

        const localUrl = URL.createObjectURL(blob);
        setAudioURL(localUrl);
        setReadAloudObservation(emptyReadAloudObservation());

        const durationSeconds = await getBlobDurationSeconds(blob);

        try {
          const file = new File([blob], `readaloud.${chosen.ext}`, {
            type: chosen.mime || "audio/*",
          });

          const form = new FormData();
          form.append("file", file);
          form.append("module", "7");
          if (durationSeconds !== null) {
            form.append("durationSeconds", String(durationSeconds));
          }

          const res = await fetch("/api/readaloud", {
            method: "POST",
            body: form,
          });

          const json = await res.json().catch(() => ({}));

          if (!res.ok || !json?.ok) {
            console.error("Read aloud upload failed:", json?.error || res.statusText);
            alert("We couldn't save your recording. Try recording again.");

            logActivity(email, "recording_failed", {
              module: 7,
              error: json?.error || res.statusText || "Upload failed",
            });

            return;
          }

          const publicUrl = json.publicUrl || null;

          if (publicUrl) {
            setAudioURL(publicUrl);
          }

          logActivity(email, "recording_saved", {
            module: 7,
            publicUrl,
          });
        } catch (err) {
          console.error("Read aloud upload error:", err);
          alert("We couldn't save your recording. Try recording again.");

          logActivity(email, "recording_failed", {
            module: 7,
            error: String(err?.message || err),
          });
        } finally {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      mr.start();
      setRecording(true);

      logActivity(email, "recording_started", {
        module: 7,
        device_id: selectedDeviceId || null,
      });
    } catch (err) {
      console.error("Could not start recording:", err);
      alert(
        "Your browser needs microphone access so you can record a read-aloud. Allow the microphone and try again."
      );
      logActivity(email, "recording_failed", {
        module: 7,
        error: String(err?.message || err),
      });
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (mr && mr.state !== "inactive") mr.stop();
    setRecording(false);
  };

  const updateSection = (index, value) => {
    if (locked) return;
    setSections((prev) => {
      const copy = [...prev];
      copy[index] = value;
      return copy;
    });
  };

  const restoreModule6Draft = async () => {
    const confirmed = confirm(
      "This will replace your current revision with the draft you completed in Module 6. Your current revision will be lost.\n\nDo you want to continue?"
    );
    if (!confirmed) return;

    const sectionCount = getSectionCountFromOutline(outline);
    const nextSections = await loadSectionsFromModule6(sectionCount);
    setSections(nextSections);
    const metrics = getTextMetrics(joinSections(nextSections));
    if (email) {
      logActivity(email, "draft_reloaded_from_module6", { module: 7, ...metrics });
    }
  };

  const unlockForTesting = () => {
    if (!showDevUnlock) return;
    // Dev-only session unlock: restore pre-finalization editing without changing
    // production finalize behavior. Persisted final_ready is cleared on Save.
    devUnlockedForTestingRef.current = true;
    setLocked(false);
    setRevisionNotice({
      type: "success",
      message:
        "Testing unlock active. Revision fields are editable again. Save revision to keep your changes.",
    });
    // Read Aloud is prose-only; move to the first drafting field immediately.
    setCurrentStepIndex((index) => (index === 0 ? 1 : index));
  };

  const saveDraft = async ({ finalized = false } = {}) => {
    if (!email) {
      alert("Sign in to save your revision and continue.");
      return;
    }

    const text = joinSections(sections);

    const result = await upsertModule7DraftArtifact({
      userEmail: email,
      full_text: text,
      final_text: finalized ? text : null,
      revised: !finalized,
      final_ready: finalized,
    });

    if (!result.ok) {
      console.error("Save error:", result.error);
      setRevisionNotice({
        type: "error",
        message: "We couldn't save your revision. Please try again.",
      });
      return;
    }

    const metrics = getTextMetrics(text);
    const meta = {
      module: 7,
      has_audio: !!(audioURL && audioURL.startsWith("http")),
      ...metrics,
    };

    if (finalized) {
      devUnlockedForTestingRef.current = false;
      setLocked(true);
      setRevisionNotice(null);
      await logActivity(email, "module_completed", meta);
      router.push("/modules/7/success");
    } else {
      await logActivity(email, "revision_saved", meta);
      setRevisionNotice({
        type: "success",
        message:
          "Your revision is saved. Keep improving your draft, or finish revising when you're ready.",
      });
    }
  };

  const goBack = () => {
    setCurrentStepIndex((index) => Math.max(0, index - 1));
  };

  const goNext = () => {
    if (isReadAloudStep) {
      const gate = evaluateReadAloudAdvanceGate({
        audioURL,
        observation: readAloudObservation,
      });
      if (!gate.ok) {
        setRevisionNotice({
          type: "error",
          message: gate.message,
        });
        return;
      }
    }
    setRevisionNotice(null);
    setCurrentStepIndex((index) =>
      Math.min(sectionSteps.length + 1, index + 1)
    );
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="w-full max-w-md space-y-3 rounded-xl border border-border-soft bg-white p-6 shadow-lg">
          <h1 className="text-2xl font-semibold text-theme-blue">Please sign in</h1>
          <p className="text-sm text-text-primary">
            Sign in to revise your draft and save your work.
          </p>
          <Link
            className="inline-block rounded-md bg-theme-blue px-4 py-2 text-sm font-semibold text-white"
            href="/api/auth/signin"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  if (gateBlocked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="max-w-md space-y-4 px-4 text-center">
          <p className="text-text-primary">
            Finish Module 6 before you begin revising here.
          </p>
          <p className="text-sm text-text-muted">
            Complete your first draft in Module 6, then return here to strengthen it.
          </p>
          <a
            href="/modules/6"
            className="inline-block rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
          >
            Go to Module 6
          </a>
        </div>
      </div>
    );
  }

  if (outlineLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <p className="text-text-primary">Loading your draft and reference materials…</p>
      </div>
    );
  }

  if (outlineMissing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-base">
        <div className="max-w-md space-y-4 px-4 text-center">
          <p className="text-text-primary">
            We could not find your outline from Module 5 yet.
          </p>
          <p className="text-sm text-text-muted">
            Finish organizing your paragraph plans into an outline in Module 5,
            then return here to revise your draft.
          </p>
          <a
            href="/modules/5"
            className="inline-block rounded-lg bg-theme-blue px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105"
          >
            Go to Module 5
          </a>
        </div>
      </div>
    );
  }

  if (!outline || sectionSteps.length === 0) {
    return null;
  }

  const draftIndex = currentRevisionStep?.draftIndex ?? 0;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = isFinalReviewStep;
  const sectionLabel = currentRevisionStep
    ? getWritingSectionLabel(currentRevisionStep)
    : "";
  const sectionIsEmpty = !String(sections[draftIndex] || "").trim();
  const stepKind = isReadAloudStep
    ? "Read aloud"
    : isFinalReviewStep
      ? "Final review"
      : "Revise";

  const readAloudGate = evaluateReadAloudAdvanceGate({
    audioURL,
    observation: readAloudObservation,
  });
  const readAloudReady = readAloudGate.ok;
  const canKeepGoing = !isReadAloudStep || readAloudReady;

  const referenceShelf = (
    <ModuleSevenReferenceShelf
      assignmentQuestion={assignmentQuestion}
      thesis={thesisText}
      proofPlan={proofPlan}
      outline={outline}
      paragraphPlans={paragraphPlans}
      observations={observations}
      sectionSteps={sectionSteps}
      sections={sections}
      activeStep={isReadAloudStep || isFinalReviewStep ? null : currentRevisionStep}
      highlightWholeDraft={isReadAloudStep || isFinalReviewStep}
    />
  );

  return (
    <ModulePageShell>
      <div
        className="overflow-x-hidden"
        data-wp020-layout={MODULE7_LAYOUT_CONTRACT.viewports.join("-")}
        data-wp020-read-aloud={isReadAloudStep ? "task-first" : "section"}
      >
      <ModuleSixStepFrame
        question={presentation.question}
        whyMatters={isReadAloudStep ? [] : presentation.whyMatters}
        successLooksLike={isReadAloudStep ? [] : presentation.successLooksLike}
        coachingMessage={presentation.coachingMessage}
        nextStepText={presentation.nextStepText}
        sidebar={referenceShelf}
        hideSupporting={isReadAloudStep}
      >
        {!isReadAloudStep ? (
          <div className="rounded-lg bg-surface-soft/30 px-3 py-2 text-left">
            <p className="text-[11px] leading-relaxed text-text-muted">
              Module 7 · {stepKind} · step {currentStepIndex + 1} of {totalSteps}
              {isFinalReviewStep ? "" : ". Same essay—one section at a time."}
            </p>
            <p className="text-[11px] leading-relaxed text-text-muted/80">
              {presentation.strengthFrame ||
                "Your draft is complete. Now you are making it stronger."}
            </p>
          </div>
        ) : (
          <div className="rounded-lg bg-surface-soft/30 px-3 py-2 text-left">
            <p className="text-[11px] leading-relaxed text-text-muted">
              Module 7 · Read aloud · step 1 of {totalSteps}
            </p>
          </div>
        )}

        {isReadAloudStep ? (
          <div
            className="space-y-5 text-left"
            data-testid="module7-read-aloud-primary"
          >
            <ModuleSevenReadAloudTaskCard />

            <WorkingSetSection
              className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
              label={presentation.workingSetLabel}
              description={presentation.workingSetDescription}
            >
              <div
                className={READ_ALOUD_ESSAY_CLASS}
                data-testid="module7-current-essay"
              >
                <EssayProseView
                  sectionSteps={sectionSteps}
                  sections={sections}
                  emptyFallback={
                    <p className="text-sm leading-relaxed text-text-muted">
                      Your draft from Module 6 will appear here. Return to Module 6 if
                      you need to finish your first draft.
                    </p>
                  }
                />
              </div>
            </WorkingSetSection>

            <ModuleSevenReadAloud
              prominent
              recording={recording}
              audioURL={audioURL}
              devices={devices}
              selectedDeviceId={selectedDeviceId}
              amp={amp}
              locked={locked}
              checklist={presentation.strategy?.checklist || []}
              onDeviceChange={(e) => {
                setSelectedDeviceId(e.target.value);
                localStorage.setItem("chosenMicId", e.target.value);
              }}
              onStart={startRecording}
              onStop={stopRecording}
            />

            {audioURL ? (
              <ModuleSevenReadAloudObservation
                observation={readAloudObservation}
                disabled={locked}
                onChange={(next) => {
                  setReadAloudObservation(next);
                  setRevisionNotice(null);
                }}
              />
            ) : null}

            <ModuleSevenReadAloudSecondaryTeaching
              strategy={presentation.strategy}
            />
          </div>
        ) : (
          <>
            <ModuleSevenStrategyCard
              strategy={presentation.strategy}
              showEntryTeaching={false}
              entryTeaching={null}
              revisionStage={isFinalReviewStep ? "compare" : "change"}
            />

            <WorkingSetSection
              className="[&>div:last-child]:border-theme-blue/20 [&>div:last-child]:shadow-md"
              label={presentation.workingSetLabel}
              description={presentation.workingSetDescription}
            >
              {isFinalReviewStep ? (
                <div className="space-y-3 text-left">
                  <div className={FULL_DRAFT_READ_CLASS}>
                    <EssayProseView
                      sectionSteps={sectionSteps}
                      sections={sections}
                      emptyFallback={
                        <p className="text-sm leading-relaxed text-text-muted">
                          Your revised essay will appear here once sections have prose.
                        </p>
                      }
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-text-muted" role="status">
                    This review does not change your prose. Use Back if you want to
                    strengthen one more section.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <p className="text-sm font-medium text-text-primary">{sectionLabel}</p>
                  {sectionIsEmpty ? (
                    <p className="text-xs leading-relaxed text-text-muted">
                      This section is empty. You can fill it with the draft you wrote in
                      Module 6.
                    </p>
                  ) : null}
                  <textarea
                    spellCheck
                    autoCorrect="on"
                    autoCapitalize="sentences"
                    lang="en"
                    enterKeyHint="enter"
                    className={REVISION_TEXTAREA_CLASS}
                    value={sections[draftIndex] || ""}
                    onChange={(e) => updateSection(draftIndex, e.target.value)}
                    disabled={locked}
                    aria-label={`Revise ${sectionLabel || "this section"}`}
                    placeholder="Strengthen this section in your own words…"
                  />
                  <p className="text-xs leading-relaxed text-text-muted">
                    Save your revision when you want to keep your progress for another
                    session.{" "}
                    <button
                      type="button"
                      onClick={restoreModule6Draft}
                      disabled={locked}
                      className={`min-h-[44px] font-semibold text-theme-blue hover:underline disabled:opacity-50 ${ACTION_BUTTON_FOCUS}`}
                    >
                      Use my Module 6 draft
                    </button>
                  </p>
                </div>
              )}
            </WorkingSetSection>
          </>
        )}

        {revisionNotice ? (
          <div
            role="status"
            aria-live="polite"
            className={[
              "rounded-lg px-4 py-3 text-sm",
              revisionNotice.type === "success"
                ? "border border-theme-green/30 bg-theme-green/5 text-theme-green"
                : "border border-red-200 bg-red-50 text-red-800",
            ].join(" ")}
          >
            {revisionNotice.message}
          </div>
        ) : null}

        {locked ? (
          <div className="space-y-2 rounded-lg border border-theme-green/30 bg-theme-green/5 px-4 py-3 text-sm text-theme-green">
            <p className="font-semibold">Your revision is complete for Module 7.</p>
            <p>This draft is locked while you move forward.</p>
            {showDevUnlock ? (
              <button
                type="button"
                onClick={unlockForTesting}
                className={`min-h-[44px] rounded-md border border-border-soft bg-white px-3 py-1.5 text-xs text-text-muted ${ACTION_BUTTON_FOCUS}`}
              >
                Unlock to Test
              </button>
            ) : null}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-soft/60 pt-4">
          <div>
            {!isFirstStep ? (
              <button
                type="button"
                onClick={goBack}
                disabled={locked}
                className={`min-h-[44px] rounded-lg bg-surface-soft px-4 py-2 text-text-primary hover:bg-border-soft/60 disabled:opacity-50 ${ACTION_BUTTON_FOCUS}`}
              >
                Back
              </button>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2">
            {!isReadAloudStep ? (
              <button
                type="button"
                onClick={() => saveDraft()}
                disabled={locked}
                className={`min-h-[44px] rounded-lg border border-theme-blue/30 bg-white px-4 py-2 text-sm font-medium text-theme-blue disabled:opacity-50 ${ACTION_BUTTON_FOCUS}`}
              >
                Save revision
              </button>
            ) : null}
            {!isLastStep ? (
              <button
                type="button"
                onClick={goNext}
                disabled={locked || (isReadAloudStep && !canKeepGoing)}
                aria-disabled={locked || (isReadAloudStep && !canKeepGoing)}
                className={`min-h-[44px] rounded-lg bg-theme-blue px-4 py-2 font-medium text-white disabled:opacity-50 ${ACTION_BUTTON_FOCUS}`}
              >
                Keep going
              </button>
            ) : (
              <button
                type="button"
                onClick={() => saveDraft({ finalized: true })}
                disabled={locked}
                className={`min-h-[44px] rounded-lg bg-theme-orange px-4 py-2 font-medium text-white shadow-soft disabled:opacity-50 ${ACTION_BUTTON_FOCUS}`}
              >
                Finish revising and continue
              </button>
            )}
          </div>
        </div>
        {isReadAloudStep && !readAloudReady ? (
          <p
            className="text-sm text-text-muted"
            role="status"
            aria-live="polite"
            data-testid="module7-read-aloud-gate"
            data-gate-reason={readAloudGate.reason}
          >
            {readAloudGate.message}
          </p>
        ) : null}
      </ModuleSixStepFrame>
      </div>
    </ModulePageShell>
  );
}
