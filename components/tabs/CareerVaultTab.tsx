"use client";

import { useState, useMemo } from "react";
import {
  ShieldCheck,
  Eye,
  Copy,
  Check,
  Briefcase,
  Download,
  X,
  Tag,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { CareerRecord, SynthesisScale, SynthesizedStarItem, JobRole, ToneManner } from "@/types/career";
import { maskSynthesizedStarItem } from "@/lib/masking";
import { PeriodFilter, PeriodPreset } from "@/components/PeriodFilter";
import { ViewControls, ViewDensity } from "@/components/ViewControls";
import { PersonaSelector } from "@/components/PersonaSelector";
import { filterRecordsByPeriod, formatPeriodLabel } from "@/lib/dateFilter";
import { synthesizeStarItems } from "@/lib/synthesizer";

interface CareerVaultTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function CareerVaultTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: CareerVaultTabProps) {
  const [isNdaMasked, setIsNdaMasked] = useState(true);
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("ALL");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAllCopied, setIsAllCopied] = useState(false);

  // Multi-scale synthesis settings (3 / 5 / 10 / ALL)
  const [scale, setScale] = useState<SynthesisScale>(3);
  const [density, setDensity] = useState<ViewDensity>("detailed");
  const [expandedCardIds, setExpandedCardIds] = useState<Set<string>>(new Set());

  // 1. Period filtering
  const periodFiltered = useMemo(() => {
    return filterRecordsByPeriod(records, periodPreset, customStart, customEnd);
  }, [records, periodPreset, customStart, customEnd]);

  // All unique tags in the dataset
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    records.forEach((r) => r.star_portfolio.nda_tags.forEach((t) => tags.add(t)));
    return Array.from(tags);
  }, [records]);

  // 2. Dynamic synthesis based on scale, jobRole, toneManner (3 / 5 / 10 / ALL)
  const baseSynthesized = useMemo(() => {
    return synthesizeStarItems(periodFiltered, scale, jobRole, toneManner);
  }, [periodFiltered, scale, jobRole, toneManner]);

  // 3. Optional Tag filtering on synthesized items
  const filteredItems = useMemo(() => {
    if (selectedTag === "ALL") return baseSynthesized;
    return baseSynthesized.filter((item) =>
      item.nda_tags.some((t) => t.includes(selectedTag.replace("#", "")))
    );
  }, [baseSynthesized, selectedTag]);

  const activePeriodLabel = formatPeriodLabel(periodPreset, customStart, customEnd);

  // Toggle card expansion in compact mode
  const toggleCardExpansion = (id: string) => {
    setExpandedCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyStar = async (item: SynthesizedStarItem) => {
    const p = isNdaMasked ? maskSynthesizedStarItem(item) : item;
    const text = `📌 [프로젝트 #${p.rank}] ${p.title}
기간: ${p.period_span} | 핵심 역량: ${p.nda_tags.join(" ")}

• Situation (상황):
${p.situation}

• Task (과제):
${p.task}

• Action (조치 및 실행):
${p.action}

• Result (결과 및 성과):
${p.result}

---
Formatted with WinStash (https://winstash.net/ko)`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  // Generate Consolidated Resume text for the selected period and scale
  const generateConsolidatedPortfolioText = () => {
    const scaleLabel =
      scale === 3
        ? "임팩트 최우선 3대 핵심 프로젝트"
        : scale === 5
        ? "경력기술서 5대 프로젝트"
        : scale === 10
        ? "10대 세부 마일스톤"
        : "전체 프로젝트";

    let text = `📂 [선택 기간 경력기술서 및 포트폴리오 (${scaleLabel})]\n`;
    text += `• 조회 기간: ${activePeriodLabel} ${selectedTag !== "ALL" ? `(태그: ${selectedTag})` : ""}\n`;
    text += `• 보안 모드: ${isNdaMasked ? "대외비(NDA) 비식별화 적용됨" : "원문 공개 모드"}\n`;
    text += `• 프로젝트 수: 총 ${filteredItems.length}개 (${scale === "ALL" ? "전체" : `${scale}개 맞춤 압축`})\n\n`;

    filteredItems.forEach((item) => {
      const p = isNdaMasked ? maskSynthesizedStarItem(item) : item;

      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `${p.rank}. ${p.title} (${p.period_span})\n`;
      text += `핵심 역량: ${p.nda_tags.join(" ")}\n`;
      text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `[Situation] ${p.situation}\n\n`;
      text += `[Task]      ${p.task}\n\n`;
      text += `[Action]    ${p.action}\n\n`;
      text += `[Result]    ${p.result}\n\n\n`;
    });

    text += `\n---\nFormatted with WinStash (https://winstash.net/ko)\n`;
    return text.trim();
  };

  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(generateConsolidatedPortfolioText());
      setIsAllCopied(true);
      setTimeout(() => setIsAllCopied(false), 2500);
    } catch (err) {
      console.error("Copy all failed:", err);
    }
  };

  const handleDownloadAll = () => {
    const text = generateConsolidatedPortfolioText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Portfolio_${scale}_Projects_${activePeriodLabel.replace(/[\s~/:]+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Switches */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300">
              장기 산출물 · 이직용 STAR 포트폴리오
            </span>
            <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
              선택 기간 주간 기록 {periodFiltered.length}건 기반
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            적응형 STAR 경력기술서 & NDA 보호 금고
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            이력서 용도에 따라 3대 핵심 프로젝트 / 5대 프로젝트 / 10대 마일스톤으로 깊이를 다르게 재구성합니다.
          </p>
        </div>

        {/* Action Buttons: Export + NDA Toggle */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Consolidated Export Button */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm shadow-amber-600/20 transition-all cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{scale === "ALL" ? "전체 포트폴리오" : `${scale}대 프로젝트`} 내보내기</span>
          </button>

          {/* NDA Masking Toggle Switch */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <button
              onClick={() => setIsNdaMasked(true)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isNdaMasked
                  ? "bg-amber-500 text-white shadow-sm shadow-amber-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NDA 마스킹</span>
            </button>

            <button
              onClick={() => setIsNdaMasked(false)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                !isNdaMasked
                  ? "bg-zinc-800 text-white dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>원문</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Period Filter Component */}
      <PeriodFilter
        startDate={customStart}
        endDate={customEnd}
        preset={periodPreset}
        onPresetChange={setPeriodPreset}
        onDateChange={(start, end) => {
          setCustomStart(start);
          setCustomEnd(end);
        }}
        matchCount={periodFiltered.length}
      />

      {/* Tags Filter Bar */}
      {allTags.length > 0 && (
        <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 p-3 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-zinc-400 ml-1" />
          <span className="text-xs font-semibold text-zinc-500">역량 태그 필터:</span>
          <button
            onClick={() => setSelectedTag("ALL")}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              selectedTag === "ALL"
                ? "bg-amber-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
            }`}
          >
            전체 태그
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedTag === tag
                  ? "bg-amber-500 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* NDA Notice */}
      {isNdaMasked && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>대외비(NDA) 비식별화 모드</strong> 적용 중: 기업명, 주요 고객사, 매출 규모가 비식별화되어 외부 공유 시 안전합니다.
          </span>
        </div>
      )}

      {/* Job Role & Tone and Manner Selector */}
      <PersonaSelector
        jobRole={jobRole}
        onJobRoleChange={onJobRoleChange || (() => {})}
        toneManner={toneManner}
        onToneMannerChange={onToneMannerChange || (() => {})}
        compact={true}
      />

      {/* Adaptive Multi-Scale Synthesizer Controls */}
      <ViewControls
        scale={scale}
        onScaleChange={setScale}
        density={density}
        onDensityChange={setDensity}
        totalAvailableRecords={periodFiltered.length}
        synthesizedCount={filteredItems.length}
        accentColor="amber"
      />

      {/* Content Rendering (Detailed vs Compact) */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-2">
          <Briefcase className="w-8 h-8 text-zinc-300 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            선택한 조건에 해당하는 프로젝트가 없습니다.
          </h4>
          <p className="text-xs text-zinc-400">
            조회 기간 또는 역량 태그 필터를 변경해 보세요.
          </p>
        </div>
      ) : density === "compact" ? (
        /* COMPACT STAR VIEW */
        <div className="space-y-3">
          {filteredItems.map((rawItem) => {
            const item = isNdaMasked ? maskSynthesizedStarItem(rawItem) : rawItem;
            const isExpanded = expandedCardIds.has(item.id);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all space-y-3"
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-xs">
                      #{item.rank}
                    </span>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                      {item.period_span}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </h4>
                  </div>

                  {/* Actions & Tag */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center">
                    <div className="hidden sm:flex gap-1">
                      {item.nda_tags.slice(0, 2).map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => handleCopyStar(rawItem)}
                      className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="STAR 복사"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => toggleCardExpansion(item.id)}
                      className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 hover:underline px-2 py-1 font-medium cursor-pointer"
                    >
                      <span>{isExpanded ? "STAR 접기" : "STAR 상세 보기"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* 1-Line Compressed STAR Preview */}
                <div className="bg-zinc-50 dark:bg-zinc-950/60 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-zinc-500 shrink-0">[상황 & 해결]</span>
                    <span className="text-zinc-600 dark:text-zinc-400 truncate">
                      {item.situation} → {item.action}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      [정량 성과]
                    </span>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {item.result}
                    </span>
                  </div>
                </div>

                {/* Expanded Full STAR 4-Grid */}
                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 animate-in fade-in">
                    <div className="bg-zinc-100/60 dark:bg-zinc-800/60 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-700/50 text-xs space-y-1">
                      <span className="font-bold text-zinc-500 text-[10px] uppercase">
                        Situation (상황)
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {item.situation}
                      </p>
                    </div>

                    <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50 text-xs space-y-1">
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-[10px] uppercase">
                        Task (해결 과제)
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {item.task}
                      </p>
                    </div>

                    <div className="bg-indigo-50/60 dark:bg-indigo-950/30 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 text-xs space-y-1">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400 text-[10px] uppercase">
                        Action (조치)
                      </span>
                      <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                        {item.action}
                      </p>
                    </div>

                    <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-xs space-y-1">
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] uppercase">
                        Result (정량 성과)
                      </span>
                      <p className="text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                        {item.result}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED STAR VIEW (Full Cards) */
        <div className="space-y-5">
          {filteredItems.map((rawItem) => {
            const item = isNdaMasked ? maskSynthesizedStarItem(rawItem) : rawItem;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-sm hover:shadow-md transition-all space-y-5"
              >
                {/* Header: Project Title & Tags */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-6 h-6 rounded-md bg-amber-600 text-white font-bold flex items-center justify-center text-xs">
                        #{item.rank}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                        {item.period_span}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        {scale === "ALL" ? "주간 STAR" : `${scale}대 핵심 프로젝트`}
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {item.title}
                    </h4>
                  </div>

                  {/* Competency Tags & Copy */}
                  <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-center">
                    {item.nda_tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50 font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                    <button
                      onClick={() => handleCopyStar(rawItem)}
                      className="ml-2 p-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="STAR 경력기술서 복사"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* STAR 4 Grid Items */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {/* Situation */}
                  <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 flex items-center justify-center text-[10px]">
                        S
                      </span>
                      <span>Situation (상황)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.situation}
                    </p>
                  </div>

                  {/* Task */}
                  <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center text-[10px]">
                        T
                      </span>
                      <span>Task (과제)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.task}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="bg-zinc-50/70 dark:bg-zinc-800/40 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800/80 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-[10px]">
                        A
                      </span>
                      <span>Action (조치)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                      {item.action}
                    </p>
                  </div>

                  {/* Result */}
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      <span className="w-5 h-5 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-[10px]">
                        R
                      </span>
                      <span>Result (정량 성과)</span>
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 font-medium leading-relaxed">
                      {item.result}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Consolidated Portfolio Export Modal */}
      {isExportModalOpen && (
        <div 
          onClick={() => setIsExportModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-3xl w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    선택 기간 경력기술서 및 포트폴리오 통합본 ({scale === "ALL" ? "전체" : `${scale}대 프로젝트`})
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    조회 기간: {activePeriodLabel} | {filteredItems.length}개 프로젝트 통합 ({isNdaMasked ? "NDA 마스킹 적용" : "원문"})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview Box */}
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 flex-1 overflow-y-auto font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 space-y-4 whitespace-pre-wrap leading-relaxed">
              {generateConsolidatedPortfolioText()}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                onClick={handleCopyAll}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                {isAllCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">전체 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>클립보드 전체 복사</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>경력기술서 텍스트 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
