"use client";

import ObservationsPage from "@/components/ObservationsPage";

export default function ModuleTwoStep7() {
  return (
    <ObservationsPage
      step={7}
      category="purpose"
      title="Purpose Observations"
      instructions="In this final step, you’ll write down examples that show Dr. King’s overall *Purpose* — what he hopes to achieve with his speech and letter."
      nextStep="/modules/2/success"
    />
  );
}
