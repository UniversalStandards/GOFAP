module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
    es2021: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
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
    'airbnb/hooks',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  settings: {
    react: {
      version: 'detect',
    },
  },
  ignorePatterns: [
    'dist/',
    'node_modules/',
    'public/',
    '*.config.ts',
    '*.config.js',
    '**/*.test.ts',
    '**/*.test.tsx',
    'vitest.setup.ts',
    '.eslintrc.cjs',
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
