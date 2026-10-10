import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  // The Korean service (/ko) was removed: send old links to the matching English page, else home.
  async redirects() {
    return [
      { source: "/ko", destination: "/", permanent: true },
      {
        source: "/ko/:page(pricing|privacy|refund|terms|resources)/:rest*",
        destination: "/:page/:rest*",
        permanent: true,
      },
      { source: "/ko/:path*", destination: "/", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
