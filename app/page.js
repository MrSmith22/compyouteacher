"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-theme-light text-theme-dark px-4">
      <div className="w-full max-w-3xl text-center">
        {/* Rainbow Gradient Bar */}
        <div
          className="bg-gradient-to-r p-4 rounded-xl shadow-md mb-8"
          style={{
            backgroundImage:
              "linear-gradient(to right, #A60204, #D96704, #377303, #1B406D, #282A30)",
          }}
        >
          <h1 className="text-4xl font-bold text-white tracking-wide">
            The Writing Processor
          </h1>
        </div>

        {/* Slogan */}
        <p className="text-base text-gray-700 mb-6 font-medium">
          Learn the writing process. Think deeper. Write better.
        </p>

        {session ? (
          <>
            <p className="mb-4 text-sm">Signed in as {session.user.email}</p>
            <div className="flex flex-col gap-3 items-center">
              <button
                className="bg-theme-green hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow"
                onClick={() => router.push("/dashboard")}
              >
                Go to Dashboard
              </button>
              <button
                className="bg-theme-red hover:bg-red-700 text-white px-6 py-3 rounded-xl shadow"
                onClick={() => signOut({ callbackUrl: "/" })}
              >
                Sign out
              </button>
              <Link
                href="/modules/10"
                className="text-sm text-theme-blue underline mt-3"
              >
                Teacher Dashboard
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mb-4 text-sm">Not signed in</p>
            <button
              className="bg-theme-blue hover:bg-blue-800 text-white px-6 py-3 rounded-xl shadow"
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
