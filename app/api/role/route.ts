import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  // 1) Who is logged in?
  const session = await getServerSession(authOptions);

  // 2) If not logged in, treat as student
  const email = session?.user?.email;
  if (!email) {
    return NextResponse.json({ role: "student" }, { status: 200 });
  }

  // 3) Admin client
  const supabase = getSupabaseAdmin();

  // 4) Look up role by email
  const { data, error } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", email)
    .maybeSingle();

  if (error) {
    console.error("role lookup error", error);
    return NextResponse.json({ role: "student" }, { status: 200 });
  }

  // 5) Default to student when not found
  return NextResponse.json({ role: data?.role ?? "student" }, { status: 200 });
}