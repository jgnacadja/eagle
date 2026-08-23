import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'
import prettier from 'eslint-config-prettier'

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  require: 'readonly',
  global: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly'
}

const vitestGlobals = {
  vi: 'readonly',
  describe: 'readonly',
  it: 'readonly',
  test: 'readonly',
  expect: 'readonly',
  beforeEach: 'readonly',
  afterEach: 'readonly',
  beforeAll: 'readonly',
  afterAll: 'readonly'
}

const nuxtGlobals = {
  defineNuxtPlugin: 'readonly',
  defineNuxtConfig: 'readonly',
  defineNuxtRouteMiddleware: 'readonly',
  definePageMeta: 'readonly',
  navigateTo: 'readonly',
  useRuntimeConfig: 'readonly',
  useNuxtApp: 'readonly',
  useFetch: 'readonly',
  useAsyncData: 'readonly',
  useCookie: 'readonly',
  useRoute: 'readonly',
  useRouter: 'readonly',
  useHead: 'readonly',
  $fetch: 'readonly'
}

const vueGlobals = {
  ref: 'readonly',
  reactive: 'readonly',
  computed: 'readonly',
  watch: 'readonly',
  watchEffect: 'readonly',
  onMounted: 'readonly',
  onUnmounted: 'readonly',
  onBeforeMount: 'readonly',
  onBeforeUnmount: 'readonly',
  onUpdated: 'readonly',
  defineComponent: 'readonly',
  defineProps: 'readonly',
  defineEmits: 'readonly',
  defineExpose: 'readonly',
  withDefaults: 'readonly'
}

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.nuxt/**',
      '**/.output/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/playwright-report/**',
      '**/test-results/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    files: ['apps/api/**/*.ts'],
    languageOptions: {
      globals: nodeGlobals
    }
  },
  {
    files: ['apps/api/**/*.spec.ts', 'apps/front/**/*.spec.ts', 'apps/front/test/**/*.ts'],
    languageOptions: {
      globals: vitestGlobals
    }
  },
  {
    files: ['apps/front/**/*.ts', 'apps/front/**/*.vue'],
    languageOptions: {
      globals: {
        ...nodeGlobals,
        ...nuxtGlobals,
        ...vueGlobals
      }
    }
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module'
    },
    rules: {
      'prefer-const': 'error',
      'no-console': 'error',
      'no-undef': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      'vue/multi-word-component-names': 'off'
    }
  },
  prettier
)
