import nodemailer from "nodemailer";
import { Job } from "./types";
import { TAG_OPTIONS } from "./keywords";

function createTransport() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP environment variables not configured");
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: SMTP_SECURE === "true",
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

const SOURCE_BADGE: Record<string, string> = {
  "MojeDelo": "#1a73e8",
  "Karierna": "#0f9d58",
  "Zaposlitev": "#f4b400",
  "Remotive": "#6366f1",
  "RemoteOK": "#10b981",
  "We Work Remotely": "#8b5cf6",
};

function jobHtml(job: Job): string {
  const badgeColor = SOURCE_BADGE[job.source] ?? "#6b7280";
  const typeColor = job.type === "remote" ? "#16a34a" : "#d97706";
  const tags = job.tags.slice(0, 4).map(t =>
    `<span style="display:inline-block;background:#f1f5f9;color:#475569;border-radius:4px;padding:2px 8px;font-size:11px;margin:2px 2px 0 0">${t}</span>`
  ).join("");
  return `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:16px;margin-bottom:12px;background:#fff">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <a href="${job.url}" style="font-size:15px;font-weight:600;color:#1e293b;text-decoration:none">${job.title}</a>
          <div style="color:#64748b;font-size:13px;margin-top:2px">${job.company}</div>
        </div>
        <span style="background:${badgeColor};color:#fff;border-radius:4px;padding:2px 7px;font-size:11px;white-space:nowrap;margin-left:8px">${job.source}</span>
      </div>
      <div style="margin-top:8px;font-size:12px;color:#94a3b8">
        📍 ${job.location} &nbsp;·&nbsp;
        <span style="color:${typeColor};font-weight:500">${job.type === "remote" ? "🌍 Remote" : "🏢 Hybrid"}</span>
        ${job.salary ? `&nbsp;·&nbsp; ${job.salary}` : ""}
        &nbsp;·&nbsp; ${job.postedAt}
      </div>
      ${tags ? `<div style="margin-top:8px">${tags}</div>` : ""}
      <div style="margin-top:12px">
        <a href="${job.url}" style="display:inline-block;background:#6366f1;color:#fff;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:500;text-decoration:none">View job →</a>
      </div>
    </div>`;
}

export async function sendJobAlert(
  to: string,
  newJobs: Job[],
  unsubToken: string
): Promise<void> {
  const transport = createTransport();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:600px;margin:0 auto;padding:32px 16px">
    <div style="text-align:center;margin-bottom:28px">
      <div style="display:inline-block;background:#6366f1;border-radius:10px;padding:10px 16px">
        <span style="color:#fff;font-size:18px;font-weight:700">⚡ JobSeeker</span>
      </div>
      <h2 style="color:#1e293b;margin:16px 0 4px">${newJobs.length} new job${newJobs.length > 1 ? "s" : ""} found</h2>
      <p style="color:#64748b;margin:0;font-size:14px">Remote &amp; hybrid marketing roles matching your alerts</p>
    </div>
    ${newJobs.map(jobHtml).join("")}
    <div style="text-align:center;margin-top:24px">
      <a href="${appUrl}" style="display:inline-block;background:#f1f5f9;color:#475569;border-radius:8px;padding:10px 24px;font-size:13px;text-decoration:none;margin-bottom:16px">Browse all jobs →</a>
      <div style="margin-top:16px;color:#94a3b8;font-size:12px">
        <a href="${appUrl}/api/unsubscribe?email=${encodeURIComponent(to)}&token=${unsubToken}" style="color:#94a3b8">Unsubscribe</a>
        &nbsp;·&nbsp; JobSeeker · Slovenia
      </div>
    </div>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: `JobSeeker <${from}>`,
    to,
    subject: `⚡ ${newJobs.length} new marketing job${newJobs.length > 1 ? "s" : ""} — JobSeeker`,
    html,
  });
}

export async function sendConfirmation(to: string, sub: { tags: string[]; types: string[] }): Promise<void> {
  const transport = createTransport();
  const from = process.env.SMTP_FROM ?? process.env.SMTP_USER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const tagList = sub.tags.length
    ? sub.tags.join(", ")
    : TAG_OPTIONS.slice(0, 5).join(", ") + " & more";

  const html = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:540px;margin:0 auto;padding:48px 16px;text-align:center">
    <div style="background:#6366f1;border-radius:12px;padding:12px 18px;display:inline-block;margin-bottom:24px">
      <span style="color:#fff;font-size:20px;font-weight:700">⚡ JobSeeker</span>
    </div>
    <h2 style="color:#1e293b;margin:0 0 8px">You're all set! 🎉</h2>
    <p style="color:#64748b;font-size:15px;margin:0 0 24px">
      You'll receive email alerts for new <strong>remote &amp; hybrid marketing jobs</strong> matching your profile.
    </p>
    <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:24px;text-align:left">
      <div style="font-size:13px;color:#64748b;margin-bottom:6px">Watching for</div>
      <div style="font-size:14px;color:#1e293b;font-weight:500">${tagList}</div>
      ${sub.types.length ? `<div style="font-size:13px;color:#64748b;margin-top:8px">Work type: ${sub.types.join(" & ")}</div>` : ""}
    </div>
    <a href="${appUrl}" style="display:inline-block;background:#6366f1;color:#fff;border-radius:10px;padding:12px 32px;font-size:14px;font-weight:600;text-decoration:none">Browse jobs now →</a>
  </div>
</body>
</html>`;

  await transport.sendMail({
    from: `JobSeeker <${from}>`,
    to,
    subject: "✅ Job alert confirmed — JobSeeker",
    html,
  });
}
