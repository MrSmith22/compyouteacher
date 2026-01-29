"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MlkEssay() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to home page if not signed in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  // Show loading text while checking authentication
  if (status === "loading") {
    return <p className="text-center">Checking authentication...</p>;
  }

  // Prevent rendering if user is being redirected
  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">
        MLK Rhetorical Strategies Essay Assignment
      </h1>
      <p className="mb-4">
        This is your assignment to analyze Martin Luther King&apos;s rhetorical
        strategies in his speeches.
      </p>

      <div className="mb-4">
        <h3 className="text-lg font-semibold">Assignment Instructions:</h3>
        <ul className="list-disc pl-5">
          <li>Read the provided text and analyze the use of rhetorical strategies.</li>
          <li>Submit your essay on the use of ethos, pathos, and logos in the speeches.</li>
          <li>Ensure to format your essay properly (APA or MLA).</li>
        </ul>
      </div>

      <button
        className="bg-green-500 text-white px-4 py-2 rounded mt-4"
        onClick={() => alert("Submit the assignment!")}
      >
        Submit Assignment
      </button>
    </div>
  );
}
