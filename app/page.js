"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-theme-light text-theme-dark px-4">
      <div className="w-full max-w-3xl text-center space-y-6">
        {/* App Name Banner with full theme-color gradient */}
        <div
          className="text-white py-6 px-4 rounded-xl shadow-lg"
          style={{
            backgroundImage:
              "linear-gradient(to right, #A60204, #D96704, #377303, #1B406D)",
          }}
        >
          <h1 className="text-4xl font-bold tracking-tight">The Writing Processor</h1>
          <p className="text-base font-light mt-2">
            Learn the writing process. Think deeper. Write better.
          </p>
        </div>

        {/* Session Buttons */}
        {session ? (
          <>
            <p className="text-sm text-gray-700">
              Signed in as <span className="font-medium">{session.user.email}</span>
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="bg-theme-green hover:bg-green-700 text-white px-5 py-2 rounded-md shadow transition"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </button>
              <button
                className="bg-theme-red hover:bg-red-700 text-white px-5 py-2 rounded-md shadow transition"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
            </div>
            <Link
              href="/modules/10"
              className="block mt-4 text-theme-blue underline text-sm"
            >
              Teacher Dashboard
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm">Not signed in</p>
            <button
              className="bg-theme-blue hover:bg-blue-800 text-white px-5 py-2 rounded-md shadow transition"
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