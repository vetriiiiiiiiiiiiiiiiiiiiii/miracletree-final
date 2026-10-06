import { NextResponse } from "next/server";
import { flushQueue } from "@/lib/mail-queue";

export async function GET(req) {
  // Protect the endpoint so only authorized callers (like Vercel Cron) can trigger it
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sent = await flushQueue();
    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    console.error("[cron:mail-flush]", error);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}
