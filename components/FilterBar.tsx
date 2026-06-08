"use client";

import { TAG_OPTIONS } from "@/lib/keywords";
import { JobFilter } from "@/lib/types";
import clsx from "clsx";

interface Props {
  filter: JobFilter;
  onChange: (f: JobFilter) => void;
  total: number;
}

export default function FilterBar({ filter, onChange, total }: Props) {
  const toggleType = (t: "remote" | "hybrid") => {
    const has = filter.types.includes(t);
    onChange({
      ...filter,
      types: has ? filter.types.filter((x) => x !== t) : [...filter.types, t],
    });
  };

  const toggleTag = (tag: string) => {
    const has = filter.tags.includes(tag);
    onChange({
      ...filter,
      tags: has ? filter.tags.filter((x) => x !== tag) : [...filter.tags, tag],
    });
  };

  const clear = () => onChange({ search: "", types: [], tags: [] });
  const hasFilters = filter.search || filter.types.length || filter.tags.length;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search jobs, companies…"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
        />
      </div>

      {/* Work type */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Work type
        </p>
        <div className="flex gap-2">
          {(["remote", "hybrid"] as const).map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={clsx(
                "px-4 py-1.5 rounded-full text-sm font-medium border transition-all",
                filter.types.includes(t)
                  ? t === "remote"
                    ? "bg-green-500 text-white border-green-500"
                    : "bg-yellow-400 text-white border-yellow-400"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
              )}
            >
              {t === "remote" ? "🌍 Remote" : "🏢 Hybrid"}
            </button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
          Skills
        </p>
        <div className="flex flex-wrap gap-1.5">
          {TAG_OPTIONS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={clsx(
                "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                filter.tags.includes(tag)
                  ? "bg-indigo-500 text-white border-indigo-500"
                  : "bg-white text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-500"
              )}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-sm text-gray-400">
          <span className="font-semibold text-gray-700">{total}</span> jobs found
        </span>
        {hasFilters && (
          <button
            onClick={clear}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
