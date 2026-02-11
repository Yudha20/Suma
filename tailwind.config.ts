import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        consoleBg: '#0b0f0d',
        consoleCard: '#131a16',
        consoleEdge: '#1c2a22',
        accent: '#3ad47f'
      },
      boxShadow: {
        console: '0 0 0 1px rgba(58,212,127,0.18), 0 18px 60px rgba(0,0,0,0.45)'
      },
      borderRadius: {
        console: '18px'
      }
    },
    spacing: {
      px: '1px',
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      5: '20px',
      6: '24px',
      7: '28px',
      8: '32px',
      9: '36px',
      10: '40px',
      12: '48px',
      14: '56px',
      16: '64px'
    }
  },
  plugins: []
};

export default config;
