import { NextResponse } from "next/server";
import { loadStorm } from "@/lib/data";

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const storm = await loadStorm(id);
  if (!storm) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(storm);
}
