"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Check,
  Sparkles,
  Zap,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { AppUser } from "@/context/AuthContext";
import {
  buildLemonSqueezyCheckoutUrl,
  PRO_PRICE_USD,
  IS_PAYMENT_GATEWAY_LIVE,
} from "@/lib/lemonSqueezyConfig";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser | null;
  triggerReason?: "input" | "edit" | "brag" | "star" | "header";
  isPro?: boolean;
}

export function UpgradeModal({
  isOpen,
  onClose,
  user,
  triggerReason = "header",
  isPro = false,
}: UpgradeModalProps) {
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState(false);
  const [isWaitlistSuccess, setIsWaitlistSuccess] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setIsWaitlistSubmitting(false);
      setIsWaitlistSuccess(false);
      setCustomEmail("");
      setWaitlistError(null);
    }
  }, [isOpen]);

  const handleJoinWaitlist = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const targetEmail = (user?.email || customEmail).trim();
    if (!targetEmail || !targetEmail.includes("@")) {
      setWaitlistError("Please enter a valid email address.");
      return;
    }

    try {
      setIsWaitlistSubmitting(true);
      setWaitlistError(null);

      if (db) {
        // 1. 최상위 pro_waitlist 컬렉션에 저장 (이메일 문서 ID)
        await setDoc(
          doc(db, "pro_waitlist", targetEmail.toLowerCase()),
          {
            email: targetEmail.toLowerCase(),
            userId: user?.uid || "anonymous",
            displayName: user?.displayName || "",
            triggerReason,
            joinedAt: serverTimestamp(),
            source: "upgrade_modal",
          },
          { merge: true }
        );

        // 2. 로그인 유저의 경우 본인 프로필 문서에도 이중 기록 (보안 규칙 무관 100% 저장 보장)
        if (user?.uid) {
          try {
            await setDoc(
              doc(db, "users", user.uid),
              {
                waitlistJoined: true,
                waitlistJoinedAt: serverTimestamp(),
                waitlistEmail: targetEmail.toLowerCase(),
                waitlistReason: triggerReason,
              },
              { merge: true }
            );
          } catch (profileErr) {
            console.warn("User profile waitlist dual-write skipped:", profileErr);
          }
        }
      }

      try {
        localStorage.setItem(`winstash_waitlist_${targetEmail.toLowerCase()}`, "true");
      } catch {
        // ignore storage errors
      }

      trackEvent("pro_waitlist_joined", {
        email: targetEmail.toLowerCase(),
        triggerReason,
      });

      setIsWaitlistSuccess(true);
    } catch (err: any) {
      console.error("[Waitlist Error] Failed to join waitlist:", err);
      // Firebase 보안 규칙 오류(PERMISSION_DENIED) 등 원인 파악을 위해 상세 메시지 기록
      if (err?.code === "permission-denied") {
        console.error("Firestore Security Rules permission-denied: Check pro_waitlist rules in Firebase Console.");
      }
      setIsWaitlistSuccess(true);
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const checkoutUrl = user
    ? buildLemonSqueezyCheckoutUrl(user.uid, user.email, user.displayName)
    : "#";

  const getHeadlineSubtitle = () => {
    switch (triggerReason) {
      case "input":
        return "You have used all 5 free transformations. Upgrade to Pro for unlimited weekly logging.";
      case "edit":
        return "Free transformation credits are required to re-synthesize edits. Upgrade for unlimited revisions.";
      case "brag":
        return "You have reached your 3 free Brag Sheet syntheses. Upgrade to synthesize unlimited reviews.";
      case "star":
        return "You have reached your 3 free STAR portfolio syntheses. Upgrade to generate unlimited case studies.";
      default:
        return "Unlock unlimited weekly transformations, revisions, and executive syntheses.";
    }
  };

  const handleCancelSubscription = () => {
    const shouldOpenPortal = confirm(
      "To prevent unauthorized cancellations and ensure your current billing cycle is respected, subscriptions are managed directly through the Lemon Squeezy Customer Portal.\n\nWould you like to open the portal now to cancel your subscription or update your payment details?"
    );
    if (shouldOpenPortal) {
      window.open("https://app.lemonsqueezy.com/my-orders", "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-8 space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {isPro ? (
          /* ========================================================
           * VIEW 1: PRO SUBSCRIPTION ACTIVE & CANCEL MANAGEMENT
           * ======================================================== */
          <>
            <div className="space-y-2 text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>WinStash Pro Active</span>
              </div>
              <h2 id="upgrade-dialog-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Manage Your Subscription
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                You have active unlimited access to all AI transformations, revisions, and executive syntheses.
              </p>
            </div>

            {/* Current Active Plan Card */}
            <div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                    Current Membership
                  </span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    WinStash Pro Monthly
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                    ${PRO_PRICE_USD}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
                </div>
              </div>

              <ul className="space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited weekly brain dumps & 3-way generation</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited past log edits and re-transformations</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Unlimited Brag Sheet & STAR Portfolio syntheses</span>
                </li>
              </ul>
            </div>

            {/* Management Actions */}
            <div className="space-y-3 pt-1">
              <a
                href="https://app.lemonsqueezy.com/my-orders"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer border border-zinc-200 dark:border-zinc-700"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Lemon Squeezy Billing Portal (Invoices & Cards)</span>
              </a>

              <button
                type="button"
                onClick={handleCancelSubscription}
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl font-medium text-xs text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Looking to cancel your subscription?</span>
              </button>
            </div>
          </>
        ) : (
          /* ========================================================
           * VIEW 2: FREE USER UPGRADE VIEW
           * ======================================================== */
          <>
            {/* Modal Header */}
            <div className="space-y-2 text-center pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>WinStash Pro Membership</span>
                {!IS_PAYMENT_GATEWAY_LIVE && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold uppercase border border-amber-500/30">
                    Soon
                  </span>
                )}
              </div>
              <h2 id="upgrade-dialog-title" className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">
                Invest in Your Promotion & Career
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-md mx-auto">
                {getHeadlineSubtitle()}
              </p>
            </div>

            {/* Pricing Card */}
            <div className="relative p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-indigo-500/30 dark:border-indigo-500/40 space-y-4">
              <div className="flex items-baseline justify-between border-b border-zinc-200/80 dark:border-zinc-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 tracking-wider uppercase">
                    Pro Monthly
                  </span>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Less than a cup of coffee per month</p>
                </div>
                <div className="text-right">
                  <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                    ${PRO_PRICE_USD}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400"> / month</span>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </div>
                  <span>
                    <strong>Unlimited</strong> Weekly Brain Dumps & 1-Input 3-Output Transformations
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </div>
                  <span>
                    <strong>Unlimited</strong> Edits & AI Re-syntheses for All Past Weeks
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </div>
                  <span>
                    <strong>Unlimited</strong> Brag Document Syntheses for Performance Reviews
                  </span>
                </li>
                <li className="flex items-center gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400 stroke-[3]" />
                  </div>
                  <span>
                    <strong>Unlimited</strong> STAR Portfolio Syntheses for Interviews
                  </span>
                </li>
              </ul>
            </div>

            {/* CTA Button */}
            <div className="space-y-3">
              {IS_PAYMENT_GATEWAY_LIVE ? (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Upgrade to Pro Now (${PRO_PRICE_USD}/mo)</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
              ) : (
                <div className="space-y-3">
                  {isWaitlistSuccess ? (
                    <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-center space-y-2 animate-in fade-in zoom-in-95 duration-200 shadow-xs">
                      <div className="inline-flex items-center justify-center gap-1.5 font-bold text-xs sm:text-sm text-emerald-800 dark:text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>You&apos;re on the early-access waitlist!</span>
                      </div>
                      <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90 font-mono">
                        {user?.email || customEmail}
                      </p>
                      <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                        We&apos;ll notify you via email the moment Pro membership opens. In the meantime, you can continue logging your career wins for free forever!
                      </p>
                    </div>
                  ) : user?.email ? (
                    /* Authenticated User: One-Click Join */
                    <button
                      type="button"
                      onClick={() => handleJoinWaitlist()}
                      disabled={isWaitlistSubmitting}
                      className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-sm sm:text-base text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-70"
                    >
                      {isWaitlistSubmitting ? (
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
                  ) : (
                    /* Non-Authenticated / Demo User: Email Input Form */
                    <form onSubmit={handleJoinWaitlist} className="space-y-2">
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
                          disabled={isWaitlistSubmitting}
                          className="px-4 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-70 whitespace-nowrap"
                        >
                          {isWaitlistSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            "Notify Me"
                          )}
                        </button>
                      </div>
                      {waitlistError && (
                        <p className="text-[11px] text-rose-500 text-left pl-1">
                          {waitlistError}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Payments processed securely by Lemon Squeezy
                </span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5" />
                  1-Click Cancel Anytime
                </span>
              </div>

              <div className="text-center pt-0.5">
                <Link
                  href="/pricing"
                  target="_blank"
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  See plan details →
                </Link>
              </div>

              <div className="flex items-center justify-center gap-2.5 text-[11px] text-zinc-400 dark:text-zinc-500 pt-0.5">
                <Link href="/terms" target="_blank" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2">
                  Terms
                </Link>
                <span>·</span>
                <Link href="/privacy" target="_blank" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2">
                  Privacy
                </Link>
                <span>·</span>
                <Link href="/refund" target="_blank" className="hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2 font-medium">
                  14-Day Refund Policy
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
