"use client";

import Link from "next/link";

export default function ModuleNineSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">📘</div>
        <h1 className="text-2xl font-bold text-theme-green">Module 9 Complete!</h1>

        <p className="text-lg text-theme-dark">
          Your final PDF has been uploaded successfully. Your teacher will review it soon.
        </p>

        <Link
          href="/dashboard"
          className="inline-block bg-theme-blue text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}