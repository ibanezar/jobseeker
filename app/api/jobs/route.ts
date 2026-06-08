import { NextResponse } from "next/server";
import { Job } from "@/lib/types";
import { matchesMarketing, extractTags } from "@/lib/keywords";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
        const text = `${job.title} ${job.description ?? ""}`;
        if (!matchesMarketing(text)) continue;
        all.push({
          id: `remotive-${job.id}`,
          title: job.title,
          company: job.company_name,
          companyLogo: job.company_logo,
          location: job.candidate_required_location || "Worldwide",
          type: "remote",
          salary: job.salary || undefined,
          tags: extractTags(text),
          postedAt: timeAgo(job.publication_date),
          url: job.url,
          source: "Remotive",
          description: job.description?.replace(/<[^>]*>/g, "").slice(0, 300),
        });
      }
    } catch {
      // skip source on error
    }
  }
  return all;
}

async function fetchRemoteOK(): Promise<Job[]> {
  try {
    const res = await fetch("https://remoteok.com/api", {
      headers: { "User-Agent": "JobSeeker/1.0" },
      next: { revalidate: 1800 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const jobs: Job[] = [];
    for (const job of data) {
      if (!job.position) continue;
      const text = `${job.position} ${(job.tags ?? []).join(" ")} ${job.description ?? ""}`;
      if (!matchesMarketing(text)) continue;
      jobs.push({
        id: `remoteok-${job.id}`,
        title: job.position,
        company: job.company,
        companyLogo: job.logo,
        location: job.location || "Worldwide",
        type: "remote",
        salary: job.salary || undefined,
        tags: extractTags(text),
        postedAt: timeAgo(new Date(job.epoch * 1000).toISOString()),
        url: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
        source: "RemoteOK",
      });
    }
    return jobs;
  } catch {
    return [];
  }
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
      const type_ = get("type");
      const company = title.split(":")[0]?.trim() ?? "";
      const jobTitle = title.split(":").slice(1).join(":").trim() || title;
      const text = `${title} ${type_}`;
      if (!matchesMarketing(text)) return null;
      return {
        id: `wwr-${i}`,
        title: jobTitle,
        company,
        location: region || "Worldwide",
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
  const [remotive, remoteok, wwr] = await Promise.allSettled([
    fetchRemotive(),
    fetchRemoteOK(),
    fetchWeworkremotely(),
  ]);

  const jobs: Job[] = [
    ...(remotive.status === "fulfilled" ? remotive.value : []),
    ...(remoteok.status === "fulfilled" ? remoteok.value : []),
    ...(wwr.status === "fulfilled" ? wwr.value : []),
  ];

  // deduplicate by normalised title+company
  const seen = new Set<string>();
  const unique = jobs.filter((j) => {
    const key = `${j.title.toLowerCase().trim()}-${j.company.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return NextResponse.json({ jobs: unique, total: unique.length });
}
