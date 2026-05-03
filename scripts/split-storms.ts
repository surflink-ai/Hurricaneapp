import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Storm } from "../lib/types";

async function main(): Promise<void> {
  const stormsObj = JSON.parse(
    await readFile("public/data/storms.json", "utf8")
  ) as Record<string, Storm>;
  const outDir = "public/data/storms";
  await mkdir(outDir, { recursive: true });
  for (const [id, storm] of Object.entries(stormsObj)) {
    await writeFile(join(outDir, `${id}.json`), JSON.stringify(storm));
  }
  console.log(`[split-storms] wrote ${Object.keys(stormsObj).length} storm files to ${outDir}/`);
}

main().catch((err) => {
  console.error("[split-storms] failed:", err);
  process.exit(1);
});
