/**
 * ESLint config used only by the WCAG hook (jsx-a11y on the edited file).
 * Keeps project-wide `npm run lint` unchanged.
 */
const path = require('node:path')

const frontendRoot = path.resolve(__dirname, '..', '..', 'frontend')

module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: ['plugin:jsx-a11y/recommended'],
  parser: require.resolve('@typescript-eslint/parser', { paths: [frontendRoot] }),
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['jsx-a11y'],
  rules: {},
}
