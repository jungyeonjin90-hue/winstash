import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";

/**
 * The published manifest (public/manifest.json) only talks to https://winstash.net. A local build with
 * VITE_WINSTASH_BASE_URL (e.g. http://localhost:3000) also gets that origin for the content script
 * and host permissions, so the web sign-in hand-off works against a local server. Production builds
 * never include local hosts.
 */
function manifestForTarget(baseUrl: string | undefined): Plugin {
  return {
    name: "winstash-manifest-target",
    apply: "build",
    closeBundle() {
      if (!baseUrl) return;
      const u = new URL(baseUrl);
      // Match patterns cannot carry a port; "http://localhost/*" covers every port.
      const pattern = `${u.protocol}//${u.hostname}/*`;
      const file = path.resolve(__dirname, "dist/manifest.json");
      const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
      const add = (list: string[]) => (list.includes(pattern) ? list : [...list, pattern]);
      manifest.host_permissions = add(manifest.host_permissions ?? []);
      manifest.content_scripts[0].matches = add(manifest.content_scripts[0].matches ?? []);
      fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  return {
    plugins: [react(), tailwindcss(), manifestForTarget(env.VITE_WINSTASH_BASE_URL)],
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
});
