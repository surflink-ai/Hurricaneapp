import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import type { StormsIndex } from "../lib/types";

const TCR_INDEX = "https://www.nhc.noaa.gov/data/tcr/";
const CACHE = ".cache/tcr/index.html";

async function fetchIndex(): Promise<string | null> {
  try {
    if (existsSync(CACHE)) {
      const s = await stat(CACHE);
      if (Date.now() - s.mtimeMs < 86_400_000 * 7) return readFile(CACHE, "utf8");
    }
    const res = await fetch(TCR_INDEX, { headers: { "user-agent": "hurricane-atlas/1.0" } });
    if (!res.ok) throw new Error(`http ${res.status}`);
    const html = await res.text();
    await mkdir(".cache/tcr", { recursive: true });
    await writeFile(CACHE, html);
    return html;
  } catch (err) {
    console.warn(`[enrich-tcr] index unreachable: ${(err as Error).message}`);
    return null;
  }
}

function findTcrUrl(html: string, stormId: string): string | null {
  const upper = stormId.toUpperCase();
  const re = new RegExp(`href="(\\.\\/?[^"]*${upper}[^"]*\\.pdf)"`, "i");
  const m = html.match(re);
  if (!m || !m[1]) return null;
  try {
    return new URL(m[1].replace(/^\.\//, ""), TCR_INDEX).href;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  const html = await fetchIndex();
  const idxPath = "public/data/storms-index.json";
  const idx = JSON.parse(await readFile(idxPath, "utf8")) as StormsIndex;
  if (!html) {
    console.log("[enrich-tcr] skipping (offline)");
    return;
  }
  let attached = 0;
  for (const storm of idx.storms) {
    const url = findTcrUrl(html, storm.id);
    if (url) {
      const impact = storm.impact ?? {
        source: "NOAA NCEI Billion-Dollar Disasters" as const
      };
      impact.tcrUrl = url;
      storm.impact = impact;
      attached += 1;
    }
  }
  console.log(`[enrich-tcr] attached ${attached} TCR URLs`);
  await writeFile(idxPath, JSON.stringify(idx));
}

main().catch((err) => {
  console.error("[enrich-tcr] failed:", err);
});
