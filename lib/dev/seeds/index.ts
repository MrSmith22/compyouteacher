import { seedModule2 } from "@/lib/dev/seeds/seedModule2";
import { seedModule3 } from "@/lib/dev/seeds/seedModule3";
import { seedModule4 } from "@/lib/dev/seeds/seedModule4";
import { seedModule5 } from "@/lib/dev/seeds/seedModule5";
import { seedModule6 } from "@/lib/dev/seeds/seedModule6";
import { seedModule7 } from "@/lib/dev/seeds/seedModule7";
import { seedCompleteEssay } from "@/lib/dev/seeds/seedCompleteEssay";
import {
  seedModule9Ready,
  type SeedModule9Options,
} from "@/lib/dev/seeds/seedModule9Ready";
import { seedBodyParagraphVerticalSlice } from "@/lib/dev/seeds/seedBodyParagraphVerticalSlice";
import { seedIntroConclusionVerticalSlice } from "@/lib/dev/seeds/seedIntroConclusionVerticalSlice";
import { seedAllRequiredBodyParagraphs } from "@/lib/dev/seeds/seedAllRequiredBodyParagraphs";
import { seedWholeEssayReview } from "@/lib/dev/seeds/seedWholeEssayReview";

export type SeedThroughTarget =
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | "completeEssay"
  | "module9Ready"
  | "bpVerticalSlice"
  | "introConclusionVerticalSlice"
  | "allRequiredBodyParagraphs"
  | "wholeEssayReview";

export async function runSeedThrough(
  userEmail: string,
  target: SeedThroughTarget,
  module9Options?: SeedModule9Options
) {
  switch (target) {
    case 2:
      return seedModule2(userEmail);
    case 3:
      return seedModule3(userEmail);
    case 4:
      return seedModule4(userEmail);
    case 5:
      return seedModule5(userEmail);
    case 6:
      return seedModule6(userEmail);
    case 7:
      return seedModule7(userEmail);
    case "completeEssay":
      return seedCompleteEssay(userEmail);
    case "module9Ready":
      return seedModule9Ready(userEmail, module9Options);
    case "bpVerticalSlice":
      return seedBodyParagraphVerticalSlice(userEmail);
    case "introConclusionVerticalSlice":
      return seedIntroConclusionVerticalSlice(userEmail);
    case "allRequiredBodyParagraphs":
      return seedAllRequiredBodyParagraphs(userEmail);
    case "wholeEssayReview":
      return seedWholeEssayReview(userEmail);
    default:
      return { ok: false as const, error: `Unknown seed target: ${String(target)}` };
  }
}
