"use client";

import { useEffect, useState, useMemo } from "react";
import { Job, JobFilter } from "@/lib/types";
import JobCard from "@/components/JobCard";
import FilterBar from "@/components/FilterBar";
import { RefreshCw, Briefcase, Globe, Zap } from "lucide-react";

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [filter, setFilter] = useState<JobFilter>({ search: "", types: [], tags: [] });

  const fetchJobs = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/jobs");
      if (!res.ok) throw new Error();
      const data = await res.json();
      setJobs(data.jobs);
      setLastRefresh(new Date());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filtered = useMemo(() => {
    return jobs.filter((job) => {
      if (filter.search) {
        const q = filter.search.toLowerCase();
        const haystack = `${job.title} ${job.company} ${job.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filter.types.length && !filter.types.includes(job.type as "remote" | "hybrid")) return false;
      if (filter.tags.length && !filter.tags.some((t) => job.tags.includes(t))) return false;
      return true;
    });
  }, [jobs, filter]);

  const stats = useMemo(() => ({
    remote: jobs.filter((j) => j.type === "remote").length,
    hybrid: jobs.filter((j) => j.type === "hybrid").length,
    sources: [...new Set(jobs.map((j) => j.source))].length,
  }), [jobs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-bold text-gray-900">JobSeeker</span>
              <span className="ml-2 text-xs text-gray-400">Slovenia · Marketing & Media</span>
            </div>
          </div>
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            {lastRefresh ? (
              <span className="hidden sm:inline">
                {lastRefresh.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
              </span>
            ) : (
              "Refresh"
            )}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Find your next <span className="text-indigo-600">marketing role</span>
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            Remote & hybrid jobs for media buyers, creative strategists & performance marketers
          </p>

          {/* Stats */}
          {!loading && jobs.length > 0 && (
            <div className="flex items-center justify-center gap-6 mt-5">
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Globe className="w-4 h-4 text-green-500" />
                <span className="font-semibold text-gray-800">{stats.remote}</span> remote
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Briefcase className="w-4 h-4 text-yellow-500" />
                <span className="font-semibold text-gray-800">{stats.hybrid}</span> hybrid
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span className="font-semibold text-gray-800">{stats.sources}</span> sources
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          {/* Sidebar */}
          <div className="lg:sticky lg:top-20">
            <FilterBar filter={filter} onChange={setFilter} total={filtered.length} />
          </div>

          {/* Job list */}
          <div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-100 rounded w-2/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/3" />
                        <div className="h-3 bg-gray-100 rounded w-1/2 mt-2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-2">Failed to load jobs</p>
                <button onClick={fetchJobs} className="text-indigo-500 text-sm hover:underline">
                  Try again
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <p className="text-lg mb-1">No jobs match your filters</p>
                <p className="text-sm">Try adjusting your search or clearing filters</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center py-8 text-xs text-gray-300 mt-4">
        Aggregates from Remotive · RemoteOK · We Work Remotely · updates every 30 min
      </footer>
    </div>
  );
}
