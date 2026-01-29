// components/ModuleSeven.js
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";

// Choose a supported recording format
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

  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);

  // mic devices and selection
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [amp, setAmp] = useState(0); // live amplitude meter

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const analyserRef = useRef(null);
  const rafRef = useRef(null);
  const audioCtxRef = useRef(null);
  const streamRef = useRef(null);
  const hasLoggedStartRef = useRef(false);

  const email = session?.user?.email ?? null;

  const getTextMetrics = (value) => {
    const raw = typeof value === "string" ? value : text;
    const words = raw
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    return {
      wordCount: words,
      charCount: raw.length,
    };
  };

  // Helper: load Module 6 draft
  const loadFromModule6 = async () => {
    if (!email) return { text: "" };
    const { data, error } = await supabase
      .from("student_drafts")
      .select("full_text")
      .eq("user_email", email)
      .eq("module", 6)
      .maybeSingle();
    if (error) console.error("Module 6 fetch error:", error);
    return { text: data?.full_text ?? "" };
  };

// Fetch Module 7 text; load audio from readaloud API; if no text, fall back to Module 6
useEffect(() => {
  const fetchData = async () => {
    if (!email) return;

    // 1) Load text state from student_drafts (Module 7), otherwise fall back to Module 6
    const { data, error } = await supabase
      .from("student_drafts")
      .select("full_text, revised, final_ready")
      .eq("user_email", email)
      .eq("module", 7)
      .maybeSingle();

    if (error) console.error("Module 7 fetch error:", error);

    let initialText = "";

    if (data?.full_text) {
      initialText = data.full_text;
    } else {
      const from6 = await loadFromModule6();
      initialText = from6.text;
    }

    setText(initialText);
    setLocked(!!data?.final_ready);

    // 2) Load audio from API (source of truth is student_readaloud)
    let publicUrl = null;
    try {
      const res = await fetch("/api/readaloud?module=7");
      const json = await res.json().catch(() => ({}));
      if (res.ok && json?.ok) {
        publicUrl = json.publicUrl ?? null;
      }
    } catch {
      // ignore network errors, do not crash UI
    }

    setAudioURL(publicUrl);

    // 3) Log module_started once per visit
    if (!hasLoggedStartRef.current) {
      hasLoggedStartRef.current = true;
      const metrics = getTextMetrics(initialText);
      logActivity(email, "module_started", {
        module: 7,
        from_module6: !data?.full_text,
        has_audio: !!publicUrl,
        ...metrics,
      });
    }
  };

  fetchData();
}, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  // enumerate input devices once
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
  
      // Never store 0 if we got a real duration
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
      alert("Please sign in first.");
      return;
    }
    if (audioURL) {
      const confirmOverwrite = confirm(
        "You already have a recording. Overwrite it?"
      );
      if (!confirmOverwrite) return;
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
      
        // Local preview first (works immediately, but do NOT persist this URL)
        const localUrl = URL.createObjectURL(blob);
        setAudioURL(localUrl);
      
        const durationSeconds = await getBlobDurationSeconds(blob);
      
        try {
          // Send to server API (server handles storage)
          const file = new File([blob], `readaloud.${chosen.ext}`, {
            type: chosen.mime || "audio/*",
          });
      
          const form = new FormData();
          form.append("file", file);
          form.append("module", "7");
          if (durationSeconds !== null) form.append("durationSeconds", String(durationSeconds));
      
          const res = await fetch("/api/readaloud", {
            method: "POST",
            body: form,
          });
      
          const json = await res.json().catch(() => ({}));
      
          if (!res.ok || !json?.ok) {
            console.error("Read aloud upload failed:", json?.error || res.statusText);
            alert("Failed to save audio.");
      
            logActivity(email, "recording_failed", {
              module: 7,
              error: json?.error || res.statusText || "Upload failed",
            });
      
            // Keep localUrl for this session, but do not persist it
            return;
          }
      
          // Success: switch UI to durable URL and persist it
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
          alert("Failed to save audio.");
      
          logActivity(email, "recording_failed", {
            module: 7,
            error: String(err?.message || err),
          });
      
          // Keep localUrl for this session, but do not persist it
        } finally {
          // Release mic
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
      alert("Microphone access is required to record.");
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

  const saveDraft = async ({ finalized = false } = {}) => {
    if (!email) {
      alert("Please sign in first.");
      return;
    }

    const payload = {
      user_email: email,
      module: 7,
      full_text: text,
      final_text: finalized ? text : null,
      revised: !finalized,
      final_ready: finalized,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase.from("student_drafts").upsert(payload);

    if (error) {
      console.error("Save error:", error);
      alert("Save failed.");
      return;
    }

    const metrics = getTextMetrics();
    const meta = {
      module: 7,
      has_audio: !!(audioURL && audioURL.startsWith("http")),
      ...metrics,
    };

    if (finalized) {
      setLocked(true);
      await logActivity(email, "module_completed", meta);
      router.push("/modules/7/success");
    } else {
      await logActivity(email, "revision_saved", meta);
      alert("Revision saved. You can continue editing or finalize.");
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-theme-light flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-md w-full space-y-3">
          <h1 className="text-2xl font-semibold text-theme-blue">
            Please sign in
          </h1>
          <p className="text-theme-dark text-sm">
            You need to be signed in to use Module 7 and save your revisions and
            audio recording.
          </p>
          <Link
            className="inline-block bg-theme-blue text-white px-4 py-2 rounded-md text-sm font-semibold"
            href="/api/auth/signin"
          >
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  // Word processor style props for the textarea
  const wp = {
    spellCheck: true,
    autoCorrect: "on",
    autoCapitalize: "sentences",
    lang: "en",
  };

  return (
    <div className="min-h-screen bg-theme-light">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <header className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4">
          <h1 className="text-3xl font-extrabold text-theme-blue mb-1">
            ✍️ Module 7: Revise and Read Your Essay Aloud
          </h1>
          <p className="text-gray-700 text-sm md:text-base">
            In this step you will move from a rough draft to a more polished
            version. You will:
          </p>
          <ol className="list-decimal list-inside mt-2 text-sm text-gray-700 space-y-1">
            <li>Pull in your draft from Module 6 if you need it.</li>
            <li>Revise the draft in the textbox using specific checks.</li>
            <li>
              Record yourself reading the essay aloud, then listen for places
              that sound confusing or awkward.
            </li>
            <li>Save your best revision and decide when it is ready to finalize.</li>
          </ol>
        </header>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 space-y-3">
          <h2 className="text-xl font-bold text-theme-dark">
            Step 1: Get your draft into this box
          </h2>
          <p className="text-sm text-gray-700">
            You should already have a complete draft from Module 6. If the box
            below is empty or you want to reload the most recent version from
            Module 6, use this button.
          </p>
          <button
            onClick={async () => {
              const { text: t } = await loadFromModule6();
              setText(t || "");
              const metrics = getTextMetrics(t || "");
              if (email) logActivity(email, "draft_reloaded_from_module6", { module: 7, ...metrics });
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-theme-blue hover:underline"
          >
            ⤵️ Load draft from Module 6 again
          </button>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 space-y-3">
          <h2 className="text-xl font-bold text-theme-dark">
            Step 2: Revise your draft
          </h2>
          <p className="text-sm text-gray-700">
            Use this textbox as your working copy. Make changes based on the
            outline and observations you used earlier. As you revise, focus on:
          </p>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            <li>
              <span className="font-semibold">Meaning:</span> Does every
              paragraph clearly support your thesis?
            </li>
            <li>
              <span className="font-semibold">Organization:</span> Do the ideas
              follow the order you planned in your outline?
            </li>
            <li>
              <span className="font-semibold">Rhetorical appeals:</span> Are you
              clearly explaining how ethos, pathos, and logos work in each text?
            </li>
            <li>
              <span className="font-semibold">Sentences and word choice:</span>{" "}
              Are there places that are too long, repetitive, or confusing?
            </li>
          </ul>
          <textarea
            className="w-full min-h-[320px] border border-gray-200 p-4 rounded-md leading-7 focus:outline-none focus:ring-2 focus:ring-theme-blue/60"
            {...wp}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={locked}
          />
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 space-y-4">
          <h2 className="text-xl font-bold text-theme-dark">
            Step 3: Record and listen to a read aloud
          </h2>
          <p className="text-sm text-gray-700">
            Reading your essay out loud is one of the best ways to find problems
            with flow, clarity, and punctuation. Use the controls below to pick a
            microphone, record, and then listen.
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            <label className="font-medium">Microphone:</label>
            <select
              className="border border-gray-300 rounded px-2 py-1"
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                localStorage.setItem("chosenMicId", e.target.value);
              }}
            >
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Mic ${d.deviceId.slice(0, 6)}…`}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-600">Input level:</span>
              <div
                className="h-2 bg-gray-200 rounded w-40 overflow-hidden"
                title="live input amplitude"
              >
                <div
                  className="h-2 bg-theme-green"
                  style={{ width: Math.min(100, Math.round(amp)) + "%" }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            {!recording ? (
              <button
                onClick={startRecording}
                disabled={locked}
                className={`bg-theme-red text-white px-4 py-2 rounded-md text-sm font-semibold shadow ${
                  locked ? "opacity-60 cursor-not-allowed" : "hover:brightness-110"
                }`}
              >
                🎙️ Start recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="bg-yellow-500 text-white px-4 py-2 rounded-md text-sm font-semibold shadow hover:brightness-110"
              >
                ⏹️ Stop recording
              </button>
            )}
          </div>

          {audioURL && (
  <div className="mt-4 space-y-2">
    <p className="text-sm font-medium text-theme-dark">▶️ Your recording</p>
    <audio controls src={audioURL} className="w-full" />
    <p className="text-xs text-gray-600">
      As you listen, pause and mark places in your draft that sound choppy,
      confusing, or off topic. Then scroll back up and fix them.
    </p>

    {audioURL.startsWith("http") && (
      <a
        id="download-latest-audio-ui"
        href={audioURL}
        download="read-aloud"
        className="inline-flex items-center gap-1 text-sm text-theme-blue underline"
      >
        ⬇️ Download latest recording
      </a>
    )}
  </div>
)}
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-200 px-6 py-4 space-y-3">
          <h2 className="text-xl font-bold text-theme-dark">
            Step 4: Decide what to do next
          </h2>
          <p className="text-sm text-gray-700">
            When you are finished revising for now, choose one of the options below.
          </p>

          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 mb-3">
            <li>
              <span className="font-semibold">Save revision</span> if you want to keep
              working on this draft in a later session.
            </li>
            <li>
              <span className="font-semibold">Finalize and continue</span> if you are
              satisfied with this version and ready to move to Module 8.
            </li>
          </ul>

          {!locked && (
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => saveDraft()}
                className="bg-theme-blue text-white px-5 py-2.5 rounded-md shadow text-sm font-semibold hover:brightness-110"
              >
                💾 Save revision
              </button>

              <button
                onClick={() => saveDraft({ finalized: true })}
                className="bg-theme-orange text-white px-5 py-2.5 rounded-md shadow text-sm font-semibold hover:brightness-110"
              >
                🚀 Finalize and continue to Module 8
              </button>
            </div>
          )}

          {locked && (
            <div className="text-green-700 font-semibold mt-2 space-y-2 text-sm">
              <div>✅ Draft revision is marked complete for Module 7.</div>
              <div>You cannot edit this text anymore.</div>
              <button
                onClick={() => setLocked(false)}
                className="bg-gray-100 border border-gray-300 px-3 py-1.5 rounded-md text-xs text-gray-700"
              >
                Unlock for testing
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}