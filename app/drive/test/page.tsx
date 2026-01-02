"use client";
import { useState } from "react";

export default function DriveTestPage() {
  const [templateId, setTemplateId] = useState("");
  const [email, setEmail] = useState("");
  const [result, setResult] = useState("");

  async function handleCreateDoc() {
    setResult("Working...");
    try {
      const res = await fetch("/api/assignments/create-doc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, email }),
      });
      const data = await res.json();
      if (data.docUrl) setResult(`✅ Document created: ${data.docUrl}`);
      else setResult(`❌ Error: ${data.error || "Unknown error"}`);
    } catch {
      setResult("❌ Network error");
    }
  }

  return (
    <div style={{ padding: 32, maxWidth: 720, margin: "0 auto" }}>
      <h1>Test Google Doc Creation</h1>

      <label>Template ID</label>
      <input
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        placeholder="Paste your Google Doc ID"
        style={{ width: "100%", marginBottom: 12 }}
      />

      <label>Email to share with</label>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@kqps.net"
        style={{ width: "100%", marginBottom: 12 }}
      />

      <button onClick={handleCreateDoc}>Create Google Doc</button>

      <p style={{ marginTop: 16, whiteSpace: "pre-wrap" }}>{result}</p>
    </div>
  );
}