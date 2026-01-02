
"use client";

// JavaScript source code

import dynamic from "next/dynamic";
const ModuleSix = dynamic(()=>import("../../../components/ModuleSix"),{ ssr:false });

export default function Page(){ return <ModuleSix/> }
