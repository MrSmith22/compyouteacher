"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { isDevAuthPublicEnabled } from "@/lib/auth/devAuth";

export default function DevSignIn() {
  const [email, setEmail] = useState("dev-student@localhost");
  const [secret, setSecret] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  if (!isDevAuthPublicEnabled()) {
    return null;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setWorking(true);

    try {
      const result = await signIn("dev-credentials", {
        email: email.trim(),
        secret,
        redirect: false,
      });

      if (result?.error) {
        setError("Dev sign-in failed. Check DEV_AUTH_SECRET and try again.");
        return;
      }

      window.location.href = "/modules/3";
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Dev sign-in failed."
      );
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-sm rounded-xl border border-dashed border-theme-orange/40 bg-white p-4 text-left shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-theme-orange">
        Development only
      </p>
      <p className="mt-1 text-sm text-gray-600">
        Sign in without Google for local testing.
      </p>
      <form onSubmit={handleSubmit} className="mt-4 space-y-3">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-gray-700">Dev secret</span>
          <input
            type="password"
            value={secret}
            onChange={(event) => setSecret(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={working}
          className="w-full rounded-md bg-theme-orange px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {working ? "Signing in…" : "Dev sign in"}
        </button>
      </form>
    </div>
  );
}
