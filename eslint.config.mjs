import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // Links go through @/components/Link, which turns off automatic prefetching
    // (each prefetch is a server render against the Workers CPU limit).
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/Link.tsx"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{ name: "next/link", importNames: ["default"], message: "Import Link from \"@/components/Link\" (no automatic prefetch)." }],
      }],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
