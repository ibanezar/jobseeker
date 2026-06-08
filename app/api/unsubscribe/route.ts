import { NextRequest, NextResponse } from "next/server";
import { removeSubscription } from "@/lib/storage";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") ?? "";
  const removed = removeSubscription(decodeURIComponent(email));

  const html = `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f8fafc">
  <div style="text-align:center;padding:48px">
    ${removed
      ? `<h2 style="color:#1e293b">Unsubscribed ✓</h2><p style="color:#64748b">${decodeURIComponent(email)} has been removed from job alerts.</p>`
      : `<h2 style="color:#1e293b">Not found</h2><p style="color:#64748b">This email was not subscribed.</p>`
    }
    <a href="/" style="display:inline-block;margin-top:16px;background:#6366f1;color:#fff;border-radius:8px;padding:10px 24px;text-decoration:none;font-size:14px">Back to jobs</a>
  </div>
</body>
</html>`;

  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
