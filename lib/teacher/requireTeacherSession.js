/**
 * WP-100 — Shared teacher session gate for teacher API routes.
 * Role check must complete before any student-data query.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const TEACHER_NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "private, no-store",
});

/**
 * @param {unknown} body
 * @param {number} status
 */
export function teacherJson(body, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: TEACHER_NO_STORE_HEADERS,
  });
}

/**
 * Authenticated teacher session, or an error NextResponse.
 * @returns {Promise<{ email: string } | { error: NextResponse }>}
 */
export async function requireTeacherSession() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return {
      error: teacherJson({ ok: false, error: "Not signed in" }, 401),
    };
  }

  const supabase = getSupabaseAdmin();
  const { data: roleRow, error: roleErr } = await supabase
    .from("app_roles")
    .select("role")
    .eq("user_email", email)
    .maybeSingle();

  if (roleErr) {
    return {
      error: teacherJson({ ok: false, error: "Role lookup failed" }, 500),
    };
  }

  if (roleRow?.role !== "teacher") {
    return {
      error: teacherJson({ ok: false, error: "Teacher access only" }, 403),
    };
  }

  return { email };
}
