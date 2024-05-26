import baseConfig from "@unibus/eslint-config/base";
import reactConfig from "@unibus/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [],
  },
  ...baseConfig,
  ...reactConfig,
];
