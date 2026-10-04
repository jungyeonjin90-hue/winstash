import Link from "next/link";
import { ArrowLeft, RefreshCw, ShieldCheck, Mail, CreditCard, Clock, CheckCircle2, HelpCircle } from "lucide-react";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - WinStash",
  description:
    "WinStash Refund Policy. Learn about our 14-day money-back guarantee, Lemon Squeezy refund processing, and cancellation policies.",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to WinStash</span>
          </Link>
          <div className="flex items-center gap-2">
            <WinStashBrandBadge size="sm" />
            <span className="font-extrabold text-sm tracking-tight">WinStash</span>
            <span className="text-[9px] font-extrabold tracking-wider uppercase px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/70 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/70">
              Beta
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Title Section */}
        <div className="space-y-4 border-b border-zinc-200 dark:border-zinc-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Satisfaction Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Refund & Cancellation Policy
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Last Updated: October 4, 2026 · Effective Date: October 4, 2026
          </p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            At <strong>WinStash</strong>, we are committed to providing the highest caliber career intelligence tools for professionals. We want you to feel confident when subscribing to <strong>WinStash Pro</strong>. This Refund Policy outlines our straightforward 14-day refund guarantee and our cancellation process.
          </p>
        </div>

        {/* 1. 14-Day Money-Back Guarantee */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <RefreshCw className="w-5 h-5 text-emerald-500 shrink-0" />
            <h2>1. 14-Day Money-Back Guarantee</h2>
          </div>
          <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 space-y-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <p className="font-semibold text-emerald-950 dark:text-emerald-200 text-sm">
              If WinStash Pro does not meet your expectations, you are entitled to a full 100% refund within 14 calendar days of your purchase.
            </p>
            <p>
              Whether you are on your first monthly subscription or recently experienced an automatic monthly renewal, simply contact us within 14 days of the charge, and we will issue a complete refund—no cumbersome questions asked.
            </p>
          </div>
        </section>

        {/* 2. How to Request a Refund */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <CreditCard className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>2. How to Request a Refund</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            You can request your refund through either of the two convenient channels below:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            {/* Option 1 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <Mail className="w-4 h-4" />
                <span>Method 1: Direct Email Support</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Send an email to <a href="mailto:thestudioplus26@gmail.com" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">thestudioplus26@gmail.com</a> with the subject line <em>&quot;Refund Request&quot;</em> and your account email.
              </p>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Processed within 24–48 business hours</span>
              </div>
            </div>

            {/* Option 2 */}
            <div className="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Method 2: Lemon Squeezy Portal</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Visit the <a href="https://app.lemonsqueezy.com/my-orders" target="_blank" rel="noopener noreferrer" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">Lemon Squeezy Customer Orders Portal</a> using the email address you entered during checkout to manage your order and request assistance.
              </p>
              <div className="text-[11px] text-zinc-400 dark:text-zinc-500 pt-1 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Instant order lookup & verification</span>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Subscription Cancellations */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Clock className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>3. Subscription Cancellation Policy</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            You can cancel your WinStash Pro subscription at any time with zero penalty:
          </p>
          <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-2 list-disc list-inside pl-1 leading-relaxed">
            <li>
              <strong>1-Click Self-Serve Cancellation:</strong> You can cancel via the Customer Portal link in your receipt email or through your in-app account settings.
            </li>
            <li>
              <strong>Access Until End of Billing Cycle:</strong> When you cancel, your subscription will not renew at the next billing date. You will retain full access to all Pro features until your current paid month concludes.
            </li>
            <li>
              <strong>Zero Hidden Fees:</strong> There are no cancellation fees or retention traps.
            </li>
          </ul>
        </section>

        {/* 4. Refund Processing & Bank Timelines */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <CreditCard className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>4. Processing Timelines & Original Payment Method</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Once a refund is authorized by WinStash or Lemon Squeezy:
          </p>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p>
              • The refund is credited back directly to your original payment method (Credit Card, Debit Card, PayPal, Apple Pay, or Google Pay).
            </p>
            <p>
              • Depending on your banking institution and card network, funds typically appear in your account statement within <strong>3 to 7 business days</strong>.
            </p>
          </div>
        </section>

        {/* 5. Merchant of Record & Dispute Resolution */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <HelpCircle className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>5. Merchant of Record & Friendly Dispute Resolution</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            All payments and refunds for WinStash are processed by <strong>Lemon Squeezy, LLC</strong> acting as the Merchant of Record. If you have any billing discrepancies, double charges, or questions, please contact us first at <a href="mailto:thestudioplus26@gmail.com" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">thestudioplus26@gmail.com</a>. We will happily resolve any issue promptly and prevent the hassle of lengthy bank chargeback investigations.
          </p>
        </section>

        {/* 6. Contact Section */}
        <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>6. Contact Billing Support</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Have questions about a charge or need assistance with your subscription? Reach out to our dedicated support team:
          </p>
          <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 inline-flex items-center gap-3">
            <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
            <a
              href="mailto:thestudioplus26@gmail.com"
              className="text-xs sm:text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              thestudioplus26@gmail.com
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white/50 dark:bg-zinc-950/50 text-center text-xs text-zinc-500">
        <p>© 2026 WinStash. All rights reserved.</p>
      </footer>
    </div>
  );
}
