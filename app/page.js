"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <h1 className="text-2xl font-bold">Welcome to Comp-YouTeacher</h1>

      {session ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <div className="flex gap-4">
            <button
              className="bg-green-500 text-white px-4 py-2 rounded"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </button>
            <button
              className="bg-red-500 text-white px-4 py-2 rounded"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              Sign out
            </button>
          </div>

          {/* 🧪 Temporary link to Module 10 */}
          <Link
            href="/modules/10"
            className="text-blue-700 underline text-sm mt-4"
          >
            📊 Go to Teacher Dashboard (Module 10)
          </Link>
        </>
      ) : (
        <>
          <p>Not signed in</p>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        </>
      )}
    </div>
  );
}
