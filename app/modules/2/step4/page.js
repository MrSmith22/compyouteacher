"use client";

import ObservationsPage from "@/components/ObservationsPage";

export default function ModuleTwoStep4() {
  return (
    <ObservationsPage
      step={4}
      category="pathos"
      title="Pathos Observations"
      instructions="In this step, you’ll write down examples of *Pathos* (emotional appeals) from Dr. King’s speech and letter. Look for where he uses emotion — like sadness, hope, anger — to persuade his audience. Find at least one or two examples."
      nextStep="/modules/2/step5"
    />
  );
}
