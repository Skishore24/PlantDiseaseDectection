/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────
        brand: {
          DEFAULT:  '#16A34A',  // Primary emerald green
          hover:    '#15803D',  // Hover / pressed
          light:    '#DCFCE7',  // Tinted badge fill, icon bg
          border:   '#BBF7D0',  // Tinted border
          muted:    '#86EFAC',  // Disabled / lighter accent
        },

        // ── Backgrounds ────────────────────────────────────────────────────
        bg: {
          DEFAULT:  '#F9FAFB',  // Page background
          subtle:   '#F3F4F6',  // Divider fills, tag bg
          overlay:  'rgba(17,24,39,0.5)', // Modal backdrops
        },

        // ── Surfaces ───────────────────────────────────────────────────────
        surface: '#FFFFFF', // Cards, sidebar, header

        // ── Borders ────────────────────────────────────────────────────────
        border: {
          DEFAULT:  '#E5E7EB',
          strong:   '#D1D5DB',
          focus:    '#16A34A',
        },

        // ── Text ───────────────────────────────────────────────────────────
        ink: {
          DEFAULT:  '#111827',  // Headings
          body:     '#374151',  // Body copy
          muted:    '#6B7280',  // Captions, metadata
          disabled: '#9CA3AF',  // Placeholders
          inverse:  '#FFFFFF',
        },

        // ── Semantic ───────────────────────────────────────────────────────
        success: {
          DEFAULT:  '#16A34A',
          bg:       '#DCFCE7',
          border:   '#BBF7D0',
          text:     '#14532D',
        },
        warning: {
          DEFAULT:  '#D97706',
          bg:       '#FEF3C7',
          border:   '#FDE68A',
          text:     '#78350F',
        },
        danger: {
          DEFAULT:  '#DC2626',
          bg:       '#FEE2E2',
          border:   '#FECACA',
          text:     '#7F1D1D',
        },
        info: {
          DEFAULT:  '#2563EB',
          bg:       '#EFF6FF',
          border:   '#BFDBFE',
          text:     '#1E3A8A',
        },
      },

      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'Menlo', 'Consolas', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '16px', fontWeight: '500' }],
        xs:    ['12px', { lineHeight: '18px' }],
        sm:    ['13px', { lineHeight: '20px' }],
        base:  ['14px', { lineHeight: '22px' }],
        md:    ['15px', { lineHeight: '24px' }],
        lg:    ['16px', { lineHeight: '24px' }],
        xl:    ['18px', { lineHeight: '28px' }],
        '2xl': ['20px', { lineHeight: '30px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
        '4xl': ['30px', { lineHeight: '38px' }],
        '5xl': ['36px', { lineHeight: '44px' }],
      },

      borderRadius: {
        sm:   '4px',
        DEFAULT: '6px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        full: '9999px',
      },

      boxShadow: {
        xs:   '0 1px 2px rgba(0,0,0,0.05)',
        sm:   '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        md:   '0 4px 6px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        lg:   '0 10px 15px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.03)',
        xl:   '0 20px 25px rgba(0,0,0,0.07), 0 8px 10px rgba(0,0,0,0.03)',
        brand: '0 0 0 3px rgba(22,163,74,0.2)',
        inner: 'inset 0 2px 4px rgba(0,0,0,0.04)',
      },

      spacing: {
        '13': '52px',
        '15': '60px',
        '18': '72px',
        '22': '88px',
        sidebar: '240px',
        header:  '64px',
      },

      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      transitionDuration: {
        fast:   '120ms',
        normal: '180ms',
        slow:   '300ms',
      },

      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'slide-in':   'slideIn 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },

      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
      },
    },
  },
  plugins: [],
}
