"use client";

import { Briefcase, Sliders, Sparkles } from "lucide-react";
import { JobRole, ToneManner } from "@/types/career";

export const JOB_ROLES: { id: JobRole; label: string; icon: string; desc: string }[] = [
  { id: "engineering", label: "개발·엔지니어링", icon: "💻", desc: "아키텍처, 레이턴시, 가용성, 리팩토링 및 기술 부채 해소 중심" },
  { id: "product", label: "기획·PO·PM", icon: "📋", desc: "유저 문제 정의, CVR, 기능 런칭, 로드맵 리딩 및 가치 창출 중심" },
  { id: "marketing", label: "마케팅·그로스", icon: "📈", desc: "ROAS, CAC, 리텐션, 캠페인 ROI 및 고객 획득 퍼널 최적화 중심" },
  { id: "operations", label: "운영·재무·경영", icon: "⚙️", desc: "프로세스 표준화, 마감 단축, 휴먼에러 제로화 및 비용 효율 중심" },
];

export const TONE_MANNERS: { id: ToneManner; label: string; icon: string; desc: string }[] = [
  { id: "impact", label: "임팩트·수치 중심", icon: "🚀", desc: "정량적 개선 지표, 매출 기여, 비용 절감, ROI 극대화 서술" },
  { id: "problem_solving", label: "문제해결·전문성", icon: "🛠️", desc: "근본 원인 규명, 논리적 해결 과정 및 직무 전문 깊이 강조" },
  { id: "stability", label: "안정성·표준화", icon: "🛡️", desc: "리스크 사전 예방, 표준 가이드라인 수립, 거버넌스 및 무결성 강조" },
  { id: "leadership", label: "협업·리더십", icon: "🤝", desc: "크로스 펑셔널 조율, 주도적 오너십 및 조직 생산성 기여 강조" },
];

interface PersonaSelectorProps {
  jobRole: JobRole;
  onJobRoleChange: (role: JobRole) => void;
  toneManner: ToneManner;
  onToneMannerChange: (tone: ToneManner) => void;
  compact?: boolean;
}

export function PersonaSelector({
  jobRole,
  onJobRoleChange,
  toneManner,
  onToneMannerChange,
  compact = false,
}: PersonaSelectorProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
      {/* Row 1: Job Role Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <Briefcase className="w-3.5 h-3.5 text-indigo-500" />
          <span>내 직군 (Role):</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {JOB_ROLES.map((r) => {
            const isSelected = jobRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => onJobRoleChange(r.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
                title={r.desc}
              >
                <span>{r.icon}</span>
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Tone & Manner Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <Sliders className="w-3.5 h-3.5 text-emerald-500" />
          <span>서술 톤앤매너 (Tone):</span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
          {TONE_MANNERS.map((t) => {
            const isSelected = toneManner === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onToneMannerChange(t.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-400"
                }`}
                title={t.desc}
              >
                <span>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Persona Guide description */}
      {!compact && (
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-500 dark:text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>
            <strong>[{JOB_ROLES.find((r) => r.id === jobRole)?.label}]</strong> 관점에서{" "}
            <strong>[{TONE_MANNERS.find((t) => t.id === toneManner)?.label}]</strong> 뉘앙스로 성과와 전문성을 재조명합니다.
          </span>
        </div>
      )}
    </div>
  );
}
