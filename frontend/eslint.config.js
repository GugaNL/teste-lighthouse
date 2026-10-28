import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  js.configs.recommended,
  tseslint.configs.recommendedTypeChecked,
  reactHooks.configs.flat['recommended-latest'],
  reactRefresh.configs.vite,
  jsxA11y.flatConfigs.recommended,
  {
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.node.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    },
  },
  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
  prettier
);
