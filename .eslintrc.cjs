module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.eslint.json',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks', 'import', 'jsx-a11y'],
  extends: [
    'airbnb',
    'airbnb-typescript',
  // Note: Only @typescript-eslint plugin is explicitly listed here.
  // The react, react-hooks, import, and jsx-a11y plugins are automatically
  // included by the airbnb, airbnb-typescript, and airbnb/hooks extends configurations.
  plugins: ['@typescript-eslint'],
  extends: [
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: ['dist/', 'node_modules/', 'public/', '.eslintrc.cjs'],
  ignorePatterns: ['dist/', 'node_modules/', 'public/'],
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'public/',
    '*.config.ts',
    '*.config.js',
    '**/*.test.ts',
    '**/*.test.tsx',
    'vitest.setup.ts',
  ],
  rules: {
    'react/react-in-jsx-scope': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
      },
    ],
  },
};
