// JavaScript source code
"use client";
import dynamic from "next/dynamic";
const ModuleSeven = dynamic(() => import("../../../components/ModuleSeven"), { ssr: false });

export default function Page() {
  return <ModuleSeven />;
}
