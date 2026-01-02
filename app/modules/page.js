"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import ModuleOne from "@/components/ModuleOne";
import { logActivity } from "@/lib/logActivity";
import { supabase } from "@/lib/supabaseClient";

export default function ModulesPage() {
  const { data: session } = useSession();

  useEffect(() => {
    async function logAndSync() {
      const email = session?.user?.email;
      if (!email) return;

      // 1) Log activity: student opened the modules page (module 1)
      try {
        await logActivity(email, "module_started", { module: 1 });
      } catch (err) {
        console.error("Error logging activity for module 1:", err);
      }

      // 2) Create or update a row in student_assignments
      try {
        // Check if this student already has an MLK Essay assignment row
        const { data: existing, error: selectError } = await supabase
          .from("student_assignments")
          .select("id")
          .eq("user_email", email)
          .eq("assignment_name", "MLK Essay Assignment")
          .maybeSingle();

        if (selectError) {
          console.error("Error checking existing assignment:", selectError);
        }

        if (!existing) {
          // No row yet -> insert a new one
          const { error: insertError } = await supabase
            .from("student_assignments")
            .insert({
              user_email: email,
              assignment_name: "MLK Essay Assignment",
              current_module: 1,
              status: "in progress",
            });

          if (insertError) {
            console.error("Error inserting student_assignment:", insertError);
          } else {
            console.log("✅ Created student_assignment row for", email);
          }
        } else {
          // Row exists -> just keep it in sync
          const { error: updateError } = await supabase
            .from("student_assignments")
            .update({
              current_module: 1,
              status: "in progress",
            })
            .eq("id", existing.id);

          if (updateError) {
            console.error("Error updating student_assignment:", updateError);
          } else {
            console.log("✅ Updated student_assignment row for", email);
          }
        }
      } catch (err) {
        console.error("Unexpected error syncing student_assignments:", err);
      }
    }

    logAndSync();
  }, [session]);

  return (
    <div className="min-h-screen bg-theme-light text-theme-dark p-6">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6 space-y-4">
        <h1 className="text-3xl font-bold text-center text-theme-red mb-2">
          MLK Essay Modules
        </h1>
        <p className="text-center text-lg text-gray-700 mb-4">
          Work through the modules step by step to develop your rhetorical
          analysis.
        </p>

        <ModuleOne />
      </div>
    </div>
  );
}