import { supabase } from "@/lib/supabaseClient";

export async function getStudentOutline({
  userEmail,
  module,
}: {
  userEmail: string;
  module: number;
}) {
  return supabase
    .from("student_outlines")
    .select("*")
    .eq("user_email", userEmail)
    .eq("module", module)
    .single();
}

export async function upsertStudentOutline({
  userEmail,
  module,
  outline,
}: {
  userEmail: string;
  module: number;
  outline: unknown;
}) {
  return supabase.from("student_outlines").upsert({
    user_email: userEmail,
    module,
    outline,
    updated_at: new Date().toISOString(),
  });
}
