import type { Config } from 'tailwindcss';
import plugin from 'tailwindcss/plugin';

/**
 * tasteBuds design tokens. Components must use these names — never raw hex values.
 *
 * Palette sampled from the hand-drawn sketches: flat colour blocks plus outlines,
 * no shadows, no gradients.
 */
const palette = {
  /** App background, inactive pills, neutral avatar tiles. */
  cream: '#FFF4E1',
  /** Cards, bottom nav bar. */
  paper: '#FFFFFF',
  /** Primary actions, "+", active nav icon, urgent countdown pill, warning icon. */
  tomato: '#CF3737',
  /** Banners, active-tab background, urgent card outline, urgent avatar tile. */
  blush: '#FFCBCB',
  /** Inactive icons, nav labels, outlines, inactive chips, divider lines. */
  kraft: '#C9B084',
  /** Active filter chip, mint card outline. */
  leaf: '#379043',
  /** Hero/feature card fill. */
  mint: '#E8FFE2',
  /** Button inside mint cards (kraft outline). */
  sage: '#ABD49C',
};

/** Asymmetric radii so neighbouring shapes never share the exact same corners. */
const SKETCH_RADII = {
  '.sketch': { borderRadius: '26px 22px 28px 24px / 24px 28px 22px 26px' },
  '.sketch-2': { borderRadius: '22px 28px 24px 26px / 28px 22px 26px 24px' },
  '.sketch-3': { borderRadius: '28px 24px 22px 27px / 22px 26px 28px 23px' },
  '.sketch-4': { borderRadius: '24px 26px 27px 21px / 26px 23px 24px 28px' },
  /** Small tiles (avatars, stat tiles, nav squares). */
  '.sketch-sm': { borderRadius: '16px 13px 17px 14px / 14px 17px 13px 16px' },
  '.sketch-sm-2': { borderRadius: '13px 17px 14px 16px / 17px 13px 16px 14px' },
  /** Pills and chips: em-based so they scale with the text inside. */
  '.sketch-pill': { borderRadius: '1.3em 1.05em 1.25em 1.1em / 1.1em 1.3em 1.05em 1.25em' },
  '.sketch-pill-2': { borderRadius: '1.05em 1.3em 1.1em 1.25em / 1.25em 1.05em 1.3em 1.1em' },
  /** Hand-drawn circle (the "+" button, round avatars). */
  '.sketch-round': { borderRadius: '52% 48% 50% 47% / 48% 52% 47% 51%' },
};

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ...palette,
        // Text colours (unchanged): headings, body, secondary and muted copy.
        ink: { DEFAULT: '#3B2A20', soft: '#6B5545', muted: '#A08C7C' },
        // Bud illustration swatches. Only the Bud artwork uses these, never UI chrome.
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
          // Accessory and topper paints.
          saffron: '#F4A523',
          plum: '#6B3E75',
          'plum-light': '#EDE1F0',
          'leaf-dark': '#5AA63C',
        },
      },
      fontFamily: {
        // Custom hand-drawn faces (public/fonts, @font-face in src/index.css). Regular only.
        display: ['"TasteBuds Display"', 'Fredoka', 'system-ui', 'sans-serif'],
        body: ['"TasteBuds Hand"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        chunky: '1.5rem',
        blob: '2rem',
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
        breathe: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        wiggle: 'wiggle 1.2s ease-in-out infinite',
        shake: 'shake 0.3s ease-in-out infinite',
        breathe: 'breathe 1.6s ease-in-out infinite',
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, addBase, matchUtilities }) => {
      addUtilities(SKETCH_RADII);

      /*
       * Hand-drawn outlines: `edge-kraft`, `edge-blush`, `edge-tomato`, `edge-leaf`…
       * The stroke lives on ::before and runs through a gentle SVG displacement filter
       * (#tb-wobble, defined once in PhoneFrame), so the line wobbles but text never does.
       * Width: `edge-2` (2px) / default 2.5px / `edge-3` (3px). `edge-still` drops the wobble.
       */
      matchUtilities(
        {
          edge: (value: string) => ({
            '--edge-c': value,
            '&::before': {
              content: '""',
              position: 'absolute',
              inset: '0',
              borderRadius: 'inherit',
              border: 'var(--edge-w, 2.5px) solid var(--edge-c)',
              filter: 'var(--edge-filter, url(#tb-wobble))',
              pointerEvents: 'none',
            },
          }),
        },
        { values: palette, type: 'color' },
      );
      addUtilities({
        '.edge-2': { '--edge-w': '2px' },
        '.edge-3': { '--edge-w': '3px' },
        '.edge-still': { '--edge-filter': 'none' },
      });
      // An outlined element must be the containing block for its ::before stroke.
      // :where() keeps this at zero specificity so `absolute`/`fixed` still win.
      addBase({ ':where([class*="edge-"])': { position: 'relative' } });
    }),
  ],
} satisfies Config;
