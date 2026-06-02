import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getTChartEntriesAdmin } from "@/lib/supabase/helpers/tchartEntries";
import { resolveModuleOriginalUrls } from "@/lib/module4/resolveModuleSourceUrls";
import ModuleFour from "@/components/ModuleFour";

export default async function ModuleFourPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    redirect("/");
  }

  const supabase = getSupabaseAdmin();

  const [m3Res, tchartRes, bucketsRes, m2Res] = await Promise.all([
    supabase
      .from("module3_responses")
      .select("thesis, structure_choice, responses")
      .eq("user_email", email)
      .maybeSingle(),
    getTChartEntriesAdmin({ userEmail: email }),
    supabase
      .from("student_buckets")
      .select("*")
      .eq("user_email", email)
      .eq("module", 4)
      .maybeSingle(),
    supabase
      .from("module2_sources")
      .select("mlk_url, lfbj_url")
      .eq("user_email", email)
      .maybeSingle(),
  ]);

  const tchartRows = tchartRes.data ?? [];
  const { speechOriginalUrl, letterOriginalUrl } = resolveModuleOriginalUrls({
    module2Row: m2Res.data ?? null,
    tchartRows,
  });

  return (
    <ModuleFour
      initialModule3={m3Res.data ?? null}
      initialTchartEntries={tchartRows}
      initialStudentBuckets={bucketsRes.data ?? null}
      speechOriginalUrl={speechOriginalUrl}
      letterOriginalUrl={letterOriginalUrl}
    />
  );
}
