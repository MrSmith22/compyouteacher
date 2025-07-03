"use client";

import Link from "next/link";

export default function ModuleEightSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          🎉 Final Draft Complete!
        </h1>

        <p className="text-md text-gray-700">
          Your final draft has been locked and is ready for APA formatting and submission.
        </p>

        <Link
          href="/modules/9"
          className="inline-block bg-theme-blue hover:bg-blue-800 text-white px-6 py-3 rounded shadow transition"
        >
          Proceed to APA Formatting →
        </Link>
      </div>
    </div>
  );
}