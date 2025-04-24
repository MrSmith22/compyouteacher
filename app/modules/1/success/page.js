// JavaScript source code
"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function Module1Success() {
  const params = useSearchParams();
  const score = params.get("score") ?? "-";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white shadow-md rounded-xl p-8 text-center space-y-6">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold">Module 1 Complete!</h1>

        <p className="text-lg">
          Your quiz score: <strong>{score}%</strong>
        </p>

        <Link
          href="/modules/2"
          className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Start Module 2 →
        </Link>
      </div>
    </div>
  );
}
