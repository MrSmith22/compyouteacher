import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/authOptions";
import { isDevToolingEnabled } from "@/lib/dev/isDevToolingEnabled";
import {
  completeCurrentModule,
  deleteGoogleDocRecord,
  getDevPanelStatus,
  prepareGoogleDocExport,
  resetCurrentModule,
  restartEntireAssignment,
  restartModule1,
  setCurrentModule,
  setModule9Shortcut,
  simulateMissingExportedDoc,
  simulateStaleGoogleDoc,
  simulateVerifiedGoogleDoc,
  simulateTemporaryVerificationFailure,
  simulateDocContentMismatch,
} from "@/lib/dev/devPanelServer";
import { runSeedThrough, type SeedThroughTarget } from "@/lib/dev/seeds";
import type { SeedModule9Options } from "@/lib/dev/seeds/seedModule9Ready";

function deny() {
  return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
}

async function requireDevSession() {
  if (!isDevToolingEnabled()) return { error: deny() as NextResponse };
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  if (!email) {
    return {
      error: NextResponse.json(
        { ok: false, error: "not_signed_in" },
        { status: 401 }
      ),
    };
  }
  return { email };
}

export async function GET() {
  const auth = await requireDevSession();
  if ("error" in auth && auth.error) return auth.error;

  try {
    const status = await getDevPanelStatus(auth.email!);
    return NextResponse.json({ ok: true, status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "status_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireDevSession();
  if ("error" in auth && auth.error) return auth.error;
  const email = auth.email!;

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const action = typeof body.action === "string" ? body.action : "";

  try {
    switch (action) {
      case "setModule": {
        const moduleNumber = Number(body.module);
        const result = await setCurrentModule(email, moduleNumber);
        return NextResponse.json(result);
      }
      case "previousModule": {
        const status = await getDevPanelStatus(email);
        const next = Math.max(1, (status.currentModule ?? 1) - 1);
        const result = await setCurrentModule(email, next);
        return NextResponse.json(result);
      }
      case "nextModule": {
        const status = await getDevPanelStatus(email);
        const next = Math.min(10, (status.currentModule ?? 1) + 1);
        const result = await setCurrentModule(email, next);
        return NextResponse.json(result);
      }
      case "completeCurrentModule": {
        const result = await completeCurrentModule(email);
        return NextResponse.json(result);
      }
      case "resetCurrentModule": {
        const moduleNumber =
          body.module != null ? Number(body.module) : undefined;
        const result = await resetCurrentModule(email, moduleNumber);
        return NextResponse.json(result);
      }
      case "restartModule1": {
        const result = await restartModule1(email);
        return NextResponse.json(result);
      }
      case "restartEntireAssignment": {
        const result = await restartEntireAssignment(email);
        return NextResponse.json(result);
      }
      case "module9Shortcut": {
        const key = body.key as
          | "googleDoc"
          | "checklist"
          | "quiz"
          | "pdf"
          | "moduleComplete";
        const enabled = !!body.enabled;
        const result = await setModule9Shortcut(email, key, enabled);
        return NextResponse.json(result);
      }
      case "prepareGoogleDocExport": {
        const result = await prepareGoogleDocExport(email);
        return NextResponse.json(result);
      }
      case "deleteGoogleDoc": {
        const result = await deleteGoogleDocRecord(email);
        return NextResponse.json(result);
      }
      case "simulateMissingExportedDoc": {
        const result = await simulateMissingExportedDoc(email);
        return NextResponse.json(result);
      }
      case "simulateStaleGoogleDoc": {
        const result = await simulateStaleGoogleDoc(email);
        return NextResponse.json(result);
      }
      case "simulateVerifiedGoogleDoc": {
        const result = await simulateVerifiedGoogleDoc(email);
        return NextResponse.json(result);
      }
      case "simulateTemporaryVerificationFailure": {
        const result = await simulateTemporaryVerificationFailure(email);
        return NextResponse.json(result);
      }
      case "simulateDocContentMismatch": {
        const result = await simulateDocContentMismatch(email);
        return NextResponse.json(result);
      }
      case "seedThrough": {
        const targetRaw = body.target;
        let target: SeedThroughTarget | null = null;
        if (
          targetRaw === 2 ||
          targetRaw === 3 ||
          targetRaw === 4 ||
          targetRaw === 5 ||
          targetRaw === 6 ||
          targetRaw === 7 ||
          targetRaw === "2" ||
          targetRaw === "3" ||
          targetRaw === "4" ||
          targetRaw === "5" ||
          targetRaw === "6" ||
          targetRaw === "7"
        ) {
          target = Number(targetRaw) as 2 | 3 | 4 | 5 | 6 | 7;
        } else if (
          targetRaw === "completeEssay" ||
          targetRaw === "module9Ready" ||
          targetRaw === "bpVerticalSlice" ||
          targetRaw === "introConclusionVerticalSlice" ||
          targetRaw === "allRequiredBodyParagraphs" ||
          targetRaw === "wholeEssayReview" ||
          targetRaw === "evidenceToArgumentSlice" ||
          targetRaw === "ethosTransferLesson" ||
          targetRaw === "vocabularyTransferLesson" ||
          targetRaw === "guidedApaProtocol"
        ) {
          target = targetRaw;
        }

        if (!target) {
          return NextResponse.json(
            { ok: false, error: "Invalid seed target" },
            { status: 400 }
          );
        }

        const module9Options =
          body.module9Options && typeof body.module9Options === "object"
            ? (body.module9Options as SeedModule9Options)
            : undefined;

        const seedOptions =
          body.seedOptions && typeof body.seedOptions === "object"
            ? (body.seedOptions as { variant?: string })
            : body.variant
              ? { variant: String(body.variant) }
              : undefined;

        const result = await runSeedThrough(email, target, module9Options, seedOptions);
        return NextResponse.json(result);
      }
      case "status": {
        const status = await getDevPanelStatus(email);
        return NextResponse.json({ ok: true, status });
      }
      case "wp099TeacherProgressFixtures": {
        // Dev-only: return synthetic roster identity list (never writes production tables).
        const { buildWp099SyntheticRosterRows } =
          await import("@/lib/teacher/teacherProgressFixtures.js");
        const students = buildWp099SyntheticRosterRows();
        return NextResponse.json({
          ok: true,
          assignmentId: "mlk-rhetorical-analysis",
          source: "fixtures",
          count: students.length,
          studentIds: students.map((s) => s.studentId),
          openPath: "/modules/10",
        });
      }
      case "ensureDevTeacherRole": {
        const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
        const supabase = getSupabaseAdmin();
        const { error } = await supabase.from("app_roles").upsert(
          { user_email: email, role: "teacher" },
          { onConflict: "user_email" }
        );
        if (error) {
          return NextResponse.json(
            { ok: false, error: error.message },
            { status: 500 }
          );
        }
        return NextResponse.json({ ok: true, role: "teacher", email });
      }
      default:
        return NextResponse.json(
          { ok: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "action_failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
