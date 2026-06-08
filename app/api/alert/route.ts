import { NextRequest, NextResponse } from "next/server";
import { getSubscriptions, getSeenJobIds, saveSeenJobIds } from "@/lib/storage";
import { sendJobAlert } from "@/lib/email";
import { Job } from "@/lib/types";

// Simple token to protect the endpoint from public access
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.ALERT_SECRET;
  if (!secret) return true; // open if no secret set
  const token = req.nextUrl.searchParams.get("secret") ?? req.headers.get("x-alert-secret");
  return token === secret;
}

function jobMatchesSub(
  job: Job,
  sub: { tags: string[]; types: ("remote" | "hybrid")[] }
): boolean {
  if (sub.types.length && !sub.types.includes(job.type as "remote" | "hybrid")) return false;
  if (sub.tags.length && !sub.tags.some((t) => job.tags.includes(t))) return false;
  return true;
}

function unsubToken(email: string): string {
  // Simple deterministic token — good enough for low-security unsubscribe links
  return Buffer.from(email).toString("base64url");
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch all current jobs
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${process.env.PORT ?? 3000}`;
  let allJobs: Job[] = [];
  try {
    const res = await fetch(`${baseUrl}/api/jobs`);
    const data = await res.json();
    allJobs = data.jobs ?? [];
  } catch {
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  const seenIds = getSeenJobIds();
  const newJobs = allJobs.filter((j) => !seenIds.has(j.id));

  // Save all current IDs as seen
  saveSeenJobIds(allJobs.map((j) => j.id));

  if (newJobs.length === 0) {
    return NextResponse.json({ sent: 0, newJobs: 0 });
  }

  const subs = getSubscriptions();
  let sent = 0;
  const errors: string[] = [];

  for (const sub of subs) {
    const matched = newJobs.filter((j) => jobMatchesSub(j, sub));
    if (matched.length === 0) continue;
    try {
      await sendJobAlert(sub.email, matched.slice(0, 20), unsubToken(sub.email));
      sent++;
    } catch (err) {
      errors.push(`${sub.email}: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    sent,
    newJobs: newJobs.length,
    subscribers: subs.length,
    errors: errors.length ? errors : undefined,
  });
}
