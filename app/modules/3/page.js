"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { logActivity } from "@/lib/logActivity";
import ModuleThreeForm from "@/components/ModuleThreeForm";

export default function ModuleThreePage() {
  const { data: session } = useSession();

  // Log module start
  useEffect(() => {
    if (!session?.user?.email) return;

    logActivity(session.user.email, "module_started", {
      module: 3,
      screen: "module3_main",
    });
  }, [session?.user?.email]);

  return <ModuleThreeForm />;
}