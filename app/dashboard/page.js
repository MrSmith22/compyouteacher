// app/dashboard/page.js
"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Sidebar from "./components/Sidebar";

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-theme-light text-theme-dark">
        <div className="space-y-4 text-center">
          <p className="text-md">Not signed in</p>
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-theme-light text-theme-dark">
      <Sidebar />

      <main className="flex-1 p-10">
        <h1 className="text-3xl font-extrabold mb-6">Welcome to Your Dashboard</h1>

        <p className="text-md text-gray-600 mb-6">
          Signed in as <span className="font-semibold">{session.user.email}</span>
        </p>

        <div className="mb-10 bg-white shadow p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-2">MLK Essay Assignment</h3>
          <p className="text-sm text-gray-600 mb-3">
            Continue your current assignment or start a new one.
          </p>
          <a
            href="/modules"
            className="inline-block bg-theme-blue hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
          >
            Start Assignment: MLK Rhetorical Strategies
          </a>
        </div>

        <button
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          onClick={() => signOut()}
        >
          Sign out
        </button>
      </main>
    </div>
  );
}