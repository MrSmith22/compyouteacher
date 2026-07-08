import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import ModuleThreeV2Form from "@/components/ModuleThreeV2Form";
import ModuleThreeStartLogger from "@/components/module3/ModuleThreeStartLogger";
import {
  getClaimArtifact,
  getDraftArtifact,
  getIdeaArtifact,
  getOutlineArtifact,
  getThesisArtifact,
  listEvidenceClusterArtifacts,
  listEvidenceArtifacts,
  listPatternArtifacts,
  listSourceContextArtifacts,
} from "@/lib/artifacts/readArtifacts";

function emptyCanvasArtifacts() {
  return {
    evidenceArtifacts: [],
    evidenceClusterArtifacts: [],
    patternArtifacts: [],
    ideaArtifact: null,
    claimArtifact: null,
    sourceContextArtifacts: [],
    thesisArtifact: null,
    outlineArtifact: null,
    draftArtifact: null,
  };
}

async function loadInitialCanvasArtifacts(email) {
  if (!email) {
    return emptyCanvasArtifacts();
  }

  try {
    const [
      evidenceArtifacts,
      evidenceClusterArtifacts,
      patternArtifacts,
      ideaArtifact,
      claimArtifact,
      sourceContextArtifacts,
      thesisArtifact,
      outlineArtifact,
      draftArtifact,
    ] = await Promise.all([
      listEvidenceArtifacts(email),
      listEvidenceClusterArtifacts(email),
      listPatternArtifacts(email),
      getIdeaArtifact(email),
      getClaimArtifact(email),
      listSourceContextArtifacts(email),
      getThesisArtifact(email),
      getOutlineArtifact(email),
      getDraftArtifact(email),
    ]);

    return {
      evidenceArtifacts,
      evidenceClusterArtifacts,
      patternArtifacts,
      ideaArtifact,
      claimArtifact,
      sourceContextArtifacts,
      thesisArtifact,
      outlineArtifact,
      draftArtifact,
    };
  } catch (error) {
    console.error("Module 3 canvas artifact load failed:", error);
    return emptyCanvasArtifacts();
  }
}

export default async function ModuleThreePage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  const initialCanvasArtifacts = await loadInitialCanvasArtifacts(email);

  return (
    <>
      <ModuleThreeStartLogger email={email} />
      <ModuleThreeV2Form initialCanvasArtifacts={initialCanvasArtifacts} />
    </>
  );
}