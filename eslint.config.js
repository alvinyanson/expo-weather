// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-plugin-prettier/recommended');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: [
      '**/node_modules/**',
      '.expo/**',
      'android/**',
      'ios/**',
      'dist/**',
      'web-build/**',
      'assets/**',
    ],
  },
]);
