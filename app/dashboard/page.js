"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Sidebar from "./components/Sidebar";
import StudentResponses from "./components/StudentResponses";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="flex min-h-screen bg-theme-light text-theme-dark">
      <Sidebar />

      <div className="flex-1 p-10">
        <h1 className="text-3xl font-extrabold mb-6">Welcome to Your Dashboard</h1>

        {session ? (
          <>
            <p className="text-md text-gray-600 mb-4">Signed in as <span className="font-semibold">{session.user.email}</span></p>

            <div className="mb-8 bg-white shadow p-6 rounded-lg">
              <h3 className="text-xl font-bold mb-2">MLK Essay Assignment</h3>
              <p className="text-sm text-gray-600 mb-2">
                Continue your current assignment or start a new one.
              </p>
              <a
                href="/modules"
                className="inline-block bg-theme-blue hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded transition"
              >
                Start Assignment: MLK Rhetorical Strategies
              </a>
            </div>

            <div className="mb-6">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => signOut()}
              >
                Sign out
              </button>
            </div>

            <div className="mt-10">
              <h3 className="text-xl font-bold mb-4">🧾 Student Module 3 Responses</h3>
              <StudentResponses />
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <p className="text-md">Not signed in</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
          </div>
        )}
      </div>
    </div>
  );
}