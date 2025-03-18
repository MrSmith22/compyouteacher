"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session } = useSession();
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Welcome to Comp-YouTeacher</h1>

      {session ? (
        <>
          <p className="mb-2">Signed in as {session.user.email}</p>
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
  );
}
