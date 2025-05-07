// JavaScript source code
// components/ModuleSix.js
"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "../lib/supabaseClient";

export default function ModuleSix() {
  const { data: session } = useSession();

  /* ---------- local state ---------- */
  const [outline, setOutline]       = useState(null);   // final outline (M‑5)
  const [observations, setObs]      = useState([]);     // T‑chart notes
  const [draft, setDraft]           = useState([]);     // array of section strings
  const [locked, setLocked]         = useState(false);  // after “complete”
  const [sideOpen, setSideOpen]     = useState(false);  // slide‑out panel
  const [outlineRef, setOutlineRef] = useState(null);   // final outline
  const [notesRef,   setNotesRef]   = useState([]);     // raw observations

  /* ---------------------------------- */

  /* ---------- helper: roman numerals ---------- */
  const roman = (n)=>
    ["I","II","III","IV","V","VI","VII","VIII","IX","X"][n]||`(${n+1})`;
  /* -------------------------------------------- */

  /* 1️⃣  LOAD outline + notes + any saved draft */
  useEffect(()=>{
    const run = async()=>{
      const email = session?.user?.email;
      if(!email) return;

      /* a. outline (must be finalised) */
      const { data: orow } = await supabase
        .from("student_outlines")
        .select("outline,finalized")
        .eq("user_email",email).eq("module",5).single();
      if(!orow?.finalized){ alert("Finish Module 5 first!"); return;}
      setOutline(orow.outline);

      /* b. t‑chart */
      const { data: obs } = await supabase
        .from("tchart_entries")
        .select("*").eq("user_email",email);
      setObs(obs||[]);

      /* c. existing draft row */
      const { data: drow } = await supabase
        .from("student_drafts")
        .select("sections,locked")
        .eq("user_email",email).eq("module",6).single();

      if(drow?.sections)   setDraft(drow.sections);
      if(drow?.locked)     setLocked(true);

      /* d. first time? create empty sections */
      if(!drow?.sections){
        const empty = ["", ...orow.outline.body.map(()=>""), ""];
        setDraft(empty);
      }
    };
    run();
  },[session]);

  /* 2️⃣  DEBOUNCED auto‑save (800 ms) */
  useEffect(()=>{
    if(!session?.user?.email || draft.length===0) return;
    const id=setTimeout(async()=>{
      await supabase.from("student_drafts").upsert({
        user_email:session.user.email,
        module:6,
        sections:draft,
        locked,
        updated_at:new Date().toISOString()
      });
    },800);
    return ()=>clearTimeout(id);
  },[draft,locked,session]);

/* ---------- mutators ---------- */
const update = (idx, val) =>
  locked ? null : setDraft(d => d.map((s, i) => (i === idx ? val : s)));

const saveFullDraft = async () => {
  const fullText = draft.join("\n\n");
  await supabase
    .from("student_drafts")
    .upsert({
      user_email: session.user.email,
      module: 6,
      full_text: fullText,
      sections: draft,
      updated_at: new Date().toISOString()
    });
};


const markComplete = async () => {
  setLocked(true);
  await saveFullDraft(); // ✅ this line makes sure full_text gets saved
  await supabase
    .from("student_drafts")
    .update({ locked: true })
    .eq("user_email", session.user.email)
    .eq("module", 6);
  // later: router.push("/modules/7");
};
/* -------------------------------- */



  if(!outline) return <p className="p-6">Loading…</p>;

  return(
    <div className="flex">
      {/* ===== MAIN writing area ===== */}
      <main className="flex-1 p-6 space-y-8">

        {/* Intro / Thesis */}
        <section>
          <h2 className="text-xl font-bold mb-2">{roman(1)}. Introduction</h2>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
            value={draft[0]||""}
            onChange={e=>update(0,e.target.value)}
            disabled={locked}
          />
        </section>

        {/* Body paragraphs */}
        {outline.body.map((b,i)=>(
          <section key={i}>
            <h2 className="text-xl font-bold mb-2">
              {roman(i+2)}. {b.bucket}
            </h2>
            <textarea
              className="w-full border rounded p-3 min-h-[160px]"
              value={draft[i+1]||""}
              onChange={e=>update(i+1,e.target.value)}
              disabled={locked}
            />
          </section>
        ))}

        {/* Conclusion */}
        <section>
          <h2 className="text-xl font-bold mb-2">
            {roman(outline.body.length+2)}. Conclusion
          </h2>
          <textarea
            className="w-full border rounded p-3 min-h-[120px]"
            value={draft.at(-1) || ""}
            onChange={e=>update(draft.length-1,e.target.value)}
            disabled={locked}
          />
        </section>

        {/* Complete button */}
        <button
          onClick={markComplete}
          disabled={locked}
          className={`mt-6 bg-emerald-700 text-white px-4 py-2 rounded 
            ${locked && "opacity-50 pointer-events-none"}`}
        >
          ✅ Mark Draft Complete & Continue
        </button>
      </main>

      {/* ===== Slide‑out panel ===== */}
      <aside
        className={`fixed right-0 top-0 h-full w-[320px] bg-white border-l
          shadow-lg z-10 p-4 overflow-y-auto transition-transform duration-300
          ${sideOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <button
          onClick={()=>setSideOpen(false)}
          className="absolute top-2 right-3 text-xl"
        >✖</button>

        <h3 className="text-lg font-semibold mb-3">📑 Outline</h3>
        <div className="text-sm mb-4 space-y-1">
  <div>I. Introduction</div>

  {outline.body.map((b, i) => (
    <div key={i}>
      <div className="font-semibold">{roman(i+2)}. {b.bucket}</div>
      <ul className="pl-4 list-disc list-inside text-xs">
        {b.points.map((point, j) => (
          <li key={j}>{point}</li>
        ))}
      </ul>
    </div>
  ))}

  <div>{roman(outline.body.length + 2)}. Conclusion</div>
</div>


        <h3 className="text-lg font-semibold mb-2">🔍 Observations</h3>
        <ul className="text-xs space-y-1">
          {observations.map(o=>(
            <li key={o.id} className="border-b pb-1">
              <strong>{o.category.toUpperCase()}</strong> — 
              {o.speech_note||o.letter_note}
            </li>
          ))}
        </ul>
      </aside>

      {/* toggle btn */}
      <button
        onClick={()=>setSideOpen(s=>!s)}
        className="fixed right-3 bottom-3 z-10 bg-blue-600 text-white p-3
          rounded-full shadow-lg"
      >
        {sideOpen? "➡":"⬅"} Outline / Notes
      </button>
    </div>
  );
}
