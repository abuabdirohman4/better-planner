import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Code Quality Rules (more lenient for existing code)
      "complexity": ["warn", 15], // Limit function complexity
      "max-lines-per-function": ["warn", 100], // Limit function length
      "max-params": ["warn", 5], // Limit function parameters
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow only warn/error
      "no-debugger": "error", // No debugger statements
      "no-alert": "error", // No alert statements
      
      // TypeScript Rules
      "@typescript-eslint/no-explicit-any": "warn", // Warn about any types
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "prefer-const": "error",
      "@typescript-eslint/no-var-requires": "error",
      
      // React Rules
      "react-hooks/exhaustive-deps": "warn", // Warn about useEffect dependencies
      "react-hooks/rules-of-hooks": "error", // Enforce hooks rules
      "react/jsx-key": "error", // Require keys in lists
      "react/jsx-no-duplicate-props": "error", // No duplicate props
      "react/jsx-no-undef": "error", // No undefined JSX
      "react/no-array-index-key": "warn", // Warn about array index keys
      "react/no-unescaped-entities": "error", // No unescaped entities
      "react/jsx-no-leaked-render": "warn", // Warn about leaked renders
      "react/jsx-no-bind": "warn", // Warn about inline functions
      
      // Import Rules
      "import/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index"
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true
          }
        }
      ],
      "import/no-duplicates": "error", // No duplicate imports
      "no-duplicate-imports": "off", // Turn off duplicate imports rule
      
      // Performance Rules
      "react/jsx-no-bind": ["warn", { allowArrowFunctions: true }], // Warn about inline functions
      
      // Security Rules
      "no-eval": "error", // No eval
      "no-implied-eval": "error", // No implied eval
      "no-new-func": "error", // No new Function
      
      // Best Practices
      "eqeqeq": ["error", "always"], // Always use ===
      "no-var": "error", // Use const/let instead of var
      "prefer-const": "error", // Prefer const over let
      "no-unused-expressions": "error", // No unused expressions
    },
  },
  {
    // Stricter rules for new files (files created after this config)
    files: ['src/lib/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      "max-lines-per-function": ["error", { max: 50 }],
      "complexity": ["error", { max: 10 }],
      "@typescript-eslint/no-explicit-any": "error",
      "react/jsx-no-leaked-render": "error",
      "react/jsx-no-bind": "error",
      "react/no-array-index-key": "error",
    },
  },
];

export default eslintConfig;
