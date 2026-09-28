"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Download,
  Copy,
  Check,
  Filter,
  FileSpreadsheet,
  Share2,
  Printer,
  Sparkles,
} from "lucide-react";
import { CareerRecord, SynthesisScale, JobRole, ToneManner, SynthesizedBragItem } from "@/types/career";
import { PersonaSelectorEn } from "../PersonaSelectorEn";
import { synthesizeBragItems } from "@/lib/synthesizer";
import { formatNotionMarkdownBrag } from "@/lib/exportFormatters";

interface BragDocumentTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function BragDocumentTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: BragDocumentTabProps) {
  const [selectedQuarter, setSelectedQuarter] = useState<string>("ALL");
  const [isCopied, setIsCopied] = useState(false);
  const [isNotionCopied, setIsNotionCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [linkedInCopiedId, setLinkedInCopiedId] = useState<string | null>(null);
  const [scale, setScale] = useState<SynthesisScale>(5);

  const handleRoleChange = (r: JobRole) => {
    if (onJobRoleChange) onJobRoleChange(r);
  };

  const handleToneChange = (t: ToneManner) => {
    if (onToneMannerChange) onToneMannerChange(t);
  };

  // Available Quarters
  const availableQuarters = useMemo(() => {
    const quarters = Array.from(new Set(records.map((r) => r.brag_sheet_item.quarter)));
    return quarters.sort().reverse();
  }, [records]);

  // Quarter filtering
  const filteredRecords = useMemo(() => {
    if (selectedQuarter === "ALL") return records;
    return records.filter((r) => r.brag_sheet_item.quarter === selectedQuarter);
  }, [records, selectedQuarter]);

  // Synthesized Brag items
  const synthesizedItems = useMemo(() => {
    return synthesizeBragItems(filteredRecords, scale, jobRole, toneManner);
  }, [filteredRecords, scale, jobRole, toneManner]);

  const copyAllMarkdown = async () => {
    const text = `# Brag Document · Performance Review Summary
Role Persona: ${jobRole.toUpperCase()} | Tone: ${toneManner.toUpperCase()}
Generated on: ${new Date().toLocaleDateString("en-US")}

${synthesizedItems
  .map(
    (item, idx) => `### ${idx + 1}. ${item.metric_summary}
- **Quarter Span**: ${item.quarter_span}
- **Business Value & Scope**: ${item.business_impact}
- **Key Highlights**: ${item.key_highlights.join("; ")}
`
  )
  .join("\n\n")}`;

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copyNotionMarkdown = async () => {
    const text = formatNotionMarkdownBrag(synthesizedItems, jobRole, selectedQuarter);
    try {
      await navigator.clipboard.writeText(text);
      setIsNotionCopied(true);
      setTimeout(() => setIsNotionCopied(false), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const copySingleItem = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const copyLinkedInSnippet = async (item: SynthesizedBragItem) => {
    const text = `🏆 Proud of what our team shipped during ${item.quarter_span}:

"${item.metric_summary}"

📌 Strategic Impact:
${item.business_impact}

Key milestones:
${item.key_highlights.map((h) => `• ${h}`).join("\n")}

#CareerWins #EngineeringLeadership #BuildingInPublic #Impact`;

    try {
      await navigator.clipboard.writeText(text);
      setLinkedInCopiedId(item.id);
      setTimeout(() => setLinkedInCopiedId(null), 2500);
    } catch (err) {
      console.error(err);
    }
  };

  const downloadCSV = () => {
    const headers = ["Quarter Span", "Metric Summary", "Business Impact", "Key Highlights"];
    const rows = synthesizedItems.map((item) => [
      `"${item.quarter_span}"`,
      `"${item.metric_summary.replace(/"/g, '""')}"`,
      `"${item.business_impact.replace(/"/g, '""')}"`,
      `"${item.key_highlights.join(" | ").replace(/"/g, '""')}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `brag_document_${jobRole}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Strategy Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 no-print">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-emerald-950 dark:text-emerald-200">
              Drawer 2: Brag Document (Performance Reviews & Comp Negotiations)
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              Mid-Term
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Synthesizes your weekly brain dumps into high-impact Google XYZ achievements for annual reviews.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Notion Markdown Copy */}
          <button
            onClick={copyNotionMarkdown}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Copy optimized Markdown with callouts and checklists for Notion"
          >
            {isNotionCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied for Notion!</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Notion Format</span>
              </>
            )}
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 shadow-xs transition-all cursor-pointer"
            title="Print or Save as Clean PDF"
          >
            <Printer className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-400" />
            <span>Print</span>
          </button>

          {/* Standard Markdown Copy */}
          <button
            onClick={copyAllMarkdown}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Markdown</span>
              </>
            )}
          </button>

          {/* CSV Export */}
          <button
            onClick={downloadCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
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

      {/* Synthesis Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 no-print">
        {/* Scale Picker */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Synthesis Scope:</span>
          </span>
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700">
            {([3, 5, 10, "ALL"] as SynthesisScale[]).map((val) => (
              <button
                key={String(val)}
                onClick={() => setScale(val)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scale === val
                    ? "bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                {val === "ALL" ? "All Weeks" : `Last ${val} Wks`}
              </button>
            ))}
          </div>
        </div>

        {/* Quarter Dropdown */}
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-zinc-500 dark:text-zinc-400 font-medium">Quarter:</span>
          <select
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
            className="px-2.5 py-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 font-semibold focus:outline-none"
          >
            <option value="ALL">All Quarters ({filteredRecords.length})</option>
            {availableQuarters.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Synthesized Brag Cards List */}
      <div className="space-y-4">
        {synthesizedItems.map((item, idx) => (
          <div
            key={item.id}
            className="print-page-break bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3.5 shadow-xs transition-all hover:border-emerald-500/40"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 text-xs font-bold font-mono">
                  #{idx + 1}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {item.quarter_span}
                </span>
                <span className="text-[11px] text-zinc-400">
                  {item.key_highlights.length} Key Milestones
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 no-print">
                {/* LinkedIn Share Snippet */}
                <button
                  onClick={() => copyLinkedInSnippet(item)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900 transition-colors cursor-pointer"
                  title="Copy achievement for LinkedIn post"
                >
                  {linkedInCopiedId === item.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-sky-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5 text-sky-600" />
                      <span>LinkedIn</span>
                    </>
                  )}
                </button>

                {/* Single Item Copy */}
                <button
                  onClick={() =>
                    copySingleItem(item.id, `• ${item.metric_summary}\n  - ${item.business_impact}`)
                  }
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  title="Copy achievement bullet"
                >
                  {copiedId === item.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Metric Summary (Google XYZ Formula) */}
            <div className="space-y-1">
              <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                <span>Google XYZ Metric Punch</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100 leading-snug">
                {item.metric_summary}
              </h3>
            </div>

            {/* Strategic Value & Impact */}
            <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-100 dark:border-zinc-800/80 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 mr-1.5">
                Strategic Impact:
              </span>
              {item.business_impact}
            </div>
          </div>
        ))}

        {synthesizedItems.length === 0 && (
          <div className="p-12 text-center rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 text-xs">
            <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 text-zinc-300 dark:text-zinc-600" />
            No achievements logged for the selected period.
          </div>
        )}
      </div>
    </div>
  );
}
