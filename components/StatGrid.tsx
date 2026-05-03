import { cn } from "@/lib/cn";

interface Stat {
  label: string;
  value: string;
  sub?: string;
}

export function StatGrid({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <dl
      className={cn(
        "grid grid-cols-2 gap-x-4 gap-y-3 border-y border-rule py-4 sm:grid-cols-3",
        className
      )}
    >
      {stats.map((s) => (
        <div key={s.label} className="min-w-0">
          <dt className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            {s.label}
          </dt>
          <dd
            className="mt-1 truncate font-mono text-[20px] leading-tight text-ink"
            data-numeric
            title={s.value}
          >
            {s.value}
          </dd>
          {s.sub && (
            <dd className="mt-0.5 truncate font-mono text-[10px] text-ink-mute" data-numeric>
              {s.sub}
            </dd>
          )}
        </div>
      ))}
    </dl>
  );
}
