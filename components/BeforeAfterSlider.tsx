"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ImageSide {
  resolvedUrl: string;
  date: string;
  source: string;
  attribution: string;
}

interface Props {
  label: string;
  before: ImageSide;
  after: ImageSide;
  height?: number;
}

export function BeforeAfterSlider({ label, before, after, height = 360 }: Props) {
  const [pct, setPct] = useState(50);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClient = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const next = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPct(next);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => { if (dragging.current) setFromClient(e.clientX); };
    const onUp = () => { dragging.current = false; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setFromClient]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") setPct((p) => Math.max(0, p - 5));
    else if (e.key === "ArrowRight") setPct((p) => Math.min(100, p + 5));
    else if (e.key === "Home") setPct(0);
    else if (e.key === "End") setPct(100);
  };

  return (
    <figure className="my-6">
      <div className="mb-2 flex items-baseline justify-between">
        <figcaption className="font-mono text-[11px] uppercase tracking-eyebrow text-ink-soft">
          {label}
        </figcaption>
        <span className="font-mono text-[10px] text-ink-mute" data-numeric>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div
        ref={ref}
        className="relative w-full overflow-hidden border border-rule bg-paper-dim"
        style={{ height }}
        onMouseDown={(e) => { dragging.current = true; setFromClient(e.clientX); }}
        onTouchStart={(e) => { const t = e.touches[0]; if (t) setFromClient(t.clientX); }}
        onTouchMove={(e) => { const t = e.touches[0]; if (t) setFromClient(t.clientX); }}
      >
        <img
          src={before.resolvedUrl}
          alt={`Before — ${label} on ${before.date}`}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        <div
          className="absolute inset-0 h-full w-full"
          style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
        >
          <img
            src={after.resolvedUrl}
            alt={`After — ${label} on ${after.date}`}
            className="h-full w-full object-cover"
            draggable={false}
          />
        </div>
        <div
          role="slider"
          tabIndex={0}
          aria-label={`Before/after slider for ${label}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
          onKeyDown={onKeyDown}
          className="absolute top-0 h-full w-px cursor-col-resize bg-ink"
          style={{ left: `${pct}%` }}
        >
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-rule bg-paper px-2 py-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink">
            <span className="mr-1">{"<"}</span>
            <span>{">"}</span>
          </span>
        </div>
        <span className="absolute left-3 top-3 border border-rule bg-paper/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink">
          Before — <span data-numeric>{before.date}</span>
        </span>
        <span className="absolute right-3 top-3 border border-rule bg-paper/90 px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink">
          After — <span data-numeric>{after.date}</span>
        </span>
      </div>
      <p className="mt-2 font-mono text-[10px] text-ink-mute">
        {before.attribution} · {after.attribution}
      </p>
    </figure>
  );
}
