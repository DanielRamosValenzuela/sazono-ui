import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "no-warning-comments": [
        "warn",
        { terms: ["todo", "fixme", "xxx"], location: "anywhere" },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "graphify-out/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
