import fs from "fs";
import path from "path";

function dataDir(): string {
  if (process.env.NODE_ENV === "production") return "/tmp/jobseeker";
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function readJSON<T>(filename: string, fallback: T): T {
  const dir = dataDir();
  ensureDir(dir);
  try {
    return JSON.parse(fs.readFileSync(path.join(dir, filename), "utf-8")) as T;
  } catch {
    return fallback;
  }
}

export function writeJSON(filename: string, data: unknown): void {
  const dir = dataDir();
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(data, null, 2));
}

export interface Subscription {
  email: string;
  tags: string[];
  types: ("remote" | "hybrid")[];
  createdAt: string;
}

export function getSubscriptions(): Subscription[] {
  return readJSON<Subscription[]>("subscriptions.json", []);
}

export function addSubscription(sub: Subscription): boolean {
  const subs = getSubscriptions();
  if (subs.find((s) => s.email === sub.email)) return false;
  subs.push(sub);
  writeJSON("subscriptions.json", subs);
  return true;
}

export function removeSubscription(email: string): boolean {
  const subs = getSubscriptions();
  const filtered = subs.filter((s) => s.email !== email);
  if (filtered.length === subs.length) return false;
  writeJSON("subscriptions.json", filtered);
  return true;
}

export function getSeenJobIds(): Set<string> {
  return new Set<string>(readJSON<string[]>("seen-jobs.json", []));
}

export function saveSeenJobIds(ids: string[]): void {
  writeJSON("seen-jobs.json", ids);
}
