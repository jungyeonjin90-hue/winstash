"use client";

import React from "react";

/**
 * WinStash Signature 3-Tier Isometric Vault Line Art Icon
 * Represents the 3-layered career memory vault (Weekly Snippets, Brag Sheet, Career Portfolio)
 */
export function WinStashVaultIcon({
  className = "w-5 h-5",
  strokeWidth = 1.75,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Top Isometric Diamond Tier */}
      <polygon points="12 2 21 7 12 12 3 7" />
      {/* Tier 2: Middle Accomplishment Layer */}
      <path d="M3 12l9 5 9-5" />
      {/* Tier 3: Foundation Portfolio Layer */}
      <path d="M3 17l9 5 9-5" />
      {/* Structural Central Vault Axis */}
      <line x1="12" y1="12" x2="12" y2="22" />
    </svg>
  );
}

/**
 * WinStash Brand Logo Container (Gradient Box + 3-Tier Line Art Icon)
 */
export function WinStashBrandBadge({
  size = "md",
}: {
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 shrink-0 border border-indigo-400/20`}
    >
      <WinStashVaultIcon className={iconSizes[size]} strokeWidth={1.8} />
    </div>
  );
}
