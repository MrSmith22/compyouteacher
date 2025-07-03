// app/modules/6/success/page.js
"use client";

import Link from "next/link";

export default function ModuleSixSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">🎉</div>
        <h1 className="text-2xl font-bold text-theme-green">Module 6 Complete!</h1>

        <p className="text-lg text-theme-dark">
          Great work drafting your essay! You can now move on to revisions.
        </p>

        <Link
          href="/modules/7"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Start Module 7 →
        </Link>
      </div>
    </div>
  );
}