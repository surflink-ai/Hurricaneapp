import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname } from "node:path";
import type { ImageryPair, StormsIndex } from "../lib/types";

async function downloadIfMissing(
  url: string,
  outPath: string
): Promise<{ ok: boolean; bytes?: number; reason?: string }> {
  if (existsSync(outPath)) {
    const s = await stat(outPath);
    if (s.size > 1024) return { ok: true, bytes: s.size };
  }
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": "hurricane-atlas/1.0",
        accept: "image/jpeg,image/*,*/*"
      }
    });
    if (!res.ok) return { ok: false, reason: `http ${res.status}` };
    const ab = await res.arrayBuffer();
    if (ab.byteLength < 1024) return { ok: false, reason: "tiny payload" };
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, Buffer.from(ab));
    return { ok: true, bytes: ab.byteLength };
  } catch (err) {
    return { ok: false, reason: (err as Error).message };
  }
}

async function main(): Promise<void> {
  const manifest = JSON.parse(
    await readFile("content/imagery.manifest.json", "utf8")
  ) as ImageryPair[];
  const idxPath = "public/data/storms-index.json";
  const idx = JSON.parse(await readFile(idxPath, "utf8")) as StormsIndex;
  const haveImagery = new Set<string>();

  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const pair of manifest) {
    const ext = (extname(new URL(pair.before.url).pathname) || ".jpg").toLowerCase();
    const dir = `public/imagery/${pair.stormId}`;
    const beforeOut = join(dir, `${pair.pairId}-before${ext}`);
    const afterOut = join(dir, `${pair.pairId}-after${ext}`);

    const a = await downloadIfMissing(pair.before.url, beforeOut);
    const b = await downloadIfMissing(pair.after.url, afterOut);
    if (a.ok && b.ok) {
      console.log(`[fetch-imagery] OK   ${pair.stormId}/${pair.pairId}`);
      haveImagery.add(pair.stormId);
      downloaded += 1;
    } else if (a.bytes && b.bytes) {
      haveImagery.add(pair.stormId);
      skipped += 1;
    } else {
      console.warn(
        `[fetch-imagery] MISS ${pair.stormId}/${pair.pairId} (before: ${a.reason ?? "ok"}, after: ${b.reason ?? "ok"})`
      );
      failed += 1;
    }
  }

  const resolvedManifest = manifest.map((p) => {
    const ext = (extname(new URL(p.before.url).pathname) || ".jpg").toLowerCase();
    const beforeLocal = `public/imagery/${p.stormId}/${p.pairId}-before${ext}`;
    const afterLocal = `public/imagery/${p.stormId}/${p.pairId}-after${ext}`;
    const beforeOk = existsSync(beforeLocal);
    const afterOk = existsSync(afterLocal);
    if (beforeOk && afterOk) haveImagery.add(p.stormId);
    return {
      ...p,
      before: {
        ...p.before,
        resolvedUrl: beforeOk ? `/imagery/${p.stormId}/${p.pairId}-before${ext}` : p.before.url
      },
      after: {
        ...p.after,
        resolvedUrl: afterOk ? `/imagery/${p.stormId}/${p.pairId}-after${ext}` : p.after.url
      }
    };
  });
  for (const storm of idx.storms) {
    if (manifest.some((m) => m.stormId === storm.id)) storm.hasImagery = true;
  }
  await writeFile(idxPath, JSON.stringify(idx));
  await writeFile("public/data/imagery.json", JSON.stringify(resolvedManifest));

  console.log(`[fetch-imagery] downloaded=${downloaded} skipped=${skipped} failed=${failed}`);
}

main().catch((err) => {
  console.error("[fetch-imagery] failed:", err);
});
