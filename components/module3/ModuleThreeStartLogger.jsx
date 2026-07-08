"use client";

import { useEffect } from "react";
import { logActivity } from "@/lib/logActivity";

export default function ModuleThreeStartLogger({ email }) {
  useEffect(() => {
    if (!email) {
      return;
    }

    logActivity(email, "module_started", {
      module: 3,
      screen: "module3_main",
    });
  }, [email]);

  return null;
}
