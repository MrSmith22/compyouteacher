"use client";

import Link from "next/link";

export default function Module3Success() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <h1 className="text-3xl font-extrabold text-theme-green">
          Module 3 Complete!
        </h1>
        <p className="text-lg text-theme-dark">
          Great work on completing Module 3!
        </p>

        <Link
          href="/modules/4"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded shadow hover:bg-blue-800 transition"
        >
          Start Module 4 →
        </Link>
      </div>
    </div>
  );
}