import { NextResponse } from "next/server";
import { loadImageryForStorm } from "@/lib/data";

export const dynamic = "force-static";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id } = await ctx.params;
  const pairs = await loadImageryForStorm(id);
  return NextResponse.json({ pairs });
}
