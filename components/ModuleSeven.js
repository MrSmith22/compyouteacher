"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";
import { logActivity } from "../lib/logActivity";

// Choose a supported recording format
function pickAudioFormat() {
  const candidates = [
    { mime: "audio/webm;codecs=opus", ext: "webm" }, // Chrome / Edge
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/mp4", ext: "m4a" },               // Safari
    { mime: "audio/aac", ext: "m4a" },               // Safari fallback
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

  // Fetch Module 7 row; if absent, fall back to Module 6
  useEffect(() => {
    const fetchData = async () => {
      if (!email) return;

      const { data, error } = await supabase
        .from("student_drafts")
        .select("full_text, revised, final_ready, audio_url")
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
      setAudioURL(data?.audio_url ?? null);
      setLocked(!!data?.final_ready);

      // Log module_started once per visit
      if (!hasLoggedStartRef.current) {
        hasLoggedStartRef.current = true;
        const metrics = getTextMetrics(initialText);
        logActivity(email, "module_started", {
          module: 7,
          from_module6: !data?.full_text,
          has_audio: !!data?.audio_url,
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
        const localUrl = URL.createObjectURL(blob);
        setAudioURL(localUrl);

        // Upload to Supabase storage
        const safeEmail = (email || "unknown").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filename = `readaloud/${safeEmail}/${Date.now()}.${chosen.ext}`;

        const { error: uploadErr } = await supabase
          .storage
          .from("student-audio")
          .upload(filename, blob, {
            contentType: chosen.mime || "audio/*",
          });

        if (uploadErr) {
          console.error("Upload error:", uploadErr);
          alert("Failed to save audio.");
          logActivity(email, "recording_failed", {
            module: 7,
            error: uploadErr.message,
          });
          // release mic
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
          return;
        }

        const { data: urlData } = supabase
          .storage
          .from("student-audio")
          .getPublicUrl(filename);

        if (urlData?.publicUrl) setAudioURL(urlData.publicUrl);

        // log successful recording save
        logActivity(email, "recording_saved", {
          module: 7,
          path: filename,
          mime: chosen.mime || null,
          has_public_url: !!urlData?.publicUrl,
        });

        // release mic
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };

      mr.start();
      setRecording(true);

      // log recording start
      logActivity(email, "recording_started", {
        module: 7,
        device_id: selectedDeviceId || null,
      });
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Microphone access is required to record.");
      if (email) {
        logActivity(email, "recording_failed", {
          module: 7,
          error: String(err.message || err),
        });
      }
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
      audio_url: audioURL || null,
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
      has_audio: !!audioURL,
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
      <div className="p-6 space-y-3">
        <h1 className="text-2xl font-semibold">Please sign in</h1>
        <p className="text-theme-dark">
          You need to be signed in to use Module 7.
        </p>
        <a
          className="inline-block bg-theme-blue text-white px-4 py-2 rounded"
          href="/api/auth/signin"
        >
          Sign in
        </a>
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
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-theme-blue">
        ✍️ Module 7: Revise Your Draft
      </h1>
      <p className="text-theme-dark">
        Make final edits to your essay and record yourself reading it aloud.
      </p>

      {/* Mic picker + live meter */}
      <div className="flex items-center gap-3">
        <label className="text-sm">Microphone:</label>
        <select
          className="border rounded px-2 py-1"
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
        <div className="text-sm">Live level: {amp}</div>
        <div
          className="h-2 bg-gray-200 rounded w-40 overflow-hidden"
          title="live input amplitude"
        >
          <div
            className="h-2 bg-green-500"
            style={{ width: Math.min(100, Math.round(amp)) + "%" }}
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={async () => {
            const { text: t } = await loadFromModule6();
            setText(t || "");
            if (email) {
              const metrics = getTextMetrics(t || "");
              logActivity(email, "draft_reloaded_from_module6", {
                module: 7,
                ...metrics,
              });
            }
          }}
          className="text-sm underline text-theme-blue"
          title="Reload your Module 6 draft into this textbox"
        >
          ⤵️ Load from Module 6 again
        </button>
      </div>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded leading-7"
        {...wp}
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      <section>
        <h2 className="text-xl font-semibold text-theme-dark mb-2">
          🔊 Read Aloud Recording
        </h2>
        <p className="text-sm text-gray-600 mb-2">
          Record yourself reading your essay aloud. Listening helps you spot
          awkward sentences and improve flow.
        </p>

        {!recording ? (
          <button
            onClick={startRecording}
            disabled={locked}
            className={`${
              locked ? "opacity-60 cursor-not-allowed" : ""
            } bg-theme-red text-white px-4 py-2 rounded mr-2`}
          >
            🎙️ Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="bg-yellow-500 text-white px-4 py-2 rounded"
          >
            ⏹️ Stop Recording
          </button>
        )}

        {audioURL && (
          <div className="mt-4">
            <p className="text-sm font-medium">▶️ Your Recording:</p>
            <audio controls src={audioURL} className="mt-2" />
            <div className="mt-2">
              <a
                id="download-latest-audio-ui"
                href={audioURL}
                download="read-aloud"
                className="underline"
              >
                ⬇️ Download latest recording
              </a>
            </div>
          </div>
        )}
      </section>

      {!locked && (
        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={() => saveDraft()}
            className="bg-theme-blue text-white px-6 py-3 rounded shadow"
          >
            💾 Save Revision
          </button>

          <button
            onClick={() => saveDraft({ finalized: true })}
            className="bg-theme-orange text-white px-6 py-3 rounded shadow"
          >
            🚀 Finalize & Continue to Module 8
          </button>
        </div>
      )}

      {locked && (
        <div className="text-green-700 font-semibold mt-4 space-y-2">
          <div>
            ✅ Draft revision complete. You cannot make further changes.
          </div>
          {/* Dev unlock helper */}
          <button
            onClick={() => setLocked(false)}
            className="bg-gray-200 px-3 py-2 rounded"
          >
            Unlock (dev)
          </button>
        </div>
      )}
    </div>
  );
}