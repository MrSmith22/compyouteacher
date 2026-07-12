import { supabase } from "@/lib/supabaseClient";
import {
  buildOutlineUpsertRow,
  resolveFinalizedWriteValue,
} from "@/lib/module5/outlinePersistenceHelpers";

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
  finalized,
}: {
  userEmail: string;
  module: number;
  outline: unknown;
  finalized?: unknown;
}) {
  const row = buildOutlineUpsertRow({
    userEmail,
    module: moduleNumber,
    outline,
    finalized,
  });

  // Belt-and-suspenders: never pass non-boolean finalized into Supabase.
  const resolved = resolveFinalizedWriteValue(finalized);
  if (!resolved.include && "finalized" in row) {
    delete (row as { finalized?: boolean }).finalized;
  }

  return supabase.from("student_outlines").upsert(row, {
    onConflict: "user_email,module",
  });
}
