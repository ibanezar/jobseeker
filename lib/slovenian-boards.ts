import { Job } from "./types";
import { matchesMarketing, extractTags } from "./keywords";

function timeAgo(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString("sl-SI", { day: "numeric", month: "short" });
  } catch {
    return "Recently";
  }
}

function detectType(text: string): "remote" | "hybrid" | "onsite" {
  const t = text.toLowerCase();
  if (t.includes("remote") || t.includes("delo od doma") || t.includes("od doma")) return "remote";
  if (t.includes("hybrid") || t.includes("hibrid")) return "hybrid";
  return "onsite";
}

function htmlDecode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// MojeDelo.com — RSS feed search
export async function fetchMojeDelo(): Promise<Job[]> {
  const queries = ["marketing", "digitalni+marketing", "oglaševanje"];
  const all: Job[] = [];

  for (const q of queries) {
    try {
      const res = await fetch(
        `https://www.mojedelo.com/rss/dela?q=${q}`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobSeeker/1.0)",
            "Accept": "application/rss+xml, application/xml, text/xml",
          },
          next: { revalidate: 1800 },
        }
      );
      if (!res.ok) continue;
      const xml = await res.text();
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const get = (tag: string) =>
          item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]></${tag}>`))?.[1] ??
          item.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))?.[1] ?? "";

        const title = htmlDecode(get("title"));
        const link = get("link");
        const description = htmlDecode(get("description"));
        const pubDate = get("pubDate");
        const company = htmlDecode(get("author") || get("dc:creator") || "");
        const category = htmlDecode(get("category"));

        const text = `${title} ${description} ${category}`;
        if (!matchesMarketing(text)) continue;

        const type = detectType(text);
        if (type === "onsite") continue;

        all.push({
          id: `mojedelo-${link.split("/").pop() ?? i}`,
          title,
          company: company || "Company",
          location: "Slovenia",
          type,
          tags: extractTags(text),
          postedAt: pubDate ? timeAgo(pubDate) : "Recently",
          url: link,
          source: "MojeDelo",
        });
      }
    } catch {
      // skip on error
    }
  }

  return all;
}

// Karierna.si — HTML scrape
export async function fetchKarierna(): Promise<Job[]> {
  const keywords = ["media-buying", "digital-marketing", "performance-marketing"];
  const all: Job[] = [];

  for (const kw of keywords) {
    try {
      const res = await fetch(
        `https://karierna.si/iskanje?q=${kw}&remote=true`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; JobSeeker/1.0)",
            "Accept": "text/html",
          },
          next: { revalidate: 1800 },
        }
      );
      if (!res.ok) continue;
      const html = await res.text();

      // Parse job cards — look for common job listing patterns
      const cardPattern = /<article[^>]*class="[^"]*job[^"]*"[^>]*>([\s\S]*?)<\/article>/gi;
      const hrefPattern = /href="([^"]*\/delo\/[^"]+)"/;
      const titlePattern = /<h[23][^>]*>([\s\S]*?)<\/h[23]>/;
      const companyPattern = /class="[^"]*company[^"]*"[^>]*>([\s\S]*?)<\//i;
      const datePattern = /class="[^"]*date[^"]*"[^>]*>([\s\S]*?)<\//i;

      let match: RegExpExecArray | null;
      let idx = 0;
      while ((match = cardPattern.exec(html)) !== null) {
        const block = match[1];
        const href = block.match(hrefPattern)?.[1] ?? "";
        const rawTitle = htmlDecode(block.match(titlePattern)?.[1] ?? "");
        const company = htmlDecode(block.match(companyPattern)?.[1] ?? "");
        const dateStr = htmlDecode(block.match(datePattern)?.[1] ?? "");
        const text = `${rawTitle} ${block}`;
        if (!rawTitle || !matchesMarketing(text)) continue;
        const type = detectType(block);
        if (type === "onsite") continue;
        all.push({
          id: `karierna-${idx++}`,
          title: rawTitle,
          company: company || "Company",
          location: "Slovenia",
          type,
          tags: extractTags(text),
          postedAt: dateStr ? timeAgo(dateStr) : "Recently",
          url: href.startsWith("http") ? href : `https://karierna.si${href}`,
          source: "Karierna",
        });
      }
    } catch {
      // skip on error
    }
  }

  return all;
}

// Zaposlitev.net — HTML scrape + RSS
export async function fetchZaposlitev(): Promise<Job[]> {
  const all: Job[] = [];

  try {
    const res = await fetch(
      "https://www.zaposlitev.net/dela.php?m=iskalec&a=kazalo&q=marketing&isremote=1",
      {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; JobSeeker/1.0)",
          "Accept": "text/html",
        },
        next: { revalidate: 1800 },
      }
    );
    if (!res.ok) return all;
    const html = await res.text();

    // Zaposlitev uses table/div rows for jobs
    const rowPattern = /<div[^>]*class="[^"]*oglas[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi;
    const hrefPattern = /href="([^"]*dela\.php[^"]*)"/;
    const titlePattern = /<strong[^>]*>([\s\S]*?)<\/strong>/i;
    const companyPattern = /class="[^"]*podjetje[^"]*"[^>]*>([\s\S]*?)<\//i;

    let match: RegExpExecArray | null;
    let idx = 0;
    while ((match = rowPattern.exec(html)) !== null) {
      const block = match[1];
      const href = block.match(hrefPattern)?.[1] ?? "";
      const rawTitle = htmlDecode(block.match(titlePattern)?.[1] ?? "");
      const company = htmlDecode(block.match(companyPattern)?.[1] ?? "");
      const text = `${rawTitle} ${block}`;
      if (!rawTitle || !matchesMarketing(text)) continue;
      const type = detectType(block);
      if (type === "onsite") continue;
      all.push({
        id: `zaposlitev-${idx++}`,
        title: rawTitle,
        company: company || "Company",
        location: "Slovenia",
        type,
        tags: extractTags(text),
        postedAt: "Recently",
        url: href.startsWith("http") ? href : `https://www.zaposlitev.net/${href}`,
        source: "Zaposlitev",
      });
    }
  } catch {
    // skip on error
  }

  return all;
}
