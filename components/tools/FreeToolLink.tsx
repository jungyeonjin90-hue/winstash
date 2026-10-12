"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackEvent } from "@/lib/analytics";

export const FREE_TOOL_PATH = "/tools/star-method-generator";

/** Link to the free STAR tool that records where it was clicked, so server components can use it too. */
export function FreeToolLink({
  location,
  className,
  children,
}: {
  location: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={FREE_TOOL_PATH}
      onClick={() => trackEvent("free_tool_link_clicked", { location })}
      className={className}
    >
      {children}
    </Link>
  );
}
