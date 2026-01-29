"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

type Props = {
  /** If you already know the student email, pass it in. Otherwise we'll use the signed-in user. */
  email?: string;
  /** Optional label for the button */
  label?: string;
};

export default function CreateTChartDocButton({
  email,
  label = "Create Google Doc",
}: Props) {
  const { data: session } = useSession();
  const [working, setWorking] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const templateId = process.env.NEXT_PUBLIC_TCHART_TEMPLATE_ID;

  async function handleClick() {
    setMsg(null);

    if (!templateId) {
      setMsg("Missing template ID (NEXT_PUBLIC_TCHART_TEMPLATE_ID).");
      return;
    }

    const targetEmail = email || session?.user?.email || "";
    if (!targetEmail) {
      setMsg("No email found. Please sign in or provide an email.");
      return;
    }

    try {
      setWorking(true);

      const res = await fetch("/api/assignments/create-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, email: targetEmail }),
      });

      const data = await res.json();

      if (!res.ok || !data?.docUrl) {
        setMsg(data?.error || "Failed to create document");
        return;
      }

      window.open(data.docUrl, "_blank", "noopener,noreferrer");
      setMsg("✅ Document created and opened in a new tab.");
    } catch {
      setMsg("Network error. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <button
        onClick={handleClick}
        disabled={working}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "1px solid #ccc",
          background: working ? "#e5e5e5" : "#f5f5f5",
          cursor: working ? "not-allowed" : "pointer",
          width: "fit-content",
        }}
      >
        {working ? "Working..." : label}
      </button>

      {msg ? <span style={{ fontSize: 14 }}>{msg}</span> : null}
    </div>
  );
}