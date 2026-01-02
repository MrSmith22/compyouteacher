"use client";
import dynamic from "next/dynamic";

const ModuleEight = dynamic(() => import("../../../components/ModuleEight"), {
  ssr: false,
});

export default function Page() {
  return <ModuleEight />;
}