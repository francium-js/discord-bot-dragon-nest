// @ts-check
import eslint from '@eslint/js'
import prettierPlugin from 'eslint-plugin-prettier'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      prettier: prettierPlugin,
      'simple-import-sort': simpleImportSortPlugin,
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      'sort/object-properties': 'off',
      '@typescript-eslint/no-misused-promises': 'off',
      '@typescript-eslint/no-unsafe-enum-comparison': 'off',
      'padding-line-between-statements': [
        'error',

        // After directives (like 'use-strict'), except between directives
        { blankLine: 'always', next: '*', prev: 'directive' },
        { blankLine: 'any', next: 'directive', prev: 'directive' },

        // After imports, except between imports
        { blankLine: 'always', next: '*', prev: 'import' },
        { blankLine: 'any', next: 'import', prev: 'import' },

        // Before and after every sequence of variable declarations
        { blankLine: 'always', next: ['const', 'let', 'var'], prev: '*' },
        { blankLine: 'always', next: '*', prev: ['const', 'let', 'var'] },
        {
          blankLine: 'any',
          next: ['const', 'let', 'var'],
          prev: ['const', 'let', 'var'],
        },

        // Before and after class declaration, if, while, switch, try
        {
          blankLine: 'always',
          next: ['class', 'if', 'while', 'switch', 'try'],
          prev: '*',
        },
        {
          blankLine: 'always',
          next: '*',
          prev: ['class', 'if', 'while', 'switch', 'try'],
        },

        // Before return statements
        { blankLine: 'always', next: 'return', prev: '*' },
      ],
    },
  },
)
