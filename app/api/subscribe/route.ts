import { NextRequest, NextResponse } from "next/server";
import { addSubscription, getSubscriptions } from "@/lib/storage";
import { sendConfirmation } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const tags: string[] = body.tags ?? [];
    const types: ("remote" | "hybrid")[] = body.types ?? ["remote", "hybrid"];

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const added = addSubscription({ email, tags, types, createdAt: new Date().toISOString() });

    if (!added) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 409 });
    }

    // Send confirmation email — non-blocking, ignore failure if SMTP not configured
    try {
      await sendConfirmation(email, { tags, types });
    } catch {
      // SMTP may not be configured yet — subscription still saved
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  const subs = getSubscriptions();
  return NextResponse.json({ count: subs.length });
}
