"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleSeven() {
  const { data: session } = useSession();
  const router = useRouter();
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const fetchData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data } = await supabase
        .from("student_drafts")
        .select("full_text, revised, final_ready, audio_url")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      if (data?.full_text) setText(data.full_text);
      if (data?.audio_url) setAudioURL(data.audio_url);
      if (data?.final_ready) setLocked(true);
    };

    fetchData();
  }, [session]);

  const startRecording = async () => {
    if (audioURL) {
      const confirmOverwrite = confirm("You already have a recording. Overwrite it?");
      if (!confirmOverwrite) return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const filename = `audio-${session.user.email}-${Date.now()}.webm`;

        const { error } = await supabase.storage
          .from("student-audio")
          .upload(filename, audioBlob, { contentType: "audio/webm" });

        if (error) {
          console.error("Upload error:", error.message || error);
          alert("Failed to save audio.");
          return;
        }

        const { data: urlData } = supabase.storage
          .from("student-audio")
          .getPublicUrl(filename);

        setAudioURL(urlData?.publicUrl);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Microphone access is required to record.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const saveDraft = async ({ finalized = false } = {}) => {
    const email = session?.user?.email;
    if (!email) return;

    await supabase.from("student_drafts").upsert({
      user_email: email,
      module: 6,
      full_text: text,
      final_text: finalized ? text : null,
      revised: !finalized,
      final_ready: finalized,
      audio_url: audioURL || null,
      updated_at: new Date().toISOString(),
    });

    if (finalized) {
      setLocked(true);
      router.push("/modules/7/success");
    } else {
      alert("Revision saved. You can continue editing or finalize.");
    }
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-theme-blue">✍️ Module 7: Revise Your Draft</h1>
      <p className="text-theme-dark">
        Make final edits to your essay and record yourself reading it aloud.
      </p>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      <section>
        <h2 className="text-xl font-semibold text-theme-dark mb-2">🔊 Read-Aloud Recording</h2>
        <p className="text-sm text-gray-600 mb-2">
          Record yourself reading your essay aloud. Listening helps you spot awkward sentences and improve flow.
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
        <div className="text-green-700 font-semibold mt-4">
          ✅ Draft revision complete. You cannot make further changes.
        </div>
      )}
    </div>
  );
}