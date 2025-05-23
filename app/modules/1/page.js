"use client";

import { useRouter } from "next/navigation";

export default function ModuleOne() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 text-theme-dark">
      <div className="bg-gradient-to-r from-theme-red via-theme-orange via-theme-green via-theme-blue to-theme-dark text-white px-6 py-4 rounded-xl shadow-md">
        <h1 className="text-3xl font-bold">Module 1: Understanding the Prompt</h1>
      </div>

      <p className="text-lg">
        In this module, you’ll learn how to break down your writing task before diving into research or outlining.
      </p>

      <section className="bg-white border rounded-xl shadow p-6 space-y-4">
        <h2 className="text-xl font-semibold">Essay Prompt</h2>
        <p>
          <strong>Compare and contrast</strong> Martin Luther King Jr.'s{" "}
          <em>“I Have a Dream”</em> speech and his{" "}
          <em>“Letter from Birmingham Jail.”</em>
        </p>
        <p>
          Focus on their use of <strong>ethos, pathos, logos</strong> (rhetorical appeals), as well as{" "}
          <strong>audience</strong> and <strong>purpose</strong>.
        </p>
        <p>
          Your goal is to analyze how each text uses these rhetorical strategies and explain their impact on the audience.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">What does this mean?</h2>
        <ul className="list-disc list-inside text-base space-y-2">
          <li>
            <strong>Compare and contrast</strong>: What’s similar and different between the two texts?
          </li>
          <li>
            <strong>Ethos</strong>: How does MLK show he is trustworthy or credible?
          </li>
          <li>
            <strong>Pathos</strong>: Where does he appeal to emotion?
          </li>
          <li>
            <strong>Logos</strong>: What logic or evidence does he use?
          </li>
          <li>
            <strong>Audience</strong>: Who is he writing or speaking to? Why does it matter?
          </li>
          <li>
            <strong>Purpose</strong>: What does he want the audience to think, feel, or do?
          </li>
        </ul>
      </section>

      <div className="pt-4">
        <button
          onClick={() => router.push("/modules/2")}
          className="bg-theme-blue hover:bg-blue-900 text-white px-6 py-3 rounded-xl shadow transition"
        >
          Continue to Module 2
        </button>
      </div>
    </div>
  );
}
