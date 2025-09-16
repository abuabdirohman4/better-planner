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
      "complexity": ["warn", 25], // Increased from 15
      // "max-lines-per-function": ["warn", 150], // Increased from 100
      "max-params": ["warn", 8], // Increased from 5
      "no-console": ["warn", { allow: ["warn", "error"] }], // Allow only warn/error
      "no-debugger": "error", // No debugger statements
      "no-alert": "error", // No alert/confirm/prompt
      "no-eval": "error", // No eval
      "no-implied-eval": "error", // No implied eval
      "no-new-func": "error", // No new Function
      "no-script-url": "error", // No javascript: URLs
      
      // TypeScript Rules (basic ones only, no type info required)
      "@typescript-eslint/no-explicit-any": "warn", // Warn about any usage
      "@typescript-eslint/no-unsafe-function-type": "warn", // Warn about Function type
      
      // Disable all rules that require type information
      "@typescript-eslint/no-unsafe-assignment": "off", // Requires type info
      "@typescript-eslint/no-unsafe-call": "off", // Requires type info
      "@typescript-eslint/no-unsafe-member-access": "off", // Requires type info
      "@typescript-eslint/no-unsafe-return": "off", // Requires type info
      "@typescript-eslint/prefer-nullish-coalescing": "off", // Requires type info
      "@typescript-eslint/prefer-optional-chain": "off", // Requires type info
      "@typescript-eslint/no-unnecessary-type-assertion": "off", // Requires type info
      "@typescript-eslint/no-floating-promises": "off", // Requires type info
      "@typescript-eslint/await-thenable": "off", // Requires type info
      "@typescript-eslint/no-misused-promises": "off", // Requires type info
      
      // React Rules (more lenient for existing code)
      "react/jsx-no-bind": ["warn", { 
        allowArrowFunctions: true,
        allowBind: false,
        ignoreRefs: true 
      }], // Allow arrow functions, warn about bind
      "react/no-array-index-key": "warn", // Warn about array index keys
      "react/jsx-key": "error", // Require key prop
      "react/jsx-no-duplicate-props": "error", // No duplicate props
      "react/jsx-no-undef": "error", // No undefined JSX elements
      "react/jsx-uses-react": "error", // React must be in scope
      "react/jsx-uses-vars": "error", // JSX variables must be used
      "react/no-unescaped-entities": "warn", // Warn about unescaped entities
      "react/no-unknown-property": "warn", // Warn about unknown props
      "react/self-closing-comp": "warn", // Self-closing components
      "react/sort-comp": "off", // Disable sort component methods
      "react/prop-types": "off", // Disable prop-types (using TypeScript)
      
      // React Hooks Rules
      "react-hooks/rules-of-hooks": "error", // Rules of hooks
      "react-hooks/exhaustive-deps": "warn", // Exhaustive deps
      
      // Import Rules (more lenient)
      "import/order": ["warn", {
        "groups": [
          "builtin",
          "external", 
          "internal",
          "parent",
          "sibling",
          "index"
        ],
        "newlines-between": "always",
        "alphabetize": {
          "order": "asc",
          "caseInsensitive": true
        }
      }],
      "import/no-unresolved": "off", // Disable (handled by TypeScript)
      "import/named": "off", // Disable (handled by TypeScript)
      "import/default": "off", // Disable (handled by TypeScript)
      "import/no-named-as-default": "warn", // Warn about default imports
      "import/no-duplicates": "error", // No duplicate imports
      
      // Performance Rules
      "react/jsx-no-leaked-render": "warn", // Warn about leaked renders
      "react/jsx-no-useless-fragment": "warn", // Warn about useless fragments
      
      // Accessibility Rules
      "jsx-a11y/alt-text": "warn", // Warn about missing alt text
      "jsx-a11y/anchor-has-content": "warn", // Warn about empty anchors
      "jsx-a11y/anchor-is-valid": "warn", // Warn about invalid anchors
      "jsx-a11y/aria-props": "warn", // Warn about invalid ARIA props
      "jsx-a11y/aria-proptypes": "warn", // Warn about invalid ARIA prop types
      "jsx-a11y/aria-unsupported-elements": "warn", // Warn about unsupported ARIA elements
      "jsx-a11y/role-has-required-aria-props": "warn", // Warn about missing ARIA props
      "jsx-a11y/role-supports-aria-props": "warn", // Warn about unsupported ARIA props
      "jsx-a11y/tabindex-no-positive": "warn", // Warn about positive tabindex
      
      // Next.js Rules (only valid ones)
      "@next/next/no-html-link-for-pages": "warn", // Warn about HTML links
      "@next/next/no-img-element": "warn", // Warn about img elements
      "@next/next/no-sync-scripts": "error", // No sync scripts
      "@next/next/no-unwanted-polyfillio": "warn", // Warn about unwanted polyfills
      "@next/next/no-page-custom-font": "warn", // Warn about custom fonts
      "@next/next/no-css-tags": "warn", // Warn about CSS tags
      "@next/next/no-head-element": "warn", // Warn about head elements
      "@next/next/no-typos": "warn", // Warn about typos
      "@next/next/no-duplicate-head": "error", // No duplicate head
      "@next/next/no-before-interactive-script-outside-document": "error", // No before interactive scripts
      "@next/next/no-title-in-document-head": "warn", // Warn about title in head
      "@next/next/no-document-import-in-page": "error", // No document import in pages
      "@next/next/no-script-component-in-head": "error", // No script components in head
      "@next/next/no-styled-jsx-in-document": "error", // No styled-jsx in document
    },
  },
];

export default eslintConfig;
