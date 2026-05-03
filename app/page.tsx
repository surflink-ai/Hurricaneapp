import { Header } from "@/components/Header";
import { LiveTicker } from "@/components/LiveTicker";
import { AtlasShell } from "@/components/AtlasShell";
import { IndexHydrator } from "@/components/IndexHydrator";
import { loadIndex } from "@/lib/data";

export const dynamic = "force-static";

export default async function HomePage() {
  const idx = await loadIndex();
  return (
    <>
      <Header totalRecords={idx.storms.length} />
      <LiveTicker />
      <IndexHydrator index={idx.storms} />
      <AtlasShell index={idx.storms} />
    </>
  );
}
