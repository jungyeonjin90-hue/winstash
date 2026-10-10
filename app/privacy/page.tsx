import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Trash2, Mail, CheckCircle2, Sparkles } from "lucide-react";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - WinStash",
  description:
    "WinStash Privacy Policy. Learn about our confidential data isolation, encryption at rest and in transit, and data retention policies.",
};

export default function PrivacyPolicyPage() {
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
            <span>Privacy & Security Standard</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            Privacy Policy & Data Security
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Last Updated: September 30, 2026 · Effective Date: September 30, 2026
          </p>
          <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed">
            At <strong>WinStash</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;), we believe your professional accomplishments and workplace records belong exclusively to you. This Privacy Policy details how we process your notes with AI, how we isolate and protect your data, and how you retain ownership of it.
          </p>
        </div>

        {/* 1. AI Processing */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-indigo-600 dark:text-indigo-400 font-bold text-lg sm:text-xl">
            <Sparkles className="w-5 h-5 shrink-0" />
            <h2>1. How AI Processing Works</h2>
          </div>
          <div className="p-5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 space-y-3 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            <p className="font-semibold text-indigo-900 dark:text-indigo-200">
              To turn your notes into drafts, WinStash sends the text you submit to Google&apos;s Gemini API, which generates the draft and returns it to us.
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                We send only what the draft needs: your note text (or, for Brag Sheet and STAR syntheses, the saved records you select) plus your chosen role and tone settings and, if you have set them, your seniority, industry and region. We do not send your name or email address with these requests.
              </li>
              <li>
                Google processes these requests as our AI service provider under the Gemini API terms.
              </li>
              <li>
                The drafts are stored in your account, where only you can read them (see Section 3).
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Data We Collect */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Lock className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>2. Information We Collect and Process</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            We adhere strictly to the principle of data minimization. We only collect information essential for service delivery:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <strong className="block font-bold text-zinc-900 dark:text-zinc-100">Account Credentials</strong>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-xs">
                Email address, full name, and avatar URL provided via secure Google OAuth authentication. We never store or access your Google password.
              </p>
            </div>
            <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-1.5">
              <strong className="block font-bold text-zinc-900 dark:text-zinc-100">Career Vault Records</strong>
              <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed text-xs">
                Raw weekly brain-dump notes and synthesized outputs (Weekly Snippets, Brag Sheet Items, and STAR Portfolio stories) you choose to save.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Storage, Encryption & Security */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
            <h2>3. Security Architecture & Data Retention</h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p>
              Your data is hosted in high-availability Google Cloud Platform (GCP) infrastructure protected by industry-standard security protocols:
            </p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Encryption at Rest & In Transit:</strong> All database records are encrypted with AES-256 at rest, and all web traffic is enforced over TLS 1.3 encryption in transit.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Strict Tenant Isolation:</strong> Granular Firestore Security Rules guarantee that only your verified Google authentication token can read, write, or delete your records.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Retention Lifecycle:</strong> Records are stored only while your account remains active. We do not retain zombie records after account termination.</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Anonymous Benchmark Insights (Opt-in Only) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
            <h2>4. Anonymous Career Benchmarking (Opt-In Policy)</h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p>
              WinStash may offer anonymized industry benchmark insights (e.g. median project impact velocity across Staff Engineers). Participation in aggregate benchmarking is strictly <strong>opt-in (Default: Disabled / False)</strong>:
            </p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>No personal identifiers (names, emails, company names, or dates) are ever included in benchmarks.</li>
              <li>Only non-identifiable, aggregated classification counts (e.g. &quot;Efficiency&quot; vs &quot;Revenue&quot;) are processed.</li>
              <li>You may toggle your participation status anytime within your account settings.</li>
            </ul>
          </div>
        </section>

        {/* 5. Right to Erasure & Data Portability */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
            <h2>5. Your Rights: 1-Click Export and Permanent Deletion</h2>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            <p>
              Under global data protection regulations (including GDPR, CCPA, and Korean PIPA), you retain complete sovereignty over your data:
            </p>
            <ul className="space-y-2">
              <li className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <strong>1-Click Backup Export:</strong> You can download a complete, readable JSON copy of all your weekly notes, brag sheets, and STAR portfolio cards anytime from the Settings menu.
              </li>
              <li className="p-3.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                <strong>Permanent Account Purge:</strong> You may permanently delete individual records directly inside the app, or request a complete wipe of your user profile, backups, and credentials by emailing our data privacy desk.
              </li>
            </ul>
          </div>
        </section>

        {/* 6. AI-Generated Output & Professional Disclaimer */}
        <section className="space-y-4">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Sparkles className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>6. AI-Generated Output & Professional Disclaimer</h2>
          </div>
          <div className="p-5 rounded-2xl bg-zinc-100/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 space-y-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
            <p>
              WinStash leverages advanced Large Language Models (LLMs) to synthesize raw notes into structured professional artifacts (Weekly Snippets, XYZ Brag Documents, and STAR Case Studies). By using the Service, you acknowledge and agree to the following terms:
            </p>
            <ul className="space-y-2 list-disc list-inside">
              <li>
                <strong>Reference and Draft Purposes Only:</strong> All AI-generated suggestions, summaries, and metrics are intended exclusively as drafts for personal review and reference. They do not constitute certified career coaching, legal advice, or official employment verification.
              </li>
              <li>
                <strong>No Guarantee of Factual Accuracy:</strong> While our algorithms strive for high fidelity, AI models may occasionally misinterpret nuance or extrapolate quantitative figures. WinStash does not warrant or guarantee the complete factual accuracy or veracity of synthesized output.
              </li>
              <li>
                <strong>User Responsibility to Verify:</strong> You retain sole responsibility for reviewing, fact-checking, and editing all synthesized content before submitting it to managers, promotion committees, recruiters, or public platforms such as LinkedIn.
              </li>
            </ul>
          </div>
        </section>

        {/* 7. Contact & Data Protection Officer */}
        <section className="space-y-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100 font-bold text-lg sm:text-xl">
            <Mail className="w-5 h-5 text-indigo-500 shrink-0" />
            <h2>7. Contact Us & Data Requests</h2>
          </div>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            If you have questions, feedback, or wish to submit a data erasure or access request, please reach out directly to our team:
          </p>
          <div className="p-5 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2">
            <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              WinStash Data Privacy Desk
            </div>
            <div className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
              Official Contact:{" "}
              <a
                href="mailto:thestudioplus26@gmail.com"
                className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                thestudioplus26@gmail.com
              </a>
            </div>
            <div className="text-xs text-zinc-400">
              We respond to all verified user privacy inquiries within 48 business hours.
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-8 bg-white/50 dark:bg-zinc-950/50 text-center text-xs text-zinc-500 space-y-2">
        <p>© 2026 WinStash. All rights reserved.</p>
        <p className="text-[11px] text-zinc-400">
          AES-256 encryption at rest &amp; in transit, and confidential data isolation guaranteed.
        </p>
      </footer>
    </div>
  );
}
