import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;

  if (!email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("module1_quiz_results")
      .select("score, total")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("module1_quiz_result GET error:", error);
      return NextResponse.json({ error: "Could not load quiz result" }, { status: 500 });
    }

    if (!data || data.total == null || data.total === 0) {
      return NextResponse.json({ score: null, total: null, percent: null });
    }

    const percent = Math.round((Number(data.score) / Number(data.total)) * 100);
    return NextResponse.json({
      score: data.score,
      total: data.total,
      percent,
    });
  } catch (err) {
    console.error("module1_quiz_result GET error:", err);
    return NextResponse.json({ error: "Could not load quiz result" }, { status: 500 });
  }
}
