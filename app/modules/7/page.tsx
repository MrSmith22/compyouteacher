"use client";
import dynamic from "next/dynamic";

// Keep using your existing JS component
const ModuleSeven = dynamic(
  () => import("../../../components/ModuleSeven"),
  { ssr: false }
);

export default function Module7Page() {
  return <ModuleSeven />;
}