import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.vercel', 'playwright-report', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Vercel edge functions run in a Web API environment (fetch, URL, Headers, Response are globals)
  {
    files: ['api/**/*.mjs', 'api/**/*.js'],
    languageOptions: {
      globals: { fetch: 'readonly', URL: 'readonly', Headers: 'readonly', Response: 'readonly', Request: 'readonly' },
    },
  },
)
