// Lint rules: ESLint's recommended set, for the browser game code, Node scripts and the Electron shell.
import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist', 'release', 'node_modules', 'art/**/*.png'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    rules: { 'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none' }] },
  },
  {
    files: ['**/*.cjs'],
    languageOptions: { sourceType: 'commonjs' },
  },
];
