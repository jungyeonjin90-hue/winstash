"use client";

import { useState, useEffect } from "react";
import { Mic, MicOff, Sparkles, CornerDownLeft, RotateCcw, Lightbulb, Zap } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { WeekSpan, CareerRecord } from "@/types/career";
import { getCurrentWeekSpan } from "@/lib/weekUtils";
import { WeekPicker } from "./WeekPicker";
import { CreditStatus } from "@/lib/creditService";

interface QuickLoggerProps {
  onTransform: (
    rawMemo: string,
    targetWeek?: WeekSpan,
    role?: any,
    tone?: any,
    existingRecordId?: string
  ) => Promise<void>;
  isLoading: boolean;
  existingRecords?: CareerRecord[];
  creditStatus?: CreditStatus | null;
  onUpgradeClick?: () => void;
}

const PRESET_MEMOS = [
  {
    label: "⚡ 결제 핫픽스 & 응답속도 93% 개선 (개발)",
    text: "이번 주 토스 연동 결제 모듈에서 타임아웃 오류가 분당 50건씩 터져서 긴급 핫픽스 진행함. 원인은 DB 커넥션 풀 누수였는데 HikariCP 파라미터 튜닝하고 Redis 2차 캐싱 적용해서 해결. 덕분에 응답속도 1,200ms에서 85ms로 93% 개선되고 결제 에러율 0%로 안정화함. 다음 주엔 정기 점검이랑 Grafana 대시보드 고도화 예정.",
  },
  {
    label: "📈 온보딩 3단계 축소 & 가입 CVR 24% 상승 (기획)",
    text: "신규 유저 온보딩 퍼널 A/B 테스트 배포 완료. 기존 가입 5단계를 3단계로 줄이고 카카오 1초 로그인 전면 배치함. 일주일 동안 데이터 모니터링했는데 이탈률이 38%에서 19%로 반토막 나고, 가입 전환율(CVR)이 24% 올랐음.",
  },
  {
    label: "🎯 신규 획득 광고 최적화 & CAC 18% 절감 (마케팅)",
    text: "신규 유저 획득을 위한 검색 및 SNS 광고 랜딩 페이지 A/B 테스트 진행. 메시징을 혜택 중심으로 변경하고 원클릭 쿠폰 발급 연동함. 2주간 유입 전환율 32% 상승하고 CAC 18% 절감 성공.",
  },
  {
    label: "🛠️ 정산 엑셀 수작업 파이썬 슬랙봇 자동화 (운영)",
    text: "수작업으로 하던 주간 매출 정산 검증 엑셀 작업을 파이썬 스크립트랑 사내 슬랙봇으로 자동화 완료함. 재무팀이랑 3번 미팅해서 예외 케이스 8개 다 반영했고, 매주 금요일마다 4시간씩 걸리던 수작업이 이제 버튼 한 번으로 3분 만에 끝남. 데이터 오류율 0% 달성.",
  },
];

const LOADING_MESSAGES_KO = [
  "AI가 거친 메모를 분석 중입니다...",
  "성과 지표와 임팩트를 추출하고 있습니다...",
  "STAR 기법으로 케이스를 구조화합니다...",
  "민감한 정보를 마스킹 중입니다...",
  "거의 다 되었습니다! 서랍에 넣는 중..."
];

function LoadingMessages() {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % LOADING_MESSAGES_KO.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Sparkles className="w-4 h-4 animate-spin text-white/80" />
      <span className="text-white min-w-[210px] text-center">{LOADING_MESSAGES_KO[msgIdx]}</span>
    </div>
  );
}

export function QuickLogger({
  onTransform,
  isLoading,
  existingRecords = [],
  creditStatus = null,
  onUpgradeClick,
}: QuickLoggerProps) {
  const [memo, setMemo] = useState("");
  const [selectedWeek, setSelectedWeek] = useState<WeekSpan>(getCurrentWeekSpan());

  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    error: speechError,
  } = useSpeechRecognition({
    onResult: (transcribed) => {
      setMemo((prev) => (prev ? `${prev} ${transcribed}` : transcribed));
    },
  });

  const handleToggleMic = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const existingRecord = existingRecords?.find((record) => {
    if (record.target_week) {
      return (
        record.target_week.year === selectedWeek.year &&
        record.target_week.month === selectedWeek.month &&
        record.target_week.weekOfMonth === selectedWeek.weekOfMonth
      );
    }
    return false;
  });

  useEffect(() => {
    if (existingRecord) {
      setMemo(existingRecord.raw_memo);
    } else {
      setMemo("");
    }
  }, [selectedWeek.year, selectedWeek.month, selectedWeek.weekOfMonth, existingRecord?.id, existingRecord?.raw_memo]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!memo.trim() || isLoading) return;
    if (isListening) stopListening();

    if (creditStatus?.isUserExhausted && !creditStatus?.isPro) {
      onUpgradeClick?.();
      return;
    }

    await onTransform(memo.trim(), selectedWeek, undefined, undefined, existingRecord?.id);
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-sm transition-all hover:shadow-md space-y-4">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
              주간 업무 퀵 인풋 (Weekly Raw Memo)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            형식 고민 없이 이번 주 한 일, 이슈, 결과를 편하게 털어놓으세요. (3-Way 커리어 OS가 주간보고·연봉협상·포트폴리오로 자동 분류 및 누적합니다)
          </p>
        </div>

        {/* Word/Char Counter & Clear */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {memo.length > 0 && (
            <button
              onClick={() => setMemo("")}
              className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors px-2 py-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              비우기
            </button>
          )}
          <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono">
            {memo.length}자
          </span>
        </div>
      </div>

      {/* Week Selector Bar */}
      <WeekPicker
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        existingRecords={existingRecords}
      />

      {/* Preset Chips */}
      <div className="flex flex-wrap items-center gap-2 pt-0.5">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center gap-1 font-medium">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          빠른 예시 불러오기:
        </span>
        {PRESET_MEMOS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setMemo(preset.text)}
            className="text-xs px-2.5 py-1 rounded-full bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200/50 dark:border-zinc-700/60 transition-colors cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Textarea Container */}
      <div className="relative border-2 border-zinc-200 dark:border-zinc-800 rounded-2xl focus-within:border-indigo-500 dark:focus-within:border-indigo-400 focus-within:ring-4 focus-within:ring-indigo-500/10 transition-all bg-zinc-50/50 dark:bg-zinc-950/50">
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="이번 주 가장 시간 많이 썼거나 골치 아팠던 일, 대략적인 결과를 편하게 털어놓으세요. (예: 결제 오류 잡느라 고생함, 파이썬으로 엑셀 자동화해서 매주 4시간 아낌 등)"
          rows={4}
          disabled={isLoading}
          className="w-full bg-transparent p-4 sm:p-5 text-sm sm:text-base text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none resize-none leading-relaxed disabled:opacity-50"
        />

        {/* Bottom Toolbar inside Textarea */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-t border-zinc-200/60 dark:border-zinc-800/80 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm rounded-b-2xl">
          {/* Voice Input Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMic}
              title={
                !isSupported
                  ? "브라우저가 음성 입력을 지원하지 않습니다."
                  : isListening
                  ? "음성 인식 중지"
                  : "음성으로 받아쓰기"
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30 ring-2 ring-rose-400"
                  : "bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300"
              }`}
            >
              {isListening ? (
                <>
                  <MicOff className="w-3.5 h-3.5" />
                  <span>듣고 있습니다... (클릭 시 종료)</span>
                </>
              ) : (
                <>
                  <Mic className="w-3.5 h-3.5 text-indigo-500" />
                  <span>음성 받아쓰기 (STT)</span>
                </>
              )}
            </button>

            {speechError && (
              <span className="text-[11px] text-rose-500 font-medium">
                {speechError}
              </span>
            )}
          </div>

          {/* Transform & Submit Button or Out of Credits Warning */}
          <div className="flex items-center gap-2">
            {creditStatus?.isPro ? (
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
                <span>Pro 무제한</span>
              </span>
            ) : creditStatus && (
              <span className="hidden md:inline-flex text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                {creditStatus.isUserExhausted ? (
                  <span className="text-rose-500 font-semibold">무료 5회 소진 (0/{creditStatus.maxUserCredits})</span>
                ) : (
                  <span>무료 잔여 {creditStatus.remainingCredits}/{creditStatus.maxUserCredits}회</span>
                )}
              </span>
            )}

            {creditStatus && !creditStatus.isPro && creditStatus.isUserExhausted ? (
              <button
                type="button"
                onClick={onUpgradeClick}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>Pro 업그레이드 ($5.99)</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!memo.trim() || isLoading}
                className="flex items-center justify-center min-w-[200px] gap-2 px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white shadow-md shadow-indigo-600/25 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <LoadingMessages />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin-slow" />
                    <span>{existingRecord ? `${selectedWeek.month}월 ${selectedWeek.weekOfMonth}주차 수정 및 재생성` : `${selectedWeek.month}월 ${selectedWeek.weekOfMonth}주차 서랍에 저장`}</span>
                    <CornerDownLeft className="w-3.5 h-3.5 opacity-70 hidden sm:inline" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
