import type { SaffirCat } from "@/lib/types";
import { CAT_COLORS, CAT_LABELS, CAT_FULL_LABELS } from "@/lib/saffir";
import { cn } from "@/lib/cn";

interface Props {
  cat: SaffirCat;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "outline";
  className?: string;
  label?: string;
  full?: boolean;
}

export function CategoryChip({ cat, size = "md", variant = "solid", className, label, full }: Props) {
  const color = CAT_COLORS[cat];
  const text = label ?? (full ? CAT_FULL_LABELS[cat] : CAT_LABELS[cat]);
  const sz =
    size === "sm" ? "text-[10px] px-1.5 py-[1px]" :
    size === "lg" ? "text-[13px] px-2.5 py-1" :
    "text-[11px] px-2 py-0.5";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border font-mono uppercase tracking-eyebrow",
        sz,
        variant === "solid" ? "text-paper" : "bg-paper",
        className
      )}
      style={
        variant === "solid"
          ? { backgroundColor: color, borderColor: color }
          : { color, borderColor: color }
      }
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: variant === "solid" ? "rgba(253,253,251,0.85)" : color }} />
      {text}
    </span>
  );
}
