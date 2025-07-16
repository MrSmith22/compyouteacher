"use client";

import ObservationsPage from "@/components/ObservationsPage";

export default function ModuleTwoStep6() {
  return (
    <ObservationsPage
      step={6}
      category="audience"
      title="Audience Observations"
      instructions="In this step, you’ll write down examples of how Dr. King considers his *Audience* — who he is addressing and how he tailors his speech and letter to connect with them."
      nextStep="/modules/2/step7"
    />
  );
}
