import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        bg0: 'var(--bg-0)',
        bg1: 'var(--bg-1)',
        surface0: 'var(--surface-0)',
        surface1: 'var(--surface-1)',
        surfaceSelected0: 'var(--surface-selected-0)',
        surfaceSelected1: 'var(--surface-selected-1)',
        text: 'var(--text)',
        'text-muted': 'var(--text-muted)',
        'text-dim': 'var(--text-dim)',
        accent: 'var(--accent)',
        'accent-glow': 'var(--accent-glow)',
        seam: 'var(--seam)',
        'stroke-soft': 'var(--stroke-soft)',
        'stroke-strong': 'var(--stroke-strong)'
      },
      borderRadius: {
        capsule: 'var(--r-capsule)',
        tile: 'var(--r-tile)',
        field: 'var(--r-field)',
        pill: 'var(--r-pill)'
      },
      boxShadow: {
        capsule:
          '0 20px 45px rgba(0,0,0,0.65), 0 2px 0 rgba(255,255,255,0.05) inset, 0 -1px 0 rgba(0,0,0,0.65) inset, 0 0 0 1px rgba(255,255,255,0.06) inset',
        'capsule-flat':
          '0 8px 18px rgba(0,0,0,0.40), 0 1px 0 rgba(255,255,255,0.04) inset, 0 0 0 1px rgba(255,255,255,0.06) inset',
        'inset-well':
          '0 8px 20px rgba(0,0,0,0.60) inset, 0 1px 0 rgba(255,255,255,0.04) inset',
        'btn-primary':
          '0 14px 28px rgba(0,0,0,0.55), 0 1px 0 rgba(255,255,255,0.05) inset, 0 0 0 1px rgba(255,255,255,0.06) inset',
        soft: '0 12px 24px rgba(0,0,0,0.32), 0 0 0 1px rgba(255,255,255,0.03)'
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
