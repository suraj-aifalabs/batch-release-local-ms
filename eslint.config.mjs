import js from "@eslint/js";
import globals from "globals";
import { defineConfig } from "eslint/config";
import jestPlugin from "eslint-plugin-jest";


export default defineConfig([
  {
    ignores: ["dist-server/**"],
  },
  {
    files: ["**/*.{js,mjs,cjs}"], plugins: { js, jest: jestPlugin }, extends: ["js/recommended"],
    rules: {
      "no-console": "warn",
      "no-unused-vars": "warn",
      "prefer-const": "error",
      "no-var": "error",
      // Style rules
      "quotes": ["error", "double"],
      "semi": ["warn", "always"],

      // Best practices
      "eqeqeq": "error",
      "curly": "error",
      "default-case": "warn"
    }
  },
  { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
  { files: ["**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.browser } },

]);