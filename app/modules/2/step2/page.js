"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";

export default function ModuleTwoStep2() {
  const { data: session } = useSession();
  const router = useRouter();
  const [letterURL, setLetterURL] = useState("");
  const [status, setStatus] = useState("");

  const email = session?.user?.email;

  useEffect(() => {
    if (!email) return;

    (async () => {
      const { data, error } = await supabase
        .from("user_resources")
        .select("letter_url")
        .eq("user_email", email)
        .single();

      if (!error && data?.letter_url) {
        setLetterURL(data.letter_url);
      }
    })();
  }, [email]);

  const handleSave = async () => {
    if (!letterURL.startsWith("https://")) {
      setStatus("❌ Please enter a valid URL that starts with https://");
      return;
    }

    const { error } = await supabase.from("user_resources").upsert({
      user_email: email,
      letter_url: letterURL,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setStatus(`❌ Error: ${error.message}`);
    } else {
      setStatus("✅ Saved!");
      router.push("/modules/2/step3");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6 bg-white shadow rounded">
      <h1 className="text-3xl font-bold text-theme-green mb-4">
        Module 2 — Step 2: Find the Letter from Birmingham Jail
      </h1>

      <section className="space-y-4">
        <p>
          In this step, you’ll find a trustworthy copy of Dr. King’s{" "}
          <em>Letter from Birmingham Jail</em> online and paste the link here.
        </p>

        <ol className="list-decimal list-inside space-y-2 text-theme-dark">
          <li>
            Open a new browser tab and go to{" "}
            <strong>www.google.com</strong>.
          </li>
          <li>
            In the search box, type:{" "}
            <code>"Letter from Birmingham Jail full text site:.edu OR site:.gov"</code>
          </li>
          <li>
            Look for a link from a website that ends in{" "}
            <strong>.edu</strong> or <strong>.gov</strong>.  
            (These are usually universities or official government websites and are more trustworthy.)
          </li>
          <li>
            Click on the link and make sure it shows the full text of the letter.
          </li>
          <li>
            Copy the full URL (address) from the browser’s address bar at the top.
          </li>
          <li>
            Paste that URL into the box below and click <strong>Save & Continue</strong>.
          </li>
        </ol>

        <p className="text-sm text-theme-muted">
          ⚠️ Do not use Wikipedia, blogs, or random .com sites. Look for .edu or .gov only!
        </p>
      </section>

      <section className="bg-gray-50 p-4 rounded">
        <label className="font-semibold text-theme-dark block mb-1">
          Paste the URL of the Letter you found:
        </label>
        <input
          type="url"
          value={letterURL}
          onChange={(e) => setLetterURL(e.target.value)}
          placeholder="https://www.example.edu/letter.html"
          className="w-full border rounded px-3 py-2"
        />
      </section>

      {status && (
        <p
          className={`text-sm font-semibold mt-2 ${
            status.startsWith("✅") ? "text-green-600" : "text-red-600"
          }`}
        >
          {status}
        </p>
      )}

      <div className="text-center mt-6">
        <button
          onClick={handleSave}
          className="bg-theme-blue hover:bg-blue-700 text-white px-6 py-3 rounded shadow"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
