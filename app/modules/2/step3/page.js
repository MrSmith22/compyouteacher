"use client";

import ObservationsPage from "@/components/ObservationsPage";

export default function ModuleTwoStep3() {
  return (
    <ObservationsPage
      step={3}
      category="ethos"
      title="Ethos Observations"
      instructions="In this step, you’ll write down examples of *Ethos* — where Dr. King builds trust, shows expertise, or moral character in his speech and letter. Find at least one example in each."
      nextStep="/modules/2/step4"
    />
  );
}
