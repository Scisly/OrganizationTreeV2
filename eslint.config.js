// @ts-nocheck
const eslintjs = require("@eslint/js");
const microsoftPowerApps = require("@microsoft/eslint-plugin-power-apps");
const pluginPromise = require("eslint-plugin-promise");
const reactPlugin = require("eslint-plugin-react");
const globals = require("globals");
const typescriptEslint = require("typescript-eslint");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  {
    ignores: ["**/generated"],
  },
  eslintjs.configs.recommended,
  ...typescriptEslint.configs.recommendedTypeChecked,
  ...typescriptEslint.configs.stylisticTypeChecked,
  pluginPromise.configs["flat/recommended"],
  microsoftPowerApps.configs.paCheckerHosted,
  reactPlugin.configs.flat.recommended,
  {
    plugins: {
      "@microsoft/power-apps": microsoftPowerApps,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ComponentFramework: true,
      },
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },

    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
