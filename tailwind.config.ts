import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:    '#1C1917',
          card:  '#272320',
          gold:  '#C9912A',
          amber: '#d8a24d',
        },
      },
      fontFamily: {
        display:   ['var(--font-display)',   'serif'],
        body:      ['var(--font-body)',      'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
      },
    },
  },
} satisfies Config
