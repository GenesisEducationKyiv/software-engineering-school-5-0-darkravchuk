import globals from 'globals';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,ts,mts}'],
    languageOptions: {
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
      parser: tsParser,
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      'indent': ['error', 2], // 2-space indentation
      'quotes': ['error', 'single'], // Single quotes
      'semi': ['error', 'always'], // Require semicolons
    },
  },
]);