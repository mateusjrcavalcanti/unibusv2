import baseConfig, { restrictEnvAccess } from "@unibus/eslint-config/base";
import nextjsConfig from "@unibus/eslint-config/nextjs";
import reactConfig from "@unibus/eslint-config/react";

/** @type {import('typescript-eslint').Config} */
export default [
  {
    ignores: [".next/**"],
  },
  ...baseConfig,
  ...reactConfig,
  ...nextjsConfig,
  ...restrictEnvAccess,
];
