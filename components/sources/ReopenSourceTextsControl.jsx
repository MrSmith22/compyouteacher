"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  isSourceWindowOpen,
  openSavedSourceText,
  openSavedSourceTexts,
} from "@/lib/sources/openSavedSourceTexts";

/**
 * Reusable control to reopen saved speech/letter working copies.
 * Safe for Module 3+ evidence workflows: does not reset analysis state.
 */
export default function ReopenSourceTextsControl({
  includeSpeech = true,
  includeLetter = true,
  className = "",
}) {
  const speechRef = useRef(null);
  const letterRef = useRef(null);
  const [bothOpen, setBothOpen] = useState(false);

  const refreshOpenState = useCallback(() => {
    const speechOk = !includeSpeech || isSourceWindowOpen(speechRef.current);
    const letterOk = !includeLetter || isSourceWindowOpen(letterRef.current);
    setBothOpen(speechOk && letterOk);
  }, [includeSpeech, includeLetter]);

  useEffect(() => {
    refreshOpenState();
    const id = window.setInterval(refreshOpenState, 1000);
    const onFocus = () => refreshOpenState();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshOpenState]);

  const handleReopen = () => {
    if (includeSpeech && includeLetter) {
      const opened = openSavedSourceTexts({ speech: true, letter: true });
      speechRef.current = opened.speech;
      letterRef.current = opened.letter;
    } else if (includeSpeech) {
      speechRef.current = openSavedSourceText("speech");
    } else if (includeLetter) {
      letterRef.current = openSavedSourceText("letter");
    }
    refreshOpenState();
  };

  if (!includeSpeech && !includeLetter) {
    return null;
  }

  if (bothOpen) {
    return null;
  }

  return (
    <div
      className={`rounded-lg border border-theme-blue/25 bg-theme-light/80 px-3 py-2 text-left ${className}`}
    >
      <p className="mb-2 text-xs leading-relaxed text-theme-dark/80">
        Closed a source tab? Open your saved copies again without leaving this page.
      </p>
      <button
        type="button"
        onClick={handleReopen}
        className="rounded-md border border-theme-blue/40 bg-white px-3 py-2 text-sm font-medium text-theme-dark shadow-sm transition hover:bg-theme-blue/10"
      >
        Reopen Source Texts
      </button>
    </div>
  );
}
