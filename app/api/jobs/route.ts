import { NextResponse } from "next/server";
import { Job } from "@/lib/types";
import { matchesMarketing, extractTags } from "@/lib/keywords";
import { fetchMojeDelo, fetchKarierna, fetchZaposlitev } from "@/lib/slovenian-boards";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

// Block locations explicitly restricted to non-EU regions
const SI_BLOCKED = [
  "usa only", "us only", "united states only", "us residents only",
  "canada only", "australia only", "new zealand only",
  "latin america only", "latam only", "india only",
  "apac only", "asia only", "africa only",
  "uk only", "us & canada", "us and canada",
  "north america only",
];

function accessibleFromSlovenia(location: string): boolean {
  const l = location.toLowerCase();
  return !SI_BLOCKED.some((kw) => l.includes(kw));
}

async function fetchRemotive(): Promise<Job[]> {
  const categories = ["marketing", "design", "business-exec"];
  const all: Job[] = [];

  for (const cat of categories) {
    try {
      const res = await fetch(`https://remotive.com/api/remote-jobs?category=${cat}&limit=100`, {
        next: { revalidate: 1800 },
      });
      if (!res.ok) continue;
      const data = await res.json();
      for (const job of data.jobs ?? []) {
        const loc = job.candidate_required_location || "Worldwide";
        if (!accessibleFromSlovenia(loc)) continue;
        const text = `${job.title} ${job.description ?? ""}`;
        if (!matchesMarketing(text)) continue;
        all.push({
          id: `remotive-${job.id}`,
          title: job.title,
          company: job.company_name,
          companyLogo: job.company_logo,
          location: loc,
          type: "remote",
          salary: job.salary || undefined,
          tags: extractTags(text),
          postedAt: timeAgo(job.publication_date),
          url: job.url,
          source: "Remotive",
        });
      }
    } catch {
      // skip source on error
    }
  }
  return all;
}

async function fetchWeworkremotely(): Promise<Job[]> {
  try {
    const res = await fetch(
      "https://weworkremotely.com/categories/remote-marketing-jobs.rss",
      { next: { revalidate: 1800 } }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    return items.slice(0, 40).map((item, i) => {
      const get = (tag: string) =>
        item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1] ??
        item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ?? "";
      const title = get("title");
      const link = get("link") || get("url");
      const pubDate = get("pubDate");
      const region = get("region");
      const company = title.split(":")[0]?.trim() ?? "";
      const jobTitle = title.split(":").slice(1).join(":").trim() || title;
      const text = `${title}`;
      const loc = region || "Worldwide";
      if (!matchesMarketing(text)) return null;
      if (!accessibleFromSlovenia(loc)) return null;
      return {
        id: `wwr-${i}`,
        title: jobTitle,
        company,
        location: loc,
        type: "remote" as const,
        tags: extractTags(text),
        postedAt: pubDate ? timeAgo(pubDate) : "Recently",
        url: link,
        source: "We Work Remotely",
      } satisfies Job;
    }).filter(Boolean) as Job[];
  } catch {
    return [];
  }
}

export async function GET() {
  const results = await Promise.allSettled([
    fetchMojeDelo(),
    fetchKarierna(),
    fetchZaposlitev(),
    fetchRemotive(),
    fetchWeworkremotely(),
  ]);

  const jobs: Job[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  // Slovenian boards first, then worldwide/Europe remote
  const slovenian = jobs.filter((j) => j.location === "Slovenia");
  const global_ = jobs.filter((j) => j.location !== "Slovenia");

  const seen = new Set<string>();
  const unique = [...slovenian, ...global_].filter((j) => {
    const key = `${j.title.toLowerCase().trim()}-${j.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ jobs: unique, total: unique.length });
}
