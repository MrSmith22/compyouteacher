"use client";

import Link from "next/link";
import useRole from "@/lib/useRole"; // <-- default export

export default function Sidebar() {
  const { role, loading } = useRole();

  return (
    <div className="w-64 min-h-screen bg-theme-dark text-white p-6 shadow-md">
      <h2 className="text-2xl font-extrabold mb-8 tracking-wide text-theme-green">
        The Writing Processor
      </h2>

      <nav className="space-y-4">
        <Link
          href="/dashboard"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          📊 Dashboard
        </Link>

        <Link
          href="/assignments"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          ✏️ Assignments
        </Link>

        <Link
          href="/settings"
          className="block text-sm text-gray-300 hover:text-white transition-colors"
        >
          ⚙️ Settings
        </Link>

        {/* Teacher-only link */}
        {!loading && role === "teacher" && (
          <Link
            href="/modules/10"
            className="block text-sm text-yellow-300 hover:text-white transition-colors"
          >
            🧑‍🏫 Teacher Dashboard
          </Link>
        )}
      </nav>
    </div>
  );
}