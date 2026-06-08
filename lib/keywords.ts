export const MARKETING_KEYWORDS = [
  "media buying",
  "media buyer",
  "paid social",
  "paid media",
  "meta ads",
  "facebook ads",
  "google ads",
  "ppc",
  "performance marketing",
  "creative strategist",
  "creative strategy",
  "digital marketing",
  "growth marketing",
  "growth hacker",
  "advertising",
  "ad creative",
  "social media marketing",
  "programmatic",
  "display advertising",
  "search engine marketing",
  "sem",
  "conversion optimization",
  "cro",
  "marketing automation",
  "ai design",
  "ai creative",
  "ugc",
  "influencer marketing",
  "affiliate marketing",
  "e-commerce marketing",
  "ecommerce marketing",
  "d2c marketing",
  "dtc marketing",
  "tiktok ads",
  "youtube ads",
  "demand generation",
  "lead generation",
  "retargeting",
  "remarketing",
  "brand strategist",
];

export const TAG_OPTIONS = [
  "Media Buying",
  "Meta Ads",
  "Google Ads",
  "Creative Strategy",
  "AI Design",
  "PPC",
  "Performance Marketing",
  "Social Media",
  "TikTok Ads",
  "Programmatic",
  "Growth Marketing",
  "E-commerce",
];

export function matchesMarketing(text: string): boolean {
  const lower = text.toLowerCase();
  return MARKETING_KEYWORDS.some((kw) => lower.includes(kw));
}

export function extractTags(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  if (lower.includes("meta ads") || lower.includes("facebook ads")) matched.push("Meta Ads");
  if (lower.includes("google ads") || lower.includes("sem") || lower.includes("search engine marketing")) matched.push("Google Ads");
  if (lower.includes("media buy")) matched.push("Media Buying");
  if (lower.includes("creative strateg")) matched.push("Creative Strategy");
  if (lower.includes("ai design") || lower.includes("ai creative")) matched.push("AI Design");
  if (lower.includes("ppc") || lower.includes("pay-per-click")) matched.push("PPC");
  if (lower.includes("performance market")) matched.push("Performance Marketing");
  if (lower.includes("tiktok")) matched.push("TikTok Ads");
  if (lower.includes("programmatic")) matched.push("Programmatic");
  if (lower.includes("growth")) matched.push("Growth Marketing");
  if (lower.includes("ecommerce") || lower.includes("e-commerce") || lower.includes("d2c") || lower.includes("dtc")) matched.push("E-commerce");
  if (lower.includes("social media")) matched.push("Social Media");
  if (lower.includes("ugc")) matched.push("UGC");
  return [...new Set(matched)];
}
