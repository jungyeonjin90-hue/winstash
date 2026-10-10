/**
 * Node module hooks that let the eval runner import the app's real TypeScript modules
 * (lib/transformService.ts and what it imports) without a build step.
 *
 * - Resolves the `@/` path alias (tsconfig "paths") to the project root.
 * - Resolves extensionless relative/alias imports to `.ts` / `.tsx` / `index.ts`.
 * - Transpiles `.ts` with the project's own `typescript` package, which drops type-only imports
 *   such as `import { JobRole } from "@/types/career"` (Node's built-in type stripping cannot).
 *
 * Registered by run-transform-eval.mjs via `module.register`; not used by the app.
 */
import { readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const ROOT_URL = new URL("../../", import.meta.url);
const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function isFile(url) {
  try {
    return statSync(fileURLToPath(url)).isFile();
  } catch {
    return false;
  }
}

function findFile(baseUrl) {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const url = new URL(baseUrl.href + suffix);
    if (isFile(url)) return url;
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  let base = null;
  if (specifier.startsWith("@/")) {
    base = new URL(specifier.slice(2), ROOT_URL);
  } else if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.endsWith(".ts")) {
    base = new URL(specifier, context.parentURL);
  }
  if (base) {
    const found = findFile(base);
    if (found) return { url: found.href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && /\.tsx?$/.test(url)) {
    const source = readFileSync(fileURLToPath(url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      fileName: fileURLToPath(url),
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
        sourceMap: false,
      },
    });
    return { format: "module", source: outputText, shortCircuit: true };
  }
  return nextLoad(url, context);
}
