"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Compatibility redirect.
 * Older resume paths and deep links may still point here.
 * Source-prep gating remains in app/modules/2/layout.js (WP-003).
 */
export default function ModuleTwoAnalysisRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/modules/2/tcharts");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-theme-light p-6 text-theme-dark">
      <p className="text-sm text-theme-dark/80">
        Continuing to evidence collection…
      </p>
    </div>
  );
}
