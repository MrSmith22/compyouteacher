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
import { seedEvidenceToArgumentSlice } from "@/lib/dev/seeds/seedEvidenceToArgumentSlice";
import { seedVocabularyTransferLesson } from "@/lib/dev/seeds/seedVocabularyTransferLesson";
import { seedEthosTransferLesson } from "@/lib/dev/seeds/seedEthosTransferLesson";

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
  | "wholeEssayReview"
  | "evidenceToArgumentSlice"
  | "ethosTransferLesson"
  | "vocabularyTransferLesson";

export async function runSeedThrough(
  userEmail: string,
  target: SeedThroughTarget,
  module9Options?: SeedModule9Options,
  seedOptions?: { variant?: string }
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
    case "evidenceToArgumentSlice":
      return seedEvidenceToArgumentSlice(userEmail, {
        variant: seedOptions?.variant,
      });
    case "ethosTransferLesson":
      return seedEthosTransferLesson(userEmail, {
        variant: seedOptions?.variant,
      });
    case "vocabularyTransferLesson":
      return seedVocabularyTransferLesson(userEmail, {
        variant: seedOptions?.variant,
      });
    default:
      return { ok: false as const, error: `Unknown seed target: ${String(target)}` };
  }
}
