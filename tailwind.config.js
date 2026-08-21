import plugin from 'tailwindcss/plugin';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zinc: {
          850: '#1C1C20',
          925: '#0C0C0D',
        },
        // ── CyberKhana palette tokens ──
        // Named colors = the exact hexes already in use, so nothing changes
        // visually. Use these (e.g. bg-base, text-fg, border-edge, bg-brand)
        // instead of hardcoded [#hex] values so shades can't drift.
        // Surfaces (dark navy, deepest → lightest)
        base: '#0d1117',
        deep: '#0a0f18',
        'base-alt': '#111622',
        panel: '#121a2a',
        surface: '#1a2332',
        'surface-alt': '#182130',
        'surface-hover': '#182235',
        inset: '#0e1522',
        // Borders / dividers
        edge: '#263248',
        'edge-soft': '#2a3346',
        'edge-strong': '#1e293b',
        'edge-light': '#354562',
        // Brand greens
        brand: '#00a859',
        'brand-neon': '#9fef00',
        'brand-deep': '#007a42',
        mint: '#34d399',
        // Semantic accents
        info: '#60a5fa',
        amber: '#f3a43a',
        danger: '#f43f5e',
        violet: '#a855f7',
        // Text (brightest → dimmest)
        fg: '#f3f6ff',
        'fg-soft': '#d2d7e3',
        muted: '#9aa5bf',
        'muted-alt': '#7d8aa5',
        dim: '#8390ac',
        faint: '#6e7a94',
        faintest: '#4d5a73',
      },
      spacing: {
        // Notch / home-indicator insets. Zero everywhere that has no cutout,
        // so these are safe to use unconditionally.
        safe: 'env(safe-area-inset-bottom, 0px)',
        'safe-t': 'env(safe-area-inset-top, 0px)',
      },
      minHeight: {
        // WCAG 2.2 target size (minimum) is 24px; Apple asks for 44pt and
        // Material for 48dp. 44 is the number that satisfies all three.
        tap: '44px',
      },
      minWidth: {
        tap: '44px',
      },
      animation: {
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      // Pointer type, not screen width. A tablet in landscape is wider than a
      // laptop but still gets fingers, and a phone in landscape is still a
      // phone — neither is something `md:` can tell you.
      addVariant('touch', '@media (pointer: coarse)');
      addVariant('fine', '@media (pointer: fine)');
    }),
  ],
}
