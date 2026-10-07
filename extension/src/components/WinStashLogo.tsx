import React from "react";

export function WinStashVaultIcon({
  className = "w-5 h-5",
}: {
  className?: string;
}) {
  return (
    <svg
      viewBox="183 188 660 660"
      fill="currentColor"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g>
        <rect x="233" y="263" width="102" height="16" rx="2" />
        <rect x="393" y="263" width="401" height="16" rx="2" />
        <rect x="233" y="263" width="16" height="551" rx="2" />
        <rect x="778" y="263" width="16" height="551" rx="2" />
        <rect x="233" y="798" width="561" height="16" rx="2" />

        <rect x="282" y="311" width="16" height="455" rx="2" />
        <rect x="730" y="311" width="16" height="455" rx="2" />
        <rect x="282" y="311" width="53" height="16" rx="2" />
        <rect x="393" y="311" width="353" height="16" rx="2" />
        <rect x="282" y="750" width="464" height="16" rx="2" />

        <rect x="282" y="457" width="464" height="16" rx="1" />
        <rect x="282" y="604" width="464" height="16" rx="1" />

        <rect x="430" y="311" width="166" height="36" rx="3" />
        <rect x="430" y="457" width="166" height="36" rx="3" />
        <rect x="430" y="604" width="166" height="36" rx="3" />

        <polygon points="355,223 371,223 371,552 363,571 355,552" />
      </g>
    </svg>
  );
}

export function WinStashBrandBadge({
  size = "sm",
}: {
  size?: "sm" | "md";
}) {
  const sizeClasses = {
    sm: "w-7 h-7 rounded-lg p-0.5",
    md: "w-8 h-8 rounded-xl p-1",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
  };

  return (
    <div
      className={`${sizeClasses[size]} bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs`}
      aria-label="WinStash Brand Badge"
    >
      <WinStashVaultIcon className={iconSizes[size]} />
    </div>
  );
}
