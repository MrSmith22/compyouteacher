import { DEFAULT_ASSIGNMENT_ID } from "@/lib/assignments";
import { errorMessage } from "@/lib/api/errors";
import { parseApiResponse } from "@/lib/api/clientFetch";
import type { ClaimWriteInput } from "@/lib/artifacts/claimServer";
import type { EvidenceClusterWriteInput } from "@/lib/artifacts/evidenceClusterServer";
import type { IdeaWriteInput } from "@/lib/artifacts/ideaServer";
import type { PatternWriteInput } from "@/lib/artifacts/patternServer";
import type { ThesisWriteInput } from "@/lib/artifacts/thesisServer";
import type { ParagraphPlanWriteInput } from "@/lib/artifacts/paragraphPlanServer";
import type { Module6DraftWriteInput, Module7DraftWriteInput, Module8DraftWriteInput } from "@/lib/artifacts/draftServer";

export type {
  ClaimWriteInput,
  EvidenceClusterWriteInput,
  IdeaWriteInput,
  Module6DraftWriteInput,
  Module7DraftWriteInput,
  Module8DraftWriteInput,
  ParagraphPlanWriteInput,
  PatternWriteInput,
  ThesisWriteInput,
};

const API_PATH = "/api/module3/evidence-clusters";
const PATTERN_API_PATH = "/api/module3/patterns";
const IDEA_API_PATH = "/api/module3/ideas";
const CLAIM_API_PATH = "/api/module3/claims";
const THESIS_API_PATH = "/api/module3/thesis";
const PARAGRAPH_PLAN_API_PATH = "/api/module4/buckets";
const MODULE6_DRAFT_API_PATH = "/api/module6/draft";
const MODULE7_DRAFT_API_PATH = "/api/module7/draft";
const MODULE8_DRAFT_API_PATH = "/api/module8/draft";

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

export async function upsertParagraphPlanArtifact(input: ParagraphPlanWriteInput) {
  const res = await fetch(PARAGRAPH_PLAN_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      buckets: input.buckets,
      reflection: input.reflection,
      flow_state: input.flow_state ?? null,
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function upsertModule6DraftArtifact(input: Module6DraftWriteInput) {
  const res = await fetch(MODULE6_DRAFT_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sections: input.sections,
      full_text: input.full_text,
      locked: input.locked,
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function upsertModule7DraftArtifact(input: Module7DraftWriteInput) {
  const res = await fetch(MODULE7_DRAFT_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_text: input.full_text,
      final_text: input.final_text,
      revised: input.revised,
      final_ready: input.final_ready,
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}

export async function upsertModule8DraftArtifact(input: Module8DraftWriteInput) {
  const res = await fetch(MODULE8_DRAFT_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      full_text: input.full_text,
      final_text: input.final_text,
      revised: input.revised,
      final_ready: input.final_ready,
    }),
  });

  try {
    await parseApiResponse(res);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: { message: errorMessage(error) } };
  }
}
