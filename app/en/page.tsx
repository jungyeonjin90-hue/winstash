"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function EnRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Keep the query string so utm_* parameters on old /en links still reach analytics.
    router.replace(`/${window.location.search}`);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 text-zinc-500 text-sm">
      Redirecting to WinStash...
    </div>
  );
}
