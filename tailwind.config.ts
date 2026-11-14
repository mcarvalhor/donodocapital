import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0f1115',
          soft: '#1b1f27',
        },
        paper: {
          DEFAULT: '#fafaf8',
          soft: '#f1efe9',
        },
        capital: {
          DEFAULT: '#b8862f',
          soft: '#f3e3c3',
        },
        work: {
          DEFAULT: '#1f4b99',
          soft: '#dbe6f7',
        },
        danger: '#b3261e',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        serif: ['var(--font-source-serif)', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [typography],
};

export default config;
