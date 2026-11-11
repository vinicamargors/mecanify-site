/** @type {import('tailwindcss').Config} */
const token = (nome) => `rgb(var(--c-${nome}) / <alpha-value>)`;

export default {
  content: ['./src/**/*.{astro,html,ts,md}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Geist Variable"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'monospace'],
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        muted: token('muted'),
        sunken: token('sunken'),
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        ink: { DEFAULT: token('ink'), muted: token('ink-muted'), subtle: token('ink-subtle') },
        brand: { DEFAULT: token('brand'), hover: token('brand-hover'), ink: token('brand-ink') },
        'on-brand': token('on-brand'),
      },
    },
  },
  plugins: [],
};
