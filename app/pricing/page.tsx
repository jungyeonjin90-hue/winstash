import type { Metadata } from "next";
import Link from "next/link";
import { WinStashBrandBadge } from "@/components/WinStashLogo";
import { PricingWaitlistButton } from "@/components/pricing/PricingWaitlistButton";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  RotateCcw,
  } from "lucide-react";
import { PRO_PRICE_USD, IS_PAYMENT_GATEWAY_LIVE } from "@/lib/lemonSqueezyConfig";

export const metadata: Metadata = {
  title: "WinStash Pricing: Free Plan & Pro ($5.99/mo)",
  description:
    "Log career wins for free forever. Upgrade to WinStash Pro ($5.99/mo) for unlimited weekly AI transformations, brag sheets, and STAR portfolio syntheses.",
  keywords: [
    "WinStash pricing",
    "work wins tracker cost",
    "brag sheet tool pricing",
    "AI career journal pricing",
    "STAR resume builder subscription",
  ],
  alternates: {
    canonical: "https://winstash.net/pricing",
  },
  openGraph: {
    title: "WinStash Pricing: Free Plan & Pro ($5.99/mo)",
    description:
      "Log career wins for free forever. Upgrade to WinStash Pro ($5.99/mo) for unlimited weekly AI transformations, brag sheets, and STAR portfolio syntheses.",
    url: "https://winstash.net/pricing",
    siteName: "WinStash",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WinStash Pricing - Free & Pro Plans",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WinStash Pricing: Free Plan & Pro ($5.99/mo)",
    description:
      "Log career wins for free forever. Upgrade to WinStash Pro ($5.99/mo) for unlimited weekly AI transformations and syntheses.",
    images: ["/og-image.png"],
  },
};

const PRICING_FAQS = [
  {
    q: "Is WinStash really free?",
    a: IS_PAYMENT_GATEWAY_LIVE
      ? "Yes. You can log and stash your raw weekly wins for free forever. Every free account receives 10 weekly AI transformations, 3 Brag Sheet syntheses, and 3 STAR portfolio syntheses with zero credit card required."
      : "Yes. You can log and stash your raw weekly wins for free forever. During our public beta, every account receives 10 free weekly AI transformations, 3 Brag Sheet syntheses, and 3 STAR portfolio syntheses with zero credit card required.",
  },
  {
    q: "What happens when I use up my free AI credits?",
    a: IS_PAYMENT_GATEWAY_LIVE
      ? "Your notes stay yours forever. You can continue logging, editing, and reading your past accomplishments. Once your free credits are used, you can either continue manual logging for free or upgrade to Pro to unlock unlimited AI syntheses."
      : "Your notes stay yours forever. You can continue logging, editing, and reading your past accomplishments. Once your free credits are used, you can either continue manual logging for free or join the waitlist for Pro to unlock unlimited AI syntheses.",
  },
  {
    q: "When does Pro open?",
    a: IS_PAYMENT_GATEWAY_LIVE
      ? "WinStash Pro is officially open! You can upgrade instantly with one click using the Upgrade button above to get unlimited AI transformations, brag sheets, and STAR portfolio syntheses."
      : "Very soon. We are putting the finishing touches on our billing integration. Click the 'Notify Me' button on this page to join our early-access waitlist, and we'll send you an email the moment Pro launches.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes, with a single click. You can manage or cancel your subscription directly from the customer portal. If you cancel, your account reverts to the Free plan at the end of your billing cycle, and your past notes remain completely intact.",
  },
  {
    q: "What is your refund policy?",
    a: "We offer a 14-day refund policy. If you upgrade to Pro and feel it hasn't delivered value, simply reach out to us within 14 days of purchase for a prompt refund. See our full Refund Policy for details.",
  },
  {
    q: "How is my payment handled?",
    a: "Payments are processed securely by Lemon Squeezy, our Merchant of Record. We never see, touch, or store your raw credit card numbers.",
  },
  {
    q: "Is tax included in the price?",
    a: `No. The $${PRO_PRICE_USD}/month price excludes tax. Any sales tax or VAT that applies in your country is calculated and shown at checkout before you pay, and Lemon Squeezy collects and remits it as our Merchant of Record.`,
  },
  {
    q: "What happens if a payment fails?",
    a: "Lemon Squeezy emails you and retries your card several times over about two weeks, and you keep Pro during that time. You can update your card anytime from the billing portal. If the payment still can't be collected, your account moves to the Free plan until the card is updated, and your notes stay intact.",
  },
  {
    q: "Does 'unlimited' mean completely unlimited?",
    a: "Pro is designed for real humans logging their professional career milestones. It provides more than enough capacity for weekly notes, sprint revisions, and review syntheses. A standard fair-use limit applies solely to prevent automated bot scripts or API abuse.",
  },
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: "WinStash Pro",
        description:
          "Turn 1-minute Friday notes into manager-ready weekly syncs, promotion brag sheets, and career portfolios.",
        image: "https://winstash.net/og-image.png",
        offers: {
          "@type": "Offer",
          price: String(PRO_PRICE_USD),
          priceCurrency: "USD",
          priceValidUntil: "2027-12-31",
          availability: IS_PAYMENT_GATEWAY_LIVE
            ? "https://schema.org/InStock"
            : "https://schema.org/PreOrder",
          url: "https://winstash.net/pricing",
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: PRICING_FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500 selection:text-white">
      {/* Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1. Header Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2.5 group cursor-pointer"
            aria-label="WinStash Home"
          >
            <WinStashBrandBadge size="sm" />
            <span className="font-extrabold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              WinStash
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs sm:text-sm font-medium">
            <Link
              href="/resources"
              className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Resources
            </Link>
            <Link
              href="https://winstash.net/?utm_source=pricing_nav&utm_medium=pricing&utm_campaign=nav_start"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs"
            >
              <span>Start Free</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Top Status Banner */}
      <div className="w-full bg-indigo-50/80 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/60 py-2.5 px-4 text-center text-xs font-semibold text-indigo-900 dark:text-indigo-300">
        <span>
          {IS_PAYMENT_GATEWAY_LIVE
            ? "✨ WinStash Pro is now live! Upgrade for unlimited AI syntheses."
            : "🎉 Free during the public beta. Pro opens soon."}
        </span>
      </div>

      {/* 3. Hero Section */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-900/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Simple, Transparent Pricing</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-[1.15]">
            Start free. Upgrade when your record grows.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed text-pretty">
            Log your wins for free, forever. Pro adds unlimited AI transformations and syntheses when
            you need them.
          </p>
        </div>

        {/* 4. Plan Cards Grid (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
          {/* Card 1: Free Plan */}
          <div className="p-7 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Free</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                  Available Now
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50">
                    $0
                  </span>
                  <span className="text-xs font-medium text-zinc-500">forever</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  Everything you need to build the Friday logging habit.
                </p>
              </div>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span><strong>Unlimited</strong> weekly raw notes logging</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span><strong>10 total</strong> weekly AI transformations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span><strong>3 total</strong> Brag Sheet syntheses (XYZ formula)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span><strong>3 total</strong> STAR portfolio syntheses</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>NDA Confidentiality Shield included</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>1-click Markdown export (Slack, Notion, Docs)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-emerald-500 shrink-0 stroke-[3]" />
                  <span>No credit card required</span>
                </li>
              </ul>
            </div>

            <Link
              href="https://winstash.net/?utm_source=pricing_card&utm_medium=pricing&utm_campaign=start_free"
              className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl font-bold text-sm bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs cursor-pointer"
            >
              <span>{IS_PAYMENT_GATEWAY_LIVE ? "Start Free" : "Start Free (Beta)"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Card 2: Pro Plan */}
          <div className="relative p-7 sm:p-8 rounded-3xl bg-white dark:bg-zinc-900 border-2 border-indigo-500/80 dark:border-indigo-500/60 flex flex-col justify-between space-y-6 shadow-xl shadow-indigo-500/5">
            <div className="absolute -top-3.5 left-7 px-3 py-1 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-xs">
              {IS_PAYMENT_GATEWAY_LIVE ? "Instant Access" : "Opening Soon"}
            </div>

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Pro</span>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60">
                  {IS_PAYMENT_GATEWAY_LIVE ? "Pro Unlimited" : "Waitlist Open"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50">
                    ${PRO_PRICE_USD}
                  </span>
                  <span className="text-xs font-medium text-zinc-500">/ month + tax</span>
                </div>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">
                  For professionals who want unlimited weekly AI syntheses.
                </p>
              </div>

              <ul className="space-y-3 pt-2 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span><strong>Everything in Free</strong></span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span><strong>Unlimited</strong> weekly AI transformations</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span><strong>Unlimited</strong> edits &amp; re-syntheses for all past weeks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span><strong>Unlimited</strong> Brag Sheet &amp; STAR syntheses</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span>Multi-week project clustering (4–12 weeks)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 stroke-[3]" />
                  <span>1-click cancel anytime, 14-day refund policy</span>
                </li>
              </ul>
            </div>

            <PricingWaitlistButton />
          </div>
        </div>

        {/* 5. Payment, Guarantee & Security Badges */}
        <section className="p-6 sm:p-8 rounded-3xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div className="space-y-1.5 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-xs mb-1">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              Lemon Squeezy Payments
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Payments processed securely by Lemon Squeezy (Merchant of Record). We never handle card numbers.
            </p>
          </div>

          <div className="space-y-1.5 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs mb-1">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              1-Click Cancel Anytime
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Cancel with one click directly from the customer portal. Cancelling never deletes your career data.
            </p>
          </div>

          <div className="space-y-1.5 flex flex-col items-center">
            <div className="w-10 h-10 rounded-2xl bg-white dark:bg-zinc-800 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-xs mb-1">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              14-Day Refund Policy
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              If Pro doesn&apos;t save you hours during review prep, email us within 14 days for a full refund (
              <Link href="/refund" className="underline hover:text-indigo-600">
                Refund Policy
              </Link>
              ).
            </p>
          </div>
        </section>

        {/* 6. Pricing FAQ */}
        <section className="space-y-6 max-w-3xl mx-auto pt-4">
          <div className="text-center space-y-1">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
              Pricing Questions &amp; Answers
            </h2>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              Everything you need to know about plans, billing, and cancellations.
            </p>
          </div>

          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border-y border-zinc-200 dark:border-zinc-800">
            {PRICING_FAQS.map((faq, idx) => (
              <div key={idx} className="py-5 space-y-2">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  {faq.q}
                </h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Bottom CTA Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-zinc-900 border border-zinc-800 p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl max-w-4xl mx-auto">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Build your career record this Friday.
            </h2>
            <p className="text-xs sm:text-base text-zinc-400 leading-relaxed">
              Turn 1-minute Friday notes into promotion-ready brag sheets and portfolio case studies.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="https://winstash.net/?utm_source=pricing_bottom&utm_medium=pricing&utm_campaign=bottom_start"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-sm sm:text-base bg-white text-zinc-950 hover:bg-zinc-100 transition-all shadow-xl active:scale-98 cursor-pointer"
            >
              <span>Start Free on WinStash</span>
              <ArrowRight className="w-4 h-4 text-zinc-950" />
            </Link>
          </div>
          <p className="text-[11px] text-zinc-500">
            {IS_PAYMENT_GATEWAY_LIVE
              ? "Free plan • Zero credit card required"
              : "100% Free during open beta • Zero credit card required"}
          </p>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 mt-16 text-xs text-zinc-500">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WinStashBrandBadge size="sm" />
            <span className="font-semibold text-zinc-700 dark:text-zinc-300">
              WinStash — Never Forget What You Shipped
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link href="/resources" className="hover:underline">
              Resources
            </Link>
            <Link href="/privacy" className="hover:underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:underline">
              Terms of Service
            </Link>
            <Link href="/refund" className="hover:underline">
              Refund Policy
            </Link>
            <Link href="/" className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">
              App Home →
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
