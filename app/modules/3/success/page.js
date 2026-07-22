import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import ModuleThreeSuccessClient from "@/components/module3/ModuleThreeSuccessClient";
import {
  getClaimArtifact,
  getIdeaArtifact,
  getThesisArtifact,
  listEvidenceClusterArtifacts,
  listEvidenceArtifacts,
  listPatternArtifacts,
} from "@/lib/artifacts/readArtifacts";
import { buildModuleThreeSuccessSummary } from "@/lib/module3/moduleThreeSuccessHelpers";
import { getModule3StudentBucketAdmin } from "@/lib/supabase/helpers/module3FlowState";

function emptySuccessArtifacts() {
  return {
    thesisArtifact: null,
    claimArtifact: null,
    ideaArtifact: null,
    evidenceClusterArtifacts: [],
    evidenceArtifacts: [],
    patternArtifacts: [],
    evidenceArgumentSlice: null,
  };
}

async function loadSuccessArtifacts(email) {
  if (!email) {
    return emptySuccessArtifacts();
  }

  try {
    const [
      thesisArtifact,
      claimArtifact,
      ideaArtifact,
      evidenceClusterArtifacts,
      evidenceArtifacts,
      patternArtifacts,
      bucketRes,
    ] = await Promise.all([
      getThesisArtifact(email),
      getClaimArtifact(email),
      getIdeaArtifact(email),
      listEvidenceClusterArtifacts(email),
      listEvidenceArtifacts(email),
      listPatternArtifacts(email),
      getModule3StudentBucketAdmin({ userEmail: email }),
    ]);

    const flow = bucketRes?.data?.flow_state || {};
    const evidenceArgumentSlice =
      flow.evidenceArgumentSlice && typeof flow.evidenceArgumentSlice === "object"
        ? flow.evidenceArgumentSlice
        : null;

    return {
      thesisArtifact,
      claimArtifact,
      ideaArtifact,
      evidenceClusterArtifacts,
      evidenceArtifacts,
      patternArtifacts,
      evidenceArgumentSlice,
    };
  } catch (error) {
    console.error("Module 3 success artifact load failed:", error);
    return emptySuccessArtifacts();
  }
}

export default async function Module3SuccessPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const artifacts = await loadSuccessArtifacts(email);
  const summary = buildModuleThreeSuccessSummary(artifacts);

  return <ModuleThreeSuccessClient summary={summary} />;
}
