import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { IndexHydrator } from "@/components/IndexHydrator";
import { CategoryChip } from "@/components/CategoryChip";
import { PrintButton } from "@/components/PrintButton";
import { loadIndex, loadStorm } from "@/lib/data";
import { categoryFromKt } from "@/lib/saffir";
import { fmtCoord, fmtMb } from "@/lib/units";

interface Params { id: string }

export async function generateStaticParams(): Promise<Params[]> {
  const idx = await loadIndex();
  return idx.storms.map((s) => ({ id: s.id }));
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function ObservationsPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const storm = await loadStorm(id);
  if (!storm) notFound();
  const idx = await loadIndex();

  return (
    <>
      <div className="no-print">
        <Header totalRecords={idx.storms.length} />
        <LiveTicker />
        <IndexHydrator index={idx.storms} />
      </div>
      <main id="main" className="mx-auto max-w-[1100px] px-6 py-10">
        <div className="no-print mb-6 flex items-center justify-between">
          <Link
            href={`/storm/${storm.id}`}
            className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-ink"
          >
            <ArrowLeft size={11} strokeWidth={1.6} />
            Narrative
          </Link>
        </div>
        <header className="border-b border-rule pb-6">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            Research record · <span data-numeric>{storm.id}</span>
          </p>
          <h1 className="mt-1 font-display text-[44px] font-medium leading-tight text-ink">
            {titleCase(storm.name)}{" "}
            <span className="font-mono text-[22px] text-ink-mute" data-numeric>
              {storm.year}
            </span>
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <CategoryChip cat={storm.peakCat} full />
            <span className="font-mono text-[11px] text-ink-soft" data-numeric>
              {storm.observations.length} observations · peak {storm.peakKt} kt · min {fmtMb(storm.minMb)}
            </span>
          </div>
        </header>
        <table className="mt-6 w-full border-collapse font-mono text-[11px]">
          <thead className="sticky top-0 bg-paper">
            <tr className="border-b border-rule text-left uppercase tracking-eyebrow text-ink-soft">
              <th className="py-2 pr-4">Date · Time UTC</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2 pr-4">Cat</th>
              <th className="py-2 pr-4">Position</th>
              <th className="py-2 pr-4 text-right">Wind kt</th>
              <th className="py-2 pr-4 text-right">Pressure mb</th>
              <th className="py-2 pr-4">Record</th>
            </tr>
          </thead>
          <tbody>
            {storm.observations.map((o, i) => {
              const cat = categoryFromKt(o.windKt);
              return (
                <tr key={`${o.iso}-${i}`} className="border-b border-rule/30 align-top">
                  <td className="py-1.5 pr-4 text-ink" data-numeric>
                    {o.date} · {o.time.padStart(4, "0")}
                  </td>
                  <td className="py-1.5 pr-4 text-ink-soft">{o.status}</td>
                  <td className="py-1.5 pr-4">
                    <CategoryChip cat={cat} size="sm" variant="outline" />
                  </td>
                  <td className="py-1.5 pr-4 text-ink-soft" data-numeric>{fmtCoord(o.lat, o.lon)}</td>
                  <td className="py-1.5 pr-4 text-right text-ink" data-numeric>{o.windKt}</td>
                  <td className="py-1.5 pr-4 text-right text-ink" data-numeric>{o.pressureMb ?? "—"}</td>
                  <td className="py-1.5 pr-4 text-accent">{o.recordId === "L" ? "LANDFALL" : o.recordId || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="no-print mt-6 flex items-center gap-2">
          <PrintButton />
        </div>
        <p className="mt-6 font-mono text-[10px] text-ink-mute">
          Source: NOAA HURDAT2 Atlantic best-track. Coordinates as published. Wind speeds are 1-minute sustained at 10 m.
        </p>
      </main>
    </>
  );
}
