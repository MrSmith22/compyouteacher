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
      .select("id")
      .eq("user_email", email)
      .maybeSingle();

    if (error) {
      console.error("module1_quiz_status GET error:", error);
      return NextResponse.json({ error: "Could not check quiz status" }, { status: 500 });
    }

    return NextResponse.json({ completed: !!data });
  } catch (err) {
    console.error("module1_quiz_status GET error:", err);
    return NextResponse.json({ error: "Could not check quiz status" }, { status: 500 });
  }
}
