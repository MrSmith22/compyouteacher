"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleTwoStep1() {
  const router = useRouter();
  const { data: session } = useSession();

  const [speechUrl, setSpeechUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!speechUrl.startsWith("https://")) {
      setError("Please enter a valid https:// URL.");
      return;
    }
    if (!session?.user?.email) {
      setError("You must be signed in.");
      return;
    }

    setSaving(true);
    setError("");

    const { error: supaError } = await supabase
      .from("user_resources")
      .upsert({
        user_email: session.user.email,
        speech_url: speechUrl,
        updated_at: new Date().toISOString(),
      });

    if (supaError) {
      console.error(supaError);
      setError("Failed to save. Please try again.");
      setSaving(false);
      return;
    }

    router.push("/modules/2/step2");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold text-theme-green mb-4">
        Module 2 — Step 1: Analyze the Speech
      </h1>

      <ol className="list-decimal list-inside space-y-2 text-theme-dark">
        <li>Watch Dr. King’s <em>I Have a Dream</em> speech below.</li>
        <li>Read the full transcript of the speech at the National Archives.</li>
        <li>
          Search in Google: <code>National Archives I Have a Dream transcript</code> and find the link that ends with <code>.pdf</code>.
        </li>
        <li>
          Paste that National Archives URL in the box below so you can refer to it later.
        </li>
        <li>
          When finished, click the <strong>Continue</strong> button to proceed to the next step.
        </li>
      </ol>

      <div>
        <iframe
          src="https://archive.org/embed/i-have-a-dream-video"
          width="100%"
          height="384"
          frameBorder="0"
          webkitAllowFullScreen
          mozAllowFullScreen
          allowFullScreen
          className="rounded shadow my-4"
          title="I Have a Dream — Martin Luther King, Jr."
        />
      </div>

      <div className="bg-gray-50 p-4 rounded shadow">
        <label className="font-semibold text-theme-dark block mb-1">
          Paste the National Archives URL for the speech transcript:
        </label>
        <input
          type="url"
          value={speechUrl}
          onChange={(e) => setSpeechUrl(e.target.value)}
          placeholder="https://www.archives.gov/files/social-media/transcripts/transcript-march-pt3-of-3-2602934.pdf"
          className="w-full border rounded px-3 py-2"
        />
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handleContinue}
          disabled={saving}
          className="bg-theme-blue hover:bg-blue-700 text-white px-6 py-3 rounded shadow disabled:opacity-50"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
