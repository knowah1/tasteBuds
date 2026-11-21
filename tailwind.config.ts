import type { Config } from 'tailwindcss';

/**
 * tasteBuds design tokens. Components must use these names — never raw hex values.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: '#FFF8EE',
          50: '#FFFCF7',
          100: '#FFF8EE',
          200: '#FBEBD3',
          300: '#F3DAB5',
        },
        ink: { DEFAULT: '#3B2A20', soft: '#6B5545', muted: '#A08C7C' },
        mcgill: { DEFAULT: '#ED1B2F', dark: '#C41425', light: '#FDE3E5' },
        leaf: {
          50: '#F1F9EC',
          100: '#DFF1D3',
          200: '#BFE3A8',
          300: '#9AD27A',
          400: '#78BF55',
          500: '#5AA63C',
          600: '#46862E',
          700: '#356625',
        },
        tomato: { DEFAULT: '#E5533D', light: '#FCE3DE' },
        saffron: { DEFAULT: '#F4A523', light: '#FDF0D5' },
        eggplant: { DEFAULT: '#6B3E75', light: '#EDE1F0' },
        sky: { DEFAULT: '#7CC4E8', light: '#E2F3FB' },
        park: { DEFAULT: '#B9DE9A', dark: '#8FC46B' },
        road: { DEFAULT: '#F6E7CF', line: '#E8D2AE' },
        // Post-type accents
        learn: { DEFAULT: '#3E8ED0', light: '#E0EEFA' },
        teach: { DEFAULT: '#5AA63C', light: '#E3F3DA' },
        potluck: { DEFAULT: '#F4A523', light: '#FDF0D5' },
        emergency: { DEFAULT: '#ED1B2F', light: '#FDE3E5' },
        // Bud swatches
        bud: {
          leaf: '#78BF55',
          mint: '#7ED6B2',
          lime: '#B8D84A',
          sage: '#9DB88A',
          peach: '#F7B48A',
          rose: '#F49AB0',
          lilac: '#B9A3E3',
          sky: '#8EC9F0',
          butter: '#F6D96B',
          cocoa: '#B08467',
        },
      },
      fontFamily: {
        display: ['Fredoka', 'ui-rounded', 'system-ui', 'sans-serif'],
        sans: ['Nunito', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chunky: '1.5rem',
        blob: '2rem',
      },
      boxShadow: {
        soft: '0 4px 14px -4px rgba(59, 42, 32, 0.18)',
        lift: '0 10px 28px -8px rgba(59, 42, 32, 0.28)',
        chunky: '0 4px 0 0 rgba(59, 42, 32, 0.15)',
        press: '0 1px 0 0 rgba(59, 42, 32, 0.15)',
        phone: '0 30px 80px -20px rgba(59, 42, 32, 0.45)',
      },
      width: { phone: '390px' },
      height: { phone: '844px' },
      keyframes: {
        wiggle: {
          '0%, 100%': { transform: 'rotate(-3deg)' },
          '50%': { transform: 'rotate(3deg)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-2px)' },
          '75%': { transform: 'translateX(2px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        wiggle: 'wiggle 1.2s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config;
