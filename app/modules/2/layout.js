"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getStudentAssignment } from "@/lib/supabase/helpers/studentAssignments";
import { isPathAllowedForModule } from "@/lib/supabase/helpers/moduleGate";

const ASSIGNMENT_NAME = "MLK Essay Assignment";

/**
 * Module 2 has multiple subroutes (/, /analysis, /tcharts, /form, /source, /letter, /success).
 * Gate by module family: allow any path under /modules/2 when current_module >= 2;
 * otherwise send the student to the Module 2 root.
 */
export default function ModuleTwoLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [allowed, setAllowed] = useState(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.email) {
      setAllowed(null);
      return;
    }
    if (!pathname?.startsWith("/modules/2")) {
      setAllowed(true);
      return;
    }
    let cancelled = false;
    getStudentAssignment({
      userEmail: session.user.email,
      assignmentName: ASSIGNMENT_NAME,
    })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          setAllowed(false);
          return;
        }
        const current =
          data && typeof data.current_module === "number"
            ? data.current_module
            : 0;
        const ok = isPathAllowedForModule(pathname, current);
        setAllowed(ok);
        if (!ok) {
          router.replace("/modules/2");
        }
      })
      .catch(() => {
        if (!cancelled) setAllowed(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname, session?.user?.email, status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (pathname?.startsWith("/modules/2") && allowed === null) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Loading…</p>
      </div>
    );
  }

  if (pathname?.startsWith("/modules/2") && allowed === false) {
    return (
      <div className="min-h-screen bg-theme-light text-theme-dark p-6 flex items-center justify-center">
        <p className="text-sm text-theme-dark/80">Redirecting…</p>
      </div>
    );
  }

  return <>{children}</>;
}
