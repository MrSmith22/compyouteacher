import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { setCurrentModule } from "@/lib/dev/devPanelServer";
import { seedModule2 } from "@/lib/dev/seeds/seedModule2";
import {
  SEED_PROOF_PLAN,
  SEED_THESIS,
  nowIso,
} from "@/lib/dev/seeds/seedContent";

/**
 * Seed Module 3 analysis artifacts so Module 4 can open with a thesis.
 */
export async function seedModule3(userEmail: string) {
  const prior = await seedModule2(userEmail);
  if (!prior.ok) return prior;

  const supabase = getSupabaseAdmin();
  const now = nowIso();
  const evidenceIds = [
    "tchart:speech:ethos",
    "tchart:letter:ethos",
    "tchart:speech:pathos",
    "tchart:letter:pathos",
  ];

  const clusters = [
    {
      id: "seed-cluster-1",
      name: "Credibility and urgency across audiences",
      reflection: "King earns trust and creates urgency in both texts.",
      evidenceIds,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const flowState = {
    v: 1,
    step: 8,
    wantThirdBucket: false,
    patternChoice: "seed-pattern-1",
    module3Patterns: [
      {
        id: "seed-pattern-1",
        text: "King adapts ethos and pathos to fit each audience while keeping the same moral goal.",
        evidenceIds,
        createdAt: now,
        updatedAt: now,
      },
    ],
    module3SelectedPatternId: "seed-pattern-1",
    module3Idea: {
      statement: "King changes his rhetorical approach depending on who must be persuaded.",
      whyMatters: "It shows that the same argument can be framed differently for different listeners.",
      clusterId: "seed-cluster-1",
      patternId: "seed-pattern-1",
      evidenceMap: Object.fromEntries(
        evidenceIds.map((id) => [id, { selected: true, relation: "supports", note: "" }])
      ),
    },
    module3Claim: {
      workingClaim:
        "King uses ethos and pathos differently in the speech and the letter to reach each audience.",
      supportRationale:
        "Public celebration needs inspiration; the clergymen need respectful, careful proof.",
      clusterId: "seed-cluster-1",
      patternId: "seed-pattern-1",
    },
    module3Thesis: {
      thesis: SEED_THESIS,
      proofPlan: SEED_PROOF_PLAN,
      clusterId: "seed-cluster-1",
      patternId: "seed-pattern-1",
    },
  };

  const { error: bucketError } = await supabase.from("student_buckets").upsert(
    {
      user_email: userEmail,
      module: 3,
      buckets: clusters,
      reflection: "Seeded Module 3 analysis for developer testing.",
      flow_state: flowState,
      updated_at: now,
    },
    { onConflict: "user_email,module" }
  );
  if (bucketError) {
    return { ok: false as const, error: bucketError.message };
  }

  const { error: responsesError } = await supabase.from("module3_responses").upsert(
    {
      user_email: userEmail,
      thesis: SEED_THESIS,
      structure_choice: "seed-pattern-1",
      responses: [
        "a public crowd seeking hope",
        "to inspire action for civil rights",
        "clergymen who questioned protest",
        "to defend nonviolent direct action",
      ],
      updated_at: now,
    },
    { onConflict: "user_email" }
  );
  if (responsesError) {
    return { ok: false as const, error: responsesError.message };
  }

  const progress = await setCurrentModule(userEmail, 4);
  if (!progress.ok) {
    return { ok: false as const, error: progress.error || "Failed to set module" };
  }

  return { ok: true as const, currentModule: progress.module };
}
