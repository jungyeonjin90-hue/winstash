"use client";

import { useState, useMemo } from "react";
import {
  TrendingUp,
  Award,
  Download,
  Copy,
  Check,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { CareerRecord, SynthesisScale, SynthesizedBragItem, JobRole, ToneManner } from "@/types/career";
import { PeriodFilter, PeriodPreset } from "@/components/PeriodFilter";
import { ViewControls, ViewDensity } from "@/components/ViewControls";
import { PersonaSelector } from "@/components/PersonaSelector";
import { filterRecordsByPeriod, formatPeriodLabel } from "@/lib/dateFilter";
import { synthesizeBragItems } from "@/lib/synthesizer";

interface BragSheetTabProps {
  records: CareerRecord[];
  jobRole?: JobRole;
  toneManner?: ToneManner;
  onJobRoleChange?: (role: JobRole) => void;
  onToneMannerChange?: (tone: ToneManner) => void;
}

export function BragSheetTab({
  records,
  jobRole = "engineering",
  toneManner = "impact",
  onJobRoleChange,
  onToneMannerChange,
}: BragSheetTabProps) {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("ALL");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("ALL");
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Multi-scale synthesis settings (3 / 5 / 10 / ALL)
  const [scale, setScale] = useState<SynthesisScale>(5);
  const [density, setDensity] = useState<ViewDensity>("detailed");
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());

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

  // 1. Period filter
  const periodFiltered = useMemo(() => {
    return filterRecordsByPeriod(records, periodPreset, customStart, customEnd);
  }, [records, periodPreset, customStart, customEnd]);

  // 2. Quarter filter
  const filteredRecords = useMemo(() => {
    if (selectedQuarter === "ALL") return periodFiltered;
    return periodFiltered.filter((r) => r.brag_sheet_item.quarter === selectedQuarter);
  }, [periodFiltered, selectedQuarter]);

  // 3. Dynamic synthesis based on scale, jobRole, and toneManner
  const synthesizedItems = useMemo(() => {
    return synthesizeBragItems(filteredRecords, scale, jobRole, toneManner);
  }, [filteredRecords, scale, jobRole, toneManner]);

  const activePeriodLabel = formatPeriodLabel(periodPreset, customStart, customEnd);

  // Toggle row expansion in compact mode
  const toggleRowExpansion = (id: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Generate Summary Text for selected period & scale
  const generatePeriodSummaryText = () => {
    const scaleLabel =
      scale === 3
        ? "C-Level 보고용 3대 핵심 성과"
        : scale === 5
        ? "연봉협상 5대 핵심 성과"
        : scale === 10
        ? "10대 주요 마일스톤 성과"
        : "기간 내 전체 주간 성과";

    let text = `🏆 [성과평가 & 연봉협상 종합 보고서 (${scaleLabel})]\n`;
    text += `• 대상 기간: ${activePeriodLabel} ${selectedQuarter !== "ALL" ? `(${selectedQuarter})` : ""}\n`;
    text += `• 집계 모드: ${scale === "ALL" ? "전체 기록" : `${scale}개 맞춤 압축 정리`}\n`;
    text += `• 총 성과 항목: ${synthesizedItems.length}개\n\n`;

    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `[핵심 정량 성과 및 수치 개선 리스트]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    synthesizedItems.forEach((item) => {
      text += `${item.rank}. [${item.quarter_span}] ${item.title}\n`;
      text += `   - 핵심 지표: ${item.metric_summary}\n`;
      text += `   - 비즈니스 임팩트: ${item.business_impact}\n\n`;
    });

    text += `\n---\n⚡ WinStash로 생성됨: https://winstash.xyz/ko\n`;
    return text.trim();
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(generatePeriodSummaryText());
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleCopySingle = async (item: SynthesizedBragItem) => {
    const text = `[${item.quarter_span}] ${item.title}\n• 성과 지표: ${item.metric_summary}\n• 비즈니스 임팩트: ${item.business_impact}\n\n---\n⚡ WinStash: https://winstash.xyz/ko`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadSummary = () => {
    const text = generatePeriodSummaryText();
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BragSheet_${scale}_Items_${activePeriodLabel.replace(/[\s~/:]+/g, "_")}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Exporter Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 p-4 sm:p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300">
              중기 산출물 · 성과평가 & 연봉협상
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              선택 기간 주간 기록 {filteredRecords.length}건 기반
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50 mt-1">
            적응형 성과평가 & 연봉협상 시트 (Brag Sheet)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            선택한 개수(3개/5개/10개/전체)에 따라 중요도를 다르게 합성하여 맞춤형 핵심 성과를 도출합니다.
          </p>
        </div>

        {/* Export Period Summary Button */}
        <button
          onClick={() => setIsExportModalOpen(true)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer w-full sm:w-auto"
        >
          <Award className="w-4 h-4 text-emerald-100" />
          <span>{scale === "ALL" ? "전체 성과" : `${scale}대 핵심 성과`} 보고서 내보내기</span>
        </button>
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
        matchCount={filteredRecords.length}
      />

      {/* Secondary Quarter Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <span>분기별 세부 필터:</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setSelectedQuarter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedQuarter === "ALL"
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
              }`}
            >
              전체 분기
            </button>
            {availableQuarters.map((q) => (
              <button
                key={q}
                onClick={() => setSelectedQuarter(q)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  selectedQuarter === q
                    ? "bg-emerald-600 text-white"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-zinc-400 font-mono self-end sm:self-center">
          적용 기간: <span className="text-zinc-700 dark:text-zinc-300 font-medium">{activePeriodLabel}</span>
        </div>
      </div>

      {/* Job Role & Tone and Manner Selector */}
      <PersonaSelector
        jobRole={jobRole}
        onJobRoleChange={handleRoleChange}
        toneManner={toneManner}
        onToneMannerChange={handleToneChange}
        compact={true}
      />

      {/* Adaptive Multi-Scale Synthesizer Controls */}
      <ViewControls
        scale={scale}
        onScaleChange={setScale}
        density={density}
        onDensityChange={setDensity}
        totalAvailableRecords={filteredRecords.length}
        synthesizedCount={synthesizedItems.length}
        accentColor="emerald"
      />

      {/* Content Rendering (Detailed vs Compact) */}
      {synthesizedItems.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-10 text-center space-y-2">
          <FileSpreadsheet className="w-8 h-8 text-zinc-300 mx-auto" />
          <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
            선택한 조건에 해당하는 성과 항목이 없습니다.
          </h4>
          <p className="text-xs text-zinc-400">
            조회 기간 또는 분기 필터를 변경해 보세요.
          </p>
        </div>
      ) : density === "compact" ? (
        /* COMPACT VIEW */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm divide-y divide-zinc-100 dark:divide-zinc-800">
          <div className="hidden sm:grid grid-cols-12 gap-3 px-5 py-3 bg-zinc-50 dark:bg-zinc-950/60 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <div className="col-span-1 text-center">순위</div>
            <div className="col-span-4">핵심 성과명 & 정량 지표</div>
            <div className="col-span-6">비즈니스 기여도 & 임팩트</div>
            <div className="col-span-1 text-right">복사</div>
          </div>

          {synthesizedItems.map((item) => {
            const isExpanded = expandedRowIds.has(item.id);

            return (
              <div
                key={item.id}
                className="p-4 sm:px-5 sm:py-3.5 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-3 items-start sm:items-center">
                  {/* Rank & Quarter */}
                  <div className="sm:col-span-1 flex sm:flex-col items-center sm:items-center gap-1.5 sm:gap-0.5">
                    <span className="w-6 h-6 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-xs">
                      #{item.rank}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {item.quarter_span}
                    </span>
                  </div>

                  {/* Title & Metric */}
                  <div className="sm:col-span-4 space-y-0.5">
                    <div className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100">
                      {item.title}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                      <span>{item.metric_summary}</span>
                    </div>
                  </div>

                  {/* Business Impact */}
                  <div className="sm:col-span-6 text-xs text-zinc-600 dark:text-zinc-400">
                    <div className="flex items-center justify-between">
                      <span className={isExpanded ? "" : "truncate max-w-[380px]"}>
                        {item.business_impact}
                      </span>
                      <button
                        onClick={() => toggleRowExpansion(item.id)}
                        className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 ml-1 sm:inline hidden cursor-pointer"
                      >
                        {isExpanded ? "접기" : "더보기"}
                      </button>
                    </div>
                    {isExpanded && item.key_highlights && (
                      <div className="mt-2 pt-2 text-[11px] text-zinc-500 border-t border-zinc-100 dark:border-zinc-800 space-y-1">
                        {item.key_highlights.map((kh, ki) => (
                          <div key={ki} className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            <span>{kh}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Action */}
                  <div className="sm:col-span-1 flex items-center justify-end">
                    <button
                      onClick={() => handleCopySingle(item)}
                      className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                      title="성과 항목 복사"
                    >
                      {copiedId === item.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* DETAILED VIEW (Cards Grid) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {synthesizedItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-xs">
                      #{item.rank}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-mono">
                      {item.quarter_span}
                    </span>
                  </div>

                  <button
                    onClick={() => handleCopySingle(item)}
                    className="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                    title="복사"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Title */}
                <h4 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-zinc-50 leading-snug">
                  {item.title}
                </h4>

                {/* Metric Summary */}
                <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block mb-0.5">
                    핵심 정량 성과 지표
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-emerald-950 dark:text-emerald-100 flex items-start gap-1.5">
                    <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{item.metric_summary}</span>
                  </div>
                </div>

                {/* Business Impact */}
                <div className="bg-zinc-50 dark:bg-zinc-800/40 p-3.5 rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block mb-1">
                    조직 및 비즈니스 기여 가치
                  </span>
                  <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {item.business_impact}
                  </p>
                </div>
              </div>

              {/* Tags & Highlights */}
              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500">
                <div className="flex gap-1 flex-wrap">
                  {item.nda_tags.map((t, ti) => (
                    <span
                      key={ti}
                      className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  {scale === "ALL" ? "개별 기록" : `${scale}선 압축`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Export Period Summary Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                    성과평가 & Brag Sheet 종합 보고서 ({scale === "ALL" ? "전체" : `${scale}대 성과`})
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    조회 기간: {activePeriodLabel} | {synthesizedItems.length}개 핵심 항목으로 맞춤 압축 정리된 보고서입니다.
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
            <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 max-h-[380px] overflow-y-auto font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 space-y-4">
              <div className="pb-3 border-b border-zinc-200 dark:border-zinc-800">
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  [성과평가 요약 헤더 - {scale === "ALL" ? "전체 기록" : `${scale}대 성과`}]
                </p>
                <p className="text-xs text-zinc-500 mt-0.5 font-sans">
                  조회 기간: {activePeriodLabel} | 압축 합성 항목: {synthesizedItems.length}건
                </p>
              </div>

              {synthesizedItems.map((item) => (
                <div key={item.id} className="pb-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0 last:pb-0">
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <span>{item.rank}.</span>
                    <span>[{item.quarter_span}]</span>
                    <span>{item.title}</span>
                  </div>
                  <p className="mt-1 text-zinc-700 dark:text-zinc-300 pl-4 font-sans text-xs font-semibold">
                    • 핵심 지표: {item.metric_summary}
                  </p>
                  <p className="mt-0.5 text-zinc-600 dark:text-zinc-400 pl-4 font-sans text-xs">
                    • 비즈니스 임팩트: {item.business_impact}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={handleCopySummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>클립보드 전체 복사</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadSummary}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>보고서 텍스트 다운로드</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
