"use client";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReadAloud() {
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (playUrl) URL.revokeObjectURL(playUrl);
    };
  }, [playUrl]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
    mr.ondataavailable = e => setChunks(prev => [...prev, e.data]);
    mr.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      setPlayUrl(url);
    };
    setChunks([]);
    mr.start();
    setRecorder(mr);
    setIsRecording(true);
  }

  function stop() {
    recorder?.stop();
    setIsRecording(false);
  }

  async function save() {
    if (!playUrl) return;
    setSaving(true);
    try {
      const res = await fetch(playUrl);
      const blob = await res.blob();
      const filename = `readaloud/${crypto.randomUUID()}.webm`;
      const { data: storage, error: sErr } = await supabase
        .storage.from("student-audio")               // create this bucket once
        .upload(filename, blob, { contentType: "audio/webm", upsert: false });
      if (sErr) throw sErr;

      const { data: publicUrl } = supabase
        .storage.from("student-audio")
        .getPublicUrl(filename);

      // TODO replace with your actual user email
      const user_email = (await supabase.auth.getUser()).data.user?.email ?? "test@example.com";

      const { error: dbErr } = await supabase
        .from("student_readaloud")
        .insert({
          user_email,
          module: 7,
          blob_url: publicUrl.publicUrl,
          duration_seconds: 0,
          notes: ""
        });
      if (dbErr) throw dbErr;
      alert("Saved");
    } catch (e: unknown) {
      console.error(e);
      alert(`Save failed: ${e instanceof Error ? e.message : e}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Read Aloud your draft</h1>
      <p>Record yourself reading your draft. Play it back and jot quick notes on what to improve.</p>

      <div className="flex gap-3">
        {!isRecording && (
          <button onClick={start} className="px-4 py-2 rounded-2xl shadow">Start recording</button>
        )}
        {isRecording && (
          <button onClick={stop} className="px-4 py-2 rounded-2xl shadow">Stop</button>
        )}
        <button disabled={!playUrl || saving} onClick={save} className="px-4 py-2 rounded-2xl shadow">
          {saving ? "Saving..." : "Save to Supabase"}
        </button>
      </div>

      {playUrl && (
        <div className="space-y-2">
          <audio ref={audioRef} controls src={playUrl} />
          <textarea
            className="w-full border rounded-xl p-3"
            rows={4}
            placeholder="Reflection notes. Where did you stumble? What needs clarity?"
          />
        </div>
      )}
    </div>
  );
}