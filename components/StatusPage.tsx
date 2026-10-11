import Link from "next/link";
import { WinStashBrandBadge } from "@/components/WinStashLogo";

/** Shared layout for the 404 and error pages: logo, a short message, then the actions. */
export function StatusPage({
  code,
  title,
  message,
  children,
}: {
  code?: string;
  title: string;
  message: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md text-center space-y-6">
        <Link href="/" className="inline-flex items-center gap-2.5 group" aria-label="WinStash Home">
          <WinStashBrandBadge size="md" />
          <span className="font-extrabold text-xl tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            WinStash
          </span>
        </Link>
        <div className="space-y-2">
          {code && <p className="text-sm font-mono font-semibold text-indigo-600 dark:text-indigo-400">{code}</p>}
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{title}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">{children}</div>
      </div>
    </main>
  );
}

export const primaryButtonClass =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 transition-all cursor-pointer";
export const secondaryButtonClass =
  "inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-all cursor-pointer";
