import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const noProjectCommentsPlugin = {
  rules: {
    "no-project-comments": {
      meta: {
        type: "problem",
        docs: {
          description: "Disallow comments in project source files",
        },
        schema: [],
      },
      create(context) {
        const sourceCode = context.sourceCode;

        return {
          Program() {
            for (const comment of sourceCode.getAllComments()) {
              context.report({
                loc: comment.loc,
                message: "Comments are not allowed in project source files.",
              });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{js,mjs,cjs,ts,tsx}"],
    plugins: {
      project: noProjectCommentsPlugin,
    },
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    rules: {
      curly: ["error", "all"],
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-debugger": "error",
      "project/no-project-comments": "error",
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
