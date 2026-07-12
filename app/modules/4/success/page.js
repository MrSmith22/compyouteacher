import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import ModuleFourSuccessClient from "@/components/module4/ModuleFourSuccessClient";
import { loadModule4PageData } from "@/lib/module4/loadModule4PageData";
import { buildModule4SuccessSummary } from "@/lib/module4/module4SuccessHelpers";
import { createModule4EvidenceSlotResolver } from "@/lib/module4/module4SuccessEvidenceResolver";

export default async function Module4SuccessPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  let pageData = null;
  if (email) {
    try {
      pageData = await loadModule4PageData(email);
    } catch (error) {
      console.error("Module 4 success load failed:", error);
      pageData = null;
    }
  }

  const getEvidenceSlots = createModule4EvidenceSlotResolver({
    upstreamArtifacts: pageData?.upstreamArtifacts ?? null,
    initialTchartEntries: pageData?.initialTchartEntries ?? [],
    ideaArtifact: pageData?.upstreamArtifacts?.ideaArtifact ?? null,
  });

  const summary = buildModule4SuccessSummary({
    thesisArtifact: pageData?.upstreamArtifacts?.thesisArtifact ?? null,
    initialModule3: pageData?.initialModule3 ?? null,
    studentBuckets: pageData?.initialStudentBuckets ?? null,
    getEvidenceSlots,
  });

  return <ModuleFourSuccessClient summary={summary} />;
}
