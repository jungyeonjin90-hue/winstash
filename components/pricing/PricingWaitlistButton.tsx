"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";
import { Bell, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { PRO_PRICE_USD } from "@/lib/lemonSqueezyConfig";

export function PricingWaitlistButton() {
  const { user } = useAuth();
  const [customEmail, setCustomEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (user?.email || customEmail).trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      if (db) {
        await setDoc(
          doc(db, "pro_waitlist", targetEmail.toLowerCase()),
          {
            email: targetEmail.toLowerCase(),
            userId: user?.uid || "anonymous",
            displayName: user?.displayName || "",
            triggerReason: "pricing_page",
            joinedAt: serverTimestamp(),
            source: "pricing_page_card",
          },
          { merge: true }
        );
      }

      try {
        localStorage.setItem(`winstash_waitlist_${targetEmail.toLowerCase()}`, "true");
      } catch {
        // ignore
      }

      trackEvent("pro_waitlist_joined", {
        email: targetEmail.toLowerCase(),
        source: "pricing_page",
      });

      setIsSuccess(true);
    } catch (err) {
      console.error("Waitlist error:", err);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-1.5 animate-in fade-in duration-200">
        <div className="inline-flex items-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>You&apos;re on the early-access waitlist!</span>
        </div>
        <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 font-mono">
          {user?.email || customEmail}
        </p>
        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
          We&apos;ll email you the moment Pro launches. Keep logging your career wins for free!
        </p>
      </div>
    );
  }

  if (user?.email) {
    return (
      <button
        type="button"
        onClick={() => handleJoin()}
        disabled={isSubmitting}
        className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Adding to Waitlist...</span>
          </>
        ) : (
          <>
            <Bell className="w-4 h-4 text-white" />
            <span>Notify Me When Pro Opens (${PRO_PRICE_USD}/mo)</span>
            <ArrowRight className="w-4 h-4 text-white" />
          </>
        )}
      </button>
    );
  }

  return (
    <form onSubmit={handleJoin} className="space-y-2">
      <div className="flex gap-2">
        <input
          type="email"
          required
          value={customEmail}
          onChange={(e) => setCustomEmail(e.target.value)}
          placeholder="name@company.com"
          className="flex-1 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 whitespace-nowrap"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Notify Me"
          )}
        </button>
      </div>
      {errorMsg && (
        <p className="text-[11px] text-rose-500 text-left pl-1">{errorMsg}</p>
      )}
    </form>
  );
}
