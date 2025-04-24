"use client";

import Link from "next/link";

export default function ModuleThreeSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">✅</div>

        <h1 className="text-2xl font-bold">
          Module&nbsp;3 Complete!
        </h1>

        <p className="text-gray-600">
          Your thesis and analysis responses are saved.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-2">
          <Link
            href="/dashboard"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </Link>

          <Link
            href="/modules/4"
            className="inline-block bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
          >
            Start Module&nbsp;4 →
          </Link>
        </div>
      </div>
    </div>
  );
}
