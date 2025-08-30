import { useEffect, useState } from "react";

export default function useRole() {
  const [role, setRole] = useState<"student" | "teacher" | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch("/api/role", { cache: "no-store" });
        const json = await res.json();
        if (mounted) setRole(json.role);
      } catch {
        if (mounted) setRole("student");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return { role, loading };
}