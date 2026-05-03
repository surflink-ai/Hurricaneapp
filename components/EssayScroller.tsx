"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import type { NarrativeChapter, Observation } from "@/lib/types";
import type { CAT_COLORS } from "@/lib/saffir";

const StoryMap = dynamic(
  () => import("./StoryMap").then((m) => ({ default: m.StoryMap })),
  { ssr: false, loading: () => <div className="h-full w-full bg-paper-dim" /> }
);

interface Props {
  chapters: NarrativeChapter[];
  observations: ReadonlyArray<Observation>;
  bbox: [number, number, number, number];
  peakCat: keyof typeof CAT_COLORS;
  beforeContent?: React.ReactNode;
  afterContent?: React.ReactNode;
}

export function EssayScroller({
  chapters,
  observations,
  bbox,
  peakCat,
  beforeContent,
  afterContent
}: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-step"));
            if (Number.isFinite(idx)) setActiveIndex(idx);
          }
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    for (const el of stepRefs.current) {
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [chapters.length]);

  const active = chapters[activeIndex];

  return (
    <div
      ref={containerRef}
      className="relative grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]"
    >
      <div className="relative px-6 py-12 sm:px-10 lg:px-12 lg:py-16">
        {beforeContent}
        <ol className="relative space-y-[60vh]">
          {chapters.map((ch, i) => (
            <li
              key={ch.id}
              ref={(el) => { stepRefs.current[i] = el; }}
              data-step={i}
              className="max-w-[44ch]"
            >
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                <span data-numeric>{String(i + 1).padStart(2, "0")}</span> · {ch.kind.replace("-", " ")}
              </p>
              <h3 className="mt-1 font-display text-[26px] font-medium leading-tight text-ink">
                {ch.title}
              </h3>
              <p className="mt-3 text-[15px] leading-relaxed text-ink">
                {ch.prose}
              </p>
            </li>
          ))}
        </ol>
        {afterContent}
      </div>
      <div className="sticky top-0 hidden h-[100vh] w-full lg:block">
        <div className="relative h-full w-full">
          <StoryMap
            observations={observations}
            bbox={bbox}
            peakCat={peakCat}
            cameraBbox={active?.cameraBbox ?? null}
            focusObsIndex={active?.focusObsIndex ?? null}
          />
          <div className="pointer-events-none absolute bottom-4 left-4 max-w-[40%] border border-rule bg-paper/95 px-3 py-2">
            <p className="font-mono text-[9px] uppercase tracking-eyebrow text-ink-soft">
              Chapter <span data-numeric>{String(activeIndex + 1).padStart(2, "0")} / {String(chapters.length).padStart(2, "0")}</span>
            </p>
            <p className="font-display text-[14px] text-ink">{active?.title}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
