"use client";

import ObservationsPage from "@/components/ObservationsPage";

export default function ModuleTwoStep5() {
  return (
    <ObservationsPage
      step={5}
      category="logos"
      title="Logos Observations"
      instructions="In this step, you’ll write down examples of *Logos* — where Dr. King uses facts, logic, or reasoning to persuade his audience in the speech and letter."
      nextStep="/modules/2/step6"
    />
  );
}
