"use client";

import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { PostHogProvider } from "@/components/PostHogProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <AuthProvider>{children}</AuthProvider>
    </PostHogProvider>
  );
}
