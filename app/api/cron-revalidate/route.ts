import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  const expected = process.env.CRON_SECRET;
  if (expected && auth !== `Bearer ${expected}`) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    message:
      "Triggered. Configure a Deploy Hook in Vercel and POST it from this endpoint to redeploy with fresh HURDAT2 data.",
    at: new Date().toISOString()
  });
}
