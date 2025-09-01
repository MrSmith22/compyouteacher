"use client";

import { useRouter } from "next/navigation";

export default function ModuleTwoSuccess() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
      <div className="max-w-xl mx-auto bg-white shadow rounded p-8 text-center">
        <h1 className="text-3xl font-extrabold mb-4">
          🎉 You’ve Completed Module 2!
        </h1>
        <p className="text-gray-700 mb-6">
          Great work analyzing Dr. King’s <em>I Have a Dream</em> speech and{" "}
          <em>Letter from Birmingham Jail</em>. You’re ready to move on.
        </p>
        <button
          onClick={() => router.push("/modules/3")}
          className="bg-theme-blue text-white px-6 py-3 rounded font-semibold hover:opacity-90"
        >
          Continue to Module 3
        </button>
      </div>
    </div>
  );
}