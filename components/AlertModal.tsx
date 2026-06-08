"use client";

import { useState } from "react";
import { TAG_OPTIONS } from "@/lib/keywords";
import { X, Bell, Check, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  onClose: () => void;
}

type State = "idle" | "loading" | "success" | "error" | "exists";

export default function AlertModal({ onClose }: Props) {
  const [email, setEmail] = useState("");
  const [types, setTypes] = useState<("remote" | "hybrid")[]>(["remote", "hybrid"]);
  const [tags, setTags] = useState<string[]>([]);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const toggleType = (t: "remote" | "hybrid") =>
    setTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const toggleTag = (tag: string) =>
    setTags((prev) => prev.includes(tag) ? prev.filter((x) => x !== tag) : [...prev, tag]);

  const submit = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg("Please enter a valid email address.");
      setState("error");
      return;
    }
    if (types.length === 0) {
      setErrorMsg("Select at least one work type.");
      setState("error");
      return;
    }
    setState("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, tags, types }),
      });
      if (res.status === 409) { setState("exists"); return; }
      if (!res.ok) throw new Error();
      setState("success");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setState("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {state === "success" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Alert set!</h3>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;ll email you at <strong>{email}</strong> whenever new matching jobs appear.
              Check your inbox for a confirmation.
            </p>
            <button
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Done
            </button>
          </div>
        ) : state === "exists" ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Already subscribed</h3>
            <p className="text-gray-500 text-sm mb-6">
              <strong>{email}</strong> is already receiving job alerts.
            </p>
            <button
              onClick={onClose}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors"
            >
              Got it
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Set job alert</h3>
                <p className="text-sm text-gray-400">Get emailed when new jobs appear</p>
              </div>
            </div>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setState("idle"); }}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
            </div>

            {/* Work type */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Work type</label>
              <div className="flex gap-2">
                {(["remote", "hybrid"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={clsx(
                      "flex-1 py-2 rounded-xl text-sm font-medium border transition-all",
                      types.includes(t)
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

            {/* Skills filter */}
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Filter by skill <span className="text-gray-400 font-normal">(optional — leave blank for all)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={clsx(
                      "px-3 py-1 rounded-full text-xs font-medium border transition-all",
                      tags.includes(tag)
                        ? "bg-indigo-500 text-white border-indigo-500"
                        : "bg-white text-gray-500 border-gray-200 hover:border-indigo-200 hover:text-indigo-500"
                    )}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {state === "error" && (
              <p className="text-red-500 text-sm mb-4">{errorMsg}</p>
            )}

            <button
              onClick={submit}
              disabled={state === "loading"}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {state === "loading" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up alert…
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Notify me
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">
              Unsubscribe any time. No spam.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
