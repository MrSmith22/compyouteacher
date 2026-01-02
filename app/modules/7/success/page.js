// app/modules/7/success/page.js
"use client";

import Link from "next/link";

export default function ModuleSevenSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          🎉 Module 7 Complete!
        </h1>

        <p className="text-lg text-theme-dark">
          Great work revising your draft and recording your read-aloud.
        </p>

        <Link
          href="/modules/8"
          className="inline-block bg-theme-blue text-white px-6 py-3 rounded hover:bg-blue-700 transition"
        >
          Start Module 8 →
        </Link>
      </div>
    </div>
  );
}