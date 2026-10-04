"use client";

import React, { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyTemplateButtonProps {
  textToCopy: string;
  buttonLabel?: string;
  copiedLabel?: string;
  className?: string;
}

export function CopyTemplateButton({
  textToCopy,
  buttonLabel = "Copy Markdown",
  copiedLabel = "Copied to Clipboard!",
  className = "",
}: CopyTemplateButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      type="button"
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 cursor-pointer ${
        copied
          ? "bg-emerald-600 text-white shadow-sm shadow-emerald-500/20"
          : "bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white shadow-sm shadow-indigo-500/25"
      } ${className}`}
      aria-label={copied ? copiedLabel : buttonLabel}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 shrink-0 text-white" />
          <span>{copiedLabel}</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4 shrink-0 text-white" />
          <span>{buttonLabel}</span>
        </>
      )}
    </button>
  );
}
