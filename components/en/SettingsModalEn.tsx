"use client";

import { useState } from "react";
import { X, Database, Download, Upload, RotateCcw, Sparkles } from "lucide-react";
import {
  exportRecordsAsJSON,
  importRecordsFromJSON,
  resetToInitialRecords,
} from "@/lib/storage";

interface SettingsModalEnProps {
  isOpen: boolean;
  onClose: () => void;
  onDataReset: () => void;
  onDataImported: () => void;
}

export function SettingsModalEn({
  isOpen,
  onClose,
  onDataReset,
  onDataImported,
}: SettingsModalEnProps) {
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
    link.download = `career_pulse_backup_${new Date().toISOString().slice(0, 10)}.json`;
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
        setImportStatus("Backup successfully restored!");
        onDataImported();
      } else {
        setImportStatus("Invalid JSON backup file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm("Reset all logs to initial 3-week sample records?")) {
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
                CareerPulse Settings
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                AI engine specifications, cloud backup, and data management.
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
        <div className="bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/80 dark:from-indigo-950/30 dark:via-zinc-900 dark:to-violet-950/20 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-900 dark:text-indigo-300">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>High-Performance AI Engine (Gemini 2.0)</span>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            CareerPulse features a native Google Gemini 2.0 transformation pipeline. You don&apos;t need complex API keys—the service automatically structures your entries into polished executive English.
          </p>
        </div>

        {/* Section 2: Storage & Sync */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
            <Database className="w-4 h-4 text-emerald-500" />
            <span>Storage & Cloud Sync</span>
          </div>
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div className="flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Real-Time Cloud Synchronization Active</span>
            </div>
            All Friday notes and synthesized drawers are encrypted and securely synchronized with your Google UID. Access your records anytime across devices.
          </div>
        </div>

        {/* Section 3: Backup & Reset */}
        <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider block">
            Data Backup & Restore
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>

            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Restore JSON File</span>
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
              <span>Reset to Sample Data</span>
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
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
