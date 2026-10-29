const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  { ignores: ['coverage', '.localdb'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: globals.node,
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      eqeqeq: ['error', 'always'],
      'prefer-const': 'error',
      'no-var': 'error',
      'object-shorthand': 'error',
    },
  },
  {
    files: ['__tests__/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },
  prettier,
];
