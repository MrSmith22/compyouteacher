import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule3 } from "@/lib/dev/seeds/seedModule3";
import { SEED_PROOF_PLAN, SEED_TCHART, nowIso } from "@/lib/dev/seeds/seedContent";

function snippetFor(category: string, type: string) {
  const row = SEED_TCHART.find((r) => r.category === category && r.type === type);
  return {
    quote: row?.quote ?? "",
    observation: row?.observation ?? "",
  };
}

/**
 * Seed Module 4 paragraph plans so Module 5 can import outline cards.
 */
export async function seedModule4(userEmail: string) {
  const prior = await seedModule3(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();

  const buckets = [
    {
      claim: SEED_PROOF_PLAN[0],
      reasoning:
        "King earns trust with Lincoln echoes in the speech and respectful address in the letter.",
      evidenceKeys: ["ethos|speech", "ethos|letter"],
      evidenceSnippets: [snippetFor("ethos", "speech"), snippetFor("ethos", "letter")],
      paragraphRole: "ethos",
      suggestionId: "seed-b1",
    },
    {
      claim: SEED_PROOF_PLAN[1],
      reasoning:
        "Emotional images of children and the pain of waiting push each audience to care.",
      evidenceKeys: ["pathos|speech", "pathos|letter"],
      evidenceSnippets: [snippetFor("pathos", "speech"), snippetFor("pathos", "letter")],
      paragraphRole: "pathos",
      suggestionId: "seed-b2",
    },
    {
      claim: SEED_PROOF_PLAN[2],
      reasoning:
        "King uses the nation's creed and a clear justice argument to prove action is necessary.",
      evidenceKeys: ["logos|speech", "logos|letter"],
      evidenceSnippets: [snippetFor("logos", "speech"), snippetFor("logos", "letter")],
      paragraphRole: "logos",
      suggestionId: "seed-b3",
    },
  ];

  const { error } = await supabase.from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: 4,
      buckets,
      reflection:
        "These three paragraph plans prove the thesis by covering ethos, pathos, and logos across both texts.",
      flow_state: {
        v: 2,
        step: 17,
        wantThirdBucket: true,
        patternChoice: "seed-pattern-1",
      },
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (error) {
    return { ok: false as const, error: error.message };
  }

  const progress = await setCurrentModule(userEmail, 5);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
