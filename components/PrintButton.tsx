"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
    >
      <Printer size={11} strokeWidth={1.6} />
      Print broadsheet
    </button>
  );
}
