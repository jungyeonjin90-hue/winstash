"use client";

import { useState } from "react";
import { Sparkles, Copy, Check, ArrowRight, Loader2, Info } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

const MAX_CHARS = 800;

const ROLES = [
  { value: "operations", label: "Operations / BizOps" },
  { value: "product", label: "Product / Program" },
  { value: "engineering", label: "Engineering" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design / UX" },
  { value: "sales", label: "Sales / CS" },
] as const;

// Clearly fictional sample notes so first-time visitors can see a result with one tap.
const SAMPLES = [
  {
    label: "Process fix",
    role: "operations",
    note: "Rebuilt the vendor invoice approval sheet so finance stops chasing missing sign-offs. Approvals used to take about 6 days, last month it was 2.",
  },
  {
    label: "Launch",
    role: "product",
    note: "Coordinated the pricing page relaunch with design, eng and legal. Ran the weekly check-ins and kept the launch date even after legal asked for changes.",
  },
  {
    label: "Bug fix",
    role: "engineering",
    note: "Found why the nightly export job kept failing (timezone bug), fixed it and added a test. No failed runs since.",
  },
] as const;

interface StarResult {
  star: { title: string; situation: string; task: string; action: string; result: string };
  bullet: string;
}

export function StarGeneratorTool({ signupHref }: { signupHref: string }) {
  const [note, setNote] = useState("");
  const [role, setRole] = useState<string>("operations");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<StarResult | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const generate = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/free-tool/star", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note, job_role: role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
        trackEvent("free_tool_failed", { tool: "star", status: res.status, reason: data.reason });
        return;
      }
      setResult(data as StarResult);
      trackEvent("free_tool_used", { tool: "star", role, chars: note.length });
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
      trackEvent("free_tool_copied", { tool: "star", part: key });
    } catch {
      // Clipboard can be blocked (e.g. in-app browsers); the text stays selectable.
    }
  };

  const starText = result
    ? `${result.star.title}\n\nSituation: ${result.star.situation}\nTask: ${result.star.task}\nAction: ${result.star.action}\nResult: ${result.star.result}`
    : "";

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="star-note" className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            What did you do? One or two sentences is enough.
          </label>
          <select
            aria-label="Your role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
          >
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <textarea
          id="star-note"
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, MAX_CHARS))}
          rows={4}
          placeholder="e.g. Cleaned up the onboarding checklist for new support hires and ran the first two sessions with it."
          className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-zinc-400">Try a sample:</span>
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => {
                setNote(s.note);
                setRole(s.role);
                trackEvent("free_tool_sample_clicked", { tool: "star", sample: s.label });
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-zinc-400">
            {note.length}/{MAX_CHARS} · No sign-up · Your note is not saved
          </span>
          <button
            type="button"
            onClick={generate}
            disabled={loading || note.trim().length < 10}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-md shadow-indigo-600/25 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{loading ? "Writing your STAR story..." : "Generate STAR story"}</span>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="space-y-4" aria-live="polite">
          <div className="bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50">{result.star.title}</h2>
              <CopyButton label="Copy STAR" done={copied === "star"} onClick={() => copy("star", starText)} />
            </div>
            <dl className="space-y-3 text-sm">
              {(
                [
                  ["Situation", result.star.situation],
                  ["Task", result.star.task],
                  ["Action", result.star.action],
                  ["Result", result.star.result],
                ] as const
              ).map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">{k}</dt>
                  <dd className="text-zinc-700 dark:text-zinc-300 leading-relaxed">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-5 sm:p-6 shadow-sm space-y-2">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Resume / brag sheet bullet
              </span>
              <CopyButton label="Copy bullet" done={copied === "bullet"} onClick={() => copy("bullet", result.bullet)} />
            </div>
            <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">{result.bullet}</p>
          </div>

          <p className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>
              We only use numbers you wrote. If your note had none, add the real figure (time saved, tickets closed,
              people trained) before you paste it into a review or resume.
            </span>
          </p>

          <div className="rounded-2xl p-5 sm:p-6 bg-indigo-600 text-white space-y-3">
            <p className="font-extrabold text-base sm:text-lg">Review season is easier when the notes already exist.</p>
            <p className="text-sm text-indigo-100">
              Write a 1-minute note every Friday. WinStash keeps them and turns them into your weekly update, brag sheet
              and STAR stories when you need them. Free to start.
            </p>
            <a
              href={signupHref}
              onClick={() => trackEvent("free_tool_cta_clicked", { tool: "star", location: "result" })}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-indigo-700 hover:bg-indigo-50"
            >
              <span>Start saving my wins</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function CopyButton({ label, done, onClick }: { label: string; done: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
        done
          ? "bg-emerald-600 text-white"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"
      }`}
    >
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
      <span>{done ? "Copied" : label}</span>
    </button>
  );
}
