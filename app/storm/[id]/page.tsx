import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FileText, Table2, ExternalLink, BookmarkX } from "lucide-react";
import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { IndexHydrator } from "@/components/IndexHydrator";
import { EssayScroller } from "@/components/EssayScroller";
import { StatGrid } from "@/components/StatGrid";
import { CategoryChip } from "@/components/CategoryChip";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { loadIndex, loadStorm, loadImageryForStorm } from "@/lib/data";
import { deriveChapters } from "@/lib/narrative";
import { fmtAce, fmtKt, fmtLifespan, fmtMb, fmtUsd, fmtInt, ktToKmh, ktToMph, haversineKm } from "@/lib/units";

interface Params { id: string }

export async function generateStaticParams(): Promise<Params[]> {
  const idx = await loadIndex();
  return idx.storms.map((s) => ({ id: s.id }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const storm = await loadStorm(id);
  if (!storm) return { title: "Storm not found" };
  return {
    title: `${titleCase(storm.name)} ${storm.year}`,
    description: `${titleCase(storm.name)} (${storm.year}) — peak ${storm.peakKt} kt (${ktToMph(storm.peakKt)} mph), min pressure ${fmtMb(storm.minMb)}, ${storm.landfalls} landfall(s).`
  };
}

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export default async function StormPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const storm = await loadStorm(id);
  if (!storm) notFound();
  const idx = await loadIndex();
  const imagery = await loadImageryForStorm(id);
  const chapters = deriveChapters(storm);

  const before = (
    <div className="mb-12">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={11} strokeWidth={1.6} />
        Back to atlas
      </Link>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
        <span data-numeric>{storm.id}</span>
        {storm.retired && (
          <span className="ml-3 inline-flex items-center gap-1 text-accent">
            <BookmarkX size={11} strokeWidth={1.6} />
            Retired by WMO
          </span>
        )}
      </p>
      <h1 className="mt-1 font-display text-[56px] font-medium leading-[0.92] tracking-tight text-ink">
        {titleCase(storm.name)}{" "}
        <span className="font-mono text-[28px] tracking-normal text-ink-mute" data-numeric>
          {storm.year}
        </span>
      </h1>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CategoryChip cat={storm.peakCat} size="lg" full />
        {storm.basins.map((b) => (
          <span key={b} className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
            {b}
          </span>
        ))}
      </div>
      <StatGrid
        className="mt-6"
        stats={[
          { label: "Peak wind", value: fmtKt(storm.peakKt), sub: `${ktToMph(storm.peakKt)} mph · ${ktToKmh(storm.peakKt)} km/h` },
          { label: "Min pressure", value: fmtMb(storm.minMb) },
          { label: "Lifespan", value: fmtLifespan(storm.start, storm.end) },
          { label: "ACE", value: fmtAce(storm.ace) },
          { label: "Landfalls", value: String(storm.landfalls) },
          { label: "Track points", value: String(storm.observations.length) }
        ]}
      />
      {storm.impact && (
        <section className="mt-6 border-y border-rule py-4">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Impact</p>
          <div className="mt-2 grid grid-cols-2 gap-4">
            {storm.impact.damageUsdCpiAdjusted != null && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">Damage (CPI-adj)</p>
                <p className="mt-1 font-mono text-[24px] text-ink" data-numeric>{fmtUsd(storm.impact.damageUsdCpiAdjusted)}</p>
              </div>
            )}
            {storm.impact.deaths != null && (
              <div>
                <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">Deaths</p>
                <p className="mt-1 font-mono text-[24px] text-ink" data-numeric>{fmtInt(storm.impact.deaths)}</p>
              </div>
            )}
          </div>
          {storm.impact.summary && (
            <p className="mt-4 max-w-[60ch] text-[15px] leading-relaxed text-ink">
              {storm.impact.summary}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-eyebrow text-ink-mute">
            {storm.impact.tcrUrl && (
              <a href={storm.impact.tcrUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-ink">
                <FileText size={11} strokeWidth={1.6} />
                NHC Tropical Cyclone Report
              </a>
            )}
            {storm.impact.sourceUrl && (
              <a href={storm.impact.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 hover:text-ink">
                <ExternalLink size={11} strokeWidth={1.6} />
                {storm.impact.source}
              </a>
            )}
          </div>
        </section>
      )}
      <h2 className="mt-10 font-display text-[26px] leading-tight text-ink">A short narrative</h2>
      <p className="mt-2 max-w-[60ch] text-[14px] leading-relaxed text-ink-soft">
        Auto-derived from the HURDAT2 best-track record. Scroll to walk through {storm.name.toLowerCase()}'s
        genesis, intensification, peak, landfall and dissipation, with the basin map flying alongside.
      </p>
    </div>
  );

  const imageryNearby = (chapter: { focusObsIndex?: number }) => {
    if (chapter.focusObsIndex == null) return [];
    const o = storm.observations[chapter.focusObsIndex];
    if (!o) return [];
    return imagery.filter((p) => haversineKm(o.lat, o.lon, p.lat, p.lon) < 100);
  };

  const after = (
    <div className="mt-32 max-w-[60ch] border-t border-rule pt-8">
      {imagery.length > 0 && (
        <section className="mb-10">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Imagery</p>
          <h3 className="mt-1 font-display text-[22px] text-ink">Before and after</h3>
          {imagery.map((p) => (
            <BeforeAfterSlider
              key={p.pairId}
              label={p.label}
              before={p.before}
              after={p.after}
              height={360}
            />
          ))}
        </section>
      )}
      <p className="mt-6 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Sources</p>
      <ul className="mt-2 space-y-1 font-mono text-[11px] text-ink">
        <li>NOAA HURDAT2 best-track record (Atlantic basin)</li>
        {storm.impact?.tcrUrl && <li>NHC Tropical Cyclone Report (linked above)</li>}
        {storm.impact?.source === "NOAA NCEI Billion-Dollar Disasters" && (
          <li>NOAA NCEI Billion-Dollar Weather and Climate Disasters</li>
        )}
        {storm.impact?.source === "Wikipedia" && (
          <li>English Wikipedia infobox (best-effort enrichment)</li>
        )}
        {imagery.length > 0 && <li>NOAA NGS / NASA Earth Observatory imagery (per slider)</li>}
      </ul>
      <Link
        href={`/storm/${storm.id}/data`}
        className="mt-6 inline-flex items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
      >
        <Table2 size={11} strokeWidth={1.6} />
        Full observation record
      </Link>
    </div>
  );

  // Inline imagery markers in chapters when an imagery pair is within 100km of a chapter focus point.
  const enrichedChapters = chapters.map((c) => {
    const near = imageryNearby(c);
    if (near.length === 0) return c;
    const first = near[0];
    if (!first) return c;
    return { ...c, prose: `${c.prose}` , imageryPairId: first.pairId };
  });

  return (
    <>
      <Header totalRecords={idx.storms.length} />
      <LiveTicker />
      <IndexHydrator index={idx.storms} />
      <article className="mx-auto max-w-[1500px]">
        <EssayScroller
          chapters={enrichedChapters}
          observations={storm.observations}
          bbox={storm.bbox}
          peakCat={storm.peakCat}
          beforeContent={before}
          afterContent={after}
        />
      </article>
    </>
  );
}
