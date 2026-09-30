"use client";

import { UserCircle, Sliders } from "lucide-react";
import { JobRole, ToneManner } from "@/types/career";

interface PersonaSelectorEnProps {
  currentRole: JobRole;
  currentTone: ToneManner;
  onRoleChange: (role: JobRole) => void;
  onToneChange: (tone: ToneManner) => void;
}

const ROLES: { id: JobRole; label: string; desc: string }[] = [
  {
    id: "engineering",
    label: "💻 Software Engineer",
    desc: "Architecture, latency reduction, p99 metrics, technical debt",
  },
  {
    id: "product",
    label: "🚀 Product Manager",
    desc: "User problem framing, CVR funnel, feature shipping velocity, business ROI",
  },
  {
    id: "marketing",
    label: "📈 Growth Marketer",
    desc: "ROAS, CAC reduction, user retention, acquisition funnel lift",
  },
  {
    id: "operations",
    label: "⚙️ BizOps / Finance",
    desc: "Process automation, SLA compression, zero human error, cost savings",
  },
];

const TONES: { id: ToneManner; label: string; desc: string }[] = [
  {
    id: "impact",
    label: "🎯 Quantifiable Impact",
    desc: "XYZ impact formula ('Accomplished X, measured by Y, by doing Z')",
  },
  {
    id: "problem_solving",
    label: "🧩 Problem-Solving & Depth",
    desc: "Root-cause diagnostics, architectural resilience, troubleshooting mastery",
  },
  {
    id: "stability",
    label: "🛡️ Reliability & Governance",
    desc: "Risk mitigation, zero downtime, security posture, runbook standardization",
  },
  {
    id: "leadership",
    label: "🤝 Leadership & Ownership",
    desc: "Cross-functional alignment, stakeholder management, team velocity",
  },
];

export function PersonaSelectorEn({
  currentRole,
  currentTone,
  onRoleChange,
  onToneChange,
}: PersonaSelectorEnProps) {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 space-y-4">
      {/* Tone Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <Sliders className="w-3.5 h-3.5 text-violet-500" />
          <span>Narrative Tone & Voice</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {TONES.map((t) => {
            const active = currentTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToneChange(t.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  active
                    ? "border-violet-600 bg-white dark:bg-zinc-900 shadow-xs ring-2 ring-violet-500/20 text-violet-900 dark:text-violet-200"
                    : "border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 hover:bg-white text-zinc-600 dark:text-zinc-400"
                }`}
              >
                <div className="font-bold text-xs truncate">{t.label}</div>
                <div className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5">
                  {t.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
