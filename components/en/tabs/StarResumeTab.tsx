"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Briefcase,
  Tag,
  TrendingUp,
  Share2,
  Printer,
  Sparkles,
} from "lucide-react";
import { CareerRecord, SynthesisScale, JobRole, ToneManner, SynthesizedStarItem } from "@/types/career";
import { maskSynthesizedStarItem } from "@/lib/masking";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { synthesizeStarItems } from "@/lib/synthesizer";
import { formatLinkedInPost, formatAtsResumeMarkdown } from "@/lib/exportFormatters";

interface StarResumeTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function StarResumeTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: StarResumeTabProps) {
  const [isNdaMasked, setIsNdaMasked] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [linkedInCopiedId, setLinkedInCopiedId] = useState<string | null>(null);
  const [scale, setScale] = useState<SynthesisScale>(3);

  const handleRoleChange = (r: JobRole) => {
    if (onJobRoleChange) onJobRoleChange(r);
  };

  const handleToneChange = (t: ToneManner) => {
    if (onToneMannerChange) onToneMannerChange(t);
  };

  // Synthesized STAR items
  const synthesizedItems = useMemo(() => {
    return synthesizeStarItems(records, scale, jobRole, toneManner);
  }, [records, scale, jobRole, toneManner]);

  // Unique domain tags
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    synthesizedItems.forEach((item) => {
      item.nda_tags.forEach((t) => tags.add(t));
    });
    return Array.from(tags);
  }, [synthesizedItems]);

  // Tag filter
  const displayedItems = useMemo(() => {
    const list =
      selectedTag === "ALL"
        ? synthesizedItems
        : synthesizedItems.filter((i) => i.nda_tags.includes(selectedTag));

    if (isNdaMasked) {
      return list.map((item) => maskSynthesizedStarItem(item));
    }
    return list;
  }, [synthesizedItems, selectedTag, isNdaMasked]);

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLinkedInPostItem = async (item: SynthesizedStarItem) => {
    const post = formatLinkedInPost(item, jobRole);
    try {
      await navigator.clipboard.writeText(post);
      setLinkedInCopiedId(item.id);
      setTimeout(() => setLinkedInCopiedId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copyAllMarkdown = async () => {
    const text = formatAtsResumeMarkdown(displayedItems, jobRole);
    try {
      await navigator.clipboard.writeText(text);
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrintAts = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Confidentiality Shield Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-amber-950 dark:text-amber-200">
              Drawer 3: STAR Resume Bullets & Case Studies
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
              Long-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Engineered for LinkedIn experience bullets, tech resumes, and senior behavioral interviews.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* NDA Shield Toggle */}
          <button
            onClick={() => setIsNdaMasked(!isNdaMasked)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isNdaMasked
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-transparent hover:text-zinc-800"
            }`}
            title="Toggle confidential client and company masking"
          >
            {isNdaMasked ? <ShieldCheck className="w-3.5 h-3.5 text-amber-500" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isNdaMasked ? "NDA Shield: ON" : "NDA Shield: OFF"}</span>
          </button>

          {/* ATS Print / PDF Export */}
          <button
            onClick={handlePrintAts}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Print or Save as Clean ATS PDF"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Print / PDF</span>
          </button>

          {/* Copy All Resume Markdown */}
          <button
            onClick={copyAllMarkdown}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
          >
            {isAllCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy for Resume</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Persona Customizer */}
      <div className="no-print">
        <PersonaSelectorEn
          currentRole={jobRole}
          currentTone={toneManner}
          onRoleChange={handleRoleChange}
          onToneChange={handleToneChange}
        />
      </div>

      {/* Controls Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print">
        {/* Scale Picker */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
            <span>Synthesis Scope:</span>
          </span>
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
            {([3, 5, 10, "ALL"] as SynthesisScale[]).map((val) => (
              <button
                key={String(val)}
                onClick={() => setScale(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scale === val
                    ? "bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {val === "ALL" ? "All Weeks" : `Last ${val} Wks`}
              </button>
            ))}
          </div>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-2 text-xs">
          <Tag className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Domain:</span>
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none"
          >
            <option value="ALL">All Competencies ({displayedItems.length})</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* STAR Cards List */}
      <div className="space-y-4">
        {displayedItems.map((item, idx) => (
          <div
            key={item.id}
            className="print-page-break bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs transition-all hover:border-amber-500/40"
          >
            {/* Headline Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                    #{idx + 1}
                  </span>
                  <span className="text-[11px] font-semibold text-zinc-400">
                    {item.period_span}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-extrabold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {item.title}
                </h3>
              </div>

              {/* Action Buttons for Card */}
              <div className="flex items-center gap-1.5 no-print">
                {/* LinkedIn Viral Post Copy Button */}
                <button
                  onClick={() => copyLinkedInPostItem(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors cursor-pointer"
                  title="Generate viral LinkedIn post from this case study"
                >
                  {linkedInCopiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                      <span>Copied Post!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>LinkedIn Post</span>
                    </>
                  )}
                </button>

                {/* Bullet Text Copy */}
                <button
                  onClick={() =>
                    copySingleItem(
                      item.id,
                      `**${item.title}**\n- Situation: ${item.situation}\n- Task: ${item.task}\n- Action: ${item.action}\n- Result: ${item.result}`
                    )
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy STAR bullet text"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* STAR Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider text-[11px] block">
                  S · Situation
                </span>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {item.situation}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider text-[11px] block">
                  T · Task
                </span>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {item.task}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[11px] block">
                  A · Action
                </span>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  {item.action}
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800 space-y-1">
                <span className="font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider text-[11px] block">
                  R · Result (Google XYZ)
                </span>
                <p className="text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                  {item.result}
                </p>
              </div>
            </div>

            {/* Tags Footer */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
              {item.nda_tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/40"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}

        {displayedItems.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            <Briefcase className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            No case studies found for the selected competency tag.
          </div>
        )}
      </div>
    </div>
  );
}
