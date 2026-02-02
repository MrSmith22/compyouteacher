import { supabase } from "@/lib/supabaseClient";

export async function getStudentOutline({
  userEmail,
  module: moduleNumber,
}: {
  userEmail: string;
  module: number;
}) {
  return supabase
    .from("student_outlines")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", moduleNumber)
    .maybeSingle();
}

export async function upsertStudentOutline({
  userEmail,
  module: moduleNumber,
  outline,
}: {
  userEmail: string;
  module: number;
  outline: unknown;
}) {
  return supabase.from("student_outlines").upsert({
    user_email: userEmail,
    module: moduleNumber,
    outline,
    updated_at: new Date().toISOString(),
  });
}
