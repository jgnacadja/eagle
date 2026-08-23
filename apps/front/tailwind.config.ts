import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './components/**/*.{vue,ts}',
    './layouts/**/*.{vue,ts}',
    './pages/**/*.{vue,ts}',
    './plugins/**/*.{ts,js}',
    './app.vue',
    './nuxt.config.{ts,js}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00E89F',
          dark: '#00B57A',
          soft: '#E6FBF5'
        },
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#6C757D'
        },
        gold: {
          DEFAULT: '#FDB813',
          soft: '#FFF5D9'
        },
        danger: '#DC3545',
        surface: '#f2f1ec',
        paper: '#F8F9FA'
      },
      fontFamily: {
        display: ['Unbounded', 'system-ui', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        sm: '0 1px 2px rgb(26 26 26 / 8%)',
        md: '0 4px 12px rgb(26 26 26 / 10%)'
      }
    }
  }
}

export default config
