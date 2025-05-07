"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleSeven() {
  const { data: session } = useSession();
  const [text, setText] = useState("");
  const [locked, setLocked] = useState(false);

  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // 🎙️ Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
      alert("Microphone access is required to record.");
    }
  };

  // ⏹️ Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  // 🧠 Load saved full-text draft
  useEffect(() => {
    const fetchData = async () => {
      const email = session?.user?.email;
      if (!email) return;

      const { data } = await supabase
        .from("student_drafts")
        .select("full_text, revised")
        .eq("user_email", email)
        .eq("module", 6)
        .single();

      if (data?.full_text) setText(data.full_text);
      if (data?.revised) setLocked(true);
    };
    fetchData();
  }, [session]);

  // 💾 Save revision
  const saveRevision = async () => {
    if (!session?.user?.email) return;

    await supabase
      .from("student_drafts")
      .update({
        full_text: text,
        revised: true
      })
      .eq("user_email", session.user.email)
      .eq("module", 6);

    setLocked(true);
  };

  if (!session) return <p className="p-6">Loading...</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">✍️ Module 7: Revise Your Draft</h1>

      <textarea
        className="w-full min-h-[300px] border p-4 rounded"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={locked}
      />

      <section>
        <h2 className="text-lg font-semibold mb-2">🔊 Read-Aloud Recording</h2>
        <p className="text-sm text-gray-600 mb-2">
          Read your essay out loud and record it. Listening to yourself can help you catch awkward sentences or improve your flow.
        </p>

        {!recording ? (
          <button
            onClick={startRecording}
            disabled={locked}
            className="bg-red-600 text-white px-4 py-2 rounded mr-2"
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
        <button
          onClick={saveRevision}
          className="bg-blue-700 text-white px-6 py-3 rounded shadow"
        >
          ✅ Mark as Revised & Continue
        </button>
      )}

      {locked && (
        <div className="text-green-700 font-semibold">
          ✅ Draft revision complete.
        </div>
      )}
    </div>
  );
}
