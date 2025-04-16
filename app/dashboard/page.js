"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Sidebar from "./components/Sidebar";
import StudentResponses from "./components/StudentResponses";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="flex">
      <Sidebar /> {/* Sidebar added */}
      <div className="flex-1 p-8">
        <h1 className="text-2xl font-bold mb-4">Welcome to Your Dashboard</h1>
        {session ? (
          <>
            <p className="mb-2">Signed in as {session.user.email}</p>

            {/* Assignment link */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold">MLK Essay Assignment</h3>
              <ul className="list-disc pl-5">
                <li>
                  <a
  href="/modules"
  className="text-blue-500 hover:text-blue-700"
>
  Start Assignment: MLK Rhetorical Strategies
</a>

                </li>
              </ul>
            </div>

            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => signOut()}
            >
              Sign out
            </button>
            {/* Module 3 Submissions Viewer */}
<div className="mt-8">
  <h3 className="text-xl font-semibold mb-4">🧾 Student Module 3 Responses</h3>
  <StudentResponses />
</div>

          </>
        ) : (
          <>
            <p className="mb-2">Not signed in</p>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </button>
          </>
        )}
      </div>
    </div>
  );
}
