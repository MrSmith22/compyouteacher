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
const IDEA_API_PATH = "/api/module3/ideas";
const CLAIM_API_PATH = "/api/module3/claims";
const THESIS_API_PATH = "/api/module3/thesis";

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

export type IdeaWriteInput = {
  userEmail: string;
  statement?: string;
  whyMatters?: string;
  clusterId?: string | null;
  patternId?: string | null;
  evidenceMap?: Record<
    string,
    {
      selected: boolean;
      relation: string;
      note: string;
    }
  > | null;
};

export async function upsertIdeaArtifact(input: IdeaWriteInput) {
  const body: Record<string, unknown> = {
    clusterId: input.clusterId ?? null,
    patternId: input.patternId ?? null,
  };

  if (input.statement !== undefined) body.statement = input.statement;
  if (input.whyMatters !== undefined) body.whyMatters = input.whyMatters;
  if (input.evidenceMap !== undefined) body.evidenceMap = input.evidenceMap;

  const res = await fetch(IDEA_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function deleteIdeaArtifact({
  userEmail: _userEmail,
}: {
  userEmail: string;
}) {
  const res = await fetch(IDEA_API_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export type ClaimWriteInput = {
  userEmail: string;
  workingClaim?: string;
  supportRationale?: string;
  clusterId?: string | null;
  patternId?: string | null;
};

export async function upsertClaimArtifact(input: ClaimWriteInput) {
  const body: Record<string, unknown> = {
    clusterId: input.clusterId ?? null,
    patternId: input.patternId ?? null,
  };

  if (input.workingClaim !== undefined) body.workingClaim = input.workingClaim;
  if (input.supportRationale !== undefined) body.supportRationale = input.supportRationale;

  const res = await fetch(CLAIM_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function deleteClaimArtifact({
  userEmail: _userEmail,
}: {
  userEmail: string;
}) {
  const res = await fetch(CLAIM_API_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export type ThesisWriteInput = {
  userEmail: string;
  thesis?: string;
  proofPlan?: string[];
  clusterId?: string | null;
  patternId?: string | null;
};

export async function upsertThesisArtifact(input: ThesisWriteInput) {
  const body: Record<string, unknown> = {
    clusterId: input.clusterId ?? null,
    patternId: input.patternId ?? null,
  };

  if (input.thesis !== undefined) body.thesis = input.thesis;
  if (input.proofPlan !== undefined) body.proofPlan = input.proofPlan;

  const res = await fetch(THESIS_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function deleteThesisArtifact({
  userEmail: _userEmail,
}: {
  userEmail: string;
}) {
  const res = await fetch(THESIS_API_PATH, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}
