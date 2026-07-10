import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { loadModule4PageData } from "@/lib/module4/loadModule4PageData";
import ModuleFour from "@/components/ModuleFour";
import { isModule2SourcePreparationCompleteForUser } from "@/lib/module2/module2SourceReadiness";

export default async function ModuleFourPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const sourcesReady = await isModule2SourcePreparationCompleteForUser(email);
  if (!sourcesReady) {
    redirect("/modules/2");
  }

  const {
    initialModule3,
    initialTchartEntries,
    initialStudentBuckets,
    speechOriginalUrl,
    letterOriginalUrl,
    upstreamArtifacts,
  } = await loadModule4PageData(email);

  return (
    <ModuleFour
      initialModule3={initialModule3}
      initialTchartEntries={initialTchartEntries}
      initialStudentBuckets={initialStudentBuckets}
      initialUpstreamArtifacts={upstreamArtifacts}
      speechOriginalUrl={speechOriginalUrl}
      letterOriginalUrl={letterOriginalUrl}
    />
  );
}
