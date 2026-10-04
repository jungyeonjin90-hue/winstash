import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck, Scale, CreditCard, RefreshCw, AlertCircle, Mail } from "lucide-react";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - WinStash",
  description:
    "WinStash Terms of Service. Review our usage guidelines, intellectual property ownership, subscription terms, and Merchant of Record policies.",
};

export default function TermsOfServicePage() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
            <Scale className="w-3.5 h-3.5" />
            <span>Universal Service Agreement</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Terms of Service
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Last Updated: October 4, 2026 · Effective Date: October 4, 2026
          </p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            Welcome to <strong>WinStash</strong> (&quot;WinStash&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;the Service&quot;), hosted at <Link href="/" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">winstash.net</Link>. These Terms of Service (&quot;Terms&quot;) govern your access to and use of our career productivity platform, including weekly logs, executive AI syntheses, and portfolio vault features.
          </p>
        </div>

        {/* 1. Acceptance of Terms */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <FileText className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>1. Acceptance of Terms</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            By creating an account, authenticating via Google OAuth, or using any part of WinStash, you agree to comply with and be legally bound by these Terms and our <Link href="/privacy" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">Privacy Policy</Link>. If you do not agree to these Terms, please do not access or use the Service.
          </p>
        </section>

        {/* 2. Description of Service */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <RefreshCw className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>2. Description of the Service</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            WinStash is an AI-powered Career Operating System designed to help professionals capture unstructured work accomplishments and automatically synthesize them into three structured career assets:
          </p>
          <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside pl-1">
            <li><strong>Weekly Snippets:</strong> Tactical updates optimized for manager 1-on-1 syncs and team standups.</li>
            <li><strong>Performance Reviews (Brag Document):</strong> Quantified impact bullets formatted for promotion packets and compensation reviews.</li>
            <li><strong>Career Portfolio (STAR Resume):</strong> End-to-end case studies following the Situation-Task-Action-Result methodology.</li>
          </ul>
        </section>

        {/* 3. User Ownership & Intellectual Property */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>3. 100% User Ownership & Intellectual Property</h2>
          </div>
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <p className="font-semibold text-indigo-950 dark:text-indigo-200">
              You retain sole and exclusive ownership of all raw notes, project descriptions, and synthesized career assets created in WinStash.
            </p>
            <p>
              WinStash claims zero intellectual property rights over your career data. Furthermore, under our strict <strong>Zero Model Training Policy</strong>, neither WinStash nor our foundational AI API partners use your private records to train or tune machine learning models.
            </p>
          </div>
        </section>

        {/* 4. Subscriptions, Payments & Merchant of Record */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <CreditCard className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>4. Subscriptions, Billing & Merchant of Record</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            WinStash offers free basic functionality along with an optional paid <strong>WinStash Pro</strong> monthly subscription ($5.99/month) granting unlimited AI transformations, revisions, and multi-year portfolio syntheses.
          </p>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Lemon Squeezy as Merchant of Record (MoR)</strong>
              <p>
                All financial transactions, currency conversions, sales taxes (VAT), and payment processing are handled securely by our official Merchant of Record, <strong>Lemon Squeezy, LLC</strong>. When purchasing WinStash Pro, you enter into a merchant relationship with Lemon Squeezy in accordance with their checkout terms.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">Automatic Renewal & 1-Click Cancellation</strong>
              <p>
                Subscriptions automatically renew each month unless cancelled prior to the renewal date. You may cancel your subscription at any time with 1 click via the Lemon Squeezy Customer Portal or within your account settings. After cancellation, you maintain full Pro access until the conclusion of your current billing period.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1">
              <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">14-Day Refund Guarantee</strong>
              <p>
                All purchases are backed by our transparent 14-day refund policy. Please consult our dedicated <Link href="/refund" className="text-indigo-600 dark:text-indigo-400 underline underline-offset-4">Refund Policy</Link> for detailed eligibility criteria and request steps.
              </p>
            </div>
          </div>
        </section>

        {/* 5. Acceptable Use and Restrictions */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <AlertCircle className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>5. Acceptable Use Policy</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            You agree not to misuse the Service. Specifically, you agree not to:
          </p>
          <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 space-y-1.5 list-disc list-inside pl-1">
            <li>Input state secrets, classified military information, passwords, or credit card numbers.</li>
            <li>Attempt to bypass API quota controls, rate limiters, or authentication tokens.</li>
            <li>Engage in automated scraping, reverse-engineering, or unauthorized penetration testing.</li>
            <li>Submit prompt injections intended to compromise system instructions or extract fellow user data.</li>
          </ul>
        </section>

        {/* 6. AI Output Accuracy Disclaimer */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Scale className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>6. AI Output Accuracy & Human Review Disclaimer</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            While WinStash implements strict factual grounding guardrails to eliminate arbitrary hallucinations, AI-generated outputs are intended as professional drafts. You are solely responsible for reviewing, verifying, and adjusting all numbers, accomplishments, and narrative text prior to submitting them for employer performance evaluations, salary negotiations, or job applications.
          </p>
        </section>

        {/* 7. Limitation of Liability */}
        <section className="space-y-3">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>7. Limitation of Liability</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            To the maximum extent permitted by applicable law, WinStash and its operators shall not be liable for any indirect, incidental, punitive, or consequential damages arising out of or related to your use of the Service, your career outcomes, promotion decisions, or data interruptions. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis.
          </p>
        </section>

        {/* 8. Contact & Inquiries */}
        <section className="space-y-4 border-t border-zinc-200 dark:border-zinc-800 pt-8">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>8. Contact & Legal Support</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            For legal inquiries, terms clarification, or general support, please reach out to our team at:
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
