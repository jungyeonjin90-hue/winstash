"use client";

import React, { useState, useEffect } from "react";
import { X, Bug, Lightbulb, MessageSquare, Send, CheckCircle2, Loader2, Laptop, ShieldCheck } from "lucide-react";
import { FeedbackType } from "@/types/career";
import { submitFeedbackToFirestore } from "@/lib/firestoreService";
import { useAuth } from "@/context/AuthContext";

interface FeedbackModalEnProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  initialType?: FeedbackType;
}

export function FeedbackModalEn({
  isOpen,
  onClose,
  onSuccess,
  initialType = "bug",
}: FeedbackModalEnProps) {
  const { user } = useAuth();

  const [type, setType] = useState<FeedbackType>(initialType);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 모달이 열릴 때 초기화 및 Escape 키 리스너 등록
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setTitle("");
      setMessage("");
      setEmail(user?.email || "");
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, initialType, user?.email]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setIsSubmitting(true);
    try {
      // 기기 및 환경 메타데이터 수집
      const metadata = {
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "unknown",
        screenResolution:
          typeof window !== "undefined"
            ? `${window.innerWidth}x${window.innerHeight}`
            : "unknown",
        pathname: typeof window !== "undefined" ? window.location.pathname : "/",
        platform: typeof window !== "undefined" ? window.navigator.platform : "unknown",
        language: typeof window !== "undefined" ? window.navigator.language : "en",
      };

      await submitFeedbackToFirestore({
        type,
        title: title.trim(),
        message: message.trim(),
        userEmail: email.trim() || (user?.email ?? "anonymous@winstash.net"),
        userId: user?.uid || "guest",
        metadata,
      });

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(
          type === "bug"
            ? "Thank you! Your bug report has been submitted."
            : "Thank you! Your feedback has been received."
        );
      }

      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      console.error("Feedback submit error:", err);
      alert("Failed to submit feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 id="feedback-dialog-title" className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Share Feedback & Report Issues
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Found a bug or have a suggestion? We review every submission.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isSuccess ? (
          /* Submission Success State */
          <div className="py-10 text-center space-y-3 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {type === "bug" ? "Bug Report Submitted" : "Feedback Received"}
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
              Thank you for helping us make WinStash better. Our engineering team has been notified.
            </p>
          </div>
        ) : (
          /* Form Content */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-2xl border border-zinc-200/60 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setType("bug")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "bug"
                    ? "bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Bug className="w-3.5 h-3.5" />
                <span>Bug Report</span>
              </button>

              <button
                type="button"
                onClick={() => setType("feature")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "feature"
                    ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>Feature Idea</span>
              </button>

              <button
                type="button"
                onClick={() => setType("general")}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  type === "general"
                    ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>General</span>
              </button>
            </div>

            {/* Subject / Title */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {type === "bug"
                  ? "Issue Summary"
                  : type === "feature"
                  ? "Feature Suggestion"
                  : "Feedback Subject"}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "e.g., Markdown table in STAR portfolio doesn't format correctly"
                    : type === "feature"
                    ? "e.g., Export weekly log directly to Jira ticket"
                    : "e.g., WinStash has sped up my weekly 1:1 prep!"
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Description / Message */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {type === "bug"
                  ? "What happened? (Steps to reproduce)"
                  : type === "feature"
                  ? "How should it work? What problem does it solve?"
                  : "Details & Thoughts"}
                <span className="text-rose-500 ml-0.5">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Please describe what happened, expected behavior, or error message you encountered..."
                    : "Share any details, use cases, or ideas that would make WinStash more helpful for you..."
                }
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-400 resize-none leading-relaxed"
              />
            </div>

            {/* Contact Email */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <span>Reply Email</span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  {user ? "Auto-filled from your account" : "Optional"}
                </span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full bg-zinc-50 dark:bg-zinc-950 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-indigo-500 placeholder:text-zinc-400"
              />
            </div>

            {/* Diagnostic Context Note */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/70 border border-zinc-200/60 dark:border-zinc-800/80 text-[11px] text-zinc-500 dark:text-zinc-400">
              <Laptop className="w-3.5 h-3.5 mt-0.5 shrink-0 text-indigo-500" />
              <div className="space-y-0.5">
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  Diagnostic data automatically attached
                </span>
                <p className="text-[10px] text-zinc-400 leading-tight">
                  Browser, screen resolution, and current page path are included to help engineers replicate and diagnose issues.
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !title.trim() || !message.trim()}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {type === "bug"
                        ? "Submit Bug Report"
                        : type === "feature"
                        ? "Submit Feature Idea"
                        : "Send Feedback"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
