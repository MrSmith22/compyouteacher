"use client";

import { useEffect, useRef, useState } from "react";
import { canEnterModule, StudentOutline } from "@/lib/progression/guards";
import { logActivity } from "@/lib/logActivity";

type UseModuleGateArgs = {
  userEmail?: string | null;
  targetModule: number;
};

type GateState = {
  outline: StudentOutline | null;
  gateBlocked: boolean;
  gateReason: string;
  loading: boolean;
};

type GateDataForModule6 = {
  outline: StudentOutline;
};

export function useModuleGate({ userEmail, targetModule }: UseModuleGateArgs): GateState {
  const [outline, setOutline] = useState<StudentOutline | null>(null);
  const [gateBlocked, setGateBlocked] = useState(false);
  const [gateReason, setGateReason] = useState("");
  const [loading, setLoading] = useState(true);

  const hasLoggedBlockRef = useRef(false);

  useEffect(() => {
    if (!userEmail) {
      setOutline(null);
      setGateBlocked(false);
      setGateReason("");
      setLoading(true);
      return;
    }

    let cancelled = false;

    const checkGate = async () => {
      setLoading(true);
      setGateBlocked(false);
      setGateReason("");
      setOutline(null);

      const gate =
        targetModule === 6
          ? await canEnterModule<GateDataForModule6>({ userEmail, targetModule })
          : await canEnterModule({ userEmail, targetModule });

      if (cancelled) return;

      if (!gate.ok) {
        setOutline(null);
        setGateBlocked(true);
        setGateReason(gate.message || "This module is locked.");
        setLoading(false);

        if (!hasLoggedBlockRef.current) {
          hasLoggedBlockRef.current = true;
          try {
            await logActivity(userEmail, "module_blocked", {
              module: targetModule,
              reason: gate.reason || "unknown",
            });
          } catch {
            // do not block UI
          }
        }

        return;
      }

      hasLoggedBlockRef.current = false;

      if (targetModule === 6) {
        const data = (gate as { ok: true; data?: GateDataForModule6 }).data;
        setOutline(data?.outline ?? null);
      } else {
        setOutline(null);
      }

      setGateBlocked(false);
      setGateReason("");
      setLoading(false);
    };

    checkGate();

    return () => {
      cancelled = true;
    };
  }, [userEmail, targetModule]);

  return { outline, gateBlocked, gateReason, loading };
}