import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments";

export type EvidenceClusterWriteInput = {
  id: string;
  assignmentId?: string;
  userEmail: string;
  clusterName: string;
  reflection?: string | null;
  evidenceIds: string[];
};

const API_PATH = "/api/module3/evidence-clusters";
const PATTERN_API_PATH = "/api/module3/patterns";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message || "Request failed");
  }
  return "Request failed";
}

async function parseApiResponse(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json;
}

export async function upsertEvidenceClusterArtifact(input: EvidenceClusterWriteInput) {
  const res = await fetch(API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.id,
      clusterName: input.clusterName,
      reflection: input.reflection ?? null,
      evidenceIds: input.evidenceIds,
      assignmentId: input.assignmentId ?? DEFAULT_ASSIGNMENT_ID,
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function deleteEvidenceClusterArtifact({
  clusterId,
}: {
  userEmail: string;
  clusterId: string;
}) {
  const res = await fetch(API_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clusterId }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export type PatternWriteInput = {
  id: string;
  userEmail: string;
  text: string;
  evidenceIds: string[];
  isSelected?: boolean;
};

export async function upsertPatternArtifact(input: PatternWriteInput) {
  const res = await fetch(PATTERN_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: input.id,
      text: input.text,
      evidenceIds: input.evidenceIds,
      isSelected: Boolean(input.isSelected),
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function selectPatternArtifact({
  patternId,
}: {
  userEmail: string;
  patternId: string;
}) {
  const res = await fetch(PATTERN_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "select", patternId }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function deletePatternArtifact({
  patternId,
}: {
  userEmail: string;
  patternId: string;
}) {
  const res = await fetch(PATTERN_API_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patternId }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}
