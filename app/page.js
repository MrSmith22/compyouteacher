"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-theme-light text-theme-dark px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Comp-YouTeacher</h1>
        <p className="text-base text-gray-600 mb-6">
          Your step-by-step writing assistant for crafting powerful essays.
        </p>

        {session ? (
          <>
            <p className="mb-4 text-sm">Signed in as {session.user.email}</p>
            <div className="flex flex-col gap-3">
              <button
                className="bg-theme-green hover:bg-green-700 text-white px-4 py-2 rounded-2xl shadow"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </button>
              <button
                className="bg-theme-red hover:bg-red-700 text-white px-4 py-2 rounded-2xl shadow"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
              <Link
                href="/modules/10"
                className="text-sm text-theme-blue underline mt-2"
              >
                📊 Teacher Dashboard (Module 10)
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm">Not signed in</p>
            <button
              className="bg-theme-blue hover:bg-blue-800 text-white px-6 py-3 rounded-2xl shadow"
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
