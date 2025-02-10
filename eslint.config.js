// SPDX-FileCopyrightText: 2025 Jonas Tobias Hopusch <git@jotoho.de>
// SPDX-License-Identifier: AGPL-3.0-only

import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ["src/*.ts"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];
