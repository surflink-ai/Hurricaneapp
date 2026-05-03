import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { IndexHydrator } from "@/components/IndexHydrator";
import { loadIndex } from "@/lib/data";
import { ESSAYS } from "@/content/essays";

export const metadata = {
  title: "Essays",
  description: "Long-form, scroll-driven essays on landmark North Atlantic hurricanes."
};

export default async function EssayIndex() {
  const idx = await loadIndex();
  return (
    <>
      <Header totalRecords={idx.storms.length} />
      <LiveTicker />
      <IndexHydrator index={idx.storms} />
      <main id="main" className="mx-auto max-w-[900px] px-6 py-14">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Essays</p>
        <h1 className="mt-1 font-display text-[44px] font-medium leading-tight text-ink">
          Long-form readings of the record
        </h1>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
          Three featured essays drive the basin map alongside hand-written prose.
          Every other named storm has its own auto-derived narrative under <span className="font-mono">/storm/[id]</span>.
        </p>
        <ul className="mt-10 divide-y divide-rule/40 border-y border-rule">
          {ESSAYS.map((e) => (
            <li key={e.slug}>
              <Link
                href={`/essay/${e.slug}`}
                className="flex items-baseline justify-between gap-4 py-5 hover:bg-paper-dim"
              >
                <div className="min-w-0">
                  <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
                    {e.eyebrow}
                  </p>
                  <h2 className="mt-1 font-display text-[24px] leading-tight text-ink">{e.title}</h2>
                  <p className="mt-2 max-w-[60ch] text-[13px] text-ink-soft">{e.dek}</p>
                </div>
                <ArrowRight size={14} strokeWidth={1.6} className="shrink-0 text-ink-soft" />
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
