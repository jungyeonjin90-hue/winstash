"use client";

import { useState } from "react";
import { Sparkles, Briefcase, CheckCircle2 } from "lucide-react";
import { JobRole } from "@/types/career";

interface OnboardingModalEnProps {
  isOpen: boolean;
  onSave: (role: JobRole) => void;
}

export function OnboardingModalEn({ isOpen, onSave }: OnboardingModalEnProps) {
  const [selectedRole, setSelectedRole] = useState<JobRole>("engineering");

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(selectedRole);
  };

  const JOB_ROLES: { id: JobRole; label: string; desc: string }[] = [
    { id: "engineering", label: "Engineering", desc: "Software, QA, DevOps, Data" },
    { id: "product", label: "Product Management", desc: "PM, PO, Strategy" },
    { id: "design", label: "Design", desc: "UX/UI, Product Design, Research" },
    { id: "marketing", label: "Marketing", desc: "Growth, Content, Brand" },
    { id: "sales", label: "Sales & BD", desc: "Account Exec, Partnerships" },
    { id: "operations", label: "Operations", desc: "HR, Finance, Supply Chain" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-8 shadow-2xl space-y-8">
        
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 text-white mb-2">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
            Welcome to WinStash
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Let&apos;s personalize your AI engine. Select your primary job role. 
            <br className="hidden sm:block"/>
            <span className="text-xs opacity-80">(You can change this later in Settings)</span>
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {JOB_ROLES.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/30"
                    : "border-zinc-200 dark:border-zinc-800 bg-transparent hover:border-indigo-300 dark:hover:border-indigo-700/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Briefcase className={`w-4 h-4 ${isSelected ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-400"}`} />
                  <span className={`text-sm font-bold ${isSelected ? "text-indigo-900 dark:text-indigo-100" : "text-zinc-700 dark:text-zinc-300"}`}>
                    {role.label}
                  </span>
                </div>
                <span className={`text-[11px] font-medium leading-relaxed ${isSelected ? "text-indigo-600/80 dark:text-indigo-400/80" : "text-zinc-500"}`}>
                  {role.desc}
                </span>

                {isSelected && (
                  <div className="absolute top-3 right-3 text-indigo-600 dark:text-indigo-400 animate-in zoom-in">
                    <CheckCircle2 className="w-5 h-5 fill-current text-white dark:text-zinc-900" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer"
        >
          Write my first note
        </button>

      </div>
    </div>
  );
}
