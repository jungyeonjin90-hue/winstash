"use client";

import React from "react";

/**
 * WinStash Signature 3-Tier Modular Vault Icon
 * Represents the 1-Input (top entering key) ➡️ 3-Output (stacked vault drawers) architecture:
 * Tier 1: Weekly Snippets / Sync
 * Tier 2: Brag Document / Performance Review
 * Tier 3: STAR Career Portfolio
 */
export function WinStashVaultIcon({
  className = "w-5 h-5",
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 1024 1024"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g>
        {/* Outer Vault Frame: Top Left Segment */}
        <rect x="233" y="263" width="102" height="16" rx="2" />
        {/* Outer Vault Frame: Top Right Segment */}
        <rect x="393" y="263" width="401" height="16" rx="2" />
        {/* Outer Vault Frame: Left Pillar */}
        <rect x="233" y="263" width="16" height="551" rx="2" />
        {/* Outer Vault Frame: Right Pillar */}
        <rect x="778" y="263" width="16" height="551" rx="2" />
        {/* Outer Vault Frame: Base Floor */}
        <rect x="233" y="798" width="561" height="16" rx="2" />

        {/* Inner Chamber Left */}
        <rect x="282" y="311" width="16" height="455" rx="2" />
        {/* Inner Chamber Right */}
        <rect x="730" y="311" width="16" height="455" rx="2" />
        {/* Inner Chamber Top Left */}
        <rect x="282" y="311" width="53" height="16" rx="2" />
        {/* Inner Chamber Top Right */}
        <rect x="393" y="311" width="353" height="16" rx="2" />
        {/* Inner Chamber Floor */}
        <rect x="282" y="750" width="464" height="16" rx="2" />

        {/* Drawer Divider 1 (Separates Tier 1 & Tier 2) */}
        <rect x="282" y="457" width="464" height="16" rx="1" />
        {/* Drawer Divider 2 (Separates Tier 2 & Tier 3) */}
        <rect x="282" y="604" width="464" height="16" rx="1" />

        {/* Drawer Handle Notch 1 (Weekly Sync) */}
        <rect x="430" y="311" width="166" height="36" rx="3" />
        {/* Drawer Handle Notch 2 (Brag Review) */}
        <rect x="430" y="457" width="166" height="36" rx="3" />
        {/* Drawer Handle Notch 3 (Portfolio Vault) */}
        <rect x="430" y="604" width="166" height="36" rx="3" />

        {/* 1-Input Stylus/Key entering through top portal */}
        <polygon points="355,223 371,223 371,552 363,571 355,552" />
      </g>
    </svg>
  );
}

/**
 * WinStash Brand Logo Badge (Clean Minimal White Badge + Dark Line Art)
 * Architectural, crisp, Notion/Bauhaus aesthetic
 */
export function WinStashBrandBadge({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-9 h-9 sm:w-10 sm:h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5 sm:w-6 sm:h-6",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-white dark:bg-zinc-900 flex items-center justify-center text-zinc-900 dark:text-zinc-100 shrink-0 border border-zinc-200/90 dark:border-zinc-800 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors`}
      aria-label="WinStash Brand Badge"
    >
      <WinStashVaultIcon className={iconSizes[size]} />
    </div>
  );
}
