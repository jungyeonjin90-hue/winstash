import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { WinStashBrandBadge } from "@/components/WinStashLogo";

/** 리소스 글 페이지 공통 상단 바. signupHref 에 페이지별 UTM 을 담습니다. */
export function ResourceHeader({ signupHref }: { signupHref: string }) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group cursor-pointer" aria-label="WinStash Home">
          <WinStashBrandBadge size="sm" />
          <span className="font-extrabold text-lg tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            WinStash
          </span>
          <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
            Resources
          </span>
        </Link>
        <Link
          href={signupHref}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 transition-all shadow-xs"
        >
          <span>Try WinStash Free</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </header>
  );
}

export function ResourceFooter() {
  return (
    <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-10 mt-16 text-xs text-zinc-500">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <WinStashBrandBadge size="sm" />
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">WinStash — Never Forget Your Wins</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/pricing" className="hover:underline text-zinc-600 dark:text-zinc-300">Pricing</Link>
          <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="hover:underline">Terms of Service</Link>
          <Link href="/" className="hover:underline text-indigo-600 dark:text-indigo-400 font-medium">App Home →</Link>
        </div>
      </div>
    </footer>
  );
}
