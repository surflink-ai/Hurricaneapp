import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { IndexHydrator } from "@/components/IndexHydrator";
import { EssayScroller } from "@/components/EssayScroller";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { CategoryChip } from "@/components/CategoryChip";
import { ESSAYS, getEssayBySlug, type EssayChapterDef } from "@/content/essays";
import { loadIndex, loadStorm, loadImageryForStorm } from "@/lib/data";
import type { NarrativeChapter } from "@/lib/types";

interface Params { slug: string }

export async function generateStaticParams(): Promise<Params[]> {
  return ESSAYS.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);
  if (!essay) return { title: "Essay not found" };
  return { title: essay.title, description: essay.dek };
}

function chapterDefToNarrative(c: EssayChapterDef, i: number): NarrativeChapter {
  return {
    id: c.id,
    kind: i === 0 ? "genesis" : "intensification",
    title: c.title,
    prose: c.prose,
    ...(c.cameraBbox ? { cameraBbox: c.cameraBbox } : {}),
    ...(c.focusObsIndex != null ? { focusObsIndex: c.focusObsIndex } : {}),
    ...(c.imagery ? { imageryPairId: c.imagery.pairId } : {})
  };
}

export default async function EssayPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const essay = getEssayBySlug(slug);
  if (!essay) notFound();
  const idx = await loadIndex();
  const storm = await loadStorm(essay.primaryStormId);
  if (!storm) notFound();
  const imagery = await loadImageryForStorm(essay.primaryStormId);
  const imageryById = new Map(imagery.map((p) => [p.pairId, p]));

  const narrativeChapters: NarrativeChapter[] = essay.chapters.map(chapterDefToNarrative);

  const before = (
    <div className="mb-12">
      <Link
        href="/essay"
        className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={11} strokeWidth={1.6} />
        All essays
      </Link>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">
        {essay.eyebrow}
      </p>
      <h1 className="mt-1 font-display text-[56px] font-medium leading-[0.95] tracking-tight text-ink">
        {essay.title}
      </h1>
      <p className="mt-4 max-w-[58ch] font-display text-[20px] leading-relaxed text-ink-soft">
        {essay.dek}
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CategoryChip cat={storm.peakCat} full />
        <span className="font-mono text-[11px] text-ink-soft" data-numeric>
          {storm.peakKt} kt · {storm.minMb ?? "—"} mb · {storm.landfalls} landfall{storm.landfalls === 1 ? "" : "s"}
        </span>
      </div>
      <p className="mt-8 max-w-[58ch] text-[15px] leading-relaxed text-ink">
        {essay.bodyIntro}
      </p>
    </div>
  );

  const pullQuotesByChapterId = new Map(
    essay.chapters.filter((c) => c.pullQuote).map((c) => [c.id, c.pullQuote!] as const)
  );
  const imageryByChapterId = new Map(
    essay.chapters
      .filter((c): c is EssayChapterDef & { imagery: { pairId: string; label: string } } => !!c.imagery)
      .map((c) => [c.id, c.imagery] as const)
  );

  const enriched: NarrativeChapter[] = narrativeChapters.map((c) => {
    const pq = pullQuotesByChapterId.get(c.id);
    return pq ? { ...c, prose: `${c.prose}\n\n— ${pq}` } : c;
  });

  const after = (
    <div className="mt-32 max-w-[60ch] border-t border-rule pt-8">
      <p className="text-[16px] leading-relaxed text-ink">{essay.closing}</p>
      {essay.chapters.some((c) => c.imagery) && (
        <section className="mt-10">
          <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Imagery</p>
          <h3 className="mt-1 font-display text-[22px] text-ink">Before and after</h3>
          {[...imageryByChapterId.values()].map((img) => {
            const pair = imageryById.get(img.pairId);
            if (!pair) return null;
            return (
              <BeforeAfterSlider
                key={pair.pairId}
                label={pair.label}
                before={pair.before}
                after={pair.after}
                height={400}
              />
            );
          })}
        </section>
      )}
      <section className="mt-10">
        <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-soft">Sources</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 font-mono text-[11px] text-ink">
          {essay.sources.map((s) => (
            <li key={s.label}>
              {s.href ? (
                <a className="underline-offset-2 hover:underline" href={s.href} target="_blank" rel="noreferrer noopener">
                  {s.label}
                </a>
              ) : s.label}
            </li>
          ))}
        </ol>
      </section>
      <Link
        href={`/storm/${storm.id}`}
        className="mt-8 inline-flex items-center gap-1.5 border border-rule bg-paper px-3 py-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink hover:bg-paper-dim"
      >
        Auto-narrative for {storm.name.charAt(0).toUpperCase() + storm.name.slice(1).toLowerCase()}
      </Link>
    </div>
  );

  return (
    <>
      <Header totalRecords={idx.storms.length} />
      <LiveTicker />
      <IndexHydrator index={idx.storms} />
      <article className="mx-auto max-w-[1500px]">
        <EssayScroller
          chapters={enriched}
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
