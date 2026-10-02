"use client";

import { useState } from "react";
import { X, Database, Download, Upload, RotateCcw, Sparkles } from "lucide-react";
import {
  exportRecordsAsJSON,
  importRecordsFromJSON,
  resetToInitialRecords,
} from "@/lib/storage";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  onDataImported: () => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  onDataReset,
  onDataImported,
}: SettingsModalProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setImportStatus(null);
    }
  }

  if (!isOpen) return null;

  const handleExport = () => {
    const dataStr = exportRecordsAsJSON();
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `winstash_backup_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importRecordsFromJSON(content);
      if (success) {
        setImportStatus("데이터 가져오기 성공!");
        onDataImported();
      } else {
        setImportStatus("유효하지 않은 백업 파일 형식입니다.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("모든 데이터를 초기 3개 주간 예시 레코드로 재설정하시겠습니까?")) {
      resetToInitialRecords();
      onDataReset();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                WinStash 환경 설정
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI 엔진 사양, 데이터 백업 및 보관소를 관리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: AI Engine Info Banner */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>최신 고성능 AI 엔진 탑재</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            WinStash는 사용자가 별도 복잡한 API 키를 발급받을 필요 없이, 서버 내장 최신 AI 엔진을 통해 주간보고·연봉협상 시트·STAR 포트폴리오를 가장 세련된 비즈니스 문체로 자동 변환합니다.
          </p>
        </div>

        {/* Section 2: Storage & Firebase Structure */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>데이터 영구 저장소 & 동기화</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>클라우드 동기화 및 자동 백업 활성화됨</span>
            </div>
            입력하신 모든 주간 메모와 변환 산출물은 안전하게 격리된 사용자 고유 데이터베이스에 영구 보관되며 언제든지 기기를 넘나들며 열람하실 수 있습니다.
          </div>
        </div>

        {/* Section 3: Backup & Reset */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
            데이터 백업 및 복원
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON 백업 다운로드</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>백업 파일 복원</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </label>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-auto cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>초기 데이터 리셋</span>
            </button>
          </div>

          {importStatus && (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              {importStatus}
            </p>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-white dark:text-zinc-900 transition-colors cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
