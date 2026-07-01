import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {ignores: ['dist/', 'lib/', 'coverage/', 'node_modules/']},
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly'
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off'
    }
  }
)
