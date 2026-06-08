"use client";

import { Job } from "@/lib/types";
import { ExternalLink, MapPin, Clock, Briefcase } from "lucide-react";
import clsx from "clsx";

const TAG_COLORS: Record<string, string> = {
  "Meta Ads": "bg-blue-100 text-blue-700",
  "Google Ads": "bg-red-100 text-red-700",
  "Media Buying": "bg-purple-100 text-purple-700",
  "Creative Strategy": "bg-pink-100 text-pink-700",
  "AI Design": "bg-indigo-100 text-indigo-700",
  "PPC": "bg-orange-100 text-orange-700",
  "Performance Marketing": "bg-green-100 text-green-700",
  "TikTok Ads": "bg-fuchsia-100 text-fuchsia-700",
  "Programmatic": "bg-cyan-100 text-cyan-700",
  "Growth Marketing": "bg-emerald-100 text-emerald-700",
  "E-commerce": "bg-amber-100 text-amber-700",
  "Social Media": "bg-sky-100 text-sky-700",
  "UGC": "bg-rose-100 text-rose-700",
};

const SLOVENIAN_SOURCES = new Set(["MojeDelo", "Karierna", "Zaposlitev"]);

export default function JobCard({ job }: { job: Job }) {
  const isSlovenian = SLOVENIAN_SOURCES.has(job.source);
  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className={clsx(
        "group block bg-white rounded-2xl border hover:shadow-lg transition-all duration-200 p-5",
        isSlovenian
          ? "border-blue-100 hover:border-blue-300"
          : "border-gray-100 hover:border-indigo-200"
      )}
    >
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="shrink-0 w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden flex items-center justify-center">
          {job.companyLogo ? (
            <img src={job.companyLogo} alt={job.company} className="w-10 h-10 object-contain" />
          ) : (
            <span className="text-lg font-bold text-gray-300">
              {job.company?.[0]?.toUpperCase() ?? "?"}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm text-gray-500 mt-0.5">{job.company}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 mt-1 transition-colors" />
          </div>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span
              className={clsx(
                "flex items-center gap-1 font-medium px-2 py-0.5 rounded-full text-xs",
                job.type === "remote"
                  ? "bg-green-50 text-green-600"
                  : "bg-yellow-50 text-yellow-600"
              )}
            >
              <Briefcase className="w-3 h-3" />
              {job.type === "remote" ? "Remote" : "Hybrid"}
            </span>
            {job.salary && (
              <span className="text-gray-500 font-medium">{job.salary}</span>
            )}
            <span className="flex items-center gap-1 ml-auto">
              <Clock className="w-3 h-3" /> {job.postedAt}
            </span>
          </div>

          {/* Tags */}
          {job.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.tags.map((tag) => (
                <span
                  key={tag}
                  className={clsx(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"
                  )}
                >
                  {tag}
                </span>
              ))}
              <span
                className={clsx(
                  "text-xs px-2 py-0.5 rounded-full ml-auto font-medium",
                  isSlovenian
                    ? "bg-blue-50 text-blue-500"
                    : "bg-gray-50 text-gray-400"
                )}
              >
                {isSlovenian ? "🇸🇮 " : ""}{job.source}
              </span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}
