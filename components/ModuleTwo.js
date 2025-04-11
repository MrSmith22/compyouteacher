"use client";

import { useState } from "react";

export default function ModuleTwo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreateDoc = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/assignments/create-doc", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: "1juSzUn6RSoGCck6swIjhSNUJYyLzj14Rrtk50SSc9dU",
        email: "amplephorth1984@gmail.com",
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok && data.docUrl) {
      window.open(data.docUrl, "_blank");
    } else {
      setError("Failed to create document. Please try again.");
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto bg-white rounded shadow space-y-6">
      <h2 className="text-2xl font-bold">Module 2: MLK Speech vs. Letter Analysis</h2>

      <p>
        In this module, you'll compare two important texts by Dr. Martin Luther King Jr.:
        his "I Have a Dream" speech and his "Letter from a Birmingham Jail." You'll watch
        a video, read the letter, and prepare for a comparative rhetorical analysis.
      </p>

      {/* Video */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Watch: I Have a Dream Speech</h3>
        <video width="100%" height="315" controls>
          <source src="/videos/IHaveADreamSpeech.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Letter */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Read: Letter from a Birmingham Jail</h3>
        <p>Read the full text at:</p>
        <a
          href="https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html"
          target="_blank"
          className="text-blue-600 hover:underline"
        >
          https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html
        </a>
      </div>

      {/* Button */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Complete the T-Chart Assignment</h3>
        <p>This doc includes 5 T-Charts: Ethos, Pathos, Logos, Audience, and Purpose.</p>
        <button
          onClick={handleCreateDoc}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-2"
          disabled={loading}
        >
          {loading ? "Creating document..." : "Create My T-Chart Document"}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>

      {/* Citations */}
      <div>
        <h3 className="text-lg font-semibold mb-2">APA Citations</h3>
        <ul className="list-disc pl-5 text-sm">
          <li>
            King, M. L., Jr. (1963, August 28). <em>I have a dream [Speech]</em>. National Archives. <br />
            <a
              href="https://archive.org/details/MLKDreamSpeech"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              https://archive.org/details/MLKDreamSpeech
            </a>
          </li>
          <li className="mt-2">
            King, M. L., Jr. (1963, April 16). <em>Letter from a Birmingham jail</em>. African Studies Center – University of Pennsylvania. <br />
            <a
              href="https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html"
              target="_blank"
              className="text-blue-600 hover:underline"
            >
              https://www.africa.upenn.edu/Articles_Gen/Letter_Birmingham.html
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}
