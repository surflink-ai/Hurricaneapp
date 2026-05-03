import { sandyEssay } from "./sandy-2012";
import { andrewEssay } from "./andrew-1992";
import { season2005Essay } from "./2005-season";

export interface EssayChapterDef {
  id: string;
  title: string;
  prose: string;
  pullQuote?: string;
  cameraBbox?: [number, number, number, number];
  focusObsIndex?: number;
  imagery?: { pairId: string; label: string };
}

export interface EssayDef {
  slug: string;
  eyebrow: string;
  title: string;
  dek: string;
  primaryStormId: string;
  bodyIntro: string;
  chapters: EssayChapterDef[];
  closing: string;
  sources: { label: string; href?: string }[];
}

export const ESSAYS: ReadonlyArray<EssayDef> = [
  season2005Essay,
  andrewEssay,
  sandyEssay
];

export function getEssayBySlug(slug: string): EssayDef | undefined {
  return ESSAYS.find((e) => e.slug === slug);
}
